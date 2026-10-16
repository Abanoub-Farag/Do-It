from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/summary", response_model=schemas.AnalyticsSummary)
def get_analytics_summary(
    db: Session = Depends(get_db),
):
    """Retrieve daily productivity metrics, weekly activity, and current streaks."""
    return crud.get_analytics_summary(db)
