const { Router } = require("express");
const ensureAuth = require("../middleware/ensure-auth");
const Game = require("../models/Game");

module.exports = Router().get("/new/", ensureAuth, (req, res, next) => {
  Game.newGame(req.user.userId)
    .then((data) => res.send(data))
    .catch(next);
});
