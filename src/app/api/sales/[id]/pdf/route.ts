import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { getCurrentUserContext } from "@/lib/auth/session";
import { getSaleById } from "@/lib/data/sales";
import { getShopSettings } from "@/lib/data/users";
import {
  amountToFrenchWords,
  buildInvoiceNumber,
  formatCurrency,
  formatDate,
  formatDateDayMonth,
  formatPaymentMethod,
  getInvoiceTotals,
} from "@/lib/utils/format";
import { getPublicImageUrl } from "@/lib/utils/images";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 32;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const BRAND = rgb(0.05, 0.44, 0.4);
const BORDER = rgb(0.86, 0.89, 0.91);
const MUTED = rgb(0.43, 0.5, 0.54);
const TEXT = rgb(0.09, 0.13, 0.15);
const SUCCESS = rgb(0.05, 0.5, 0.33);
const SOFT = rgb(0.97, 0.96, 0.93);
const WHITE = rgb(1, 1, 1);

function sanitizePdfText(input: string | number | null | undefined) {
  return String(input ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/•/g, "-")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const clean = sanitizePdfText(text);

  if (!clean) {
    return [""];
  }

  const words = clean.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
      continue;
    }

    lines.push(word);
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function drawTextLines(
  page: PDFPage,
  lines: string[],
  {
    x,
    y,
    font,
    size,
    color = TEXT,
    lineHeight = size + 3,
  }: {
    x: number;
    y: number;
    font: PDFFont;
    size: number;
    color?: ReturnType<typeof rgb>;
    lineHeight?: number;
  },
) {
  let cursor = y;

  for (const line of lines) {
    const safeLine = sanitizePdfText(line);

    if (!safeLine) {
      cursor -= lineHeight;
      continue;
    }

    page.drawText(safeLine, {
      x,
      y: cursor,
      size,
      font,
      color,
    });

    cursor -= lineHeight;
  }

  return cursor;
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  {
    y,
    font,
    size,
    color = TEXT,
  }: {
    y: number;
    font: PDFFont;
    size: number;
    color?: ReturnType<typeof rgb>;
  },
) {
  const safeText = sanitizePdfText(text);

  if (!safeText) {
    return;
  }

  const width = font.widthOfTextAtSize(safeText, size);
  const x = Math.max(PAGE_MARGIN, (PAGE_WIDTH - width) / 2);

  page.drawText(safeText, {
    x,
    y,
    size,
    font,
    color,
  });
}

function drawPdfText(
  page: PDFPage,
  text: string | number | null | undefined,
  {
    x,
    y,
    size,
    font,
    color = TEXT,
  }: {
    x: number;
    y: number;
    size: number;
    font: PDFFont;
    color?: ReturnType<typeof rgb>;
  },
) {
  const safeText = sanitizePdfText(text);

  if (!safeText) {
    return;
  }

  page.drawText(safeText, {
    x,
    y,
    size,
    font,
    color,
  });
}

function drawBox(page: PDFPage, x: number, yTop: number, width: number, height: number, fill = WHITE) {
  page.drawRectangle({
    x,
    y: yTop - height,
    width,
    height,
    color: fill,
    borderColor: BORDER,
    borderWidth: 1,
  });
}

async function loadLogoImage(pdf: PDFDocument, path: string | null | undefined) {
  const imageUrl = getPublicImageUrl(path);

  if (!imageUrl) {
    return null;
  }

  try {
    const response = await fetch(imageUrl, { cache: "no-store" });

    if (!response.ok) {
      return null;
    }

    const bytes = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("png")) {
      return pdf.embedPng(bytes);
    }

    return pdf.embedJpg(bytes);
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { searchParams } = new URL(request.url);
  const dispositionMode = searchParams.get("mode") === "inline" ? "inline" : "attachment";
  const context = await getCurrentUserContext();

  if (!context) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  if (!context.permissions.recordSale) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { id } = await params;
  const sale = await getSaleById(id);
  const settings = await getShopSettings();

  if (!sale) {
    return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
  }

  const pdf = await PDFDocument.create();
  const isInvoice = sale.invoice_requested;
  const documentLabel = isInvoice ? "Facture" : "Bon de vente";
  pdf.setTitle(`${documentLabel} ${sale.sale_number}`);
  pdf.setAuthor(settings?.shop_name || "TAHA DESIGN");
  pdf.setCreator("TAHA DESIGN Stock");
  pdf.setProducer("TAHA DESIGN Stock");

  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logoImage = await loadLogoImage(pdf, settings?.logo_path);

  const companyName = settings?.shop_name?.trim() || "TAHA DESIGN";
  const companyTagline = settings?.company_tagline?.trim() || (isInvoice ? "Facture de vente" : "Bon de vente");
  const currency = settings?.currency || "MAD";
  const invoicePrefix = settings?.invoice_prefix || "FAC";
  const showTax = Boolean(sale.invoice_requested && sale.apply_tax && Number(sale.tax_rate ?? 0) > 0);
  const taxRate = Number(sale.tax_rate ?? 0);
  const totals = getInvoiceTotals({
    subtotal: Number(sale.subtotal ?? sale.total_amount ?? 0),
    taxRate,
    applyTax: showTax,
    taxAmount: Number(sale.tax_amount ?? 0),
    totalAmount: Number(sale.total_amount ?? 0),
  });
  const documentNumber = isInvoice
    ? buildInvoiceNumber(sale.sale_number, sale.sold_at, invoicePrefix)
    : sale.sale_number;
  const amountInWords = amountToFrenchWords(totals.totalAmount, currency);
  const paymentMethodLabel = formatPaymentMethod(sale.payment_method).toUpperCase();
  const customerName = sale.customer_name || "Client comptoir";
  const customerPhone = sale.customer_phone || "Sans telephone";
  const customerIce = sale.customer_ice?.trim() || null;
  const companyTopLine =
    companyTagline.trim().toLowerCase() !== companyName.trim().toLowerCase() ? companyTagline : null;
  const companyIceLabel = settings?.ice_number ? `ICE: ${settings.ice_number}` : null;
  const footerAddressLine = settings?.address?.trim() || null;
  const footerLegalLine =
    [
      settings?.ice_number ? `ICE : ${settings.ice_number}` : null,
      settings?.if_number ? `IF : ${settings.if_number}` : null,
      settings?.rc_number ? `RC : ${settings.rc_number}` : null,
      settings?.patent_number ? `TP : ${settings.patent_number}` : null,
      settings?.cnss_number ? `CNSS : ${settings.cnss_number}` : null,
      settings?.phone ? `GSM : ${settings.phone}` : null,
    ]
      .filter(Boolean)
      .join(", ") || null;
  const footerContactLine =
    [
      settings?.website_url?.trim() || null,
      settings?.company_email?.trim() || null,
    ]
      .filter(Boolean)
      .join(" • ") || null;
  const footerNote = settings?.invoice_footer?.trim() || null;

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let cursorY = PAGE_HEIGHT - PAGE_MARGIN;

  const addPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    cursorY = PAGE_HEIGHT - PAGE_MARGIN;
  };

  const ensureSpace = (requiredHeight: number) => {
    if (cursorY - requiredHeight < PAGE_MARGIN) {
      addPage();
    }
  };

  drawBox(page, PAGE_MARGIN, cursorY, CONTENT_WIDTH, 92);
  drawPdfText(page, documentLabel.toUpperCase(), {
    x: PAGE_MARGIN + 18,
    y: cursorY - 24,
    size: 9,
    font: boldFont,
    color: BRAND,
  });
  drawPdfText(page, documentNumber, {
    x: PAGE_MARGIN + 18,
    y: cursorY - 54,
    size: 26,
    font: boldFont,
    color: TEXT,
  });
  drawPdfText(page, `${isInvoice ? "Date d'emission" : "Date de vente"} : ${formatDate(sale.sold_at)}`, {
    x: PAGE_MARGIN + 18,
    y: cursorY - 74,
    size: 10,
    font: regularFont,
    color: MUTED,
  });
  drawTextLines(
    page,
    [
      `Date: ${formatDate(sale.sold_at)}`,
      `Reference: ${sale.sale_number}`,
      `Operateur: ${sale.created_by_name || "Systeme"}`,
    ],
    {
      x: PAGE_MARGIN + CONTENT_WIDTH - 160,
      y: cursorY - 24,
      font: regularFont,
      size: 9.5,
      color: MUTED,
      lineHeight: 16,
    },
  );
  cursorY -= 110;

  const companyBoxWidth = CONTENT_WIDTH * 0.58;
  const customerBoxWidth = CONTENT_WIDTH - companyBoxWidth - 14;
  const topBoxesHeight = 126;

  drawBox(page, PAGE_MARGIN, cursorY, companyBoxWidth, topBoxesHeight);
  drawBox(page, PAGE_MARGIN + companyBoxWidth + 14, cursorY, customerBoxWidth, topBoxesHeight);

  if (logoImage) {
    page.drawImage(logoImage, {
      x: PAGE_MARGIN + 16,
      y: cursorY - 82,
      width: 52,
      height: 52,
    });
  } else {
    page.drawRectangle({
      x: PAGE_MARGIN + 16,
      y: cursorY - 82,
      width: 52,
      height: 52,
      color: SOFT,
      borderColor: BORDER,
      borderWidth: 1,
    });
    drawPdfText(page, companyName.slice(0, 1), {
      x: PAGE_MARGIN + 34,
      y: cursorY - 60,
      size: 20,
      font: boldFont,
      color: BRAND,
    });
  }

  drawPdfText(page, companyName, {
    x: PAGE_MARGIN + 82,
    y: cursorY - 34,
    size: 18,
    font: boldFont,
    color: TEXT,
  });

  if (companyTopLine) {
    drawPdfText(page, companyTopLine, {
      x: PAGE_MARGIN + 82,
      y: cursorY - 54,
      size: 9.5,
      font: regularFont,
      color: MUTED,
    });
  }

  if (companyIceLabel) {
    const chipWidth = boldFont.widthOfTextAtSize(companyIceLabel, 9.5) + 20;
    page.drawRectangle({
      x: PAGE_MARGIN + 82,
      y: cursorY - 88,
      width: chipWidth,
      height: 22,
      color: rgb(0.94, 0.98, 0.97),
      borderColor: BORDER,
      borderWidth: 0.8,
    });
    drawPdfText(page, companyIceLabel, {
      x: PAGE_MARGIN + 92,
      y: cursorY - 80,
      size: 9.5,
      font: boldFont,
      color: TEXT,
    });
  }

  const customerX = PAGE_MARGIN + companyBoxWidth + 30;
  drawPdfText(page, isInvoice ? "FACTURER A" : "CLIENT", {
    x: customerX,
    y: cursorY - 24,
    size: 9,
    font: boldFont,
    color: MUTED,
  });
  drawPdfText(page, customerName, {
    x: customerX,
    y: cursorY - 54,
    size: 18,
    font: boldFont,
    color: TEXT,
  });
  drawTextLines(
    page,
    [
      customerPhone,
      isInvoice && customerIce ? `ICE: ${customerIce}` : null,
    ].filter(Boolean) as string[],
    {
      x: customerX,
      y: cursorY - 76,
      font: regularFont,
      size: 9.5,
      color: MUTED,
      lineHeight: 16,
    },
  );
  cursorY -= topBoxesHeight + 18;

  cursorY -= 10;

  const col1 = PAGE_MARGIN + 14;
  const col2 = PAGE_MARGIN + 290;
  const col3 = PAGE_MARGIN + 360;
  const col4 = PAGE_MARGIN + 430;
  const col5 = PAGE_MARGIN + 500;

  const drawTableHeader = () => {
    drawBox(page, PAGE_MARGIN, cursorY, CONTENT_WIDTH, 28, BRAND);
    drawPdfText(page, "DESIGNATION", { x: col1, y: cursorY - 18, size: 9, font: boldFont, color: WHITE });
    drawPdfText(page, "QTE", { x: col2, y: cursorY - 18, size: 9, font: boldFont, color: WHITE });
    drawPdfText(page, showTax ? "P.U. HT" : "P.U.", {
      x: col3,
      y: cursorY - 18,
      size: 9,
      font: boldFont,
      color: WHITE,
    });
    if (showTax) {
      drawPdfText(page, "TVA", { x: col4, y: cursorY - 18, size: 9, font: boldFont, color: WHITE });
      drawPdfText(page, "TOTAL HT", { x: col5, y: cursorY - 18, size: 9, font: boldFont, color: WHITE });
    } else {
      drawPdfText(page, "TOTAL", { x: col5, y: cursorY - 18, size: 9, font: boldFont, color: WHITE });
    }
    cursorY -= 28;
  };

  drawTableHeader();

  for (const item of sale.items) {
    const designationLines = [
      item.product_name_snapshot,
      `Ref ${item.reference_snapshot}${item.variant_label_snapshot ? ` - ${item.variant_label_snapshot}` : ""}`,
    ];
    const rowHeight = 40;

    ensureSpace(rowHeight + 10);

    if (cursorY < PAGE_HEIGHT - PAGE_MARGIN - 28 && cursorY + rowHeight > PAGE_HEIGHT - PAGE_MARGIN - 28) {
      // noop for first page
    }

    if (cursorY - rowHeight < PAGE_MARGIN + 120) {
      addPage();
      drawTableHeader();
    }

    page.drawRectangle({
      x: PAGE_MARGIN,
      y: cursorY - rowHeight,
      width: CONTENT_WIDTH,
      height: rowHeight,
      color: indexColor(item.id),
      borderColor: BORDER,
      borderWidth: 0.6,
    });

    drawTextLines(page, designationLines, {
      x: col1,
      y: cursorY - 14,
      font: designationLines[0] ? boldFont : regularFont,
      size: 10,
      color: TEXT,
      lineHeight: 14,
    });
    drawPdfText(page, String(item.quantity), {
      x: col2 + 10,
      y: cursorY - 21,
      size: 10,
      font: regularFont,
      color: TEXT,
    });
    drawPdfText(page, formatCurrency(item.unit_price, currency), {
      x: col3 - 4,
      y: cursorY - 21,
      size: 9.5,
      font: regularFont,
      color: TEXT,
    });
    if (showTax) {
      drawPdfText(page, `${taxRate}%`, {
        x: col4 + 4,
        y: cursorY - 21,
        size: 9.5,
        font: regularFont,
        color: TEXT,
      });
      drawPdfText(page, formatCurrency(item.line_total, currency), {
        x: col5 - 12,
        y: cursorY - 21,
        size: 9.5,
        font: boldFont,
        color: TEXT,
      });
    } else {
      drawPdfText(page, formatCurrency(item.line_total, currency), {
        x: col5 - 12,
        y: cursorY - 21,
        size: 9.5,
        font: boldFont,
        color: TEXT,
      });
    }

    cursorY -= rowHeight;
  }

  const leftBoxHeight = 104;
  const totalsBoxHeight = showTax ? 124 : 102;
  const footerBlockHeight = Math.max(leftBoxHeight, totalsBoxHeight);
  const footerInfoHeight = footerNote || footerAddressLine || footerLegalLine || footerContactLine ? 72 : 0;
  ensureSpace(footerBlockHeight + footerInfoHeight);

  if (cursorY - footerBlockHeight < PAGE_MARGIN) {
    addPage();
  }

  const leftBlockWidth = CONTENT_WIDTH - 200;
  const rightBlockWidth = 184;

  drawBox(page, PAGE_MARGIN, cursorY, leftBlockWidth, leftBoxHeight);
  drawPdfText(page, isInvoice ? "ARRETE LA PRESENTE FACTURE A LA SOMME DE :" : "ARRETE LE PRESENT BON DE VENTE A LA SOMME DE :", {
    x: PAGE_MARGIN + 12,
    y: cursorY - 16,
    size: 8.5,
    font: boldFont,
    color: MUTED,
  });
  drawTextLines(page, wrapText(amountInWords, boldFont, 12, leftBlockWidth - 24), {
    x: PAGE_MARGIN + 12,
    y: cursorY - 35,
    font: boldFont,
    size: 12,
    color: TEXT,
    lineHeight: 15,
  });
  page.drawLine({
    start: { x: PAGE_MARGIN + 12, y: cursorY - 68 },
    end: { x: PAGE_MARGIN + leftBlockWidth - 12, y: cursorY - 68 },
    color: BORDER,
    thickness: 1,
  });
  drawPdfText(page, "MODE DE PAIEMENT", {
    x: PAGE_MARGIN + 12,
    y: cursorY - 86,
    size: 8.5,
    font: boldFont,
    color: MUTED,
  });
  drawPdfText(page, paymentMethodLabel, {
    x: PAGE_MARGIN + 12,
    y: cursorY - 102,
    size: 10.5,
    font: boldFont,
    color: TEXT,
  });

  const totalsX = PAGE_MARGIN + leftBlockWidth + 16;
  drawBox(page, totalsX, cursorY, rightBlockWidth, totalsBoxHeight);
  page.drawRectangle({
    x: totalsX,
    y: cursorY - 26,
    width: rightBlockWidth,
    height: 26,
    color: BRAND,
  });
  drawPdfText(page, "SYNTHESE", {
    x: totalsX + 12,
    y: cursorY - 16,
    size: 8.5,
    font: boldFont,
    color: WHITE,
  });

  let totalsY = cursorY - 46;
  const totalsRows = [
    ["HT", formatCurrency(totals.subtotal, currency)],
    ...(showTax ? [[`TVA ${taxRate}%`, formatCurrency(totals.taxAmount, currency)]] : []),
  ] as Array<[string, string]>;

  for (const [label, value] of totalsRows) {
    drawPdfText(page, label, { x: totalsX + 12, y: totalsY, size: 10, font: boldFont, color: MUTED });
    drawPdfText(page, value, { x: totalsX + 88, y: totalsY, size: 10, font: boldFont, color: TEXT });
    page.drawLine({
      start: { x: totalsX + 12, y: totalsY - 8 },
      end: { x: totalsX + rightBlockWidth - 12, y: totalsY - 8 },
      color: BORDER,
      thickness: 1,
    });
    totalsY -= 22;
  }

  drawPdfText(page, showTax ? "TTC" : "TOTAL", {
    x: totalsX + 12,
    y: totalsY - 2,
    size: 11.5,
    font: boldFont,
    color: TEXT,
  });
  drawPdfText(page, formatCurrency(totals.totalAmount, currency), {
    x: totalsX + 58,
    y: totalsY - 4,
    size: 17,
    font: boldFont,
    color: TEXT,
  });

  let footerY = PAGE_MARGIN + 44;

  if (footerContactLine) {
    drawCenteredText(page, footerContactLine, {
      y: footerY,
      font: regularFont,
      size: 8.5,
      color: MUTED,
    });
    footerY += 18;
  }

  if (footerLegalLine) {
    drawCenteredText(page, footerLegalLine, {
      y: footerY,
      font: boldFont,
      size: 9.5,
      color: TEXT,
    });
    footerY += 20;
  }

  if (footerAddressLine) {
    drawCenteredText(page, footerAddressLine, {
      y: footerY,
      font: regularFont,
      size: 10,
      color: TEXT,
    });
    footerY += 20;
  }

  if (footerNote) {
    drawCenteredText(page, footerNote, {
      y: footerY,
      font: regularFont,
      size: 8.5,
      color: MUTED,
    });
  }

  const pdfBytes = await pdf.save();
  const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
  new Uint8Array(pdfBuffer).set(pdfBytes);

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${dispositionMode}; filename="${documentNumber.toLowerCase()}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

function indexColor(seed: string) {
  const code = seed.charCodeAt(0) % 2;
  return code === 0 ? WHITE : SOFT;
}
