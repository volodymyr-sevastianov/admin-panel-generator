exports.up = function(knex) {
  return knex.schema.createTable("users", table => {
    table.increments("id");
    table.integer("age").notNullable();
    table.bigInteger("sins-qty");
    table.text("biography");
    table.string("full-name");
    table.float("money-qty");
    table.decimal("fingers-qty");
    table.boolean("male");
    table.date("dob");
    table.time("tob");
    table.timestamps(false, true);
    table.binary("2-bit-code");
    table.enu("yes-or-no", ["yes", "no"]);
    table.json("life-model");
    table.jsonb("life-model-bitted");
    table.uuid("id-number");
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("users");
};
