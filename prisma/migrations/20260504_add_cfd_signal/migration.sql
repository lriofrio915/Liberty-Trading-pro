-- CreateTable
CREATE TABLE IF NOT EXISTS "CfdSignal" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "simbolo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "sesgo" TEXT NOT NULL,
    "confianza" INTEGER NOT NULL,
    "razon" TEXT NOT NULL,
    "precioEntrada" DOUBLE PRECISION NOT NULL,
    "stopLoss" DOUBLE PRECISION NOT NULL,
    "takeProfit" DOUBLE PRECISION NOT NULL,
    "lotaje" DOUBLE PRECISION NOT NULL,
    "riesgoUsd" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "rrRatio" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "riskProfile" TEXT NOT NULL DEFAULT 'moderado',
    "farosSesgo" TEXT,
    "farosRegimen" TEXT,
    "psiScore" DOUBLE PRECISION,
    "killSwitch" BOOLEAN NOT NULL DEFAULT false,
    "resultado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "pnlUsd" DOUBLE PRECISION,
    "closedAt" TIMESTAMP(3),
    "closedPrice" DOUBLE PRECISION,

    CONSTRAINT "CfdSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CfdSignal_createdAt_idx" ON "CfdSignal"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CfdSignal_simbolo_createdAt_idx" ON "CfdSignal"("simbolo", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CfdSignal_resultado_idx" ON "CfdSignal"("resultado");
