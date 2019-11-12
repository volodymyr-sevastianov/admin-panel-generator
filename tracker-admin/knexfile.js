const dotenv = require("dotenv");

module.exports = (function() {
  dotenv.config();
  return {
    client: "pg",
    connection: process.env.DB_CONNECTION_STRING,
    seeds: {
      directory: process.env.DB_SEEDS_DIRECTORY
    },
    migrations: {
      directory: process.env.DB_MIGRATIONS_DIRECTORY
    },
    debug: false
  };
})();
