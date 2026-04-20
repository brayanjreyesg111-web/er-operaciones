-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "ciudadId" INTEGER,
ADD COLUMN     "departamentoId" INTEGER;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_ciudadId_fkey" FOREIGN KEY ("ciudadId") REFERENCES "ciudades"("id") ON DELETE SET NULL ON UPDATE CASCADE;
