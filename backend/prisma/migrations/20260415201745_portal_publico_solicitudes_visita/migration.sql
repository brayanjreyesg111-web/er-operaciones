-- CreateTable
CREATE TABLE "solicitudes_servicio" (
    "id" SERIAL NOT NULL,
    "nombreSolicitante" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "correo" TEXT,
    "empresa" TEXT,
    "esTituloPersonal" BOOLEAN NOT NULL DEFAULT false,
    "ubicacion" TEXT,
    "tipoServicio" TEXT,
    "descripcion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'NUEVA',
    "canalOrigen" TEXT NOT NULL DEFAULT 'PORTAL_WEB',
    "fechaDeseada" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_servicio_pkey" PRIMARY KEY ("id")
);
