-- CreateTable
CREATE TABLE "ProviderLogo" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderLogo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderLogo_provider_key" ON "ProviderLogo"("provider");
