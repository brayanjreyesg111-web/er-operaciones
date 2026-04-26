import { prisma } from "../../lib/prisma";

type CrearMaquinaInput = {
  clienteId: number;
  tipoUnidadId?: number;
  marcaId?: number;
  refrigeranteId?: number;
  unidadMedidaCargaId?: number;
  departamentoId?: number;
  ciudadId?: number;
  modelo?: string;
  serie?: string;
  cargaRefrigeranteCantidad?: number;
  direccionExacta?: string;
  area?: string;
  observaciones?: string;
};

function slugSeguro(valor?: string | null): string {
  if (!valor) return "ND";

  return (
    valor
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toUpperCase() || "ND"
  );
}

function construirCodigoInterno(params: {
  tipoUnidad?: string | null;
  marca?: string | null;
  modelo?: string | null;
  serie?: string | null;
  ciudad?: string | null;
  area?: string | null;
}) {
  return [
    slugSeguro(params.tipoUnidad),
    slugSeguro(params.marca),
    slugSeguro(params.modelo),
    slugSeguro(params.serie),
    slugSeguro(params.ciudad),
    slugSeguro(params.area),
  ].join("_");
}

export async function listarMaquinas(filtros?: { clienteId?: number }) {
  const clienteId =
    filtros?.clienteId && Number.isInteger(filtros.clienteId) && filtros.clienteId > 0
      ? filtros.clienteId
      : undefined;

  return prisma.maquina.findMany({
    where: {
      activo: true,
      ...(clienteId ? { clienteId } : {}),
    },
    orderBy: { id: "desc" },
    select: {
      id: true,
      clienteId: true,
      codigoInterno: true,
      tipoEquipo: true,
      marca: true,
      modelo: true,
      serie: true,
      area: true,
      direccionExacta: true,
      activo: true,
      cliente: { select: { id: true, nombre: true } },
      tipoUnidad: { select: { id: true, nombre: true } },
      marcaCatalogo: { select: { id: true, nombre: true } },
      refrigeranteCatalogo: { select: { id: true, codigo: true, nombre: true } },
      departamento: { select: { id: true, nombre: true } },
      ciudad: { select: { id: true, nombre: true } },
    },
  });
}

export async function crearMaquina(data: CrearMaquinaInput) {
  const tipoUnidad = data.tipoUnidadId
    ? await prisma.tipoUnidad.findUnique({
        where: { id: data.tipoUnidadId },
        select: { nombre: true },
      })
    : null;

  const marca = data.marcaId
    ? await prisma.marca.findUnique({
        where: { id: data.marcaId },
        select: { nombre: true },
      })
    : null;

  const ciudad = data.ciudadId
    ? await prisma.ciudad.findUnique({
        where: { id: data.ciudadId },
        select: { nombre: true, departamentoId: true },
      })
    : null;

  if (data.departamentoId && ciudad && ciudad.departamentoId !== data.departamentoId) {
    throw new Error("La ciudad no pertenece al departamento seleccionado.");
  }

  const codigoInterno = construirCodigoInterno({
    tipoUnidad: tipoUnidad?.nombre,
    marca: marca?.nombre,
    modelo: data.modelo,
    serie: data.serie,
    ciudad: ciudad?.nombre,
    area: data.area,
  });

  return prisma.maquina.create({
    data: {
      clienteId: data.clienteId,
      tipoUnidadId: data.tipoUnidadId || null,
      marcaId: data.marcaId || null,
      refrigeranteId: data.refrigeranteId || null,
      unidadMedidaCargaId: data.unidadMedidaCargaId || null,
      departamentoId: data.departamentoId || null,
      ciudadId: data.ciudadId || null,
      codigoInterno,
      tipoEquipo: tipoUnidad?.nombre || null,
      marca: marca?.nombre || null,
      modelo: data.modelo?.trim() || null,
      serie: data.serie?.trim() || null,
      cargaRefrigeranteCantidad: data.cargaRefrigeranteCantidad ?? null,
      direccionExacta: data.direccionExacta?.trim() || null,
      area: data.area?.trim() || null,
      observaciones: data.observaciones?.trim() || null,
      activo: true,
    },
    select: {
      id: true,
      clienteId: true,
      codigoInterno: true,
      modelo: true,
      serie: true,
      area: true,
    },
  });
}

export async function obtenerMaquinaPorId(id: number) {
  return prisma.maquina.findUnique({
    where: { id },
    select: {
      id: true,
      clienteId: true,
      codigoInterno: true,
      modelo: true,
      serie: true,
      area: true,
      direccionExacta: true,
      cliente: { select: { id: true, nombre: true } },
      tipoUnidad: { select: { id: true, nombre: true } },
      marcaCatalogo: { select: { id: true, nombre: true } },
      refrigeranteCatalogo: { select: { id: true, codigo: true, nombre: true } },
      unidadMedidaCarga: { select: { id: true, codigo: true, nombre: true } },
      departamento: { select: { id: true, nombre: true } },
      ciudad: { select: { id: true, nombre: true } },
    },
  });
}
