
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  readConfig: () => ipcRenderer.invoke('config:read'),
  writeConfig: (cfg) => ipcRenderer.invoke('config:write', cfg),
  chooseFolder: () => ipcRenderer.invoke('dialog:chooseFolder'),
  listDir: (dir) => ipcRenderer.invoke('fs:listDir', dir),
  stat: (p) => ipcRenderer.invoke('fs:stat', p),
  readText: (p) => ipcRenderer.invoke('fs:readText', p),
  writeText: (p, content) => ipcRenderer.invoke('fs:writeText', p, content),
  showItemInFolder: (p) => ipcRenderer.invoke('shell:showItemInFolder', p),
  openExternal: (p) => ipcRenderer.invoke('shell:openExternal', p),
  runAction: (name, filePath) => ipcRenderer.invoke('actions:run', name, filePath),
  writeSidecars: (filePath, xmpXml, txtContent) => ipcRenderer.invoke('meta:writeSidecars', filePath, xmpXml, txtContent),
  readXmp: (filePath) => ipcRenderer.invoke('meta:readXmp', filePath)
});
