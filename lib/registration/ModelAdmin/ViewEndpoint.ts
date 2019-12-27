import ApiEndpoint from "./ApiEndpoint";
import QueryBuilder from "../QueryBuilder";

class ViewEndpoint {
  private _query: QueryBuilder;
  repository: any;
  model: any;
  extendFields: [string, Function][];
  selectRelated: string[];
  prefetchRelated: string[];

  constructor({
    repository,
    model,
    extendFields = [],
    selectRelated = [],
    prefetchRelated = []
  }: {
    repository: any;
    model: any;
    extendFields?: [string, Function][];
    selectRelated?: string[];
    prefetchRelated?: string[];
  }) {
    this.repository = repository;
    this.model = model;
    this.selectRelated = selectRelated;
    this.prefetchRelated = prefetchRelated;
    this.extendFields = extendFields;

    this._query = new QueryBuilder({
      model: this.model,
      selectRelated: this.selectRelated,
      prefetchRelated: this.prefetchRelated
    }).create();
  }

  protected async _fetch() {
    return this.repository.find(
      { queryBuilder: this._query },
      repositoryValue => {
        const item = new this.model(repositoryValue, {
          useDefault: false,
          passWithErrors: true
        });
        const newItem = item.toJSFull();
        Object.assign(newItem, {
          __display__: item.__display__ ? item.__display__() : item.pk
        });
        if (this.extendFields.length) {
          Object.assign(
            newItem,
            this.extendFields.reduce((acc, [name, func]) => {
              acc[name] = func(item);
              return acc;
            }, {})
          );
        }
        return newItem;
      }
    );
  }

  query() {
    return this._query;
  }

  async fetch(args: { fields?: string[] } = {}) {
    const results = await this._fetch();

    const { fields } = args;
    if (fields && fields.length) {
      const listFields = [...fields];
      const pk = this.model.getPrimaryField().name;
      if (!listFields.includes(pk)) {
        listFields.unshift(pk);
      }
      return results.map(item => {
        const newItem = {};
        listFields.forEach(f => {
          newItem[f] = item[f];
        });
        return newItem;
      });
    }
    return results;
  }

  validateRequestFields = req => {
    const modelFields = this.model.getFields().map(f => f.name);
    const extendFields = this.extendFields.map(([name]) => name);
    return [];
  };
}
class ViewEndpoint1 extends ApiEndpoint {
  protected _query: QueryBuilder;
  protected _extendFields: [string, Function][] = [];

  constructor({
    query,
    extendFields = [],
    ...rest
  }: {
    repository: any;
    model: any;
    query: QueryBuilder;
    extendFields: [string, Function][];
  }) {
    super(rest);
    this._query = query.create();
    this._extendFields = extendFields;
  }

  protected async _fetch() {
    return this._repository.find(
      { queryBuilder: this._query },
      repositoryValue => {
        const item = new this._model(repositoryValue, {
          useDefault: false,
          passWithErrors: true
        });
        const newItem = item.toJSFull();
        Object.assign(newItem, {
          __display__: item.__display__ ? item.__display__() : item.pk
        });
        if (this._extendFields.length) {
          Object.assign(
            newItem,
            this._extendFields.reduce((acc, [name, func]) => {
              acc[name] = func(item);
              return acc;
            }, {})
          );
        }
        return newItem;
      }
    );
  }

  async fetch(args: { fields?: string[] } = {}) {
    const results = await this._fetch();

    const { fields } = args;
    if (fields && fields.length) {
      const listFields = [...fields];
      const pk = this._model.getPrimaryField().name;
      if (!listFields.includes(pk)) {
        listFields.unshift(pk);
      }
      return results.map(item => {
        const newItem = {};
        listFields.forEach(f => {
          newItem[f] = item[f];
        });
        return newItem;
      });
    }
    return results;
  }

  validateRequestFields = req => {
    const modelFields = this._model.getFields().map(f => f.name);
    const extendFields = this._extendFields.map(([name]) => name);
    return [];
  };
}

export default ViewEndpoint;
