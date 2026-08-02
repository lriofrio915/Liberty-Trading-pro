from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

load_dotenv()

from routers import ibkr, trades

LIBERTY_INTERNAL_TOKEN = os.getenv("LIBERTY_INTERNAL_TOKEN", "")
VERCEL_URL = os.getenv("VERCEL_URL", "")
NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "")

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Liberty Brokers Service", version="1.0.0")

app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"error": "Rate limit exceeded: max 10 orders per minute"},
    )

allowed_origins = [o for o in [VERCEL_URL, NODE_BACKEND_URL] if o]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def verify_token(request: Request):
    token = request.headers.get("X-Liberty-Token", "")
    if not LIBERTY_INTERNAL_TOKEN or token != LIBERTY_INTERNAL_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")


app.include_router(ibkr.router, prefix="/api/ibkr", tags=["IBKR"])
app.include_router(trades.router, prefix="/api/trades", tags=["Trades"])


@app.get("/health")
async def health():
    return {"status": "ok"}
