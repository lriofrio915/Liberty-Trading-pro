import httpx
from typing import Optional


class MT5Service:
    def __init__(self, tunnel_url: str, auth_token: str):
        self.base = tunnel_url.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json",
        }
        self.timeout = 15.0

    async def get_status(self) -> dict:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.get(f"{self.base}/info", headers=self.headers)
            r.raise_for_status()
            return r.json()

    async def get_account(self) -> dict:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.get(f"{self.base}/balance", headers=self.headers)
            r.raise_for_status()
            return r.json()

    async def get_positions(self) -> list:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.get(f"{self.base}/positions", headers=self.headers)
            r.raise_for_status()
            return r.json()

    async def get_quote(self, symbol: str) -> dict:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.get(f"{self.base}/symbols/{symbol}", headers=self.headers)
            r.raise_for_status()
            return r.json()

    async def place_order(
        self,
        symbol: str,
        side: str,
        volume: float,
        order_type: str = "market",
        price: Optional[float] = None,
        stop_loss: Optional[float] = None,
        take_profit: Optional[float] = None,
        comment: str = "Liberty",
    ) -> dict:
        payload: dict = {
            "symbol": symbol,
            "type": side.upper(),
            "volume": volume,
            "order_type": order_type,
            "comment": comment,
        }
        if price is not None:
            payload["price"] = price
        if stop_loss is not None:
            payload["stop_loss"] = stop_loss
        if take_profit is not None:
            payload["take_profit"] = take_profit

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.post(f"{self.base}/orders", headers=self.headers, json=payload)
            r.raise_for_status()
            return r.json()

    async def close_position(self, ticket: str) -> dict:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r = await client.post(
                f"{self.base}/positions/{ticket}/close", headers=self.headers
            )
            r.raise_for_status()
            return r.json()
