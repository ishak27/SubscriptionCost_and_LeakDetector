/* Member 2: pure savings calculations; UI remains in app.js to preserve Cove's design. */
window.CoveSavingsCalculator = {
  calculate(subscriptions, selectedIds) {
    const selected = new Set([...selectedIds].map(String));
    const monthly = subscriptions
      .filter((sub) => selected.has(String(sub.id)))
      .reduce((sum, sub) => sum + window.CoveOverlapDetector.monthlyCost(sub), 0);
    return { monthly, annual: monthly * 12 };
  },
  fromOverlaps(overlaps) {
    const monthly = overlaps.reduce((sum, overlap) => sum + overlap.leakMonthly, 0);
    return { monthly, annual: monthly * 12 };
  }
};
