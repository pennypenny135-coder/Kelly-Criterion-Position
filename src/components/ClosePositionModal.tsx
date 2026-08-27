/**
 * ClosePositionModal.tsx — Dialog to close an open position.
 */

import React, { useState } from 'react';
import type { Position } from '../types';
import { fmtUSD, fmtNum, fmtPct } from '../utils/format';

interface Props {
  position: Position;
  onConfirm: (closePrice: number, notes: string) => void;
  onCancel: () => void;
}

const ClosePositionModal: React.FC<Props> = ({ position, onConfirm, onCancel }) => {
  const [closePrice, setClosePrice] = useState(position.targetPrice ?? position.entryPrice);
  const [notes, setNotes] = useState('');

  const pnlPerShare = closePrice - position.entryPrice;
  const totalPnL = pnlPerShare * position.chosenPositionShares;
  const pnlPct = (pnlPerShare / position.entryPrice) * 100;
  const isProfit = totalPnL >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">平倉確認 — {position.ticker}</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Position summary */}
          <div className="bg-gray-800/60 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">入場價</span>
              <span className="text-white">${fmtNum(position.entryPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">持倉股數</span>
              <span className="text-white">{position.chosenPositionShares} 股</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">止蝕</span>
              <span className="text-red-400">${fmtNum(position.stopLossPrice)}</span>
            </div>
            {position.targetPrice && (
              <div className="flex justify-between">
                <span className="text-gray-400">目標</span>
                <span className="text-green-400">${fmtNum(position.targetPrice)}</span>
              </div>
            )}
          </div>

          {/* Close price input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">平倉價格</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={closePrice}
              onChange={(e) => setClosePrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* P&L preview */}
          <div className={`rounded-xl p-4 border ${isProfit ? 'bg-green-900/30 border-green-700/40' : 'bg-red-900/30 border-red-700/40'}`}>
            <p className="text-xs text-gray-400 mb-2">預計盈虧</p>
            <p className={`text-2xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              {isProfit ? '+' : ''}{fmtUSD(totalPnL)}
            </p>
            <p className={`text-sm mt-1 ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {isProfit ? '+' : ''}{fmtNum(pnlPct, 2)}% | {isProfit ? '+' : ''}${fmtNum(pnlPerShare)} / 股
            </p>
            <p className="text-xs text-gray-500 mt-1">
              倉位成本：{fmtUSD(position.chosenPositionAmount)}
              （回報率：{fmtPct(totalPnL / (position.input.totalCapital || 1))}）
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">平倉備注 (可選)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="平倉原因、市場環境..."
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-800 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onConfirm(closePrice, notes)}
            className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors"
          >
            確認平倉
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClosePositionModal;
