const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');

const validId = (id) => mongoose.Types.ObjectId.isValid(id);
function cleanInput(body) {
  return {
    name: body.name,
    category: body.category,
    cost: Number(body.cost),
    billingCycle: body.billingCycle,
    renewalDate: body.renewalDate,
    paymentMethod: body.paymentMethod || '',
    cardLast4: body.cardLast4 || ''
  };
}
exports.create = async (req, res, next) => {
  try {
    const subscription = await Subscription.create({ ...cleanInput(req.body), user: req.user._id });
    res.status(201).json({ message: 'Subscription created.', subscription });
  } catch (error) { next(error); }
};
exports.list = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ subscriptions });
  } catch (error) { next(error); }
};
exports.getOne = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid subscription ID.' });
    const subscription = await Subscription.findOne({ _id: req.params.id, user: req.user._id });
    if (!subscription) return res.status(404).json({ message: 'Subscription not found.' });
    res.json({ subscription });
  } catch (error) { next(error); }
};
exports.update = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid subscription ID.' });
    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, cleanInput(req.body),
      { new: true, runValidators: true }
    );
    if (!subscription) return res.status(404).json({ message: 'Subscription not found.' });
    res.json({ message: 'Subscription updated.', subscription });
  } catch (error) { next(error); }
};
exports.remove = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid subscription ID.' });
    const subscription = await Subscription.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!subscription) return res.status(404).json({ message: 'Subscription not found.' });
    res.json({ message: 'Subscription deleted.' });
  } catch (error) { next(error); }
};
