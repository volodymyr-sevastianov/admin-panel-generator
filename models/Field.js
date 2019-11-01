import { Validator } from "jsonschema";

function isEmpty(value) {
  if (value === undefined || value === null) {
    return true;
  }
  return false;
}

const Field = function({ defaultValue, required, minLength, maxLength }) {
  let name = "";
  const jsonSchema = { type: "string" };
  const validators = [];
  this._setName = function(n) {
    name = n;
  };

  this._addValidator = function(v) {
    validators.push(v);
  };

  this.clean = function(v) {
    const value = isEmpty(v) ? defaultValue : v;
    this.validate(value);
    return value;
  };

  this.validate = function(value) {
    var v = new Validator();
    console.log(v, v.validate(value, jsonSchema).valid);
  };
};

export default Field;
