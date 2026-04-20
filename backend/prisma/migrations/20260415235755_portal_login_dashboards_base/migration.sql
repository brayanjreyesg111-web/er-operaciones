/*
  Warnings:

  - You are about to drop the column `esTituloPersonal` on the `solicitudes_servicio` table. All the data in the column will be lost.
  - You are about to drop the column `ubicacion` on the `solicitudes_servicio` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[numeroVisita]` on the table `visitas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ciudadId` to the `solicitudes_servicio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departamentoId` to the `solicitudes_servicio` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "solicitudes_servicio" DROP COLUMN "esTituloPersonal",
DROP COLUMN "ubicacion",
ADD COLUMN     "asignadoAUserId" INTEGER,
ADD COLUMN     "ciudadId" INTEGER NOT NULL,
ADD COLUMN     "clienteId" INTEGER,
ADD COLUMN     "departamentoId" INTEGER NOT NULL,
ADD COLUMN     "direccionExacta" TEXT,
ADD COLUMN     "fechaGestion" TIMESTAMP(3),
ADD COLUMN     "motivoEstado" TEXT;

-- AlterTable
ALTER TABLE "visitas" ADD COLUMN     "actividadId" INTEGER,
ADD COLUMN     "motivoEstado" TEXT,
ADD COLUMN     "numeroVisita" TEXT,
ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE';

-- CreateTable
CREATE TABLE "actividades" (
    "id" SERIAL NOT NULL,
    "codigoActividad" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoriaActividad" TEXT NOT NULL,
    "tipoOrigen" TEXT NOT NULL,
    "clienteId" INTEGER,
    "ordenServicioId" INTEGER,
    "solicitudId" INTEGER,
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fechaProgramada" TIMESTAMP(3),
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "progresoPorcentaje" INTEGER NOT NULL DEFAULT 0,
    "requiereReporte" BOOLEAN NOT NULL DEFAULT false,
    "requiereVisita" BOOLEAN NOT NULL DEFAULT false,
    "creadoPorId" INTEGER NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades_asignados" (
    "id" SERIAL NOT NULL,
    "actividadId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "rolEnActividad" TEXT NOT NULL DEFAULT 'RESPONSABLE',
    "estadoAsignacion" TEXT NOT NULL DEFAULT 'ASIGNADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actividades_asignados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades_maquinas" (
    "id" SERIAL NOT NULL,
    "actividadId" INTEGER NOT NULL,
    "maquinaId" INTEGER NOT NULL,
    "tipoTrabajo" TEXT,
    "estadoAtencion" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "porcentaje" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actividades_maquinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividad_pasos" (
    "id" SERIAL NOT NULL,
    "actividadId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "tituloPaso" TEXT NOT NULL,
    "descripcionPaso" TEXT,
    "obligatorio" BOOLEAN NOT NULL DEFAULT true,
    "estadoPaso" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "porcentajePaso" INTEGER NOT NULL DEFAULT 0,
    "realizadoPorId" INTEGER,
    "fechaRealizacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actividad_pasos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividad_mensajes" (
    "id" SERIAL NOT NULL,
    "actividadId" INTEGER,
    "visitaId" INTEGER,
    "usuarioId" INTEGER NOT NULL,
    "tipoMensaje" TEXT NOT NULL,
    "asunto" TEXT,
    "mensaje" TEXT NOT NULL,
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "estado" TEXT NOT NULL DEFAULT 'NUEVO',
    "creadoParaUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actividad_mensajes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitas_asignados" (
    "id" SERIAL NOT NULL,
    "visitaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "rolEnVisita" TEXT NOT NULL DEFAULT 'RESPONSABLE',
    "estadoAsignacion" TEXT NOT NULL DEFAULT 'ASIGNADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitas_asignados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "actividades_codigoActividad_key" ON "actividades"("codigoActividad");

-- CreateIndex
CREATE UNIQUE INDEX "actividades_asignados_actividadId_usuarioId_key" ON "actividades_asignados"("actividadId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "actividades_maquinas_actividadId_maquinaId_key" ON "actividades_maquinas"("actividadId", "maquinaId");

-- CreateIndex
CREATE UNIQUE INDEX "visitas_asignados_visitaId_usuarioId_key" ON "visitas_asignados"("visitaId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "visitas_numeroVisita_key" ON "visitas"("numeroVisita");

-- AddForeignKey
ALTER TABLE "solicitudes_servicio" ADD CONSTRAINT "solicitudes_servicio_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_servicio" ADD CONSTRAINT "solicitudes_servicio_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_servicio" ADD CONSTRAINT "solicitudes_servicio_ciudadId_fkey" FOREIGN KEY ("ciudadId") REFERENCES "ciudades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_servicio" ADD CONSTRAINT "solicitudes_servicio_asignadoAUserId_fkey" FOREIGN KEY ("asignadoAUserId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_ordenServicioId_fkey" FOREIGN KEY ("ordenServicioId") REFERENCES "ordenes_servicio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes_servicio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades_asignados" ADD CONSTRAINT "actividades_asignados_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades_asignados" ADD CONSTRAINT "actividades_asignados_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades_maquinas" ADD CONSTRAINT "actividades_maquinas_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades_maquinas" ADD CONSTRAINT "actividades_maquinas_maquinaId_fkey" FOREIGN KEY ("maquinaId") REFERENCES "maquinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividad_pasos" ADD CONSTRAINT "actividad_pasos_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividad_pasos" ADD CONSTRAINT "actividad_pasos_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividad_mensajes" ADD CONSTRAINT "actividad_mensajes_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividad_mensajes" ADD CONSTRAINT "actividad_mensajes_visitaId_fkey" FOREIGN KEY ("visitaId") REFERENCES "visitas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividad_mensajes" ADD CONSTRAINT "actividad_mensajes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "actividades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas_asignados" ADD CONSTRAINT "visitas_asignados_visitaId_fkey" FOREIGN KEY ("visitaId") REFERENCES "visitas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas_asignados" ADD CONSTRAINT "visitas_asignados_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
