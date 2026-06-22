# CompactIQ Frontend

This is the React-based frontend and Electron client for the CompactIQ compliance engine. It features an interactive Knowledge Graph, compliance dashboard, and an admin panel to manage documents.

## Prerequisites

- Node.js (v16+)
- npm

## Step-by-Step Setup

### 1. Install Dependencies

Navigate to the `frontend` directory and install all required Node modules:

```powershell
npm install
```

### 2. Run the Development Server

You can run the application in standard web mode or as a desktop client via Electron.

**To run in Web Mode (Browser):**
```powershell
npm start
```
This will start the React server at `http://localhost:3000`.

**To run in Desktop Mode (Electron):**
```powershell
npm run electron-dev
```
This will boot the standalone desktop application, which allows for local device scanning.

### 3. Build for Production

To create an optimized production build:

```powershell
npm run build
```

---
*For testing instructions, refer to the [Test README](../Testing_docs/TEST_README.md).*
