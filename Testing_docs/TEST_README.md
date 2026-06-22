# End-to-End Testing Workflow & Feature Guide

Welcome to the CompactIQ testing guide! Since the backend boots with a completely clean slate, you get to experience the entire lifecycle of the application—from AI document ingestion to endpoint compliance scanning.

Assuming you have both the **FastAPI Backend** and **React/Electron Frontend** running, follow these steps meticulously to explore every feature.

---

## Phase 1: Knowledge Base Setup (Admin Role)

When you first launch the frontend, you are greeted by the **Landing Page** asking you to select a role.

### Step 1: Enter the Admin Panel
1. Click on **Knowledge Base Admin**.
2. **What you see:** The Admin Dashboard. Initially, this area will show zero ingested documents and zero active rules because the database is empty.

### Step 2: Ingest Compatibility Documents (AI Parsing)
To test the core AI engine, we need to feed it raw documentation.
1. Navigate to the **Upload Documents** section from the sidebar.
2. Locate the sample PDFs in your local repository under `Testing_docs/compatibility_docs/` (e.g., `CrowdStrike-Falcon-Sensor-7.18-Release-Notes.pdf`, `DELL-BIOS-Compatibility-Matrix-2026-Q1 (1).pdf`).
3. Drag and drop one or all of these PDFs into the upload zone and click **Upload**.
4. **What you see:** A loading sequence begins. Under the hood, the backend is chunking the PDFs and sending them to the Gemini AI to extract structured compatibility rules. Once finished, a success toast notification appears, and the document list updates.

### Step 3: Explore the Rules Matrix
Let's see what the AI actually extracted from those PDFs.
1. Navigate to the **Rules Matrix** tab in the admin sidebar.
2. **What you see:** A beautiful tabular interface displaying the raw intelligence graph. You will see rules like `"Windows 11 REQUIRES BIOS >= 1.15"` or `"CrowdStrike CONFLICTS_WITH Legacy_Antivirus"`. These are the rules that will be used to judge your local machine.

### Step 4: Admin Maintenance (Optional)
*   **What you see:** On the main Admin Dashboard, there is a **Flush Database** card. If you ever want to reset your testing environment, you can use this. It will ask for an admin password (default is `admin123` from your `.env` file).

---

## Phase 2: Endpoint Scanning (Client Role)

Now that the Dell Cloud (Backend) is armed with knowledge, let's scan a device. 

Return to the main Landing Page (you can simply refresh the app or click a "Back" button if available) and select **Client Device**.

### Step 5: The Zero-Touch Scan Sequence
1. The moment you select Client Device, the automated scanning sequence takes over. No manual clicking required.
2. **What you see:** An enterprise-grade loading terminal. 
    *   *Scanning Device...* (Electron runs a hidden PowerShell script to query your host OS and hardware).
    *   *Analyzing Dependencies...* (The backend maps your local components against the rules we uploaded in Step 2).
    *   *Running Compliance Checks...*

### Step 6: The Compliance Dashboard
Once the scan is complete, the application renders the main dashboard.
1. **What you see:** 
    *   **Compliance Score:** A gauge out of 100 representing your device's health.
    *   **Status Banner:** Clearly stating if you are `Compliant` or `Non-Compliant`.
    *   **Violations Panel:** If your physical machine violates any of the rules from the PDFs (e.g., your BIOS is too old, or you lack a required security agent), the violations are listed here in detail.
2. **Rescan Feature:** If you ever go back to the Admin Panel to upload *new* documents, you can click the **Rescan System** button at the top right of the Dashboard. This clears the cache and runs a fresh scan against your newly injected rules.

### Step 7: Investigate the Component Explorer
1. Navigate to the **Component Explorer** tab.
2. **What you see:** A massive, scrollable table of every single piece of hardware and software detected on your machine (RAM, CPU, NICs, Windows version).
3. **Action:** Click on any row in the table.
4. **What you see:** A **Component Modal** pops up, revealing deeper, low-level metadata about that specific entity.

### Step 8: Visualize the Knowledge Graph
1. Navigate to the **Graph View** tab.
2. **What you see:** A highly interactive, draggable React Flow canvas. 
    *   The nodes represent the software and hardware on your machine.
    *   The edges (lines connecting them) represent the rules. 
    *   If you failed compliance, you will literally see red, broken edges visually demonstrating the conflict or missing dependency!

### Step 9: Ask the AI Assistant for Remediation
1. Open the **AI Assistant / Chat** feature.
2. **What you see:** A chat interface that is context-aware of your specific scan results.
3. **Action:** Type something like: *"Why did my device fail compliance?"* or *"Give me a PowerShell script to update my Dell BIOS to the required version."*
4. **What you see:** The Gemini AI will respond with highly accurate, contextual remediation steps based exactly on the rules you uploaded and the hardware you scanned.

---
**Testing Complete!** You have now successfully seeded the AI knowledge graph and utilized it to perform an automated, intelligent endpoint compliance scan.
