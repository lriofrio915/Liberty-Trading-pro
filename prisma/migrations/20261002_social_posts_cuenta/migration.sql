-- Cuenta de destino de cada post: 'liberty' (IG @liberty_trading_club + FB Liberty) o
-- 'luis' (IG @luisriofrioec + FB Luis Riofrío Trader Cuantitativo). Aditiva: los existentes quedan en 'liberty'.
ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "cuenta" TEXT NOT NULL DEFAULT 'liberty';
