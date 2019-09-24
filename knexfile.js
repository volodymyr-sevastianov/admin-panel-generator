module.exports = {
  client: "pg",
  connection:
    "postgres://postgres:ololoshka378@localhost:5432/admin-panel-parser",
  seeds: {
    directory: "./seeds/"
  },
  migrations: {
    directory: "./migrations/"
  },
  debug: true
};
