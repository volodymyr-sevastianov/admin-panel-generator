import relatedFieldsForField from "./relatedFieldsForField";

class QueryBuilder {
  private _table: string;
  private _fields: string[][] = [[], []];
  private _whereIn: string[][] = [];
  private _where: string[][] = [];
  private _joins: {
    name: string;
    sourceName: string;
    type: string;
    query?: QueryBuilder;
    fields?: string[];
  }[] = [];
  private _subquery: { name: string; throught: any; query: QueryBuilder }[];

  model: any;
  selectRelated: string[];
  prefetchRelated: string[];
  prevJoin?: string;

  constructor({
    model,
    selectRelated,
    prefetchRelated,
    prevJoin
  }: {
    model: any;
    selectRelated: string[];
    prefetchRelated: string[];
    prevJoin?: string;
  }) {
    this.model = model;
    this.selectRelated = selectRelated;
    this.prefetchRelated = prefetchRelated;
    this.prevJoin = prevJoin;
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
      if (!this.model.getFieldByName(field.split("__")[0])) {
        throw Error(`selectRelated: bad name ${field}`);
      }
      const modelField = this.model.getFieldByName(field);
      if (!modelField) return;
      const model = modelField.getRelatedModel();
      const selectRelated = relatedFieldsForField(this.selectRelated, field);
      const prefetchRelated = relatedFieldsForField(
        this.prefetchRelated,
        field
      );
      const joinType =
        this.prevJoin || (modelField.required ? "inner" : "left");
      const queryBuilder = new QueryBuilder({
        model,
        selectRelated,
        prefetchRelated
      }).create();
      joins.push({
        name: field,
        // sourceName: modelField.sourceName,
        type: joinType,
        args: [
          model.name,
          `${table}.${modelField.sourceName}`,
          `${queryBuilder.table()}.${queryBuilder.modelPkSourceName()}`
        ],
        query: new QueryBuilder({
          model,
          selectRelated,
          prefetchRelated,
          prevJoin: joinType
        }).create()
      });
    });
    this._joins = joins;
  }

  private _createSubquery() {
    const subquery: any[] = [];
    this.prefetchRelated.forEach((field, index) => {
      const modelField = this.model.getFieldByName(field);
      if (modelField) {
        const model = modelField.getRelatedModel();
        const selectRelated = relatedFieldsForField(this.selectRelated, field);
        const prefetchRelated = relatedFieldsForField(
          this.prefetchRelated,
          field
        );
        const throught = modelField.getRelatedData();
        const queryBuilder = new QueryBuilder({
          model,
          selectRelated,
          prefetchRelated
        }).create();
        const join = {
          name: `_subquery_${index}`,
          type: "inner",
          args: [
            throught.name,
            `${queryBuilder.table()}.${queryBuilder.modelPkSourceName()}`,
            `${throught.name}.${throught.to}`
          ],
          fields: [`${throught.name}.${throught.from}`]
        };
        queryBuilder.addJoin(join);
        subquery.push({
          name: field,
          whereInProperty: `${throught.name}.${throught.from}`,
          query: queryBuilder,
          joinName: `_subquery_${index}`,
          equalTo: `${throught.name}.${throught.from}`
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

  addJoin(join) {
    this._joins.push(join);
    return this;
  }

  addWhereIn(args: [string, string]) {
    this._whereIn.push(args);
  }

  table() {
    return this._tableName();
  }

  modelName() {
    return this.model.name;
  }

  fieldsForQuery() {
    const table = this._tableName();
    const fields = this._fields[1].map(f => `${table}.${f} as ${table}.${f}`);
    this._joins
      .map(({ query, fields = [] }) =>
        query ? query.fieldsForQuery() : fields.map(f => `${f} as ${f}`)
      )
      .forEach(f => fields.push(...f));
    return fields;
  }

  fieldsForModel() {
    return this._fields[0];
  }

  joins() {
    return this._joins;
  }

  subquery() {
    return this._subquery;
  }

  whereIn() {
    return this._whereIn;
  }

  where() {
    return this._where;
  }

  modelPkSourceName() {
    return this.model.getPrimaryField().sourceName;
  }
}

export default QueryBuilder;
