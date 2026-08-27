/**
 * electron-builder 打包配置
 * - Windows 优先（当前交付目标）；mac 配置保留，CI/证书就绪后直接 `npm run pack:mac`
 * - 双击启动加载链见 src/main/index.ts（#/boot）
 */
const config = {
  appId: 'dev.no996.workbench',
  productName: '不加班工作台',
  directories: {
    output: 'out',
    buildResources: 'resources',
  },
  files: ['dist/**/*', 'package.json'],
  asar: true,
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'resources/icon.ico',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    shortcutName: '不加班工作台',
  },
  mac: {
    // 预留：待 Apple 开发者证书与公证配置后启用
    target: [{ target: 'dmg', arch: ['arm64', 'x64'] }],
    icon: 'resources/icon.icns',
    category: 'public.app-category.productivity',
  },
};

export default config;