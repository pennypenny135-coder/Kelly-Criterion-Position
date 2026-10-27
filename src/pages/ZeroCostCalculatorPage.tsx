import React, { useState } from 'react';
import { useStore } from '../store/useStore'; // 修正這裡

export default function ZeroCostCalculatorPage() {
  const { positions } = useStore();

  // 表單狀態
  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  const [shares, setShares] = useState<string>('');
  const [avgCost, setAvgCost] = useState<string>('');
  const [currentPrice, setCurrentPrice] = useState<string>('');
  const [targetCost, setTargetCost] = useState<string>('0'); // 0代表0成本

  // 當使用者從下拉選單選擇現有持倉時，自動帶入數據
  const handleSelectPosition = (id: string) => {
    setSelectedPositionId(id);
    const pos = positions.find((p) => p.id === id);
    if (pos) {
      setShares(pos.shares.toString());
      setAvgCost(pos.avgPrice.toString());
      setCurrentPrice(pos.currentPrice?.toString() || '');
    }
  };

  // 數值轉換
  const nShares = parseFloat(shares) || 0;
  const nAvgCost = parseFloat(avgCost) || 0;
  const nCurrPrice = parseFloat(currentPrice) || 0;
  const nTargetCost = parseFloat(targetCost) || 0;

  // 計算邏輯
  const totalInvested = nShares * nAvgCost;
  const sharesToZeroCost = nCurrPrice > 0 ? Math.ceil(totalInvested / nCurrPrice) : 0;
  const isZeroCostPossible = nCurrPrice > 0 && totalInvested > 0;

  let sharesToTarget = 0;
  let isTargetPossible = false;

  if (nCurrPrice > nTargetCost && nAvgCost > nTargetCost && nShares > 0) {
    const numerator = nShares * (nAvgCost - nTargetCost);
    const denominator = nCurrPrice - nTargetCost;
    sharesToTarget = Math.ceil(numerator / denominator);
    isTargetPossible = sharesToTarget <= nShares && sharesToTarget > 0;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">0成本與降成本計算器</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          計算需要賣出多少股才能實現「零成本持倉」或將平均成本降低至目標價位。
        </p>
      </div>

      {/* 若有現有的持倉，提供快速選擇 */}
      {positions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            從現有持倉快速帶入：
          </label>
          <select
            value={selectedPositionId}
            onChange={(e) => handleSelectPosition(e.target.value)}
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="">-- 手動輸入或選擇持倉 --</option>
            {positions.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.symbol} - 持股: {pos.shares} | 均價: {pos.avgPrice}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 輸入面板 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            目前持股數 (Shares)
          </label>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="例如: 1000"
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            目前買入均價 (Average Cost)
          </label>
          <input
            type="number"
            value={avgCost}
            onChange={(e) => setAvgCost(e.target.value)}
            placeholder="例如: 50.0"
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            目前現價 (Current Price)
          </label>
          <input
            type="number"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(e.target.value)}
            placeholder="例如: 75.0"
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            目標均價 (Target Cost，設為 0 即為 0成本)
          </label>
          <input
            type="number"
            value={targetCost}
            onChange={(e) => setTargetCost(e.target.value)}
            placeholder="例如: 0"
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* 計算結果面板 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 結果 1: 0成本持倉 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
            🛡️ 0成本持倉目標
          </h2>
          {isZeroCostPossible ? (
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p>
                需賣出股數：<strong className="text-xl text-blue-600 dark:text-blue-400">{sharesToZeroCost} 股</strong>
              </p>
              <p className="text-sm">
                賣出後剩餘持股：<strong>{Math.max(0, nShares - sharesToZeroCost)} 股</strong>（全部變成免費籌碼）
              </p>
              <p className="text-xs text-gray-500">
                （計算基礎：收回本金 ${totalInvested.toLocaleString()}）
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">請填寫完整的持股、均價與現價以進行計算。</p>
          )}
        </div>

        {/* 結果 2: 降至目標均價 */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
            🎯 降低至目標均價 (${nTargetCost})
          </h2>
          {isTargetPossible ? (
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p>
                需賣出股數：<strong className="text-xl text-green-600 dark:text-green-400">{sharesToTarget} 股</strong>
              </p>
              <p className="text-sm">
                賣出後剩餘持股：<strong>{nShares - sharesToTarget} 股</strong>（均價降至 ${nTargetCost}）
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {nCurrPrice <= nTargetCost
                ? '現價必須大於目標價才能透過賣出一部分來降低均價。'
                : '請確保現價高於均價，且均價高於目標價。'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
