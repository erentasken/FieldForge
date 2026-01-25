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

@app.post("/api/normalize")
async def normalize(request: NormalizeRequest):
    try: 
        df = pd.DataFrame(request.data)
        fields_str = df.to_csv(index=False)

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid input data: {str(e)}")

    prompt_messages = [
        {
            "role": "system",
            "content": "You are a medical data normalization API in Germany. Output only valid JSON."
        },
        {
            "role": "user",
            "content": f"""
    
            Return ONLY valid JSON.

            Format:
            {{
            "original_field_name": {{
                "primary": "normalized_name",
                "alternatives": ["alt_name_1", "alt_name_2"]
            }}
            }}

            Rules:
            - Use snake_case
            - Keep medical terminology accurate
            - Primary = most common/standard term
            - Alternatives = synonyms or related terms, different than Primary

            Fields:
            {fields_str}
            """
        }
    ]
    print(prompt_messages)



    try:
        if MODEL_PROVIDER == "hf":
            reply = hf_client.chat_completion(prompt_messages, max_tokens=700)
            response_text = reply.choices[0].message.content

        elif MODEL_PROVIDER == "grok":
            completion = grok_client.chat.completions.create(
                model="grok-4-1-fast-non-reasoning",
                messages=prompt_messages,
                temperature=0
            )
            response_text = completion.choices[0].message.content.strip()
            print(response_text)
        else:
            raise HTTPException(status_code=500, detail="Invalid MODEL_PROVIDER configured")

        try:
            normalized = json.loads(response_text)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=502,
                detail=f"Model returned invalid JSON: {response_text}"
            )

        return normalized

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
