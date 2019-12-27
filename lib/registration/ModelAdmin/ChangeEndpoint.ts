import ApiEndpoint from "./ApiEndpoint";

class ChangeEndpoint {
  repository: any;
  addModel: any;
  editModel: any;
  addFormFields: string[];
  editFormFields: string[];

  constructor({
    repository,
    addModel,
    editModel,
    addFormFields,
    editFormFields
  }: {
    repository: any;
    addModel: any;
    editModel: any;
    addFormFields: string[];
    editFormFields: string[];
  }) {
    this.repository = repository;
    this.addModel = addModel;
    this.editModel = editModel;
    this.addFormFields = addFormFields;
    this.editFormFields = editFormFields;
  }

  async create(values: any) {
    const table = this.addModel.__table__;
    return this.repository.add(table, values);
  }
}

export default ChangeEndpoint;
