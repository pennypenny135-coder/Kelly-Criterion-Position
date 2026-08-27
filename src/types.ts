// ─────────────────────────────────────────────
//  Core data types for JLaw Position Manager
// ─────────────────────────────────────────────

export type MarketEnvironment = 'RiskOn' | 'Neutral' | 'RiskOff';

export type TradeType = 'New' | 'Add' | 'Reduce' | 'Close';

export type PositionStatus = 'Open' | 'Closed';

/**
 * Strategy profile — defines base win rate & market env multipliers.
 * Multipliers adjust the base win rate depending on market conditions.
 */
export interface StrategyProfile {
  id: string;
  name: string;                    // e.g. "JLaw M.E.T.A"
  baseWinRate: number;             // p_base, e.g. 0.45
  baseProfitLossRatio?: number;    // b_base (optional preset)
  riskOnMultiplier: number;        // e.g. 1.25
  neutralMultiplier: number;       // e.g. 1.0
  riskOffMultiplier: number;       // e.g. 0.85
  description?: string;
}

/**
 * Raw inputs the user provides for a new position calculation.
 */
export interface TradeInput {
  ticker: string;
  strategyId?: string;
  entryPrice: number;
  targetPrice?: number;            // optional — used to auto-calculate b
  stopLossPrice: number;
  estimatedWinRate?: number;       // override p if provided
  estimatedProfitLossRatio?: number; // override b if provided
  marketEnv: MarketEnvironment;
  totalCapital: number;
  maxRiskPerTradePercent: number;  // e.g. 1.5 means 1.5% of total capital
  useConservativeB?: boolean;      // apply 0.7× discount on b
  notes?: string;
}

/**
 * Result produced by the Kelly calculation engine.
 */
export interface CalculationResult {
  adjustedWinRate: number;         // final p after strategy + market env
  b: number;                       // profit/loss ratio used
  kellyFull: number;               // f* (as fraction, e.g. 0.12 = 12%)
  kellyHalf: number;               // 0.5 × f*
  kellyQuarter: number;            // 0.25 × f*
  riskBasedPercent: number;        // position size from risk-amount back-calc
  maxSingleAssetPercentCap: number; // hard cap, e.g. 0.15
  finalSuggestedPercent: number;   // min(kellyHalf, riskBased, cap)
  finalSuggestedAmount: number;    // finalSuggestedPercent × totalCapital
  finalSuggestedShares: number;    // finalSuggestedAmount / entryPrice
  singleStockRiskPercent: number;  // (entry - stopLoss) / entry
  warningMessages: string[];
  isPositiveEV: boolean;
}

/**
 * A saved open/closed position.
 */
export interface Position {
  id: string;
  ticker: string;
  strategyId?: string;
  strategyName?: string;
  entryPrice: number;
  targetPrice?: number;
  stopLossPrice: number;
  winRate: number;                  // adjusted p
  profitLossRatio: number;          // b
  marketEnv: MarketEnvironment;

  // Kelly suggestions at time of entry
  suggestedPositionPercentKellyFull: number;
  suggestedPositionPercentKellyHalf: number;
  suggestedPositionPercentKellyQuarter: number;
  suggestedPositionPercentRiskBased: number;
  suggestedPositionPercentFinal: number;

  // User's chosen position
  chosenPositionPercent: number;
  chosenPositionAmount: number;
  chosenPositionShares: number;

  createdAt: string;               // ISO string
  status: PositionStatus;
  closedAt?: string;
  closePrice?: number;
  realizedPnL?: number;
  notes?: string;

  // Snapshot of full calculation result
  calculationResult: CalculationResult;
  input: TradeInput;
}

/**
 * Immutable trade log entry.
 */
export interface TradeRecord {
  id: string;
  ticker: string;
  type: TradeType;
  createdAt: string;
  input: TradeInput;
  calculationResult: CalculationResult;
  positionId?: string;             // link to Position if saved
  notes?: string;
}

/**
 * App-wide configuration (can be user-edited in future).
 */
export interface AppConfig {
  maxSingleAssetPercent: number;   // default 0.15 (15%)
  riskBasedPercentCap: number;     // cap on risk-based position, default 0.25
  conservativeBDiscount: number;   // multiplier for conservative b, default 0.7
  riskOffPositionMultiplier: number; // extra haircut in RiskOff, default 0.7
}
