import Field from "./Field";
import { inherit } from "./utils";

const DateField = function({ jsonSchema: schema, ...args }) {
  const jsonSchema = schema || { type: "string", format: "DATE" };
  Field.call(this, { ...args, jsonSchema });
};

inherit(DateField, Field);

export default DateField;
