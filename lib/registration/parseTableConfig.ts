import * as fs from "fs";
import * as paths from "path";

const parseTableConfig = (path, tableName) => {
  const configFilePath = paths.resolve(path, `${tableName}.json`);
  const tableConfig = JSON.parse(String(fs.readFileSync(configFilePath)));
  Object.entries(tableConfig.relationMappings).forEach(
    ([name, { join }]: any) => {
      const { toTable } = join;
      const config = JSON.parse(
        String(fs.readFileSync(paths.resolve(path, `${toTable}.json`)))
      );
      tableConfig.relationMappings[name].config = {
        ...config,
        tableName: toTable
      };
    }
  );
  return tableConfig;
};

export default parseTableConfig;
