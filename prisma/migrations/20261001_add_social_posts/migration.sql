-- Posts diarios generados en el VPS y aprobados por Luis desde WhatsApp (feat/social-autopost).
-- Aplicada en producción el 2026-10-01 (Supabase liberty-trading-pro).
CREATE TABLE IF NOT EXISTS "social_posts" (
  "id"          TEXT PRIMARY KEY,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha"       TEXT NOT NULL,
  "pilar"       TEXT NOT NULL,
  "tema"        TEXT NOT NULL,
  "slides"      TEXT[] NOT NULL,
  "caption"     TEXT NOT NULL,
  "hashtags"    TEXT[] NOT NULL,
  "alt"         TEXT,
  "estado"      TEXT NOT NULL DEFAULT 'pendiente',
  "igMediaId"   TEXT,
  "igPermalink" TEXT,
  "fbPostId"    TEXT,
  "error"       TEXT,
  "decididoAt"  TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "social_posts_estado_createdAt_idx" ON "social_posts" ("estado", "createdAt");
-- RLS como el resto de tablas: bloquea la API pública de Supabase; Prisma (rol de servidor) no se ve afectado.
ALTER TABLE "social_posts" ENABLE ROW LEVEL SECURITY;
