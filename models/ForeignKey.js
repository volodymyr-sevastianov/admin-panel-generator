import Field from "./Field";

class ForeignKey extends Field {
  constructor({ to, jsonSchema: schema, ...args }) {
    const pf = to.getPrimaryField();
    if (!to) {
      throw Error("ForeignKey: to property is required");
    }
    if (!pf) {
      throw Error("ForeignKey: to model doesn't have primary field");
    }
    super({
      ...args,
      jsonSchema: { ...pf.getJsonSchema(), relatedModel: to.constructor.name }
    });
    this._relatedScheme = to.getJsonSchema();
  }
}

export default ForeignKey;
