import Admin from "./admin";
import PostgresDBParser from "./parsers/pg-parser";
import repositories from "./repositories";
import { generateConfig, resolveConfigsFolder } from "./helpers/config-writer";
import Knex from "knex";
import dotenv from "dotenv";
import Path from "path";

dotenv.config();

const knexFileName = process.env.KNEX_FILE_CONVENTION_NAME;

const schema = process.env.DB_SCHEMA_NAME;

// TODO: Find a way to deal with configs folder path, knexfile folder path and "DB configuration folder path"

function initializeApp({ path }) {
  const knexFilePath = Path.resolve(process.cwd(), path, knexFileName);
  const knexConfig = require(knexFilePath);
  const knex = Knex(knexConfig);

  const configFolderPath = resolveConfigsFolder({ path });
  const repository = repositories.makeUniversalRepostitory({ knex });
  const admin = new Admin({ repository, configFolderPath });
  return admin;
}

async function generate({ path }) {
  const absolutePath = Path.resolve(process.cwd(), path);

  const knexFilePath = Path.resolve(absolutePath, knexFileName);
  const knexConfig = require(knexFilePath);
  const knex = Knex(knexConfig);

  const metaDataRepository = repositories.makeMetaDataRepository({ knex });
  const pgParser = new PostgresDBParser({
    schema,
    repository: metaDataRepository
  });
  const pathToConfigDirectory = resolveConfigsFolder({ path: absolutePath });

  await generateConfig({
    pgParser,
    pathToConfigDirectory
  });
}

export { generate, initializeApp };
