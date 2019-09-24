import Admin from "./admin";
import PostgresDBParser from "./parsers/pg-parser";
import fs from "fs";
import util from "util";
import * as constants from "./constants";
import makeRepository from "./repository";
import { generateConfig } from "./helpers/config-generator";

const readFileAsync = util.promisify(fs.readFile);

function initializeApp({ knex, schema }) {
  const repository = makeRepository({ knex });
  const pgParser = new PostgresDBParser(knex, schema);
  // generateConfig({
  //   pgParser,
  //   pathToConfigDirectory: constants.CONFIG_FOLDER_PATH
  // });

  const admin = new Admin({ repository });

  return admin;
}

async function readFile(filename) {
  return JSON.parse(await readFileAsync(filename, "utf8"));
}

export default initializeApp;
