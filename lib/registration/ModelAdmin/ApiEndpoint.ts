import QueryBuilder from "../QueryBuilder";

abstract class ApiEndpoint {
  protected _repository: any;
  protected _model?: any;

  constructor({ repository, model }: { repository: any; model?: any }) {
    this._repository = repository;
    this._model = model;
  }
}

export default ApiEndpoint;
