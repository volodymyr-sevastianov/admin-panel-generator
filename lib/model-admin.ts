import * as fs from "fs";
import * as path from "path";
import { createModel, NumberField } from "@vbait/json-schema-model";

class ModelAdmin {
  private repository: any;
  tableName: string;
  modelName: string;
  model: any;
  section: { name: string; path?: string };

  constructor({
    configFileName,
    repository,
    configFolderPath,
    section = { name: "models", path: "models" }
  }) {
    this.repository = repository;
    let configFilePath = path.resolve(
      configFolderPath,
      configFileName + ".json"
    );
    this.tableName = configFileName;
    this.section = section.path
      ? section
      : { ...section, path: section.name.toLowerCase().replace(" ", "-") };
  }

  getAll() {
    return this.repository.findAll({ tableName: this.tableName });
  }

  insert({ data }) {
    return this.repository.insert({ data, tableName: this.tableName });
  }

  update({ data }) {
    return this.repository.update({ data, tableName: this.tableName });
  }

  delete({ id }) {
    return this.repository.del({ id, tableName: this.tableName });
  }

  getModel() {
    if (this.model) {
      return this.model;
    }
    const modelName = this.tableName
      .split("_")
      .map(n => n[0].toUpperCase() + n.slice(1))
      .join(" ");
    this.model = createModel(modelName, null, {
      id: new NumberField({ primary: true })
    });
    return this.model;
  }

  getModelPath() {
    const model = this.getModel();
    const path = model.name.replace(" ", "-").toLowerCase();
    return path;
  }

  getFullPath() {
    return `${this.section.path}/${this.getModelPath()}`;
  }

  getConfig() {
    const model = this.getModel();
    return {
      tableName: this.tableName,
      name: model.name,
      path: this.getModelPath()
    };
  }

  getFullConfig() {}
}

export default ModelAdmin;
