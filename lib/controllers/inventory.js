const { Router } = require("express");
const Inventory = require("../models/Inventory");
const ensureAuth = require("../middleware/ensure-auth");

module.exports = Router()
  .post("/view", ensureAuth, (req, res, next) => {
    return Inventory.viewInventory(req.body.gameId, req.user.userId)
      .then((data) => res.send(data))
      .catch(next);
  })

  .post("/", ensureAuth, (req, res, next) => {
    Inventory.addToInventory(
      req.body.gameId,
      req.user.userId,
      req.body.itemName
    )
      .then((data) => res.send(data))
      .catch(next);
  })

  .delete("/", ensureAuth, (req, res, next) => {
    Inventory.removeFromInventory(
      req.body.gameId,
      req.user.userId,
      req.body.itemName
    )
      .then((data) => res.send(data))
      .catch(next);
  });

// option to use
