import requests
import json

base_url = "http://localhost:8000"

# Test data
test_incidents = [
    {
        "title": "Database CPU at 95%",
        "description": "Production database CPU utilization critically high, affecting query performance.",
        "severity": "critical",
        "affected_services": ["mysql-primary", "api-service", "analytics"],
        "reported_by": "system-monitor"
    },
    {
        "title": "CDN Cache Miss Rate High",
        "description": "Increased cache miss rate causing slower asset loading for users.",
        "severity": "high",
        "affected_services": ["cdn-edge", "asset-service", "frontend"],
        "reported_by": "performance-team"
    },
    {
        "title": "User Login Failures",
        "description": "Multiple users reporting login failures in US region.",
        "severity": "medium",
        "affected_services": ["auth-service", "login-api"],
        "reported_by": "support-team"
    },
    {
        "title": "Email Delivery Delays",
        "description": "Transactional emails experiencing 5-10 minute delays.",
        "severity": "low",
        "affected_services": ["email-service", "notification-queue"],
        "reported_by": "monitoring-system"
    }
]

print("Adding test incidents to backend...")

for incident in test_incidents:
    try:
        response = requests.post(f"{base_url}/api/incidents", json=incident)
        if response.status_code == 201:
            print(f"Added: {incident['title']}")
        else:
            print(f"Failed: {incident['title']} - {response.status_code}")
    except Exception as e:
        print(f"Error: {incident['title']} - {str(e)}")

print("\nTest data creation complete!")
print("Check your frontend - should see real-time updates!")