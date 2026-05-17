"""
FinGPT inference service — FastAPI wrapper over FinGPT sentiment model.
Base: bigscience/bloom-7b1  (open access, no HF token required)
LoRA: FinGPT/fingpt-sentiment_bloom-7b1_lora
Model is cached to /cache on a Fly.io volume to survive restarts.
"""

import os
import re
import logging
from contextlib import asynccontextmanager
from typing import Optional

import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("fingpt")

CACHE_DIR = os.getenv("MODEL_CACHE_DIR", "/cache")
BASE_MODEL = "bigscience/bloom-7b1"
PEFT_MODEL = "FinGPT/fingpt-sentiment_bloom-7b1_lora"

_tokenizer: Optional[AutoTokenizer] = None
_model: Optional[PeftModel] = None

SENTIMENT_PROMPT = (
    "Instruction: What is the sentiment of this news? "
    "Please choose an answer from {{negative/neutral/positive}}.\n"
    "Input: {text}\n"
    "Answer: "
)

LABEL_TO_ES = {
    "positive": "positive",
    "neutral": "neutral",
    "negative": "negative",
}


def load_model():
    global _tokenizer, _model
    if _model is not None:
        return

    log.info("Loading tokenizer from %s ...", BASE_MODEL)
    _tokenizer = AutoTokenizer.from_pretrained(
        BASE_MODEL,
        cache_dir=CACHE_DIR,
        trust_remote_code=True,
    )

    use_gpu = torch.cuda.is_available()
    log.info("CUDA available: %s", use_gpu)

    log.info("Loading base model %s ...", BASE_MODEL)
    _model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        cache_dir=CACHE_DIR,
        trust_remote_code=True,
        torch_dtype=torch.float16 if use_gpu else torch.float32,
        load_in_4bit=use_gpu,       # 4-bit quantization when GPU present
        device_map="auto" if use_gpu else None,
    )

    log.info("Applying LoRA adapter %s ...", PEFT_MODEL)
    _model = PeftModel.from_pretrained(
        _model,
        PEFT_MODEL,
        cache_dir=CACHE_DIR,
    )
    _model.eval()
    log.info("FinGPT model ready.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
    yield


app = FastAPI(title="FinGPT Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class SentimentRequest(BaseModel):
    text: str


class SentimentResponse(BaseModel):
    label: str          # positive / negative / neutral
    score: float        # 0-100 confidence proxy
    reasoning: str
    keywords: list[str]


def _extract_label(generated: str) -> str:
    lower = generated.lower()
    for label in ("positive", "negative", "neutral"):
        if label in lower:
            return label
    return "neutral"


def _build_keywords(text: str) -> list[str]:
    financial_terms = [
        "bullish", "bearish", "surge", "plunge", "rally", "crash",
        "earnings", "profit", "loss", "revenue", "growth", "decline",
        "inflation", "rates", "fed", "gdp", "recession", "ipo",
        "bitcoin", "etf", "nasdaq", "sp500", "yield", "bond",
    ]
    words = re.findall(r'\w+', text.lower())
    return [w for w in financial_terms if w in words][:5]


@app.post("/sentiment", response_model=SentimentResponse)
async def sentiment(req: SentimentRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is required")

    prompt = SENTIMENT_PROMPT.format(text=req.text.strip()[:512])
    inputs = _tokenizer(prompt, return_tensors="pt")

    use_gpu = torch.cuda.is_available()
    if use_gpu:
        inputs = {k: v.cuda() for k, v in inputs.items()}

    with torch.no_grad():
        outputs = _model.generate(
            **inputs,
            max_new_tokens=10,
            do_sample=False,
            temperature=1.0,
            pad_token_id=_tokenizer.eos_token_id,
        )

    prompt_len = inputs["input_ids"].shape[1]
    generated = _tokenizer.decode(
        outputs[0][prompt_len:], skip_special_tokens=True
    ).strip()

    label = _extract_label(generated)
    keywords = _build_keywords(req.text)

    # Proxy confidence score based on keyword density
    kw_count = len(keywords)
    score = min(95.0, 60.0 + kw_count * 7.0)

    reasoning_map = {
        "positive": "El texto presenta señales alcistas o perspectivas favorables para el activo/mercado mencionado.",
        "negative": "El texto contiene señales bajistas o información desfavorable que podría presionar a la baja el precio.",
        "neutral":  "El texto es informativo o descriptivo sin sesgo claro de mercado.",
    }

    return SentimentResponse(
        label=label,
        score=round(score, 1),
        reasoning=reasoning_map[label],
        keywords=keywords,
    )


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": _model is not None}
