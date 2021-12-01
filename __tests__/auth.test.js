const fs = require("fs");
const pool = require("../lib/connection/pool");
const request = require("supertest");
const app = require("../lib/app");
const UserService = require("../lib/services/UserService");

describe("test auth routes", () => {
  beforeEach(() => {
    return pool.query(fs.readFileSync("./sql/setup.sql", "utf-8"));
  });

  afterAll(() => {
    return pool.query.end();
  });

  // ------------------------------------------------

  it("allow the user to sign up for the game via POST", async () => {
    return request(app)
      .post("/api/v1/auth/signup")
      .send({ username: "test1", password: "test1" })
      .then((res) => {
        expect(res.body).toEqual({
          userId: expect.any(String),
          username: "test1",
        });
      });
  });

  // ------------------------------------------------

  it("login via /auth", async () => {
    const user = await UserService.create({
      username: "user@test.com",
      password: "password",
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "user@test.com", password: "password" });

    expect(res.body).toEqual({
      userId: expect.any(String),
      username: "user@test.com",
    });
  });

  // ------------------------------------------------

  it("verify user via /auth", async () => {
    const agent = request.agent(app);
    const user = await UserService.create({
      username: "user@test.com",
      password: "password",
    });

    await agent
      .post("/api/v1/auth/login")
      .send({ username: "user@test.com", password: "password" });

    const res = await agent.get("/api/v1/auth/verify");

    expect(res.body).toEqual({
      userId: user.userId,
      username: "user@test.com",
    });
  });
});
