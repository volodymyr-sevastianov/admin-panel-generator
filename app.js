import express from "express";
import Knex from "knex";
import config from "./knexfile";
import admin from "./companies-admin";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const knex = Knex(config);

app.use(express.json());
app.use("/api/management", admin.getRoutes());

app.listen(3001, () => {
  console.log("App listen on 3000 port.");
});

export { knex };
