-- AlterTable
ALTER TABLE "maquinas" ADD COLUMN     "cargaRefrigeranteCantidad" DECIMAL(10,2),
ADD COLUMN     "cargaRefrigeranteUnidad" TEXT,
ADD COLUMN     "marcaId" INTEGER,
ADD COLUMN     "refrigeranteId" INTEGER,
ADD COLUMN     "tipoUnidadId" INTEGER;

-- AlterTable
ALTER TABLE "reportes" ADD COLUMN     "amperaje" TEXT,
ADD COLUMN     "maquinaId" INTEGER,
ADD COLUMN     "procedimientoId" INTEGER,
ADD COLUMN     "psi" TEXT,
ADD COLUMN     "tipoUnidadId" INTEGER;

-- AlterTable
ALTER TABLE "reportes_detalle_maquinas" ADD COLUMN     "descripcionActividadPdf" TEXT,
ADD COLUMN     "hallazgosTexto" TEXT,
ADD COLUMN     "procedimientoId" INTEGER,
ADD COLUMN     "tipoUnidadId" INTEGER,
ADD COLUMN     "tituloActividad" TEXT;

-- CreateTable
CREATE TABLE "tipos_unidad" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_unidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas_tipos_unidad" (
    "id" SERIAL NOT NULL,
    "tipoUnidadId" INTEGER NOT NULL,
    "marcaId" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marcas_tipos_unidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refrigerantes" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refrigerantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedimientos" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcionCompletaPdf" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procedimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hallazgos_catalogo" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hallazgos_catalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportes_detalle_hallazgos" (
    "id" SERIAL NOT NULL,
    "reporteDetalleMaquinaId" INTEGER NOT NULL,
    "hallazgoCatalogoId" INTEGER NOT NULL,
    "codigoHallazgo" TEXT,
    "descripcionHallazgo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reportes_detalle_hallazgos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipos_unidad_codigo_key" ON "tipos_unidad"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_unidad_nombre_key" ON "tipos_unidad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_nombre_key" ON "marcas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_tipos_unidad_tipoUnidadId_marcaId_key" ON "marcas_tipos_unidad"("tipoUnidadId", "marcaId");

-- CreateIndex
CREATE UNIQUE INDEX "refrigerantes_codigo_key" ON "refrigerantes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "procedimientos_codigo_key" ON "procedimientos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "hallazgos_catalogo_codigo_key" ON "hallazgos_catalogo"("codigo");

-- AddForeignKey
ALTER TABLE "marcas_tipos_unidad" ADD CONSTRAINT "marcas_tipos_unidad_tipoUnidadId_fkey" FOREIGN KEY ("tipoUnidadId") REFERENCES "tipos_unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marcas_tipos_unidad" ADD CONSTRAINT "marcas_tipos_unidad_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "marcas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquinas" ADD CONSTRAINT "maquinas_tipoUnidadId_fkey" FOREIGN KEY ("tipoUnidadId") REFERENCES "tipos_unidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquinas" ADD CONSTRAINT "maquinas_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "marcas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquinas" ADD CONSTRAINT "maquinas_refrigeranteId_fkey" FOREIGN KEY ("refrigeranteId") REFERENCES "refrigerantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "maquinas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_tipoUnidadId_fkey" FOREIGN KEY ("tipoUnidadId") REFERENCES "tipos_unidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "procedimientos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_detalle_maquinas" ADD CONSTRAINT "reportes_detalle_maquinas_tipoUnidadId_fkey" FOREIGN KEY ("tipoUnidadId") REFERENCES "tipos_unidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_detalle_maquinas" ADD CONSTRAINT "reportes_detalle_maquinas_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "procedimientos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_detalle_hallazgos" ADD CONSTRAINT "reportes_detalle_hallazgos_reporteDetalleMaquinaId_fkey" FOREIGN KEY ("reporteDetalleMaquinaId") REFERENCES "reportes_detalle_maquinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_detalle_hallazgos" ADD CONSTRAINT "reportes_detalle_hallazgos_hallazgoCatalogoId_fkey" FOREIGN KEY ("hallazgoCatalogoId") REFERENCES "hallazgos_catalogo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
