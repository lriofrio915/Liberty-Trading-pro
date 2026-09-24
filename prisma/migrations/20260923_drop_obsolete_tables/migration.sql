-- Tablas obsoletas tras retirar Opciones, Laboratorio Quant (Vibe), MT5 y los
-- monitores de sesgo intradía. Aplicada en producción el 2026-09-23.
-- Respaldo JSON en Liberty-Trading-pro-db-backups/2026-09-23.
DROP TABLE IF EXISTS "OptionRecommendation";
DROP TABLE IF EXISTS "VibeMessage";
DROP TABLE IF EXISTS "SesgoIntradayLog";
DROP TABLE IF EXISTS "SignalQueue";
