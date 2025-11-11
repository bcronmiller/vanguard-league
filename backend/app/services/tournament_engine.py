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
            List of Player objects
        """
        query = self.db.query(Player).join(Entry).filter(
            Entry.event_id == event_id
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

        # Calculate matches per round (working backwards from final)
        # Final = 1 match, Semi = 2, Quarter = 4, etc.
        rounds_data = []
        for round_num in range(num_rounds, 0, -1):
            matches_in_round = 2 ** (round_num - 1)

            if round_num == num_rounds:
                round_name = "Final"
            elif round_num == num_rounds - 1:
                round_name = "Semifinals"
            elif round_num == num_rounds - 2:
                round_name = "Quarterfinals"
            else:
                round_name = f"Round {num_rounds - round_num + 1}"

            rounds_data.append({
                "round_number": num_rounds - round_num + 1,
                "round_name": round_name,
                "matches_count": matches_in_round
            })

        rounds_data.reverse()  # Start with round 1

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
        Generate double elimination bracket.

        Creates a double-elimination tournament with:
        - Winners bracket (standard single elimination)
        - Losers bracket (fed by losers from winners bracket)
        - Grand finals (winners bracket winner vs losers bracket winner)
        - Optional bracket reset if specified in config
        """
        num_participants = len(participants)

        if bracket_format.config.get("seeding_method") == "random":
            random.shuffle(participants)

        # Calculate rounds needed
        winners_rounds = math.ceil(math.log2(num_participants))

        created_rounds = []
        winners_matches_by_round = {}  # Track winners bracket matches by round
        losers_matches_by_round = {}   # Track losers bracket matches by round

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
                # First round: assign participants (same as single elim)
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

        # === CREATE LOSERS BRACKET ===
        # Losers bracket has roughly 2*(winners_rounds - 1) rounds
        # Simplified: create losers rounds that receive losers from winners bracket
        losers_round_num = winners_rounds + 1
        losers_previous_matches = []

        # First losers round receives losers from winners round 1
        losers_bracket_round = BracketRound(
            bracket_format_id=bracket_format.id,
            round_number=losers_round_num,
            round_name="Losers Round 1",
            bracket_type="losers",
            status=RoundStatus.PENDING,
            round_data={"format": "double_elimination", "bracket": "losers"}
        )
        self.db.add(losers_bracket_round)
        self.db.flush()

        # Create matches for first losers round
        # These matches receive losers from winners round 1
        winners_r1_matches = winners_matches_by_round.get(1, [])
        losers_r1_match_count = len(winners_r1_matches) // 2

        losers_r1_matches = []
        for match_num in range(losers_r1_match_count):
            dep_a_idx = match_num * 2
            dep_b_idx = match_num * 2 + 1

            dep_a = winners_r1_matches[dep_a_idx] if dep_a_idx < len(winners_r1_matches) else None
            dep_b = winners_r1_matches[dep_b_idx] if dep_b_idx < len(winners_r1_matches) else None

            match = Match(
                event_id=bracket_format.event_id,
                bracket_round_id=losers_bracket_round.id,
                weight_class_id=bracket_format.weight_class_id,
                a_player_id=None,  # Will be filled by loser from winners
                b_player_id=None,
                match_number=match_num + 1,
                match_status=MatchStatus.PENDING,
                depends_on_match_a=dep_a.id if dep_a else None,
                depends_on_match_b=dep_b.id if dep_b else None,
                requires_winner_a=False,  # Takes losers
                requires_winner_b=False,
            )
            self.db.add(match)
            losers_r1_matches.append(match)

        self.db.flush()
        created_rounds.append(losers_bracket_round)
        losers_matches_by_round[losers_round_num] = losers_r1_matches

        # === CREATE GRAND FINALS ===
        grand_finals_round_num = losers_round_num + 1
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

        # Grand finals match: winner of winners bracket vs winner of losers bracket
        winners_final_match = winners_matches_by_round[winners_rounds][-1]  # Last match in winners bracket
        losers_final_match = losers_r1_matches[-1] if losers_r1_matches else None  # Simplified

        grand_finals_match = Match(
            event_id=bracket_format.event_id,
            bracket_round_id=grand_finals_round.id,
            weight_class_id=bracket_format.weight_class_id,
            a_player_id=None,  # Winner from winners bracket
            b_player_id=None,  # Winner from losers bracket
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

        # Pair participants for first round (random or by seed)
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

            # If both players are now known, mark match as ready
            if dep_match.a_player_id and dep_match.b_player_id:
                dep_match.match_status = MatchStatus.READY

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
        # Format-specific logic for next round generation
        # To be implemented per format
        pass

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
