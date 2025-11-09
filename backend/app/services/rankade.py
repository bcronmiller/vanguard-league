"""
Rankade API integration service
Handles authentication, match submission, and ranking retrieval
"""
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from app.core.config import settings


class RankadeService:
    """Service for interacting with Rankade API"""

    BASE_URL = "https://api.rankade.com/public/api/1"

    def __init__(self):
        self.api_key = settings.RANKADE_API_KEY
        self.api_secret = settings.RANKADE_API_SECRET
        self.group_id = settings.RANKADE_GROUP_ID
        self.token: Optional[str] = None
        self.token_expires: Optional[datetime] = None

    async def _get_token(self) -> str:
        """Get or refresh JWT token"""
        # Check if we have a valid token
        if self.token and self.token_expires and datetime.utcnow() < self.token_expires:
            return self.token

        # Get new token
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/auth",
                params={
                    "key": self.api_key,
                    "secret": self.api_secret
                }
            )
            response.raise_for_status()
            data = response.json()

            self.token = data["success"]["token"]
            # Tokens typically expire in 1 hour, refresh 5 minutes early
            self.token_expires = datetime.utcnow() + timedelta(minutes=55)

            return self.token

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        json_data: Optional[Any] = None
    ) -> Dict:
        """Make authenticated request to Rankade API"""
        token = await self._get_token()

        async with httpx.AsyncClient() as client:
            response = await client.request(
                method,
                f"{self.BASE_URL}{endpoint}",
                headers={"Authorization": f"Bearer {token}"},
                params=params,
                json=json_data,
                timeout=30.0
            )

            if response.status_code == 429:
                # Quota limit reached
                raise Exception(f"Rankade quota limit reached: {response.json()}")

            response.raise_for_status()
            return response.json()

    async def get_quota_status(self) -> Dict:
        """Get current API quota usage"""
        return await self._make_request("GET", "/quota")

    async def get_players(self, page: int = 1) -> Dict:
        """Get list of players in the group"""
        return await self._make_request("GET", f"/players/{page}")

    async def create_ghost_player(self, name: str) -> Dict:
        """Create a ghost player in the group"""
        return await self._make_request(
            "POST",
            "/players/player",
            json_data={"name": name}
        )

    async def search_games(self, name: str) -> Dict:
        """Search for games by name"""
        return await self._make_request(
            "GET",
            "/games/search",
            params={"name": name}
        )

    async def get_games(self) -> Dict:
        """Get list of games played in the group"""
        return await self._make_request("GET", "/games")

    async def create_game(self, name: str = None, bgg_id: int = None) -> Dict:
        """Create a new game"""
        json_data = {}
        if bgg_id:
            json_data["bggId"] = bgg_id
        if name:
            json_data["name"] = name

        return await self._make_request(
            "POST",
            "/games/game",
            json_data=json_data
        )

    async def submit_matches(self, matches: List[Dict], dryrun: bool = False) -> Dict:
        """
        Submit one or more matches (max 10 per call)

        Match format:
        {
            "id": "optional-client-match-id",
            "name": "optional-match-name",
            "game": 1234,  # game ID from Rankade
            "weight": "normal",  # ultralight, light, midlight, normal, heavy, massive
            "factions": [
                {
                    "rank": 1,  # 1 = winner, 2 = loser, 1,1 = draw
                    "players": ["player_id_1"],
                    "score": "optional",
                    "name": "optional"
                },
                {
                    "rank": 2,
                    "players": ["player_id_2"]
                }
            ],
            "notes": "optional notes",
            "date": "2025-01-09T12:00:00+00:00"  # Custom/Dedicated tier only
        }
        """
        params = {"dryrun": 1} if dryrun else None
        return await self._make_request(
            "POST",
            "/matches/match",
            params=params,
            json_data=matches
        )

    async def get_matches_status(self) -> Dict:
        """Get status of API-recorded matches"""
        return await self._make_request("GET", "/matches/status")

    async def check_match_exists(self, match_id: str) -> bool:
        """Check if a match exists by external ID"""
        result = await self._make_request(
            "GET",
            "/matches/match/exists",
            params={"id": match_id}
        )
        return result.get("success", 0) == 1

    async def get_matches(self, subset: str = None, page: int = 1) -> Dict:
        """Get list of matches"""
        endpoint = "/matches"
        if subset:
            endpoint += f"/{subset}"
        if page > 1:
            endpoint += f"/{page}"
        return await self._make_request("GET", endpoint)

    async def get_subsets(self) -> Dict:
        """Get list of subsets (e.g., weight classes)"""
        return await self._make_request("GET", "/subsets")

    async def get_rankings(
        self,
        subset: str = None,
        match: int = None,
        page: int = 1
    ) -> Dict:
        """
        Get rankings for a subset

        Args:
            subset: Subset ID (default: main)
            match: Match number (default: last)
            page: Page number
        """
        endpoint = "/rankings"

        if subset:
            endpoint += f"/{subset}"
        if match:
            endpoint += f"/{match}"
        if page > 1:
            endpoint += f"/{page}"

        return await self._make_request("GET", endpoint)

    async def get_service_status(self) -> bool:
        """Check if Rankade service is operational"""
        result = await self._make_request("GET", "/status")
        return result.get("success", 0) == 1


# Singleton instance
rankade_service = RankadeService()
