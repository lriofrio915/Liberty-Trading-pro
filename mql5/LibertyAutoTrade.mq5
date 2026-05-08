//+------------------------------------------------------------------+
//|  LibertyAutoTrade.mq5                                            |
//|  Liberty Trading Pro — Auto-Trade EA                             |
//|  Polls /api/mt5/pending-signals every 60 seconds.                |
//|  Executes BUY/SELL orders from Liberty Trading market scan.      |
//+------------------------------------------------------------------+
#property copyright "Liberty Trading Pro"
#property version   "1.0"
#property strict

#include <Trade\Trade.mqh>

//--- Input parameters (configure per user in EA Properties)
input string InpAppUrl    = "https://libertytrading.pro"; // App URL (no trailing slash)
input string InpEaSecret  = "";                            // MT5 EA Secret (from dashboard)
input int    InpPollSec   = 60;                            // Poll interval (seconds)
input bool   InpLogVerbose = true;                         // Verbose logging

//--- Global state
CTrade trade;
int    timerCount = 0;
string lastError  = "";

//+------------------------------------------------------------------+
int OnInit() {
   if (InpEaSecret == "") {
      Alert("LibertyAutoTrade: MT5 EA Secret is empty. Configure in EA Properties.");
      return INIT_FAILED;
   }
   EventSetTimer(InpPollSec);
   Print("LibertyAutoTrade v1.0 started. App: ", InpAppUrl, " | Poll: every ", InpPollSec, "s");
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason) {
   EventKillTimer();
   Print("LibertyAutoTrade stopped. Reason: ", reason);
}

//+------------------------------------------------------------------+
void OnTimer() {
   timerCount++;
   if (InpLogVerbose) Print("LibertyAutoTrade: poll #", timerCount);
   FetchAndExecute();
}

//+------------------------------------------------------------------+
void FetchAndExecute() {
   string url    = InpAppUrl + "/api/mt5/pending-signals";
   string result = "";

   //--- Build headers
   string headers = "X-MT5-Secret: " + InpEaSecret + "\r\nContent-Type: application/json\r\n";

   char   postData[];
   char   respData[];
   string respHeaders;
   int    timeout = 10000; // 10s

   int httpCode = WebRequest("GET", url, headers, timeout, postData, respData, respHeaders);

   if (httpCode == -1) {
      int err = GetLastError();
      if (lastError != IntegerToString(err)) {
         Print("LibertyAutoTrade: WebRequest failed. Error: ", err,
               " — Make sure ", url, " is in MT5 allowed URLs (Tools > Options > Expert Advisors).");
         lastError = IntegerToString(err);
      }
      return;
   }
   lastError = "";

   if (httpCode != 200) {
      Print("LibertyAutoTrade: HTTP ", httpCode, " from pending-signals");
      return;
   }

   string jsonStr = CharArrayToString(respData, 0, WHOLE_ARRAY, CP_UTF8);
   if (StringFind(jsonStr, "\"signals\"") < 0) {
      if (InpLogVerbose) Print("LibertyAutoTrade: no signals in response");
      return;
   }

   // Parse signals array — simple JSON extraction
   // Format: {"signals":[{"id":"...","symbol":"NQ100","type":"BUY","volume":0.01,"entryPrice":21450,"sl":21343.75,"tp":21664.5,"comment":"Auto:..."}]}
   if (StringFind(jsonStr, "\"autoTradeEnabled\":false") >= 0) {
      if (InpLogVerbose) Print("LibertyAutoTrade: auto-trade disabled in dashboard");
      return;
   }

   // Count signals
   int signalCount = 0;
   int pos = 0;
   while ((pos = StringFind(jsonStr, "\"id\":", pos)) >= 0) {
      signalCount++;
      pos++;
   }

   if (signalCount == 0) {
      if (InpLogVerbose) Print("LibertyAutoTrade: 0 pending signals");
      return;
   }

   Print("LibertyAutoTrade: processing ", signalCount, " signal(s)");

   // Extract and execute each signal
   pos = 0;
   while (true) {
      int idStart = StringFind(jsonStr, "\"id\":\"", pos);
      if (idStart < 0) break;
      idStart += 6;
      int idEnd = StringFind(jsonStr, "\"", idStart);
      string signalId = StringSubstr(jsonStr, idStart, idEnd - idStart);

      string symbol   = ExtractStrField(jsonStr, "symbol", idStart);
      string type     = ExtractStrField(jsonStr, "type", idStart);
      double volume   = ExtractNumField(jsonStr, "volume", idStart);
      double sl       = ExtractNumField(jsonStr, "sl", idStart);
      double tp       = ExtractNumField(jsonStr, "tp", idStart);
      string comment  = ExtractStrField(jsonStr, "comment", idStart);

      pos = idEnd;

      if (symbol == "" || (type != "BUY" && type != "SELL")) continue;

      ExecuteSignal(signalId, symbol, type, volume, sl, tp, comment);
   }
}

//+------------------------------------------------------------------+
void ExecuteSignal(string signalId, string symbol, string type,
                   double volume, double sl, double tp, string comment) {

   ENUM_ORDER_TYPE orderType = (type == "BUY") ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;

   trade.SetExpertMagicNumber(20260507);
   trade.SetDeviationInPoints(20);

   bool success = false;
   int  ticket  = 0;
   double execPrice = 0;

   if (type == "BUY") {
      success = trade.Buy(volume, symbol, 0, sl, tp, comment);
   } else {
      success = trade.Sell(volume, symbol, 0, sl, tp, comment);
   }

   string status = "FAILED";
   string errMsg = "";

   if (success) {
      ticket    = (int)trade.ResultOrder();
      execPrice = trade.ResultPrice();
      status    = "EXECUTED";
      Print("LibertyAutoTrade: EXECUTED ", type, " ", volume, " ", symbol,
            " ticket=", ticket, " price=", execPrice);
   } else {
      errMsg = "Error " + IntegerToString(GetLastError()) + ": " + trade.ResultComment();
      Print("LibertyAutoTrade: FAILED ", type, " ", symbol, " — ", errMsg);
   }

   // Report back to Next.js
   ReportExecution(signalId, ticket, execPrice, status, errMsg);
}

//+------------------------------------------------------------------+
void ReportExecution(string signalId, int ticket, double execPrice,
                     string status, string errMsg) {

   string url = InpAppUrl + "/api/mt5/signal-executed";

   // Build JSON body
   string body = "{\"signalId\":\"" + signalId + "\"" +
                 ",\"ticket\":"     + IntegerToString(ticket) +
                 ",\"executedPrice\":" + DoubleToString(execPrice, 5) +
                 ",\"status\":\""   + status + "\"";
   if (errMsg != "") body += ",\"errorMsg\":\"" + errMsg + "\"";
   body += "}";

   string headers = "X-MT5-Secret: " + InpEaSecret +
                    "\r\nContent-Type: application/json\r\n";

   char   postData[];
   char   respData[];
   string respHeaders;
   StringToCharArray(body, postData, 0, StringLen(body));

   int httpCode = WebRequest("POST", url, headers, 10000, postData, respData, respHeaders);
   if (httpCode != 200) {
      Print("LibertyAutoTrade: report-back HTTP ", httpCode, " for signal ", signalId);
   }
}

//+------------------------------------------------------------------+
// Simple field extractors for flat JSON objects
string ExtractStrField(string json, string field, int fromPos) {
   string key = "\"" + field + "\":\"";
   int s = StringFind(json, key, fromPos);
   if (s < 0) return "";
   s += StringLen(key);
   int e = StringFind(json, "\"", s);
   if (e < 0) return "";
   return StringSubstr(json, s, e - s);
}

double ExtractNumField(string json, string field, int fromPos) {
   string key = "\"" + field + "\":";
   int s = StringFind(json, key, fromPos);
   if (s < 0) return 0;
   s += StringLen(key);
   // Read until , or }
   int e = s;
   while (e < StringLen(json)) {
      ushort c = StringGetCharacter(json, e);
      if (c == ',' || c == '}' || c == ']') break;
      e++;
   }
   return StringToDouble(StringSubstr(json, s, e - s));
}
