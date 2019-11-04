import Field from "./Field";
import { inherit } from "./utils";

const UUIDField = function({ jsonSchema: schema, ...args }) {
  const jsonSchema = schema || { type: "string", format: "UUID" };
  Field.call(this, { ...args, jsonSchema });
};

inherit(UUIDField, Field);

export default UUIDField;
