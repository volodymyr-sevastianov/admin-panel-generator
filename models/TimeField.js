import Field from "./Field";
import { inherit } from "./utils";

const TimeField = function({ jsonSchema: schema, ...args }) {
  const jsonSchema = schema || { type: "string", format: "TIME" };
  Field.call(this, { ...args, jsonSchema });
};

inherit(TimeField, Field);

export default TimeField;
