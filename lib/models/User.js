const pool = require("../connection/pool");

module.exports = class User {
  userId;
  username;
  passwordHash;

  constructor(row) {
    this.userId = row.user_id;
    this.username = row.username;
    this.passwordHash = row.password_hash;
  }

  // -----------------------------------------

  static async insert({ username, passwordHash }) {
    const { rows } = await pool.query(
      `
      INSERT INTO users (username, password_hash)
      VALUES ($1, $2)
      RETURNING *
      `,
      [username, passwordHash]
    );
    return new User(rows[0]);
  }
  // -----------------------------------------

  static async findByUserName(username) {
    const { rows } = await pool.query("SELECT * FROM users WHERE username=$1", [
      username,
    ]);

    if (!rows[0]) throw new Error(`No user with ${username} found`);
    return new User(rows[0]);
  }

  toJSON() {
    const json = { ...this };
    delete json.passwordHash;
    return json;
  }
};
