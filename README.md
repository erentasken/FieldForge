# CSV Normalizer with RAG Architecture

**AI-powered CSV normalization** with Next.js frontend and FastAPI backend using Retrieval-Augmented Generation.

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

## Project Structure

```
csv-normalizer/
├── front/                  # Next.js UI
├── rag/                    # RAG pipeline modules
│   ├── embeddings.py
│   ├── knowledge.py
│   ├── pipeline.py
│   ├── prompt.py
│   └── retriever.py
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
- CSV upload with preview
- AI-assisted column mapping
- Accept/reject suggestions
- Download transformed CSV
- Responsive UI (Tailwind CSS)

**Backend (FastAPI):**
- `/api/normalize` endpoint
- RAG-powered mapping suggestions

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