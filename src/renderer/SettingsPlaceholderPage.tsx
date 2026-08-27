import { ProductSidebar } from './components/ProductSidebar';

export function SettingsPlaceholderPage() {
  return (
    <div className="app-shell">
      <ProductSidebar activeModule="settings" />
      <main className="app-main" id="settings">
        <header className="topbar">
          <div className="breadcrumb" aria-label="当前位置">
            <span>工作台</span>
            <span aria-hidden="true">/</span>
            <strong>设置</strong>
          </div>
          <div className="topbar-account">
            <span className="account-avatar" aria-hidden="true">
              森
            </span>
            <span>森野轻养品牌</span>
          </div>
        </header>
        <div className="page-content settings-placeholder">
          <span className="product-section-kicker">工作台偏好</span>
          <h1>设置</h1>
          <p>账号、企业信息和工作台偏好设置将在后续版本接入。</p>
          <a className="button button--primary" href="#overview">
            返回首页
          </a>
        </div>
      </main>
    </div>
  );
}
