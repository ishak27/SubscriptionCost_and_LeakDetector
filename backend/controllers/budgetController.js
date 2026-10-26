const Budget = require('../models/Budget');

exports.get = async (req, res, next) => {
  try { const budget = await Budget.findOne({ user: req.user._id }); res.json({ budget }); }
  catch (error) { next(error); }
};
exports.save = async (req, res, next) => {
  try {
    const monthlyBudget = Number(req.body.monthlyBudget);
    const currency = req.body.currency || 'INR';
    if (!Number.isFinite(monthlyBudget) || monthlyBudget <= 0) return res.status(400).json({ message: 'Monthly budget must be greater than zero.' });
    if (!['INR', 'USD', 'EUR', 'GBP'].includes(currency)) return res.status(400).json({ message: 'Unsupported currency.' });
    const budget = await Budget.findOneAndUpdate({ user: req.user._id }, { monthlyBudget, currency, user: req.user._id }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
    res.json({ message: 'Budget saved.', budget });
  } catch (error) { next(error); }
};
