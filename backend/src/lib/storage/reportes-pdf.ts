// backend/src/lib/storage/reportes-pdf.ts
import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  obtenerRutaPdfEntregableReporte,
  obtenerRutaPdfInternoReporte,
} from "./reportes-storage";

type GenerarPdfReporteParams = {
  numeroReporte: string;
  reporte: any;
  detallesMaquinas: any[];
  anexos: any[];
  cierre: any;
};

type ResultadoPdfReporte = {
  rutaPdfInterno: string;
  rutaPdfEntregable: string;
};

type TextoOptions = {
  font: any;
  size: number;
  maxWidth: number;
};

type ResultadoFirma = {
  ok: boolean;
  heightUsed: number;
  motivo: string;
};

function formatearFecha(valor?: string | Date | null): string {
  if (!valor) return "N/D";

  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);

  return fecha.toLocaleString("es-HN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function textoPlano(valor: any): string {
  if (valor === null || valor === undefined || valor === "") return "N/D";
  return String(valor);
}

function limpiarTexto(valor: any): string {
  if (valor === null || valor === undefined) return "";
  return String(valor).replace(/\r/g, "").trim();
}

function partirTextoEnLineas(
  texto: string,
  { font, size, maxWidth }: TextoOptions
): string[] {
  if (!texto?.trim()) return [""];

  const palabras = texto.split(/\s+/);
  const lineas: string[] = [];
  let lineaActual = "";

  for (const palabra of palabras) {
    const candidata = lineaActual ? `${lineaActual} ${palabra}` : palabra;
    const ancho = font.widthOfTextAtSize(candidata, size);

    if (ancho <= maxWidth) {
      lineaActual = candidata;
    } else {
      if (lineaActual) lineas.push(lineaActual);
      lineaActual = palabra;
    }
  }

  if (lineaActual) lineas.push(lineaActual);

  return lineas.length ? lineas : [""];
}

function partirTextoPreservandoSaltos(
  texto: string,
  options: TextoOptions
): string[] {
  const textoLimpio = (texto || "").replace(/\r/g, "");
  const bloques = textoLimpio.split("\n");
  const lineasFinales: string[] = [];

  for (const bloque of bloques) {
    if (!bloque.trim()) {
      lineasFinales.push("");
      continue;
    }

    const lineas = partirTextoEnLineas(bloque, options);
    lineasFinales.push(...lineas);
  }

  return lineasFinales.length ? lineasFinales : [""];
}

function obtenerPrimerValor(...valores: any[]): string {
  for (const valor of valores) {
    if (valor !== null && valor !== undefined && String(valor).trim() !== "") {
      return String(valor);
    }
  }
  return "N/D";
}

function normalizarTextoVisual(valor: string): string {
  return valor
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_/-]/g, "");
}

function abreviarTipoUnidadVisual(tipo?: string | null): string {
  const valor = limpiarTexto(tipo).toUpperCase();

  const mapa: Record<string, string> = {
    MINI_SPLIT_9000: "MS9",
    MINI_SPLIT_12000: "MS12",
    MINI_SPLIT_18000: "MS18",
    MINI_SPLIT_24000: "MS24",
    MINI_SPLIT_36000: "MS36",
    PISO_TECHO_36000: "PT36",
    PISO_TECHO_60000: "PT60",
    CHILLER: "CHIL",
    CUARTO_FRIO: "CF",
    CAMARA_FRIA: "CF",
    EVAPORADOR: "EVAP",
    CONDENSADOR: "COND",
  };

  if (mapa[valor]) return mapa[valor];

  const partes = valor.split("_").filter(Boolean);
  if (!partes.length) return "EQ";

  if (partes.length === 1) {
    return partes[0].slice(0, 4);
  }

  return partes
    .map((parte) => parte[0])
    .join("")
    .slice(0, 5);
}

function construirNombreMaquina(reporte: any, detalles: any[]): string {
  const maquina = reporte?.maquina ?? detalles?.[0]?.maquina ?? null;

  const codigoInterno = limpiarTexto(maquina?.codigoInterno);
  if (codigoInterno) return codigoInterno;

  const nombreEquipo = limpiarTexto(maquina?.nombreEquipo);
  if (nombreEquipo) return nombreEquipo;

  const partes = [
    limpiarTexto(maquina?.marca),
    limpiarTexto(maquina?.modelo),
    limpiarTexto(maquina?.serie) ? `Serie ${limpiarTexto(maquina?.serie)}` : "",
    limpiarTexto(maquina?.area),
  ].filter(Boolean);

  return partes.length ? partes.join(" | ") : "N/D";
}

function construirNombreMaquinaVisual(reporte: any, detalles: any[]): string {
  const maquina = reporte?.maquina ?? detalles?.[0]?.maquina ?? null;

  const tipoUnidad = obtenerPrimerValor(
    reporte?.tipoUnidad?.nombre,
    detalles?.[0]?.tipoUnidad?.nombre,
    detalles?.[0]?.maquina?.tipoUnidad?.nombre
  );

  const marca = limpiarTexto(
    obtenerPrimerValor(maquina?.marca, maquina?.marcaCatalogo?.nombre)
  );

  const serie = limpiarTexto(maquina?.serie);
  const area = limpiarTexto(maquina?.area);

  const partes = [
    abreviarTipoUnidadVisual(tipoUnidad),
    normalizarTextoVisual(marca),
    normalizarTextoVisual(serie),
    normalizarTextoVisual(area),
  ].filter(Boolean);

  return partes.length
    ? partes.join(" - ")
    : construirNombreMaquina(reporte, detalles);
}

function separarDescripcionEnumerada(texto: string): string[] {
  const limpio = limpiarTexto(texto);
  if (!limpio) return [];

  const normalizado = limpio.replace(/\s+/g, " ").trim();

  if (!/\d+\./.test(normalizado)) {
    return [normalizado];
  }

  const partes = normalizado
    .split(/(?=\d+\.\s)/g)
    .map((item) => item.trim())
    .filter(Boolean);

  return partes.length ? partes : [normalizado];
}

function separarTextoEnPasosVisuales(texto: string): string[] {
  const limpio = limpiarTexto(texto);
  if (!limpio) return [];

  const porSaltos = limpio
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  if (porSaltos.length > 1) {
    return porSaltos;
  }

  const enumerados = separarDescripcionEnumerada(limpio);
  if (enumerados.length > 1) {
    return enumerados;
  }

  const porFrases = limpio
    .split(/(?<=[.:;])\s+(?=[A-ZÁÉÍÓÚÑ0-9])/g)
    .map((item) => item.trim())
    .filter(Boolean);

  return porFrases.length ? porFrases : [limpio];
}

function construirTextoProcedimiento(detalles: any[]): string {
  if (!detalles.length) return "N/D";

  const bloques: string[] = [];

  detalles.forEach((detalle: any, index: number) => {
    const lineas: string[] = [];

    const tituloActividad = limpiarTexto(detalle.tituloActividad);
    const descripcionActividadPdf = limpiarTexto(detalle.descripcionActividadPdf);
    const diagnostico = limpiarTexto(detalle.diagnostico);
    const trabajoRealizado = limpiarTexto(detalle.trabajoRealizado);
    const recomendaciones = limpiarTexto(detalle.recomendaciones);

    if (tituloActividad) {
      lineas.push(`• Actividad: ${tituloActividad}`);
    } else if (detalles.length > 1) {
      lineas.push(`• Detalle ${index + 1}`);
    }

    if (descripcionActividadPdf) {
      lineas.push("• Procedimiento:");
      const pasos = separarTextoEnPasosVisuales(descripcionActividadPdf);
      pasos.forEach((paso) => {
        lineas.push(`  - ${paso}`);
      });
    }

    if (diagnostico) {
      lineas.push(`• Diagnóstico: ${diagnostico}`);
    }

    if (trabajoRealizado) {
      lineas.push(`• Trabajo realizado: ${trabajoRealizado}`);
    }

    if (recomendaciones) {
      lineas.push(`• Recomendaciones: ${recomendaciones}`);
    }

    if (lineas.length) {
      bloques.push(lineas.join("\n"));
    }
  });

  return bloques.length ? bloques.join("\n\n") : "N/D";
}

function normalizarCategoria(categoria?: string | null): string {
  const valor = limpiarTexto(categoria || "Condición general").toLowerCase();

  const sinAcentos = valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const mapa: Record<string, string> = {
    electrico: "Eléctrico",
    general: "Condición general",
    mecanico: "Mecánico",
    operacion: "Operación",
    refrigeracion: "Refrigeración",
    "condicion general": "Condición general",
  };

  return mapa[sinAcentos] || "Condición general";
}

function construirTextoHallazgos(detalles: any[]): string {
  if (!detalles.length) return "No se registraron hallazgos.";

  const grupos = new Map<string, string[]>();

  detalles.forEach((detalle: any) => {
    const tieneHallazgosRelacionados =
      Array.isArray(detalle.hallazgos) && detalle.hallazgos.length > 0;

    if (!tieneHallazgosRelacionados) {
      const textoPlanoHallazgo = limpiarTexto(detalle.hallazgosTexto);
      if (textoPlanoHallazgo) {
        const categoria = "Condición general";
        const items = grupos.get(categoria) || [];
        items.push(`- ${textoPlanoHallazgo}`);
        grupos.set(categoria, items);
      }
    }

    if (tieneHallazgosRelacionados) {
      detalle.hallazgos.forEach((hallazgo: any) => {
        const codigo = obtenerPrimerValor(
          hallazgo.codigoHallazgo,
          hallazgo.hallazgoCatalogo?.codigo
        );

        const descripcion = obtenerPrimerValor(
          hallazgo.descripcionHallazgo,
          hallazgo.hallazgoCatalogo?.descripcion
        );

        const categoria = normalizarCategoria(
          hallazgo.hallazgoCatalogo?.categoria
        );

        const items = grupos.get(categoria) || [];
        items.push(`- ${codigo}: ${descripcion}`);
        grupos.set(categoria, items);
      });
    }
  });

  if (!grupos.size) return "No se registraron hallazgos.";

  const bloques: string[] = [];

  for (const [categoria, items] of grupos.entries()) {
    bloques.push(categoria);
    bloques.push(...items);
    bloques.push("");
  }

  return bloques.join("\n").trim() || "No se registraron hallazgos.";
}

function esRutaImagen(rutaArchivo?: string | null): boolean {
  if (!rutaArchivo) return false;
  const lower = rutaArchivo.toLowerCase();
  return (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".webp")
  );
}

async function incrustarImagenDesdeRuta(params: {
  pdfDoc: PDFDocument;
  rutaArchivo: string;
}) {
  const { pdfDoc, rutaArchivo } = params;
  const buffer = fs.readFileSync(rutaArchivo);
  const lower = rutaArchivo.toLowerCase();

  if (lower.endsWith(".png")) {
    return pdfDoc.embedPng(buffer);
  }

  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return pdfDoc.embedJpg(buffer);
  }

  if (lower.endsWith(".webp")) {
    throw new Error(
      "WEBP no soportado directamente por pdf-lib. Conviene convertirlo a JPG o PNG antes."
    );
  }

  throw new Error("Formato de imagen no soportado.");
}

async function dibujarFirmaSiExiste(params: {
  pdfDoc: PDFDocument;
  page: any;
  rutaFirma?: string | null;
  x: number;
  y: number;
  maxWidth?: number;
  maxHeight?: number;
}): Promise<ResultadoFirma> {
  const {
    pdfDoc,
    page,
    rutaFirma,
    x,
    y,
    maxWidth = 170,
    maxHeight = 70,
  } = params;

  if (!rutaFirma) {
    return { ok: false, heightUsed: 0, motivo: "sin_ruta" };
  }

  if (!fs.existsSync(rutaFirma)) {
    return { ok: false, heightUsed: 0, motivo: "archivo_no_existe" };
  }

  const buffer = fs.readFileSync(rutaFirma);
  const rutaLower = rutaFirma.toLowerCase();

  let imagen: any;

  if (rutaLower.endsWith(".png")) {
    imagen = await pdfDoc.embedPng(buffer);
  } else if (rutaLower.endsWith(".jpg") || rutaLower.endsWith(".jpeg")) {
    imagen = await pdfDoc.embedJpg(buffer);
  } else {
    return { ok: false, heightUsed: 0, motivo: "formato_no_soportado" };
  }

  const dimensiones = imagen.scale(1);

  const escala = Math.min(
    maxWidth / dimensiones.width,
    maxHeight / dimensiones.height
  );

  const width = Math.max(dimensiones.width * escala, 120);
  const height = Math.max(dimensiones.height * escala, 40);

  page.drawRectangle({
    x,
    y: y - height - 8,
    width: Math.max(width + 16, 220),
    height: Math.max(height + 16, 56),
    borderWidth: 1,
    borderColor: rgb(0.75, 0.75, 0.75),
  });

  page.drawImage(imagen, {
    x: x + 8,
    y: y - height,
    width,
    height,
  });

  return {
    ok: true,
    heightUsed: Math.max(height + 24, 64),
    motivo: "ok",
  };
}

async function dibujarLogoEmpresa(params: {
  pdfDoc: PDFDocument;
  page: any;
  x: number;
  y: number;
  maxWidth?: number;
  maxHeight?: number;
}): Promise<{ ok: boolean; widthUsed: number; heightUsed: number }> {
  const {
    pdfDoc,
    page,
    x,
    y,
    maxWidth = 78,
    maxHeight = 42,
  } = params;

  const rutasLogo = [
    path.resolve(process.cwd(), "storage", "assets", "logo_er.png"),
    path.resolve(process.cwd(), "storage", "assets", "logo_er.jpg"),
    path.resolve(process.cwd(), "storage", "assets", "logo_er.jpeg"),
  ];

  const rutaLogo = rutasLogo.find((ruta) => fs.existsSync(ruta));

  if (!rutaLogo) {
    return { ok: false, widthUsed: 0, heightUsed: 0 };
  }

  const buffer = fs.readFileSync(rutaLogo);
  const rutaLower = rutaLogo.toLowerCase();

  let imagen: any;

  if (rutaLower.endsWith(".png")) {
    imagen = await pdfDoc.embedPng(buffer);
  } else if (rutaLower.endsWith(".jpg") || rutaLower.endsWith(".jpeg")) {
    imagen = await pdfDoc.embedJpg(buffer);
  } else {
    return { ok: false, widthUsed: 0, heightUsed: 0 };
  }

  const dimensiones = imagen.scale(1);

  const escala = Math.min(
    maxWidth / dimensiones.width,
    maxHeight / dimensiones.height
  );

  const width = dimensiones.width * escala;
  const height = dimensiones.height * escala;

  page.drawImage(imagen, {
    x,
    y: y - height,
    width,
    height,
  });

  return { ok: true, widthUsed: width, heightUsed: height };
}

export async function generarPdfReporteLocal(
  params: GenerarPdfReporteParams
): Promise<ResultadoPdfReporte> {
  const pdfDoc = await PDFDocument.create();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595;
  const pageHeight = 842;
  const marginX = 42;
  const marginTop = 40;
  const marginBottom = 42;
  const contentWidth = pageWidth - marginX * 2;

  const colorAzul = rgb(0.05, 0.20, 0.42);
  const colorAzulSuave = rgb(0.90, 0.94, 0.98);
  const colorGrisLinea = rgb(0.80, 0.83, 0.86);
  const colorTexto = rgb(0.10, 0.10, 0.10);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - marginTop;

  const reporte = params.reporte;
  const detalles = params.detallesMaquinas || [];
  const anexos = params.anexos || [];
  const cierre = params.cierre;

  const tieneAnexos = Array.isArray(anexos) && anexos.length > 0;

  const mostrarRecepcionTrabajo =
    !!cierre &&
    (
      !!cierre.urlFirma ||
      !!cierre.nombreRecibe ||
      !!cierre.puestoRecibe ||
      !!cierre.observaciones ||
      !!cierre.motivoNoRecepcion ||
      !!cierre.fechaCierre
    );

  const tieneFirma = Boolean(cierre?.urlFirma);

  const marcaEquipo = obtenerPrimerValor(
    reporte.maquina?.marca,
    reporte.maquina?.marcaCatalogo?.nombre,
    detalles[0]?.maquina?.marca,
    detalles[0]?.maquina?.marcaCatalogo?.nombre
  );

  const maquinaTexto = construirNombreMaquinaVisual(reporte, detalles);

  const tipoUnidadTexto = obtenerPrimerValor(
    reporte.typeUnidad?.nombre,
    reporte.tipoUnidad?.nombre,
    detalles[0]?.tipoUnidad?.nombre,
    detalles[0]?.maquina?.tipoUnidad?.nombre
  );

  const psiSuccion = obtenerPrimerValor(detalles[0]?.psi, reporte.psi);
  const amperaje = obtenerPrimerValor(detalles[0]?.amperaje, reporte.amperaje);

  const textoProcedimiento = construirTextoProcedimiento(detalles);
  const textoHallazgos = construirTextoHallazgos(detalles);

  const nuevaPagina = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - marginTop;
  };

  const ensureSpace = (altoNecesario = 20) => {
    if (y - altoNecesario < marginBottom) {
      nuevaPagina();
    }
  };

  const ensureSectionSpace = (altoMinimo = 120) => {
    if (y - altoMinimo < marginBottom) {
      nuevaPagina();
    }
  };

  const drawWrappedText = (
    texto: string,
    x: number,
    yBase: number,
    size: number,
    font: any,
    maxWidth: number,
    lineGap = 3
  ) => {
    const lineas = partirTextoPreservandoSaltos(texto, {
      font,
      size,
      maxWidth,
    });

    let cursorY = yBase;

    for (const linea of lineas) {
      if (!linea) {
        cursorY -= size + lineGap;
        continue;
      }

      page.drawText(linea, {
        x,
        y: cursorY,
        size,
        font,
        color: colorTexto,
      });
      cursorY -= size + lineGap;
    }

    return {
      lineas,
      finalY: cursorY,
      heightUsed: lineas.length * (size + lineGap),
    };
  };

  const drawSectionTitle = (titulo: string, minSpaceAfter = 120) => {
    ensureSectionSpace(minSpaceAfter);

    page.drawRectangle({
      x: marginX,
      y: y - 16,
      width: contentWidth,
      height: 20,
      color: colorAzulSuave,
      borderWidth: 0.8,
      borderColor: colorGrisLinea,
    });

    page.drawText(titulo, {
      x: marginX + 8,
      y: y - 10,
      size: 11,
      font: fontBold,
      color: colorAzul,
    });

    y -= 28;
  };

  const drawInfoBox = (
    titulo: string,
    rows: Array<{ label: string; value: string }>
  ) => {
    const titleHeight = 16;
    let totalRowsHeight = 0;

    rows.forEach((row) => {
      const wrapped = partirTextoPreservandoSaltos(row.value || "N/D", {
        font: fontRegular,
        size: 9.5,
        maxWidth: contentWidth - 155,
      });

      totalRowsHeight += Math.max(18, wrapped.length * 11);
    });

    const totalHeight = titleHeight + totalRowsHeight + 12;

    ensureSpace(totalHeight + 8);

    page.drawRectangle({
      x: marginX,
      y: y - totalHeight + 6,
      width: contentWidth,
      height: totalHeight,
      borderWidth: 0.9,
      borderColor: colorGrisLinea,
    });

    page.drawRectangle({
      x: marginX,
      y: y - 10,
      width: contentWidth,
      height: 18,
      color: colorAzul,
    });

    page.drawText(titulo, {
      x: marginX + 8,
      y: y - 4,
      size: 10,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    let rowY = y - 28;

    rows.forEach((row) => {
      page.drawText(`${row.label}:`, {
        x: marginX + 8,
        y: rowY,
        size: 9.5,
        font: fontBold,
        color: colorTexto,
      });

      const wrapped = drawWrappedText(
        row.value || "N/D",
        marginX + 145,
        rowY,
        9.5,
        fontRegular,
        contentWidth - 155,
        2
      );

      rowY -= Math.max(18, wrapped.lineas.length * 11);
    });

    y = rowY - 4;
  };

  const drawTextAreaBox = (titulo: string, texto: string) => {
    const lineas = partirTextoPreservandoSaltos(texto || "N/D", {
      font: fontRegular,
      size: 10,
      maxWidth: contentWidth - 18,
    });

    const textHeight = Math.max(44, lineas.length * 14 + 12);
    const totalHeight = textHeight + 24;

    ensureSpace(totalHeight + 8);

    page.drawRectangle({
      x: marginX,
      y: y - totalHeight + 6,
      width: contentWidth,
      height: totalHeight,
      borderWidth: 0.9,
      borderColor: colorGrisLinea,
    });

    page.drawRectangle({
      x: marginX,
      y: y - 10,
      width: contentWidth,
      height: 18,
      color: colorAzul,
    });

    page.drawText(titulo, {
      x: marginX + 8,
      y: y - 4,
      size: 10,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    let textY = y - 30;

    lineas.forEach((linea) => {
      if (!linea) {
        textY -= 14;
        return;
      }

      page.drawText(linea, {
        x: marginX + 8,
        y: textY,
        size: 10,
        font: fontRegular,
        color: colorTexto,
      });
      textY -= 14;
    });

    y = y - totalHeight - 4;
  };

  const agregarNumeracionPaginas = () => {
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    pages.forEach((pagina, index) => {
      pagina.drawLine({
        start: { x: marginX, y: 34 },
        end: { x: pageWidth - marginX, y: 34 },
        thickness: 0.8,
        color: colorGrisLinea,
      });

      pagina.drawText(`Página ${index + 1} de ${totalPages}`, {
        x: pageWidth - 110,
        y: 20,
        size: 9,
        font: fontRegular,
        color: colorTexto,
      });
    });
  };

  const chunkArray = <T,>(items: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  };

  const dibujarAnexosEnCuadricula = async (anexosImagen: any[]) => {
    const grupos = chunkArray(anexosImagen, 4);

    for (let grupoIndex = 0; grupoIndex < grupos.length; grupoIndex++) {
      const grupo = grupos[grupoIndex];

      nuevaPagina();
      drawSectionTitle("9. ANEXOS", 520);

      const COLUMNAS = 2;
      const FILAS = 2;
      const colGap = 14;
      const rowGap = 14;
      const cellWidth = (contentWidth - colGap) / 2;
      const cellHeight = 250;

      const startY = y - 8;

      for (let i = 0; i < grupo.length; i++) {
        const anexo = grupo[i];
        const col = i % COLUMNAS;
        const row = Math.floor(i / COLUMNAS);

        const boxX = marginX + col * (cellWidth + colGap);
        const boxTopY = startY - row * (cellHeight + rowGap);
        const frameY = boxTopY - cellHeight;

        page.drawRectangle({
          x: boxX,
          y: frameY,
          width: cellWidth,
          height: cellHeight,
          borderWidth: 0.9,
          borderColor: colorGrisLinea,
        });

        const rutaArchivo = anexo.urlArchivo;

        if (!rutaArchivo || !fs.existsSync(rutaArchivo)) {
          page.drawText("No se pudo cargar la imagen.", {
            x: boxX + 8,
            y: frameY + cellHeight / 2,
            size: 9,
            font: fontRegular,
            color: colorTexto,
          });
          continue;
        }

        try {
          const imagen = await incrustarImagenDesdeRuta({
            pdfDoc,
            rutaArchivo,
          });

          const dimensiones = imagen.scale(1);
          const maxWidth = cellWidth - 12;
          const maxHeight = cellHeight - 12;

          const escala = Math.min(
            maxWidth / dimensiones.width,
            maxHeight / dimensiones.height
          );

          const width = dimensiones.width * escala;
          const height = dimensiones.height * escala;

          page.drawImage(imagen, {
            x: boxX + (cellWidth - width) / 2,
            y: frameY + (cellHeight - height) / 2,
            width,
            height,
          });
        } catch (_error) {
          page.drawText("No se pudo incrustar la imagen.", {
            x: boxX + 8,
            y: frameY + cellHeight / 2,
            size: 9,
            font: fontRegular,
            color: colorTexto,
          });
        }
      }

      y = startY - FILAS * cellHeight - rowGap - 18;
    }
  };

  page.drawRectangle({
    x: marginX,
    y: y - 56,
    width: contentWidth,
    height: 60,
    color: colorAzul,
  });

  const logo = await dibujarLogoEmpresa({
    pdfDoc,
    page,
    x: marginX + 8,
    y: y - 6,
    maxWidth: 78,
    maxHeight: 42,
  });

  const textoHeaderX = logo.ok ? marginX + 95 : marginX + 10;

  page.drawText("EXPERTOS EN REFRIGERACIÓN", {
    x: textoHeaderX,
    y: y - 18,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`REPORTE TÉCNICO #${params.numeroReporte}`, {
    x: textoHeaderX,
    y: y - 38,
    size: 12,
    font: fontRegular,
    color: rgb(1, 1, 1),
  });

  y -= 74;

  drawSectionTitle("1. DATOS GENERALES", 120);
  drawInfoBox("Información general", [
    { label: "Número de reporte", value: textoPlano(reporte.numeroReporte) },
    { label: "Fecha del reporte", value: formatearFecha(reporte.fechaReporte) },
    { label: "Cliente", value: textoPlano(reporte.cliente?.nombre) },
    { label: "Técnico", value: textoPlano(reporte.tecnico?.nombre) },
    { label: "Visita ID", value: textoPlano(reporte.visitaId) },
  ]);

  drawSectionTitle("2. UNIDAD / EQUIPO", 140);
  drawInfoBox("Unidad / equipo", [
    { label: "Máquina", value: maquinaTexto },
    { label: "Marca", value: marcaEquipo },
    { label: "Modelo", value: textoPlano(reporte.maquina?.modelo) },
    { label: "Serie", value: textoPlano(reporte.maquina?.serie) },
    { label: "Tipo de unidad", value: tipoUnidadTexto },
  ]);

  drawSectionTitle("3. PROCEDIMIENTO", 200);
  drawTextAreaBox("Procedimiento realizado", textoProcedimiento);

  nuevaPagina();
  drawSectionTitle("4. HALLAZGOS", 160);
  drawTextAreaBox("Hallazgos encontrados", textoHallazgos);

  drawSectionTitle("5. CONCLUSIONES", 100);
  drawTextAreaBox("Conclusiones", textoPlano(reporte.conclusiones));

  drawSectionTitle("6. OBSERVACIONES", 100);
  drawTextAreaBox("Observaciones", textoPlano(reporte.observaciones));

  drawSectionTitle("7. PARÁMETROS TÉCNICOS", 100);
  drawInfoBox("Parámetros", [
    { label: "PSI de succión", value: psiSuccion },
    { label: "Amperaje", value: amperaje },
  ]);

  if (tieneAnexos) {
    const anexosImagen = anexos.filter(
      (anexo: any) =>
        esRutaImagen(anexo.urlArchivo) ||
        String(anexo.mimeType || "").toLowerCase().startsWith("image/")
    );

    const anexosNoImagen = anexos.filter(
      (anexo: any) =>
        !(
          esRutaImagen(anexo.urlArchivo) ||
          String(anexo.mimeType || "").toLowerCase().startsWith("image/")
        )
    );

    if (anexosImagen.length) {
      await dibujarAnexosEnCuadricula(anexosImagen);
    }

    if (anexosNoImagen.length) {
      nuevaPagina();
      drawSectionTitle("9. ANEXOS", 120);
      drawTextAreaBox(
        "Otros anexos",
        anexosNoImagen
          .map(
            (anexo: any, index: number) =>
              `- ${index + 1}. ${textoPlano(anexo.nombreArchivo)}`
          )
          .join("\n")
      );
    }
  }

  if (mostrarRecepcionTrabajo) {
    nuevaPagina();
    drawSectionTitle("8. RECEPCIÓN DE TRABAJO", 180);

    const rowsRecepcion: Array<{ label: string; value: string }> = [];

    if (cierre.nombreRecibe) {
      rowsRecepcion.push({
        label: "Nombre de quien recibe",
        value: textoPlano(cierre.nombreRecibe),
      });
    }

    if (cierre.puestoRecibe) {
      rowsRecepcion.push({
        label: "Puesto",
        value: textoPlano(cierre.puestoRecibe),
      });
    }

    if (cierre.motivoNoRecepcion) {
      rowsRecepcion.push({
        label: "Motivo de no recepción",
        value: textoPlano(cierre.motivoNoRecepcion),
      });
    }

    if (cierre.observaciones) {
      rowsRecepcion.push({
        label: "Observaciones",
        value: textoPlano(cierre.observaciones),
      });
    }

    if (cierre.fechaCierre) {
      rowsRecepcion.push({
        label: "Fecha de cierre",
        value: formatearFecha(cierre.fechaCierre),
      });
    }

    if (rowsRecepcion.length) {
      drawInfoBox("Recepción de trabajo", rowsRecepcion);
    }

    if (tieneFirma) {
      page.drawText("Firma del cliente:", {
        x: marginX,
        y,
        size: 10,
        font: fontBold,
        color: colorTexto,
      });

      y -= 16;

      ensureSpace(110);

      const resultadoFirma = await dibujarFirmaSiExiste({
        pdfDoc,
        page,
        rutaFirma: cierre.urlFirma,
        x: marginX,
        y,
        maxWidth: 170,
        maxHeight: 70,
      });

      if (resultadoFirma.ok) {
        y -= resultadoFirma.heightUsed;
      } else {
        page.drawText("No fue posible cargar la firma guardada.", {
          x: marginX,
          y,
          size: 9,
          font: fontRegular,
          color: colorTexto,
        });
        y -= 18;
      }
    }
  }

  agregarNumeracionPaginas();

  const pdfBytes = await pdfDoc.save();

  const rutaPdfInterno = obtenerRutaPdfInternoReporte(params.numeroReporte);
  const rutaPdfEntregable = obtenerRutaPdfEntregableReporte(params.numeroReporte);

  fs.writeFileSync(rutaPdfInterno, pdfBytes);
  fs.writeFileSync(rutaPdfEntregable, pdfBytes);

  return {
    rutaPdfInterno,
    rutaPdfEntregable,
  };
}