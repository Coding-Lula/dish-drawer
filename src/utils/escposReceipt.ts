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
 * Sends the bytes to a printer. Tries WebUSB when the browser supports it,
 * otherwise downloads the raw file so it can be piped to the printer by the
 * POS terminal. Logs every step to the console for diagnostics.
 */
export interface PrintResult {
  mode: 'usb' | 'download';
  error?: string;
}

export async function sendToPrinter(bytes: Uint8Array, filename = 'recibo.bin'): Promise<PrintResult> {
  const log = (...args: unknown[]) => console.log('[ESC/POS]', ...args);
  const nav = navigator as Navigator & { usb?: any };
  let lastError: string | undefined;

  log('bytes to send:', bytes.length, 'secureContext:', window.isSecureContext, 'webusb:', !!nav.usb);

  if (!nav.usb?.requestDevice) {
    lastError = 'WebUSB não suportado neste navegador (use Chrome/Edge em HTTPS).';
    log('WebUSB unavailable');
  } else {
    let device: any;
    try {
      const known = await nav.usb.getDevices();
      log('previously authorised devices:', known.map((d: any) => `${d.productName ?? '?'} ${d.vendorId}:${d.productId}`));
      device = known[0];
      if (!device) {
        device = await nav.usb.requestDevice({ filters: [] });
      }
      log('device selected:', {
        productName: device.productName,
        manufacturerName: device.manufacturerName,
        vendorId: device.vendorId,
        productId: device.productId,
        opened: device.opened,
      });

      if (!device.opened) await device.open();
      log('device opened');

      if (device.configuration === null) {
        await device.selectConfiguration(1);
        log('configuration 1 selected');
      }

      const interfaces = device.configuration.interfaces;
      log(
        'interfaces:',
        interfaces.map((i: any) => ({
          number: i.interfaceNumber,
          class: i.alternate.interfaceClass,
          endpoints: i.alternate.endpoints.map((e: any) => `${e.direction}#${e.endpointNumber}/${e.type}`),
        }))
      );

      // Prefer a printer-class interface (7) with a bulk OUT endpoint
      const candidates = interfaces.filter((i: any) =>
        i.alternate.endpoints.some((e: any) => e.direction === 'out' && e.type === 'bulk')
      );
      const iface =
        candidates.find((i: any) => i.alternate.interfaceClass === 7) ?? candidates[0];
      if (!iface) throw new Error('Nenhuma interface de impressão (bulk OUT) encontrada no dispositivo.');
      log('using interface', iface.interfaceNumber, 'class', iface.alternate.interfaceClass);

      await device.claimInterface(iface.interfaceNumber);
      log('interface claimed');

      const endpoint = iface.alternate.endpoints.find(
        (e: any) => e.direction === 'out' && e.type === 'bulk'
      );
      const res = await device.transferOut(endpoint.endpointNumber, bytes);
      log('transferOut result:', res.status, 'bytesWritten:', res.bytesWritten);

      try {
        await device.releaseInterface(iface.interfaceNumber);
        await device.close();
      } catch (closeErr) {
        log('close warning:', closeErr);
      }

      if (res.status !== 'ok') throw new Error(`Transferência falhou: ${res.status}`);
      return { mode: 'usb' };
    } catch (err: any) {
      lastError = err?.message ?? String(err);
      console.error('[ESC/POS] USB print failed:', err);
      if (/access denied|não foi possível reivindicar|claim/i.test(lastError ?? '')) {
        lastError +=
          ' — o Windows está a usar o driver da impressora. Substitua o driver por WinUSB (Zadig) ou imprima através do driver do sistema.';
      }
      try {
        await device?.close();
      } catch {
        /* ignore */
      }
    }
  }

  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  log('fell back to file download:', filename, 'reason:', lastError);
  return { mode: 'download', error: lastError };
}

