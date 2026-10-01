-- Posts diarios generados en el VPS y aprobados por Luis desde WhatsApp (feat/social-autopost).
-- Ejecutar ANTES de desplegar el código que usa la tabla.
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
