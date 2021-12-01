const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({
  credentials:true,
  origin:true
}));

app.use(express.json());
app.use(require("cookie-parser")());

app.use("/api/v1/auth", require("./controllers/auth"));
app.use("/games", require("./controllers/games"));
app.use("/inventory", require("./controllers/inventory"));
app.use("/actions", require("./controllers/actions"));

app.use(require("./middleware/not-found"));
app.use(require("./middleware/error"));

module.exports = app;
