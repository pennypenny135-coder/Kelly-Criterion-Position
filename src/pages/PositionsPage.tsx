/**
 * PositionsPage.tsx — Open & closed positions dashboard.
 */

import React, { useState } from 'react';
import type { Position } from '../types';
import { useStore } from '../store/useStore';
import { fmtPct, fmtUSD, fmtNum, fmtDateOnly, exportCSV } from '../utils/format';
import PositionDetailModal from '../components/PositionDetailModal';
import ClosePositionModal from '../components/ClosePositionModal';

type Tab = 'open' | 'closed';

// ─── Market env badge ────────────────────────────────────────────────────────

const EnvBadge: React.FC<{ env: string }> = ({ env }) => {
  const map: Record<string, string> = {
    RiskOn: 'bg-green-900/50 text-green-400 border-green-700/40',
    Neutral: 'bg-yellow-900/50 text-yellow-400 border-yellow-700/40',
    RiskOff: 'bg-red-900/50 text-red-400 border-red-700/40',
  };
  const labels: Record<string, string> = { RiskOn: '🟢 On', Neutral: '🟡 Neutral', RiskOff: '🔴 Off' };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs border font-medium ${map[env] ?? 'bg-gray-800 text-gray-400'}`}
    >
      {labels[env] ?? env}
    </span>
  );
};

// ─── Position row ────────────────────────────────────────────────────────────

const PositionRow: React.FC<{
  position: Position;
  onView: () => void;
  onClose?: () => void;
}> = ({ position, onView, onClose }) => {
  const unrealizedRisk = position.chosenPositionShares * (position.entryPrice - position.stopLossPrice);
  const targetReward = position.targetPrice
    ? position.chosenPositionShares * (position.targetPrice - position.entryPrice)
    : null;
  const isClosed = position.status === 'Closed';

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
      <td className="px-4 py-3 font-bold text-white">
        {position.ticker || <span className="text-gray-500">—</span>}
      </td>
      <td className="px-4 py-3 text-gray-300 text-sm">{fmtDateOnly(position.createdAt)}</td>
      <td className="px-4 py-3 text-gray-200 text-sm">${fmtNum(position.entryPrice)}</td>
      <td className="px-4 py-3 text-red-400 text-sm">${fmtNum(position.stopLossPrice)}</td>
      <td className="px-4 py-3 text-green-400 text-sm">
        {position.targetPrice ? `$${fmtNum(position.targetPrice)}` : '—'}
      </td>
      <td className="px-4 py-3 text-blue-400 font-semibold text-sm">
        {fmtPct(position.chosenPositionPercent)}
      </td>
      <td className="px-4 py-3 text-gray-200 text-sm">{fmtUSD(position.chosenPositionAmount)}</td>
      <td className="px-4 py-3 text-gray-300 text-sm">{position.chosenPositionShares}</td>
      <td className="px-4 py-3">
        <EnvBadge env={position.marketEnv} />
      </td>
      <td className="px-4 py-3 text-gray-400 text-xs max-w-[120px] truncate">
        {position.strategyName ?? '—'}
      </td>
      {/* Risk/Reward info */}
      <td className="px-4 py-3 text-sm">
        {!isClosed ? (
          <div className="text-xs space-y-0.5">
            <div className="text-red-400">-{fmtUSD(unrealizedRisk)}</div>
            {targetReward && <div className="text-green-400">+{fmtUSD(targetReward)}</div>}
          </div>
        ) : (
          <span
            className={`font-semibold text-sm ${
              (position.realizedPnL ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {(position.realizedPnL ?? 0) >= 0 ? '+' : ''}
            {fmtUSD(position.realizedPnL ?? 0)}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={onView}
            className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs text-gray-200 transition-colors font-medium"
          >
            View
          </button>
          {!isClosed && onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-red-900/50 hover:bg-red-800/60 border border-red-700/40 text-xs text-red-400 transition-colors font-medium"
            >
              Close
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const PositionsPage: React.FC = () => {
  const { positions, addTradeRecord, closePosition: storeClose } = useStore();
  const [tab, setTab] = useState<Tab>('open');
  const [viewPos, setViewPos] = useState<Position | null>(null);
  const [closePos, setClosePos] = useState<Position | null>(null);
  const [filterTicker, setFilterTicker] = useState('');

  const openPositions = positions.filter((p) => p.status === 'Open');
  const closedPositions = positions.filter((p) => p.status === 'Closed');
  const displayList = (tab === 'open' ? openPositions : closedPositions).filter(
    (p) =>
      !filterTicker || p.ticker.toLowerCase().includes(filterTicker.toLowerCase()),
  );

  // Portfolio summary
  const totalOpenValue = openPositions.reduce((sum, p) => sum + p.chosenPositionAmount, 0);
  const totalOpenRisk = openPositions.reduce(
    (sum, p) => sum + p.chosenPositionShares * (p.entryPrice - p.stopLossPrice),
    0,
  );
  const totalRealizedPnL = closedPositions.reduce((sum, p) => sum + (p.realizedPnL ?? 0), 0);

  const handleConfirmClose = (closePrice: number, notes: string) => {
    if (!closePos) return;
    storeClose(closePos.id, closePrice, notes);
    addTradeRecord({
      ticker: closePos.ticker,
      type: 'Close',
      input: closePos.input,
      calculationResult: closePos.calculationResult,
      positionId: closePos.id,
      notes,
    });
    setClosePos(null);
  };

  const handleExportCSV = () => {
    const rows = displayList.map((p) => ({
      Ticker: p.ticker,
      Status: p.status,
      Strategy: p.strategyName ?? '',
      'Entry Price': p.entryPrice,
      'Stop Loss': p.stopLossPrice,
      'Target Price': p.targetPrice ?? '',
      'Chosen %': (p.chosenPositionPercent * 100).toFixed(2),
      'Chosen Amount': p.chosenPositionAmount.toFixed(2),
      Shares: p.chosenPositionShares,
      'Win Rate': (p.winRate * 100).toFixed(2),
      'P/L Ratio': p.profitLossRatio.toFixed(2),
      'Market Env': p.marketEnv,
      'Created At': p.createdAt,
      'Close Price': p.closePrice ?? '',
      'Realized PnL': p.realizedPnL ?? '',
    }));
    exportCSV(`positions_${tab}_${Date.now()}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white">📊 持倉列表</h2>
          <p className="text-gray-400 text-sm mt-1">管理所有開倉及平倉記錄</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
        >
          📥 匯出 CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: '開倉數量', value: openPositions.length.toString(), color: 'text-blue-400' },
          { label: '總開倉市值', value: fmtUSD(totalOpenValue), color: 'text-white' },
          { label: '總未實現風險', value: fmtUSD(totalOpenRisk), color: 'text-red-400' },
          {
            label: '已實現盈虧',
            value: (totalRealizedPnL >= 0 ? '+' : '') + fmtUSD(totalRealizedPnL),
            color: totalRealizedPnL >= 0 ? 'text-green-400' : 'text-red-400',
          },
        ].map((card) => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs + filter */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
          {(['open', 'closed'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'open' ? `開倉 (${openPositions.length})` : `已平倉 (${closedPositions.length})`}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={filterTicker}
          onChange={(e) => setFilterTicker(e.target.value)}
          placeholder="搜尋 Ticker..."
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Table */}
      {displayList.length === 0 ? (
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">{tab === 'open' ? '📭' : '🗂️'}</div>
          <p className="text-gray-400 font-medium">
            {tab === 'open' ? '目前沒有開倉記錄' : '目前沒有平倉記錄'}
          </p>
          <p className="text-gray-600 text-sm mt-1">
            {tab === 'open' ? '在「計算器」頁面點擊「Add Position」新增持倉' : ''}
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-gray-800/60 border-b border-gray-700">
                  {[
                    'Ticker', '日期', '入場價', '止蝕', '目標', '倉位%', '金額', '股數',
                    '環境', '策略', tab === 'open' ? '風險/回報' : '已實現盈虧', '操作',
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayList.map((p) => (
                  <PositionRow
                    key={p.id}
                    position={p}
                    onView={() => setViewPos(p)}
                    onClose={tab === 'open' ? () => setClosePos(p) : undefined}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {viewPos && (
        <PositionDetailModal position={viewPos} onClose={() => setViewPos(null)} />
      )}
      {closePos && (
        <ClosePositionModal
          position={closePos}
          onConfirm={handleConfirmClose}
          onCancel={() => setClosePos(null)}
        />
      )}
    </div>
  );
};

export default PositionsPage;
