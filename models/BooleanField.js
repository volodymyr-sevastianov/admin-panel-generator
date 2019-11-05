import Field from "./Field";
import { inherit } from "./utils";

const BooleanField = function({ jsonSchema: schema, ...args }) {
  const jsonSchema = schema || { type: "boolean" };
  Field.call(this, { ...args, jsonSchema });
};

inherit(BooleanField, Field);

export default BooleanField;
