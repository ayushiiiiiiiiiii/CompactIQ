# Dynamic Compatibility & Configuration Compliance Engine

## Overview
A living, AI-driven platform that converts static enterprise documentation into a machine-readable knowledge graph for continuous compliance validation.

## Repository Structure
```
.
├── backend/            # FastAPI, SQLite, NetworkX backend
│   ├── app/            # Source code
│   └── seeds/          # Mock data and document corpus
├── frontend/           # Electron + React Application
│   ├── public/         # Electron Entry points
│   ├── src/            # React Code (React-Flow Graph)
│   └── package.json
└── README.md
```

## Running the Complete Application

### Step 1: Start the Backend Cloud Platform
The backend is a FastAPI application that uses a local SQLite database. Ensure you have Python installed.
```bash
cd backend
python -m venv venv
# On Windows
.\venv\Scripts\activate
# On Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000
```
This will start:
- FastAPI Services on `http://localhost:8000` (Docs available at `/api/v1/openapi.json`)
- A local SQLite database (`compliance.db`)

### Step 2: Start the Client End-User App (Electron + React)
You need Node.js `v18+`.
```bash
cd frontend
npm install
npm run electron-dev
```
This will launch the native Windows-sized Electron app window with the React SPA loaded.

## Using the Prototype
1. **Mock Endpoints**: For the hackathon, WMI scans are mocked in `electron.js`. Click "Run Validation Check" to trigger the scan.
2. **Observe Red State**: The mock data guarantees a failure state (`SecurityAgent 7.17` vs `Intel_NIC 22.0`). You will see a score deduction and actionable root causes.
3. **Graph Explorer**: Click on "Dependency Graph" on the left navigation bar to view the visual mappings built by NetworkX / React Flow.
4. **Documents**: Drop any raw text or PDF into `backend/seeds/compatibility_docs/` to simulate the background celery ingestion pipeline.
