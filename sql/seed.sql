
-- BEGIN;
-- INSERT INTO users (username, password_hash)
-- VALUES  ('username', 'password');
-- COMMIT;

BEGIN;
INSERT INTO rooms (name, description, north, east, south, west)
VALUES  ('entrance-hall', 'the entrance hall', 'room-1', 'null', 'null', 'null'),
        ('room-1', 'the first room', 'null', 'null', 'entrance-hall', 'null' );
COMMIT;

BEGIN;
INSERT INTO events (event_name, description, room_id)
VALUES  ('null' , 'you broke a chair', 2);
COMMIT;

BEGIN;
INSERT INTO items (name, description, actions, effect, room_id)
VALUES  ('first-aid', 'You notice a first-aid package sitting on one of the tables in front of you', '{pick up, use, investigate}', 'side-effect', 1),
        ('grenade', 'You notice a crate of grenades to your left', '{pick up, use, investigate}', 'side-effect', 1),
        ('cash', 'In the back corner on a table you notice wads of cash', '{pick up, investigate}', 'side-effect', 1);
COMMIT;

BEGIN;

INSERT INTO npcs (name, description, dialogue, actions, base_atk, base_hack, room_id)
VALUES ('Dr. Chem', 'I am a Chemistry doctor', 'Hello, am doctor, dont stab with high heel pls', '{attack, hack, investigate}', 5, 20, 1),
       ('Security Sentry', 'Wears rabbit hat', '!BANG!BANG!', '{attack, hack, investigate}', 5, 10, 1);
COMMIT;

