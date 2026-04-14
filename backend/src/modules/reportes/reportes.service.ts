import path from "node:path";
import { prisma } from "../../lib/prisma";
import { generarPdfReporteLocal } from "../../lib/storage/reportes-pdf";
import {
  guardarBufferAnexoReporte,
  guardarBufferFirmaReporte,
  guardarJsonReporte,
  obtenerCorrelativoInicialReportes,
  prepararStorageReporte,
} from "../../lib/storage/reportes-storage";

export type CrearHallazgoDetalleInput = {
  hallazgoCatalogoId: number;
  codigoHallazgo?: string | null;
  descripcionHallazgo?: string | null;
};

export type CrearDetalleReporteInput = {
  maquinaId: number;
  tipoUnidadId?: number | null;
  procedimientoId?: number | null;
  procedimiento?: string | null;
  tituloActividad?: string | null;
  descripcionActividadPdf?: string | null;
  hallazgosTexto?: string | null;
  diagnostico?: string | null;
  trabajoRealizado?: string | null;
  recomendaciones?: string | null;
  psi?: string | null;
  amperaje?: string | null;
  observaciones?: string | null;
  hallazgos?: CrearHallazgoDetalleInput[];
};

export type CrearAnexoInput = {
  nombreArchivo: string;
  contenidoBase64: string;
  mimeType?: string | null;
  tipoArchivo?: string | null;
};

export type CrearCierreInput = {
  recibido?: boolean;
  aprobado?: boolean | null;
  nombreRecibe?: string | null;
  puestoRecibe?: string | null;
  urlFirma?: string | null;
  motivoNoRecepcion?: string | null;
  observaciones?: string | null;
  firmaBase64?: string | null;
  firmaNombreArchivo?: string | null;
  firmaMimeType?: string | null;
};

export type CrearReporteInput = {
  visitaId: number;
  clienteId?: number;
  tecnicoId?: number;
  maquinaId?: number | null;
  tipoUnidadId?: number | null;
  procedimientoId?: number | null;
  tipoReporte?: string | null;
  conclusiones?: string | null;
  observaciones?: string | null;
  psi?: string | null;
  amperaje?: string | null;
  requiereCotizacion?: boolean;
  estado?: string | null;
  fechaReporte?: string | Date | null;
  detallesMaquinas?: CrearDetalleReporteInput[];
  anexos?: CrearAnexoInput[];
  cierre?: CrearCierreInput | null;
};

async function obtenerSiguienteNumeroReporte(): Promise<string> {
  const correlativoInicial = obtenerCorrelativoInicialReportes();

  const reportes = await prisma.reporte.findMany({
    select: { numeroReporte: true },
  });

  if (!reportes.length) {
    return String(correlativoInicial);
  }

  let maxNumero = correlativoInicial - 1;

  for (const reporte of reportes) {
    const numero = parseInt(String(reporte.numeroReporte).trim(), 10);

    if (!Number.isNaN(numero) && numero > maxNumero) {
      maxNumero = numero;
    }
  }

  return String(Math.max(maxNumero + 1, correlativoInicial));
}

async function validarVisita(visitaId: number) {
  const visita = await prisma.visita.findUnique({
    where: { id: visitaId },
    include: {
      maquinas: {
        include: {
          maquina: true,
        },
      },
    },
  });

  if (!visita) {
    throw new Error("La visita indicada no existe.");
  }

  return visita;
}

function normalizarFecha(fecha?: string | Date | null): Date {
  if (!fecha) return new Date();

  const fechaConvertida = fecha instanceof Date ? fecha : new Date(fecha);

  if (Number.isNaN(fechaConvertida.getTime())) {
    throw new Error("La fechaReporte no es válida.");
  }

  return fechaConvertida;
}

function obtenerMaquinaDesdeVisita(
  visita: Awaited<ReturnType<typeof validarVisita>>
) {
  if (!visita.maquinas?.length) return null;
  if (visita.maquinas.length === 1) return visita.maquinas[0].maquina;
  return null;
}

async function validarDetalleMaquina(detalle: CrearDetalleReporteInput) {
  const maquina = await prisma.maquina.findUnique({
    where: { id: detalle.maquinaId },
  });

  if (!maquina) {
    throw new Error(`La máquina ${detalle.maquinaId} no existe.`);
  }

  if (detalle.tipoUnidadId) {
    const tipoUnidad = await prisma.tipoUnidad.findUnique({
      where: { id: detalle.tipoUnidadId },
    });

    if (!tipoUnidad) {
      throw new Error(`El tipoUnidadId ${detalle.tipoUnidadId} no existe.`);
    }
  }

  if (detalle.procedimientoId) {
    const procedimiento = await prisma.procedimiento.findUnique({
      where: { id: detalle.procedimientoId },
    });

    if (!procedimiento) {
      throw new Error(`El procedimientoId ${detalle.procedimientoId} no existe.`);
    }
  }

  if (detalle.hallazgos?.length) {
    for (const hallazgo of detalle.hallazgos) {
      const existeHallazgo = await prisma.hallazgoCatalogo.findUnique({
        where: { id: hallazgo.hallazgoCatalogoId },
      });

      if (!existeHallazgo) {
        throw new Error(
          `El hallazgoCatalogoId ${hallazgo.hallazgoCatalogoId} no existe.`
        );
      }
    }
  }
}

async function crearDetallesYHallazgos(
  reporteId: number,
  detallesMaquinas: CrearDetalleReporteInput[] = []
) {
  const detallesCreados = [];

  for (const detalle of detallesMaquinas) {
    await validarDetalleMaquina(detalle);

    const detalleCreado = await prisma.reporteDetalleMaquina.create({
      data: {
        reporteId,
        maquinaId: detalle.maquinaId,
        tipoUnidadId: detalle.tipoUnidadId ?? null,
        procedimientoId: detalle.procedimientoId ?? null,
        procedimiento: detalle.procedimiento ?? null,
        tituloActividad: detalle.tituloActividad ?? null,
        descripcionActividadPdf: detalle.descripcionActividadPdf ?? null,
        hallazgosTexto: detalle.hallazgosTexto ?? null,
        diagnostico: detalle.diagnostico ?? null,
        trabajoRealizado: detalle.trabajoRealizado ?? null,
        recomendaciones: detalle.recomendaciones ?? null,
        psi: detalle.psi ?? null,
        amperaje: detalle.amperaje ?? null,
        observaciones: detalle.observaciones ?? null,
      },
      include: {
        maquina: true,
        tipoUnidad: true,
        procedimientoCatalogo: true,
      },
    });

    const hallazgosCreados = [];

    if (detalle.hallazgos?.length) {
      for (const hallazgo of detalle.hallazgos) {
        const hallazgoCreado = await prisma.reporteDetalleHallazgo.create({
          data: {
            reporteDetalleMaquinaId: detalleCreado.id,
            hallazgoCatalogoId: hallazgo.hallazgoCatalogoId,
            codigoHallazgo: hallazgo.codigoHallazgo ?? null,
            descripcionHallazgo: hallazgo.descripcionHallazgo ?? null,
          },
          include: {
            hallazgoCatalogo: true,
          },
        });

        hallazgosCreados.push(hallazgoCreado);
      }
    }

    detallesCreados.push({
      ...detalleCreado,
      hallazgos: hallazgosCreados,
    });
  }

  return detallesCreados;
}

function obtenerTipoArchivoDesdeMime(mimeType?: string | null): string | null {
  if (!mimeType) return null;

  if (mimeType.startsWith("image/")) return "imagen";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  return "archivo";
}

async function guardarAnexosReporte(
  reporteId: number,
  numeroReporte: string,
  anexos: CrearAnexoInput[] = []
) {
  const anexosCreados = [];

  for (const anexo of anexos) {
    if (!anexo.nombreArchivo?.trim()) {
      throw new Error("Todos los anexos deben incluir nombreArchivo.");
    }

    if (!anexo.contenidoBase64?.trim()) {
      throw new Error(`El anexo ${anexo.nombreArchivo} no tiene contenidoBase64.`);
    }

    const buffer = Buffer.from(anexo.contenidoBase64, "base64");

    const archivoGuardado = guardarBufferAnexoReporte({
      numeroReporte,
      nombreArchivo: anexo.nombreArchivo,
      buffer,
      mimeType: anexo.mimeType ?? null,
    });

    const anexoCreado = await prisma.anexo.create({
      data: {
        reporteId,
        tipoArchivo:
          anexo.tipoArchivo ??
          obtenerTipoArchivoDesdeMime(anexo.mimeType ?? null) ??
          "archivo",
        nombreArchivo: archivoGuardado.nombreGuardado,
        urlArchivo: archivoGuardado.rutaCompleta,
        driveFileId: null,
        mimeType: anexo.mimeType ?? null,
        tamanoBytes: archivoGuardado.tamanoBytes,
      },
    });

    anexosCreados.push(anexoCreado);
  }

  return anexosCreados;
}

async function guardarCierreReporte(
  reporteId: number,
  numeroReporte: string,
  cierre?: CrearCierreInput | null
) {
  if (!cierre) return null;

  let urlFirmaFinal = cierre.urlFirma ?? null;

  if (cierre.firmaBase64?.trim()) {
    const nombreArchivo =
      cierre.firmaNombreArchivo?.trim() || `firma_reporte_${numeroReporte}.png`;
    const mimeType = cierre.firmaMimeType?.trim() || "image/png";

    const buffer = Buffer.from(cierre.firmaBase64, "base64");

    const firmaGuardada = guardarBufferFirmaReporte({
      numeroReporte,
      nombreArchivo,
      buffer,
      mimeType,
    });

    urlFirmaFinal = firmaGuardada.rutaCompleta;
  }

  const cierreCreado = await prisma.cierreReporte.create({
    data: {
      reporteId,
      recibido: cierre.recibido ?? false,
      aprobado: cierre.aprobado ?? null,
      nombreRecibe: cierre.nombreRecibe ?? null,
      puestoRecibe: cierre.puestoRecibe ?? null,
      urlFirma: urlFirmaFinal,
      motivoNoRecepcion: cierre.motivoNoRecepcion ?? null,
      observaciones: cierre.observaciones ?? null,
    },
  });

  return cierreCreado;
}

function construirPayloadJsonInterno(params: {
  reporte: any;
  detallesMaquinas: any[];
  anexos: any[];
  cierre: any;
  storage: any;
  pdf: {
    rutaPdfInterno: string;
    rutaPdfEntregable: string;
  } | null;
}) {
  const { reporte, detallesMaquinas, anexos, cierre, storage, pdf } = params;

  return {
    meta: {
      generadoEn: new Date().toISOString(),
      modulo: "reportes",
      version: 4,
    },
    reporte: {
      id: reporte.id,
      numeroReporte: reporte.numeroReporte,
      visitaId: reporte.visitaId,
      clienteId: reporte.clienteId,
      tecnicoId: reporte.tecnicoId,
      maquinaId: reporte.maquinaId,
      tipoUnidadId: reporte.tipoUnidadId,
      procedimientoId: reporte.procedimientoId,
      tipoReporte: reporte.tipoReporte,
      conclusiones: reporte.conclusiones,
      observaciones: reporte.observaciones,
      psi: reporte.psi,
      amperaje: reporte.amperaje,
      requiereCotizacion: reporte.requiereCotizacion,
      estado: reporte.estado,
      fechaReporte: reporte.fechaReporte,
      createdAt: reporte.createdAt,
      updatedAt: reporte.updatedAt,
      urlPdf: pdf?.rutaPdfEntregable ?? null,
    },
    relaciones: {
      visita: reporte.visita,
      cliente: reporte.cliente,
      tecnico: reporte.tecnico,
      maquina: reporte.maquina,
      tipoUnidad: reporte.tipoUnidad,
      procedimiento: reporte.procedimiento,
    },
    detallesMaquinas,
    anexos,
    cierre,
    pdf,
    storage,
  };
}

function obtenerBaseUrlLocal(): string {
  return process.env.APP_BASE_URL?.trim() || "http://localhost:3001";
}

function convertirRutaStorageAUrlLocal(
  rutaArchivo?: string | null
): string | null {
  if (!rutaArchivo) return null;

  const rutaStorageBase = path.resolve(process.cwd(), "storage");
  const rutaNormalizada = path.normalize(rutaArchivo);
  const rutaBaseNormalizada = path.normalize(rutaStorageBase);

  if (!rutaNormalizada.startsWith(rutaBaseNormalizada)) {
    return null;
  }

  const relativa = path.relative(rutaStorageBase, rutaNormalizada);
  const relativaUrl = relativa.split(path.sep).join("/");

  return `${obtenerBaseUrlLocal()}/storage/${relativaUrl}`;
}

function enriquecerUrlsReporte<T extends Record<string, any>>(
  reporte: T
): T & {
  urlPdfLocal: string | null;
} {
  return {
    ...reporte,
    urlPdfLocal: convertirRutaStorageAUrlLocal(reporte.urlPdf ?? null),
  };
}

function enriquecerAnexoConUrlLocal<T extends Record<string, any>>(
  anexo: T
): T & {
  urlArchivoLocal: string | null;
} {
  return {
    ...anexo,
    urlArchivoLocal: convertirRutaStorageAUrlLocal(anexo.urlArchivo ?? null),
  };
}

function enriquecerCierreConUrlLocal<T extends Record<string, any> | null>(
  cierre: T
) {
  if (!cierre) return null;

  return {
    ...cierre,
    urlFirmaLocal: convertirRutaStorageAUrlLocal((cierre as any).urlFirma ?? null),
  };
}

function construirAccionesReporte(reporte: {
  numeroReporte?: string | null;
  urlPdfLocal?: string | null;
}) {
  const numeroReporte = reporte.numeroReporte ?? "N/D";
  const urlPdfLocal = reporte.urlPdfLocal ?? null;

  const asunto = `Reporte técnico #${numeroReporte}`;
  const cuerpo = urlPdfLocal
    ? `Hola, comparto el reporte técnico #${numeroReporte}.\n\nEnlace: ${urlPdfLocal}`
    : `Hola, comparto el reporte técnico #${numeroReporte}.`;

  const textoWhatsapp = urlPdfLocal
    ? `Hola, comparto el reporte técnico #${numeroReporte}: ${urlPdfLocal}`
    : `Hola, comparto el reporte técnico #${numeroReporte}.`;

  return {
    verPdf: urlPdfLocal,
    descargarPdf: urlPdfLocal,
    whatsappTexto: textoWhatsapp,
    correoAsunto: asunto,
    correoCuerpo: cuerpo,
  };
}

export async function crearReporte(data: CrearReporteInput) {
  if (!data.visitaId) {
    throw new Error("visitaId es obligatorio.");
  }

  const visita = await validarVisita(data.visitaId);
  const numeroReporte = await obtenerSiguienteNumeroReporte();
  const storage = prepararStorageReporte(numeroReporte);

  const maquinaDesdeVisita = obtenerMaquinaDesdeVisita(visita);

  const clienteIdFinal = data.clienteId ?? visita.clienteId;
  const tecnicoIdFinal = data.tecnicoId ?? visita.tecnicoId;
  const maquinaIdFinal =
    data.maquinaId !== undefined ? data.maquinaId : maquinaDesdeVisita?.id ?? null;
  const tipoUnidadIdFinal =
    data.tipoUnidadId !== undefined
      ? data.tipoUnidadId
      : maquinaDesdeVisita?.tipoUnidadId ?? null;

  const reporte = await prisma.reporte.create({
    data: {
      numeroReporte,
      visitaId: data.visitaId,
      clienteId: clienteIdFinal,
      tecnicoId: tecnicoIdFinal,
      maquinaId: maquinaIdFinal,
      tipoUnidadId: tipoUnidadIdFinal,
      procedimientoId: data.procedimientoId ?? null,
      tipoReporte: data.tipoReporte ?? "individual",
      conclusiones: data.conclusiones ?? null,
      observaciones: data.observaciones ?? null,
      psi: data.psi ?? null,
      amperaje: data.amperaje ?? null,
      requiereCotizacion: data.requiereCotizacion ?? false,
      estado: data.estado ?? "borrador",
      fechaReporte: normalizarFecha(data.fechaReporte),
      urlPdf: null,
      urlCarpetaDrive: storage.rutas.entregableClienteDir,
    },
    include: {
      visita: true,
      cliente: true,
      tecnico: true,
      maquina: true,
      tipoUnidad: true,
      procedimiento: true,
    },
  });

  const detallesCreados = await crearDetallesYHallazgos(
    reporte.id,
    data.detallesMaquinas ?? []
  );

  const anexosCreados = await guardarAnexosReporte(
    reporte.id,
    numeroReporte,
    data.anexos ?? []
  );

  const cierreCreado = await guardarCierreReporte(
    reporte.id,
    numeroReporte,
    data.cierre ?? null
  );

  const pdfGenerado = await generarPdfReporteLocal({
    numeroReporte,
    reporte,
    detallesMaquinas: detallesCreados,
    anexos: anexosCreados,
    cierre: cierreCreado,
  });

  await prisma.reporte.update({
    where: { id: reporte.id },
    data: {
      urlPdf: pdfGenerado.rutaPdfEntregable,
    },
  });

  const jsonInterno = construirPayloadJsonInterno({
    reporte: {
      ...reporte,
      urlPdf: pdfGenerado.rutaPdfEntregable,
    },
    detallesMaquinas: detallesCreados,
    anexos: anexosCreados,
    cierre: cierreCreado,
    storage,
    pdf: pdfGenerado,
  });

  const rutaJsonInterno = guardarJsonReporte(numeroReporte, jsonInterno);

  const reporteRespuesta = enriquecerUrlsReporte({
    ...reporte,
    urlPdf: pdfGenerado.rutaPdfEntregable,
  });

  const anexosRespuesta = anexosCreados.map(enriquecerAnexoConUrlLocal);
  const cierreRespuesta = enriquecerCierreConUrlLocal(cierreCreado);

  return {
    ok: true,
    mensaje: "Reporte creado correctamente.",
    data: {
      ...reporteRespuesta,
      detallesMaquinas: detallesCreados,
      anexos: anexosRespuesta,
      cierre: cierreRespuesta,
      pdf: {
        ...pdfGenerado,
        urlPdfEntregableLocal: convertirRutaStorageAUrlLocal(
          pdfGenerado.rutaPdfEntregable
        ),
        urlPdfInternoLocal: convertirRutaStorageAUrlLocal(
          pdfGenerado.rutaPdfInterno
        ),
      },
      acciones: construirAccionesReporte(reporteRespuesta),
      storage,
      rutaJsonInterno,
    },
  };
}

export async function listarReportes() {
  const reportes = await prisma.reporte.findMany({
    orderBy: {
      id: "desc",
    },
    include: {
      cliente: {
        select: {
          id: true,
          nombre: true,
        },
      },
      tecnico: {
        select: {
          id: true,
          nombre: true,
          email: true,
        },
      },
      visita: {
        select: {
          id: true,
          fechaVisita: true,
          estado: true,
        },
      },
      maquina: {
        select: {
          id: true,
          nombreEquipo: true,
          modelo: true,
          serie: true,
        },
      },
      tipoUnidad: {
        select: {
          id: true,
          nombre: true,
          codigo: true,
        },
      },
      procedimiento: {
        select: {
          id: true,
          nombre: true,
          codigo: true,
        },
      },
      cierre: true,
    },
  });

  return {
    ok: true,
    total: reportes.length,
    data: reportes.map((reporte) => {
      const reporteConUrls = enriquecerUrlsReporte(reporte);

      return {
        ...reporteConUrls,
        acciones: construirAccionesReporte(reporteConUrls),
      };
    }),
  };
}

export async function obtenerReportePorId(id: number) {
  const reporte = await prisma.reporte.findUnique({
    where: { id },
    include: {
      visita: true,
      cliente: true,
      tecnico: true,
      maquina: true,
      tipoUnidad: true,
      procedimiento: true,
      detallesMaquinas: {
        include: {
          maquina: true,
          tipoUnidad: true,
          procedimientoCatalogo: true,
          hallazgos: {
            include: {
              hallazgoCatalogo: true,
            },
          },
        },
      },
      anexos: true,
      cierre: true,
    },
  });

  if (!reporte) {
    throw new Error("Reporte no encontrado.");
  }

  const reporteConUrls = enriquecerUrlsReporte(reporte);

  return {
    ok: true,
    data: {
      ...reporteConUrls,
      anexos: reporte.anexos.map(enriquecerAnexoConUrlLocal),
      cierre: enriquecerCierreConUrlLocal(reporte.cierre),
      acciones: construirAccionesReporte(reporteConUrls),
    },
  };
}

export const reportesService = {
  crearReporte,
  listarReportes,
  obtenerReportePorId,
  obtenerSiguienteNumeroReporte,
};