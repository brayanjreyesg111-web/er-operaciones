import fs from "node:fs";
import path from "node:path";
import {
  STORAGE_CONFIG,
  buildRutasReporte,
  ensureBaseStorage,
  ensureReporteDirs,
  existsPath,
  type RutasReporte,
} from "./storage.config";

export type ResultadoPreparacionReporte = {
  numeroReporte: string;
  nombreCarpetaReporte: string;
  rutas: RutasReporte;
  yaExistia: boolean;
};

export type ArchivoGuardadoResultado = {
  nombreOriginal: string;
  nombreGuardado: string;
  rutaCompleta: string;
  tamanoBytes: number;
  mimeType?: string | null;
};

export function prepararStorageReporte(
  numeroReporte: string | number
): ResultadoPreparacionReporte {
  const numeroNormalizado = String(numeroReporte).trim();

  if (!numeroNormalizado) {
    throw new Error("El número de reporte es obligatorio para preparar el storage.");
  }

  ensureBaseStorage();

  const rutasPrevias = buildRutasReporte(numeroNormalizado);
  const yaExistia = existsPath(rutasPrevias.reporteDir);

  const rutas = ensureReporteDirs(numeroNormalizado);

  return {
    numeroReporte: numeroNormalizado,
    nombreCarpetaReporte: path.basename(rutas.reporteDir),
    rutas,
    yaExistia,
  };
}

export function obtenerRutasReporte(numeroReporte: string | number): RutasReporte {
  const numeroNormalizado = String(numeroReporte).trim();

  if (!numeroNormalizado) {
    throw new Error("El número de reporte es obligatorio.");
  }

  return buildRutasReporte(numeroNormalizado);
}

export function existeCarpetaReporte(numeroReporte: string | number): boolean {
  const rutas = obtenerRutasReporte(numeroReporte);
  return existsPath(rutas.reporteDir);
}

export function obtenerRutaJsonReporte(numeroReporte: string | number): string {
  const rutas = obtenerRutasReporte(numeroReporte);
  return path.join(rutas.jsonDir, `reporte_${String(numeroReporte).trim()}.json`);
}

export function obtenerRutaPdfInternoReporte(numeroReporte: string | number): string {
  const rutas = obtenerRutasReporte(numeroReporte);
  return path.join(rutas.pdfDir, `Reporte_${String(numeroReporte).trim()}.pdf`);
}

export function obtenerRutaPdfEntregableReporte(numeroReporte: string | number): string {
  const rutas = obtenerRutasReporte(numeroReporte);
  return path.join(
    rutas.entregableClienteDir,
    `Reporte_${String(numeroReporte).trim()}.pdf`
  );
}

export function obtenerRutaFirmasReporte(
  numeroReporte: string | number,
  nombreArchivo: string
): string {
  const rutas = obtenerRutasReporte(numeroReporte);
  return path.join(rutas.firmasDir, nombreArchivo);
}

export function obtenerRutaAnexoReporte(
  numeroReporte: string | number,
  nombreArchivo: string
): string {
  const rutas = obtenerRutasReporte(numeroReporte);
  return path.join(rutas.anexosDir, nombreArchivo);
}

export function obtenerCorrelativoInicialReportes(): number {
  return STORAGE_CONFIG.correlativoInicialReporte;
}

export function guardarJsonReporte(
  numeroReporte: string | number,
  contenido: unknown
): string {
  const numeroNormalizado = String(numeroReporte).trim();

  if (!numeroNormalizado) {
    throw new Error("El número de reporte es obligatorio para guardar el JSON.");
  }

  const rutas = ensureReporteDirs(numeroNormalizado);
  const rutaJson = path.join(rutas.jsonDir, `reporte_${numeroNormalizado}.json`);

  fs.writeFileSync(rutaJson, JSON.stringify(contenido, null, 2), "utf-8");

  return rutaJson;
}

function sanitizarNombreArchivo(nombreArchivo: string): string {
  return nombreArchivo
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_");
}

export function guardarBufferAnexoReporte(params: {
  numeroReporte: string | number;
  nombreArchivo: string;
  buffer: Buffer;
  mimeType?: string | null;
}): ArchivoGuardadoResultado {
  const numeroNormalizado = String(params.numeroReporte).trim();

  if (!numeroNormalizado) {
    throw new Error("El número de reporte es obligatorio para guardar anexos.");
  }

  if (!params.nombreArchivo?.trim()) {
    throw new Error("El nombre del archivo es obligatorio.");
  }

  if (!params.buffer || !Buffer.isBuffer(params.buffer)) {
    throw new Error("El contenido del archivo no es válido.");
  }

  const rutas = ensureReporteDirs(numeroNormalizado);

  const nombreLimpio = sanitizarNombreArchivo(params.nombreArchivo);
  const timestamp = Date.now();
  const nombreGuardado = `${timestamp}_${nombreLimpio}`;
  const rutaCompleta = path.join(rutas.anexosDir, nombreGuardado);

  fs.writeFileSync(rutaCompleta, params.buffer);

  const stats = fs.statSync(rutaCompleta);

  return {
    nombreOriginal: params.nombreArchivo,
    nombreGuardado,
    rutaCompleta,
    tamanoBytes: stats.size,
    mimeType: params.mimeType ?? null,
  };
}

export function guardarBufferFirmaReporte(params: {
  numeroReporte: string | number;
  nombreArchivo: string;
  buffer: Buffer;
  mimeType?: string | null;
}): ArchivoGuardadoResultado {
  const numeroNormalizado = String(params.numeroReporte).trim();

  if (!numeroNormalizado) {
    throw new Error("El número de reporte es obligatorio para guardar la firma.");
  }

  if (!params.nombreArchivo?.trim()) {
    throw new Error("El nombre del archivo de firma es obligatorio.");
  }

  if (!params.buffer || !Buffer.isBuffer(params.buffer)) {
    throw new Error("El contenido de la firma no es válido.");
  }

  const rutas = ensureReporteDirs(numeroNormalizado);

  const nombreLimpio = sanitizarNombreArchivo(params.nombreArchivo);
  const timestamp = Date.now();
  const nombreGuardado = `${timestamp}_${nombreLimpio}`;
  const rutaCompleta = path.join(rutas.firmasDir, nombreGuardado);

  fs.writeFileSync(rutaCompleta, params.buffer);

  const stats = fs.statSync(rutaCompleta);

  return {
    nombreOriginal: params.nombreArchivo,
    nombreGuardado,
    rutaCompleta,
    tamanoBytes: stats.size,
    mimeType: params.mimeType ?? null,
  };
}