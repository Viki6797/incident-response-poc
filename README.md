# Incident Response POC

A real-time incident management system built as a Proof of Concept (POC) for manager demonstration.

## 🌐 Live Deployment

### Frontend (UI)  

🔗 **URL:** [https://incident-response-poc.vercel.app](https://incident-response-poc.vercel.app)

### Backend (API)  

🔗 **URL:** [https://incident-response-backend-swhf.onrender.com](https://incident-response-backend-swhf.onrender.com)

---

## 🚀 Features

- **Real-time Incident Dashboard** — Live updates of incident status  
- **Incident Management** — Create, view, update incidents  
- **Severity Classification** — Critical, High, Medium, Low  
- **Cost Impact Analysis** — Calculates business impact  
- **Firebase Integration** — Real-time database & authentication  
- **Responsive UI** — Built with React and Material-UI  

---

## 🏗️ Architecture

Frontend (Vercel) → Backend (Render.com) → Firebase (Google Cloud)
React + Vite | FastAPI + Python | Firestore + Auth

yaml
Copy code

---

## 📁 Project Structure

```plaintext
incident-response-poc/
├── frontend/                # React Vite application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── services/        # API services
│   │   └── ...
│   └── package.json
│
├── backend/                 # FastAPI Python backend
│   ├── models/              # Pydantic models
│   ├── services/            # Firebase services
│   ├── main.py              # FastAPI app
│   └── requirements.txt
│
└── README.md


---

## 🔧 API Endpoints

| Endpoint                               | Method | Description                    |
|----------------------------------------|--------|--------------------------------|
| `/health`                              | GET    | Health check with Firebase     |
| `/api/incidents`                       | GET    | Get all incidents              |
| `/api/incidents`                       | POST   | Create new incident            |
| `/api/incidents/{id}`                  | GET    | Get specific incident          |
| `/api/incidents/{id}`                  | PUT    | Update incident                |
| `/api/incidents/severity/{level}`      | GET    | Get incidents by severity      |

---

## 🧪 Example API Usage

### Health Check

```bash
curl https://incident-response-backend-swhf.onrender.com/health
List Incidents
bash
Copy code
curl https://incident-response-backend-swhf.onrender.com/api/incidents
Create Incident
bash
Copy code
curl -X POST https://incident-response-backend-swhf.onrender.com/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Incident",
    "description": "Testing deployed API",
    "severity": "medium",
    "reported_by": "demo@company.com"
  }'
🚦 Quick Start (Local Development)
Backend Setup
bash
Copy code
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
Frontend Setup
bash
Copy code
cd frontend
npm install
npm run dev
🔒 Environment Variables
Backend (.env)
ini
Copy code
FIREBASE_CREDENTIALS_JSON={your_firebase_service_account_json}
Frontend (.env)
ini
Copy code
VITE_API_URL=http://localhost:8000
# Production:
# VITE_API_URL=https://incident-response-backend-swhf.onrender.com
🛠️ Technologies Used
Frontend
React 18

Vite

Material UI

Axios

Backend
FastAPI

Python 3.10

Uvicorn

Database
Firebase Firestore

Firebase Auth

Deployment
Vercel (Frontend)

Render.com (Backend)

Real-time Features
Firebase Realtime Database

📊 Demo Credentials (if applicable)
sql
Copy code
Demo User: demo@company.com
Password: (if authentication implemented)
🎯 POC Objectives
Demonstrate real-time incident monitoring

Show Firebase integration

Present cost impact analysis

Validate full-stack deployment workflow

Showcase responsive UI design

⚠️ POC Limitations
Free tier hosting (may sleep when inactive)

Not intended for production use

Demo Firebase project

Limited scalability on free tiers

📈 Future Enhancements
User authentication & roles

Email / Slack notifications

Advanced reporting & analytics

Mobile application

Integration with monitoring tools

🤝 Contributing
This project is a POC demonstration.
For production use, contact the development team.
