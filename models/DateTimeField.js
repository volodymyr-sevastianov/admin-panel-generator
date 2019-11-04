import Field from "./Field";
import { inherit } from "./utils";

const DateTimeField = function({ jsonSchema: schema, ...args }) {
  const jsonSchema = schema || { type: "string", format: "DATETIME" };
  Field.call(this, { ...args, jsonSchema });
};

inherit(DateTimeField, Field);

export default DateTimeField;
