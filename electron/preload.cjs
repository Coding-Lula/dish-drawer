const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronPrint', {
  isElectron: true,
  printHtml: (html, deviceName) => ipcRenderer.invoke('print-receipt-html', html, deviceName),
  listPrinters: () => ipcRenderer.invoke('list-printers'),
});
