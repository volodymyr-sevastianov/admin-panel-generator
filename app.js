import express from "express";
import Knex from "knex";
import config from "./knexfile";
import { initializeApp } from "./lib";
import dotenv from "dotenv";
// import example from "./example";

dotenv.config();

const app = express();
const knex = Knex(config);

const admin = initializeApp();
// admin.register("cars");
// admin.register("makes");

app.use(express.json());
// app.use((req, res, next) => {
//   example();
//   next();
// });
app.use("/api/management", admin.getRoutes());

app.listen(3000, () => {
  console.log("App listen on 3000 port.");
});

export { knex };
