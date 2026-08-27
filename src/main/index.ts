// Electron 主进程入口：boot（加载动画/登录）→ Shell 主窗口
// 产物为 dist/main/index.cjs（package.json main 指向）
import { app, BrowserWindow, shell, type BrowserWindow as BW } from 'electron';
import { join } from 'node:path';

const DEV_SERVER_URL = process.env.NO996_DEV_SERVER_URL;

function loadPage(win: BW, hash: string) {
  const url = DEV_SERVER_URL
    ? `${DEV_SERVER_URL}/${hash}`
    : { protocol: 'file:', pathname: join(__dirname, '../renderer/index.html').replace(/\\/g, '/'), hash };
  if (typeof url === 'string') {
    win.loadURL(url);
  } else {
    win.loadFile(url.pathname, { hash });
  }
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    show: false,
    backgroundColor: '#f5f6f8',
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.once('ready-to-show', () => win.show());
  // 外部链接一律走系统浏览器，不在应用内打开
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });
  loadPage(win, '#/boot');
  return win;
}

app.whenReady().then(() => {
  createMainWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});