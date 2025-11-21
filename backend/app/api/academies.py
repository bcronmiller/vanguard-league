import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Player
from sqlalchemy import text

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/academies")
async def get_all_academies(db: Session = Depends(get_db)):
    """Get all academies with their fighter rosters (including non-competing academies)."""

    # Get all active fighters
    fighters = db.query(Player).filter(Player.active == True).all()

    # Belt rank starting ELO
    belt_elo = {
        'White': 1200,
        'Blue': 1400,
        'Purple': 1600,
        'Brown': 1800,
        'Black': 2000
    }

    # Get match counts for all fighters
    from sqlalchemy import func
    from app.models.match import Match

    match_counts = {}
    match_results = db.query(
        Match.a_player_id.label('player_id'),
        func.count(Match.id).label('match_count')
    ).filter(Match.a_player_id.isnot(None)).group_by(Match.a_player_id).all()

    for result in match_results:
        match_counts[result.player_id] = result.match_count

    match_results_b = db.query(
        Match.b_player_id.label('player_id'),
        func.count(Match.id).label('match_count')
    ).filter(Match.b_player_id.isnot(None)).group_by(Match.b_player_id).all()

    for result in match_results_b:
        if result.player_id in match_counts:
            match_counts[result.player_id] += result.match_count
        else:
            match_counts[result.player_id] = result.match_count

    # Group by academy
    academy_data = {}
    for fighter in fighters:
        if not fighter.academy:
            continue

        academy = fighter.academy
        if academy not in academy_data:
            academy_data[academy] = {
                'fighters': [],
                'total_elo_change': 0,
                'total_matches': 0
            }

        starting_elo = belt_elo.get(fighter.bjj_belt_rank, 1400)
        elo_change = fighter.elo_rating - starting_elo
        fighter_matches = match_counts.get(fighter.id, 0)

        academy_data[academy]['fighters'].append({
            'id': fighter.id,
            'name': fighter.name,
            'belt_rank': fighter.bjj_belt_rank,
            'elo_rating': fighter.elo_rating,
            'elo_change': round(elo_change, 2),
            'photo_url': fighter.photo_url,
            'match_count': fighter_matches
        })
        academy_data[academy]['total_elo_change'] += elo_change
        academy_data[academy]['total_matches'] += fighter_matches

    # Build academy list (include ALL academies, even non-competing)
    academies = []
    for academy_name, data in academy_data.items():
        fighter_count = len(data['fighters'])
        avg_elo_change = data['total_elo_change'] / fighter_count if fighter_count > 0 else 0

        # Sort fighters by ELO change descending
        data['fighters'].sort(key=lambda x: x['elo_change'], reverse=True)

        academies.append({
            'academy_name': academy_name,
            'fighter_count': fighter_count,
            'avg_elo_change': round(avg_elo_change, 2),
            'total_elo_change': round(data['total_elo_change'], 2),
            'total_matches': data['total_matches'],
            'fighters': data['fighters'],
            'logo_url': None,
            'website': None
        })

    # Get academy logos
    try:
        result = db.execute(text("SELECT name, logo_url, website FROM academies"))
        for row in result:
            for academy in academies:
                if academy['academy_name'] == row[0]:
                    academy['logo_url'] = row[1]
                    academy['website'] = row[2]
    except Exception as e:
        logger.warning(f"Failed to fetch academy metadata: {e}")

    # Sort alphabetically
    academies.sort(key=lambda x: x['academy_name'])

    return {
        'academies': academies,
        'total_academies': len(academies)
    }

@router.get("/academies/rankings")
async def get_academy_rankings(db: Session = Depends(get_db)):
    """Get academy rankings based on average ELO change per fighter."""

    # Get all active fighters
    fighters = db.query(Player).filter(Player.active == True).all()

    # Belt rank starting ELO
    belt_elo = {
        'White': 1200,
        'Blue': 1400,
        'Purple': 1600,
        'Brown': 1800,
        'Black': 2000
    }

    # Get match counts for all fighters
    from sqlalchemy import func
    from app.models.match import Match

    match_counts = {}
    match_results = db.query(
        Match.a_player_id.label('player_id'),
        func.count(Match.id).label('match_count')
    ).filter(Match.a_player_id.isnot(None)).group_by(Match.a_player_id).all()

    for result in match_results:
        match_counts[result.player_id] = result.match_count

    match_results_b = db.query(
        Match.b_player_id.label('player_id'),
        func.count(Match.id).label('match_count')
    ).filter(Match.b_player_id.isnot(None)).group_by(Match.b_player_id).all()

    for result in match_results_b:
        if result.player_id in match_counts:
            match_counts[result.player_id] += result.match_count
        else:
            match_counts[result.player_id] = result.match_count

    # Group by academy
    academy_data = {}
    for fighter in fighters:
        if not fighter.academy:
            continue

        academy = fighter.academy
        if academy not in academy_data:
            academy_data[academy] = {
                'fighters': [],
                'total_elo_change': 0,
                'total_matches': 0
            }

        starting_elo = belt_elo.get(fighter.bjj_belt_rank, 1400)
        elo_change = fighter.elo_rating - starting_elo
        fighter_matches = match_counts.get(fighter.id, 0)

        academy_data[academy]['fighters'].append({
            'id': fighter.id,
            'name': fighter.name,
            'belt_rank': fighter.bjj_belt_rank,
            'elo_rating': fighter.elo_rating,
            'elo_change': round(elo_change, 2),
            'photo_url': fighter.photo_url,
            'match_count': fighter_matches
        })
        academy_data[academy]['total_elo_change'] += elo_change
        academy_data[academy]['total_matches'] += fighter_matches
    
    # Build academy list
    academies = []
    for academy_name, data in academy_data.items():
        fighter_count = len(data['fighters'])

        # Calculate average ELO change of ONLY climbers (positive ELO change)
        climbers = [f for f in data['fighters'] if f['elo_change'] > 0]
        climber_count = len(climbers)
        avg_climber_elo = sum(f['elo_change'] for f in climbers) / climber_count if climber_count > 0 else 0

        # Skip academies where NO fighters have competed at all (all have 0.0 ELO change)
        has_competed = any(abs(f['elo_change']) > 0.01 for f in data['fighters'])
        if not has_competed:
            continue

        # Sort fighters by ELO change descending
        data['fighters'].sort(key=lambda x: x['elo_change'], reverse=True)

        academies.append({
            'academy_name': academy_name,
            'fighter_count': fighter_count,
            'climber_count': climber_count,
            'avg_elo_change': round(avg_climber_elo, 2),
            'total_elo_change': round(data['total_elo_change'], 2),
            'total_matches': data['total_matches'],
            'fighters': data['fighters'],
            'logo_url': None,
            'website': None
        })
    
    # Get academy logos
    try:
        result = db.execute(text("SELECT name, logo_url, website FROM academies"))
        for row in result:
            for academy in academies:
                if academy['academy_name'] == row[0]:
                    academy['logo_url'] = row[1]
                    academy['website'] = row[2]
    except Exception as e:
        logger.warning(f"Failed to fetch academy metadata: {e}")

    # Sort by average ELO change descending
    academies.sort(key=lambda x: x['avg_elo_change'], reverse=True)
    
    return {
        'academies': academies,
        'total_academies': len(academies)
    }
