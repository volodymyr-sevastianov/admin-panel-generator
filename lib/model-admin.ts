import * as fs from "fs";
import * as path from "path";
import { createModel } from "./helpers/create-model";

class ModelAdmin {
  private repository: any;
  modelName: string;
  model: any;

  constructor({ configFileName, repository, configFolderPath, customModel }) {
    this.repository = repository;
    let configFilePath = path.resolve(
      configFolderPath,
      configFileName + ".json"
    );
    this.modelName = configFileName;
    const rawModel = JSON.parse(fs.readFileSync(configFilePath).toString());
    this.model = customModel
      ? customModel
      : createModel({ rawModel, modelName: this.modelName });
  }

  getAll() {
    return this.repository.findAll({ tableName: this.modelName });
  }

  insert({ data }) {
    return this.repository.insert({ data, tableName: this.modelName });
  }

  update({ data }) {
    return this.repository.update({ data, tableName: this.modelName });
  }

  delete({ id }) {
    return this.repository.del({ id, tableName: this.modelName });
  }
}

export default ModelAdmin;
