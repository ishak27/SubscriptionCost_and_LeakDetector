/* Member 3: category totals and budget warnings. UI remains in app.js. */
window.CoveSpendingInsights = {
  summarize(subscriptions, monthlyBudget = 0) {
    const categories = {};
    subscriptions.forEach((sub) => {
      const category = String(sub.category || 'Other');
      if (!categories[category]) categories[category] = { category, monthly: 0, count: 0 };
      categories[category].monthly += window.CoveOverlapDetector.monthlyCost(sub);
      categories[category].count += 1;
    });
    const rows = Object.values(categories).sort((a, b) => b.monthly - a.monthly);
    const totalMonthly = rows.reduce((sum, row) => sum + row.monthly, 0);
    const budget = Number(monthlyBudget) || 0;
    const budgetPercent = budget > 0 ? Math.round(totalMonthly / budget * 100) : null;
    return {
      rows,
      totalMonthly,
      highestCategory: rows[0] || null,
      budget,
      budgetPercent,
      budgetStatus: !budget ? 'unset' : budgetPercent >= 100 ? 'over' : budgetPercent >= 80 ? 'warning' : 'healthy',
      remaining: budget > 0 ? budget - totalMonthly : null
    };
  }
};
