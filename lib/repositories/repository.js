function makeUniversalRepostitory({ knex }) {
  async function find({
    tableName,
    fields,
    where = [],
    whereIn = [],
    joins = [],
    onlyOne = false
  }) {
    const queryFields = fields.map(f => ({
      [`${tableName}.${f}`]: `${tableName}.${f}`
    }));
    const query = knex.from(tableName);

    joins.forEach(
      ({ type, table: joinTable, from, to, fields: joinFields }) => {
        console.log(type, joinTable, from, to, fields);
        // query.andWhere(property, operator, value);
        const joinArgs = [
          joinTable,
          `${tableName}.${from}`,
          `${joinTable}.${to}`
        ];
        if (type === "inner") {
          query.leftJoin(...joinArgs);
        } else {
          query.leftJoin(...joinArgs);
        }
        queryFields.push(
          ...joinFields.map(f => ({
            [`${joinTable}.${f}`]: `${joinTable}.${f}`
          }))
        );
      }
    );
    // knex.column(queryFields).select();
    query.select(...queryFields);

    where.forEach(({ property, value, operator = "=" }) => {
      query.andWhere(property, operator, value);
    });
    whereIn.forEach(({ property, value }) => {
      query.whereIn(property, value);
    });

    let results = await query;

    results = results.map(result => {
      const list = Object.entries(result);
      const value = fromEntries(
        list.splice(0, fields.length).map(([f, v]) => [f.split(".")[1], v])
      );
      joins.forEach(({ from, fields: joinFields }) => {
        Object.assign(value, {
          [from]: fromEntries(
            list
              .splice(0, joinFields.length)
              .map(([f, v]) => [f.split(".")[1], v])
          )
        });
      });
      return value;
    });
    if (onlyOne) {
      if (!results.length) {
        throw Error("Not found");
      }
      return results[0];
    }
    return results;
  }

  async function findAll({ tableName }) {
    const result = await knex
      .select()
      .from(tableName)
      .clearSelect();
    return result;
  }

  async function findOne({ tableName, id, fields }) {
    const result = await knex
      .select(...fields)
      .from(tableName)
      .where("id", "=", id);
    if (!result.length) {
      throw Error("Not found");
    }
    return result[0];
  }

  async function insert({ data, tableName }) {
    const dataArray = [];
    Object.keys(data).forEach(key => {
      dataArray.push({
        [key]: data[key]
      });
    });
    const result = await knex(tableName).insert(dataArray);
    return result;
  }

  async function update({ data, tableName }) {
    const id = data.id;
    delete data.id;
    const result = await knex(tableName)
      .where("id", "=", id)
      .update(data);
    return result;
  }

  async function del({ id, tableName }) {
    const result = await knex(tableName)
      .where("id", "=", id)
      .del();
    return result;
  }

  return Object.freeze({
    find,
    findAll,
    findOne,
    insert,
    update,
    del
  });
}

function fromEntries(iterable) {
  return [...iterable].reduce((obj, [key, val]) => {
    obj[key] = val;
    return obj;
  }, {});
}

export { makeUniversalRepostitory };
