/**
 * Client-side settlement store (localStorage). Empty until a human saves.
 */

export type SettlementParty = "owner" | "charterer" | "split" | "";

export interface Settlement {
  voyageId: string;
  amountUsd: number | null;
  party: SettlementParty;
  settledOn: string;
  note: string;
}

const STORAGE_KEY = "keel.settlements.v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readAll(): Record<string, Settlement> {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Settlement>;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, Settlement>): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/** Returns null when no settlement has been saved for this voyage. */
export function getSettlement(voyageId: string): Settlement | null {
  const map = readAll();
  return map[voyageId] ?? null;
}

export function saveSettlement(settlement: Settlement): void {
  const map = readAll();
  map[settlement.voyageId] = {
    voyageId: settlement.voyageId,
    amountUsd: settlement.amountUsd,
    party: settlement.party,
    settledOn: settlement.settledOn,
    note: settlement.note,
  };
  writeAll(map);
}

export function clearSettlement(voyageId: string): void {
  const map = readAll();
  if (!(voyageId in map)) return;
  delete map[voyageId];
  writeAll(map);
}
