## Known bugs:

---
### UserActions.js
---

#### createUserActions:

* room_id is hard-coded

#### createActionTargets

* room_id is hard-coded
* *calling viewInventory from createActionTargets requires the userId to be 1*
* the player's HP is only checked within the attack block: this is logic the front-end will need to check for to determine an end game condition

#### performAction

* room_id is hard-coded
* using an item assumes that it is discarded
* a successful attack or hack against an npc assumes that it is deactivated/killed
* you can add the same item to your inventory multiple times if you hit the same route multiple times; front-end logic could help prevent this, otherwise the query should be updated to remove this action

---
### Inventory.js
---

#### addToInventory:

* allows a user to add any item to their inventory irrespective of if it's a valid game item or not

---
### Game.js
---

#### newGame:

* requires that the database is seeded before execution: it requires at least one user, one item, one event, and one npc


#### joinGame:

* if the existing game's party has moved beyond the starting location, a new user either shouldn't be able to join, or should join at the party's current location
* Error handling: catch cases in which a player requests a game_id that is invalid