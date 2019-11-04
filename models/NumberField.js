import Field from "./Field";
import { inherit } from "./utils";

const NumberField = function({
  minValue,
  maxValue,
  integer,
  jsonSchema: schema,
  ...args
}) {
  const jsonSchema = schema || { type: integer ? "integer" : "number" };
  extendSchema();
  Field.call(this, { ...args, jsonSchema });

  function extendSchema() {
    if (minValue) {
      jsonSchema.minimum = minValue;
    }
    if (maxValue) {
      jsonSchema.maximum = maxValue;
    }
  }
};

inherit(NumberField, Field);

export default NumberField;
