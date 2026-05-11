import os
import asyncpg
from typing import Optional
from services.crypto_service import encrypt, decrypt

DATABASE_URL = os.getenv("DATABASE_URL", "")


async def _get_conn():
    return await asyncpg.connect(DATABASE_URL)


async def get_broker_connection(user_id: str, broker_type: str) -> Optional[dict]:
    conn = await _get_conn()
    try:
        row = await conn.fetchrow(
            """
            SELECT id, "userId", "brokerType", "mt5TunnelUrl", "mt5AuthToken",
                   "mt5AccountNumber", "ibkrHost", "ibkrPort", "ibkrClientId",
                   "ibkrAccountId", "isActive", "lastStatus", "maxOrderValueUsd"
            FROM "BrokerConnection"
            WHERE "userId" = $1 AND "brokerType" = $2
            """,
            user_id,
            broker_type,
        )
        if row is None:
            return None
        data = dict(row)
        # Decrypt token if present
        if data.get("mt5AuthToken"):
            try:
                data["mt5AuthToken"] = decrypt(data["mt5AuthToken"])
            except Exception:
                data["mt5AuthToken"] = None
        return data
    finally:
        await conn.close()


async def save_broker_connection(user_id: str, broker_type: str, data: dict) -> dict:
    conn = await _get_conn()
    try:
        # Encrypt token before storing
        raw_token = data.get("mt5AuthToken")
        encrypted_token = encrypt(raw_token) if raw_token else None

        row = await conn.fetchrow(
            """
            INSERT INTO "BrokerConnection"
              (id, "userId", "brokerType", "mt5TunnelUrl", "mt5AuthToken", "mt5AccountNumber",
               "ibkrHost", "ibkrPort", "ibkrClientId", "ibkrAccountId",
               "isActive", "lastStatus", "maxOrderValueUsd", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
            ON CONFLICT ("userId", "brokerType")
            DO UPDATE SET
              "mt5TunnelUrl" = EXCLUDED."mt5TunnelUrl",
              "mt5AuthToken" = COALESCE(EXCLUDED."mt5AuthToken", "BrokerConnection"."mt5AuthToken"),
              "mt5AccountNumber" = EXCLUDED."mt5AccountNumber",
              "ibkrHost" = EXCLUDED."ibkrHost",
              "ibkrPort" = EXCLUDED."ibkrPort",
              "ibkrClientId" = EXCLUDED."ibkrClientId",
              "ibkrAccountId" = EXCLUDED."ibkrAccountId",
              "isActive" = EXCLUDED."isActive",
              "lastStatus" = EXCLUDED."lastStatus",
              "updatedAt" = NOW()
            RETURNING id, "userId", "brokerType", "isActive", "lastStatus"
            """,
            user_id,
            broker_type,
            data.get("mt5TunnelUrl"),
            encrypted_token,
            data.get("mt5AccountNumber"),
            data.get("ibkrHost"),
            data.get("ibkrPort"),
            data.get("ibkrClientId", 1),
            data.get("ibkrAccountId"),
            data.get("isActive", False),
            data.get("lastStatus", "disconnected"),
            data.get("maxOrderValueUsd", 1000.0),
        )
        return dict(row)
    finally:
        await conn.close()


async def update_broker_status(
    user_id: str, broker_type: str, status: str, account_number: Optional[str] = None
) -> None:
    conn = await _get_conn()
    try:
        await conn.execute(
            """
            UPDATE "BrokerConnection"
            SET "lastStatus" = $3,
                "isActive" = ($3 = 'connected'),
                "lastConnectedAt" = CASE WHEN $3 = 'connected' THEN NOW() ELSE "lastConnectedAt" END,
                "mt5AccountNumber" = COALESCE($4, "mt5AccountNumber"),
                "updatedAt" = NOW()
            WHERE "userId" = $1 AND "brokerType" = $2
            """,
            user_id,
            broker_type,
            status,
            account_number,
        )
    finally:
        await conn.close()


async def save_trade(
    user_id: str,
    broker_connection_id: str,
    broker_type: str,
    order: dict,
    result: dict,
) -> None:
    conn = await _get_conn()
    try:
        import json

        await conn.execute(
            """
            INSERT INTO "BrokerTrade"
              (id, "userId", "brokerConnectionId", "brokerType", symbol, side,
               volume, quantity, "orderType", price, "brokerTicket", status,
               "filledPrice", "errorMessage", "signalSource", "signalData", "executedAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, NOW())
            """,
            user_id,
            broker_connection_id,
            broker_type,
            order.get("symbol"),
            order.get("side"),
            order.get("volume"),
            order.get("quantity"),
            order.get("orderType", "market"),
            order.get("price"),
            str(result.get("ticket") or result.get("orderId") or ""),
            result.get("status", "filled"),
            result.get("filledPrice") or result.get("filled_price"),
            result.get("error"),
            order.get("signalSource"),
            json.dumps(order.get("signalData")) if order.get("signalData") else None,
        )
    finally:
        await conn.close()
