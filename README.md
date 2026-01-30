# FieldForge

**AI-powered field standardization** — Forge standardized field names from raw CSV data using Retrieval-Augmented Generation.

![FieldForge](https://img.shields.io/badge/FieldForge-RAG%20%2B%20AI-blue)

---

## Quick Start

```bash
git clone <repository-url>
cd csv-normalizer
cp .env.example .env  # Add your GROK_API_KEY
docker compose -f docker-compose.dev.yml up --build
```

**Services:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

---

## Demo

![Demo](demo.gif)

## Project Structure

```
fieldforge/
├── front/                  # Next.js UI
├── rag/                    # RAG pipeline modules
│   ├── embeddings.py       # Vector embeddings (BioBERT)
│   ├── knowledge.py        # Medical abbreviation glossary
│   ├── pipeline.py         # RAG orchestration
│   ├── prompt.py           # LLM prompt templates
│   └── retriever.py        # FAISS similarity search
├── server.py               # FastAPI backend
├── docker-compose.dev.yml
└── .env.example
```

---

## Environment Setup

Create `.env` file:

```env
GROK_API_KEY=xai_your_key_here
```

**Getting your Grok API Key:**
1. Sign up at xAI and set up billing
2. Generate an API key from the xAI API Console
3. Copy it
4. Add to `.env` file above

**Note:** Keep your key secure and never commit `.env` to version control.

---

## How to run (Without Docker)

**Backend:**
```bash
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

**Frontend:**
```bash
cd front
npm install
npm run dev
```

---

## How It Works

1. **Upload CSV** → Parse and preview data
2. **Select Columns** → Choose fields to normalize
3. **Get AI Suggestions** → RAG provides mapping recommendations
4. **Review & Apply** → Accept/reject mappings
5. **Download** → Get transformed CSV

---

## Docker Commands

```bash
# Start services
docker compose -f docker-compose.dev.yml up --build

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop services
docker compose -f docker-compose.dev.yml down
```

---

## Features

**Frontend (Next.js):**
- Drag & drop CSV upload
- Interactive column selection
- AI-powered normalization suggestions
- Human-in-the-loop review (accept/reject)
- Alternative mapping selection
- Download transformed CSV
- Step-by-step progress indicator
- Responsive UI (Tailwind CSS)

**Backend (FastAPI):**
- `/api/normalize` endpoint
- RAG-powered mapping suggestions
- Medical abbreviation knowledge base
- FAISS vector similarity search

---

## RAG Modules

| Module | Purpose |
|--------|---------|
| `embeddings.py` | Converts data into vector embeddings |
| `knowledge.py` | Stores normalization knowledge |
| `pipeline.py` | Orchestrates RAG workflow |
| `prompt.py` | Manages AI prompt templates |
| `retriever.py` | Retrieves relevant examples |

---

## License

MIT License