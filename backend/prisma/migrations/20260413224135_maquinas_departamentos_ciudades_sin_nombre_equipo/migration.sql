/*
  Warnings:

  - You are about to drop the column `nombreEquipo` on the `maquinas` table. All the data in the column will be lost.
  - You are about to drop the column `ubicacion` on the `maquinas` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[codigoInterno]` on the table `maquinas` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "maquinas" DROP COLUMN "nombreEquipo",
DROP COLUMN "ubicacion",
ADD COLUMN     "ciudadId" INTEGER,
ADD COLUMN     "departamentoId" INTEGER;

-- CreateTable
CREATE TABLE "departamentos" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciudades" (
    "id" SERIAL NOT NULL,
    "departamentoId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ciudades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_codigo_key" ON "departamentos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_nombre_key" ON "departamentos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ciudades_codigo_key" ON "ciudades"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ciudades_departamentoId_nombre_key" ON "ciudades"("departamentoId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "maquinas_codigoInterno_key" ON "maquinas"("codigoInterno");

-- AddForeignKey
ALTER TABLE "ciudades" ADD CONSTRAINT "ciudades_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquinas" ADD CONSTRAINT "maquinas_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquinas" ADD CONSTRAINT "maquinas_ciudadId_fkey" FOREIGN KEY ("ciudadId") REFERENCES "ciudades"("id") ON DELETE SET NULL ON UPDATE CASCADE;
