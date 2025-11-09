from fastapi import APIRouter, HTTPException
from typing import Optional
from app.services.rankade import rankade_service

router = APIRouter()


@router.get("/rankings")
async def get_rankings(
    subset: Optional[str] = None,
    match: Optional[int] = None,
    page: int = 1
):
    """
    Get rankings from Rankade

    Args:
        subset: Subset ID (weight class), defaults to main
        match: Match number, defaults to last
        page: Page number for pagination
    """
    try:
        result = await rankade_service.get_rankings(
            subset=subset,
            match=match,
            page=page
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch rankings: {str(e)}"
        )


@router.get("/subsets")
async def get_subsets():
    """Get all subsets (weight classes) from Rankade"""
    try:
        result = await rankade_service.get_subsets()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch subsets: {str(e)}"
        )


@router.get("/rankings/by-weight-class/{weight_class_name}")
async def get_rankings_by_weight_class(weight_class_name: str):
    """Get rankings for a specific weight class"""
    try:
        # First, get all subsets to find the matching weight class
        subsets_result = await rankade_service.get_subsets()
        subsets = subsets_result.get("success", {}).get("subsets", [])

        # Find matching subset
        matching_subset = None
        for subset in subsets:
            if subset.get("name", "").lower() == weight_class_name.lower():
                matching_subset = subset
                break

        if not matching_subset:
            raise HTTPException(
                status_code=404,
                detail=f"Weight class '{weight_class_name}' not found"
            )

        # Get rankings for this subset
        rankings = await rankade_service.get_rankings(
            subset=matching_subset["id"]
        )

        return {
            "weight_class": weight_class_name,
            "subset_id": matching_subset["id"],
            "rankings": rankings
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch rankings: {str(e)}"
        )


@router.get("/quota")
async def get_quota_status():
    """Get current API quota usage from Rankade"""
    try:
        return await rankade_service.get_quota_status()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get quota status: {str(e)}"
        )
