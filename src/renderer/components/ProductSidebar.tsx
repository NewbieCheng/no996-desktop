interface ProductSidebarProps {
  brandName?: string;
  activeModule:
    | 'home'
    | 'settings'
    | 'hotspot-radar'
    | 'viral-analysis'
    | 'product-library'
    | 'ai-experts'
    | 'enterprise-brain'
    | 'topic-pool'
    | 'topic-calendar'
    | 'content-creation'
    | 'content-assets'
    | 'content-review'
    | 'friend-circle';
}

export function ProductSidebar({ activeModule, brandName = '澄心健康' }: ProductSidebarProps) {
  const isHome = activeModule === 'home';
  const isSettings = activeModule === 'settings';
  const isHotspotRadar = activeModule === 'hotspot-radar';
  const isViralAnalysis = activeModule === 'viral-analysis';
  const isProductLibrary = activeModule === 'product-library';
  const isAiExperts = activeModule === 'ai-experts';
  const isTopicPool = activeModule === 'topic-pool' || activeModule === 'topic-calendar';
  const isContentCreation = activeModule === 'content-creation';
  const isContentAssets = activeModule === 'content-assets';
  const isContentReview = activeModule === 'content-review';
  const isFriendCircle = activeModule === 'friend-circle';
  const isInsights = isHotspotRadar || isViralAnalysis;
  const isContentGrowth = isTopicPool || isContentCreation || isContentAssets || isContentReview;

  return (
    <aside className="app-sidebar">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          不
        </span>
        <div>
          <strong>不加班工作台</strong>
          <span>{brandName}</span>
        </div>
      </div>

      <nav className="main-nav" aria-label="主菜单">
        <span className="nav-group-label">工作台</span>
        <a
          href="#overview"
          className={`nav-item${isHome ? ' nav-item--active' : ''}`}
          aria-current={isHome ? 'page' : undefined}
        >
          <span className="nav-glyph" aria-hidden="true">
            ○
          </span>
          <span>首页</span>
        </a>
        <a
          href="#hotspot-radar"
          className={`nav-item${isInsights ? ' nav-item--active' : ''}`}
          aria-current={isInsights ? 'page' : undefined}
        >
          <span className="nav-glyph" aria-hidden="true">
            ◒
          </span>
          <span>洞察中心</span>
          <span className="nav-item__chevron" aria-hidden="true">
            ›
          </span>
        </a>
        <div className="sub-nav">
          <a
            href="#hotspot-radar"
            className={`sub-nav-item${activeModule === 'hotspot-radar' ? ' sub-nav-item--active' : ''}`}
          >
            热点雷达
          </a>
          <a
            href="#viral-analysis"
            className={`sub-nav-item${isViralAnalysis ? ' sub-nav-item--active' : ''}`}
            aria-current={isViralAnalysis ? 'page' : undefined}
          >
            爆款分析
          </a>
        </div>
        <a
          href="#topic-pool?focus=pool"
          className={`nav-item${isContentGrowth ? ' nav-item--active' : ''}`}
          aria-current={isContentGrowth ? 'page' : undefined}
        >
          <span className="nav-glyph" aria-hidden="true">
            ◇
          </span>
          <span>内容增长</span>
          <span className="nav-item__chevron" aria-hidden="true">
            ›
          </span>
        </a>
        <div className="sub-nav">
          <a
            href="#topic-pool?focus=pool"
            className={`sub-nav-item${isTopicPool ? ' sub-nav-item--active' : ''}`}
            aria-current={isTopicPool ? 'page' : undefined}
          >
            选题管理
          </a>
          <a
            href="#content-creation"
            className={`sub-nav-item${isContentCreation ? ' sub-nav-item--active' : ''}`}
            aria-current={isContentCreation ? 'page' : undefined}
          >
            内容创作
          </a>
          <a
            href="#content-assets"
            className={`sub-nav-item${isContentAssets ? ' sub-nav-item--active' : ''}`}
            aria-current={isContentAssets ? 'page' : undefined}
          >
            内容资产库
          </a>
          <a
            href="#content-review"
            className={`sub-nav-item${isContentReview ? ' sub-nav-item--active' : ''}`}
            aria-current={isContentReview ? 'page' : undefined}
          >
            内容数据复盘
          </a>
        </div>
        <a
          href="#friend-circle"
          className={`nav-item${isFriendCircle ? ' nav-item--active' : ''}`}
          aria-current={isFriendCircle ? 'page' : undefined}
        >
          <span className="nav-glyph" aria-hidden="true">
            □
          </span>
          <span>复购经营</span>
          <span className="nav-item__chevron" aria-hidden="true">
            ›
          </span>
        </a>
        <div className="sub-nav">
          <a
            href="#friend-circle"
            className={`sub-nav-item${isFriendCircle ? ' sub-nav-item--active' : ''}`}
            aria-current={isFriendCircle ? 'page' : undefined}
          >
            朋友圈运营
          </a>
        </div>
        <a
          href="#product-library"
          className={`nav-item${isProductLibrary ? ' nav-item--active' : ''}`}
          aria-current={isProductLibrary ? 'page' : undefined}
        >
          <span className="nav-glyph" aria-hidden="true">
            ▣
          </span>
          <span>产品库</span>
        </a>
        <a
          href="#ai-experts"
          className={`nav-item${isAiExperts ? ' nav-item--active' : ''}`}
          aria-current={isAiExperts ? 'page' : undefined}
        >
          <span className="nav-glyph" aria-hidden="true">
            ◇
          </span>
          <span>AI 专家团</span>
        </a>
        <a
          href="#enterprise-brain"
          className={`nav-item${activeModule === 'enterprise-brain' ? ' nav-item--active' : ''}`}
          aria-current={activeModule === 'enterprise-brain' ? 'page' : undefined}
        >
          <span className="nav-glyph" aria-hidden="true">
            ▤
          </span>
          <span>企业大脑</span>
        </a>
        <a
          href="#settings"
          className={`nav-item${isSettings ? ' nav-item--active' : ''}`}
          aria-current={isSettings ? 'page' : undefined}
        >
          <span className="nav-glyph" aria-hidden="true">
            ⚙
          </span>
          <span>设置</span>
        </a>
      </nav>

      <div className="sidebar-footer">
        {activeModule !== 'home' ? (
          <span className="sidebar-footer__caption">
            {activeModule === 'settings'
              ? '设置 / 工作台'
              : activeModule === 'enterprise-brain'
                ? '企业大脑 / 知识库'
                : activeModule === 'ai-experts'
                  ? 'AI 专家团 / 专家库'
                  : isTopicPool
                    ? '内容增长 / 选题池与排期'
                    : isContentCreation
                      ? '内容增长 / 内容创作'
                      : isContentAssets
                        ? '内容增长 / 内容资产库'
                        : isContentReview
                          ? '内容增长 / 内容数据复盘'
                          : isFriendCircle
                            ? '复购经营 / 朋友圈运营'
                            : isViralAnalysis
                              ? '洞察中心 / 爆款分析'
                              : isProductLibrary
                                ? '产品库 / 产品管理'
                                : '洞察中心 / 热点雷达'}
          </span>
        ) : null}
      </div>
    </aside>
  );
}
