const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const ses = mainWindow.webContents.session;

  // --- WebUSB support -------------------------------------------------
  // Electron blocks navigator.usb by default: the renderer's device picker
  // never resolves unless the main process answers these events.
  mainWindow.webContents.session.setDevicePermissionHandler(() => true);
  ses.setPermissionCheckHandler(() => true);
  ses.setPermissionRequestHandler((_wc, _perm, cb) => cb(true));

  mainWindow.webContents.on('select-usb-device', (event, details, callback) => {
    event.preventDefault();
    const device = details.deviceList[0];
    callback(device ? device.deviceId : undefined);
  });

  // --- Downloads: save silently to the Downloads folder ---------------
  ses.on('will-download', (_e, item) => {
    item.setSavePath(path.join(app.getPath('downloads'), item.getFilename()));
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

// --- Silent printing through the Windows printer driver ---------------
ipcMain.handle('print-receipt-html', async (_evt, html, deviceName) => {
  const win = new BrowserWindow({ show: false, webPreferences: { offscreen: false } });
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  const ok = await new Promise((resolve) => {
    win.webContents.print(
      { silent: true, printBackground: true, deviceName: deviceName || undefined, margins: { marginType: 'none' } },
      (success) => resolve(success)
    );
  });
  setTimeout(() => win.destroy(), 2000);
  return ok;
});

ipcMain.handle('list-printers', async () => {
  if (!mainWindow) return [];
  return await mainWindow.webContents.getPrintersAsync();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
