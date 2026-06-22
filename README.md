# CompactIQ Compliance Engine

CompactIQ is an intelligent, dynamic IT compliance engine designed to validate endpoint device configurations (OS, software, hardware) against rapidly changing compatibility matrices and security bulletins.

This project is divided into two main components: a Python FastAPI backend and a React/Electron frontend client.

## Project Navigation

Follow these step-by-step guides to get the application running locally:

1. **[Backend Setup Guide](./backend/README.md)**
   Start here. This guide explains how to configure your virtual environment, install Python dependencies, set up your Gemini API key, and boot the server.

2. **[Frontend Setup Guide](./frontend/README.md)**
   Once the backend is running, use this guide to install the React/Electron client dependencies and start the desktop application.

3. **[Testing Workflow](./Testing_docs/TEST_README.md)**
   After both servers are running, follow this guide strictly to learn how to seed the knowledge base with compatibility documents and run an actual endpoint compliance scan.

## System Architecture Documentation

If you want to understand the core design, AI integration, and knowledge graph engine that powers CompactIQ, we have deeply detailed architectural documentation. 

**You must read these documents to understand the internal logic of the engine:**
* [Architecture Overview](./docs/architecture.md) - Details the dual-domain model, Dell Cloud platform vision, and graph mechanics.
* [How it Works / File Dictionary](./docs/working.md) - Contains a complete dictionary of every file and explains the boundary between the frontend and backend.
