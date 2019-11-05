import Field from "./Field";
import { inherit } from "./utils";

const URLField = function({ jsonSchema: schema, ...args }) {
  const jsonSchema = schema || { type: "string", format: "uri" };
  Field.call(this, { ...args, jsonSchema });
};

inherit(URLField, Field);

export default URLField;
