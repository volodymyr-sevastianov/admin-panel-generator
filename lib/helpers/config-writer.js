import path from "path";
import fs from "fs";

async function generateConfig({ pgParser, pathToConfigDirectory }) {
  let config = await pgParser.getDBConfig();
  let publicConfig = pgParser.getPublicConfig(config);
  delete config.tables;
  Object.keys(config).forEach(tableName => {
    let pathToConfig = path.resolve(
      process.cwd(),
      pathToConfigDirectory,
      `${tableName}.json`
    );
    writeJSON(pathToConfig, JSON.stringify(publicConfig[tableName], null, 2));
  });
  writeJSON(
    path.resolve(pathToConfigDirectory, `global-config.json`),
    JSON.stringify(publicConfig, null, 2)
  );
}

async function writeJSON(path = "config.json", data) {
  fs.writeFileSync(path, data);
  let pathArray = path.split("\\");
  let fileName = pathArray[pathArray.length - 1];
  console.log(fileName, "WRITTEN!");
}

export { generateConfig };
