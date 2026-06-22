# CompactIQ Backend

This is the FastAPI backend for the CompactIQ compliance engine. It handles document ingestion (via Gemini AI), knowledge graph generation, and device compliance validation.

## Prerequisites

- Python 3.10+
- A valid Gemini API Key (for document parsing and chat)

## Step-by-Step Setup

### 1. Create a Virtual Environment

It is highly recommended to use a virtual environment to manage dependencies.

**Windows:**
```powershell
python -m venv venv
.\venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

With the virtual environment activated, install the required packages:

```powershell
pip install -r requirements.txt
```
*(Note: If `requirements.txt` is not present, you can install the core dependencies via `pip install fastapi uvicorn sqlalchemy aiosqlite pydantic-settings google-genai aiofiles python-multipart`)*

### 3. Environment Variables

The backend requires configuration through a `.env` file. 

1. Copy the example file:
   ```powershell
   cp .env.example .env
   ```
2. Open `.env` and configure your keys. **You MUST provide a `GEMINI_API_KEY`** for the system to process documents and handle chat queries.

### 4. Run the Server

Start the FastAPI backend using `uvicorn`:

```powershell
python -m uvicorn app.main:app --port 8000 --reload
```

The API will be available at `http://localhost:8000`. You can access the interactive Swagger documentation at `http://localhost:8000/docs`.

---
*For testing instructions, refer to the [Test README](../Testing_docs/TEST_README.md).*
