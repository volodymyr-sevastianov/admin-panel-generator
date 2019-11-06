// import { Validator } from "jsonschema";
import { Validator, ValidationError } from "./formats";
import FieldErrors from "./FieldErrors";

function isEmpty(value) {
  if (value === undefined || value === null) {
    return true;
  }
  return false;
}

class Field {
  constructor({
    primary,
    defaultValue,
    required,
    minLength,
    maxLength,
    pattern,
    jsonSchema: schema,
    hasRelated
  }) {
    this.primary = !!primary;
    this.defaultValue = defaultValue;
    this.required = required;
    this.minLength = minLength;
    this.maxLength = maxLength;
    this.pattern = pattern;
    this._name = null;
    this._schema = schema || { type: "string" };
    this._hasRelated = !!hasRelated;

    if (this._hasRelated) {
      this._schema.hasRelated = true;
    } else {
      this._extendSchema();
    }
    Object.freeze(this._schema);
  }

  _extendSchema() {
    if (this.required) {
      this._schema.required = true;
    }
    if (this.minLength) {
      this._schema.minLength = this.minLength;
    }
    if (this.maxLength) {
      this._schema.maxLength = this.maxLength;
    }
    if (this.pattern) {
      this._schema.pattern = this.pattern;
    }
  }

  _setName(n) {
    this._name = n;
  }

  isPrimary() {
    return this.primary;
  }

  clean(v) {
    const value = isEmpty(v) ? this.defaultValue : v;
    this.validate(value);
    return value;
  }

  validate(value) {
    var v = new Validator();
    const result = v.validate(value, this._schema, {
      propertyName: this._name
    });
    if (!result.valid) {
      throw new FieldErrors(result.errors);
    }
    // if (this._schema.type === "string" && (isEmpty(value) || value === "")) {
    if (this.required && (isEmpty(value) || value === "")) {
      throw new FieldErrors([
        new ValidationError(
          "is required",
          undefined,
          this._schema,
          this._name,
          "required"
        )
      ]);
    }
  }

  getJsonSchema() {
    return { ...this._schema };
  }
}

const FieldOld = function({
  defaultValue,
  required,
  minLength,
  maxLength,
  pattern,
  jsonSchema: schema
}) {
  let name = "";
  const jsonSchema = schema || { type: "string" };
  if (jsonSchema.type !== "object") {
    extendSchema();
  }

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
