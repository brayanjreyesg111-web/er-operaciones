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

function obtenerPrimerValor(...valores: any[]): string {
  for (const valor of valores) {
    if (valor !== null && valor !== undefined && String(valor).trim() !== "") {
      return String(valor);
    }
  }
  return "N/D";
}

function construirTextoProcedimiento(detalles: any[]): string {
  if (!detalles.length) return "N/D";

  const bloques: string[] = [];

  detalles.forEach((detalle: any, index: number) => {
    const partes: string[] = [];

    if (detalle.tituloActividad) {
      partes.push(`Actividad ${index + 1}: ${detalle.tituloActividad}`);
    }

    if (detalle.descripcionActividadPdf) {
      partes.push(`Procedimiento: ${detalle.descripcionActividadPdf}`);
    }

    if (detalle.diagnostico) {
      partes.push(`Diagnóstico: ${detalle.diagnostico}`);
    }

    if (detalle.trabajoRealizado) {
      partes.push(`Trabajo realizado: ${detalle.trabajoRealizado}`);
    }

    if (detalle.recomendaciones) {
      partes.push(`Recomendaciones: ${detalle.recomendaciones}`);
    }

    if (partes.length) {
      bloques.push(partes.join("\n"));
    }
  });

  return bloques.length ? bloques.join("\n\n") : "N/D";
}

function construirTextoHallazgos(detalles: any[]): string {
  if (!detalles.length) return "No se registraron hallazgos.";

  const items: string[] = [];

  detalles.forEach((detalle: any, detalleIndex: number) => {
    if (detalle.hallazgosTexto && String(detalle.hallazgosTexto).trim()) {
      items.push(
        `Detalle ${detalleIndex + 1}: ${String(detalle.hallazgosTexto).trim()}`
      );
    }

    if (Array.isArray(detalle.hallazgos) && detalle.hallazgos.length) {
      detalle.hallazgos.forEach((hallazgo: any) => {
        const codigo = obtenerPrimerValor(
          hallazgo.codigoHallazgo,
          hallazgo.hallazgoCatalogo?.codigo
        );
        const descripcion = obtenerPrimerValor(
          hallazgo.descripcionHallazgo,
          hallazgo.hallazgoCatalogo?.descripcion
        );

        items.push(`${codigo}: ${descripcion}`);
      });
    }
  });

  return items.length ? items.join("\n") : "No se registraron hallazgos.";
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
    maxWidth = 200,
    maxHeight = 90,
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
  } else if (
    rutaLower.endsWith(".jpg") ||
    rutaLower.endsWith(".jpeg")
  ) {
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

  const rutaLogo = path.resolve(
    process.cwd(),
    "storage",
    "assets",
    "logo_er.png"
  );

  if (!fs.existsSync(rutaLogo)) {
    return { ok: false, widthUsed: 0, heightUsed: 0 };
  }

  const buffer = fs.readFileSync(rutaLogo);
  const imagen = await pdfDoc.embedPng(buffer);
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

  const tieneCierre =
    !!cierre &&
    (
      !!cierre.nombreRecibe ||
      !!cierre.puestoRecibe ||
      !!cierre.observaciones ||
      !!cierre.motivoNoRecepcion ||
      !!cierre.urlFirma ||
      !!cierre.fechaCierre
    );

  const tieneFirma = Boolean(cierre?.urlFirma);

  const marcaEquipo = obtenerPrimerValor(
    reporte.maquina?.marca,
    reporte.maquina?.marcaCatalogo?.nombre,
    detalles[0]?.maquina?.marca,
    detalles[0]?.maquina?.marcaCatalogo?.nombre
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

  const drawWrappedText = (
    texto: string,
    x: number,
    yBase: number,
    size: number,
    font: any,
    maxWidth: number,
    lineGap = 3
  ) => {
    const lineas = partirTextoEnLineas(texto, {
      font,
      size,
      maxWidth,
    });

    let cursorY = yBase;

    for (const linea of lineas) {
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

  const drawSectionTitle = (titulo: string) => {
    ensureSpace(30);

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
    const rowHeight = 18;
    const totalHeight = titleHeight + rows.length * rowHeight + 12;

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

      rowY -= Math.max(rowHeight, wrapped.lineas.length * 11);
    });

    y = rowY - 4;
  };

  const drawTextAreaBox = (titulo: string, texto: string) => {
    const lineas = partirTextoEnLineas(texto || "N/D", {
      font: fontRegular,
      size: 10,
      maxWidth: contentWidth - 18,
    });

    const textHeight = Math.max(70, lineas.length * 14 + 18);
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

  // ENCABEZADO CON LOGO
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

  // 1. DATOS GENERALES
  drawSectionTitle("1. DATOS GENERALES");
  drawInfoBox("Información general", [
    { label: "Número de reporte", value: textoPlano(reporte.numeroReporte) },
    { label: "Fecha del reporte", value: formatearFecha(reporte.fechaReporte) },
    { label: "Cliente", value: textoPlano(reporte.cliente?.nombre) },
    { label: "Técnico", value: textoPlano(reporte.tecnico?.nombre) },
    { label: "Visita ID", value: textoPlano(reporte.visitaId) },
  ]);

  // 2. UNIDAD / EQUIPO
  drawSectionTitle("2. UNIDAD / EQUIPO");
  drawInfoBox("Unidad / equipo", [
    { label: "Máquina", value: textoPlano(reporte.maquina?.nombreEquipo) },
    { label: "Marca", value: marcaEquipo },
    { label: "Modelo", value: textoPlano(reporte.maquina?.modelo) },
    { label: "Serie", value: textoPlano(reporte.maquina?.serie) },
    { label: "Tipo de unidad", value: textoPlano(reporte.tipoUnidad?.nombre) },
  ]);

  // 3. PROCEDIMIENTO
  drawSectionTitle("3. PROCEDIMIENTO");
  drawTextAreaBox("Procedimiento realizado", textoProcedimiento);

  // 4. HALLAZGOS
  drawSectionTitle("4. HALLAZGOS");
  drawTextAreaBox("Hallazgos encontrados", textoHallazgos);

  // 5. CONCLUSIONES
  drawSectionTitle("5. CONCLUSIONES");
  drawTextAreaBox("Conclusiones", textoPlano(reporte.conclusiones));

  // 6. OBSERVACIONES
  drawSectionTitle("6. OBSERVACIONES");
  drawTextAreaBox("Observaciones", textoPlano(reporte.observaciones));

  // 7. PARÁMETROS TÉCNICOS
  drawSectionTitle("7. PARÁMETROS TÉCNICOS");
  drawInfoBox("Parámetros", [
    { label: "PSI de succión", value: psiSuccion },
    { label: "Amperaje", value: amperaje },
  ]);

  // 8. RECEPCIÓN DEL CLIENTE
  if (tieneCierre) {
    nuevaPagina();
    drawSectionTitle("8. RECEPCIÓN DEL CLIENTE");

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
      drawInfoBox("Recepción", rowsRecepcion);
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

      ensureSpace(120);

      const resultadoFirma = await dibujarFirmaSiExiste({
        pdfDoc,
        page,
        rutaFirma: cierre.urlFirma,
        x: marginX,
        y,
        maxWidth: 200,
        maxHeight: 90,
      });

      if (resultadoFirma.ok) {
        y -= resultadoFirma.heightUsed;
      }
    }
  }

  // 9. ANEXOS
  if (tieneAnexos) {
    nuevaPagina();
    drawSectionTitle("9. ANEXOS");

    anexos.forEach((anexo: any, index: number) => {
      drawInfoBox(`Anexo #${index + 1}`, [
        { label: "Nombre", value: textoPlano(anexo.nombreArchivo) },
        { label: "Tipo", value: textoPlano(anexo.tipoArchivo) },
        { label: "MimeType", value: textoPlano(anexo.mimeType) },
        {
          label: "Tamaño",
          value:
            anexo.tamanoBytes !== null && anexo.tamanoBytes !== undefined
              ? `${anexo.tamanoBytes} bytes`
              : "N/D",
        },
        { label: "Ruta", value: textoPlano(anexo.urlArchivo) },
      ]);
    });
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