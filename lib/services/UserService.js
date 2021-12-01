const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


module.exports = class UserService {

  static async create({ username, password }) {
    const passwordHash = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS));
    const user = await User.insert({ username, passwordHash });
    return user;
  }

  // ------------------------------------------------

  static async authorize({ username, password }) {
    try {
      const user = await User.findByUserName(username);
      const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
      if(!passwordsMatch) throw new Error('Invalid Password');
      return user;
    } catch(err) {
      err.status = 401;
      throw err;
    }
  }

  // ------------------------------------------------
  static authToken(user) {
    return jwt.sign({ user: user.toJSON() }, process.env.APP_SECRET, {
      expiresIn: '24h'
    });
  }

  // ------------------------------------------------
  
  static verifyAuthToken(token) {
    const { user } = jwt.verify(token, process.env.APP_SECRET);
    return user;
  }

};

