// import { Validator } from "jsonschema";
import { Validator, ValidationError } from "./formats";
import FieldErrors from "./FieldErrors";

function isEmpty(value) {
  if (value === undefined || value === null) {
    return true;
  }
  return false;
}

const Field = function({
  defaultValue,
  required,
  minLength,
  maxLength,
  pattern,
  jsonSchema: schema
}) {
  let name = "";
  const jsonSchema = schema || { type: "string" };
  extendSchema();

  function extendSchema() {
    if (required) {
      jsonSchema.required = true;
    }
    if (minLength) {
      jsonSchema.minLength = minLength;
    }
    if (maxLength) {
      jsonSchema.maxLength = maxLength;
    }
    if (pattern) {
      jsonSchema.pattern = pattern;
    }
  }

  this._setName = function(n) {
    name = n;
  };

  this.clean = function(v) {
    const value = isEmpty(v) ? defaultValue : v;
    this.validate(value);
    return value;
  };

  this.validate = function(value) {
    var v = new Validator();
    const result = v.validate(value, jsonSchema, { propertyName: name });
    if (!result.valid) {
      throw new FieldErrors(result.errors);
    }
    if (jsonSchema.type === "string" && (isEmpty(value) || value === "")) {
      throw new FieldErrors([
        new ValidationError(
          "is required",
          undefined,
          jsonSchema,
          name,
          "required"
        )
      ]);
    }
  };

  this.getJsonSchema = function() {
    return { ...jsonSchema };
  };
};

export default Field;
