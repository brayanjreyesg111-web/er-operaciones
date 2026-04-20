import { prisma } from "../../lib/prisma";

export async function listarTiposUnidad() {
  return prisma.tipoUnidad.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, descripcion: true },
  });
}

export async function listarMarcas() {
  return prisma.marca.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, descripcion: true },
  });
}

export async function listarRefrigerantes() {
  return prisma.refrigerante.findMany({
    where: { activo: true },
    orderBy: { codigo: "asc" },
    select: { id: true, codigo: true, nombre: true, descripcion: true },
  });
}

export async function listarUnidadesMedidaCarga() {
  return prisma.unidadMedidaCarga.findMany({
    where: { activo: true },
    orderBy: { codigo: "asc" },
    select: { id: true, codigo: true, nombre: true, descripcion: true },
  });
}

export async function listarDepartamentos() {
  return prisma.departamento.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: { id: true, codigo: true, nombre: true },
  });
}

export async function listarCiudadesPorDepartamento(departamentoId: number) {
  return prisma.ciudad.findMany({
    where: { activo: true, departamentoId },
    orderBy: { nombre: "asc" },
    select: { id: true, codigo: true, nombre: true, departamentoId: true },
  });
}

export async function listarTecnicos() {
  const tecnicos = await prisma.user.findMany({
    where: {
      activo: true,
      OR: [
        {
          role: {
            nombre: {
              contains: "tecn",
              mode: "insensitive",
            },
          },
        },
        {
          role: {
            nombre: {
              contains: "super",
              mode: "insensitive",
            },
          },
        },
      ],
    },
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      email: true,
    },
  });

  if (tecnicos.length > 0) {
    return tecnicos;
  }

  return prisma.user.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      email: true,
    },
  });
}

export async function listarProcedimientos() {
  return prisma.procedimiento.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      codigo: true,
      nombre: true,
      descripcionCompletaPdf: true,
    },
  });
}

export async function listarHallazgos() {
  return prisma.hallazgoCatalogo.findMany({
    where: { activo: true },
    orderBy: [{ categoria: "asc" }, { codigo: "asc" }],
    select: {
      id: true,
      codigo: true,
      descripcion: true,
      categoria: true,
    },
  });
}