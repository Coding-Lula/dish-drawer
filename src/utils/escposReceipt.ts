import EscPosEncoder from 'esc-pos-encoder';
import logoAsset from '@/assets/360-logo.bmp.asset.json';

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number; // unit price
}

export interface ReceiptOrder {
  orderNumber: number | string;
  dateTime: Date | string;
  items: ReceiptItem[];
  total: number;
  storeName?: string;
  tableName?: string;
}

/** 80mm thermal paper, Font A => 42 characters per line */
const LINE_WIDTH = 42;
/** Logo raster size must be a multiple of 8 for ESC/POS */
const LOGO_SIZE = 200;

const money = (n: number) =>
  `${Number(n).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

/** Left text + right text padded to a full 42-char line. */
function row(left: string, right: string, width = LINE_WIDTH): string {
  const space = Math.max(1, width - left.length - right.length);
  if (left.length + right.length + 1 > width) {
    left = left.slice(0, width - right.length - 2) + '…';
    return `${left} ${right}`;
  }
  return left + ' '.repeat(space) + right;
}

/**
 * Loads the Pizzaria 360° logo and rasterises it onto a square canvas
 * sized for the thermal printer.
 */
export async function loadLogoCanvas(
  src: string = logoAsset.url,
  size: number = LOGO_SIZE
): Promise<HTMLCanvasElement> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = src;
  });

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // White paper background, logo contained and centred
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);
  const scale = Math.min(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

  return canvas;
}

/**
 * Formats an 80mm thermal receipt and returns the raw ESC/POS byte array.
 *
 * @param order  order data (number, date/time, items, total)
 * @param logo   an HTMLImageElement or HTMLCanvasElement with the logo
 */
export function encodeReceipt(
  order: ReceiptOrder,
  logo?: HTMLImageElement | HTMLCanvasElement
): Uint8Array {
  const encoder = new EscPosEncoder();
  const dt = order.dateTime instanceof Date ? order.dateTime : new Date(order.dateTime);

  let result = encoder.initialize().align('center');

  if (logo) {
    try {
      result = result.image(logo as HTMLCanvasElement, LOGO_SIZE, LOGO_SIZE, 'atkinson').newline();
    } catch {
      /* printer/logo not available – continue text-only */
    }
  }

  result = result
    .bold(true)
    .line(order.storeName || 'Pizzaria 360°')
    .bold(false)
    .line(`Pedido Nº ${order.orderNumber}`)
    .line(dt.toLocaleString('pt-PT'));

  if (order.tableName) result = result.line(order.tableName);

  result = result
    .newline()
    .align('left')
    .line('-'.repeat(LINE_WIDTH))
    .line(row('QTD ARTIGO', 'VALOR'))
    .line('-'.repeat(LINE_WIDTH));

  for (const item of order.items) {
    result = result.line(
      row(`${item.qty}x ${item.name}`, money(item.qty * item.price))
    );
  }

  result = result
    .line('-'.repeat(LINE_WIDTH))
    .newline()
    .align('right')
    .bold(true)
    .size('normal');

  // Grand total in double-size bold text
  result = result.width(2).height(2).line(`TOTAL ${money(order.total)}`).width(1).height(1);

  result = result
    .bold(false)
    .align('center')
    .newline()
    .line('Obrigado pela preferência!')
    .newline()
    .newline()
    .cut();

  return result.encode();
}

/**
 * Convenience helper: loads the logo, encodes the receipt and returns the bytes.
 */
export async function buildReceiptBytes(order: ReceiptOrder): Promise<Uint8Array> {
  let logo: HTMLCanvasElement | undefined;
  try {
    logo = await loadLogoCanvas();
  } catch {
    logo = undefined;
  }
  return encodeReceipt(order, logo);
}

/**
 * Sends the bytes to a printer. Tries Web Bluetooth / WebUSB when the browser
 * supports it, otherwise downloads the raw file so it can be piped to the
 * printer by the POS terminal.
 */
export async function sendToPrinter(bytes: Uint8Array, filename = 'recibo.bin'): Promise<'usb' | 'download'> {
  const nav = navigator as Navigator & { usb?: any };
  if (nav.usb?.requestDevice) {
    try {
      const device = await nav.usb.requestDevice({ filters: [{ classCode: 7 }] });
      await device.open();
      if (device.configuration === null) await device.selectConfiguration(1);
      const iface = device.configuration.interfaces[0];
      await device.claimInterface(iface.interfaceNumber);
      const endpoint = iface.alternate.endpoints.find((e: any) => e.direction === 'out');
      await device.transferOut(endpoint.endpointNumber, bytes);
      await device.close();
      return 'usb';
    } catch {
      /* fall through to download */
    }
  }

  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return 'download';
}
