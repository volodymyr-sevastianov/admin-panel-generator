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
      hasRelated: true,
      jsonSchema: { ...pf.getJsonSchema(), relatedModel: to.getName() }
    });
    this._relatedScheme = to.getJsonSchema();
  }
}

export default ForeignKey;
