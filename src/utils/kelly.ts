/**
 * kelly.ts — Core calculation engine for Kelly-based position sizing.
 *
 * Assumptions / Design decisions:
 * - Conservative B discount is 0.7× (configurable via AppConfig).
 * - RiskOff environment applies an extra 0.7× multiplier on finalSuggestedPercent.
 * - maxSingleAssetPercent cap defaults to 15%.
 * - riskBasedPercent is capped at 25%.
 * - If f* ≤ 0, all Kelly fractions are 0 and EV warning is shown.
 */

import type {
  TradeInput,
  CalculationResult,
  StrategyProfile,
  AppConfig,
} from '../types';

// ─── Default config ───────────────────────────────────────────────────────────

export const DEFAULT_CONFIG: AppConfig = {
  maxSingleAssetPercent: 0.15,      // 15% hard cap per position
  riskBasedPercentCap: 0.25,        // 25% cap on risk-based sizing
  conservativeBDiscount: 0.70,      // b × 0.7 when useConservativeB = true
  riskOffPositionMultiplier: 0.70,  // final position × 0.7 in RiskOff
};

// ─── Default strategy profiles ───────────────────────────────────────────────

export const DEFAULT_STRATEGIES: StrategyProfile[] = [
  {
    id: 'jlaw-meta',
    name: 'JLaw M.E.T.A',
    baseWinRate: 0.45,
    riskOnMultiplier: 1.25,
    neutralMultiplier: 1.0,
    riskOffMultiplier: 0.85,
    description: 'Momentum & trend-following breakout strategy targeting high R:R',
  },
  {
    id: 'jlaw-breakout',
    name: 'JLaw Breakout',
    baseWinRate: 0.42,
    riskOnMultiplier: 1.20,
    neutralMultiplier: 1.0,
    riskOffMultiplier: 0.80,
    description: 'Sector breakout with volume confirmation',
  },
  {
    id: 'custom',
    name: 'Custom / Manual',
    baseWinRate: 0.45,
    riskOnMultiplier: 1.0,
    neutralMultiplier: 1.0,
    riskOffMultiplier: 1.0,
    description: 'Manually specify win rate and profit/loss ratio',
  },
];

// ─── Helper: clamp a number within [min, max] ─────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Step 1: Calculate profit/loss ratio b ───────────────────────────────────

export function calculateB(input: TradeInput, config: AppConfig = DEFAULT_CONFIG): number {
  // User manually specified b → use it directly
  if (input.estimatedProfitLossRatio && input.estimatedProfitLossRatio > 0) {
    const rawB = input.estimatedProfitLossRatio;
    return input.useConservativeB ? rawB * config.conservativeBDiscount : rawB;
  }

  // Calculate b from entry, target, stop-loss prices
  if (input.targetPrice && input.targetPrice > input.entryPrice) {
    const expectedGain = (input.targetPrice - input.entryPrice) / input.entryPrice;
    const expectedLoss = (input.entryPrice - input.stopLossPrice) / input.entryPrice;

    if (expectedLoss <= 0) return 1; // degenerate case — avoid division by zero

    const rawB = expectedGain / expectedLoss;
    return input.useConservativeB ? rawB * config.conservativeBDiscount : rawB;
  }

  // Fallback: if neither is available, default b = 2.0 (reasonable for position traders)
  return 2.0;
}

// ─── Step 2: Calculate adjusted win rate p ───────────────────────────────────

export function calculateAdjustedWinRate(
  input: TradeInput,
  strategy: StrategyProfile | undefined,
): number {
  // User manually specified p → use it
  if (input.estimatedWinRate !== undefined && input.estimatedWinRate > 0) {
    return clamp(input.estimatedWinRate, 0, 1);
  }

  if (!strategy) {
    // No strategy — use a safe default
    return 0.45;
  }

  const multiplier =
    input.marketEnv === 'RiskOn'
      ? strategy.riskOnMultiplier
      : input.marketEnv === 'RiskOff'
      ? strategy.riskOffMultiplier
      : strategy.neutralMultiplier;

  return clamp(strategy.baseWinRate * multiplier, 0, 1);
}

// ─── Step 3: Kelly formula ────────────────────────────────────────────────────

/**
 * f* = (b × p − (1 − p)) / b
 *
 * Returns 0 if f* ≤ 0 (negative EV).
 */
export function kellyFraction(p: number, b: number): number {
  const f = (b * p - (1 - p)) / b;
  return Math.max(0, f);
}

// ─── Step 4: Risk-amount back-calculated position size ───────────────────────

/**
 * riskBasedPercent = maxRiskPerTradePercent / singleStockRiskPercent
 *
 * Example:
 *   maxRisk = 1.5%, entry = 100, stop = 95 → singleStockRisk = 5%
 *   positionSize = 1.5% / 5% = 30% → capped at riskBasedPercentCap
 */
export function riskBackCalcPercent(
  input: TradeInput,
  config: AppConfig = DEFAULT_CONFIG,
): { riskBasedPercent: number; singleStockRiskPercent: number } {
  const singleStockRiskPercent =
    (input.entryPrice - input.stopLossPrice) / input.entryPrice;

  if (singleStockRiskPercent <= 0) {
    return { riskBasedPercent: 0, singleStockRiskPercent: 0 };
  }

  const riskFraction = (input.maxRiskPerTradePercent / 100) / singleStockRiskPercent;
  const riskBasedPercent = clamp(riskFraction, 0, config.riskBasedPercentCap);

  return { riskBasedPercent, singleStockRiskPercent };
}

// ─── Step 5: Build warnings ───────────────────────────────────────────────────

function buildWarnings(
  p: number,
  b: number,
  f: number,
  riskBasedPercent: number,
  kellyHalf: number,
  input: TradeInput,
): string[] {
  const warnings: string[] = [];

  if (f <= 0) {
    warnings.push('⚠️ 期望值為負（EV < 0），不建議開倉。請重新評估勝率或盈虧比。');
  }

  if (p < 0.4) {
    warnings.push('⚠️ 勝率低於 40%，策略邊際效益較低，請謹慎評估。');
  }

  if (b < 1.5) {
    warnings.push('⚠️ 盈虧比低於 1.5，相對風險較高，建議目標至少達到入場風險的 1.5 倍。');
  }

  if (input.marketEnv === 'RiskOff') {
    warnings.push('📉 市場環境：Risk Off — 倉位已自動縮減，建議保守操作。');
  }

  if (f > 0 && riskBasedPercent < kellyHalf * 0.5) {
    warnings.push(
      '💡 風險金額上限限制下，建議倉位遠低於凱利半倉。當前設定偏保守，可考慮調整最大風險 % 或止蝕範圍。',
    );
  }

  if (input.useConservativeB) {
    warnings.push('🔧 已使用保守盈虧比（×0.7 折扣），倉位計算較為謹慎。');
  }

  return warnings;
}

// ─── Main calculation function ────────────────────────────────────────────────

export function calculatePosition(
  input: TradeInput,
  strategy: StrategyProfile | undefined,
  config: AppConfig = DEFAULT_CONFIG,
): CalculationResult {
  // --- 1. Calculate b
  const b = calculateB(input, config);

  // --- 2. Calculate adjusted p
  const adjustedWinRate = calculateAdjustedWinRate(input, strategy);

  // --- 3. Kelly fractions
  const f = kellyFraction(adjustedWinRate, b);
  const kellyFull = f;
  const kellyHalf = f * 0.5;
  const kellyQuarter = f * 0.25;

  // --- 4. Risk-back-calc
  const { riskBasedPercent, singleStockRiskPercent } = riskBackCalcPercent(input, config);

  // --- 5. Final suggested position
  const maxSingleAssetPercentCap = config.maxSingleAssetPercent;

  let finalSuggestedPercent = Math.min(
    kellyHalf > 0 ? kellyHalf : Infinity,
    riskBasedPercent > 0 ? riskBasedPercent : Infinity,
    maxSingleAssetPercentCap,
  );

  // If no positive value is available, set to 0
  if (!isFinite(finalSuggestedPercent) || finalSuggestedPercent <= 0) {
    finalSuggestedPercent = 0;
  }

  // Extra haircut in RiskOff environment
  if (input.marketEnv === 'RiskOff') {
    finalSuggestedPercent *= config.riskOffPositionMultiplier;
  }

  const finalSuggestedAmount = finalSuggestedPercent * input.totalCapital;
  const finalSuggestedShares =
    input.entryPrice > 0 ? Math.floor(finalSuggestedAmount / input.entryPrice) : 0;

  // --- 6. Warnings
  const warningMessages = buildWarnings(
    adjustedWinRate,
    b,
    f,
    riskBasedPercent,
    kellyHalf,
    input,
  );

  return {
    adjustedWinRate,
    b,
    kellyFull,
    kellyHalf,
    kellyQuarter,
    riskBasedPercent,
    maxSingleAssetPercentCap,
    finalSuggestedPercent,
    finalSuggestedAmount,
    finalSuggestedShares,
    singleStockRiskPercent,
    warningMessages,
    isPositiveEV: f > 0,
  };
}
