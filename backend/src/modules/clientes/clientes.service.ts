import { prisma } from "../../lib/prisma";

type CrearClienteInput = {
  nombre: string;
  rtn?: string;
  contactoNombre?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  ubicacion?: string;
  activo?: boolean;
};

export async function listarClientes() {
  const clientes = await prisma.cliente.findMany({
    orderBy: {
      id: "desc",
    },
    select: {
      id: true,
      nombre: true,
      rtn: true,
      contactoNombre: true,
      telefono: true,
      correo: true,
      direccion: true,
      ubicacion: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
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
      ubicacion: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
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
  const cliente = await prisma.cliente.create({
    data: {
      nombre: data.nombre.trim(),
      rtn: data.rtn?.trim() || null,
      contactoNombre: data.contactoNombre?.trim() || null,
      telefono: data.telefono?.trim() || null,
      correo: data.correo?.trim() || null,
      direccion: data.direccion?.trim() || null,
      ubicacion: data.ubicacion?.trim() || null,
      activo: data.activo ?? true,
    },
    select: {
      id: true,
      nombre: true,
      rtn: true,
      contactoNombre: true,
      telefono: true,
      correo: true,
      direccion: true,
      ubicacion: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return cliente;
}

