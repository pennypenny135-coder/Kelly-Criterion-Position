/**
 * PositionDetailModal.tsx — View detailed info for a position.
 */

import React from 'react';
import type { Position } from '../types';
import { fmtPct, fmtNum, fmtUSD, fmtDate, fmtMarketEnv } from '../utils/format';

interface Props {
  position: Position;
  onClose: () => void;
}

const Row: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight,
}) => (
  <div className="flex justify-between text-sm py-2 border-b border-gray-800 last:border-0">
    <span className="text-gray-400">{label}</span>
    <span className={highlight ? 'text-green-400 font-semibold' : 'text-gray-200'}>{value}</span>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-gray-800/50 rounded-xl p-4">
    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">{title}</p>
    {children}
  </div>
);

const PositionDetailModal: React.FC<Props> = ({ position, onClose }) => {
  const r = position.calculationResult;
  const isClosed = position.status === 'Closed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl my-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              {position.ticker || '—'}
              <span
                className={`ml-3 text-xs px-2 py-0.5 rounded-full font-medium ${
                  isClosed
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-green-900/50 text-green-400 border border-green-700/40'
                }`}
              >
                {isClosed ? 'Closed' : 'Open'}
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{position.strategyName ?? 'No strategy'}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Entry details */}
          <Section title="入場資料">
            <Row label="買入價" value={`$${fmtNum(position.entryPrice)}`} />
            <Row label="止蝕價" value={`$${fmtNum(position.stopLossPrice)}`} />
            {position.targetPrice && (
              <Row label="目標價" value={`$${fmtNum(position.targetPrice)}`} />
            )}
            <Row label="市場環境" value={fmtMarketEnv(position.marketEnv)} />
            <Row label="入場日期" value={fmtDate(position.createdAt)} />
          </Section>

          {/* Position sizing */}
          <Section title="倉位資料">
            <Row label="最終倉位 %" value={fmtPct(position.chosenPositionPercent)} highlight />
            <Row label="倉位金額" value={fmtUSD(position.chosenPositionAmount)} highlight />
            <Row label="持倉股數" value={`${position.chosenPositionShares} 股`} highlight />
            <Row label="總資金" value={fmtUSD(position.input.totalCapital)} />
          </Section>

          {/* Calculation results */}
          <Section title="凱利計算 (入場時)">
            <Row label="調整後勝率 p" value={fmtPct(r.adjustedWinRate)} />
            <Row label="盈虧比 b" value={`${fmtNum(r.b)}R`} />
            <Row label="純凱利 f*" value={fmtPct(r.kellyFull)} />
            <Row label="半凱利" value={fmtPct(r.kellyHalf)} />
            <Row label="四分之一凱利" value={fmtPct(r.kellyQuarter)} />
            <Row label="風險金額倒推" value={fmtPct(r.riskBasedPercent)} />
            <Row label="最終建議" value={fmtPct(r.finalSuggestedPercent)} highlight />
            <Row label="單股風險 %" value={fmtPct(r.singleStockRiskPercent)} />
            <Row label="最大風險 % (設定)" value={fmtPct(position.input.maxRiskPerTradePercent / 100)} />
          </Section>

          {/* Closed position P&L */}
          {isClosed && position.closePrice !== undefined && (
            <Section title="平倉資料">
              <Row label="平倉價" value={`$${fmtNum(position.closePrice)}`} />
              <Row label="平倉日期" value={position.closedAt ? fmtDate(position.closedAt) : '—'} />
              <Row
                label="已實現盈虧"
                value={`${(position.realizedPnL ?? 0) >= 0 ? '+' : ''}${fmtUSD(position.realizedPnL ?? 0)}`}
              />
            </Section>
          )}

          {/* Warnings at time of entry */}
          {r.warningMessages.length > 0 && (
            <Section title="入場時警告">
              <div className="space-y-1.5">
                {r.warningMessages.map((msg, i) => (
                  <p key={i} className="text-xs text-gray-400">{msg}</p>
                ))}
              </div>
            </Section>
          )}

          {/* Notes */}
          {position.notes && (
            <Section title="備注">
              <p className="text-sm text-gray-300">{position.notes}</p>
            </Section>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};

export default PositionDetailModal;
