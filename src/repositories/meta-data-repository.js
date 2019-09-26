function makeMetaDataRepository({ knex }) {
  async function getRelationships({ schema }) {
    let result;
    result = await knex.raw(`
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
      and kcu.table_schema = '${schema}'
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

  async function getConstraints({ table }) {
    let result = await knex.raw(`
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

  async function getTableConfig({ table }) {
    let result = await knex.raw(`
    select column_name, data_type, character_maximum_length
    from INFORMATION_SCHEMA.COLUMNS where table_name ='${table}';
  `);
    return result;
  }

  async function getSchemaConfig({ schema }) {
    let result = await knex.raw(`
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

  return Object.freeze({
    getRelationships,
    getConstraints,
    getSchemaConfig,
    getTableConfig
  });
}

export { makeMetaDataRepository };
