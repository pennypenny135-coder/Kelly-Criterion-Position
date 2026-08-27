/**
 * AddPositionModal.tsx — Confirm dialog before saving a new position.
 * Allows user to adjust the final chosen position %.
 */

import React, { useState } from 'react';
import type { CalculationResult, TradeInput } from '../types';
import { fmtPct, fmtUSD, fmtNum } from '../utils/format';

interface Props {
  input: TradeInput;
  result: CalculationResult;
  strategyName?: string;
  onConfirm: (chosenPercent: number, notes: string) => void;
  onCancel: () => void;
}

const AddPositionModal: React.FC<Props> = ({
  input,
  result,
  strategyName,
  onConfirm,
  onCancel,
}) => {
  const [chosenPercent, setChosenPercent] = useState(
    parseFloat((result.finalSuggestedPercent * 100).toFixed(2)),
  );
  const [notes, setNotes] = useState(input.notes ?? '');

  const chosenFrac = chosenPercent / 100;
  const chosenAmount = chosenFrac * input.totalCapital;
  const chosenShares = input.entryPrice > 0 ? Math.floor(chosenAmount / input.entryPrice) : 0;

  const handleConfirm = () => {
    if (chosenPercent > 0) {
      onConfirm(chosenFrac, notes);
    }
  };

  const marketLabel = {
    RiskOn: '🟢 Risk On',
    Neutral: '🟡 Neutral',
    RiskOff: '🔴 Risk Off',
  }[input.marketEnv];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">確認新增持倉</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Trade summary */}
          <div className="bg-gray-800/60 rounded-xl p-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Ticker</span>
              <span className="text-white font-bold text-base">{input.ticker || '—'}</span>
            </div>
            {strategyName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">策略</span>
                <span className="text-gray-200">{strategyName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">市場環境</span>
              <span className="text-gray-200">{marketLabel}</span>
            </div>
            <div className="h-px bg-gray-700" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">買入價</span>
              <span className="text-white">${fmtNum(input.entryPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">止蝕價</span>
              <span className="text-red-400">${fmtNum(input.stopLossPrice)}</span>
            </div>
            {input.targetPrice && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">目標價</span>
                <span className="text-green-400">${fmtNum(input.targetPrice)}</span>
              </div>
            )}
            <div className="h-px bg-gray-700" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">調整後勝率</span>
              <span className="text-blue-400">{fmtPct(result.adjustedWinRate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">盈虧比 b</span>
              <span className="text-blue-400">{fmtNum(result.b)}R</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">系統建議倉位</span>
              <span className="text-green-400 font-semibold">
                {fmtPct(result.finalSuggestedPercent)} ({fmtUSD(result.finalSuggestedAmount)})
              </span>
            </div>
          </div>

          {/* Chosen position input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              最終選擇倉位 % <span className="text-gray-500 text-xs">(可手動調整)</span>
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                min={0}
                max={50}
                step={0.1}
                value={chosenPercent}
                onChange={(e) => setChosenPercent(parseFloat(e.target.value) || 0)}
                className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <span className="text-gray-400 text-sm">%</span>
              <div className="flex-1 text-sm text-gray-400">
                ≈ <strong className="text-white">{fmtUSD(chosenAmount)}</strong> | {' '}
                <strong className="text-white">{chosenShares}</strong> 股
              </div>
            </div>

            {/* Quick preset buttons */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {[
                { label: '¼ Kelly', val: result.kellyQuarter * 100 },
                { label: '½ Kelly', val: result.kellyHalf * 100 },
                { label: '風險倒推', val: result.riskBasedPercent * 100 },
                { label: '建議', val: result.finalSuggestedPercent * 100 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setChosenPercent(parseFloat(preset.val.toFixed(2)))}
                  className="px-2.5 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-xs text-gray-300 transition-colors"
                >
                  {preset.label} ({fmtPct(preset.val / 100)})
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">備注 (可選)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="記錄入場理由、市場背景等..."
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={chosenPercent <= 0}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
          >
            確認新增持倉 ✓
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPositionModal;
