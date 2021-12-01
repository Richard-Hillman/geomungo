const fs = require("fs");
const pool = require("../lib/connection/pool");
const request = require("supertest");
const app = require("../lib/app");
const UserService = require("../lib/services/UserService");

describe("test inventory routes", () => {
  let user;
  let agent = request.agent(app);

  beforeEach(async () => {
    await pool.query(fs.readFileSync("./sql/setup.sql", "utf-8"));
    await pool.query(fs.readFileSync("./sql/seed.sql", "utf-8"));
    user = await UserService.create({username:'username', password: 'password'});
    
   await agent 
  .post('/api/v1/auth/login')
  .send({username:'username', password: 'password'});
  
  await agent 
  .get('/games/new/')
  });

  afterAll(() => {
    return pool.query.end();
  });

  it("allows a user to add an item to their inventory", async () => {
    return agent 
    .post('/inventory')
    .send({
      gameId: 1,
      userId: user.userId,
      itemName: "key"
    })
    .then(res => {
      expect(res.body).toEqual({inventory: ["key"]})
    })
  });

  it("allows a user to view their inventory via GET", async () => {
    return agent 
    .post('/inventory/view')
    .send({
      gameId: 1,
      userId: user.userId
    })
    .then(res => {
      expect(res.body).toEqual({inventory: []})
    })
  });

  it("allows a user to remove an item from their inventory", async () => {
    return agent 
    .delete('/inventory')
    .send({
      gameId: 1,
      userId: user.userId
    })
    .then(res => {
      expect(res.body).toEqual({inventory: []})
    })
  });
});
