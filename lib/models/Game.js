const pool = require("../connection/pool");

module.exports = {
  async newGame(userId) {
    // Creating a client ensures that all postgres queries are fed through the same pipeline
    const client = await pool.connect();

    try {
      // newGame first creates a new game_instance, then uses that new game_id to create all other game items at their desired initial state
      let { rows: newGameId } = await client.query(
        `
            INSERT INTO game_instances (game_completed, game_over)
            VALUES (false, false)
            RETURNING game_id
          `
      );

      newGameId = newGameId[0].game_id;

      // Create a new game_users instance, specifying the game_id
      await client.query(
        `
          INSERT INTO game_users (
              game_id,
              game_user_id, 
              socket_uuid, 
              current_location, 
              hp, 
              base_atk,
              base_hack,
              inventory)
          VALUES  ($1, $2, 1, 'entrance-hall', 20, 5, 5, '{}')
        `,
        [newGameId, userId]
      );

      // Grab the room_id for the game_user's starting location
      let { rows: roomId } = await client.query(
        `
          SELECT 
            room_id 
          FROM
            rooms
          JOIN 
            game_users
          ON 
            game_users.current_location = rooms.name
          WHERE
            game_users.game_user_id = $1
          AND
            game_users.game_id = $2
          `,
        [userId, newGameId]
      );

      roomId = roomId[0].room_id;

      // Populate all game_items, constrained by game_id and room_id; VALUES repeated for as many items as there exist in the game
      await client.query(
        `
          INSERT INTO game_items (
            item_id, 
            game_id, 
            room_id,
            actions,
            effect)
          VALUES  (1, $1, $2, '{}', ''),
                  (2, $1, $2, '{}', ''),
                  (3, $1, $2, '{}', '')
          RETURNING *
        `,
        [newGameId, roomId]
      );

      // To allow game_items to copy the mutable action and effect properties from items, perform an UPDATE after the table has been created
      await client.query(
        `
        UPDATE game_items
        SET actions=(SELECT actions FROM items
              WHERE game_items.item_id = items.item_id
              AND game_items.game_id = $1)
        RETURNING *
        `,
        [newGameId]
      );

      await client.query(
        `
        UPDATE game_items
        SET effect=(SELECT effect FROM items
              WHERE game_items.item_id = items.item_id
              AND game_items.game_id = $1)
        RETURNING *
        `,
        [newGameId]
      );

      // Populate all game_events, constrained by game_id and room_id; VALUES repeated for as many events as there exist in the game
      await client.query(
        `
          INSERT INTO game_events (
            event_id, 
            game_id, 
            room_id)
          VALUES (1, $1, $2)
          RETURNING *
          `,
        [newGameId, roomId]
      );

      // Populate all game_events, constrained by game_id and room_id; VALUES repeated for as many events as there exist in the game
      // Return the game_id to the user, so that this unique identifier can be manually shared among players
      const { rows } = await client.query(
        `
          INSERT INTO game_npcs (
            npc_id, 
            game_id, 
            room_id, 
            hp,
            dialogue,
            actions,
            dialogue_exhausted, 
            alive)
          VALUES  (1, $1, $2, 45, '', '{}', false, true),
                  (2, $1, $2, 25, '', '{}', false, true)
          RETURNING game_id, room_id
          `,
        [newGameId, roomId]
      );

      // To allow game_npcs to copy the mutable dialogue and description properties from items, perform an UPDATE after the table has been created
      await client.query(
        `
        UPDATE game_npcs
        SET dialogue=(SELECT dialogue FROM npcs
              WHERE game_npcs.npc_id = npcs.npc_id
              AND game_npcs.game_id = $1)
        RETURNING *
        `,
        [newGameId]
      );

      await client.query(
        `
        UPDATE game_npcs
        SET actions=(SELECT actions FROM npcs
              WHERE game_npcs.npc_id = npcs.npc_id
              AND game_npcs.game_id = $1)
        RETURNING *
        `,
        [newGameId]
      );

      return rows[0];
    } catch (err) {
      throw new Error(err);
    } finally {
      client.release();
    }
  },

  // joinGame creates a new game_users instance, constrained by an existing game's game_id
  async joinGame(gameId, userId) {
    const { rows } = await pool.query(
      `
      INSERT INTO game_users (
        game_id, 
        game_user_id, 
        socket_uuid, 
        current_location, 
        hp, 
        base_atk, 
        base_hack,
        inventory)
      VALUES  ($1, $2, 1, 'entrance-hall', 20, 5, 5, '{}')
      RETURNING game_id
    `,
      [gameId, userId]
    );

    return rows[0];
  },
};
