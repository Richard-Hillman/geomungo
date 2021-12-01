const pool = require("../connection/pool");
const _ = require("lodash");
const Inventory = require("./Inventory");
const roll = require("../utils/dice-roll");

module.exports = {
  async createUserActions(gameId) {
    const { rows } = await pool.query(
      `
      SELECT DISTINCT
        game_items.actions AS items,
        game_npcs.actions AS npcs
      FROM game_items
      JOIN
        game_npcs
      ON game_items.room_id = game_npcs.room_id
      WHERE game_items.game_id = $1
      AND game_items.room_id = 1
      `,
      [gameId]
    );

    const npcs = _.uniq(_.flatten(_.map(rows, "npcs")));
    const items = _.uniq(_.flatten(_.map(rows, "items")));
    return _.uniq(_.concat(["inventory"], npcs, items));
  },

  //--------------------------------------------------//

  async createActionTargets(action, gameId) {
    if (action === "inventory") {
      return Inventory.viewInventory(gameId, 1);
    } else if (action === "pick up") {
      const { rows: pickup } = await pool.query(
        `
        SELECT 
          ARRAY_AGG(items.name) AS items
        FROM 
          items
        JOIN 
          game_items
          ON items.item_id = game_items.item_id
        JOIN
          rooms
          ON game_items.room_id = rooms.room_id
        WHERE game_items.game_id = $1
        AND rooms.room_id = 1
        AND game_items.actions && '{${action}}'::text[]
        `,
        [gameId]
      );

      return pickup[0].items;
    } else if (action === "use") {
      const { rows: use } = await pool.query(
        `
        SELECT 
          ARRAY_AGG(items.name) AS items
        FROM 
          items
        JOIN 
          game_items
          ON items.item_id = game_items.item_id
        JOIN
          rooms
          ON game_items.room_id = rooms.room_id
        WHERE game_items.game_id = $1
        AND rooms.room_id = 1
        AND game_items.actions && '{${action}}'::text[]
        `,
        [gameId]
      );

      return use[0].items;
    } else if (action === "investigate") {
      const { rows: investigate } = await pool.query(
        `
        SELECT DISTINCT
          ARRAY(SELECT DISTINCT npcs.name
          FROM 
            game_npcs
          JOIN 
            npcs
            ON game_npcs.npc_id = npcs.npc_id) npcs
        FROM 
          game_items
        JOIN 
          game_npcs
          ON game_items.game_id = game_npcs.game_id
        WHERE game_items.game_id = $1
        AND game_items.room_id = 1
        AND game_npcs.actions && '{${action}}'::text[]
        UNION
        SELECT DISTINCT
          ARRAY(SELECT DISTINCT items.name
          FROM 
          items
          JOIN
          game_items
          ON items.item_id = game_items.item_id) items
        FROM 
          game_items
        JOIN 
          game_npcs
          ON game_items.game_id = game_npcs.game_id
        WHERE game_items.game_id = $1
        AND game_items.room_id = 1
        AND game_items.actions && '{${action}}'::text[]
        `,
        [gameId]
      );

      return _.concat(investigate[0].npcs, investigate[1].npcs);
    } else if (action === "movement") {
      const { rows: movement } = await pool.query(
        `
        SELECT DISTINCT
          ARRAY(SELECT 
              rooms.name
            FROM rooms
            WHERE north!='null'
            UNION
            SELECT 
              rooms.name
            FROM rooms
            WHERE east!='null'
            UNION
            SELECT 
              rooms.name
            FROM rooms
            WHERE south!='null'
            UNION
            SELECT 
              rooms.name
            FROM rooms
            WHERE west!='null'
            ) rooms
        FROM rooms
        JOIN 
          game_users
          ON game_users.current_location = rooms.name
        WHERE rooms.room_id = 1
        AND 
          game_users.game_id = $1
        `,
        [gameId]
      );

      return movement[0].rooms;
    } else if (action === "attack") {
      const { rows: attack } = await pool.query(
        `
        SELECT 
          ARRAY_AGG(npcs.name) AS npcs
        FROM 
          npcs
        JOIN 
          rooms
          ON npcs.room_id = rooms.room_id
        JOIN 
          game_npcs
          ON npcs.npc_id = game_npcs.npc_id
        WHERE game_npcs.game_id = $1
        AND rooms.room_id = 1
        AND npcs.actions && '{${action}}'::text[]
        `,
        [gameId]
      );

      return attack[0].npcs;
    } else if (action === "hack") {
      const { rows: hack } = await pool.query(
        `
        SELECT 
          ARRAY_AGG(npcs.name) AS npcs
        FROM 
          npcs
        JOIN 
          rooms
          ON npcs.room_id = rooms.room_id
        JOIN 
          game_users
          ON rooms.name = game_users.current_location
        WHERE game_users.game_id = $1
        AND rooms.room_id = 1
        AND actions && '{${action}}'::text[]
        `,
        [gameId]
      );

      return hack[0].npcs;
    }
  },

  //--------------------------------------------------//

  async performAction(action, target, gameId, userId) {
    if (action === "pick up") {
      // get the target's item_id
      const { rows: item } = await pool.query(
        `
          SELECT 
            items.item_id,
            items.room_id
          FROM 
            items
          JOIN
            game_items
            ON game_items.item_id = items.item_id
          WHERE items.name = $1 
          AND game_items.game_id = $2
          AND game_items.room_id = 1
          `,
        [target, gameId]
      );

      // remove ${action} from game_items.actions
      await pool.query(
        `
          UPDATE
            game_items
          SET 
            actions = ARRAY_REMOVE(actions, $1)
          WHERE game_id = $2
          AND room_id = 1
          AND item_id = $3
          RETURNING *
          `,
        [action, gameId, item[0].item_id]
      );

      // add item to inventory
      Inventory.addToInventory(gameId, userId, target);

      return { item: `${target} added to inventory` };
    } else if (action === "investigate") {
      // return items.description by items.name = target
      // investigate is an action that can be repeated
      const { rows: investigate } = await pool.query(
        `
        SELECT
          items.description
        FROM
          items
        JOIN
          game_items
          ON items.item_id = game_items.item_id
        WHERE items.name = $1
        AND game_items.game_id = $2
        AND game_items.room_id = 1
        UNION 
        SELECT
          npcs.description
        FROM
          npcs
        JOIN
          game_npcs
          ON npcs.npc_id = game_npcs.npc_id
        WHERE npcs.name = $1
        AND game_npcs.game_id = $2
        AND game_npcs.room_id = 1
      
        `,
        [target, gameId]
      );

      return investigate[0];
    } else if (action === "movement") {
      const { rows: movement } = await pool.query(
        `
        UPDATE game_users
        SET current_location = $1
        WHERE game_users.game_id = $2
        AND game_users.game_user_id = $3
        RETURNING current_location
        `,
        [target, gameId, userId]
      );

      return movement[0];
    } else if (action === "attack") {
      // Get the player's base_atk
      let { rows: playerAttack } = await pool.query(
        `
      SELECT 
        base_atk
      FROM 
        game_users
      WHERE game_users.game_user_id = $1
      AND game_users.game_id = $2
      `,
        [userId, gameId]
      );

      // Player's base_atk becomes the number of d6 rolled
      playerAttack = roll([[playerAttack[0].base_atk, 6]]);

      // Get the target's npc_id, so we can search on this id in subsequent queries
      let { rows: npcId } = await pool.query(
        `
        SELECT 
          game_npcs.npc_id
        FROM 
          game_npcs
        JOIN
          npcs
          ON npcs.npc_id = game_npcs.npc_id
        WHERE game_npcs.game_id = $1
        AND npcs.name = $2
        `,
        [gameId, target]
      );

      npcId = npcId[0].npc_id;

      // The target's HP is decremented by the total of the roll
      let { rows: npcHP } = await pool.query(
        `
        UPDATE game_npcs
        SET hp=hp - $1
        WHERE game_npcs.game_id = $2
        AND game_npcs.npc_id = $3
        RETURNING hp
        `,
        [playerAttack, gameId, npcId]
      );

      npcHP = npcHP[0].hp;

      // Check if the npc's HP is 0 or above, exclusive
      // If true, they immediately attack back using the same dice rolling logic
      if (npcHP > 0) {
        // Get the npc's base_atk
        let { rows: npcAttack } = await pool.query(
          `
          SELECT 
            base_atk
          FROM 
            npcs
          JOIN
            game_npcs 
            ON npcs.npc_id = game_npcs.npc_id
          WHERE game_npcs.npc_id = $1
          AND game_npcs.game_id = $2
          `,
          [npcId, gameId]
        );

        npcAttack = roll([[npcAttack[0].base_atk, 6]]);

        // Decrement and return the player's HP
        let { rows: playerHP } = await pool.query(
          `
          UPDATE game_users
          SET hp=hp - $1
          WHERE game_users.game_id = $2
          AND game_users.game_user_id = $3
          RETURNING hp AS player_hp
          `,
          [npcAttack, gameId, userId]
        );

        playerHP = playerHP[0].hp;

        // If a player's HP is ever 0 or below, the game is over
        if (playerHP <= 0) {
          const { rows: gameOver } = await pool.query(
            `
            UPDATE game_instances
            SET game_over=TRUE
            WHERE game_instances.game_id = $1
            RETURNING game_over
            `,
            [gameId]
          );

          return gameOver[0];
        } else if (playerHP > 0) {
          return playerHP;
        }

        // Otherwise, the NPC succumbed to the attack
      } else if (npcHP <= 0) {
        // Update the game_npc's status and notify the player
        const { rows: status } = await pool.query(
          `
          UPDATE game_npcs
          SET alive=FALSE
          WHERE game_npcs.npc_id = $1
          AND game_npcs.game_id = $2
          RETURNING alive AS npc_alive
          `,
          [npcId, gameId]
        );

        // The npc is removed from the game_npcs table, as it can no longer be interacted with
        await pool.query(
          `
          DELETE FROM game_npcs
          WHERE npc_id = $1
          AND game_id = $2
          RETURNING *
          `,
          [npcId, gameId]
        );

        return status[0];
      }

      return { npc_hp: npcHP };
    } else if (action === "hack") {
      // Lots of the same logic as "attack", but using base_hack and without npc death conditions
      // Get the player's base_hack
      let { rows: playerHack } = await pool.query(
        `
        SELECT 
          base_hack
        FROM 
          game_users
        WHERE game_users.game_user_id = $1
        AND game_users.game_id = $2
        `,
        [userId, gameId]
      );

      // Perform a dice roll using the player's base_hack
      playerHack = roll([[playerHack[0].base_hack, 6]]);

      // Get the target's npc_id, so we can search on this id in subsequent queries
      let { rows: npcId } = await pool.query(
        `
        SELECT 
          game_npcs.npc_id
        FROM 
          game_npcs
        JOIN
          npcs
          ON npcs.npc_id = game_npcs.npc_id
        WHERE game_npcs.game_id = $1
        AND npcs.name = $2
        `,
        [gameId, target]
      );

      npcId = npcId[0].npc_id;

      // Grab the npc's hack threshold
      let { rows: npcHack } = await pool.query(
        `
        SELECT 
          base_hack
        FROM 
          npcs
        JOIN 
          game_npcs
          ON npcs.npc_id = game_npcs.npc_id
        WHERE game_npcs.npc_id = $1
        AND game_npcs.game_id = $2
        `,
        [npcId, gameId]
      );

      npcHack = npcHack[0].base_hack;

      // If the player's base_hack + roll exceeds the target's hack threshold, return a success
      if (playerHack >= npcHack) {
        // A successful hack essentially kills the NPC
        const { rows: status } = await pool.query(
          `
          UPDATE game_npcs
          SET alive=FALSE
          WHERE game_npcs.npc_id = $1
          AND game_npcs.game_id = $2
          RETURNING alive AS npc_alive
          `,
          [npcId, gameId]
        );

        // The npc is removed from the game_npcs table, as it can no longer be interacted with
        await pool.query(
          `
          DELETE FROM game_npcs
          WHERE npc_id = $1
          AND game_id = $2
          RETURNING *
          `,
          [npcId, gameId]
        );

        return status[0];
      } else {
        // If the player's attempted hack is unsuccessful, the target immediately attacks back
        let { rows: npcAttack } = await pool.query(
          `
          SELECT 
            base_atk
          FROM 
            npcs
          JOIN
            game_npcs 
            ON npcs.npc_id = game_npcs.npc_id
          WHERE game_npcs.npc_id = $1
          AND game_npcs.game_id = $2
          `,
          [npcId, gameId]
        );

        npcAttack = roll([[npcAttack[0].base_atk, 6]]);

        // Decrement and return the player's HP
        const { rows: playerHP } = await pool.query(
          `
          UPDATE game_users
          SET hp=hp - $1
          WHERE game_users.game_id = $2
          AND game_users.game_user_id = $3
          RETURNING hp AS player_hp
          `,
          [npcAttack, gameId, userId]
        );

        return playerHP[0];
      }
    } else if (action === "use") {
      // Using an item triggers returns its effect
      const { rows: effect } = await pool.query(
        `
        SELECT
          items.effect,
          items.item_id
        FROM
          items
        JOIN
          game_items
          ON items.item_id = game_items.item_id
        WHERE items.name = $1
        AND game_items.game_id = $2
        AND game_items.room_id = 1
        `,
        [target, gameId]
      );

      // And removes it from game_items (assuming single use)
      await pool.query(
        `
        DELETE FROM game_items
        WHERE game_id = $1
        AND item_id = $2
        `,
        [gameId, effect[0].item_id]
      );

      // Ensure the item is removed from the player's inventory
      Inventory.removeFromInventory(gameId, userId, target);

      // Return the item's effect
      return effect[0];
    }
  },
};
