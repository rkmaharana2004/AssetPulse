import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout, NavTab } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { AssetsPage } from './pages/AssetsPage';
import { SparePartsPage } from './pages/SparePartsPage';
import { TicketsPage } from './pages/TicketsPage';
import { Asset, SparePart } from './types/asset.types';

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');

  // Cross-page handoff states
  const [initialRestockPart, setInitialRestockPart] = useState<SparePart | null>(null);
  const [preselectedAssetForTicket, setPreselectedAssetForTicket] = useState<Asset | null>(null);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleQuickRestockPart = (part: SparePart) => {
    setInitialRestockPart(part);
    setCurrentTab('parts');
  };

  const handleOpenTicketForAsset = (asset: Asset) => {
    setPreselectedAssetForTicket(asset);
    setCurrentTab('tickets');
  };

  return (
    <Layout currentTab={currentTab} onSelectTab={setCurrentTab}>
      {currentTab === 'overview' && (
        <OverviewPage
          onNavigateToTab={(tab) => setCurrentTab(tab as NavTab)}
          onQuickRestockPart={handleQuickRestockPart}
        />
      )}
      {currentTab === 'assets' && (
        <AssetsPage onOpenTicketForAsset={handleOpenTicketForAsset} />
      )}
      {currentTab === 'parts' && (
        <SparePartsPage
          initialRestockPart={initialRestockPart}
          onClearInitialRestock={() => setInitialRestockPart(null)}
        />
      )}
      {currentTab === 'tickets' && (
        <TicketsPage
          preselectedAsset={preselectedAssetForTicket}
          onClearPreselectedAsset={() => setPreselectedAssetForTicket(null)}
        />
      )}
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};

export default App;
