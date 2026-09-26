import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReceiptRow {
  date: string;
  description: string;
  qty: number | null;
  total: number;
}

export interface ReceiptData {
  customerName: string;
  storeName: string;
  rows: ReceiptRow[];
  totalOwed: number;
  totalPaid: number;
  balance: number;
  periodLabel?: string; // e.g. "01/10/2023 - 31/10/2023"
  previousBalance?: number; // Saldo Anterior
}

const PAPER = '#F7F4EF';
const INK = '#1A1815';
const SOFT = '#8A8177';
const RULE = '#C9C0B4';

const fmt = (n: number) => {
  const isNegative = n < 0;
  const absVal = Math.abs(n);
  const formatted = absVal.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return isNegative ? `-${formatted}` : formatted;
};

export function buildHtml(data: ReceiptData): string {
  const today = new Date().toLocaleDateString('pt-PT');

  const rows =
    data.rows.length > 0
      ? data.rows
          .map(
            (r) => `
        <tr class="pdf-block">
          <td style="padding:11px 0;font-size:15px;color:${INK};text-align:left;">${escapeHtml(r.description)}</td>
          <td style="padding:11px 0;font-size:15px;color:${SOFT};text-align:center;">${escapeHtml(r.date)}</td>
          <td style="padding:11px 0;font-size:15px;color:${SOFT};text-align:center;">${r.qty ?? '—'}</td>
          <td style="padding:11px 0;font-size:15px;color:${INK};text-align:right;">${fmt(r.total)} MT</td>
        </tr>`
          )
          .join('')
      : `<tr class="pdf-block"><td colspan="4" style="padding:24px 0;text-align:center;color:${SOFT};font-size:14px;">Sem movimentos</td></tr>`;

  // Determine period or date display label
  const dateLabel = data.periodLabel ? 'PERÍODO' : 'DATA';
  const dateValue = data.periodLabel ? data.periodLabel : today;

  // Render optionally previous balance row
  const hasPreviousBalance = typeof data.previousBalance === 'number';
  const prevBalanceRow = hasPreviousBalance
    ? `
      <div class="pdf-block" style="display:flex;justify-content:space-between;font-size:14px;color:${SOFT};padding:5px 0;">
        <span style="letter-spacing:1.5px;">SALDO ANTERIOR</span><span>${fmt(data.previousBalance!)} MT</span>
      </div>
      `
    : '';

  return `
  <div id="pdf-content" style="width:794px;min-height:1123px;box-sizing:border-box;background:${PAPER};padding:64px 72px;font-family:'Work Sans',Helvetica,Arial,sans-serif;color:${INK};display:flex;flex-direction:column;">
    <div class="pdf-block pdf-header" style="display:flex;align-items:flex-start;justify-content:space-between;">
      <div style="font-family:'Great Vibes',cursive;font-size:70px;line-height:1;color:${INK};">Conta Corrente</div>
      <div style="text-align:right;font-size:13px;letter-spacing:1.5px;color:${SOFT};padding-top:14px;">
        <div style="font-weight:600;">${dateLabel}</div>
        <div style="color:${INK};letter-spacing:1px;margin-top:4px;">${dateValue}</div>
      </div>
    </div>

    <div class="pdf-block" style="margin-top:56px;font-size:15px;">
      <div><span style="font-weight:700;letter-spacing:1.5px;">DE:</span> <span style="margin-left:8px;">${escapeHtml(data.customerName)}</span></div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-top:48px;">
      <thead>
        <tr class="pdf-block" style="border-top:1px solid ${INK};border-bottom:1px solid ${INK};">
          <th style="padding:14px 0;font-size:13px;letter-spacing:1.5px;text-align:left;">DESCRIÇÃO</th>
          <th style="padding:14px 0;font-size:13px;letter-spacing:1.5px;text-align:center;">DATA</th>
          <th style="padding:14px 0;font-size:13px;letter-spacing:1.5px;text-align:center;">QTD</th>
          <th style="padding:14px 0;font-size:13px;letter-spacing:1.5px;text-align:right;">TOTAL</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="pdf-block pdf-summary" style="margin-top:36px;border-top:1px solid ${INK};padding-top:16px;">
      ${prevBalanceRow}
      <div class="pdf-block" style="display:flex;justify-content:space-between;font-size:14px;color:${SOFT};padding:5px 0;">
        <span style="letter-spacing:1.5px;">CONSUMIDO</span><span>${fmt(data.totalOwed)} MT</span>
      </div>
      <div class="pdf-block" style="display:flex;justify-content:space-between;font-size:14px;color:${SOFT};padding:5px 0;">
        <span style="letter-spacing:1.5px;">PAGO</span><span>${fmt(data.totalPaid)} MT</span>
      </div>
      <div class="pdf-block" style="display:flex;justify-content:space-between;font-size:17px;font-weight:700;padding:12px 0 0;border-top:1px solid ${RULE};margin-top:10px;">
        <span style="letter-spacing:1.5px;">SALDO</span><span>${fmt(data.balance)} MT</span>
      </div>
    </div>

    <div style="flex:1;"></div>

    <div class="pdf-block pdf-footer" style="display:flex;align-items:flex-end;justify-content:space-between;margin-top:72px;">
      <div>
        <div style="font-size:20px;font-weight:600;letter-spacing:1px;">FORMA DE PAGAMENTO:</div>
        <div style="margin-top:10px;font-size:15px;color:${SOFT};">Emola — 87 398 8847</div>
      </div>
      <div style="font-family:'Great Vibes',cursive;font-size:54px;line-height:1;">Obrigado!</div>
    </div>
  </div>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );
}

export async function downloadDebtorReceiptPdf(data: ReceiptData) {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;z-index:-1;';
  host.innerHTML = buildHtml(data);
  document.body.appendChild(host);

  try {
    if (document.fonts?.ready) await document.fonts.ready;
    const node = host.firstElementChild as HTMLElement;

    // Collect positions of all atomic blocks before canvas rendering
    const nodeRect = node.getBoundingClientRect();
    const blockElements = Array.from(node.querySelectorAll<HTMLElement>('.pdf-block, tr'));

    const canvas = await html2canvas(node, { scale: 2, backgroundColor: PAPER, useCORS: true });
    const scale = canvas.width / node.offsetWidth;

    const blocks = blockElements
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          top: (r.top - nodeRect.top) * scale,
          bottom: (r.bottom - nodeRect.top) * scale,
        };
      })
      .filter((b) => b.bottom > b.top)
      .sort((a, b) => a.top - b.top);

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW = pdf.internal.pageSize.getWidth(); // 210 mm
    const pageH = pdf.internal.pageSize.getHeight(); // 297 mm

    // Calculate height of 1 full A4 page in canvas pixels
    const canvasPageH = Math.floor(canvas.width * (pageH / pageW));

    // Margins in canvas pixels for clean spacing between pages
    const topMarginPx = Math.round(30 * scale);
    const bottomMarginPx = Math.round(30 * scale);

    if (canvas.height <= canvasPageH + 10) {
      // Fits on a single page
      pdf.setFillColor(PAPER);
      pdf.rect(0, 0, pageW, pageH, 'F');
      const imgH = (canvas.height * pageW) / canvas.width;
      const img = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(img, 'JPEG', 0, 0, pageW, Math.min(pageH, imgH));
    } else {
      // Multi-page document: compute clean slice boundaries
      let currentY = 0;
      let pageIndex = 0;

      while (currentY < canvas.height - 5) {
        if (pageIndex > 0) pdf.addPage();

        const maxPageY =
          pageIndex === 0
            ? currentY + canvasPageH - bottomMarginPx
            : currentY + canvasPageH - topMarginPx - bottomMarginPx;

        let cutY = maxPageY;

        if (maxPageY >= canvas.height) {
          cutY = canvas.height;
        } else {
          // Find if any atomic block crosses maxPageY
          const crossingBlock = blocks.find((b) => b.top < maxPageY && b.bottom > maxPageY);
          if (crossingBlock && crossingBlock.top > currentY + 50) {
            cutY = crossingBlock.top - 2;
          }
        }

        // Safety check to avoid infinite loops if an element is huge
        if (cutY <= currentY + 20) {
          cutY = Math.min(canvas.height, currentY + canvasPageH - bottomMarginPx);
        }

        const sliceH = cutY - currentY;
        const topPad = pageIndex > 0 ? topMarginPx : 0;
        const pageCanvasH = sliceH + topPad;

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageCanvasH;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = PAPER;
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0, currentY, canvas.width, sliceH,
            0, topPad, canvas.width, sliceH
          );
        }

        pdf.setFillColor(PAPER);
        pdf.rect(0, 0, pageW, pageH, 'F');

        const sliceMmH = (pageCanvas.height / canvas.width) * pageW;
        const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, pageW, Math.min(pageH, sliceMmH));

        currentY = cutY;
        pageIndex++;
      }
    }

    const safe = data.customerName.replace(/[^a-zA-Z0-9]+/g, '_');
    pdf.save(`Conta_Corrente_${safe}_${new Date().toISOString().split('T')[0]}.pdf`);
  } finally {
    document.body.removeChild(host);
  }
}