# CompactIQ Working Documentation

## 1. Project File Dictionary

This section explicitly documents the purpose of **each and every file** in the repository.

### Root Directory
* **`.gitignore`**: Defines files and directories that Git should ignore (e.g., `node_modules`, `venv`, `.env`, database files).
* **`architecture.md`**: Provides high-level documentation on the system architecture, design patterns, and deployment strategies.
* **`package-lock.json`**: The npm lockfile for root-level scripts or monolithic project dependencies (if applicable).
* **`README.md`**: The primary entry point for the repository, containing setup instructions, overviews, and how to run the project.
* **`working.md`**: This living documentation file, explaining the internal working logic of the application.

### Backend (`/backend`)
#### Root Level
* **`.env`**: Contains sensitive environment variables, specifically the `GEMINI_API_KEY` for LLM operations and `ADMIN_MAINTENANCE_PASSWORD` for secure Knowledge Base Administration.
* **`compliance.db`**: The production SQLite database storing devices, components, documents, and rules.
* **`requirements.txt`**: Python dependencies required for the backend (FastAPI, SQLAlchemy, google-generativeai, etc.).
* **`sqlite.db`**: An older or alternative local SQLite database file, possibly left over from early development or testing.

#### App Core (`/backend/app`)
* **`main.py`**: The entry point for the FastAPI application. It mounts routers, handles CORS, and executes the `startup_event` (which triggers automatic document ingestion).
* **`core/config.py`**: Defines the `Settings` class (using Pydantic). It loads variables from `.env` and sets up database URIs and seed directory paths.
* **`db/database.py`**: Configures the SQLAlchemy asynchronous engine and `sessionmaker`. It also exports the `get_db` dependency injection function used by routers.
* **`models/models.py`**: Defines the SQLAlchemy ORM models (`Device`, `DeviceComponent`, `Document`, `Rule`) that map to the SQLite tables.
* **`schemas/schemas.py`**: Defines the Pydantic schemas (e.g., `OSInfo`, `InventoryRequest`, `AdminActionRequest`) used for input validation and JSON response formatting.

#### API Endpoints (`/backend/app/api/v1`)
* **`api.py`**: The main API router that mounts all sub-routers (inventory, documents, chat, admin) under `/api/v1`.
* **`endpoints/admin.py`**: Provides the secure `/flush` endpoint for administrators to wipe the database.
* **`endpoints/chat.py`**: Provides the `/chat` endpoint for the generative AI assistant, contextualized by a specific device's compliance scan.
* **`endpoints/documents.py`**: Handles manual document ingestion via PDF/TXT uploads (`/ingest`), listing ingested documents (`/`), and secure document removal (`/{id}/remove`).
* **`endpoints/inventory.py`**: Handles incoming device scans (`/`), retrieves existing scans (`/{device_id}`), and lists all global rules (`/rules`).

#### Services (`/backend/app/services`)
* **`document_ingestion.py`**: Contains the core logic for the Dynamic Compatibility Engine. It extracts text from PDFs/TXTs, queries the Gemini LLM for compatibility rules, parses the JSON response, and persists the `Rule` and `Document` records to the database. It also handles idempotent startup ingestion.
* **`graph_service.py`**: An unfinished or secondary service meant for analyzing component relationships as a direct graph.

#### Scripts (`/backend/scripts`)
* **`__init__.py`**: Makes the scripts directory a Python module.
* **`flush_db.py`**: A utility script (and function `flush_database`) that truncates all database tables (devices, components, documents, rules) to reset the system state.

#### Seeds (`/backend/seeds`)
* **`mock_inventory.json`**: Static JSON containing mock hardware inventory for testing.
* **`mock_rules.json`**: Static JSON containing legacy hardcoded rules.
* **`compatibility_docs/`**: The seed directory for the Dynamic Compatibility Engine. It contains physical PDF and TXT documents (e.g., `CrowdStrike-Falcon-Sensor-7.18-Release-Notes.pdf`, `Tanium-Client-7.5-Compatibility-Bulletin.txt`) that are ingested into the database on startup.

### Frontend (`/frontend`)
#### Root & Public
* **`package.json` & `package-lock.json`**: Defines React dependencies, Electron dependencies, and build scripts.
* **`public/electron.js`**: The Electron main process script. It launches the desktop window and sets up IPC handlers.
* **`public/index.html`**: The main HTML template for the React application.
* **`public/preload.js`**: The Electron preload script. It safely exposes the `window.electron` API (including `scanSystem`) to the React frontend.
* **`public/scan.ps1`**: A PowerShell script executed by Electron to gather local hardware and software inventory from the host Windows machine.

#### React Source (`/frontend/src`)
* **`index.js`**: The React entry point that renders the `App` component into the DOM.
* **`index.css`**: Global CSS file containing all styling, custom properties (CSS variables), glassmorphism effects, and terminal animations.
* **`App.js`**: The React Router configuration. It defines the layout shells (`AdminLayout` and `ClientLayout`) and maps URLs to specific pages.
* **`api.js`**: An Axios wrapper containing all frontend-to-backend API calls (`submitInventory`, `getCompliance`, `getDocumentsList`, `uploadDocument`, etc.).
* **`context/AppContext.js`**: React Context provider for managing global application state (loading status, phase index, compliance results, graph data) across all components.

#### Components & Pages (`/frontend/src/pages` & `/frontend/src/components`)
* **`components/ComponentModal.js`**: A modal component to display detailed information about a specific hardware/software component when clicked.
* **`pages/LandingPage.js`**: The role-selection screen (Admin vs Client).
* **`pages/Dashboard.js`**: The primary "My Device Scan" client page. It displays the compliance score, status, and any violations found for the scanned machine.
* **`pages/ComponentExplorer.js`**: A client page displaying a tabular list of all components detected on the machine.
* **`pages/GraphView.js`**: A React Flow implementation rendering a visual Knowledge Graph of components and their relationships/violations.
* **`pages/DocumentUpload.js`**: An admin page providing a drag-and-drop interface for manually uploading new compatibility PDFs.
* **`pages/KnowledgeBaseAdmin.js`**: An admin dashboard page for managing ingested documents, removing records, and flushing the database securely.
* **`pages/RulesMatrix.js`**: An admin page displaying all dynamically extracted compatibility rules globally known to the system.

---

## 2. Mock Data vs Real Logic Boundary

It is crucial to understand which parts of the application use static mock data versus real, dynamic functionality.

### **Where Mock Data is Used**
* **Frontend Graph Parsing fallback**: In earlier iterations, if `getCompliance` failed or `graph_elements` was not properly returned from the backend, the frontend might have fallen back to static nodes. However, currently, the graph is dynamically constructed by the backend in `inventory.py`.
* **`mock_inventory.json` & `mock_rules.json`**: These files exist in the backend `seeds/` folder but **are no longer actively used by the core application workflow**. They are legacy artifacts from before the Gemini LLM integration was implemented.

### **Where Real Data and Logic are Used**
* **Device Scanning**: The frontend uses `scan.ps1` via Electron to gather **real hardware and OS data** from the host machine.
* **Rule Ingestion**: The system reads **real PDF/TXT files** from the `compatibility_docs` folder, parses their exact text, and uses the **Gemini LLM API** to dynamically extract real rules.
* **Compliance Calculation**: The backend endpoint `/api/v1/inventory/` accepts the real scan data, queries the database for dynamically extracted rules, and executes **real comparison logic** to generate violations and compliance scores.
* **Database**: All operations interact with a real SQLite database (`compliance.db`), persisting real documents and real rules across sessions.
* **Knowledge Base Admin**: Operations like removing documents or flushing the database perform **real SQL deletions** and **real filesystem `os.remove()`** operations.

---

## 3. Backend Components Never Used in the Frontend

To prevent confusion, the following backend components, endpoints, and functionalities exist exclusively for internal backend operations and are **never** called or consumed by the React frontend:

1. **`load_and_ingest_seeds()`** (in `document_ingestion.py`):
   * This function is triggered internally by `main.py` on FastAPI startup. It traverses the physical seed directory and ingests new PDFs without any frontend initiation.
2. **`settings.SEED_DIR` & `os.listdir`**:
   * The frontend has zero knowledge of the physical seed directory. It only interacts with the `documents` database table via the `GET /api/v1/documents/` endpoint.
3. **`ADMIN_MAINTENANCE_PASSWORD` configuration value**:
   * The actual password value is strictly stored in `.env` and `config.py` on the backend. The frontend only provides a blank input field for the user to type into; it never hardcodes or checks the password locally.
4. **`scripts/flush_db.py`**:
   * The raw Python script is an administrative utility. The frontend only touches it indirectly by calling the `/api/v1/admin/flush` API endpoint.
5. **Raw Database Models (`models.py`)**:
   * The frontend never sees SQLAlchemy models. It only ever receives the serialized JSON structures defined in `schemas.py`.
