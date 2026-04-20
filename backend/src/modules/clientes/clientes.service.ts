import { prisma } from "../../lib/prisma";

type CrearClienteInput = {
  nombre: string;
  rtn?: string;
  contactoNombre?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  departamentoId: number;
  ciudadId: number;
};

export async function listarClientes() {
  const clientes = await prisma.cliente.findMany({
    where: {
      activo: true,
    },
    orderBy: {
      id: "desc",
    },
    select: {
      id: true,
      nombre: true,
    },
  });

  return clientes;
}

export async function obtenerClientePorId(id: number) {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      rtn: true,
      contactoNombre: true,
      telefono: true,
      correo: true,
      direccion: true,
      departamentoId: true,
      ciudadId: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
      departamento: {
        select: {
          id: true,
          nombre: true,
        },
      },
      ciudad: {
        select: {
          id: true,
          nombre: true,
        },
      },
      maquinas: {
        where: {
          activo: true,
        },
        select: {
          id: true,
          codigoInterno: true,
          modelo: true,
          serie: true,
          activo: true,
        },
        orderBy: {
          id: "desc",
        },
      },
    },
  });

  return cliente;
}

export async function crearCliente(data: CrearClienteInput) {
  const ciudad = await prisma.ciudad.findUnique({
    where: { id: data.ciudadId },
    select: {
      id: true,
      nombre: true,
      departamentoId: true,
    },
  });

  if (!ciudad) {
    throw new Error("La ciudad seleccionada no existe.");
  }

  if (ciudad.departamentoId !== data.departamentoId) {
    throw new Error("La ciudad no pertenece al departamento seleccionado.");
  }

  const cliente = await prisma.cliente.create({
    data: {
      nombre: data.nombre.trim(),
      rtn: data.rtn?.trim() || null,
      contactoNombre: data.contactoNombre?.trim() || null,
      telefono: data.telefono?.trim() || null,
      correo: data.correo?.trim() || null,
      direccion: data.direccion?.trim() || null,
      departamentoId: data.departamentoId,
      ciudadId: data.ciudadId,
      activo: true,
    },
    select: {
      id: true,
      nombre: true,
      rtn: true,
      contactoNombre: true,
      telefono: true,
      correo: true,
      direccion: true,
      departamentoId: true,
      ciudadId: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return cliente;
}