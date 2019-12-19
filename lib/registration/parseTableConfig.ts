import * as fs from "fs";
import * as paths from "path";
import { MANY_TO_MANY } from "../constants";

const parseTableConfig = (path, tableName, m2m, level = 1) => {
  let tableConfig;
  try {
    const configFilePath = paths.resolve(path, `${tableName}.json`);
    tableConfig = JSON.parse(String(fs.readFileSync(configFilePath)));
    tableConfig.tableName = tableName;
  } catch (err) {
    throw Error(`${tableName}: table name is incorrect.`);
  }
  if (!level) {
    return tableConfig;
  }
  Object.entries(tableConfig.relationMappings).forEach(
    ([name, { join }]: any) => {
      const { toTable } = join;
      tableConfig.relationMappings[name].config = {
        ...parseTableConfig(path, toTable, m2m, level - 1),
        tableName: toTable
      };
    }
  );
  m2m
    .filter(([_, t]) => t === tableName)
    .forEach(([fieldName, table, throught, toTable], index) => {
      const throughtConfig = parseTableConfig(path, throught, [], 0);
      const m2mNew = [...m2m];
      m2mNew.splice(index, 1);
      const toConfig = parseTableConfig(path, toTable, m2mNew, level - 1);
      relationForTable(throughtConfig.relationMappings, table);
      tableConfig.relationMappings[fieldName] = {
        relation: MANY_TO_MANY,
        throught: {
          table: throught,
          from: relationForTable(throughtConfig.relationMappings, table).join
            .from,
          to: relationForTable(throughtConfig.relationMappings, toTable).join
            .from,
          config: throughtConfig
        },
        to: {
          table: toTable,
          config: toConfig
        }
      };
    });
  return tableConfig;
};

const relationForTable = (relationMappings, table): any => {
  return Object.entries(relationMappings).find(([, { join }]: any) => {
    return join.toTable === table;
  })[1];
};

export default parseTableConfig;
