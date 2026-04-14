import fs from "node:fs";
import path from "node:path";

export const STORAGE_CONFIG = {
  baseStorageDir: path.resolve(process.cwd(), "storage"),
  reportesDirName: "reportes",
  entregableClienteDirName: "01_Entregable_Cliente",
  internoDirName: "99_Interno",
  anexosDirName: "anexos",
  firmasDirName: "firmas",
  pdfDirName: "pdf",
  jsonDirName: "json",
  correlativoInicialReporte: 365,
} as const;

export type RutasReporte = {
  baseStorageDir: string;
  reportesBaseDir: string;
  reporteDir: string;
  entregableClienteDir: string;
  internoDir: string;
  anexosDir: string;
  firmasDir: string;
  pdfDir: string;
  jsonDir: string;
};

export function getReportesBaseDir(): string {
  return path.join(STORAGE_CONFIG.baseStorageDir, STORAGE_CONFIG.reportesDirName);
}

export function getNombreCarpetaReporte(numeroReporte: string | number): string {
  return `Reporte_${String(numeroReporte).trim()}`;
}

export function buildRutasReporte(numeroReporte: string | number): RutasReporte {
  const reportesBaseDir = getReportesBaseDir();
  const reporteDir = path.join(reportesBaseDir, getNombreCarpetaReporte(numeroReporte));
  const entregableClienteDir = path.join(
    reporteDir,
    STORAGE_CONFIG.entregableClienteDirName
  );
  const internoDir = path.join(reporteDir, STORAGE_CONFIG.internoDirName);

  return {
    baseStorageDir: STORAGE_CONFIG.baseStorageDir,
    reportesBaseDir,
    reporteDir,
    entregableClienteDir,
    internoDir,
    anexosDir: path.join(internoDir, STORAGE_CONFIG.anexosDirName),
    firmasDir: path.join(internoDir, STORAGE_CONFIG.firmasDirName),
    pdfDir: path.join(internoDir, STORAGE_CONFIG.pdfDirName),
    jsonDir: path.join(internoDir, STORAGE_CONFIG.jsonDirName),
  };
}

export function ensureDir(dirPath: string): string {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

export function ensureBaseStorage(): string {
  ensureDir(STORAGE_CONFIG.baseStorageDir);
  return ensureDir(getReportesBaseDir());
}

export function ensureReporteDirs(numeroReporte: string | number): RutasReporte {
  const rutas = buildRutasReporte(numeroReporte);

  ensureBaseStorage();
  ensureDir(rutas.reporteDir);
  ensureDir(rutas.entregableClienteDir);
  ensureDir(rutas.internoDir);
  ensureDir(rutas.anexosDir);
  ensureDir(rutas.firmasDir);
  ensureDir(rutas.pdfDir);
  ensureDir(rutas.jsonDir);

  return rutas;
}

export function existsPath(targetPath: string): boolean {
  return fs.existsSync(targetPath);
}