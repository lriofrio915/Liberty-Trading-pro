from fastapi import APIRouter, Depends
import asyncpg
import os

from main import verify_token

router = APIRouter(dependencies=[Depends(verify_token)])

DATABASE_URL = os.getenv("DATABASE_URL", "")


@router.get("/history/{user_id}")
async def trade_history(user_id: str, limit: int = 50):
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        rows = await conn.fetch(
            """
            SELECT id, "userId", "brokerType", symbol, side, volume, quantity,
                   "orderType", price, "brokerTicket", status, "filledPrice",
                   "errorMessage", "signalSource", "signalData", "executedAt"
            FROM "BrokerTrade"
            WHERE "userId" = $1
            ORDER BY "executedAt" DESC
            LIMIT $2
            """,
            user_id,
            limit,
        )
        return [dict(r) for r in rows]
    finally:
        await conn.close()
