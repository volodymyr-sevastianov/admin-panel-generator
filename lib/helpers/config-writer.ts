import * as Path from "path";
import * as fs from "fs";
import IParcer from "../intrefaces/IParcer";

function resolveConfigsFolder({ path }) {
  const pathToDirectory = Path.resolve(path, "configs");
  if (!fs.existsSync(pathToDirectory)) {
    fs.mkdirSync(pathToDirectory);
  }
  return pathToDirectory;
}

async function generateConfig({
  parser,
  pathToConfigDirectory
}: {
  parser: IParcer;
  pathToConfigDirectory: any;
}) {
  let config = await parser.getDBConfig();
  let publicConfig = parser.getPublicConfig(config);
  delete config.tables;
  Object.keys(config).forEach(tableName => {
    let pathToConfig = Path.resolve(
      process.cwd(),
      pathToConfigDirectory,
      `${tableName}.json`
    );
    writeJSON(pathToConfig, JSON.stringify(publicConfig[tableName], null, 2));
  });
  writeJSON(
    Path.resolve(pathToConfigDirectory, `global-config.json`),
    JSON.stringify(publicConfig, null, 2)
  );
}

async function writeJSON(pathToDirectory = "config.json", data) {
  fs.writeFileSync(pathToDirectory, data);
  let pathArray = pathToDirectory.split("\\");
  let fileName = pathArray[pathArray.length - 1];
  console.log(fileName, "WRITTEN!");
}

export { generateConfig, resolveConfigsFolder };
