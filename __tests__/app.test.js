const request = require('supertest');
const { app, sequelize }  = require('../app'); // Assuming your app file is in the parent directory
let server;


beforeAll(async () => {
    await sequelize.sync({ force: false }); // Ensure proper synchronization before starting the server

    server = await app.listen();
});

afterAll(async () => {
    await server.close();
});
describe('GET /api/sports', () => {
  test('It should respond with a list of sports', async () => {
    const response = await request(app).get('/api/sports');
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.length).toBeGreaterThan(0); // Assuming at least one sport is returned
  });
});
