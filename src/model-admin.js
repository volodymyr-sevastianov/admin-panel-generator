import fs from "fs";
import path from "path";
import { CONFIG_FOLDER_PATH } from "./constants";

class ModelAdmin {
  constructor({ configFileName, repository }) {
    this.repository = repository;
    let configFilePath = path.resolve(
      CONFIG_FOLDER_PATH,
      configFileName + ".json"
    );
    this.modelName = configFileName;
    this.model = JSON.parse(fs.readFileSync(configFilePath));
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
