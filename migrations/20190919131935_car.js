exports.up = function(knex) {
  return knex.schema.createTable("cars", table => {
    table.increments("id");
    table.integer("make-id");
    table
      .foreign("make-id")
      .references("makes.id")
      .onDelete("CASCADE");
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("cars");
};
