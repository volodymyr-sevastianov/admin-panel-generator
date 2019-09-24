exports.seed = async function(knex) {
  // Deletes ALL existing entries
  return Promise.all([
    await knex("users-items").del(),
    await knex("users").del(),
    await knex("items").del(),
    await knex("cars").del(),
    await knex("makes").del()
  ]).then(async function() {
    // Inserts seed entries
    return Promise.all([
      await knex("makes").insert([
        { id: 1, name: "BMW" },
        { id: 2, name: "MERC" },
        { id: 3, name: "VV" }
      ]),
      await knex("cars").insert([
        { id: 1, "make-id": 1 },
        { id: 2, "make-id": 2 },
        { id: 3, "make-id": 3 }
      ])
    ]);
  });
};
