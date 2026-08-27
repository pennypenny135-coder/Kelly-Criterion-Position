/**
 * useStore.ts — Zustand store with LocalStorage persistence.
 *
 * Stores: positions, tradeRecords, strategies, appConfig.
 * All data is persisted to localStorage automatically.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Position,
  TradeRecord,
  StrategyProfile,
  AppConfig,
} from '../types';
import { DEFAULT_STRATEGIES, DEFAULT_CONFIG } from '../utils/kelly';
import { generateId } from '../utils/format';

interface StoreState {
  // Data
  positions: Position[];
  tradeRecords: TradeRecord[];
  strategies: StrategyProfile[];
  config: AppConfig;

  // Position actions
  addPosition: (position: Omit<Position, 'id' | 'createdAt'>) => Position;
  updatePosition: (id: string, updates: Partial<Position>) => void;
  closePosition: (id: string, closePrice: number, notes?: string) => void;

  // Trade record actions
  addTradeRecord: (record: Omit<TradeRecord, 'id' | 'createdAt'>) => TradeRecord;

  // Strategy actions
  addStrategy: (strategy: Omit<StrategyProfile, 'id'>) => void;
  updateStrategy: (id: string, updates: Partial<StrategyProfile>) => void;
  removeStrategy: (id: string) => void;

  // Config actions
  updateConfig: (updates: Partial<AppConfig>) => void;

  // Util
  getStrategyById: (id: string) => StrategyProfile | undefined;
  getPositionById: (id: string) => Position | undefined;
  getOpenPositions: () => Position[];
  getClosedPositions: () => Position[];
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────
      positions: [],
      tradeRecords: [],
      strategies: DEFAULT_STRATEGIES,
      config: DEFAULT_CONFIG,

      // ── Position actions ──────────────────────────────────────────
      addPosition: (positionData) => {
        const position: Position = {
          ...positionData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ positions: [position, ...state.positions] }));
        return position;
      },

      updatePosition: (id, updates) => {
        set((state) => ({
          positions: state.positions.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        }));
      },

      closePosition: (id, closePrice, notes) => {
        const position = get().positions.find((p) => p.id === id);
        if (!position) return;

        const realizedPnL =
          (closePrice - position.entryPrice) * position.chosenPositionShares;

        set((state) => ({
          positions: state.positions.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: 'Closed',
                  closedAt: new Date().toISOString(),
                  closePrice,
                  realizedPnL,
                  notes: notes ?? p.notes,
                }
              : p,
          ),
        }));
      },

      // ── Trade record actions ───────────────────────────────────────
      addTradeRecord: (recordData) => {
        const record: TradeRecord = {
          ...recordData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ tradeRecords: [record, ...state.tradeRecords] }));
        return record;
      },

      // ── Strategy actions ───────────────────────────────────────────
      addStrategy: (strategyData) => {
        const strategy: StrategyProfile = {
          ...strategyData,
          id: generateId(),
        };
        set((state) => ({ strategies: [...state.strategies, strategy] }));
      },

      updateStrategy: (id, updates) => {
        set((state) => ({
          strategies: state.strategies.map((s) =>
            s.id === id ? { ...s, ...updates } : s,
          ),
        }));
      },

      removeStrategy: (id) => {
        set((state) => ({
          strategies: state.strategies.filter((s) => s.id !== id),
        }));
      },

      // ── Config actions ─────────────────────────────────────────────
      updateConfig: (updates) => {
        set((state) => ({ config: { ...state.config, ...updates } }));
      },

      // ── Utility getters ────────────────────────────────────────────
      getStrategyById: (id) => {
        return get().strategies.find((s) => s.id === id);
      },

      getPositionById: (id) => {
        return get().positions.find((p) => p.id === id);
      },

      getOpenPositions: () => {
        return get().positions.filter((p) => p.status === 'Open');
      },

      getClosedPositions: () => {
        return get().positions.filter((p) => p.status === 'Closed');
      },
    }),
    {
      name: 'jlaw-position-manager',
      // Persist everything
      partialize: (state) => ({
        positions: state.positions,
        tradeRecords: state.tradeRecords,
        strategies: state.strategies,
        config: state.config,
      }),
    },
  ),
);
