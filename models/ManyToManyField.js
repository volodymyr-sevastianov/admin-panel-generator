import { ValidationError } from "./formats";
import Field from "./Field";
import FieldErrors from "./FieldErrors";

class ManyToManyField extends Field {
  constructor({ to, jsonSchema: schema, ...args }) {
    const pf = to.getPrimaryField();
    if (!to) {
      throw Error("ManyToManyField: to property is required");
    }
    if (!pf) {
      throw Error("ManyToManyField: to model doesn't have primary field");
    }
    super({
      ...args,
      hasRelated: true,
      jsonSchema: {
        type: "array",
        relatedModel: to.getName(),
        items: pf.getJsonSchema()
      }
    });
    this._relatedScheme = to.getJsonSchema();
  }

  validate(value) {
    super.validate(value);
    if (this.required && Array.isArray(value) && !value.length) {
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
}

export default ManyToManyField;
