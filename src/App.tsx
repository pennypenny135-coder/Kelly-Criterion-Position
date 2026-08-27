/**
 * App.tsx — Root component with routing.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import NewPositionPage from './pages/NewPositionPage';
import PositionsPage from './pages/PositionsPage';
import TradeHistoryPage from './pages/TradeHistoryPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<NewPositionPage />} />
          <Route path="/positions" element={<PositionsPage />} />
          <Route path="/history" element={<TradeHistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
