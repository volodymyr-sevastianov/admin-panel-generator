import Field from "./Field";
import FieldsErrors from "./FieldsErrors";
import { fromEntries } from "./utils";

function createSchemaFromFields(fields) {
  const properties = fields.map(([n, f]) => [n, f.getJsonSchema()]);
  return {
    $schema: "http://json-schema.org/draft-04/schema#",
    type: "object",
    properties: fromEntries(properties)
  };
}

function modelExtend(args) {
  const properties = Object.entries(args);
  const fields = fromEntries(
    properties.filter(([n, v]) => {
      const isField = v instanceof Field;
      if (isField) {
        v._setName(n);
      }
      return isField;
    })
  );
  const fieldsEntries = Object.entries(fields);
  const jsonSchema = Object.freeze(createSchemaFromFields(fieldsEntries));

  return function(args) {
    const values = {};

    Object.entries(args).forEach(([n, v]) => {
      if (n in fields) {
        values[n] = v;
      }
    });

    this.clean_fields = function() {
      const errors = {};
      fieldsEntries.forEach(([n, f]) => {
        try {
          values[n] = f.clean(values[n]);
        } catch (e) {
          errors[n] = e.errors;
        }
      });
      if (Object.keys(errors).length) {
        throw new FieldsErrors(errors);
      }
    };

    this.toJS = function() {
      return { ...values };
    };

    this.getJsonSchema = function() {
      return jsonSchema;
    };

    return new Proxy(this, {
      get: (target, name) => {
        if (name in fields) {
          return values[name];
        }
        return target[name];
      }
    });
  };
}

export default modelExtend;
