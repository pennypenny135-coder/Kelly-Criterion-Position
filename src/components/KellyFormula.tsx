/**
 * KellyFormula.tsx — Visual explainer for Kelly formula shown on calculator page.
 */

import React, { useState } from 'react';

const KellyFormula: React.FC = () => {
  const [show, setShow] = useState(false);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setShow(!show)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors"
      >
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          📚 凱利公式說明
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${show ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {show && (
        <div className="px-4 py-4 border-t border-gray-800 space-y-3 text-sm text-gray-400">
          <div className="bg-gray-800/60 rounded-lg p-3 font-mono text-center text-base">
            <span className="text-blue-400">f*</span> ={' '}
            <span className="text-white">(</span>
            <span className="text-green-400">b</span> ×{' '}
            <span className="text-yellow-400">p</span> −{' '}
            <span className="text-white">(1 − </span>
            <span className="text-yellow-400">p</span>
            <span className="text-white">)</span>
            <span className="text-white">) / </span>
            <span className="text-green-400">b</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gray-800/40 rounded-lg p-3">
              <p className="text-yellow-400 font-semibold mb-1">p — 勝率</p>
              <p className="text-xs">策略 base × 市場環境乘數</p>
              <p className="text-xs text-gray-500 mt-1">例：0.45 × 1.25 = 0.5625 (RiskOn)</p>
            </div>
            <div className="bg-gray-800/40 rounded-lg p-3">
              <p className="text-green-400 font-semibold mb-1">b — 盈虧比</p>
              <p className="text-xs">預期盈利 / 預期虧損</p>
              <p className="text-xs text-gray-500 mt-1">例：(目標-入場)/(入場-止蝕)</p>
            </div>
            <div className="bg-gray-800/40 rounded-lg p-3">
              <p className="text-blue-400 font-semibold mb-1">f* — 最優倉位</p>
              <p className="text-xs">長期最大化資產成長</p>
              <p className="text-xs text-gray-500 mt-1">實戰建議用 ½f* 或 ¼f*</p>
            </div>
          </div>

          <div className="text-xs space-y-1.5">
            <p className="font-semibold text-gray-300">計算流程：</p>
            <div className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-4 h-4 flex-shrink-0 flex items-center justify-center text-[10px]">1</span>
              <span>計算 <strong>b</strong>：(目標價−入場價) / (入場價−止蝕價) ×（如選保守則乘0.7）</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-4 h-4 flex-shrink-0 flex items-center justify-center text-[10px]">2</span>
              <span>計算 <strong>p</strong>：策略基礎勝率 × 市場環境乘數（限於 0~1）</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-4 h-4 flex-shrink-0 flex items-center justify-center text-[10px]">3</span>
              <span>計算 <strong>f*</strong>，取半凱利 (0.5×f*) 作為保守倉位</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-4 h-4 flex-shrink-0 flex items-center justify-center text-[10px]">4</span>
              <span>計算 <strong>風險倒推</strong>：最大風險% / 單股風險%</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-600 text-white rounded-full w-4 h-4 flex-shrink-0 flex items-center justify-center text-[10px]">5</span>
              <span><strong>最終建議</strong> = min(半凱利, 風險倒推, 15% 上限)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KellyFormula;
