"""
Tournament Engine Service

Centralized service for managing tournament brackets across multiple formats:
- Single Elimination
- Double Elimination
- Swiss System
- Round Robin
- Guaranteed Matches (ladder-style)

This service handles bracket generation, match scheduling, round progression,
and maintains bracket state with proper fighter rest intervals.
"""

from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.bracket_format import BracketFormat, TournamentFormat
from app.models.bracket_round import BracketRound, RoundStatus
from app.models.match import Match, MatchStatus, MatchResult
from app.models.player import Player
from app.models.entry import Entry
from app.models.event import Event
from app.models.weight_class import WeightClass
import math
import random


class TournamentEngine:
    """Main tournament engine for managing all bracket types"""

    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def calculate_match_count(format_type: TournamentFormat, num_participants: int, swiss_rounds: int = 3) -> int:
        """
        Calculate how many matches a format will generate.

        Args:
            format_type: Tournament format
            num_participants: Number of fighters
            swiss_rounds: Number of rounds for Swiss (default 3)

        Returns:
            Total number of matches
        """
        if num_participants < 2:
            return 0

        if format_type == TournamentFormat.SINGLE_ELIMINATION:
            # Single elim: n-1 matches
            return num_participants - 1

        elif format_type == TournamentFormat.DOUBLE_ELIMINATION:
            # Double elim: roughly 2n-2 matches (varies with byes)
            # More accurate: count winners bracket + losers bracket
            if num_participants < 8:
                return 0  # Not allowed
            winners_rounds = math.ceil(math.log2(num_participants))
            winners_matches = num_participants - 1
            losers_matches = num_participants - 2
            grand_finals = 1
            return winners_matches + losers_matches + grand_finals

        elif format_type == TournamentFormat.ROUND_ROBIN:
            # Round robin: n(n-1)/2 matches
            return (num_participants * (num_participants - 1)) // 2

        elif format_type == TournamentFormat.SWISS:
            # Swiss: (n/2) * rounds
            return (num_participants // 2) * swiss_rounds

        elif format_type == TournamentFormat.GUARANTEED_MATCHES:
            # Guaranteed matches: everyone gets swiss_rounds (matches per fighter)
            # Total matches = (num_participants * matches_per_fighter) / 2
            matches_per_fighter = swiss_rounds if swiss_rounds else 3
            return (num_participants * matches_per_fighter) // 2

        return 0

    @staticmethod
    def recommend_format(
        num_participants: int,
        min_matches: int = 15,
        max_matches: int = 20,
        match_duration_minutes: int = 10
    ) -> List[Dict]:
        """
        Recommend tournament formats based on participant count and target match range.

        Args:
            num_participants: Number of fighters
            min_matches: Minimum desired matches (default 15)
            max_matches: Maximum desired matches (default 20)
            match_duration_minutes: Expected match duration in minutes (default 10)

        Returns:
            List of recommendations with format, match count, time estimate, and reason
        """
        if num_participants < 2:
            return []

        recommendations = []

        # Calculate match counts for each format
        formats_to_check = [
            (TournamentFormat.ROUND_ROBIN, "Round Robin", None),
            (TournamentFormat.SINGLE_ELIMINATION, "Single Elimination", None),
            (TournamentFormat.SWISS, "Swiss (3 rounds)", 3),
            (TournamentFormat.GUARANTEED_MATCHES, "Guaranteed Matches (2 each)", 2),
            (TournamentFormat.GUARANTEED_MATCHES, "Guaranteed Matches (3 each)", 3),
        ]

        # Only include double-elim if we have enough fighters
        if num_participants >= 8:
            formats_to_check.insert(2, (TournamentFormat.DOUBLE_ELIMINATION, "Double Elimination", None))

        for format_type, format_name, swiss_rounds in formats_to_check:
            # For swiss, use swiss_rounds; for guaranteed_matches, use as match_count
            if format_type == TournamentFormat.SWISS:
                rounds = swiss_rounds
            elif format_type == TournamentFormat.GUARANTEED_MATCHES:
                rounds = swiss_rounds  # This represents matches per fighter for guaranteed_matches
            else:
                rounds = 3

            match_count = TournamentEngine.calculate_match_count(format_type, num_participants, rounds)

            # Skip if no matches
            if match_count == 0:
                continue

            # Calculate estimated event time with 2-minute gaps between matches
            # Formula: (matches × duration) + ((matches - 1) × 2-minute gap)
            # Simplified: matches × (duration + 2) - 2
            if match_count > 0:
                estimated_time_minutes = (match_count * (match_duration_minutes + 2)) - 2
            else:
                estimated_time_minutes = 0

            # Determine if this format is in range
            in_range = min_matches <= match_count <= max_matches

            # Calculate distance from range
            if match_count < min_matches:
                distance = min_matches - match_count
                range_status = "below"
            elif match_count > max_matches:
                distance = match_count - max_matches
                range_status = "above"
            else:
                distance = 0
                range_status = "ideal"

            # Determine recommendation reason
            if in_range:
                reason = f"✓ Within target range ({min_matches}-{max_matches})"
            elif match_count < min_matches:
                reason = f"{min_matches - match_count} fewer than minimum"
            else:
                reason = f"{match_count - max_matches} more than maximum"

            # Add special notes
            notes = []
            if format_type == TournamentFormat.ROUND_ROBIN:
                if num_participants > 6:
                    notes.append("may take too long")
                else:
                    notes.append("everyone fights everyone")
            elif format_type == TournamentFormat.DOUBLE_ELIMINATION:
                notes.append("2 losses to eliminate")
            elif format_type == TournamentFormat.SINGLE_ELIMINATION:
                notes.append("fast, 1 loss = out")
            elif format_type == TournamentFormat.SWISS:
                notes.append("balanced pairing")

            if notes:
                reason += f" - {', '.join(notes)}"

            # Calculate matches per fighter
            if format_type == TournamentFormat.ROUND_ROBIN:
                # Everyone fights everyone else once
                matches_per_fighter = num_participants - 1
            elif format_type == TournamentFormat.SINGLE_ELIMINATION:
                # Most get 1 match, winner gets log2(n) matches
                avg_matches = match_count / num_participants
                matches_per_fighter = round(avg_matches, 1)
            elif format_type == TournamentFormat.DOUBLE_ELIMINATION:
                # Most get 2 matches, winner gets more
                avg_matches = match_count / num_participants
                matches_per_fighter = round(avg_matches, 1)
            elif format_type == TournamentFormat.SWISS:
                # Everyone gets the same number of rounds
                matches_per_fighter = swiss_rounds
            elif format_type == TournamentFormat.GUARANTEED_MATCHES:
                # Everyone gets the same guaranteed number of matches
                matches_per_fighter = rounds  # rounds contains matches-per-fighter for this format
            else:
                matches_per_fighter = round(match_count / num_participants, 1)

            recommendations.append({
                "format": format_type.value,
                "format_name": format_name,
                "match_count": match_count,
                "matches_per_fighter": matches_per_fighter,
                "estimated_time_minutes": estimated_time_minutes,
                "estimated_time_display": f"{estimated_time_minutes // 60}h {estimated_time_minutes % 60}m" if estimated_time_minutes >= 60 else f"{estimated_time_minutes}m",
                "in_range": in_range,
                "range_status": range_status,
                "distance_from_range": distance,
                "reason": reason,
                "swiss_rounds": swiss_rounds if format_type == TournamentFormat.SWISS else None
            })

        # Sort by: in_range first, then by distance from range
        recommendations.sort(key=lambda x: (not x["in_range"], x["distance_from_range"]))

        return recommendations

    def create_bracket(
        self,
        event_id: int,
        weight_class_id: Optional[int],
        format_type: TournamentFormat,
        config: Optional[Dict] = None,
        min_rest_minutes: int = 30,
    ) -> BracketFormat:
        """
        Create a new bracket format for an event/weight class.

        Args:
            event_id: Event ID
            weight_class_id: Weight class ID (None for all fighters)
            format_type: Tournament format type
            config: Format-specific configuration
            min_rest_minutes: Minimum rest between matches for a fighter

        Returns:
            BracketFormat object
        """
        if config is None:
            config = {}

        bracket_format = BracketFormat(
            event_id=event_id,
            weight_class_id=weight_class_id,
            format_type=format_type,
            config=config,
            min_rest_minutes=min_rest_minutes,
            auto_generate=True,
            is_generated=False,
            is_finalized=False,
        )

        self.db.add(bracket_format)
        self.db.commit()
        self.db.refresh(bracket_format)

        return bracket_format

    def generate_bracket(self, bracket_format_id: int) -> List[BracketRound]:
        """
        Generate the initial bracket/rounds for a format.

        Args:
            bracket_format_id: BracketFormat ID

        Returns:
            List of created BracketRound objects
        """
        bracket_format = self.db.query(BracketFormat).filter(
            BracketFormat.id == bracket_format_id
        ).first()

        if not bracket_format:
            raise ValueError(f"BracketFormat {bracket_format_id} not found")

        if bracket_format.is_generated:
            raise ValueError(f"Bracket {bracket_format_id} already generated")

        # Get participants for this bracket
        participants = self._get_participants(
            bracket_format.event_id,
            bracket_format.weight_class_id
        )

        if len(participants) < 2:
            raise ValueError("Need at least 2 participants to generate a bracket")

        # Dispatch to format-specific generator
        if bracket_format.format_type == TournamentFormat.SINGLE_ELIMINATION:
            rounds = self._generate_single_elimination(bracket_format, participants)
        elif bracket_format.format_type == TournamentFormat.DOUBLE_ELIMINATION:
            rounds = self._generate_double_elimination(bracket_format, participants)
        elif bracket_format.format_type == TournamentFormat.SWISS:
            rounds = self._generate_swiss(bracket_format, participants)
        elif bracket_format.format_type == TournamentFormat.ROUND_ROBIN:
            rounds = self._generate_round_robin(bracket_format, participants)
        elif bracket_format.format_type == TournamentFormat.GUARANTEED_MATCHES:
            rounds = self._generate_guaranteed_matches(bracket_format, participants)
        else:
            raise ValueError(f"Unsupported format: {bracket_format.format_type}")

        # Mark bracket as generated
        bracket_format.is_generated = True
        self.db.commit()

        return rounds

    def _get_participants(
        self,
        event_id: int,
        weight_class_id: Optional[int]
    ) -> List[Player]:
        """
        Get list of participants for a bracket.

        Args:
            event_id: Event ID
            weight_class_id: Weight class ID (None for all)

        Returns:
            List of Player objects that are checked in
        """
        query = self.db.query(Player).join(Entry).filter(
            Entry.event_id == event_id,
            Entry.checked_in == True  # Only include fighters who are checked in
        )

        if weight_class_id:
            query = query.filter(Entry.weight_class_id == weight_class_id)

        participants = query.all()
        return participants

    def _generate_single_elimination(
        self,
        bracket_format: BracketFormat,
        participants: List[Player]
    ) -> List[BracketRound]:
        """
        Generate single elimination bracket.

        Creates a standard single-elimination tournament tree where:
        - Losers are eliminated immediately
        - Winners advance to next round
        - Number of rounds = ceil(log2(participants))
        - Byes are given to top seeds if participant count is not a power of 2
        """
        num_participants = len(participants)

        # Shuffle participants for random seeding (or use config for custom seeding)
        if bracket_format.config.get("seeding_method") == "random":
            random.shuffle(participants)

        # Calculate number of rounds needed
        num_rounds = math.ceil(math.log2(num_participants))

        # Build rounds data from first round to final
        # Round 1 has most matches, final round has 1 match
        rounds_data = []
        for round_num in range(1, num_rounds + 1):
            # Calculate matches for this round (halves each round)
            matches_in_round = 2 ** (num_rounds - round_num)

            # Assign round names based on distance from end
            rounds_from_end = num_rounds - round_num
            if rounds_from_end == 0:
                round_name = "Final"
            elif rounds_from_end == 1:
                round_name = "Semifinals"
            elif rounds_from_end == 2:
                round_name = "Quarterfinals"
            else:
                round_name = f"Round {round_num}"

            rounds_data.append({
                "round_number": round_num,
                "round_name": round_name,
                "matches_count": matches_in_round
            })

        # rounds_data is already in correct order (no reverse needed)

        # Create rounds and matches
        created_rounds = []
        previous_round_matches = []

        for round_info in rounds_data:
            # Create round
            bracket_round = BracketRound(
                bracket_format_id=bracket_format.id,
                round_number=round_info["round_number"],
                round_name=round_info["round_name"],
                status=RoundStatus.PENDING if round_info["round_number"] > 1 else RoundStatus.IN_PROGRESS,
                round_data={"format": "single_elimination"}
            )
            self.db.add(bracket_round)
            self.db.flush()  # Get ID

            # Create matches for this round
            current_round_matches = []

            if round_info["round_number"] == 1:
                # First round: assign participants
                # Calculate how many first-round matches we need
                # If we have 8 participants, we need 4 matches
                # If we have 6 participants, we need 3 matches (2 get byes)
                first_round_matches_needed = math.ceil(num_participants / 2)

                participant_idx = 0
                for match_num in range(first_round_matches_needed):
                    player_a = participants[participant_idx] if participant_idx < num_participants else None
                    participant_idx += 1
                    player_b = participants[participant_idx] if participant_idx < num_participants else None
                    participant_idx += 1

                    match = Match(
                        event_id=bracket_format.event_id,
                        bracket_round_id=bracket_round.id,
                        weight_class_id=bracket_format.weight_class_id,
                        a_player_id=player_a.id if player_a else None,
                        b_player_id=player_b.id if player_b else None,
                        match_number=match_num + 1,
                        match_status=MatchStatus.READY if (player_a and player_b) else MatchStatus.PENDING,
                        requires_winner_a=True,
                        requires_winner_b=True,
                    )
                    self.db.add(match)
                    current_round_matches.append(match)

                # Handle byes (participants who advance automatically)
                # If odd number of participants, last participant gets a bye
                num_byes = round_info["matches_count"] - first_round_matches_needed
                for bye_num in range(num_byes):
                    if participant_idx < num_participants:
                        # This participant gets a bye
                        bye_player = participants[participant_idx]
                        participant_idx += 1

                        # Create a "match" with only one participant (auto-win)
                        match = Match(
                            event_id=bracket_format.event_id,
                            bracket_round_id=bracket_round.id,
                            weight_class_id=bracket_format.weight_class_id,
                            a_player_id=bye_player.id,
                            b_player_id=None,
                            match_number=first_round_matches_needed + bye_num + 1,
                            match_status=MatchStatus.COMPLETED,
                            result=MatchResult.PLAYER_A_WIN,
                            method="Bye",
                            completed_at=datetime.utcnow(),
                            requires_winner_a=True,
                            requires_winner_b=True,
                        )
                        self.db.add(match)
                        current_round_matches.append(match)

            else:
                # Subsequent rounds: create TBD matches that depend on previous round
                for match_num in range(round_info["matches_count"]):
                    # This match depends on two matches from previous round
                    dep_a_idx = match_num * 2
                    dep_b_idx = match_num * 2 + 1

                    dep_match_a = previous_round_matches[dep_a_idx] if dep_a_idx < len(previous_round_matches) else None
                    dep_match_b = previous_round_matches[dep_b_idx] if dep_b_idx < len(previous_round_matches) else None

                    match = Match(
                        event_id=bracket_format.event_id,
                        bracket_round_id=bracket_round.id,
                        weight_class_id=bracket_format.weight_class_id,
                        a_player_id=None,  # TBD
                        b_player_id=None,  # TBD
                        match_number=match_num + 1,
                        match_status=MatchStatus.PENDING,
                        depends_on_match_a=dep_match_a.id if dep_match_a else None,
                        depends_on_match_b=dep_match_b.id if dep_match_b else None,
                        requires_winner_a=True,  # Single elim always takes winners
                        requires_winner_b=True,
                    )
                    self.db.add(match)
                    current_round_matches.append(match)

            self.db.flush()
            created_rounds.append(bracket_round)
            previous_round_matches = current_round_matches

        self.db.commit()

        # Propagate byes to next round
        self._propagate_byes(created_rounds[0])

        return created_rounds

    def _propagate_byes(self, first_round: BracketRound):
        """Propagate bye results to dependent matches"""
        bye_matches = self.db.query(Match).filter(
            Match.bracket_round_id == first_round.id,
            Match.result == MatchResult.PLAYER_A_WIN,
            Match.method == "Bye"
        ).all()

        for bye_match in bye_matches:
            self._propagate_result(bye_match)

    def _generate_double_elimination(
        self,
        bracket_format: BracketFormat,
        participants: List[Player]
    ) -> List[BracketRound]:
        """
        Generate complete double elimination bracket.

        Creates a double-elimination tournament with:
        - Winners bracket (standard single elimination)
        - Complete losers bracket structure
        - Grand finals (winners bracket winner vs losers bracket winner)

        Losers bracket structure:
        - Each winners round that completes feeds losers into losers bracket
        - Losers bracket alternates between "drop-down" rounds (receiving losers)
          and "advancement" rounds (losers bracket winners advancing)
        - Total losers rounds = 2 * (winners_rounds - 1)

        Minimum participants: 8 (to avoid multiple bye rounds for same fighter)
        """
        num_participants = len(participants)

        # Validate minimum participants
        if num_participants < 8:
            raise ValueError(
                f"Double-elimination requires at least 8 participants to avoid multiple byes for the same fighter. "
                f"Found {num_participants}. Consider using Round Robin or Swiss format instead."
            )

        if bracket_format.config.get("seeding_method") == "random":
            random.shuffle(participants)

        # Calculate rounds needed
        winners_rounds = math.ceil(math.log2(num_participants))
        total_losers_rounds = 2 * (winners_rounds - 1) if winners_rounds > 1 else 0

        created_rounds = []
        winners_matches_by_round = {}
        losers_matches_by_round = {}

        # === CREATE WINNERS BRACKET ===
        previous_round_matches = []

        for round_num in range(1, winners_rounds + 1):
            matches_in_round = 2 ** (winners_rounds - round_num)

            if round_num == winners_rounds:
                round_name = "Winners Finals"
            elif round_num == winners_rounds - 1:
                round_name = "Winners Semifinals"
            else:
                round_name = f"Winners Round {round_num}"

            bracket_round = BracketRound(
                bracket_format_id=bracket_format.id,
                round_number=round_num,
                round_name=round_name,
                bracket_type="winners",
                status=RoundStatus.IN_PROGRESS if round_num == 1 else RoundStatus.PENDING,
                round_data={"format": "double_elimination", "bracket": "winners"}
            )
            self.db.add(bracket_round)
            self.db.flush()

            current_round_matches = []

            if round_num == 1:
                # First round: assign participants
                first_round_matches_needed = math.ceil(num_participants / 2)
                participant_idx = 0

                for match_num in range(first_round_matches_needed):
                    player_a = participants[participant_idx] if participant_idx < num_participants else None
                    participant_idx += 1
                    player_b = participants[participant_idx] if participant_idx < num_participants else None
                    participant_idx += 1

                    match = Match(
                        event_id=bracket_format.event_id,
                        bracket_round_id=bracket_round.id,
                        weight_class_id=bracket_format.weight_class_id,
                        a_player_id=player_a.id if player_a else None,
                        b_player_id=player_b.id if player_b else None,
                        match_number=match_num + 1,
                        match_status=MatchStatus.READY if (player_a and player_b) else MatchStatus.PENDING,
                        requires_winner_a=True,
                        requires_winner_b=True,
                    )
                    self.db.add(match)
                    current_round_matches.append(match)

                # Handle byes
                num_byes = matches_in_round - first_round_matches_needed
                for bye_num in range(num_byes):
                    if participant_idx < num_participants:
                        bye_player = participants[participant_idx]
                        participant_idx += 1

                        match = Match(
                            event_id=bracket_format.event_id,
                            bracket_round_id=bracket_round.id,
                            weight_class_id=bracket_format.weight_class_id,
                            a_player_id=bye_player.id,
                            b_player_id=None,
                            match_number=first_round_matches_needed + bye_num + 1,
                            match_status=MatchStatus.COMPLETED,
                            result=MatchResult.PLAYER_A_WIN,
                            method="Bye",
                            completed_at=datetime.utcnow(),
                            requires_winner_a=True,
                            requires_winner_b=True,
                        )
                        self.db.add(match)
                        current_round_matches.append(match)
            else:
                # Subsequent winners rounds
                for match_num in range(matches_in_round):
                    dep_a_idx = match_num * 2
                    dep_b_idx = match_num * 2 + 1

                    dep_match_a = previous_round_matches[dep_a_idx] if dep_a_idx < len(previous_round_matches) else None
                    dep_match_b = previous_round_matches[dep_b_idx] if dep_b_idx < len(previous_round_matches) else None

                    match = Match(
                        event_id=bracket_format.event_id,
                        bracket_round_id=bracket_round.id,
                        weight_class_id=bracket_format.weight_class_id,
                        a_player_id=None,
                        b_player_id=None,
                        match_number=match_num + 1,
                        match_status=MatchStatus.PENDING,
                        depends_on_match_a=dep_match_a.id if dep_match_a else None,
                        depends_on_match_b=dep_match_b.id if dep_match_b else None,
                        requires_winner_a=True,
                        requires_winner_b=True,
                    )
                    self.db.add(match)
                    current_round_matches.append(match)

            self.db.flush()
            created_rounds.append(bracket_round)
            winners_matches_by_round[round_num] = current_round_matches
            previous_round_matches = current_round_matches

        # === CREATE COMPLETE LOSERS BRACKET ===
        if total_losers_rounds > 0:
            losers_previous_matches = []
            losers_round_counter = 1

            for winners_feed_round in range(1, winners_rounds):
                # Each winners round feeds into two losers rounds:
                # 1. Drop-down round: losers from this winners round play each other
                # 2. Advancement round: drop-down winners play winners from previous losers round

                # === DROP-DOWN ROUND ===
                losers_round_num = winners_rounds + losers_round_counter
                losers_round_counter += 1

                bracket_round = BracketRound(
                    bracket_format_id=bracket_format.id,
                    round_number=losers_round_num,
                    round_name=f"Losers Round {losers_round_num - winners_rounds}",
                    bracket_type="losers",
                    status=RoundStatus.PENDING,
                    round_data={
                        "format": "double_elimination",
                        "bracket": "losers",
                        "type": "drop_down",
                        "feeds_from_winners": winners_feed_round
                    }
                )
                self.db.add(bracket_round)
                self.db.flush()

                # Get losers from this winners round
                winners_matches = winners_matches_by_round.get(winners_feed_round, [])
                num_losers = len(winners_matches)

                # Drop-down round: pair losers from winners round
                current_round_matches = []
                for match_num in range(num_losers // 2):
                    dep_a_idx = match_num * 2
                    dep_b_idx = match_num * 2 + 1

                    dep_a = winners_matches[dep_a_idx] if dep_a_idx < len(winners_matches) else None
                    dep_b = winners_matches[dep_b_idx] if dep_b_idx < len(winners_matches) else None

                    match = Match(
                        event_id=bracket_format.event_id,
                        bracket_round_id=bracket_round.id,
                        weight_class_id=bracket_format.weight_class_id,
                        a_player_id=None,
                        b_player_id=None,
                        match_number=match_num + 1,
                        match_status=MatchStatus.PENDING,
                        depends_on_match_a=dep_a.id if dep_a else None,
                        depends_on_match_b=dep_b.id if dep_b else None,
                        requires_winner_a=False,  # Takes losers
                        requires_winner_b=False,
                    )
                    self.db.add(match)
                    current_round_matches.append(match)

                # Handle odd number of losers - one gets a bye
                if num_losers % 2 == 1:
                    bye_idx = num_losers - 1
                    bye_winner = winners_matches[bye_idx] if bye_idx < len(winners_matches) else None

                    if bye_winner:
                        bye_match = Match(
                            event_id=bracket_format.event_id,
                            bracket_round_id=bracket_round.id,
                            weight_class_id=bracket_format.weight_class_id,
                            a_player_id=None,
                            b_player_id=None,
                            match_number=(num_losers // 2) + 1,
                            match_status=MatchStatus.PENDING,
                            depends_on_match_a=bye_winner.id,
                            depends_on_match_b=None,
                            requires_winner_a=False,  # Takes loser
                            requires_winner_b=False,
                        )
                        self.db.add(bye_match)
                        current_round_matches.append(bye_match)

                self.db.flush()
                created_rounds.append(bracket_round)
                losers_matches_by_round[losers_round_num] = current_round_matches

                # === ADVANCEMENT ROUND ===
                # Winners from drop-down round play winners from previous losers round
                if losers_previous_matches:
                    losers_round_num = winners_rounds + losers_round_counter
                    losers_round_counter += 1

                    bracket_round = BracketRound(
                        bracket_format_id=bracket_format.id,
                        round_number=losers_round_num,
                        round_name=f"Losers Round {losers_round_num - winners_rounds}",
                        bracket_type="losers",
                        status=RoundStatus.PENDING,
                        round_data={
                            "format": "double_elimination",
                            "bracket": "losers",
                            "type": "advancement"
                        }
                    )
                    self.db.add(bracket_round)
                    self.db.flush()

                    advancement_matches = []

                    # Calculate correct number of advancement matches
                    # Total fighters = drop_down winners + previous round winners
                    # Number of matches = total fighters / 2 (rounded down)
                    total_fighters = len(current_round_matches) + len(losers_previous_matches)
                    num_advancement_matches = total_fighters // 2

                    # Create matches, alternating between drop-down and previous round
                    drop_down_idx = 0
                    previous_idx = 0

                    for match_num in range(num_advancement_matches):
                        # Assign from drop-down if available
                        drop_down_match = None
                        if drop_down_idx < len(current_round_matches):
                            drop_down_match = current_round_matches[drop_down_idx]
                            drop_down_idx += 1

                        # Assign from previous round if available
                        previous_match = None
                        if previous_idx < len(losers_previous_matches):
                            previous_match = losers_previous_matches[previous_idx]
                            previous_idx += 1

                        match = Match(
                            event_id=bracket_format.event_id,
                            bracket_round_id=bracket_round.id,
                            weight_class_id=bracket_format.weight_class_id,
                            a_player_id=None,
                            b_player_id=None,
                            match_number=match_num + 1,
                            match_status=MatchStatus.PENDING,
                            depends_on_match_a=drop_down_match.id if drop_down_match else None,
                            depends_on_match_b=previous_match.id if previous_match else None,
                            requires_winner_a=True,
                            requires_winner_b=True,
                        )
                        self.db.add(match)
                        advancement_matches.append(match)

                    # Handle odd number - one fighter gets a bye to next round
                    if total_fighters % 2 == 1:
                        # Determine who gets the bye (prefer from previous round to drop-down)
                        bye_match = None

                        if previous_idx < len(losers_previous_matches):
                            bye_match = losers_previous_matches[previous_idx]
                        elif drop_down_idx < len(current_round_matches):
                            bye_match = current_round_matches[drop_down_idx]

                        if bye_match:
                            # Create bye match for this fighter
                            bye = Match(
                                event_id=bracket_format.event_id,
                                bracket_round_id=bracket_round.id,
                                weight_class_id=bracket_format.weight_class_id,
                                a_player_id=None,
                                b_player_id=None,
                                match_number=num_advancement_matches + 1,
                                match_status=MatchStatus.PENDING,
                                depends_on_match_a=bye_match.id,
                                depends_on_match_b=None,
                                requires_winner_a=True,
                                requires_winner_b=False,
                            )
                            self.db.add(bye)
                            advancement_matches.append(bye)

                    self.db.flush()
                    created_rounds.append(bracket_round)
                    losers_matches_by_round[losers_round_num] = advancement_matches
                    current_round_matches = advancement_matches

                losers_previous_matches = current_round_matches

        # === CREATE GRAND FINALS ===
        grand_finals_round_num = winners_rounds + total_losers_rounds + 1
        grand_finals_round = BracketRound(
            bracket_format_id=bracket_format.id,
            round_number=grand_finals_round_num,
            round_name="Grand Finals",
            bracket_type="finals",
            status=RoundStatus.PENDING,
            round_data={"format": "double_elimination", "bracket": "finals"}
        )
        self.db.add(grand_finals_round)
        self.db.flush()

        # Grand finals: winners champion vs losers champion
        winners_final_match = winners_matches_by_round[winners_rounds][-1]
        losers_final_matches = losers_matches_by_round.get(winners_rounds + total_losers_rounds, [])
        losers_final_match = losers_final_matches[-1] if losers_final_matches else None

        grand_finals_match = Match(
            event_id=bracket_format.event_id,
            bracket_round_id=grand_finals_round.id,
            weight_class_id=bracket_format.weight_class_id,
            a_player_id=None,
            b_player_id=None,
            match_number=1,
            match_status=MatchStatus.PENDING,
            depends_on_match_a=winners_final_match.id,
            depends_on_match_b=losers_final_match.id if losers_final_match else None,
            requires_winner_a=True,
            requires_winner_b=True,
        )
        self.db.add(grand_finals_match)
        self.db.flush()

        created_rounds.append(grand_finals_round)

        self.db.commit()

        # Propagate byes
        if winners_matches_by_round.get(1):
            first_round = created_rounds[0]
            self._propagate_byes(first_round)

        return created_rounds

    def _generate_swiss(
        self,
        bracket_format: BracketFormat,
        participants: List[Player]
    ) -> List[BracketRound]:
        """
        Generate Swiss system tournament.

        Creates a Swiss-system tournament where:
        - Players are paired each round based on similar records
        - No player faces the same opponent twice
        - Number of rounds is configurable (default: ceil(log2(participants)))
        - Only first round is generated initially; subsequent rounds generated dynamically
        """
        num_participants = len(participants)

        # Get number of rounds from config, default to log2(participants)
        num_rounds = bracket_format.config.get("rounds", math.ceil(math.log2(num_participants)))

        if bracket_format.config.get("seeding_method") == "random":
            random.shuffle(participants)

        # Create only the first round initially
        # Subsequent rounds will be generated by _generate_next_round after each round completes

        bracket_round = BracketRound(
            bracket_format_id=bracket_format.id,
            round_number=1,
            round_name="Swiss Round 1",
            status=RoundStatus.IN_PROGRESS,
            round_data={
                "format": "swiss",
                "total_rounds": num_rounds,
                "pairing_method": bracket_format.config.get("pairing_method", "strength")
            }
        )
        self.db.add(bracket_round)
        self.db.flush()

        # Pair participants for first round
        # For first round, pair top half vs bottom half (or random)
        num_matches = num_participants // 2

        for match_num in range(num_matches):
            player_a_idx = match_num
            player_b_idx = num_participants - 1 - match_num

            match = Match(
                event_id=bracket_format.event_id,
                bracket_round_id=bracket_round.id,
                weight_class_id=bracket_format.weight_class_id,
                a_player_id=participants[player_a_idx].id,
                b_player_id=participants[player_b_idx].id,
                match_number=match_num + 1,
                match_status=MatchStatus.READY,
                requires_winner_a=True,
                requires_winner_b=True,
            )
            self.db.add(match)

        # Handle odd number of participants (one gets a bye)
        if num_participants % 2 == 1:
            bye_player = participants[-1]
            match = Match(
                event_id=bracket_format.event_id,
                bracket_round_id=bracket_round.id,
                weight_class_id=bracket_format.weight_class_id,
                a_player_id=bye_player.id,
                b_player_id=None,
                match_number=num_matches + 1,
                match_status=MatchStatus.COMPLETED,
                result=MatchResult.PLAYER_A_WIN,
                method="Bye",
                completed_at=datetime.utcnow(),
                requires_winner_a=True,
                requires_winner_b=True,
            )
            self.db.add(match)

        self.db.commit()

        return [bracket_round]

    def _generate_round_robin(
        self,
        bracket_format: BracketFormat,
        participants: List[Player]
    ) -> List[BracketRound]:
        """
        Generate round robin tournament.

        Creates a round-robin tournament where:
        - Every participant plays every other participant once
        - Total matches = n * (n - 1) / 2
        - Can be organized into rounds for better scheduling
        """
        num_participants = len(participants)

        # Use round-robin algorithm to create pairings
        # We'll organize matches into rounds to minimize waiting
        rounds = []

        if num_participants % 2 == 1:
            # Add a "bye" slot for odd number of participants
            participants = participants + [None]
            num_participants += 1

        # Round robin algorithm (circle method)
        # Fix one participant, rotate others
        num_rounds = num_participants - 1
        matches_per_round = num_participants // 2

        for round_num in range(1, num_rounds + 1):
            bracket_round = BracketRound(
                bracket_format_id=bracket_format.id,
                round_number=round_num,
                round_name=f"Round {round_num}",
                status=RoundStatus.IN_PROGRESS if round_num == 1 else RoundStatus.PENDING,
                round_data={"format": "round_robin"}
            )
            self.db.add(bracket_round)
            self.db.flush()

            # Create matches for this round
            for match_num in range(matches_per_round):
                if match_num == 0:
                    # First match: fixed participant vs opposite side
                    player_a_idx = 0
                    player_b_idx = num_participants - 1
                else:
                    # Other matches: pairs from rotation
                    player_a_idx = match_num
                    player_b_idx = num_participants - 1 - match_num

                player_a = participants[player_a_idx]
                player_b = participants[player_b_idx]

                # Skip if either is None (bye)
                if player_a and player_b:
                    match = Match(
                        event_id=bracket_format.event_id,
                        bracket_round_id=bracket_round.id,
                        weight_class_id=bracket_format.weight_class_id,
                        a_player_id=player_a.id,
                        b_player_id=player_b.id,
                        match_number=match_num + 1,
                        match_status=MatchStatus.READY if round_num == 1 else MatchStatus.PENDING,
                        requires_winner_a=True,
                        requires_winner_b=True,
                    )
                    self.db.add(match)

            self.db.flush()
            rounds.append(bracket_round)

            # Rotate participants (except the first one)
            participants = [participants[0]] + [participants[-1]] + participants[1:-1]

        self.db.commit()

        return rounds

    def _generate_guaranteed_matches(
        self,
        bracket_format: BracketFormat,
        participants: List[Player]
    ) -> List[BracketRound]:
        """
        Generate guaranteed matches format (ladder-style).

        Creates a ladder-style tournament where:
        - Each participant is guaranteed a specific number of matches
        - Pairings are made based on current records (similar to Swiss)
        - No elimination - everyone competes in all rounds
        - Allows rematches up to a configurable limit
        """
        num_participants = len(participants)

        # Get configuration
        match_count = bracket_format.config.get("match_count", 3)  # Default: 3 matches per fighter
        max_rematches = bracket_format.config.get("max_rematches", 1)  # Allow one rematch by default

        if bracket_format.config.get("seeding_method") == "random":
            random.shuffle(participants)

        # Create first round only (subsequent rounds generated dynamically)
        bracket_round = BracketRound(
            bracket_format_id=bracket_format.id,
            round_number=1,
            round_name="Round 1",
            status=RoundStatus.IN_PROGRESS,
            round_data={
                "format": "guaranteed_matches",
                "total_matches_per_fighter": match_count,
                "max_rematches": max_rematches
            }
        )
        self.db.add(bracket_round)
        self.db.flush()

        # Use weight-aware pairing if weight_class_id is None (multi-weight bracket)
        # Otherwise use simple pairing
        use_weight_pairing = bracket_format.weight_class_id is None and bracket_format.config.get("weight_based_pairing", True)

        if use_weight_pairing:
            # Create initial standings (everyone 0-0-0 for first round)
            initial_standings = {
                p.id: {"wins": 0, "losses": 0, "draws": 0, "points": 0.0, "opponents_faced": set()}
                for p in participants
            }
            matchup_history = {}

            # Get weight-aware pairings
            pairings = self._weight_aware_guaranteed_pairing(
                initial_standings,
                matchup_history,
                max_rematches,
                bracket_format
            )

            # Create matches from pairings
            for idx, (player_a_id, player_b_id, weight_class_id) in enumerate(pairings):
                if player_b_id:
                    # Regular match
                    match = Match(
                        event_id=bracket_format.event_id,
                        bracket_round_id=bracket_round.id,
                        weight_class_id=weight_class_id,
                        a_player_id=player_a_id,
                        b_player_id=player_b_id,
                        match_number=idx + 1,
                        match_status=MatchStatus.READY,
                        requires_winner_a=True,
                        requires_winner_b=True,
                    )
                else:
                    # Bye match
                    match = Match(
                        event_id=bracket_format.event_id,
                        bracket_round_id=bracket_round.id,
                        weight_class_id=weight_class_id,
                        a_player_id=player_a_id,
                        b_player_id=None,
                        match_number=idx + 1,
                        match_status=MatchStatus.COMPLETED,
                        result=MatchResult.PLAYER_A_WIN,
                        method="Bye",
                        completed_at=datetime.utcnow(),
                        requires_winner_a=True,
                        requires_winner_b=True,
                    )
                self.db.add(match)
        else:
            # Simple pairing for single weight class brackets
            num_matches = num_participants // 2

            for match_num in range(num_matches):
                player_a = participants[match_num * 2]
                player_b = participants[match_num * 2 + 1]

                match = Match(
                    event_id=bracket_format.event_id,
                    bracket_round_id=bracket_round.id,
                    weight_class_id=bracket_format.weight_class_id,
                    a_player_id=player_a.id,
                    b_player_id=player_b.id,
                    match_number=match_num + 1,
                    match_status=MatchStatus.READY,
                    requires_winner_a=True,
                    requires_winner_b=True,
                )
                self.db.add(match)

            # Handle odd number of participants (bye in first round)
            if num_participants % 2 == 1:
                bye_player = participants[-1]
                match = Match(
                    event_id=bracket_format.event_id,
                    bracket_round_id=bracket_round.id,
                    weight_class_id=bracket_format.weight_class_id,
                    a_player_id=bye_player.id,
                    b_player_id=None,
                    match_number=num_matches + 1,
                    match_status=MatchStatus.COMPLETED,
                    result=MatchResult.PLAYER_A_WIN,
                    method="Bye",
                    completed_at=datetime.utcnow(),
                    requires_winner_a=True,
                    requires_winner_b=True,
                )
                self.db.add(match)

        self.db.commit()

        return [bracket_round]

    def update_match_result(
        self,
        match_id: int,
        result: MatchResult,
        method: Optional[str] = None,
        duration_seconds: Optional[int] = None
    ) -> Match:
        """
        Update match result and propagate to dependent matches.

        Args:
            match_id: Match ID
            result: Match result
            method: Submission method or "draw"
            duration_seconds: Match duration

        Returns:
            Updated Match object
        """
        match = self.db.query(Match).filter(Match.id == match_id).first()

        if not match:
            raise ValueError(f"Match {match_id} not found")

        # Update result
        match.result = result
        match.method = method
        match.duration_seconds = duration_seconds
        match.match_status = MatchStatus.COMPLETED
        match.completed_at = datetime.utcnow()

        self.db.commit()

        # Propagate winner/loser to dependent matches
        self._propagate_result(match)

        # Check if round is complete
        if match.bracket_round_id:
            self._check_round_completion(match.bracket_round_id)

        return match

    def _propagate_result(self, match: Match):
        """
        Propagate match result to dependent matches in bracket.

        Args:
            match: Completed match
        """
        if not match.result or match.result == MatchResult.NO_CONTEST:
            return

        # Find matches that depend on this match
        dependent_matches = self.db.query(Match).filter(
            or_(
                Match.depends_on_match_a == match.id,
                Match.depends_on_match_b == match.id
            )
        ).all()

        # Determine winner and loser
        if match.result == MatchResult.PLAYER_A_WIN:
            winner_id = match.a_player_id
            loser_id = match.b_player_id
        elif match.result == MatchResult.PLAYER_B_WIN:
            winner_id = match.b_player_id
            loser_id = match.a_player_id
        else:  # Draw - handle based on format
            winner_id = None
            loser_id = None

        bye_matches_completed = []

        for dep_match in dependent_matches:
            # Update player A if this match feeds player A
            if dep_match.depends_on_match_a == match.id:
                if dep_match.requires_winner_a and winner_id:
                    dep_match.a_player_id = winner_id
                elif not dep_match.requires_winner_a and loser_id:
                    dep_match.a_player_id = loser_id

            # Update player B if this match feeds player B
            if dep_match.depends_on_match_b == match.id:
                if dep_match.requires_winner_b and winner_id:
                    dep_match.b_player_id = winner_id
                elif not dep_match.requires_winner_b and loser_id:
                    dep_match.b_player_id = loser_id

            # Check if match is ready to play
            # Regular match: needs both players
            # Bye match: only needs player A (requires_winner_b = False)
            if dep_match.a_player_id and (dep_match.b_player_id or not dep_match.requires_winner_b):
                if dep_match.b_player_id:
                    # Regular match with both players
                    dep_match.match_status = MatchStatus.READY
                else:
                    # Bye match - auto-complete immediately
                    dep_match.match_status = MatchStatus.COMPLETED
                    dep_match.result = MatchResult.PLAYER_A_WIN
                    dep_match.method = "Bye"
                    dep_match.duration_seconds = 0
                    dep_match.completed_at = datetime.utcnow()
                    bye_matches_completed.append(dep_match)

        self.db.commit()

        # Propagate results for any bye matches that were auto-completed
        for bye_match in bye_matches_completed:
            self._propagate_result(bye_match)

        # Activate any pending rounds that now have ready matches
        self._activate_pending_rounds_with_ready_matches(match.event_id)

    def _activate_pending_rounds_with_ready_matches(self, event_id: int):
        """Check if any PENDING rounds have READY matches and activate them."""
        from app.models.bracket_format import BracketFormat

        # Find all brackets for this event
        brackets = self.db.query(BracketFormat).filter(
            BracketFormat.event_id == event_id
        ).all()

        for bracket in brackets:
            # Find PENDING rounds
            pending_rounds = self.db.query(BracketRound).filter(
                BracketRound.bracket_format_id == bracket.id,
                BracketRound.status == RoundStatus.PENDING
            ).all()

            for round in pending_rounds:
                # Check if any matches in this round are READY
                ready_matches = self.db.query(Match).filter(
                    Match.bracket_round_id == round.id,
                    Match.match_status == MatchStatus.READY
                ).count()

                if ready_matches > 0:
                    round.status = RoundStatus.IN_PROGRESS

            self.db.commit()

    def _check_round_completion(self, bracket_round_id: int):
        """
        Check if a round is complete and update status.

        Args:
            bracket_round_id: BracketRound ID
        """
        bracket_round = self.db.query(BracketRound).filter(
            BracketRound.id == bracket_round_id
        ).first()

        if not bracket_round:
            return

        # Get all matches in this round
        matches = self.db.query(Match).filter(
            Match.bracket_round_id == bracket_round_id
        ).all()

        if not matches:
            return

        # Check if all matches are completed
        all_complete = all(m.match_status == MatchStatus.COMPLETED for m in matches)

        if all_complete:
            bracket_round.status = RoundStatus.COMPLETED
            bracket_round.completed_at = datetime.utcnow()
            self.db.commit()

            # If auto-generate is enabled, generate next round
            if bracket_round.bracket_format.auto_generate:
                self._generate_next_round(bracket_round)

    def _generate_next_round(self, completed_round: BracketRound):
        """
        Generate the next round after a round completes.

        Args:
            completed_round: The completed BracketRound
        """
        bracket_format = completed_round.bracket_format

        # Check if we should generate next round
        if not bracket_format.auto_generate:
            return

        # Route to format-specific next round generation
        if bracket_format.format_type == TournamentFormat.SWISS:
            self._generate_next_swiss_round(completed_round)
        elif bracket_format.format_type == TournamentFormat.GUARANTEED_MATCHES:
            self._generate_next_guaranteed_round(completed_round)
        elif bracket_format.format_type == TournamentFormat.DOUBLE_ELIMINATION:
            self._generate_next_double_elim_round(completed_round)
        elif bracket_format.format_type == TournamentFormat.ROUND_ROBIN:
            self._generate_next_round_robin_round(completed_round)
        # Single elimination generates all rounds upfront and activates via dependencies

    def _generate_next_swiss_round(self, completed_round: BracketRound):
        """
        Generate the next Swiss round based on standings.

        Args:
            completed_round: The completed BracketRound
        """
        bracket_format = completed_round.bracket_format
        round_data = completed_round.round_data or {}
        total_rounds = round_data.get("total_rounds", 5)

        # Check if we've reached the final round
        if completed_round.round_number >= total_rounds:
            bracket_format.is_finalized = True
            self.db.commit()
            return

        # Calculate current standings
        standings = self._calculate_swiss_standings(bracket_format.id)

        # Get all players who have competed
        all_player_ids = set()
        for player_id, record in standings.items():
            all_player_ids.add(player_id)

        # Track who has faced whom to avoid rematches
        matchup_history = self._get_matchup_history(bracket_format.id)

        # Pair players by similar records
        pairings = self._swiss_pairing(standings, matchup_history)

        if not pairings:
            # No valid pairings possible, end tournament
            bracket_format.is_finalized = True
            self.db.commit()
            return

        # Create next round
        next_round_num = completed_round.round_number + 1
        next_round = BracketRound(
            bracket_format_id=bracket_format.id,
            round_number=next_round_num,
            round_name=f"Swiss Round {next_round_num}",
            status=RoundStatus.IN_PROGRESS,
            round_data={
                "format": "swiss",
                "total_rounds": total_rounds,
                "standings": standings
            }
        )
        self.db.add(next_round)
        self.db.flush()

        # Create matches from pairings
        for idx, (player_a_id, player_b_id) in enumerate(pairings):
            match = Match(
                event_id=bracket_format.event_id,
                bracket_round_id=next_round.id,
                weight_class_id=bracket_format.weight_class_id,
                a_player_id=player_a_id,
                b_player_id=player_b_id if player_b_id else None,  # None = bye
                match_number=idx + 1,
                match_status=MatchStatus.READY if player_b_id else MatchStatus.COMPLETED,
                result=MatchResult.PLAYER_A_WIN if not player_b_id else None,
                method="Bye" if not player_b_id else None,
                completed_at=datetime.utcnow() if not player_b_id else None,
            )
            self.db.add(match)

        self.db.commit()

    def _calculate_swiss_standings(self, bracket_format_id: int) -> Dict[int, Dict]:
        """
        Calculate current standings for a Swiss tournament.

        Returns:
            Dict mapping player_id to {wins, losses, draws, points, opponents_faced}
        """
        standings = {}

        # Get all matches for this bracket
        matches = self.db.query(Match).join(BracketRound).filter(
            BracketRound.bracket_format_id == bracket_format_id,
            Match.result.isnot(None)
        ).all()

        for match in matches:
            # Initialize standings for both players
            if match.a_player_id and match.a_player_id not in standings:
                standings[match.a_player_id] = {
                    "wins": 0, "losses": 0, "draws": 0,
                    "points": 0.0, "opponents_faced": set()
                }

            if match.b_player_id and match.b_player_id not in standings:
                standings[match.b_player_id] = {
                    "wins": 0, "losses": 0, "draws": 0,
                    "points": 0.0, "opponents_faced": set()
                }

            # Update records
            if match.result == MatchResult.PLAYER_A_WIN:
                if match.a_player_id:
                    standings[match.a_player_id]["wins"] += 1
                    standings[match.a_player_id]["points"] += 1.0
                if match.b_player_id:
                    standings[match.b_player_id]["losses"] += 1
                    standings[match.a_player_id]["opponents_faced"].add(match.b_player_id)
                    standings[match.b_player_id]["opponents_faced"].add(match.a_player_id)

            elif match.result == MatchResult.PLAYER_B_WIN:
                if match.b_player_id:
                    standings[match.b_player_id]["wins"] += 1
                    standings[match.b_player_id]["points"] += 1.0
                if match.a_player_id:
                    standings[match.a_player_id]["losses"] += 1
                    standings[match.a_player_id]["opponents_faced"].add(match.b_player_id)
                    standings[match.b_player_id]["opponents_faced"].add(match.a_player_id)

            elif match.result == MatchResult.DRAW:
                if match.a_player_id:
                    standings[match.a_player_id]["draws"] += 1
                    standings[match.a_player_id]["points"] += 0.5
                if match.b_player_id:
                    standings[match.b_player_id]["draws"] += 1
                    standings[match.b_player_id]["points"] += 0.5
                    if match.a_player_id and match.b_player_id:
                        standings[match.a_player_id]["opponents_faced"].add(match.b_player_id)
                        standings[match.b_player_id]["opponents_faced"].add(match.a_player_id)

        return standings

    def _get_matchup_history(self, bracket_format_id: int) -> Dict[int, set]:
        """
        Get history of who has faced whom in this bracket.

        Returns:
            Dict mapping player_id to set of opponent player_ids
        """
        history = {}

        matches = self.db.query(Match).join(BracketRound).filter(
            BracketRound.bracket_format_id == bracket_format_id
        ).all()

        for match in matches:
            if match.a_player_id and match.b_player_id:
                if match.a_player_id not in history:
                    history[match.a_player_id] = set()
                if match.b_player_id not in history:
                    history[match.b_player_id] = set()

                history[match.a_player_id].add(match.b_player_id)
                history[match.b_player_id].add(match.a_player_id)

        return history

    def _swiss_pairing(
        self,
        standings: Dict[int, Dict],
        matchup_history: Dict[int, set]
    ) -> List[Tuple[int, Optional[int]]]:
        """
        Create pairings for next Swiss round.

        Uses strength-based pairing: pair players with similar records.
        Avoids rematches when possible.

        Returns:
            List of (player_a_id, player_b_id) tuples (player_b_id may be None for bye)
        """
        # Sort players by points (descending), then wins
        sorted_players = sorted(
            standings.items(),
            key=lambda x: (x[1]["points"], x[1]["wins"]),
            reverse=True
        )

        player_ids = [p[0] for p in sorted_players]
        paired = set()
        pairings = []

        for i, player_id in enumerate(player_ids):
            if player_id in paired:
                continue

            # Find best opponent: similar record, haven't faced before
            opponent_id = None
            for j in range(i + 1, len(player_ids)):
                candidate = player_ids[j]
                if candidate in paired:
                    continue

                # Check if they've faced before
                if candidate not in matchup_history.get(player_id, set()):
                    opponent_id = candidate
                    break

            # If no valid opponent found due to rematch constraints,
            # relax constraint and pair with closest available
            if opponent_id is None:
                for j in range(i + 1, len(player_ids)):
                    candidate = player_ids[j]
                    if candidate not in paired:
                        opponent_id = candidate
                        break

            if opponent_id:
                pairings.append((player_id, opponent_id))
                paired.add(player_id)
                paired.add(opponent_id)
            else:
                # Odd number of players, this player gets a bye
                pairings.append((player_id, None))
                paired.add(player_id)

        return pairings

    def _generate_next_round_robin_round(self, completed_round: BracketRound):
        """
        Activate the next round in a round robin tournament.

        Round robin tournaments have all rounds pre-created during initial
        bracket generation. This function activates the next pending round.
        """
        bracket_format = completed_round.bracket_format

        # Find the next pending round
        next_round = self.db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket_format.id,
            BracketRound.status == RoundStatus.PENDING
        ).order_by(BracketRound.round_number).first()

        if not next_round:
            # No more rounds - finalize bracket
            bracket_format.is_finalized = True
            self.db.commit()
            return

        # Activate the next round
        next_round.status = RoundStatus.IN_PROGRESS

        # Activate all matches in this round
        matches = self.db.query(Match).filter(
            Match.bracket_round_id == next_round.id
        ).all()

        for match in matches:
            if match.match_status == MatchStatus.PENDING:
                match.match_status = MatchStatus.READY

        self.db.commit()

    def _generate_next_guaranteed_round(self, completed_round: BracketRound):
        """
        Generate next round for guaranteed matches format.

        Ensures each player reaches their guaranteed match count.
        Pairs fighters based on similar records (Swiss-style) while
        respecting rematch limits.
        """
        bracket_format = completed_round.bracket_format
        round_data = completed_round.round_data or {}

        # Get config
        target_matches_per_fighter = round_data.get("total_matches_per_fighter", 3)
        max_rematches = round_data.get("max_rematches", 1)

        # Calculate current match counts for each fighter
        match_counts = self._calculate_match_counts(bracket_format.id)
        matchup_history = self._get_matchup_history(bracket_format.id)

        # Find fighters who need more matches
        fighters_needing_matches = [
            player_id for player_id, count in match_counts.items()
            if count < target_matches_per_fighter
        ]

        if not fighters_needing_matches:
            # All fighters have reached their guaranteed matches
            bracket_format.is_finalized = True
            self.db.commit()
            return

        # Get standings for pairing
        standings = self._calculate_swiss_standings(bracket_format.id)

        # Filter to only include fighters who need matches
        filtered_standings = {
            pid: data for pid, data in standings.items()
            if pid in fighters_needing_matches
        }

        # Create pairings with rematch limit consideration
        # Use weight-aware pairing if this is a multi-weight bracket
        use_weight_pairing = bracket_format.weight_class_id is None and bracket_format.config.get("weight_based_pairing", True)

        if use_weight_pairing:
            pairings = self._weight_aware_guaranteed_pairing(
                filtered_standings,
                matchup_history,
                max_rematches,
                bracket_format
            )
        else:
            pairings = self._guaranteed_pairing(
                filtered_standings,
                matchup_history,
                max_rematches
            )
            # Add None for weight_class_id to match format
            pairings = [(p[0], p[1], bracket_format.weight_class_id) for p in pairings]

        if not pairings:
            # No valid pairings possible (shouldn't happen with rematch limits)
            bracket_format.is_finalized = True
            self.db.commit()
            return

        # Create next round
        next_round_num = completed_round.round_number + 1
        next_round = BracketRound(
            bracket_format_id=bracket_format.id,
            round_number=next_round_num,
            round_name=f"Round {next_round_num}",
            status=RoundStatus.IN_PROGRESS,
            round_data=round_data
        )
        self.db.add(next_round)
        self.db.flush()

        # Create matches from pairings
        for idx, (player_a_id, player_b_id, weight_class_id) in enumerate(pairings):
            match = Match(
                event_id=bracket_format.event_id,
                bracket_round_id=next_round.id,
                weight_class_id=weight_class_id,
                a_player_id=player_a_id,
                b_player_id=player_b_id if player_b_id else None,
                match_number=idx + 1,
                match_status=MatchStatus.READY if player_b_id else MatchStatus.COMPLETED,
                result=MatchResult.PLAYER_A_WIN if not player_b_id else None,
                method="Bye" if not player_b_id else None,
                completed_at=datetime.utcnow() if not player_b_id else None,
                requires_winner_a=True,
                requires_winner_b=True,
            )
            self.db.add(match)

        self.db.commit()

    def _calculate_match_counts(self, bracket_format_id: int) -> Dict[int, int]:
        """
        Count how many matches each fighter has completed in this bracket.

        Args:
            bracket_format_id: BracketFormat ID

        Returns:
            Dict mapping player_id to match count
        """
        counts = {}

        # Get all completed matches for this bracket
        matches = self.db.query(Match).join(BracketRound).filter(
            BracketRound.bracket_format_id == bracket_format_id,
            Match.match_status == MatchStatus.COMPLETED
        ).all()

        for match in matches:
            if match.a_player_id:
                counts[match.a_player_id] = counts.get(match.a_player_id, 0) + 1
            if match.b_player_id:
                counts[match.b_player_id] = counts.get(match.b_player_id, 0) + 1

        return counts

    def _guaranteed_pairing(
        self,
        standings: Dict[int, Dict],
        matchup_history: Dict[int, set],
        max_rematches: int
    ) -> List[Tuple[int, Optional[int]]]:
        """
        Create pairings for guaranteed matches format.

        Similar to Swiss pairing but allows controlled rematches up to max_rematches.
        Pairs fighters with similar records when possible.

        Args:
            standings: Current standings {player_id: {wins, losses, draws, points}}
            matchup_history: History of who has faced whom {player_id: set of opponent_ids}
            max_rematches: Maximum number of times two fighters can face each other

        Returns:
            List of (player_a_id, player_b_id) tuples (player_b_id may be None for bye)
        """
        # Count how many times each pair has faced each other
        rematch_counts = {}
        for p1 in standings:
            for p2 in matchup_history.get(p1, set()):
                # Create a consistent key (smaller ID first)
                pair = tuple(sorted([p1, p2]))
                rematch_counts[pair] = rematch_counts.get(pair, 0) + 1

        # Sort players by record (points desc, then wins desc)
        sorted_players = sorted(
            standings.items(),
            key=lambda x: (x[1]["points"], x[1]["wins"]),
            reverse=True
        )

        player_ids = [p[0] for p in sorted_players]
        paired = set()
        pairings = []

        for i, player_id in enumerate(player_ids):
            if player_id in paired:
                continue

            # Find best available opponent
            opponent_id = None

            # First pass: try to find opponent within rematch limit
            for j in range(i + 1, len(player_ids)):
                candidate = player_ids[j]
                if candidate in paired:
                    continue

                # Check rematch count
                pair = tuple(sorted([player_id, candidate]))
                rematch_count = rematch_counts.get(pair, 0)

                if rematch_count < max_rematches:
                    opponent_id = candidate
                    break

            # Second pass: if no valid opponent found, take first available
            # (This allows exceeding rematch limit as last resort)
            if opponent_id is None:
                for j in range(i + 1, len(player_ids)):
                    candidate = player_ids[j]
                    if candidate not in paired:
                        opponent_id = candidate
                        break

            if opponent_id:
                pairings.append((player_id, opponent_id))
                paired.add(player_id)
                paired.add(opponent_id)
            else:
                # Odd number of players remaining, this player gets a bye
                pairings.append((player_id, None))
                paired.add(player_id)

        return pairings

    def _weight_aware_guaranteed_pairing(
        self,
        standings: Dict[int, Dict],
        matchup_history: Dict[int, set],
        max_rematches: int,
        bracket_format: BracketFormat
    ) -> List[Tuple[int, Optional[int], Optional[int]]]:
        """
        Create pairings for guaranteed matches format with weight-based constraints.

        Prefers same weight-class opponents before considering cross-class options,
        while still respecting rematch limits and weight-gap rules.

        Weight rules:
        - Lightweight/Middleweight (including cross-class): Must be within 30 lbs
        - Heavyweight vs heavyweight: No weight cap (any heavyweight vs heavyweight allowed)
        - Heavyweight vs non-heavyweight: Allowed only if within 30 lbs of each other
        - No fallback: Do not exceed the applicable weight gap; issue a bye if no legal opponent

        Pairing priority:
        1. Same weight class + within rematch limit
        2. Cross weight class + within rematch limit
        3. Same weight class + rematch limit exceeded
        4. Cross weight class + rematch limit exceeded

        Match weight class: Assigned to heavier fighter's weight class

        Args:
            standings: Current standings {player_id: {wins, losses, draws, points}}
            matchup_history: History of who has faced whom {player_id: set of opponent_ids}
            max_rematches: Maximum number of times two fighters can face each other
            bracket_format: Bracket format for querying player data

        Returns:
            List of (player_a_id, player_b_id, weight_class_id) tuples
            player_b_id may be None for bye, weight_class_id is for the match
        """
        # Get player weights, weight classes, and ELO from database
        player_data = {}
        for player_id in standings.keys():
            player = self.db.query(Player).filter(Player.id == player_id).first()
            if player:
                # Get weight class from entry
                entry = self.db.query(Entry).filter(
                    Entry.player_id == player_id,
                    Entry.event_id == bracket_format.event_id
                ).first()

                player_data[player_id] = {
                    'weight': player.weight or 0,
                    'weight_class_id': entry.weight_class_id if entry else None,
                    'elo': player.elo_rating or 1500
                }

        # Count how many times each pair has faced each other
        rematch_counts = {}
        for p1 in standings:
            for p2 in matchup_history.get(p1, set()):
                pair = tuple(sorted([p1, p2]))
                rematch_counts[pair] = rematch_counts.get(pair, 0) + 1

        # Sort players by record (points desc, wins desc, then ELO desc)
        # ELO as tertiary sort creates competitive matchups (similar skill levels)
        sorted_players = sorted(
            standings.items(),
            key=lambda x: (
                x[1]["points"],
                x[1]["wins"],
                player_data.get(x[0], {}).get('elo', 1500)
            ),
            reverse=True
        )

        player_ids = [p[0] for p in sorted_players]
        paired = set()
        pairings = []

        def get_weight_limit(weight1: float, weight2: float) -> float:
            """Determine weight limit based on fighter weights

            Rules:
            - Heavy vs Heavy (both >200): No limit - any heavyweight can fight any heavyweight
            - Heavy vs Non-heavy: 30 lb limit - only allows if within 30 lbs
              (e.g., a 205 lb fighter can face a 175 lb fighter, but a 250 lb cannot)
            - Non-heavy vs Non-heavy: 30 lb limit
            """
            is_heavy1 = weight1 > 200
            is_heavy2 = weight2 > 200

            if is_heavy1 and is_heavy2:
                return float("inf")  # Heavyweights can fight any other heavyweight
            else:
                return 30.0  # All other combinations: 30 lb limit

        def is_valid_weight_match(p1_id: int, p2_id: int) -> bool:
            """Check if two fighters are within acceptable weight range"""
            w1 = player_data.get(p1_id, {}).get('weight', 0)
            w2 = player_data.get(p2_id, {}).get('weight', 0)

            if w1 == 0 or w2 == 0:
                return True  # Allow if weight unknown

            weight_diff = abs(w1 - w2)
            limit = get_weight_limit(w1, w2)
            return weight_diff <= limit

        def get_match_weight_class(p1_id: int, p2_id: int) -> Optional[int]:
            """Get weight class for match based on heavier fighter"""
            w1 = player_data.get(p1_id, {}).get('weight', 0)
            w2 = player_data.get(p2_id, {}).get('weight', 0)

            # Assign to heavier fighter's weight class
            if w1 >= w2:
                return player_data.get(p1_id, {}).get('weight_class_id')
            else:
                return player_data.get(p2_id, {}).get('weight_class_id')

        def same_weight_class(p1_id: int, p2_id: int) -> bool:
            """Check if two fighters are in the same weight class"""
            wc1 = player_data.get(p1_id, {}).get('weight_class_id')
            wc2 = player_data.get(p2_id, {}).get('weight_class_id')
            return wc1 is not None and wc1 == wc2

        for i, player_id in enumerate(player_ids):
            if player_id in paired:
                continue

            opponent_id = None

            # Pass 1: Same weight class, within rematch limit and valid weight gap
            for j in range(i + 1, len(player_ids)):
                candidate = player_ids[j]
                if candidate in paired:
                    continue
                if not same_weight_class(player_id, candidate):
                    continue
                if not is_valid_weight_match(player_id, candidate):
                    continue
                pair = tuple(sorted([player_id, candidate]))
                if rematch_counts.get(pair, 0) < max_rematches:
                    opponent_id = candidate
                    break

            # Pass 2: Cross weight class, within rematch limit but still weight legal
            if opponent_id is None:
                for j in range(i + 1, len(player_ids)):
                    candidate = player_ids[j]
                    if candidate in paired:
                        continue
                    if same_weight_class(player_id, candidate):
                        continue
                    if not is_valid_weight_match(player_id, candidate):
                        continue
                    pair = tuple(sorted([player_id, candidate]))
                    if rematch_counts.get(pair, 0) < max_rematches:
                        opponent_id = candidate
                        break

            # Pass 3: Same weight class, weight legal even if rematch limit exceeded
            if opponent_id is None:
                for j in range(i + 1, len(player_ids)):
                    candidate = player_ids[j]
                    if candidate in paired:
                        continue
                    if not same_weight_class(player_id, candidate):
                        continue
                    if not is_valid_weight_match(player_id, candidate):
                        continue
                    opponent_id = candidate
                    break

            # Pass 4: Cross weight class, weight legal even if rematch limit exceeded
            if opponent_id is None:
                for j in range(i + 1, len(player_ids)):
                    candidate = player_ids[j]
                    if candidate in paired:
                        continue
                    if same_weight_class(player_id, candidate):
                        continue
                    if not is_valid_weight_match(player_id, candidate):
                        continue
                    opponent_id = candidate
                    break

            # No fallback - never exceed weight limits (fighter gets bye instead)

            if opponent_id:
                weight_class_id = get_match_weight_class(player_id, opponent_id)
                pairings.append((player_id, opponent_id, weight_class_id))
                paired.add(player_id)
                paired.add(opponent_id)
            else:
                # Odd number of players, this player gets a bye
                weight_class_id = player_data.get(player_id, {}).get('weight_class_id')
                pairings.append((player_id, None, weight_class_id))
                paired.add(player_id)

        return pairings

    def _generate_next_double_elim_round(self, completed_round: BracketRound):
        """
        Activate next round(s) for double elimination.

        When winners bracket rounds complete:
        - Activate next winners round if dependencies satisfied
        - Activate drop-down losers rounds fed by that winners round

        When losers bracket rounds complete:
        - Activate advancement rounds whose dependencies are now satisfied

        Always check if grand finals should activate.

        All rounds (except R1) are pre-created as PENDING during initial
        bracket generation. This function activates them at the right time.
        """
        bracket_format = completed_round.bracket_format

        if completed_round.bracket_type == "winners":
            # Winners round completed - activate next winners round
            self._activate_next_winners_round(bracket_format)
            # Also activate corresponding drop-down losers rounds
            self._activate_losers_drop_down_rounds(completed_round)

        elif completed_round.bracket_type == "losers":
            # Losers round completed - activate any advancement rounds now ready
            self._activate_losers_advancement_rounds(bracket_format)

            # Check if this was the losers finals and assign winner to grand finals
            self._assign_losers_champion_to_finals(completed_round)

        # Always check if grand finals should activate
        self._check_grand_finals_activation(bracket_format)

    def _activate_next_winners_round(self, bracket_format: BracketFormat):
        """
        Activate the next pending winners round if all dependencies are satisfied.
        """
        # Find next pending winners round
        next_winners_round = self.db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket_format.id,
            BracketRound.bracket_type == "winners",
            BracketRound.status == RoundStatus.PENDING
        ).order_by(BracketRound.round_number).first()

        if not next_winners_round:
            return

        # Check if all matches in this round have both players assigned
        matches = self.db.query(Match).filter(
            Match.bracket_round_id == next_winners_round.id
        ).all()

        if matches and all(m.a_player_id and m.b_player_id for m in matches):
            # All players assigned - activate the round
            next_winners_round.status = RoundStatus.IN_PROGRESS

            # Mark all matches as ready
            for match in matches:
                if match.match_status == MatchStatus.PENDING:
                    match.match_status = MatchStatus.READY

            self.db.commit()

    def _activate_losers_drop_down_rounds(self, completed_winners_round: BracketRound):
        """
        Activate drop-down losers rounds fed by a completed winners round.

        Drop-down rounds pair losers from a winners round against each other.
        They can activate as soon as the feeding winners round completes.
        """
        bracket_format = completed_winners_round.bracket_format
        winners_round_num = completed_winners_round.round_number

        # Find drop-down losers rounds fed by this winners round
        losers_rounds = self.db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket_format.id,
            BracketRound.bracket_type == "losers",
            BracketRound.status == RoundStatus.PENDING
        ).all()

        for losers_round in losers_rounds:
            round_data = losers_round.round_data or {}

            # Only activate drop-down rounds fed by this winners round
            if (round_data.get("type") == "drop_down" and
                round_data.get("feeds_from_winners") == winners_round_num):

                losers_round.status = RoundStatus.IN_PROGRESS

                # Activate any matches that are now ready
                self._activate_ready_matches(losers_round.id)

        self.db.commit()

    def _activate_losers_advancement_rounds(self, bracket_format: BracketFormat):
        """
        Activate advancement losers rounds whose dependencies are satisfied.

        Advancement rounds pair drop-down winners against previous losers round winners.
        They activate when both sets of players are available.
        """
        # Find all pending advancement rounds
        losers_rounds = self.db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket_format.id,
            BracketRound.bracket_type == "losers",
            BracketRound.status == RoundStatus.PENDING
        ).all()

        for losers_round in losers_rounds:
            round_data = losers_round.round_data or {}

            # Only check advancement rounds
            if round_data.get("type") == "advancement":
                # Check if all matches in this round have both players assigned
                matches = self.db.query(Match).filter(
                    Match.bracket_round_id == losers_round.id
                ).all()

                if matches and all(m.a_player_id and m.b_player_id for m in matches):
                    # All players assigned - activate the round
                    losers_round.status = RoundStatus.IN_PROGRESS

                    # Mark all matches as ready
                    for match in matches:
                        if match.match_status == MatchStatus.PENDING:
                            match.match_status = MatchStatus.READY

        self.db.commit()

    def _assign_losers_champion_to_finals(self, completed_losers_round: BracketRound):
        """
        Assign the losers bracket champion to the grand finals match.

        This handles cases where the grand finals match wasn't properly linked
        to the losers finals match during bracket generation.
        """
        bracket_format = completed_losers_round.bracket_format

        # Check if there are any more pending losers rounds
        pending_losers = self.db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket_format.id,
            BracketRound.bracket_type == "losers",
            BracketRound.status != RoundStatus.COMPLETED
        ).count()

        if pending_losers > 0:
            # Not the losers finals yet
            return

        # This is the losers finals - find the winner
        matches = self.db.query(Match).filter(
            Match.bracket_round_id == completed_losers_round.id,
            Match.match_status == MatchStatus.COMPLETED
        ).all()

        if not matches:
            return

        # Get the winner from the last match (losers finals)
        losers_champion_match = matches[-1]

        if losers_champion_match.result == MatchResult.PLAYER_A_WIN:
            losers_champion = losers_champion_match.a_player_id
        elif losers_champion_match.result == MatchResult.PLAYER_B_WIN:
            losers_champion = losers_champion_match.b_player_id
        else:
            # Draw or no contest - can't determine champion
            return

        # Find grand finals match and assign losers champion
        grand_finals = self.db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket_format.id,
            BracketRound.bracket_type == "finals"
        ).first()

        if not grand_finals:
            return

        gf_matches = self.db.query(Match).filter(
            Match.bracket_round_id == grand_finals.id
        ).all()

        for match in gf_matches:
            # Assign losers champion to the slot that doesn't have the winners champion
            if match.a_player_id and not match.b_player_id:
                match.b_player_id = losers_champion
            elif match.b_player_id and not match.a_player_id:
                match.a_player_id = losers_champion

            # Mark as ready if both players now assigned
            if (match.a_player_id and match.b_player_id and
                match.match_status == MatchStatus.PENDING):
                match.match_status = MatchStatus.READY

        self.db.commit()

    def _check_grand_finals_activation(self, bracket_format: BracketFormat):
        """
        Activate grand finals when both finalists are determined.
        """
        # Find grand finals round
        grand_finals = self.db.query(BracketRound).filter(
            BracketRound.bracket_format_id == bracket_format.id,
            BracketRound.bracket_type == "finals",
            BracketRound.status == RoundStatus.PENDING
        ).first()

        if not grand_finals:
            return

        # Check if the grand finals match has both players
        matches = self.db.query(Match).filter(
            Match.bracket_round_id == grand_finals.id
        ).all()

        if matches and all(m.a_player_id and m.b_player_id for m in matches):
            grand_finals.status = RoundStatus.IN_PROGRESS

            for match in matches:
                if match.match_status == MatchStatus.PENDING:
                    match.match_status = MatchStatus.READY

        self.db.commit()

    def _activate_ready_matches(self, bracket_round_id: int):
        """
        Activate matches in a round that have both players assigned (or bye matches).
        """
        from datetime import datetime

        matches = self.db.query(Match).filter(
            Match.bracket_round_id == bracket_round_id
        ).all()

        bye_matches_completed = []

        for match in matches:
            if match.match_status == MatchStatus.PENDING and match.a_player_id:
                # Regular match: both players assigned
                if match.b_player_id:
                    match.match_status = MatchStatus.READY
                # Bye match: only player_a, and doesn't require player_b
                elif not match.requires_winner_b:
                    # Auto-complete bye matches
                    match.match_status = MatchStatus.COMPLETED
                    match.result = MatchResult.PLAYER_A_WIN
                    match.method = "Bye"
                    match.duration_seconds = 0
                    match.completed_at = datetime.utcnow()
                    bye_matches_completed.append(match)

        self.db.commit()

        # Propagate bye match results to dependent matches
        for bye_match in bye_matches_completed:
            self._propagate_result(bye_match)

    def get_upcoming_matches(
        self,
        bracket_format_id: int,
        limit: int = 10
    ) -> List[Match]:
        """
        Get upcoming matches for a bracket, respecting rest intervals.

        Args:
            bracket_format_id: BracketFormat ID
            limit: Maximum number of matches to return

        Returns:
            List of Match objects ready to be fought
        """
        bracket_format = self.db.query(BracketFormat).filter(
            BracketFormat.id == bracket_format_id
        ).first()

        if not bracket_format:
            return []

        # Get all ready matches
        ready_matches = self.db.query(Match).join(BracketRound).filter(
            BracketRound.bracket_format_id == bracket_format_id,
            Match.match_status == MatchStatus.READY
        ).all()

        # Filter out matches where fighters haven't rested enough
        available_matches = []
        min_rest = timedelta(minutes=bracket_format.min_rest_minutes)

        for match in ready_matches:
            if self._can_fighters_compete(match, min_rest):
                available_matches.append(match)

        return available_matches[:limit]

    def _can_fighters_compete(
        self,
        match: Match,
        min_rest: timedelta
    ) -> bool:
        """
        Check if both fighters have rested enough to compete.

        Args:
            match: Match to check
            min_rest: Minimum rest duration

        Returns:
            True if both fighters can compete
        """
        if not match.a_player_id or not match.b_player_id:
            return False

        # Get most recent completed matches for both fighters
        recent_a = self.db.query(Match).filter(
            or_(
                Match.a_player_id == match.a_player_id,
                Match.b_player_id == match.a_player_id
            ),
            Match.match_status == MatchStatus.COMPLETED,
            Match.completed_at.isnot(None)
        ).order_by(Match.completed_at.desc()).first()

        recent_b = self.db.query(Match).filter(
            or_(
                Match.a_player_id == match.b_player_id,
                Match.b_player_id == match.b_player_id
            ),
            Match.match_status == MatchStatus.COMPLETED,
            Match.completed_at.isnot(None)
        ).order_by(Match.completed_at.desc()).first()

        now = datetime.utcnow()

        # Check if player A has rested enough
        if recent_a and recent_a.completed_at:
            time_since_a = now - recent_a.completed_at
            if time_since_a < min_rest:
                return False

        # Check if player B has rested enough
        if recent_b and recent_b.completed_at:
            time_since_b = now - recent_b.completed_at
            if time_since_b < min_rest:
                return False

        return True
