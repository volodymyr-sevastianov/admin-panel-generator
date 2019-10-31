import Admin from "./admin";
import PostgresDBParser from "./parsers/pg-parser";
import repositories from "./repositories";
import { generateConfig } from "./helpers/config-writer";
import Knex from "knex";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const knexFilePath = path.resolve(process.cwd(), process.env.KNEX_FILE_PATH);

const knexConfig = require(knexFilePath);

const knex = Knex(knexConfig);

const schema = process.env.DB_SCHEMA_NAME;

function initializeApp() {
  const repository = repositories.makeUniversalRepostitory({ knex });

  const admin = new Admin({ repository });
  return admin;
}

async function generate() {
  const knex = Knex(knexConfig);
  const metaDataRepository = repositories.makeMetaDataRepository({ knex });
  const pgParser = new PostgresDBParser({
    schema,
    repository: metaDataRepository
  });
  console.log(process.env.CONFIG_FOLDER_PATH);

  await generateConfig({
    pgParser,
    pathToConfigDirectory: process.env.CONFIG_FOLDER_PATH
  });
}

export { generate, initializeApp };
