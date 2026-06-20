# 🚀 Feature: Enterprise Role Segregation (Admin Console vs. Client Agent)

## 📖 Description
This Pull Request introduces a major architectural overhaul to the frontend interface. To accurately reflect an enterprise topology, the single frontend application has been decoupled into two distinct, role-based portals: an **IT Administrator Console** and an **Endpoint Client Agent**. 

## ✨ Key Architectural Differences

### 1. Role-Based Landing Page
- Introduced `LandingPage.js`, a sleek entry point that forces the user to select their enterprise role before accessing the system.
- Clicking **IT Administrator Console** routes the user to the `/admin/*` layout.
- Clicking **Endpoint Client Agent** routes the user to the `/client/*` layout.

### 2. The IT Administrator Console (`/admin`)
Designed for global oversight and enterprise management. The Admin layout features a dedicated sidebar restricting access to administrative tools:
- **Document Ingestion Engine:** Admins upload vendor Release Notes (PDFs) to train the engine.
- **Global Knowledge Graph:** Admins can view the massive, unfiltered dependency graph of *all* rules extracted across the entire enterprise. 
  - *Bugfix:* Rewrote the graph coordinate generator to plot nodes in a clean Grid Layout (rather than an infinite horizontal line) and removed ReactFlow zoom restrictions (`minZoom={0.1}`) so admins can view the entire enterprise architecture at once.
- **Rules Matrix Data Table:** Created a brand new `<Table />` view (`RulesMatrix.js`) that queries a new backend endpoint (`GET /api/v1/inventory/rules`). It displays a highly detailed database of every extracted rule, the AI's exact confidence score, and the source document origin.

### 3. The Endpoint Client Agent (`/client`)
Designed as a lightweight, localized application running on an employee's machine. The Client layout features its own restricted sidebar:
- **Local Endpoint Dashboard:** The user executes an inventory scan against their local hardware to detect collisions, missing prerequisites, and dynamically generate remediation scripts.
- **Local Dependency Graph:** The user views a strictly filtered version of the Knowledge Graph showing only how *their specific hardware* is interacting with the enterprise rules.
  - *Security Fix:* Prevented an edge-case where a Client user navigating to the graph *before* running a local scan would accidentally trigger a global fetch. The endpoint graph is now strictly locked until a local scan initializes the hardware profile.

## 🐛 Technical Fixes
- Migrated React Router from `BrowserRouter` to `HashRouter`. This guarantees that nested layouts (`/admin` and `/client`) render flawlessly when the frontend is packaged into a standalone Electron desktop executable (where local file protocols break traditional browser routing).

## 🧪 How to Verify
1. Launch the application. You will be greeted by the Role Selector.
2. Enter the **IT Administrator Console** and verify you have access to the Ingestion, Global Graph, and Rules Matrix.
3. Return to the Role Selector and enter the **Endpoint Client Agent**. Verify the sidebar changes entirely to restrict you to the local Device Scan and Local Graph.
