import Field from "./Field";
import FieldError from "./FieldErrors";
import { fromEntries } from "./utils";

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

  return function(args) {
    const values = {};

    Object.entries(args).forEach(([n, v]) => {
      if (n in fields) {
        values[n] = v;
      }
    });

    this.clean_fields = function() {
      const errors = {};
      Object.entries(fields).forEach(([n, f]) => {
        try {
          values[n] = f.clean(values[n]);
        } catch (e) {
          errors[n] = e.errors;
        }
      });
      if (Object.keys(errors).length) {
        throw new FieldError(errors);
      }
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
