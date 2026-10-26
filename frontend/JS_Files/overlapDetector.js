/* Member 2: overlap detection. Uses monthly-equivalent cost to compare different billing cycles. */
window.CoveOverlapDetector = {
  monthlyCost(subscription) {
    const amount = Number(subscription.cost) || 0;
    if (subscription.billingCycle === 'weekly') return amount * 52 / 12;
    if (subscription.billingCycle === 'yearly') return amount / 12;
    return amount;
  },
  detect(subscriptions) {
    const groups = new Map();
    subscriptions.forEach((sub) => {
      const category = String(sub.category || 'Other').trim() || 'Other';
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(sub);
    });
    return [...groups.entries()]
      .filter(([, items]) => items.length > 1)
      .map(([category, items]) => {
        const sorted = [...items].sort((a, b) => this.monthlyCost(a) - this.monthlyCost(b));
        const keep = sorted[0];
        const leaking = sorted.slice(1);
        const leakMonthly = leaking.reduce((sum, sub) => sum + this.monthlyCost(sub), 0);
        return { category, subs: sorted, keep, leaking, leakMonthly, leakAnnual: leakMonthly * 12 };
      })
      .sort((a, b) => b.leakMonthly - a.leakMonthly);
  }
};
