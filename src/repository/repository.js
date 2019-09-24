function makeUniversalRepostitory({ knex }) {
  async function findAll({ tableName }) {
    let result = await knex
      .select()
      .from(tableName)
      .clearSelect();
    return result;
  }

  async function insert({ data, tableName }) {
    let dataArray = [];
    Object.keys(data).forEach(key => {
      dataArray.push({
        [key]: data[key]
      });
    });
    let result = await knex(tableName).insert(dataArray);
    return result;
  }

  async function update({ data, tableName }) {
    let id = data.id;
    delete data.id;
    let result = await knex(tableName)
      .where("id", "=", id)
      .update(data);
    return result;
  }

  async function del({ id, tableName }) {
    let result = await knex(tableName)
      .where("id", "=", id)
      .del();
    return result;
  }

  return Object.freeze({
    findAll,
    insert,
    update,
    del
  });
}

export { makeUniversalRepostitory };
