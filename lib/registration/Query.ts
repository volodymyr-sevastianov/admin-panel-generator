import { FieldsSelector } from "@vbait/json-schema-model";

class Query {
  private table: any;
  private selector: any;
  private repository: any;
  private model: any;
  private where: any[] = [];
  private joins: any[] = [];

  constructor(table, selector, repository) {
    this.table = table;
    this.selector = selector;
    this.model = selector.model();
    this.repository = repository;
    this.createJoins();
  }

  createJoins() {
    Object.entries(this.selector.relatives()).forEach(
      ([name, selector]: [string, FieldsSelector]) => {
        const field = this.model.getFieldByName(name);
        const sourceName = this.model.getFieldByName(name).sourceName;
        const relationMapping = this.model._relationMappings[sourceName];
        if (!relationMapping) return;
        const joinConfig = relationMapping.join;
        const localFields = selector.fields().filter(f => !f.hasMany());
        if (localFields.length) {
          this.joins.push({
            fields: localFields.map(f => f.sourceName),
            type: field.required ? "inner" : "left",
            table: joinConfig.toTable,
            from: sourceName,
            to: field.getRelatedModel().getPrimaryField().sourceName
          });
        }
      }
    );
  }

  filter(filter) {
    Object.entries(filter).forEach(([property, value]) => {
      this.where.push({ property, value });
    });
    return this;
  }

  apply(args: any = {}) {
    const { withPrefetch = false } = args;
    const pk = this.model.getPrimaryField();
    const localFields = this.selector.fields().filter(f => !f.hasMany());
    localFields.unshift(pk);

    const fields = localFields.map(f => f.sourceName);
    const filter = {
      tableName: this.table,
      fields,
      where: this.where
    };
    const response = this.repository.find({ ...filter, joins: this.joins });
    // console.log(this.selector.relatives());
    return response;
    return this.repository.find(filter).then(results => {
      if (withPrefetch) {
        return this.attachPrefetchRelated(results.map(r => r[pk.name])).then(
          m2mResults => {
            results.forEach(result => {
              Object.entries(m2mResults).forEach(([property, idsValues]) => {
                Object.assign(result, {
                  [property]: idsValues[result[pk.name]]
                });
              });
            });
            return results;
          }
        );
      }
      return results;
    });
  }

  attachPrefetchRelated(ids) {
    const queryPromises: Promise<any>[] = [];
    const m2mFields = this.selector.fields().filter(f => f.hasMany());
    m2mFields.forEach(field => {
      const relatedData = field.getRelatedData();
      queryPromises.push(
        this.repository
          .find({
            tableName: relatedData.name,
            whereIn: [{ property: relatedData.from, value: ids }],
            fields: [relatedData.from, relatedData.to]
          })
          .then(results => {
            const mapped = {};
            ids.forEach(id => {
              // TODO: optimize in a future
              mapped[id] = results
                .filter(r => r[relatedData.from].toString() === id.toString())
                .map(r => r[relatedData.to]);
            });
            return { [field.name]: mapped };
          })
      );
    });
    return Promise.all(queryPromises).then(results => {
      return results.reduce((acc, item) => {
        Object.assign(acc, item);
        return acc;
      }, {});
    });
  }
}

export default Query;
