BEGIN;
-- create one user
INSERT INTO users (username, password_hash)
VALUES ('username', 'password');
COMMIT;

BEGIN;
-- create one item
INSERT INTO rooms (name, description, north, east, south, west)
VALUES  ('entrance-hall', 'the entrance hall', 'room-1', 'null', 'null', 'null');
COMMIT;

BEGIN;
-- create one item
INSERT INTO items (name, description, actions, effect, room_id)
VALUES  ('key', 'a key', '{hold, use}', 'side-effect', 1);
COMMIT;

BEGIN;
-- create a new game instance
INSERT INTO game_instances (game_completed)
VALUES (false);
COMMIT;

BEGIN;
-- create a new game user
INSERT INTO game_users (game_id, game_user_id, socket_uuid, current_location, hp, base_atk, inventory, base_hack)
VALUES  (1, 1, 1, 'entrance-hall', 20, 3, '{}', 2);
COMMIT;

BEGIN;
-- create one game item
INSERT INTO game_items (item_id, game_id, room_id, actions, effect)
VALUES  (1, 1, 1, '{}', '');
COMMIT;