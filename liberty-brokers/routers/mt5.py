from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address

from main import verify_token
from services.db_service import (
    get_broker_connection,
    save_broker_connection,
    save_trade,
    update_broker_status,
)
from services.mt5_service import MT5Service

router = APIRouter(dependencies=[Depends(verify_token)])
limiter = Limiter(key_func=get_remote_address)


async def _get_mt5(user_id: str) -> tuple[MT5Service, dict]:
    conn = await get_broker_connection(user_id, "mt5")
    if not conn:
        raise HTTPException(status_code=404, detail="No MT5 connection configured")
    if not conn.get("mt5TunnelUrl") or not conn.get("mt5AuthToken"):
        raise HTTPException(status_code=400, detail="MT5 connection incomplete")
    svc = MT5Service(conn["mt5TunnelUrl"], conn["mt5AuthToken"])
    return svc, conn


@router.get("/status/{user_id}")
async def mt5_status(user_id: str):
    svc, conn = await _get_mt5(user_id)
    try:
        info = await svc.get_status()
        await update_broker_status(user_id, "mt5", "connected", str(info.get("login", "")))
        return {"connected": True, "info": info}
    except Exception as e:
        await update_broker_status(user_id, "mt5", "disconnected")
        raise HTTPException(status_code=502, detail=f"MT5 unreachable: {e}")


@router.get("/account/{user_id}")
async def mt5_account(user_id: str):
    svc, _ = await _get_mt5(user_id)
    try:
        return await svc.get_account()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/positions/{user_id}")
async def mt5_positions(user_id: str):
    svc, _ = await _get_mt5(user_id)
    try:
        return await svc.get_positions()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/quote/{user_id}/{symbol}")
async def mt5_quote(user_id: str, symbol: str):
    svc, _ = await _get_mt5(user_id)
    try:
        return await svc.get_quote(symbol)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


class MT5OrderBody(BaseModel):
    user_id: str
    symbol: str
    side: str
    volume: float
    order_type: str = "market"
    price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    signal_source: Optional[str] = None
    signal_data: Optional[dict] = None


@router.post("/order")
@limiter.limit("10/minute")
async def mt5_order(request: Request, body: MT5OrderBody):
    svc, conn = await _get_mt5(body.user_id)

    max_val = conn.get("maxOrderValueUsd", 1000)
    try:
        quote = await svc.get_quote(body.symbol)
        ask = quote.get("ask") or quote.get("price") or 0
        est_value = body.volume * ask * 100000
        if est_value > max_val:
            raise HTTPException(
                status_code=400,
                detail=f"Order value ${est_value:.0f} exceeds max ${max_val}",
            )
    except HTTPException:
        raise
    except Exception:
        pass

    try:
        result = await svc.place_order(
            body.symbol,
            body.side,
            body.volume,
            body.order_type,
            body.price,
            body.stop_loss,
            body.take_profit,
        )
        await save_trade(
            body.user_id,
            conn["id"],
            "mt5",
            body.dict(),
            result,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/close/{user_id}/{ticket}")
async def mt5_close(user_id: str, ticket: str):
    svc, _ = await _get_mt5(user_id)
    try:
        return await svc.close_position(ticket)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


class MT5ConfigureBody(BaseModel):
    user_id: str
    tunnel_url: str
    auth_token: str


@router.post("/configure")
async def mt5_configure(body: MT5ConfigureBody):
    saved = await save_broker_connection(
        body.user_id,
        "mt5",
        {
            "mt5TunnelUrl": body.tunnel_url,
            "mt5AuthToken": body.auth_token,
            "isActive": False,
            "lastStatus": "configured",
        },
    )
    return {"ok": True, "id": saved["id"]}
