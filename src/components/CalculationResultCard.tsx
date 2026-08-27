/**
 * CalculationResultCard.tsx — Displays Kelly calculation results.
 */

import React from 'react';
import type { CalculationResult, TradeInput } from '../types';
import { fmtPct, fmtNum, fmtUSD } from '../utils/format';

interface Props {
  result: CalculationResult;
  input: TradeInput;
}

const MetricBox: React.FC<{
  label: string;
  value: string;
  sub?: string;
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
}> = ({ label, value, sub, color = 'gray' }) => {
  const colorMap = {
    green: 'bg-green-900/40 border-green-700/50 text-green-400',
    blue: 'bg-blue-900/40 border-blue-700/50 text-blue-400',
    yellow: 'bg-yellow-900/40 border-yellow-700/50 text-yellow-400',
    red: 'bg-red-900/40 border-red-700/50 text-red-400',
    gray: 'bg-gray-800/60 border-gray-700/50 text-gray-300',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
};

const CalculationResultCard: React.FC<Props> = ({ result, input }) => {
  const isNegEV = !result.isPositiveEV;
  const hasWarnings = result.warningMessages.length > 0;

  const headerColor = isNegEV
    ? 'border-red-600/50 bg-red-950/30'
    : result.warningMessages.some((w) => w.includes('謹慎') || w.includes('低於'))
    ? 'border-yellow-600/50 bg-yellow-950/20'
    : 'border-green-600/50 bg-green-950/20';

  return (
    <div className={`rounded-2xl border ${headerColor} overflow-hidden`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-white">📊 計算結果</h3>
          {isNegEV ? (
            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30">
              ❌ 負期望值
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
              ✅ 正期望值
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Core parameters */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">核心參數</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricBox
              label="調整後勝率 p"
              value={fmtPct(result.adjustedWinRate)}
              color={result.adjustedWinRate >= 0.45 ? 'green' : result.adjustedWinRate >= 0.38 ? 'yellow' : 'red'}
            />
            <MetricBox
              label="盈虧比 b"
              value={fmtNum(result.b, 2) + 'R'}
              color={result.b >= 2 ? 'green' : result.b >= 1.5 ? 'yellow' : 'red'}
            />
            <MetricBox
              label="單股風險"
              value={fmtPct(result.singleStockRiskPercent)}
              sub="(入場 − 止蝕) / 入場"
              color="gray"
            />
            <MetricBox
              label="期望值 EV"
              value={fmtNum(result.adjustedWinRate * result.b - (1 - result.adjustedWinRate), 3)}
              sub="每 $1 期望利潤"
              color={result.isPositiveEV ? 'green' : 'red'}
            />
          </div>
        </div>

        {/* Kelly fractions */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">凱利倉位</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricBox
              label="純凱利 f*"
              value={fmtPct(result.kellyFull)}
              sub={fmtUSD(result.kellyFull * input.totalCapital)}
              color={isNegEV ? 'red' : 'blue'}
            />
            <MetricBox
              label="半凱利 (×0.5)"
              value={fmtPct(result.kellyHalf)}
              sub={fmtUSD(result.kellyHalf * input.totalCapital)}
              color={isNegEV ? 'red' : 'blue'}
            />
            <MetricBox
              label="四分之一凱利 (×0.25)"
              value={fmtPct(result.kellyQuarter)}
              sub={fmtUSD(result.kellyQuarter * input.totalCapital)}
              color={isNegEV ? 'red' : 'blue'}
            />
          </div>
        </div>

        {/* Risk-based and final */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">風險金額倒推 + 最終建議</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MetricBox
              label="風險金額倒推倉位"
              value={fmtPct(result.riskBasedPercent)}
              sub={`${fmtUSD(result.riskBasedPercent * input.totalCapital)} | 基於 ${fmtPct(input.maxRiskPerTradePercent / 100)} 最大風險`}
              color="yellow"
            />
            <MetricBox
              label="🎯 最終建議倉位"
              value={fmtPct(result.finalSuggestedPercent)}
              sub={`${fmtUSD(result.finalSuggestedAmount)} ≈ ${result.finalSuggestedShares} 股`}
              color={isNegEV ? 'red' : result.finalSuggestedPercent > 0 ? 'green' : 'red'}
            />
          </div>
        </div>

        {/* Position size cap info */}
        <div className="bg-gray-800/40 rounded-lg px-4 py-3 text-xs text-gray-400 flex flex-wrap gap-4">
          <span>單一持股上限：<strong className="text-gray-200">{fmtPct(result.maxSingleAssetPercentCap)}</strong></span>
          <span>限制因素：<strong className="text-gray-200">min(半凱利, 風險倒推, {fmtPct(result.maxSingleAssetPercentCap)} 上限)</strong></span>
        </div>

        {/* Warnings */}
        {hasWarnings && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">提示 / 警告</p>
            {result.warningMessages.map((msg, i) => (
              <div
                key={i}
                className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-3 text-sm text-gray-300"
              >
                {msg}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculationResultCard;
