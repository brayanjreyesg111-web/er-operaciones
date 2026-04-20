import type { Request, Response } from "express";
import {
  crearCliente,
  listarClientes,
  obtenerClientePorId,
} from "./clientes.service";

export async function listarClientesController(_req: Request, res: Response) {
  try {
    const data = await listarClientes();

    return res.json({
      ok: true,
      data,
    });
  } catch (error: any) {
    console.error("Error listando clientes:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "No se pudieron listar los clientes.",
      error: error?.message || "Error interno",
    });
  }
}

export async function obtenerClientePorIdController(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "El id del cliente no es válido.",
      });
    }

    const data = await obtenerClientePorId(id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        mensaje: "Cliente no encontrado.",
      });
    }

    return res.json({
      ok: true,
      data,
    });
  } catch (error: any) {
    console.error("Error obteniendo cliente por id:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "No se pudo obtener el cliente.",
      error: error?.message || "Error interno",
    });
  }
}

export async function crearClienteController(req: Request, res: Response) {
  try {
    const {
      nombre,
      rtn,
      contactoNombre,
      telefono,
      correo,
      direccion,
      departamentoId,
      ciudadId,
    } = req.body ?? {};

    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({
        ok: false,
        mensaje: "El nombre del cliente es obligatorio.",
      });
    }

    if (!departamentoId || Number(departamentoId) <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "El departamento es obligatorio.",
      });
    }

    if (!ciudadId || Number(ciudadId) <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "La ciudad es obligatoria.",
      });
    }

    const data = await crearCliente({
      nombre: String(nombre),
      rtn: rtn ? String(rtn) : undefined,
      contactoNombre: contactoNombre ? String(contactoNombre) : undefined,
      telefono: telefono ? String(telefono) : undefined,
      correo: correo ? String(correo) : undefined,
      direccion: direccion ? String(direccion) : undefined,
      departamentoId: Number(departamentoId),
      ciudadId: Number(ciudadId),
    });

    return res.status(201).json({
      ok: true,
      mensaje: "Cliente creado correctamente.",
      data,
    });
  } catch (error: any) {
    console.error("Error creando cliente:", error);

    const mensaje = String(error?.message || "");

    if (mensaje.includes("Unique constraint")) {
      return res.status(409).json({
        ok: false,
        mensaje: "Ya existe un cliente con ese dato único.",
        error: mensaje,
      });
    }

    return res.status(500).json({
      ok: false,
      mensaje: "No se pudo crear el cliente.",
      error: mensaje || "Error interno",
    });
  }
}
