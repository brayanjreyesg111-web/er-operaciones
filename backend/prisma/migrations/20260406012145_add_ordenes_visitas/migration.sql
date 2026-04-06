-- CreateTable
CREATE TABLE "ordenes_servicio" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "numeroOrden" TEXT NOT NULL,
    "contactoNombre" TEXT,
    "telefonoContacto" TEXT,
    "correoContacto" TEXT,
    "ubicacionServicio" TEXT,
    "prioridad" TEXT,
    "tipoSolicitud" TEXT,
    "origenSolicitud" TEXT,
    "descripcionProblema" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'nueva',
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitas" (
    "id" SERIAL NOT NULL,
    "ordenServicioId" INTEGER,
    "clienteId" INTEGER NOT NULL,
    "tecnicoId" INTEGER NOT NULL,
    "tipoVisita" TEXT,
    "motivoVisita" TEXT,
    "resultadoBreve" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "requiereCotizacion" BOOLEAN NOT NULL DEFAULT false,
    "esVisitaLibre" BOOLEAN NOT NULL DEFAULT false,
    "fechaVisita" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horaInicio" TIMESTAMP(3),
    "horaFin" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitas_maquinas" (
    "id" SERIAL NOT NULL,
    "visitaId" INTEGER NOT NULL,
    "maquinaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitas_maquinas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_servicio_numeroOrden_key" ON "ordenes_servicio"("numeroOrden");

-- CreateIndex
CREATE UNIQUE INDEX "visitas_maquinas_visitaId_maquinaId_key" ON "visitas_maquinas"("visitaId", "maquinaId");

-- AddForeignKey
ALTER TABLE "ordenes_servicio" ADD CONSTRAINT "ordenes_servicio_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_ordenServicioId_fkey" FOREIGN KEY ("ordenServicioId") REFERENCES "ordenes_servicio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas_maquinas" ADD CONSTRAINT "visitas_maquinas_visitaId_fkey" FOREIGN KEY ("visitaId") REFERENCES "visitas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas_maquinas" ADD CONSTRAINT "visitas_maquinas_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "maquinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
