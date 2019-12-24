import express from "express";
import Knex from "knex";
import config from "./knexfile";
import admin from "./companies-admin";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const knex = Knex(config);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  next();
});
app.use(express.json());
app.use("/api/management", admin.getRoutes());
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send(err.message);
});

app.listen(3001, () => {
  console.log("App listen on 3001 port.");
});

export { knex };
