module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/backend/tests/**/*.test.js'],
  verbose: true,
  // lowdb ships ES modules; Jest needs to compile it when running under
  // Node.  By default node_modules are ignored, so we exclude lowdb here.
  transformIgnorePatterns: ['/node_modules/(?!(lowdb)/)'],
};
