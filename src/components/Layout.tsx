/**
 * Layout.tsx — App shell with navigation sidebar/topbar.
 */

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Calculator', icon: '🧮', exact: true },
  { to: '/positions', label: 'Positions', icon: '📊' },
  { to: '/history', label: 'Trade History', icon: '📋' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Top bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between z-50 sticky top-0">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📈</span>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">JLaw Position Manager</h1>
              <p className="text-gray-400 text-xs">Kelly + Risk-Based Sizing</p>
            </div>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <span className="mr-1.5">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-900 border-b border-gray-800 px-4 py-2 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer disclaimer */}
      <footer className="border-t border-gray-800 bg-gray-900 px-4 py-3 text-center">
        <p className="text-xs text-gray-500">
          ⚠️ 本工具僅供參考，實際倉位請結合個人判斷與風險承受能力。投資涉及風險，過去表現不代表未來回報。
        </p>
      </footer>
    </div>
  );
};

export default Layout;
