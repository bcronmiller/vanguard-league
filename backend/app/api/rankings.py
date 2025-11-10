from fastapi import APIRouter

router = APIRouter()

# Note: Rankade-based rankings endpoints have been removed.
# The platform now uses a local ELO rating system.
#
# Rankings are now served via the ladder endpoints:
# - GET /api/ladder - Overall ladder
# - GET /api/ladder/{event_id} - Event-specific ladder
# - GET /api/ladder/{event_id}/weight-class/{weight_class_name} - Weight class ladder
#
# Rankade service code is preserved in app/services/rankade.py for reference
# but is no longer actively used.
