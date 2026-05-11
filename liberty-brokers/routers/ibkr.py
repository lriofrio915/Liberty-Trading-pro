from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address

from main import verify_token
from services.db_service import get_broker_connection, save_trade
from services.ibkr_service import IBKRService

router = APIRouter(dependencies=[Depends(verify_token)])
limiter = Limiter(key_func=get_remote_address)


async def _get_ibkr(user_id: str) -> tuple[IBKRService, dict]:
    conn = await get_broker_connection(user_id, "ibkr")
    if not conn:
        raise HTTPException(status_code=404, detail="No IBKR connection configured")
    svc = IBKRService(
        conn.get("ibkrHost", "127.0.0.1"),
        conn.get("ibkrPort", 7497),
        conn.get("ibkrClientId", 1),
    )
    try:
        await svc.connect()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Cannot connect to IBKR: {e}")
    return svc, conn


@router.get("/status/{user_id}")
async def ibkr_status(user_id: str):
    conn = await get_broker_connection(user_id, "ibkr")
    if not conn:
        raise HTTPException(status_code=404, detail="No IBKR connection configured")
    svc = IBKRService(
        conn.get("ibkrHost", "127.0.0.1"),
        conn.get("ibkrPort", 7497),
        conn.get("ibkrClientId", 1),
    )
    try:
        await svc.connect()
        connected = svc._is_connected()
        await svc.disconnect()
        return {"connected": connected, "host": conn.get("ibkrHost"), "port": conn.get("ibkrPort")}
    except Exception as e:
        return {"connected": False, "error": str(e)}


@router.get("/account/{user_id}")
async def ibkr_account(user_id: str):
    svc, _ = await _get_ibkr(user_id)
    try:
        result = await svc.get_account()
        await svc.disconnect()
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/positions/{user_id}")
async def ibkr_positions(user_id: str):
    svc, _ = await _get_ibkr(user_id)
    try:
        result = await svc.get_positions()
        await svc.disconnect()
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/quote/{user_id}/{symbol}")
async def ibkr_quote(user_id: str, symbol: str):
    svc, _ = await _get_ibkr(user_id)
    try:
        result = await svc.get_quote(symbol)
        await svc.disconnect()
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


class IBKROrderBody(BaseModel):
    user_id: str
    symbol: str
    side: str
    quantity: int
    order_type: str = "market"
    price: Optional[float] = None
    signal_source: Optional[str] = None
    signal_data: Optional[dict] = None


@router.post("/order")
@limiter.limit("10/minute")
async def ibkr_order(request: Request, body: IBKROrderBody):
    svc, conn = await _get_ibkr(body.user_id)
    max_val = conn.get("maxOrderValueUsd", 1000)
    try:
        quote = await svc.get_quote(body.symbol)
        ask = quote.get("ask") or quote.get("last") or 0
        est_value = body.quantity * ask
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
            body.quantity,
            body.order_type,
            body.price,
        )
        await save_trade(body.user_id, conn["id"], "ibkr", body.dict(), result)
        await svc.disconnect()
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.delete("/order/{user_id}/{order_id}")
async def ibkr_cancel_order(user_id: str, order_id: int):
    svc, _ = await _get_ibkr(user_id)
    try:
        result = await svc.cancel_order(order_id)
        await svc.disconnect()
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
