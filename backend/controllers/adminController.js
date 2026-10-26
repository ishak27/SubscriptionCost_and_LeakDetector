const bcrypt = require('bcrypt');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Budget = require('../models/Budget');
function monthly(cost, cycle) { if (cycle === 'weekly') return cost * 52 / 12; if (cycle === 'yearly') return cost / 12; return cost; }
function annual(cost, cycle) { if (cycle === 'weekly') return cost * 52; if (cycle === 'yearly') return cost; return cost * 12; }

exports.overview = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' }).select('name email role createdAt');
    const summaries = [];
    for (const user of users) {
      const subs = await Subscription.find({ user: user._id });
      const grouped = {};
      let monthlySpend = 0;
      let annualSpend = 0;
      for (const sub of subs) {
        monthlySpend += monthly(sub.cost, sub.billingCycle);
        annualSpend += annual(sub.cost, sub.billingCycle);
        (grouped[sub.category] ||= []).push(sub);
      }
      let leakMonthly = 0;
      for (const list of Object.values(grouped)) {
        if (list.length > 1) {
          list.sort((a, b) => monthly(a.cost, a.billingCycle) - monthly(b.cost, b.billingCycle));
          leakMonthly += list.slice(1).reduce((sum, sub) => sum + monthly(sub.cost, sub.billingCycle), 0);
        }
      }
      summaries.push({
        id: user.id, name: user.name, email: user.email, role: user.role,
        subs: subs.map((sub) => ({ id: sub.id, name: sub.name, category: sub.category, cost: sub.cost, billingCycle: sub.billingCycle, renewalDate: sub.renewalDate, paymentMethod: sub.paymentMethod, cardLast4: sub.cardLast4 })),
        monthly: monthlySpend, annual: annualSpend, leakMonthly, leakAnnual: leakMonthly * 12, categoryTotals: grouped
      });
    }
    const allSubs = await Subscription.find().populate('user', 'name email');
    const totalMonthly = allSubs.reduce((sum, sub) => sum + monthly(sub.cost, sub.billingCycle), 0);
    const totalLeakAnnual = summaries.reduce((sum, user) => sum + user.leakAnnual, 0);
    res.json({ summaries, stats: { users: users.length, subscriptions: allSubs.length, monthlySpending: totalMonthly, annualLeak: totalLeakAnnual } });
  } catch (error) { next(error); }
};
exports.createUser = async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
      return res.status(400).json({ message: 'Enter a name, valid email, and password with at least 6 characters.' });
    }
    if (await User.findOne({ email })) return res.status(409).json({ message: 'An account with that email already exists.' });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10), role: 'user' });
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { next(error); }
};
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'user' });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    await Promise.all([Subscription.deleteMany({ user: user._id }), Budget.deleteOne({ user: user._id }), user.deleteOne()]);
    res.json({ message: 'User and their project data deleted.' });
  } catch (error) { next(error); }
};
