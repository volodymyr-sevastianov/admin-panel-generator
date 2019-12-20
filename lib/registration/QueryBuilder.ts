class QueryBuilder {
  private _table: string;
  private _fields: string[][] = [[], []];
  private _joins: {
    name: string;
    sourceName: string;
    type: string;
    query: QueryBuilder;
  }[];
  private _subquery: { name: string; throught: any; query: QueryBuilder }[];

  model: any;
  selectRelated: string[];
  prefetchRelated: string[];

  constructor({
    model,
    selectRelated,
    prefetchRelated
  }: {
    model: any;
    selectRelated: string[];
    prefetchRelated: string[];
  }) {
    this.model = model;
    this.selectRelated = selectRelated;
    this.prefetchRelated = prefetchRelated;
  }

  private _tableName() {
    if (this._table) {
      return this._table;
    }
    if (this.model.__dbTableConfig) {
      this._table = this.model.__dbTableConfig.tableName;
    } else {
      this._table = this.model.name;
    }
    return this._table;
  }

  private _createFields() {
    const fields = [
      this.model.getLocalFields().map(field => field.name),
      this.model.getLocalFields().map(field => field.sourceName)
    ];
    const related = this.model
      .getRelatedFields()
      .filter(field => !field.hasMany());
    const relatedFields = [
      related.map(field => field.name),
      related.map(field => field.sourceName)
    ];
    relatedFields[0].forEach((field, index) => {
      if (!this.selectRelated.includes(field)) {
        fields[0].push(field);
        fields[1].push(relatedFields[1][index]);
      }
    });
    this._fields = fields;
  }

  private _createJoins() {
    const table = this._tableName();
    const joins: any[] = [];
    this.selectRelated.forEach(field => {
      const modelField = this.model.getFieldByName(field);
      if (modelField) {
        const model = modelField.getRelatedModel();
        const selectRelated = selectRelatedFieldsForField(
          this.selectRelated,
          field
        );
        const prefetchRelated = selectRelatedFieldsForField(
          this.prefetchRelated,
          field
        );
        joins.push({
          name: field,
          sourceName: modelField.sourceName,
          type: modelField.required ? "inner" : "left",
          args: [
            model.name,
            `${table}.${modelField.sourceName}`,
            `${model.name}.${model.getPrimaryField().sourceName}`
          ],
          query: new QueryBuilder({
            model,
            selectRelated,
            prefetchRelated
          }).create()
        });
      }
    });
    this._joins = joins;
  }

  private _createSubquery() {
    const subquery: any[] = [];
    this.prefetchRelated.forEach(field => {
      const modelField = this.model.getFieldByName(field);
      if (modelField) {
        const model = modelField.getRelatedModel();
        const selectRelated = selectRelatedFieldsForField(
          this.selectRelated,
          field
        );
        const prefetchRelated = selectRelatedFieldsForField(
          this.prefetchRelated,
          field
        );
        subquery.push({
          name: field,
          throught: modelField.getRelatedData(),
          query: new QueryBuilder({
            model,
            selectRelated,
            prefetchRelated
          }).create()
        });
      }
    });
    this._subquery = subquery;
  }

  create() {
    this._tableName();
    this._createFields();
    this._createJoins();
    this._createSubquery();
    return this;
  }

  table() {
    return this._tableName();
  }

  fieldsForQuery() {
    const table = this._tableName();
    const fields = this._fields[1].map(f => `${table}.${f} as ${table}.${f}`);
    this._joins
      .map(({ query }) => query.fieldsForQuery())
      .forEach(f => fields.push(...f));
    return fields;
  }

  fieldsForModel() {
    return this._fields[0];
  }

  joins() {
    return this._joins;
  }
}

export default QueryBuilder;

const selectRelatedFieldsForField = (list, field) => {
  return list
    .map(f => {
      const splitted = f.split("__");
      if (splitted[0] === field && splitted.length > 1) {
        return splitted.slice(1).join("__");
      }
      return null;
    })
    .filter(f => f);
};
