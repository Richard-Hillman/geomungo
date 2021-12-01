    -- // inventory needs...
    -- // at least one game_item (tied to game_instance, room_id)

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
-- create one event
INSERT INTO events (event_name, description, room_id)
VALUES ('break chair', 'you broke a chair', 1);
COMMIT;

BEGIN;
-- create one npc
INSERT INTO npcs (name, description, dialogue, actions, hp, room_id, base_hack)
VALUES  ('rird', 'rird desc', 'hello', '{one, two}', 3, 1, 1),
        ('dee', 'dee desc', 'hello', '{one, two}', 3, 1, 1);
COMMIT;

BEGIN;
-- create one item
INSERT INTO items (name, description, actions, effect, room_id)
VALUES  ('key', 'a key', '{hold, use}', 'side-effect', 1),
        ('dagger', 'a dagger', '{hold, stab}', 'side-effect', 1),
        ('torch', 'a torch', '{hold, investigate}', 'side-effect', 1);
COMMIT;

BEGIN;
UPDATE game_items
SET actions=(SELECT actions FROM items
        WHERE game_items.item_id = items.item_id
        AND game_items.game_id = 1);
COMMIT;

BEGIN;
UPDATE game_items
SET effect=(SELECT effect FROM items
        WHERE game_items.item_id = items.item_id
        AND game_items.game_id = 1);
COMMIT;


BEGIN;
-- ensure that the item belongs to to the correct room by room_id
UPDATE items
SET (room_id) = (SELECT room_id FROM rooms
WHERE rooms.name = 'entrance-hall');
COMMIT;
