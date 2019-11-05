import Field from "./Field";
import { inherit } from "./utils";

const EmailField = function({ jsonSchema: schema, ...args }) {
  const jsonSchema = schema || { type: "string", format: "EMAIL" };
  Field.call(this, { ...args, jsonSchema });
};

inherit(EmailField, Field);

export default EmailField;
