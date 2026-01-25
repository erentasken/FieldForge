from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from typing import Dict, Any, List
from huggingface_hub import InferenceClient
from openai import OpenAI
import json
import pandas as pd
from rag.pipeline import run_rag
import tiktoken
load_dotenv(".env")

MODEL_PROVIDER = "grok"  # "hf" or "grok"

# Grok setup
GROK_API_KEY = os.getenv("GROK_API_KEY")
if not GROK_API_KEY:
    raise Exception("GROK_API_KEY not set in .env")
grok_client = OpenAI(
    api_key=GROK_API_KEY,
    base_url="https://api.x.ai/v1"
)

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NormalizeRequest(BaseModel):
    data: Dict[str, List[Any]]  # columns -> samples

import re

def extract_json(text):
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError("No valid JSON found in model response")

@app.post("/api/normalize")
async def normalize(request: NormalizeRequest):
    try:
        df = pd.DataFrame(request.data)
        fields = df["Variable / Field Name"].tolist()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    print(fields)
    prompt_messages = run_rag(fields)

    try:
        if MODEL_PROVIDER == "grok":
            encoding = tiktoken.get_encoding("cl100k_base")
            num_tokens = len(encoding.encode(json.dumps(prompt_messages)))
            print(f"Number of tokens in prompt: {num_tokens}")

            completion = grok_client.chat.completions.create(
                model="grok-4-1-fast-non-reasoning",
                messages=prompt_messages,
                temperature=0
            )
            response_text = completion.choices[0].message.content.strip()
            print("Response from Grok:")
            print(response_text)
        else:
            raise HTTPException(status_code=500, detail="Invalid MODEL_PROVIDER configured")

        try:
            normalized = extract_json(response_text)
        except json.JSONDecodeError:
            print("asdasdsa")
            raise HTTPException(
                status_code=502,
                detail=f"Model returned invalid JSON: {response_text}"
            )

        return normalized

    except Exception as e:
        print("zxoicxiohcxzihcxzhio")
        raise HTTPException(status_code=500, detail=str(e))
