-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "rtn" TEXT,
    "contactoNombre" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "direccion" TEXT,
    "ubicacion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maquinas" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "codigoInterno" TEXT,
    "nombreEquipo" TEXT NOT NULL,
    "tipoEquipo" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "serie" TEXT,
    "refrigerante" TEXT,
    "cargaRefrigerante" TEXT,
    "ubicacion" TEXT,
    "area" TEXT,
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maquinas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_rtn_key" ON "clientes"("rtn");

-- AddForeignKey
ALTER TABLE "maquinas" ADD CONSTRAINT "maquinas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
