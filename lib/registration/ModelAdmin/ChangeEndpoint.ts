import ApiEndpoint from "./ApiEndpoint";

class ChangeEndpoint extends ApiEndpoint {
  protected _addModel: any;
  protected _editModel: any;
  protected _addFormFields: string[];
  protected _editFormFields: string[];

  constructor({
    addModel,
    editModel,
    addFormFields,
    editFormFields,
    ...rest
  }: {
    addModel: any;
    editModel: any;
    addFormFields: string[];
    editFormFields: string[];
    repository: any;
    model?: any;
  }) {
    super(rest);
    this._addModel = addModel;
    this._editModel = editModel;
    this._addFormFields = addFormFields;
    this._editFormFields = editFormFields;
  }

  tableNameForModel(model: any) {
    let table;
    if (model.__dbTableConfig) {
      table = model.__dbTableConfig.tableName;
    } else {
      table = model.name;
    }
    return table;
  }

  async create(values: any) {
    const table = this.tableNameForModel(this._addModel);
    return this._repository.add(table, values);
  }
}

export default ChangeEndpoint;
