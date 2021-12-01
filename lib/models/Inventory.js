const pool = require("../connection/pool");

// This module controls item-based actions, especially within a player's inventory
module.exports = {
  // viewInventory allows a user to see what is in their inventory
  async viewInventory(gameId, gameUserId) {
    const { rows } = await pool.query(
      `
      SELECT 
          inventory
      FROM 
          game_users
      WHERE 
          game_users.game_user_id = $1
      AND 
          game_users.game_id = $2
    `,
      [gameUserId, gameId]
    );

    return rows[0];
  },

  // addToInventory allows a user to add an item to their inventory, then returns their updated inventory
  async addToInventory(gameId, gameUserId, itemName) {
    const client = await pool.connect();

    try {
      await client.query(
        `
      UPDATE 
          game_users
      SET 
          inventory = inventory || '{ ${itemName} }'
      WHERE game_users.game_user_id = $1
      AND game_users.game_id = $2
      `,
        [gameUserId, gameId]
      );

      // Return the user's inventory
      const { rows } = await client.query(
        `
      SELECT 
          inventory 
      FROM 
          game_users
      WHERE game_users.game_user_id = $1
      AND game_users.game_id = $2
      `,
        [gameUserId, gameId]
      );

      return rows[0];
    } catch (err) {
      throw new Error(err);
    } finally {
      client.release();
    }
  },

  // removeFromInventory removes an item from a player's inventory and returns the user's inventory
  async removeFromInventory(gameId, gameUserId, itemName) {
    await pool.query(
      `
      UPDATE 
        game_users
      SET 
        inventory = ARRAY_REMOVE(inventory, $1)
      WHERE game_users.game_user_id = $2
      AND game_users.game_id = $3
      `,
      [itemName, gameUserId, gameId]
    );

    const { rows } = await pool.query(
      `
      SELECT
          inventory
      FROM
          game_users
      WHERE game_users.game_user_id = $1
      AND game_users.game_id = $2
      `,
      [gameUserId, gameId]
    );

    return rows[0];
  },
};
