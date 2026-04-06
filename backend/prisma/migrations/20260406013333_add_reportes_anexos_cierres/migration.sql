-- CreateTable
CREATE TABLE "reportes" (
    "id" SERIAL NOT NULL,
    "visitaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "tecnicoId" INTEGER NOT NULL,
    "numeroReporte" TEXT NOT NULL,
    "tipoReporte" TEXT,
    "conclusiones" TEXT,
    "observaciones" TEXT,
    "requiereCotizacion" BOOLEAN NOT NULL DEFAULT false,
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "urlPdf" TEXT,
    "urlCarpetaDrive" TEXT,
    "fechaReporte" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reportes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportes_detalle_maquinas" (
    "id" SERIAL NOT NULL,
    "reporteId" INTEGER NOT NULL,
    "maquinaId" INTEGER NOT NULL,
    "procedimiento" TEXT,
    "diagnostico" TEXT,
    "trabajoRealizado" TEXT,
    "recomendaciones" TEXT,
    "psi" TEXT,
    "amperaje" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reportes_detalle_maquinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexos" (
    "id" SERIAL NOT NULL,
    "reporteId" INTEGER,
    "tipoArchivo" TEXT,
    "nombreArchivo" TEXT NOT NULL,
    "urlArchivo" TEXT NOT NULL,
    "driveFileId" TEXT,
    "mimeType" TEXT,
    "tamanoBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anexos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cierres_reporte" (
    "id" SERIAL NOT NULL,
    "reporteId" INTEGER NOT NULL,
    "recibido" BOOLEAN NOT NULL DEFAULT false,
    "aprobado" BOOLEAN,
    "nombreRecibe" TEXT,
    "puestoRecibe" TEXT,
    "urlFirma" TEXT,
    "motivoNoRecepcion" TEXT,
    "observaciones" TEXT,
    "fechaCierre" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cierres_reporte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reportes_numeroReporte_key" ON "reportes"("numeroReporte");

-- CreateIndex
CREATE UNIQUE INDEX "cierres_reporte_reporteId_key" ON "cierres_reporte"("reporteId");

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_visitaId_fkey" FOREIGN KEY ("visitaId") REFERENCES "visitas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_detalle_maquinas" ADD CONSTRAINT "reportes_detalle_maquinas_reporteId_fkey" FOREIGN KEY ("reporteId") REFERENCES "reportes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_detalle_maquinas" ADD CONSTRAINT "reportes_detalle_maquinas_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "maquinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_reporteId_fkey" FOREIGN KEY ("reporteId") REFERENCES "reportes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cierres_reporte" ADD CONSTRAINT "cierres_reporte_reporteId_fkey" FOREIGN KEY ("reporteId") REFERENCES "reportes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
