# CompactIQ: Autonomous Compliance Engine

![Version](https://img.shields.io/badge/version-1.0.0--beta-blue)
![Architecture](https://img.shields.io/badge/architecture-Microservices-success)
![LLM](https://img.shields.io/badge/AI-Gemini_Powered-purple)
![License](https://img.shields.io/badge/license-MIT-green)

CompactIQ is an enterprise-grade, **AI-driven IT compliance engine** designed to validate endpoint device configurations against rapidly changing, complex compatibility matrices. 

Modern enterprise environments are bound by strict vendor requirements, security bulletins, and hardware dependencies. Traditional compliance tools rely on hardcoded rulesets that become stale the moment they are published. **CompactIQ solves this by dynamically reading raw documentation using Generative AI (Google Gemini), building a semantic Knowledge Graph of dependencies, and executing zero-touch automated scans on client endpoints.**

---

## ✨ Key Capabilities

### 1. AI-Driven Knowledge Ingestion
Instead of manually programming rules (e.g., "Windows 11 requires BIOS >= 1.15"), IT Administrators can drag-and-drop raw PDF release notes and security bulletins directly into the admin portal. The backend Gemini integration parses the unstructured text, extracts hard dependencies, and translates them into an intelligent rules matrix.

### 2. Graph-Based Rules Engine
Compliance isn't linear—it's a web of dependencies. CompactIQ utilizes a Knowledge Graph architecture (currently powered by NetworkX) to map `REQUIRES`, `CONFLICTS_WITH`, and `RECOMMENDS` relationships between hardware models, OS versions, firmware, and software agents. 

### 3. Zero-Touch Endpoint Scanning
The Electron-based client application runs a silent, native PowerShell telemetry scan on the host machine to gather component data. This footprint is seamlessly transmitted to the backend where it is mapped against the global graph to determine immediate compliance posture.

### 4. Interactive Visualizations & Remediation
Users can explore their device's health through dynamic Compliance Dashboards, an interactive React Flow Knowledge Graph showing exact broken dependency chains, and contextual Component Modals.

---

## 🛠 Technology Stack

**Backend System**
* **Framework:** Python / FastAPI
* **Graph Engine:** NetworkX (In-Memory Graph Processing)
* **AI Provider:** Google Gemini GenAI SDK (Text2Graph extraction)
* **Storage:** SQLite (Configured for future PostgreSQL/Multi-Tenant migration)

**Frontend System**
* **Framework:** React.js
* **Desktop Wrapper:** Electron (For native OS hardware scanning)
* **Visualizations:** React Flow (Graph canvas), Recharts, Lucide-React (Iconography)
* **Styling:** Custom CSS with robust Dark/Light Mode Glassmorphism

---

## 🚀 Getting Started

The application is split into two distinct, decoupled environments. To get the engine running locally, follow these guides in order:

1. ⚙️ **[Backend Setup Guide](./backend/README.md)**
   Learn how to configure your Python virtual environment, install API dependencies, set your Gemini API key, and boot the FastAPI server.

2. 🖥️ **[Frontend Setup Guide](./frontend/README.md)**
   Once the backend is listening, use this guide to install the React/Electron client dependencies and start the desktop interface.

3. 🧪 **[End-to-End Testing Workflow](./Testing_docs/TEST_README.md)**
   After both servers are running, **read this guide strictly**. It walks you through the entire user experience: from logging in as an Admin to seed the AI with raw PDFs, to logging in as a Client to trigger the automated telemetry scan.

---

## 📚 System Architecture & Documentation

CompactIQ is built on a highly modular architecture designed to scale into a multi-tenant cloud offering. If you are looking to contribute to the engine or understand the internal mechanics, you **must** read our internal documentation:

* 🏛️ **[Architecture Overview](./docs/architecture.md):** Details the dual-domain model (Global Knowledge Graph vs. Local Endpoint Graph), the migration strategy towards Neo4j, and technical debt management.
* 📂 **[System Working & File Dictionary](./docs/working.md):** Contains a complete structural dictionary of every file in the repository and explains the specific data boundaries between the frontend and backend.

---

## 🛣 Future Roadmap

* **Graph Database Migration:** Deprecate NetworkX in favor of a dedicated Neo4j instance for Cypher-based graph traversal.
* **Conversational Agent:** Implement a Text2Cypher LLM agent on the frontend allowing users to query the graph naturally (e.g., *"Which endpoints are missing the Tanium Client?"*).
* **Multi-Tenant Segmentation:** Enforce PostgreSQL schemas to segregate Enterprise Tenants while maintaining a shared Global Intelligence graph.

---
*Developed as a next-generation approach to dynamic Endpoint Compliance.*
