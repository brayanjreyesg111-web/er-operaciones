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

function rolOperativo(nombre?: string | null) {
  const limpio = String(nombre || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

  return (
    limpio.includes("TECN") ||
    limpio.includes("SUPERV") ||
    limpio.includes("ADMIN") ||
    limpio.includes("OPER")
  );
}

function usuarioOperativoSelect() {
  return {
    id: true,
    nombre: true,
    email: true,
    role: { select: { id: true, nombre: true } },
  } as const;
}

function mapearUsuarioOperativo(usuario: {
  id: number;
  nombre: string;
  email: string;
  role?: { id?: number; nombre?: string | null } | null;
}) {
  const roleLabel = usuario.role?.nombre ?? null;
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    role: roleLabel,
    roleLabel,
    label: roleLabel ? `${usuario.nombre} · ${roleLabel}` : usuario.nombre,
  };
}

async function listarUsuariosActivos() {
  return prisma.user.findMany({
    where: { activo: true },
    orderBy: [{ nombre: "asc" }, { email: "asc" }],
    select: usuarioOperativoSelect(),
  });
}

export async function listarTecnicos() {
  const usuarios = await listarUsuariosActivos();
  const filtrados = usuarios.filter((usuario) => rolOperativo(usuario.role?.nombre));
  const base = filtrados.length ? filtrados : usuarios;
  return base.map(mapearUsuarioOperativo);
}

export async function listarUsuariosOperativos() {
  const usuarios = await listarUsuariosActivos();
  const filtrados = usuarios.filter((usuario) => rolOperativo(usuario.role?.nombre));
  const base = filtrados.length ? filtrados : usuarios;
  return base.map(mapearUsuarioOperativo);
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
