/**
 * Demo mock data for Classic Way admin modules.
 * Mode via NEXT_PUBLIC_DEMO_MOCK:
 * - "force" (default): always use mock
 * - "fallback": API when non-empty, else mock
 * - "0" | "false": never use mock
 */

export function getDemoMockMode() {
  return (process.env.NEXT_PUBLIC_DEMO_MOCK ?? "force").toLowerCase();
}

export function isDemoMockForced() {
  const mode = getDemoMockMode();
  return mode === "1" || mode === "force" || mode === "true" || mode === "on";
}

export function resolveDemoData<T>(apiItems: T[], mockItems: T[]): T[] {
  const mode = getDemoMockMode();
  if (mode === "0" || mode === "false" || mode === "off") return apiItems;
  if (isDemoMockForced()) return mockItems;
  return apiItems.length > 0 ? apiItems : mockItems;
}

export function resolveDemoItem<T extends { id: number }>(
  apiItem: T | null | undefined,
  mockItems: T[],
  id: number,
): T | null {
  const mode = getDemoMockMode();
  if (isDemoMockForced()) {
    return mockItems.find((item) => item.id === id) ?? apiItem ?? null;
  }
  if (apiItem) return apiItem;
  if (mode === "0" || mode === "false" || mode === "off") return null;
  return mockItems.find((item) => item.id === id) ?? null;
}
