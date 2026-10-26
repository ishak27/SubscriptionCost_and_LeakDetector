const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function makeToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
}
function publicUser(user) { return { id: user.id, name: user.name, email: user.email, role: user.role }; }

exports.register = async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
      return res.status(400).json({ message: 'Enter a name, valid email, and password with at least 6 characters.' });
    }
    if (await User.findOne({ email })) return res.status(409).json({ message: 'An account with that email already exists.' });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10), role: 'user' });
    return res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
};
exports.login = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const expectedRole = req.body.expectedRole === 'admin' ? 'admin' : 'user';
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Incorrect email or password.' });
    if (user.role !== expectedRole) return res.status(403).json({ message: expectedRole === 'admin' ? 'This account is not an administrator account.' : 'Administrators should use the Admin Login page.' });
    return res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
};
exports.me = (req, res) => res.json({ user: publicUser(req.user) });
