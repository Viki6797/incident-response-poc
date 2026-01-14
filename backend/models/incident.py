from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field

class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high" 
    MEDIUM = "medium"
    LOW = "low"

class IncidentStatus(str, Enum):
    REPORTED = "reported"
    INVESTIGATING = "investigating"
    IDENTIFIED = "identified"
    MONITORING = "monitoring"
    RESOLVED = "resolved"

class IncidentBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    severity: Severity = Severity.MEDIUM
    affected_services: List[str] = Field(default_factory=list)
    reported_by: str

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    status: Optional[IncidentStatus] = None
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None

class IncidentResponse(IncidentBase):
    id: str
    status: IncidentStatus = IncidentStatus.REPORTED
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None
    impact_score: int = Field(default=0, ge=0, le=100)

    class Config:
        from_attributes = True

class TimelineEvent(BaseModel):
    id: str
    timestamp: datetime
    event_type: str  # status_change, note, assignment, communication
    title: str
    description: str
    user_id: str
    metadata: Optional[dict] = None