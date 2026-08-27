/**
 * SettingsPage.tsx — App config + strategy management.
 */

import React, { useState } from 'react';
import { useStore } from '../store/useStore';

const inputClass =
  'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors';

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({
  label,
  hint,
  children,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1.5">
      {label}
      {hint && <span className="text-gray-500 text-xs ml-2 font-normal">{hint}</span>}
    </label>
    {children}
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
    <h3 className="font-semibold text-gray-200 text-sm uppercase tracking-wider border-b border-gray-800 pb-3">
      {title}
    </h3>
    {children}
  </div>
);

const SettingsPage: React.FC = () => {
  const { config, updateConfig, strategies, addStrategy, removeStrategy } =
    useStore();

  const [saved, setSaved] = useState(false);
  const [newStrategy, setNewStrategy] = useState({
    name: '',
    baseWinRate: 0.45,
    riskOnMultiplier: 1.25,
    neutralMultiplier: 1.0,
    riskOffMultiplier: 0.85,
    description: '',
  });

  const handleSaveConfig = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddStrategy = () => {
    if (!newStrategy.name.trim()) return;
    addStrategy(newStrategy);
    setNewStrategy({
      name: '',
      baseWinRate: 0.45,
      riskOnMultiplier: 1.25,
      neutralMultiplier: 1.0,
      riskOffMultiplier: 0.85,
      description: '',
    });
  };

  const { positions, tradeRecords } = useStore();

  const handleClearAll = () => {
    if (
      window.confirm(
        '⚠️ 確認清除所有數據？（持倉、交易記錄）此操作無法撤銷。',
      )
    ) {
      window.localStorage.removeItem('jlaw-position-manager');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">⚙️ 設定</h2>
        <p className="text-gray-400 text-sm mt-1">調整凱利計算參數及策略設定</p>
      </div>

      {/* App config */}
      <Section title="計算參數設定">
        <div className="grid grid-cols-2 gap-4">
          <Field label="單一持股上限 %" hint="建議 10-20%">
            <input
              type="number"
              min={1}
              max={50}
              step={1}
              value={(config.maxSingleAssetPercent * 100).toFixed(0)}
              onChange={(e) =>
                updateConfig({ maxSingleAssetPercent: parseFloat(e.target.value) / 100 })
              }
              className={inputClass}
            />
          </Field>

          <Field label="風險倒推上限 %" hint="防止過度集中">
            <input
              type="number"
              min={5}
              max={50}
              step={1}
              value={(config.riskBasedPercentCap * 100).toFixed(0)}
              onChange={(e) =>
                updateConfig({ riskBasedPercentCap: parseFloat(e.target.value) / 100 })
              }
              className={inputClass}
            />
          </Field>

          <Field label="保守 b 折扣" hint="乘數，例如 0.7 = 七折">
            <input
              type="number"
              min={0.1}
              max={1}
              step={0.05}
              value={config.conservativeBDiscount}
              onChange={(e) =>
                updateConfig({ conservativeBDiscount: parseFloat(e.target.value) })
              }
              className={inputClass}
            />
          </Field>

          <Field label="Risk Off 倉位乘數" hint="最終倉位再乘以此值">
            <input
              type="number"
              min={0.1}
              max={1}
              step={0.05}
              value={config.riskOffPositionMultiplier}
              onChange={(e) =>
                updateConfig({ riskOffPositionMultiplier: parseFloat(e.target.value) })
              }
              className={inputClass}
            />
          </Field>
        </div>

        <button
          onClick={handleSaveConfig}
          className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors"
        >
          {saved ? '✅ 已儲存' : '儲存設定'}
        </button>

        <div className="bg-gray-800/40 rounded-lg p-3 text-xs text-gray-500 space-y-1 mt-2">
          <p>• 設定更改即時生效，所有計算將使用最新設定值</p>
          <p>• Risk Off 倉位乘數：在 RiskOff 環境下，最終建議倉位 = 基礎建議 × 此乘數</p>
          <p>• 保守 b 折扣：勾選「使用保守盈虧比」時，b 值 = 原始 b × 折扣</p>
        </div>
      </Section>

      {/* Strategies */}
      <Section title="策略設定">
        <div className="space-y-3">
          {strategies.map((s) => (
            <div key={s.id} className="bg-gray-800/60 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white">{s.name}</p>
                    {s.id === 'jlaw-meta' && (
                      <span className="text-xs px-2 py-0.5 bg-blue-900/50 border border-blue-700/40 text-blue-400 rounded-full">
                        預設
                      </span>
                    )}
                  </div>
                  {s.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                    <span>基礎勝率：<strong className="text-gray-200">{(s.baseWinRate * 100).toFixed(0)}%</strong></span>
                    <span>RiskOn：<strong className="text-green-400">×{s.riskOnMultiplier}</strong></span>
                    <span>Neutral：<strong className="text-yellow-400">×{s.neutralMultiplier}</strong></span>
                    <span>RiskOff：<strong className="text-red-400">×{s.riskOffMultiplier}</strong></span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                    <span>RiskOn p: <strong className="text-green-400">{(s.baseWinRate * s.riskOnMultiplier * 100).toFixed(1)}%</strong></span>
                    <span>Neutral p: <strong className="text-yellow-400">{(s.baseWinRate * s.neutralMultiplier * 100).toFixed(1)}%</strong></span>
                    <span>RiskOff p: <strong className="text-red-400">{(s.baseWinRate * s.riskOffMultiplier * 100).toFixed(1)}%</strong></span>
                  </div>
                </div>
                {s.id !== 'jlaw-meta' && s.id !== 'jlaw-breakout' && s.id !== 'custom' && (
                  <button
                    onClick={() => removeStrategy(s.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                    title="刪除策略"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add new strategy */}
        <div className="border-t border-gray-800 pt-4">
          <p className="text-sm font-medium text-gray-300 mb-3">新增自訂策略</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="策略名稱">
              <input
                type="text"
                value={newStrategy.name}
                onChange={(e) => setNewStrategy((p) => ({ ...p, name: e.target.value }))}
                placeholder="My Strategy"
                className={inputClass}
              />
            </Field>
            <Field label="基礎勝率">
              <input
                type="number"
                min={0.01}
                max={0.99}
                step={0.01}
                value={newStrategy.baseWinRate}
                onChange={(e) =>
                  setNewStrategy((p) => ({ ...p, baseWinRate: parseFloat(e.target.value) }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="RiskOn 乘數">
              <input
                type="number"
                min={0.5}
                max={2}
                step={0.05}
                value={newStrategy.riskOnMultiplier}
                onChange={(e) =>
                  setNewStrategy((p) => ({ ...p, riskOnMultiplier: parseFloat(e.target.value) }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="RiskOff 乘數">
              <input
                type="number"
                min={0.3}
                max={1.5}
                step={0.05}
                value={newStrategy.riskOffMultiplier}
                onChange={(e) =>
                  setNewStrategy((p) => ({ ...p, riskOffMultiplier: parseFloat(e.target.value) }))
                }
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="描述 (可選)">
            <input
              type="text"
              value={newStrategy.description}
              onChange={(e) => setNewStrategy((p) => ({ ...p, description: e.target.value }))}
              placeholder="策略描述..."
              className={`${inputClass} mt-3`}
            />
          </Field>
          <button
            onClick={handleAddStrategy}
            disabled={!newStrategy.name.trim()}
            className="mt-3 px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
          >
            ➕ 新增策略
          </button>
        </div>
      </Section>

      {/* Data management */}
      <Section title="數據管理">
        <div className="flex gap-6 flex-wrap text-sm text-gray-400">
          <span>持倉記錄：<strong className="text-white">{positions.length}</strong> 筆</span>
          <span>交易記錄：<strong className="text-white">{tradeRecords.length}</strong> 筆</span>
          <span>儲存位置：<strong className="text-white">LocalStorage</strong></span>
        </div>

        <div className="bg-gray-800/40 rounded-lg p-3 text-xs text-gray-500">
          <p>• 所有數據儲存在瀏覽器 LocalStorage，清除瀏覽器數據將遺失所有記錄</p>
          <p>• 建議定期使用「匯出 CSV」備份數據</p>
        </div>

        <button
          onClick={handleClearAll}
          className="px-4 py-2 rounded-lg bg-red-900/40 hover:bg-red-800/60 border border-red-700/40 text-red-400 text-sm font-medium transition-colors"
        >
          🗑️ 清除所有數據
        </button>
      </Section>

      {/* About */}
      <Section title="關於">
        <div className="text-sm text-gray-400 space-y-2">
          <p>
            <strong className="text-gray-200">JLaw Position Manager</strong> — 專為美股 Position Trader 設計的倉位管理工具
          </p>
          <p>核心算法：凱利公式（Kelly Criterion）+ 風險金額倒推倉位</p>
          <p className="text-xs">
            f* = (b × p − (1 − p)) / b，其中 p = 調整後勝率，b = 盈虧比
          </p>
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3 mt-3">
            <p className="text-yellow-400 text-xs font-medium">⚠️ 免責聲明</p>
            <p className="text-gray-500 text-xs mt-1">
              本工具僅供參考，實際倉位請結合個人判斷與風險承受能力。投資涉及風險，過去表現不代表未來回報。
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default SettingsPage;
