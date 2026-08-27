// 开发模式：esbuild watch（主进程 + preload），再拉起 Electron；
// 渲染层由 `npm run dev`（Vite，127.0.0.1:5273）单独提供
import { context } from 'esbuild';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const electron = process.platform === 'win32'
  ? join(root, '../node_modules/electron/dist/electron.exe')
  : join(root, '../node_modules/electron/dist/Electron.app/Contents/MacOS/Electron');

const ctx = await context({
  entryPoints: [
    join(root, '../src/main/index.ts'),
    join(root, '../src/main/preload.ts'),
  ],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outdir: join(root, '../dist/main'),
  outExtension: { '.js': '.cjs' },
  external: ['electron'],
  sourcemap: true,
});
await ctx.watch();

const child = spawn(electron, ['.'], {
  cwd: join(root, '..'),
  env: {
    ...process.env,
    NO996_DEV_SERVER_URL: process.env.NO996_DEV_SERVER_URL ?? 'http://127.0.0.1:5273',
  },
  stdio: 'inherit',
});
child.on('exit', (code) => process.exit(code ?? 0));