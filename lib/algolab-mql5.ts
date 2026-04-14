// lib/algolab-mql5.ts
// Generador de código MQL5 para MetaTrader 5

import type { StrategyRule } from './algolab-backtest'

interface StrategyForExport {
  name: string
  description?: string
  rules: StrategyRule
  indicators: Record<string, unknown>
}

function datasetInfo(strategy: { name: string; indicators: Record<string, unknown> }) {
  const inds = strategy.indicators as Record<string, unknown>
  const selected = (inds.selected as string[]) ?? []
  return selected
}

function indicatorDeclarations(indicatorIds: string[]): string {
  const lines: string[] = []
  if (indicatorIds.includes('EMA') || indicatorIds.includes('SMA') || indicatorIds.includes('WMA')) {
    lines.push('int    maHandle;')
  }
  if (indicatorIds.includes('RSI')) {
    lines.push('int    rsiHandle;')
  }
  if (indicatorIds.includes('MACD')) {
    lines.push('int    macdHandle;')
  }
  if (indicatorIds.includes('ATR')) {
    lines.push('int    atrHandle;')
  }
  if (indicatorIds.includes('BB')) {
    lines.push('int    bbHandle;')
  }
  if (indicatorIds.includes('ADX')) {
    lines.push('int    adxHandle;')
  }
  if (indicatorIds.includes('STOCH')) {
    lines.push('int    stochHandle;')
  }
  return lines.join('\n')
}

function indicatorInit(indicatorIds: string[]): string {
  const lines: string[] = []
  if (indicatorIds.includes('EMA')) {
    lines.push('   maHandle = iMA(_Symbol, PERIOD_CURRENT, MA_Period, 0, MODE_EMA, PRICE_CLOSE);')
    lines.push('   if(maHandle == INVALID_HANDLE) return(INIT_FAILED);')
  } else if (indicatorIds.includes('SMA')) {
    lines.push('   maHandle = iMA(_Symbol, PERIOD_CURRENT, MA_Period, 0, MODE_SMA, PRICE_CLOSE);')
    lines.push('   if(maHandle == INVALID_HANDLE) return(INIT_FAILED);')
  }
  if (indicatorIds.includes('RSI')) {
    lines.push('   rsiHandle = iRSI(_Symbol, PERIOD_CURRENT, RSI_Period, PRICE_CLOSE);')
    lines.push('   if(rsiHandle == INVALID_HANDLE) return(INIT_FAILED);')
  }
  if (indicatorIds.includes('MACD')) {
    lines.push('   macdHandle = iMACD(_Symbol, PERIOD_CURRENT, MACD_Fast, MACD_Slow, MACD_Signal, PRICE_CLOSE);')
    lines.push('   if(macdHandle == INVALID_HANDLE) return(INIT_FAILED);')
  }
  if (indicatorIds.includes('ATR')) {
    lines.push('   atrHandle = iATR(_Symbol, PERIOD_CURRENT, ATR_Period);')
    lines.push('   if(atrHandle == INVALID_HANDLE) return(INIT_FAILED);')
  }
  if (indicatorIds.includes('BB')) {
    lines.push('   bbHandle = iBands(_Symbol, PERIOD_CURRENT, BB_Period, 0, BB_Deviation, PRICE_CLOSE);')
    lines.push('   if(bbHandle == INVALID_HANDLE) return(INIT_FAILED);')
  }
  return lines.join('\n')
}

function indicatorBuffers(indicatorIds: string[]): string {
  const lines: string[] = []
  if (indicatorIds.includes('EMA') || indicatorIds.includes('SMA') || indicatorIds.includes('WMA')) {
    lines.push('   double maBuffer[]; CopyBuffer(maHandle, 0, 0, 3, maBuffer); ArraySetAsSeries(maBuffer, true);')
  }
  if (indicatorIds.includes('RSI')) {
    lines.push('   double rsiBuffer[]; CopyBuffer(rsiHandle, 0, 0, 3, rsiBuffer); ArraySetAsSeries(rsiBuffer, true);')
  }
  if (indicatorIds.includes('MACD')) {
    lines.push('   double macdBuffer[], signalBuffer[];')
    lines.push('   CopyBuffer(macdHandle, 0, 0, 3, macdBuffer); ArraySetAsSeries(macdBuffer, true);')
    lines.push('   CopyBuffer(macdHandle, 1, 0, 3, signalBuffer); ArraySetAsSeries(signalBuffer, true);')
  }
  if (indicatorIds.includes('ATR')) {
    lines.push('   double atrBuffer[]; CopyBuffer(atrHandle, 0, 0, 3, atrBuffer); ArraySetAsSeries(atrBuffer, true);')
  }
  if (indicatorIds.includes('BB')) {
    lines.push('   double bbUpper[], bbLower[], bbMid[];')
    lines.push('   CopyBuffer(bbHandle, 1, 0, 3, bbUpper); ArraySetAsSeries(bbUpper, true);')
    lines.push('   CopyBuffer(bbHandle, 2, 0, 3, bbLower); ArraySetAsSeries(bbLower, true);')
    lines.push('   CopyBuffer(bbHandle, 0, 0, 3, bbMid);   ArraySetAsSeries(bbMid, true);')
  }
  return lines.join('\n')
}

function entryConditionMQL5(rule: StrategyRule): string {
  const entry = rule.entry
  let cond = ''

  const indMap: Record<string, string> = {
    'RSI_14': 'rsiBuffer[1]',
    'EMA_20': 'maBuffer[1]',
    'SMA_20': 'maBuffer[1]',
    'MACD.macd': 'macdBuffer[1]',
    'MACD.signal': 'signalBuffer[1]',
    'MACD.histogram': '(macdBuffer[1] - signalBuffer[1])',
    'BB.upper': 'bbUpper[1]',
    'BB.lower': 'bbLower[1]',
    'BB.middle': 'bbMid[1]',
    'ATR_14': 'atrBuffer[1]',
  }

  const lhs = indMap[entry.indicator] ?? '0'
  const rhs = typeof entry.value === 'string' ? (indMap[entry.value] ?? '0') : entry.value.toString()

  switch (entry.operator) {
    case '>':          cond = `${lhs} > ${rhs}`; break
    case '<':          cond = `${lhs} < ${rhs}`; break
    case '>=':         cond = `${lhs} >= ${rhs}`; break
    case '<=':         cond = `${lhs} <= ${rhs}`; break
    case 'cross_above': {
      const lhsPrev = lhs.replace('[1]', '[2]')
      const rhsPrev = rhs.includes('[1]') ? rhs.replace('[1]', '[2]') : rhs
      cond = `${lhsPrev} < ${rhsPrev} && ${lhs} >= ${rhs}`
      break
    }
    case 'cross_below': {
      const lhsPrev = lhs.replace('[1]', '[2]')
      const rhsPrev = rhs.includes('[1]') ? rhs.replace('[1]', '[2]') : rhs
      cond = `${lhsPrev} > ${rhsPrev} && ${lhs} <= ${rhs}`
      break
    }
    default: cond = 'false'
  }

  return cond
}



export function generateEA(strategy: StrategyForExport, symbol: string, timeframe: string): string {
  const indicatorIds = datasetInfo(strategy)
  const slV = (strategy.indicators as Record<string, unknown>).sl ?? strategy.rules.sl.value
  const tpV = (strategy.indicators as Record<string, unknown>).tp ?? strategy.rules.tp.value
  const entryCond = entryConditionMQL5(strategy.rules)
  const hasATR = indicatorIds.includes('ATR') || strategy.rules.sl.type === 'atr_multiplier'
  if (hasATR && !indicatorIds.includes('ATR')) indicatorIds.push('ATR')

  return `//+------------------------------------------------------------------+
//| EA generado por Liberty Trading Pro AlgoLab                     |
//| Estrategia: ${strategy.name.padEnd(48, ' ')}|
//| Activo: ${symbol.padEnd(7)} | Timeframe: ${timeframe.padEnd(3)} | ${new Date().toISOString().slice(0, 10)} |
//+------------------------------------------------------------------+
#property copyright "Liberty Trading Pro"
#property version   "1.00"
#property strict
#include <Trade/Trade.mqh>

//--- Parámetros de entrada
input double   RiskPct      = 2.0;       // % de cuenta por trade
input int      MA_Period    = 20;        // Período de media móvil
input int      RSI_Period   = 14;        // Período RSI
input int      MACD_Fast    = 12;        // MACD período rápido
input int      MACD_Slow    = 26;        // MACD período lento
input int      MACD_Signal  = 9;        // MACD señal
input int      ATR_Period   = 14;        // Período ATR
input int      BB_Period    = 20;        // Período Bollinger Bands
input double   BB_Deviation = 2.0;      // Desviación Bollinger Bands
input double   SL_ATR_Mult  = ${slV};       // Multiplicador ATR para SL
input double   TP_ATR_Mult  = ${tpV};       // Multiplicador ATR para TP
input int      MagicNumber  = 20250101;  // Número mágico del EA

//--- Variables globales
CTrade  trade;
${indicatorDeclarations(indicatorIds)}
datetime lastBarTime = 0;

//+------------------------------------------------------------------+
//| Inicialización                                                     |
//+------------------------------------------------------------------+
int OnInit()
{
   trade.SetExpertMagicNumber(MagicNumber);
   trade.SetDeviationInPoints(10);

${indicatorInit(indicatorIds)}

   Print("EA inicializado: ${strategy.name}");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Desinicialización                                                  |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   IndicatorRelease(maHandle);
   if(rsiHandle   != 0) IndicatorRelease(rsiHandle);
   if(macdHandle  != 0) IndicatorRelease(macdHandle);
   if(atrHandle   != 0) IndicatorRelease(atrHandle);
   if(bbHandle    != 0) IndicatorRelease(bbHandle);
}

//+------------------------------------------------------------------+
//| Tick principal                                                     |
//+------------------------------------------------------------------+
void OnTick()
{
   // Ejecutar solo en nueva vela
   datetime currentBarTime = iTime(_Symbol, PERIOD_CURRENT, 0);
   if(currentBarTime == lastBarTime) return;
   lastBarTime = currentBarTime;

   // Copiar buffers de indicadores
${indicatorBuffers(indicatorIds)}

   // Verificar que no hay posición abierta
   if(PositionsTotal() > 0) return;

   double Ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double Bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);

   //--- Condición de entrada: ${strategy.description ?? ''}
   bool entrySignal = (${entryCond});

   if(entrySignal)
   {
      double atrVal = ${indicatorIds.includes('ATR') ? 'atrBuffer[1]' : 'Ask * 0.001'};
      double slPoints = atrVal * SL_ATR_Mult;
      double tpPoints = atrVal * TP_ATR_Mult;

      // Calcular lote según riesgo
      double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
      double riskAmount     = accountBalance * RiskPct / 100.0;
      double tickValue      = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
      double tickSize       = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
      double lotStep        = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
      double lotMin         = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
      double lots           = 0;

      if(tickValue > 0 && tickSize > 0 && slPoints > 0)
         lots = riskAmount / (slPoints / tickSize * tickValue);

      lots = MathMax(MathFloor(lots / lotStep) * lotStep, lotMin);

${strategy.rules.direction === 'short' ? `
      // Entrada SHORT
      double sl = Bid + slPoints;
      double tp = Bid - tpPoints;
      trade.Sell(lots, _Symbol, Bid, sl, tp, "${strategy.name}");
` : `
      // Entrada LONG
      double sl = Ask - slPoints;
      double tp = Ask + tpPoints;
      trade.Buy(lots, _Symbol, Ask, sl, tp, "${strategy.name}");
`}
   }
}
//+------------------------------------------------------------------+
`
}
