import * as fs from "fs";
import * as paths from "path";
import { IModelAdmin } from "./interfaces";
import createDynamicModel from "./createDynamicModel";

class ModelAdmin implements IModelAdmin {
  private repository: any;
  private tableName: string;
  model: any;

  static create(path: string, tableName: string) {
    let tableConfig;
    try {
      const configFilePath = paths.resolve(path, `${tableName}.json`);
      tableConfig = JSON.parse(String(fs.readFileSync(configFilePath)));
    } catch (e) {
      throw new Error(
        "You should run 'yarn generate' script to get all neccessary config files!"
      );
    }
    const self = new ModelAdmin(tableName);
    self.model = createDynamicModel(tableName, tableConfig);
    return self;
  }

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  addRepository(repository) {
    this.repository = repository;
    if (!this.model) {
      throw Error("Add Model to your ModelAdmin class");
    }
  }

  getConfig() {
    return {
      tableName: this.tableName,
      name: this.model.name,
      path: this.getModelPath()
    };
  }

  getFullConfig() {
    return {
      ...this.getConfig(),
      schema: this.model.getSchema()
    };
  }

  getModelPath() {
    const path = this.model.name.replace(/[_,\s]+/g, "-").toLowerCase();
    return path;
  }

  getAll() {
    const result = this.repository.findAll({ tableName: this.tableName });
    return result;
  }

  get(id) {
    const result = this.repository.findOne({ tableName: this.tableName, id });
    return result.then(data => {
      const obj = new this.model(data);
      return obj.toJS();
    });
  }
}

export default ModelAdmin;
