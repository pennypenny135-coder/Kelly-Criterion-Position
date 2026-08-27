/**
 * TradeHistoryPage.tsx — Full trade log with filtering.
 */

import React, { useState, useMemo } from 'react';
import type { TradeType, MarketEnvironment } from '../types';
import { useStore } from '../store/useStore';
import { fmtPct, fmtNum, fmtUSD, fmtDate, exportCSV } from '../utils/format';

// ─── Type badge ───────────────────────────────────────────────────────────────

const TypeBadge: React.FC<{ type: TradeType }> = ({ type }) => {
  const map: Record<TradeType, string> = {
    New: 'bg-blue-900/50 text-blue-400 border-blue-700/40',
    Add: 'bg-green-900/50 text-green-400 border-green-700/40',
    Reduce: 'bg-yellow-900/50 text-yellow-400 border-yellow-700/40',
    Close: 'bg-red-900/50 text-red-400 border-red-700/40',
  };
  const icons: Record<TradeType, string> = {
    New: '🆕',
    Add: '➕',
    Reduce: '➖',
    Close: '✅',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs border font-semibold ${map[type]}`}>
      {icons[type]} {type}
    </span>
  );
};

// ─── Env badge ────────────────────────────────────────────────────────────────

const EnvBadge: React.FC<{ env: MarketEnvironment }> = ({ env }) => {
  const map: Record<string, string> = {
    RiskOn: 'text-green-400',
    Neutral: 'text-yellow-400',
    RiskOff: 'text-red-400',
  };
  const icons: Record<string, string> = { RiskOn: '🟢', Neutral: '🟡', RiskOff: '🔴' };
  return (
    <span className={`text-xs font-medium ${map[env] ?? 'text-gray-400'}`}>
      {icons[env]} {env}
    </span>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const TradeHistoryPage: React.FC = () => {
  const { tradeRecords } = useStore();

  const [filterTicker, setFilterTicker] = useState('');
  const [filterType, setFilterType] = useState<TradeType | 'All'>('All');
  const [filterEnv, setFilterEnv] = useState<MarketEnvironment | 'All'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return tradeRecords.filter((r) => {
      if (filterTicker && !r.ticker.toLowerCase().includes(filterTicker.toLowerCase())) return false;
      if (filterType !== 'All' && r.type !== filterType) return false;
      if (filterEnv !== 'All' && r.input.marketEnv !== filterEnv) return false;
      return true;
    });
  }, [tradeRecords, filterTicker, filterType, filterEnv]);

  const handleExport = () => {
    const rows = filtered.map((r) => ({
      ID: r.id,
      Ticker: r.ticker,
      Type: r.type,
      'Created At': r.createdAt,
      'Entry Price': r.input.entryPrice,
      'Stop Loss': r.input.stopLossPrice,
      'Target Price': r.input.targetPrice ?? '',
      'Market Env': r.input.marketEnv,
      'Total Capital': r.input.totalCapital,
      'Max Risk %': r.input.maxRiskPerTradePercent,
      'Adjusted Win Rate': (r.calculationResult.adjustedWinRate * 100).toFixed(2),
      'P/L Ratio b': r.calculationResult.b.toFixed(2),
      'Kelly Full': (r.calculationResult.kellyFull * 100).toFixed(2),
      'Kelly Half': (r.calculationResult.kellyHalf * 100).toFixed(2),
      'Risk Based %': (r.calculationResult.riskBasedPercent * 100).toFixed(2),
      'Final Suggested %': (r.calculationResult.finalSuggestedPercent * 100).toFixed(2),
      'Positive EV': r.calculationResult.isPositiveEV ? 'Yes' : 'No',
      Notes: r.notes ?? '',
    }));
    exportCSV(`trade_history_${Date.now()}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white">📋 交易記錄</h2>
          <p className="text-gray-400 text-sm mt-1">
            所有 New / Add / Reduce / Close 操作記錄（共 {tradeRecords.length} 筆）
          </p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
        >
          📥 匯出 CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input
          type="text"
          value={filterTicker}
          onChange={(e) => setFilterTicker(e.target.value)}
          placeholder="搜尋 Ticker..."
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 w-40"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as TradeType | 'All')}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="All">所有類型</option>
          <option value="New">New</option>
          <option value="Add">Add</option>
          <option value="Reduce">Reduce</option>
          <option value="Close">Close</option>
        </select>
        <select
          value={filterEnv}
          onChange={(e) => setFilterEnv(e.target.value as MarketEnvironment | 'All')}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="All">所有環境</option>
          <option value="RiskOn">🟢 Risk On</option>
          <option value="Neutral">🟡 Neutral</option>
          <option value="RiskOff">🔴 Risk Off</option>
        </select>
        {(filterTicker || filterType !== 'All' || filterEnv !== 'All') && (
          <button
            onClick={() => { setFilterTicker(''); setFilterType('All'); setFilterEnv('All'); }}
            className="text-xs text-gray-400 hover:text-white underline"
          >
            清除篩選
          </button>
        )}
        <span className="text-xs text-gray-500 ml-auto">顯示 {filtered.length} / {tradeRecords.length} 筆</span>
      </div>

      {/* Records */}
      {filtered.length === 0 ? (
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-400 font-medium">沒有符合的交易記錄</p>
          <p className="text-gray-600 text-sm mt-1">
            新增持倉或平倉後，記錄將顯示於此
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((record) => {
            const r = record.calculationResult;
            const isExpanded = expandedId === record.id;

            return (
              <div
                key={record.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
              >
                {/* Row summary */}
                <button
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-800/40 transition-colors text-left"
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                >
                  <TypeBadge type={record.type} />

                  <span className="font-bold text-white min-w-[60px]">
                    {record.ticker || <span className="text-gray-500 font-normal">—</span>}
                  </span>

                  <span className="text-sm text-gray-400 flex-1">{fmtDate(record.createdAt)}</span>

                  <div className="hidden sm:flex items-center gap-6 text-sm">
                    <span className="text-gray-400">
                      p: <strong className="text-blue-400">{fmtPct(r.adjustedWinRate)}</strong>
                    </span>
                    <span className="text-gray-400">
                      b: <strong className="text-purple-400">{fmtNum(r.b)}R</strong>
                    </span>
                    <span className="text-gray-400">
                      建議: <strong className="text-green-400">{fmtPct(r.finalSuggestedPercent)}</strong>
                    </span>
                    <EnvBadge env={record.input.marketEnv} />
                  </div>

                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-800 px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">輸入參數</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-gray-400">買入價</span>
                          <span className="text-gray-200">${fmtNum(record.input.entryPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">止蝕</span>
                          <span className="text-red-400">${fmtNum(record.input.stopLossPrice)}</span>
                        </div>
                        {record.input.targetPrice && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">目標</span>
                            <span className="text-green-400">${fmtNum(record.input.targetPrice)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">總資金</span>
                          <span className="text-gray-200">{fmtUSD(record.input.totalCapital)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">最大風險</span>
                          <span className="text-gray-200">{record.input.maxRiskPerTradePercent}%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">計算結果</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-gray-400">調整勝率 p</span>
                          <span className="text-blue-400">{fmtPct(r.adjustedWinRate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">盈虧比 b</span>
                          <span className="text-purple-400">{fmtNum(r.b)}R</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">單股風險</span>
                          <span className="text-gray-200">{fmtPct(r.singleStockRiskPercent)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">期望值</span>
                          <span className={r.isPositiveEV ? 'text-green-400' : 'text-red-400'}>
                            {fmtNum(r.adjustedWinRate * r.b - (1 - r.adjustedWinRate), 3)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">凱利倉位</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-gray-400">純凱利</span>
                          <span className="text-gray-200">{fmtPct(r.kellyFull)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">半凱利</span>
                          <span className="text-gray-200">{fmtPct(r.kellyHalf)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">¼ 凱利</span>
                          <span className="text-gray-200">{fmtPct(r.kellyQuarter)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">風險倒推</span>
                          <span className="text-yellow-400">{fmtPct(r.riskBasedPercent)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">最終建議</span>
                          <span className="text-green-400 font-semibold">{fmtPct(r.finalSuggestedPercent)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">其他</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-gray-400">市場環境</span>
                          <EnvBadge env={record.input.marketEnv} />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">EV</span>
                          <span className={r.isPositiveEV ? 'text-green-400' : 'text-red-400'}>
                            {r.isPositiveEV ? '✅ 正' : '❌ 負'}
                          </span>
                        </div>
                        {record.notes && (
                          <div className="pt-1">
                            <span className="text-gray-500 text-xs">備注：</span>
                            <p className="text-gray-300 text-xs mt-0.5">{record.notes}</p>
                          </div>
                        )}
                      </div>
                      {r.warningMessages.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">警告</p>
                          <div className="space-y-1">
                            {r.warningMessages.map((w, i) => (
                              <p key={i} className="text-xs text-yellow-400">{w}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TradeHistoryPage;
