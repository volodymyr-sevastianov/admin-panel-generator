import path from "path";
import fs from "fs";

async function generateConfig({ pgParser, pathToConfigDirectory }) {
  let config = await pgParser.getDBConfig();
  let publicConfig = pgParser.getPublicConfig(config);
  delete config.tables;
  Object.keys(config).forEach(tableName => {
    let pathToConfig = path.resolve(pathToConfigDirectory, `${tableName}.json`);
    writeJSON(pathToConfig, JSON.stringify(publicConfig[tableName], null, 2));
  });
  writeJSON(
    path.resolve(pathToConfigDirectory, `global-config.json`),
    JSON.stringify(publicConfig, null, 2)
  );
}

async function writeJSON(path = "config.json", data) {
  fs.writeFile(path, data, err => {
    if (err) {
      throw err;
    }
    console.log("WRITTEN!");
  });
}

export { generateConfig };
