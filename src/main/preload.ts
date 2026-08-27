// 预加载脚本：向渲染层暴露最小、白名单式的桌面 API（后续 Bridge 在此扩展）
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('no996', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
  },
});