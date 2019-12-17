const dotenv = require("dotenv");

module.exports = (function() {
  dotenv.config();
  return {
    client: "pg",
    connection: "postgres://postgres:111@127.0.0.1:5432/tracker_db",
    debug: true
  };
})();
