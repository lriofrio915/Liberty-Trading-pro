from ib_insync import IB, Stock, Forex, Contract, MarketOrder, LimitOrder
from typing import Optional


class IBKRService:
    def __init__(self, host: str, port: int, client_id: int = 1):
        self.host = host
        self.port = port
        self.client_id = client_id
        self.ib = IB()

    async def connect(self) -> None:
        await self.ib.connectAsync(self.host, self.port, clientId=self.client_id, timeout=10)

    async def disconnect(self) -> None:
        self.ib.disconnect()

    def _is_connected(self) -> bool:
        return self.ib.isConnected()

    async def get_account(self) -> dict:
        summary = await self.ib.reqAccountSummaryAsync()
        result = {}
        for item in summary:
            result[item.tag] = item.value
        return result

    async def get_positions(self) -> list:
        positions = await self.ib.reqPositionsAsync()
        return [
            {
                "symbol": p.contract.symbol,
                "secType": p.contract.secType,
                "quantity": p.position,
                "avgCost": p.avgCost,
                "account": p.account,
            }
            for p in positions
        ]

    async def get_quote(self, symbol: str) -> dict:
        contract = Stock(symbol, "SMART", "USD")
        self.ib.qualifyContracts(contract)
        ticker = self.ib.reqMktData(contract, "", False, False)
        await self.ib.sleep(2)
        return {
            "symbol": symbol,
            "bid": ticker.bid,
            "ask": ticker.ask,
            "last": ticker.last,
        }

    async def place_order(
        self,
        symbol: str,
        side: str,
        quantity: int,
        order_type: str = "market",
        price: Optional[float] = None,
    ) -> dict:
        contract = Stock(symbol, "SMART", "USD")
        self.ib.qualifyContracts(contract)

        action = "BUY" if side.upper() == "BUY" else "SELL"
        if order_type.lower() == "limit" and price is not None:
            order = LimitOrder(action, quantity, price)
        else:
            order = MarketOrder(action, quantity)

        trade = self.ib.placeOrder(contract, order)
        await self.ib.sleep(1)
        return {
            "orderId": trade.order.orderId,
            "status": trade.orderStatus.status,
            "symbol": symbol,
            "side": action,
            "quantity": quantity,
        }

    async def cancel_order(self, order_id: int) -> dict:
        orders = self.ib.orders()
        for o in orders:
            if o.orderId == order_id:
                self.ib.cancelOrder(o)
                return {"cancelled": True, "orderId": order_id}
        return {"cancelled": False, "error": "Order not found"}
