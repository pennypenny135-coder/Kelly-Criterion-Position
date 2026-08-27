/**
 * NewPositionPage.tsx — Main calculator page.
 *
 * Features:
 * - Full trade input form
 * - Calculate Only (no save)
 * - Add (save as Position + TradeRecord)
 * - Shows CalculationResultCard
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TradeInput, MarketEnvironment } from '../types';
import { calculatePosition, DEFAULT_STRATEGIES } from '../utils/kelly';
import { useStore } from '../store/useStore';
import CalculationResultCard from '../components/CalculationResultCard';
import AddPositionModal from '../components/AddPositionModal';
import KellyFormula from '../components/KellyFormula';

// ─── Form field component ────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, hint, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1.5">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
      {hint && <span className="text-gray-500 text-xs ml-2 font-normal">{hint}</span>}
    </label>
    {children}
  </div>
);

const inputClass =
  'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors';

const selectClass =
  'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors';

// ─── Default form values ─────────────────────────────────────────────────────

const defaultForm = {
  ticker: '',
  strategyId: 'jlaw-meta',
  marketEnv: 'Neutral' as MarketEnvironment,
  totalCapital: 100000,
  maxRiskPerTradePercent: 1.5,
  entryPrice: '',
  targetPrice: '',
  stopLossPrice: '',
  estimatedWinRate: '',
  estimatedProfitLossRatio: '',
  useConservativeB: false,
  notes: '',
};

// ─── Validation ──────────────────────────────────────────────────────────────

function validateForm(form: typeof defaultForm): string[] {
  const errors: string[] = [];
  const entry = parseFloat(form.entryPrice as string);
  const stop = parseFloat(form.stopLossPrice as string);
  const target = parseFloat(form.targetPrice as string);

  if (!form.entryPrice) errors.push('請輸入買入價');
  if (!form.stopLossPrice) errors.push('請輸入止蝕價');
  if (entry > 0 && stop >= entry) errors.push('止蝕價必須低於買入價');
  if (form.targetPrice && target <= entry) errors.push('目標價必須高於買入價');
  if (form.totalCapital <= 0) errors.push('總資金必須大於 0');
  if (form.maxRiskPerTradePercent <= 0 || form.maxRiskPerTradePercent > 10)
    errors.push('最大風險 % 請設在 0.1% ~ 10% 之間');
  const wp = parseFloat(form.estimatedWinRate as string);
  if (form.estimatedWinRate && (wp <= 0 || wp >= 1))
    errors.push('勝率請輸入 0–1 之間的小數，例如 0.45');

  return errors;
}

// ─── Main component ───────────────────────────────────────────────────────────

const NewPositionPage: React.FC = () => {
  const navigate = useNavigate();
  const { strategies, config, addPosition, addTradeRecord, getStrategyById } = useStore();

  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<string[]>([]);
  const [calcResult, setCalcResult] = useState<ReturnType<typeof calculatePosition> | null>(null);
  const [calcInput, setCalcInput] = useState<TradeInput | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Combine defaults with any user-added strategies
  const allStrategies = strategies.length > 0 ? strategies : DEFAULT_STRATEGIES;

  const updateField = useCallback(
    <K extends keyof typeof defaultForm>(key: K, value: (typeof defaultForm)[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors([]);
      setSuccessMsg('');
    },
    [],
  );

  const buildInput = (): TradeInput => ({
    ticker: form.ticker.toUpperCase().trim(),
    strategyId: form.strategyId,
    entryPrice: parseFloat(form.entryPrice as string),
    targetPrice: form.targetPrice ? parseFloat(form.targetPrice as string) : undefined,
    stopLossPrice: parseFloat(form.stopLossPrice as string),
    estimatedWinRate: form.estimatedWinRate ? parseFloat(form.estimatedWinRate as string) : undefined,
    estimatedProfitLossRatio: form.estimatedProfitLossRatio
      ? parseFloat(form.estimatedProfitLossRatio as string)
      : undefined,
    marketEnv: form.marketEnv,
    totalCapital: Number(form.totalCapital),
    maxRiskPerTradePercent: Number(form.maxRiskPerTradePercent),
    useConservativeB: form.useConservativeB,
    notes: form.notes,
  });

  const handleCalculate = () => {
    const errs = validateForm(form);
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    const input = buildInput();
    const strategy = getStrategyById(form.strategyId);
    const result = calculatePosition(input, strategy, config);
    setCalcResult(result);
    setCalcInput(input);
    setErrors([]);
  };

  const handleAddClick = () => {
    const errs = validateForm(form);
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    if (!calcResult) {
      // Auto-calculate first
      handleCalculate();
    }
    const input = buildInput();
    const strategy = getStrategyById(form.strategyId);
    const result = calculatePosition(input, strategy, config);
    setCalcResult(result);
    setCalcInput(input);
    setErrors([]);
    setShowAddModal(true);
  };

  const handleConfirmAdd = (chosenPercent: number, notes: string) => {
    if (!calcResult || !calcInput) return;

    const strategy = getStrategyById(form.strategyId);
    const chosenAmount = chosenPercent * calcInput.totalCapital;
    const chosenShares = Math.floor(chosenAmount / calcInput.entryPrice);

    const position = addPosition({
      ticker: calcInput.ticker,
      strategyId: calcInput.strategyId,
      strategyName: strategy?.name,
      entryPrice: calcInput.entryPrice,
      targetPrice: calcInput.targetPrice,
      stopLossPrice: calcInput.stopLossPrice,
      winRate: calcResult.adjustedWinRate,
      profitLossRatio: calcResult.b,
      marketEnv: calcInput.marketEnv,
      suggestedPositionPercentKellyFull: calcResult.kellyFull,
      suggestedPositionPercentKellyHalf: calcResult.kellyHalf,
      suggestedPositionPercentKellyQuarter: calcResult.kellyQuarter,
      suggestedPositionPercentRiskBased: calcResult.riskBasedPercent,
      suggestedPositionPercentFinal: calcResult.finalSuggestedPercent,
      chosenPositionPercent: chosenPercent,
      chosenPositionAmount: chosenAmount,
      chosenPositionShares: chosenShares,
      status: 'Open',
      notes,
      calculationResult: calcResult,
      input: { ...calcInput, notes },
    });

    addTradeRecord({
      ticker: calcInput.ticker,
      type: 'New',
      input: calcInput,
      calculationResult: calcResult,
      positionId: position.id,
      notes,
    });

    setShowAddModal(false);
    setSuccessMsg(`✅ 已新增持倉：${calcInput.ticker || '—'} ${(chosenPercent * 100).toFixed(2)}% 倉位`);
    setTimeout(() => navigate('/positions'), 1200);
  };

  const handleReset = () => {
    setForm(defaultForm);
    setCalcResult(null);
    setCalcInput(null);
    setErrors([]);
    setSuccessMsg('');
  };

  const selectedStrategy = allStrategies.find((s) => s.id === form.strategyId);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-white">🧮 新倉位計算器</h2>
        <p className="text-gray-400 text-sm mt-1">
          輸入交易參數，系統將自動計算凱利最優倉位 + 風險金額倒推倉位
        </p>
      </div>

      {/* Quick examples */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">快速範例：</span>
        {[
          { label: 'NVDA 突破', ticker: 'NVDA', entry: '875', stop: '845', target: '950', env: 'RiskOn' as MarketEnvironment },
          { label: 'SPY 保守', ticker: 'SPY', entry: '520', stop: '510', target: '545', env: 'Neutral' as MarketEnvironment },
          { label: 'AAPL RiskOff', ticker: 'AAPL', entry: '185', stop: '178', target: '200', env: 'RiskOff' as MarketEnvironment },
        ].map((ex) => (
          <button
            key={ex.label}
            onClick={() => {
              setForm((prev) => ({
                ...prev,
                ticker: ex.ticker,
                entryPrice: ex.entry,
                stopLossPrice: ex.stop,
                targetPrice: ex.target,
                marketEnv: ex.env,
              }));
              setCalcResult(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 border border-gray-700 transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── Left: Form ── */}
        <div className="space-y-5">
          {/* Strategy & market */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-200 text-sm uppercase tracking-wider">策略與市場</h3>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Ticker / 股票代號">
                <input
                  type="text"
                  value={form.ticker}
                  onChange={(e) => updateField('ticker', e.target.value)}
                  placeholder="NVDA"
                  className={inputClass}
                />
              </Field>

              <Field label="市場環境" required>
                <select
                  value={form.marketEnv}
                  onChange={(e) => updateField('marketEnv', e.target.value as MarketEnvironment)}
                  className={selectClass}
                >
                  <option value="RiskOn">🟢 Risk On</option>
                  <option value="Neutral">🟡 Neutral</option>
                  <option value="RiskOff">🔴 Risk Off</option>
                </select>
              </Field>
            </div>

            <Field label="策略">
              <select
                value={form.strategyId}
                onChange={(e) => updateField('strategyId', e.target.value)}
                className={selectClass}
              >
                {allStrategies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {selectedStrategy && (
                <p className="text-xs text-gray-500 mt-1.5">
                  基礎勝率：{(selectedStrategy.baseWinRate * 100).toFixed(0)}% | 市場乘數：
                  RiskOn×{selectedStrategy.riskOnMultiplier} / Neutral×{selectedStrategy.neutralMultiplier} / RiskOff×{selectedStrategy.riskOffMultiplier}
                </p>
              )}
            </Field>
          </div>

          {/* Capital & risk */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-200 text-sm uppercase tracking-wider">資金與風險設定</h3>

            <div className="grid grid-cols-2 gap-4">
              <Field label="總資金 (USD)" required>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  value={form.totalCapital}
                  onChange={(e) => updateField('totalCapital', Number(e.target.value))}
                  className={inputClass}
                />
              </Field>

              <Field
                label="最大單筆風險 %"
                hint="佔總資金"
                required
              >
                <input
                  type="number"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={form.maxRiskPerTradePercent}
                  onChange={(e) => updateField('maxRiskPerTradePercent', Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          {/* Prices */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-200 text-sm uppercase tracking-wider">價格設定</h3>

            <div className="grid grid-cols-3 gap-4">
              <Field label="買入價" required>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={form.entryPrice}
                  onChange={(e) => updateField('entryPrice', e.target.value)}
                  placeholder="100.00"
                  className={inputClass}
                />
              </Field>

              <Field label="止蝕價" required>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={form.stopLossPrice}
                  onChange={(e) => updateField('stopLossPrice', e.target.value)}
                  placeholder="95.00"
                  className={inputClass}
                />
              </Field>

              <Field label="目標價" hint="可選">
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={form.targetPrice}
                  onChange={(e) => updateField('targetPrice', e.target.value)}
                  placeholder="115.00"
                  className={inputClass}
                />
              </Field>
            </div>

            {/* Price visual */}
            {form.entryPrice && form.stopLossPrice && (
              <div className="flex items-center gap-1 text-xs mt-1">
                <div className="flex-1 text-center">
                  {form.stopLossPrice && (
                    <span className="text-red-400">
                      止蝕 ${parseFloat(form.stopLossPrice as string).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-center">
                  <span className="text-blue-400">
                    入場 ${parseFloat(form.entryPrice as string).toFixed(2)}
                  </span>
                </div>
                <div className="flex-1 text-center">
                  {form.targetPrice && (
                    <span className="text-green-400">
                      目標 ${parseFloat(form.targetPrice as string).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Advanced overrides */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-200 text-sm uppercase tracking-wider">
              進階覆蓋（可選）
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <Field label="手動勝率 p" hint="留空用策略預設">
                <input
                  type="number"
                  min={0.01}
                  max={0.99}
                  step={0.01}
                  value={form.estimatedWinRate}
                  onChange={(e) => updateField('estimatedWinRate', e.target.value)}
                  placeholder="0.45"
                  className={inputClass}
                />
              </Field>

              <Field label="手動盈虧比 b" hint="留空用目標/止蝕計算">
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={form.estimatedProfitLossRatio}
                  onChange={(e) => updateField('estimatedProfitLossRatio', e.target.value)}
                  placeholder="2.0"
                  className={inputClass}
                />
              </Field>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.useConservativeB}
                onChange={(e) => updateField('useConservativeB', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
              <div>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  使用保守盈虧比
                </span>
                <p className="text-xs text-gray-500">對 b 打 0.7 折，更保守計算倉位</p>
              </div>
            </label>

            <Field label="備注" hint="可選">
              <input
                type="text"
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="例如：NVDA breakout from consolidation..."
                className={inputClass}
              />
            </Field>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-950/50 border border-red-700/50 rounded-xl p-4 space-y-1">
              {errors.map((e, i) => (
                <p key={i} className="text-sm text-red-400">
                  ❌ {e}
                </p>
              ))}
            </div>
          )}

          {/* Success message */}
          {successMsg && (
            <div className="bg-green-950/50 border border-green-700/50 rounded-xl p-4">
              <p className="text-sm text-green-400">{successMsg}</p>
            </div>
          )}

          {/* Kelly formula explainer */}
          <KellyFormula />

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCalculate}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors"
            >
              🧮 Calculate Only
            </button>
            <button
              onClick={handleAddClick}
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-colors"
            >
              ➕ Add Position
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-sm transition-colors"
              title="重置表單"
            >
              🔄
            </button>
          </div>
        </div>

        {/* ── Right: Result ── */}
        <div>
          {calcResult && calcInput ? (
            <div className="sticky top-20">
              <CalculationResultCard result={calcResult} input={calcInput} />
            </div>
          ) : (
            <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="text-5xl mb-4">📊</div>
              <p className="text-gray-400 font-medium">計算結果將顯示於此</p>
              <p className="text-gray-600 text-sm mt-2">
                填寫左側表單後，點擊「Calculate Only」或「Add Position」
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add position modal */}
      {showAddModal && calcResult && calcInput && (
        <AddPositionModal
          input={calcInput}
          result={calcResult}
          strategyName={selectedStrategy?.name}
          onConfirm={handleConfirmAdd}
          onCancel={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

export default NewPositionPage;
