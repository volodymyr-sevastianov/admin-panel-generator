function makeUniversalRepostitory({ knex }) {
  async function findAll({ tableName }) {
    const result = await knex
      .select()
      .from(tableName)
      .clearSelect();
    return result;
  }

  async function findOne({ tableName, id }) {
    const result = await knex
      .select()
      .from(tableName)
      .where("id", "=", id)
      .clearSelect();
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
    findAll,
    findOne,
    insert,
    update,
    del
  });
}

export { makeUniversalRepostitory };
