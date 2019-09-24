import * as constants from "../constants";

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

class PostgresDBParser {
  constructor(knex, schema) {
    this.knex = knex;
    this.schema = schema;
  }

  countOccurrences(arr, val) {
    let accumulator = 0;
    arr.forEach(item => {
      Object.keys(item).forEach(value => {
        accumulator = value === val ? accumulator + 1 : accumulator;
      });
    });
    return accumulator;
  }

  async getDBConfig() {
    // get meta-data from DB
    let config = await this._getSchemaConfig({ schema: this.schema });
    // parse meta-data to necessary shape
    config = this._schemaParser(config);
    let tableConfig;
    for (let index = 0; index < config.tables.length; index++) {
      const tableName = config.tables[index];
      // get table meta-data
      tableConfig = await this._getTableConfig({ table: tableName });
      // get table constraints
      tableConfig.constraints = await this._getConstraints({
        table: tableName
      });
      // parse table and attach it to config
      config[tableName] = this._tableParser(tableConfig);
    }
    // get relationship data from DB
    let relations = await this._getRelationships();
    // attach relationship data
    config = this._attachRelations({ config, relations });

    return config;
  }

  getPublicConfig(config) {
    let publicConfig = {};
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
          let relationType = Object.keys(relation)[0];
          let joinName = relation.from;
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
              to: relation.to
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

  _attachRelations({ config, relations }) {
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

      //-- TODO: Create check for dev-config options
      // to know should we show "hasMany" relations or not
      // let relationObj = {
      //   hasMany: foreignTableName,
      //   from: primaryTablePKName,
      //   to: foreignTableName + "." + foreignKeyColumn
      // };
      // // pushing relation obj to the foreign key target table
      // config[primaryTableName].relations.push(relationObj);

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
        to: primaryTableName + "." + primaryTablePKName
      };
      config[foreignTableName].relations.push(relationObj);
    });

    config = this._resolveManyToMany({ config });

    return config;
  }

  _resolveManyToMany({ config }) {
    // iterate through tables
    Object.keys(config).forEach(tableName => {
      const belongsToManyKey = constants.ONE_TO_MANY;
      // excluding tables
      if (tableName !== "tables") {
        let currentTable = config[tableName];
        let currentTableRelations = currentTable.relations;
        // count belongs to many relations to decide is there many to many or not
        let countOfBelongsToManyRelations =
          Object.keys(currentTable.relations).length > 1
            ? this.countOccurrences(currentTable.relations, belongsToManyKey)
            : 0;
        // if there is many to many then ...
        if (countOfBelongsToManyRelations === 2) {
          // iterate through current table relations
          currentTableRelations.forEach((currentTableRelation, index) => {
            let primaryTableName = currentTableRelation[belongsToManyKey];
            // this is made for switching beetween data from two relations in one time.
            // For example, to set users many to many relation and instantly items MTM relation
            let otherRelationIndex = index === 0 ? index + 1 : index - 1;
            let [manyToManyRelatedTable] = currentTableRelations[
              otherRelationIndex
            ].to.split(".");
            // set MTM relation to the parent table table
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
    config = this._resolveRelationsDuplicates(config);

    return config;
  }

  // this method is made for deleting relations to the same tables.
  // Those relations may be created by _resolveManyToMany() method
  _resolveRelationsDuplicates(config) {
    Object.keys(config).forEach(tableName => {
      if (tableName !== "tables") {
        let currentTable = config[tableName];
        let listOfIndexesOfRedudantRelations = [];
        currentTable.relations.forEach(
          (currentTableRelation, currentTableRelationIndex) => {
            Object.keys(currentTableRelation).forEach(key => {
              currentTable.relations.forEach(
                (checkingTableRelation, checkingTableRelationIndex) => {
                  Object.keys(checkingTableRelation).forEach(checkingKey => {
                    if (
                      currentTableRelation[constants.MANY_TO_MANY] &&
                      currentTableRelationIndex !==
                        checkingTableRelationIndex &&
                      checkingTableRelation[checkingKey] ===
                        currentTableRelation[constants.MANY_TO_MANY].through
                          .table
                    ) {
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

  _schemaParser(schemaObj) {
    let result = { tables: [] };
    schemaObj.rows.forEach(item => {
      // excluding redudant tables
      if (!item.show_tables.match(/(knex_)/)) {
        result.tables.push(item.show_tables);
      }
    });
    return result;
  }

  _tableParser(tableObj) {
    let result = {};
    result.columns = tableObj.rows.map(item => {
      item.data_type = fieldTypeNames[item.data_type]
        ? fieldTypeNames[item.data_type]
        : item.data_type;
      return item;
    });
    result.constraints = tableObj.constraints.rows.map(item => {
      let constraintType = constraintTypeNames[item.contype]
        ? constraintTypeNames[item.contype]
        : item.contype;
      let resultItem = {
        constarintName: item.conname,
        constraintType
      };
      if (item.conkey) {
        let constraintedColumnIndex = item.conkey[0] - 1;
        resultItem.constraintedColumn =
          result.columns[constraintedColumnIndex].column_name;
        result.columns[constraintedColumnIndex].constraint = constraintType;
      }
      return resultItem;
    });
    return result;
  }

  async _getSchemaConfig({ schema }) {
    let result = await this.knex.raw(`
      SELECT
      table_name as show_tables
      FROM
      information_schema.tables
      WHERE
      table_type = 'BASE TABLE'
      AND
      table_schema NOT IN ('pg_catalog', 'information_schema')
      AND
      table_schema = '${schema}'
      ;
    `);
    return result;
  }

  async _getRelationships() {
    let result = {};
    result = await this.knex.raw(`
      select kcu.table_name as foreign_table,
                '>-' as rel,
                rel_tco.table_name as primary_table,
                string_agg(kcu.column_name, ', ') as fk_columns,
                kcu.constraint_name
      from information_schema.table_constraints tco
      join information_schema.key_column_usage kcu
                on tco.constraint_schema = kcu.constraint_schema
                and tco.constraint_name = kcu.constraint_name
      join information_schema.referential_constraints rco
                on tco.constraint_schema = rco.constraint_schema
                and tco.constraint_name = rco.constraint_name
      join information_schema.table_constraints rel_tco
                on rco.unique_constraint_schema = rel_tco.constraint_schema
                and rco.unique_constraint_name = rel_tco.constraint_name
      where tco.constraint_type = 'FOREIGN KEY'
      and kcu.table_schema = '${this.schema}'
      group by kcu.table_schema,
                kcu.table_name,
                rel_tco.table_name,
                rel_tco.table_schema,
                kcu.constraint_name
      order by kcu.table_schema,
                kcu.table_name;
    `);
    return result;
  }

  async _getConstraints({ table }) {
    let result = await this.knex.raw(`
    SELECT con.*
    FROM pg_catalog.pg_constraint con
          INNER JOIN pg_catalog.pg_class rel
                    ON rel.oid = con.conrelid
          INNER JOIN pg_catalog.pg_namespace nsp
                    ON nsp.oid = connamespace
    WHERE nsp.nspname = 'public'
          AND rel.relname = '${table}';
    `);
    return result;
  }

  async _getTableConfig({ table }) {
    let result = await this.knex.raw(`
    select column_name, data_type, character_maximum_length
    from INFORMATION_SCHEMA.COLUMNS where table_name ='${table}';
  `);
    return result;
  }
}

export default PostgresDBParser;
