/** Simulated network latency so loading states are real. Disabled under test. */
export function simulateLatency(ms = 280): Promise<void> {
  if (import.meta.env?.MODE === "test") return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}
