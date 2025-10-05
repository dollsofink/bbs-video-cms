
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipc: {
    invoke: (ch, ...args) => ipcRenderer.invoke(ch, ...args),
    send: (ch, ...args) => ipcRenderer.send(ch, ...args),
    on: (ch, fn) => ipcRenderer.on(ch, (_e, ...data) => fn(...data))
  }
});

contextBridge.exposeInMainWorld('appState', {
  currentRoot: process.platform === 'win32' ? process.env.USERPROFILE + '\\\\Videos' : (process.env.HOME || '') + '/Movies'
});
