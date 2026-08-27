// 构建主进程与预加载脚本：esbuild 打成 CJS（Electron main 可直接加载），零配置依赖
import { build } from 'esbuild';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

await build({
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

// 静态品牌资源随包分发（目录为空时跳过）
mkdirSync(join(root, '../dist'), { recursive: true });
if (existsSync(join(root, '../resources'))) {
  cpSync(join(root, '../resources'), join(root, '../dist/resources'), {
    recursive: true,
  });
}

console.log('main built → dist/main');