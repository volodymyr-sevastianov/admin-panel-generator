function makeUniversalRepostitory({ knex }) {
  async function addWithTransaction({
    table,
    values,
    returning,
    subquery = []
  }) {
    const trx = await knex.transaction();
    try {
      const query = trx(table);
      if (returning) {
        query.returning(returning);
      }
      const result = await query.insert(values);

      for (const sub of subquery) {
        const { table, from, to, toValue } = sub;
        const insertData = toValue.map(v => {
          return { [from]: result[0], [to]: v };
        });
        await trx(table).insert(insertData);
      }
      await trx.commit();
      return result;
    } catch (err) {
      await trx.rollback();
      throw Error("Transaction Error");
    }
  }

  async function editWithTransaction({
    table,
    where = [],
    values,
    subquery = []
  }) {
    const trx = await knex.transaction();
    try {
      const query = trx(table);
      where.forEach(([property, value, operator = "="]) => {
        query.where(property, operator, value);
      });
      const result = await query.update(values);

      for (const sub of subquery) {
        const { table, from, to, fromValue, toValue } = sub;
        const removeIds = await trx(table)
          .returning(to)
          .where(from, "=", fromValue)
          .whereNotIn(to, toValue)
          .del();

        const selectIds = await trx(table)
          .where(from, "=", fromValue)
          .select(to)
          .then(v => v.map(i => i[to]));

        const insertData = toValue
          .filter(v => !removeIds.includes(v) && !selectIds.includes(v))
          .map(v => {
            return { [from]: fromValue, [to]: v };
          });

        await trx(table).insert(insertData);
      }

      await trx.commit();
      return result;
    } catch (err) {
      await trx.rollback();
      throw Error("Transaction Error");
    }
  }

  async function add({ table, values, returning }) {
    const result = knex(table);
    if (returning) {
      result.returning(returning);
    }
    result.insert(values);
    return await result;
  }

  async function find({ queryBuilder }, map = r => r) {
    const query = knex.from(queryBuilder.table());

    // Attach joins
    attachJoinsForQuery(query, queryBuilder);

    // Attach where in
    queryBuilder.whereIn().forEach(([property, value]) => {
      query.whereIn(property, value);
    });

    // Attach where
    queryBuilder.where().forEach(([property, value, operator]) => {
      query.andWhere(property, operator || "=", value);
    });

    // Attach order
    const orderByColumns = [];
    queryBuilder.orderBy().forEach(([property, direction]) => {
      orderByColumns.push({ column: property, order: direction || "desc" });
    });
    query.orderBy(orderByColumns);

    // Attach fields for select
    const fields = queryBuilder.fieldsForQuery();
    query.select(...fields);

    try {
      let results = await query;
      results = results.map(r => {
        return destructJoinForResult({ ...r }, queryBuilder);
      });
      results = await attachSubqueryForQuery(results, queryBuilder);
      return results.map(r => map(r));
    } catch (err) {
      return Promise.reject(err);
    }
  }

  function attachJoinsForQuery(query, queryBuilder) {
    queryBuilder.joins().forEach(join => {
      if (join.type === "inner") {
        query.innerJoin(...join.args);
      } else {
        query.leftJoin(...join.args);
      }
      if (join.query) {
        attachJoinsForQuery(query, join.query);
      }
    });
  }

  function destructJoinForResult(result, queryBuilder) {
    const fields = queryBuilder.fieldsForModel();
    const entriesResult = Object.entries(result);
    const newResult = fromEntries(
      entriesResult.splice(0, fields.length).map(([_, r], index) => {
        return [fields[index], r];
      })
    );
    if (newResult[queryBuilder.modelPkSourceName()] === null) {
      return null;
    }
    queryBuilder.joins().forEach(join => {
      if (join.query) {
        newResult[join.name] = destructJoinForResult(
          fromEntries(entriesResult),
          join.query
        );
        entriesResult.splice(0, join.query.fieldsForModel().length);
      } else if (join.fields.length) {
        newResult[join.name] = fromEntries(
          entriesResult.splice(0, join.fields.length)
        );
      }
    });
    return newResult;
  }

  async function attachSubqueryForQuery(results, queryBuilder) {
    const promises = queryBuilder
      .subquery()
      .map(({ name, whereInProperty, query, joinName, equalTo }) => {
        if (whereInProperty) {
          query.addWhereIn([
            whereInProperty,
            results.map(r => r[queryBuilder.modelPkSourceName()])
          ]);
        }
        return find({ queryBuilder: query })
          .then(res => {
            results.forEach(result => {
              result[name] = res.filter(r => {
                const to = r[joinName][equalTo];
                return result[queryBuilder.modelPkSourceName()] === to;
              });
            });
            return res;
          })
          .then(res => {
            res.forEach(r => {
              delete r[joinName];
            });
          })
          .catch(err => {
            return Promise.reject(
              Error(
                `${queryBuilder.modelName()}: please check "${name}" field.`
              )
            );
          });
      });
    await Promise.all(promises);
    return results;
  }

  async function find1({
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
    addWithTransaction,
    editWithTransaction,
    add,
    find
    // findAll,
    // findOne,
    // insert,
    // update,
    // del
  });
}

function fromEntries(iterable) {
  return [...iterable].reduce((obj, [key, val]) => {
    obj[key] = val;
    return obj;
  }, {});
}

export { makeUniversalRepostitory };
