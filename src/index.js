import Admin from "./admin";
import PostgresDBParser from "./parsers/pg-parser";
import fs from "fs";
import util from "util";
import * as constants from "./constants";
import repositories from "./repositories";
import { generateConfig } from "./helpers/config-writer";

const readFileAsync = util.promisify(fs.readFile);

function initializeApp({ knex, schema }) {
  const repository = repositories.makeUniversalRepostitory({ knex });
  const metaDataRepository = repositories.makeMetaDataRepository({ knex });
  const pgParser = new PostgresDBParser({
    schema,
    repository: metaDataRepository
  });
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
