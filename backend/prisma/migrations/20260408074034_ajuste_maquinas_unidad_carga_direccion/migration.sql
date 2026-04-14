/*
  Warnings:

  - You are about to drop the column `cargaRefrigerante` on the `maquinas` table. All the data in the column will be lost.
  - You are about to drop the column `cargaRefrigeranteUnidad` on the `maquinas` table. All the data in the column will be lost.
  - You are about to drop the column `refrigerante` on the `maquinas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "maquinas" DROP COLUMN "cargaRefrigerante",
DROP COLUMN "cargaRefrigeranteUnidad",
DROP COLUMN "refrigerante",
ADD COLUMN     "direccionExacta" TEXT,
ADD COLUMN     "unidadMedidaCargaId" INTEGER;

-- CreateTable
CREATE TABLE "unidades_medida_carga" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_medida_carga_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unidades_medida_carga_codigo_key" ON "unidades_medida_carga"("codigo");

-- AddForeignKey
ALTER TABLE "maquinas" ADD CONSTRAINT "maquinas_unidadMedidaCargaId_fkey" FOREIGN KEY ("unidadMedidaCargaId") REFERENCES "unidades_medida_carga"("id") ON DELETE SET NULL ON UPDATE CASCADE;
