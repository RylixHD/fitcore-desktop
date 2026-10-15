import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("fitcore", {
  load: () => ipcRenderer.invoke("load"),
  action: (value: unknown) => ipcRenderer.invoke("action", value),
  file: (operation: string) => ipcRenderer.invoke("file", operation),
});
