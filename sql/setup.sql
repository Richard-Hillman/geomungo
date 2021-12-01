DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS npcs CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS game_instances CASCADE;
DROP TABLE IF EXISTS game_users CASCADE;
DROP TABLE IF EXISTS game_events CASCADE;
DROP TABLE IF EXISTS game_items CASCADE;
DROP TABLE IF EXISTS game_npcs;

CREATE TABLE users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);

CREATE TABLE rooms (
    room_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL, 
    description TEXT NOT NULL,
    img TEXT,
    north TEXT NOT NULL, 
    east TEXT NOT NULL,
    south TEXT NOT NULL,
    west TEXT NOT NULL
);

CREATE TABLE events (
    event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_name TEXT NOT NULL,
    description TEXT NOT NULL,
    room_id BIGINT REFERENCES rooms(room_id)
);

CREATE TABLE items (
    item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    actions TEXT[],
    effect TEXT NOT NULL,
    room_id BIGINT REFERENCES rooms(room_id)
);

CREATE TABLE npcs (
    npc_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL, 
    description TEXT NOT NULL,
    dialogue TEXT NOT NULL,
    actions TEXT[] NOT NULL,
    base_atk INTEGER NOT NULL,
    base_hack INTEGER NOT NULL,
    room_id BIGINT REFERENCES rooms(room_id)
);

CREATE TABLE game_instances (
    game_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    game_completed BOOLEAN NOT NULL,
    game_over BOOLEAN NOT NULL
);

CREATE TABLE game_users (
    game_id BIGINT REFERENCES game_instances(game_id),
    game_user_id BIGINT REFERENCES users(user_id),
    socket_uuid TEXT NOT NULL,
    current_location TEXT NOT NULL,
    hp INTEGER NOT NULL,
    base_atk INTEGER NOT NULL,
    inventory TEXT[],
    base_hack INTEGER NOT NULL
);

CREATE TABLE game_events (
    event_id BIGINT REFERENCES events(event_id),
    game_id BIGINT REFERENCES game_instances(game_id),
    room_id BIGINT REFERENCES rooms(room_id)
);

CREATE TABLE game_items (
    item_id BIGINT REFERENCES items(item_id),
    game_id BIGINT REFERENCES game_instances(game_id),
    room_id BIGINT REFERENCES rooms(room_id),
    actions TEXT ARRAY,
    effect TEXT
);

CREATE TABLE game_npcs (
    npc_id BIGINT REFERENCES npcs(npc_id),
    game_id BIGINT REFERENCES game_instances(game_id),
    room_id BIGINT REFERENCES rooms(room_id),
    hp INTEGER NOT NULL,
    dialogue TEXT,
    dialogue_exhausted BOOLEAN NOT NULL,
    actions TEXT[],
    alive BOOLEAN NOT NULL
);