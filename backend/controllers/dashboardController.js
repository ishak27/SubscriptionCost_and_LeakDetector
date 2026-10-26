const Subscription = require('../models/Subscription');
function monthly(cost, cycle) { if (cycle === 'weekly') return cost * 52 / 12; if (cycle === 'yearly') return cost / 12; return cost; }
function annual(cost, cycle) { if (cycle === 'weekly') return cost * 52; if (cycle === 'yearly') return cost; return cost * 12; }

exports.getOverview = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id });
    const categoryTotals = {};
    const categoryCounts = {};
    let monthlySpending = 0;
    let annualSpending = 0;
    for (const sub of subscriptions) {
      const monthAmount = monthly(sub.cost, sub.billingCycle);
      monthlySpending += monthAmount;
      annualSpending += annual(sub.cost, sub.billingCycle);
      categoryTotals[sub.category] = (categoryTotals[sub.category] || 0) + monthAmount;
      categoryCounts[sub.category] = (categoryCounts[sub.category] || 0) + 1;
    }
    const overlappingCategories = Object.entries(categoryCounts).filter(([, count]) => count > 1).map(([category]) => category);
    res.json({ count: subscriptions.length, monthlySpending, annualSpending, categoryTotals, overlappingCategories });
  } catch (error) { next(error); }
};
