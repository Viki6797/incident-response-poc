from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uuid
from datetime import datetime

from models.incident import IncidentCreate, IncidentResponse, IncidentUpdate, IncidentStatus, Severity
from services.firebase_service import get_firestore, test_connection

app = FastAPI(
    title="Incident Response API",
    description="Real-time incident management system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get Firestore database
def get_db():
    return get_firestore()

@app.get("/")
async def root():
    return {"message": "Incident Response API is running!"}

@app.get("/health")
async def health_check():
    # Test Firebase connection
    firebase_healthy = False
    try:
        db = get_firestore()
        if db:
            # Try a simple operation
            collections = db.collections()
            list(collections)
            firebase_healthy = True
    except Exception as e:
        print(f"Health check Firebase error: {e}")
    
    return {
        "status": "healthy" if firebase_healthy else "degraded",
        "version": "1.0.0",
        "firebase": "connected" if firebase_healthy else "disconnected",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/test")
async def test_endpoint():
    return {
        "service": "incident-response-api",
        "status": "operational",
        "timestamp": datetime.now().isoformat()
    }

# === INCIDENT ENDPOINTS ===

@app.post("/api/incidents", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(incident: IncidentCreate, db = Depends(get_db)):
    """Create a new incident"""
    try:
        incident_id = str(uuid.uuid4())
        incident_ref = db.collection("incidents").document(incident_id)
        
        incident_data = {
            **incident.dict(),
            "id": incident_id,
            "status": IncidentStatus.REPORTED.value,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "impact_score": calculate_impact_score(incident.severity)
        }
        
        incident_ref.set(incident_data)
        
        # Create initial timeline event
        timeline_event = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now(),
            "event_type": "created",
            "title": "Incident Reported",
            "description": f"Incident created by {incident.reported_by}",
            "user_id": incident.reported_by
        }
        
        incident_ref.collection("timeline").document(timeline_event["id"]).set(timeline_event)
        
        return incident_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create incident: {str(e)}")

@app.get("/api/incidents", response_model=List[IncidentResponse])
async def get_incidents(db = Depends(get_db), limit: int = 10):
    """Get all incidents"""
    try:
        incidents_ref = db.collection("incidents")
        docs = incidents_ref.order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit).stream()
        
        incidents = []
        for doc in docs:
            incident_data = doc.to_dict()
            incident_data["id"] = doc.id
            incidents.append(incident_data)
            
        return incidents
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch incidents: {str(e)}")

@app.get("/api/incidents/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: str, db = Depends(get_db)):
    """Get a specific incident by ID"""
    try:
        incident_ref = db.collection("incidents").document(incident_id)
        doc = incident_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Incident not found")
            
        incident_data = doc.to_dict()
        incident_data["id"] = doc.id
        return incident_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch incident: {str(e)}")

@app.put("/api/incidents/{incident_id}", response_model=IncidentResponse)
async def update_incident(incident_id: str, update: IncidentUpdate, db = Depends(get_db)):
    """Update an incident"""
    try:
        incident_ref = db.collection("incidents").document(incident_id)
        doc = incident_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Incident not found")
            
        # Prepare update data
        update_data = update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.now()
        
        # If status is resolved, set resolved_at
        if update.status == IncidentStatus.RESOLVED:
            update_data["resolved_at"] = datetime.now()
        
        # Update the incident
        incident_ref.update(update_data)
        
        # Get updated incident
        updated_doc = incident_ref.get()
        incident_data = updated_doc.to_dict()
        incident_data["id"] = updated_doc.id
        
        return incident_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update incident: {str(e)}")

@app.get("/api/incidents/severity/{severity}", response_model=List[IncidentResponse])
async def get_incidents_by_severity(severity: Severity, db = Depends(get_db)):
    """Get incidents by severity level"""
    try:
        incidents_ref = db.collection("incidents")
        docs = incidents_ref.where("severity", "==", severity.value).stream()
        
        incidents = []
        for doc in docs:
            incident_data = doc.to_dict()
            incident_data["id"] = doc.id
            incidents.append(incident_data)
            
        return incidents
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch incidents: {str(e)}")

def calculate_impact_score(severity: Severity) -> int:
    """Calculate impact score based on severity"""
    scores = {
        Severity.CRITICAL: 100,
        Severity.HIGH: 75,
        Severity.MEDIUM: 50,
        Severity.LOW: 25
    }
    return scores.get(severity, 0)

# Import firestore for query
from google.cloud import firestore