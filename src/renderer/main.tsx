import { StrictMode, useEffect, useState } from 'react';
import { AIExpertTeamPage } from './AIExpertTeamPage';
import { createRoot } from 'react-dom/client';
import { EnterpriseBrainPage } from './EnterpriseBrainPage';
import { HotspotRadarPage } from './HotspotRadarPage';
import { HomePage } from './HomePage';
import { SettingsPlaceholderPage } from './SettingsPlaceholderPage';
import { ProductLibraryPage } from './ProductLibraryPage';
import { ViralAnalysisPage } from './ViralAnalysisPage';
import { ContentCreationPage } from './ContentCreationPage';
import { ContentAssetsPage } from './ContentAssetsPage';
import { ContentReviewPage } from './ContentReviewPage';
import { FriendCirclePage } from './FriendCirclePage';
import { TopicPoolPage } from './TopicPoolPage';
import './styles.css';

type AppModule =
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

function getActiveModule(hash: string): AppModule {
  if (hash.startsWith('#overview')) {
    return 'home';
  }
  if (hash.startsWith('#settings')) {
    return 'settings';
  }
  if (hash.startsWith('#enterprise-brain')) {
    return 'enterprise-brain';
  }
  if (hash.startsWith('#ai-experts')) {
    return 'ai-experts';
  }
  if (hash.startsWith('#hotspot-radar')) {
    return 'hotspot-radar';
  }
  if (hash.startsWith('#viral-analysis')) {
    return 'viral-analysis';
  }
  if (hash.startsWith('#product-library')) {
    return 'product-library';
  }
  if (hash.startsWith('#content-creation')) {
    return 'content-creation';
  }
  if (hash.startsWith('#content-assets')) {
    return 'content-assets';
  }
  if (hash.startsWith('#content-review')) {
    return 'content-review';
  }
  if (hash.startsWith('#friend-circle')) {
    return 'friend-circle';
  }
  if (hash.startsWith('#topic-pool') && hash.includes('focus=calendar')) {
    return 'topic-calendar';
  }
  if (hash.startsWith('#topic-pool')) {
    return 'topic-pool';
  }
  return 'home';
}

function AppRouter() {
  const [activeModule, setActiveModule] = useState<AppModule>(() =>
    getActiveModule(window.location.hash),
  );

  useEffect(() => {
    const handleHashChange = () => {
      setActiveModule(getActiveModule(window.location.hash));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (activeModule === 'enterprise-brain') {
    return <EnterpriseBrainPage />;
  }
  if (activeModule === 'home') {
    return <HomePage />;
  }
  if (activeModule === 'settings') {
    return <SettingsPlaceholderPage />;
  }
  if (activeModule === 'ai-experts') {
    return <AIExpertTeamPage />;
  }
  if (activeModule === 'viral-analysis') {
    return <ViralAnalysisPage />;
  }
  if (activeModule === 'product-library') {
    return <ProductLibraryPage />;
  }
  if (activeModule === 'topic-pool' || activeModule === 'topic-calendar') {
    return <TopicPoolPage initialFocus={activeModule === 'topic-calendar' ? 'calendar' : 'pool'} />;
  }
  if (activeModule === 'content-creation') {
    return <ContentCreationPage />;
  }
  if (activeModule === 'content-assets') {
    return <ContentAssetsPage />;
  }
  if (activeModule === 'content-review') {
    return <ContentReviewPage />;
  }
  if (activeModule === 'friend-circle') {
    return <FriendCirclePage />;
  }
  return <HotspotRadarPage />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);
