exports.up = function(knex) {
  return knex.schema.createTable("users-items", table => {
    table.increments("id");
    table.integer("user-id");
    table.integer("item-id");
    table
      .foreign("user-id")
      .references("users.id")
      .onDelete("CASCADE");
    table
      .foreign("item-id")
      .references("items.id")
      .onDelete("CASCADE");
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("users-items");
};
