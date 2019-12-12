import * as constants from "../constants";
import IParcer from "../intrefaces/IParcer";

const fieldTypeNames = {
  bytea: "byte array",
  "character varying": "string",
  "time without time zone": "date",
  "timestamp with time zone": "date",
  text: "string"
};

const constraintTypeNames = {
  c: "check",
  f: "foreign key",
  p: "primary key",
  u: "unique",
  t: "trigger",
  x: "exclusion"
};

class PostgresDBParser implements IParcer {
  schema: any;
  repository: any;
  constructor({ schema, repository }) {
    this.schema = schema;
    this.repository = repository;
  }

  private countOccurrences(arr, val) {
    let accumulator = 0;
    arr.forEach(item => {
      Object.keys(item).forEach(value => {
        accumulator = value === val ? accumulator + 1 : accumulator;
      });
    });
    return accumulator;
  }

  getDBConfig = async () => {
    // get meta-data from DB
    let config = await this.repository.getSchemaConfig({ schema: this.schema });
    // parse meta-data to necessary shape
    config = this.schemaParser(config);
    let tableConfig;
    for (let index = 0; index < config.tables.length; index++) {
      const tableName = config.tables[index];
      // get table meta-data
      tableConfig = await this.repository.getTableConfig({ table: tableName });
      // get table constraints
      tableConfig.constraints = await this.repository.getConstraints({
        table: tableName
      });
      // parse table and attach it to config
      config[tableName] = this.tableParser(tableConfig);
    }
    // get relationship data from DB
    let relations = await this.repository.getRelationships({
      schema: this.schema
    });
    // attach relationship data
    config = this.attachRelations({ config, relations });

    return config;
  };

  getPublicConfig(config) {
    let publicConfig: any = {};
    // iterate through tables
    Object.keys(config).forEach(tableName => {
      let currentTable = config[tableName];
      // exclude field "tables" that contains array of table names
      if (tableName === "tables") {
        publicConfig.tables = currentTable;
      } else {
        let columns = {};
        // iterate through columns of each table
        currentTable.columns.forEach(column => {
          // set the key to "column_name" field value
          columns[column.column_name] = {
            type: column.data_type,
            maxLength: column.character_maximum_length,
            constraint: column.constraint ? column.constraint : null
          };
        });
        let relationMappings = {};
        let currentTableRelations = currentTable.relations;
        let join = {};
        // iterate through relations of current table
        currentTableRelations.forEach(relation => {
          // getting the current relation type
          const relationType = Object.keys(relation)[0];
          const joinName = relation.from;
          // chosing the form of result object in dependency to relation type
          if (relationType === constants.MANY_TO_MANY) {
            join = relation[relationType];
            relationMappings[relation[relationType].toTable] = {
              relation: relationType,
              join
            };
          } else {
            join = {
              from: relation.from,
              to: relation.to,
              toTable: relation.toTable
            };
            relationMappings[joinName] = {
              relation: relationType,
              join
            };
          }
        });

        publicConfig[tableName] = {
          columns,
          relationMappings
        };
      }
    });
    return publicConfig;
  }

  mergeConfig(devConfig, publicConfig) {
    // iterate through all tabels
    Object.keys(devConfig).forEach(tableName => {
      let tableExist = false;
      // iterate through all table names
      publicConfig.tables.forEach(dbTableName => {
        // checking public config to have field from dev config
        if (tableName === dbTableName) {
          tableExist = true;
        }
      });
      // if not throw exeption
      if (!tableExist) {
        throw new Error(`DataBase relation ${tableName} does not exist...`);
      }
      publicConfig[tableName].options = devConfig[tableName];
    });
    return publicConfig;
  }

  private attachRelations({ config, relations }) {
    Object.keys(config).forEach(key => {
      // ignoring 'tables'
      if (key !== "tables") {
        // creating "relations" field to every table obj
        config[key].relations = [];
      }
    });
    // iterating through relations
    relations.rows.forEach(item => {
      let primaryTableName = item.primary_table;
      let foreignTableName = item.foreign_table;
      let primaryTablePKConfig = config[primaryTableName].columns[0];
      let primaryTablePKName = primaryTablePKConfig.column_name;
      let foreignKeyColumn = item.fk_columns;
      let relationObj = {};
      // changing the relation obj to the right shape

      let isForeignKeyUnique = false;
      // iterating through a columns of a table that have foreign key
      config[foreignTableName].columns.forEach(column => {
        // checking is the foreign key has unique constraint
        if (
          column.column_name === foreignKeyColumn &&
          column.constraint === constraintTypeNames.u
        ) {
          isForeignKeyUnique = true;
        }
      });
      // choosing the key name
      let relationKey = isForeignKeyUnique
        ? constants.ONE_TO_ONE
        : constants.ONE_TO_MANY;
      relationObj = {
        [relationKey]: primaryTableName,
        from: foreignKeyColumn,
        to: primaryTableName + "." + primaryTablePKName,
        toTable: primaryTableName
      };
      config[foreignTableName].relations.push(relationObj);
    });

    config = this.resolveManyToMany({ config });

    return config;
  }

  private resolveManyToMany({ config }) {
    // iterate through tables
    Object.keys(config).forEach(tableName => {
      const belongsToManyKey = constants.ONE_TO_MANY;
      // excluding tables
      if (tableName !== "tables") {
        const currentTable = config[tableName];
        const currentTableRelations = currentTable.relations;
        // count belongs to many relations to decide is there many to many or not
        const countOfBelongsToManyRelations =
          Object.keys(currentTable.relations).length > 1
            ? this.countOccurrences(currentTable.relations, belongsToManyKey)
            : 0;
        const columnsCount = Object.keys(currentTable.columns).length;
        // const columnsCount = 3;

        // if there is many to many then ...
        if (countOfBelongsToManyRelations === 2 && columnsCount === 3) {
          // iterate through current table relations
          currentTableRelations.forEach((currentTableRelation, index) => {
            let primaryTableName = currentTableRelation[belongsToManyKey];
            // this is made for switching beetween data from two relations in one time.
            // For example, to set users many to many relation(MTM) and instantly items MTM relation
            let otherRelationIndex = index === 0 ? index + 1 : index - 1;
            let [manyToManyRelatedTable] = currentTableRelations[
              otherRelationIndex
            ].to.split(".");
            // set MTM relation to the parent table
            config[primaryTableName].relations.push({
              [constants.MANY_TO_MANY]: {
                from:
                  primaryTableName +
                  "." +
                  config[primaryTableName].columns[0].column_name,
                through: {
                  table: tableName,
                  from: tableName + "." + currentTableRelation.from,
                  to:
                    tableName +
                    "." +
                    currentTableRelations[otherRelationIndex].from
                },
                to: currentTableRelations[otherRelationIndex].to,
                toTable: manyToManyRelatedTable
              }
            });
          });
        }
      }
    });
    config = this.resolveRelationsDuplicates(config);

    return config;
  }

  // this method is made for deleting relations to the same tables.
  // Those relations may be created by _resolveManyToMany() method
  private resolveRelationsDuplicates(config) {
    // iterating through tables
    Object.keys(config).forEach(tableName => {
      if (tableName !== "tables") {
        let currentTable = config[tableName];
        let listOfIndexesOfRedudantRelations = [];
        // iterating through relations of each table
        currentTable.relations.forEach(
          (currentTableRelation, currentTableRelationIndex) => {
            // iterating through relation keys
            Object.keys(currentTableRelation).forEach(key => {
              // another one iteration through relation of current table for duplicates check
              currentTable.relations.forEach(
                (checkingTableRelation, checkingTableRelationIndex) => {
                  // another one iteration through relation keys
                  Object.keys(checkingTableRelation).forEach(checkingKey => {
                    // duplicates check
                    if (
                      currentTableRelation[constants.MANY_TO_MANY] &&
                      currentTableRelationIndex !==
                        checkingTableRelationIndex &&
                      checkingTableRelation[checkingKey] ===
                        currentTableRelation[constants.MANY_TO_MANY].through
                          .table
                    ) {
                      // pushing redudant relations
                      listOfIndexesOfRedudantRelations.push(
                        checkingTableRelationIndex
                      );
                    }
                  });
                }
              );
            });
          }
        );
        // excluding all redudant realations
        // using reversed for loop beacuse indexes of rest element are changing after delete
        for (
          let index = listOfIndexesOfRedudantRelations.length - 1;
          index >= 0;
          index--
        ) {
          const redudantRelationIndex = listOfIndexesOfRedudantRelations[index];
          currentTable.relations.splice(redudantRelationIndex, 1);
        }
      }
    });

    return config;
  }

  private schemaParser(schemaObj) {
    let result = { tables: [] };
    schemaObj.rows.forEach(item => {
      // excluding redudant tables
      if (!item.show_tables.match(/(knex_)/)) {
        result.tables.push(item.show_tables);
      }
    });
    return result;
  }

  private tableParser(tableObj) {
    let result: any = {};
    result.columns = tableObj.rows.map(row => {
      row.data_type = fieldTypeNames[row.data_type]
        ? fieldTypeNames[row.data_type]
        : row.data_type;
      return row;
    });
    result.constraints = tableObj.constraints.rows.map(row => {
      let constraintType = constraintTypeNames[row.contype]
        ? constraintTypeNames[row.contype]
        : row.contype;
      let resultItem = {
        constarintName: row.conname,
        constraintType,
        constraintedColumn: null
      };
      if (row.conkey) {
        try {
          let constraintedColumnIndex = row.conkey[0] - 1;
          resultItem.constraintedColumn =
            result.columns[constraintedColumnIndex].column_name;
          result.columns[constraintedColumnIndex].constraint = constraintType;
        } catch (e) {
          console.log(row);
        }
      }
      return resultItem;
    });
    return result;
  }
}

export default PostgresDBParser;
