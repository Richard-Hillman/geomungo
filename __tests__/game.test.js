const fs = require("fs");
const pool = require("../lib/connection/pool");
const request = require("supertest");
const app = require("../lib/app");
const UserService = require("../lib/services/UserService");

describe("test game routes", () => {
  let user;
  let agent = request.agent(app);

  beforeEach(async () => {
    await pool.query(fs.readFileSync("./sql/setup.sql", "utf-8"));
    await pool.query(fs.readFileSync("./sql/seed.sql", "utf-8"));
    user = await UserService.create({username:'username', password: 'password'});
    
   await agent 
  .post('/api/v1/auth/login')
  .send({username:'username', password: 'password'});
  });

  afterAll(() => {
    return pool.query.end();
  });

  it("allows a user to create a new game", async () => {
    return agent 
    .get('/games/new/')
    .send({
      userId: user.userId
    })
    
    .then(res => {
      expect(res.body).toEqual({game_id: '1', room_id: '1'})
    })
  });
});
