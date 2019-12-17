import * as fs from "fs";
import * as paths from "path";
import { FieldsSelector } from "@vbait/json-schema-model";
import { IModelAdmin } from "./interfaces";
import createDynamicModel from "./createDynamicModel";
import Query from "./Query";
import parseTableConfig from "./parseTableConfig";

class ModelAdmin implements IModelAdmin {
  private repository: any;
  private sourcePath: string;
  private tableName: string;
  private fieldsSelector: FieldsSelector;
  private listFieldsSelector: FieldsSelector;
  model: any;
  fields: string[] | FieldsSelector;
  listFields: string[] | FieldsSelector;

  constructor(sourcePath: string, tableName: string) {
    this.sourcePath = sourcePath;
    this.tableName = tableName;
  }

  private getModel(): any {
    if (this.model) {
      if (!this.model._relationMappings && this.tableName) {
        this.model._relationMappings = parseTableConfig(
          this.sourcePath,
          this.tableName
        ).relationMappings;
      }
      return this.model;
    }
    if (!this.model && !this.tableName) {
      throw Error(
        "Provide your model in ModelAdmin class or table name configuration"
      );
    }
    if (!this.model) {
      const tableConfig = parseTableConfig(this.sourcePath, this.tableName);
      this.model = createDynamicModel(this.tableName, tableConfig);
      this.model._relationMappings = tableConfig.relationMappings;
    }
    return this.model;
  }

  addRepository(repository) {
    this.repository = repository;
  }

  getConfig() {
    const model = this.getModel();
    return {
      tableName: this.tableName,
      name: model.name,
      path: this.getModelPath()
    };
  }

  getFullConfig() {
    return {
      ...this.getConfig(),
      schema: this.model.getSchema()
    };
  }

  getFieldsSelector() {
    if (!this.fieldsSelector) {
      this.fieldsSelector =
        this.fields instanceof FieldsSelector
          ? this.fields
          : new FieldsSelector(this.model, this.fields);
    }
    return this.fieldsSelector;
  }

  getListFieldsSelector() {
    if (!this.listFieldsSelector) {
      this.listFieldsSelector =
        this.listFields instanceof FieldsSelector
          ? this.listFields
          : new FieldsSelector(this.model, this.listFields);
    }
    return this.listFieldsSelector;
  }

  getModelPath() {
    const path = this.model.name.replace(/[_,\s]+/g, "-").toLowerCase();
    return path;
  }

  getAll() {
    const query = new Query(
      this.tableName,
      this.getListFieldsSelector(),
      this.repository
    );
    return query.apply({ withPrefetch: true }).then(results => {
      return results.map(result => {
        return new this.model(result).toJSFull();
      });
    });
  }

  get(id) {
    const pk = this.model.getPrimaryField();
    const query = new Query(
      this.tableName,
      this.getFieldsSelector(),
      this.repository
    );
    return query
      .filter({ [pk.name]: id })
      .apply({ withPrefetch: true })
      .then(results => {
        if (results.length) {
          return new this.model(results[0]).toJS();
        }
        throw Error("Not found");
      });
  }

  getForField(id, field) {
    console.log(field, this.model.getFieldByName(field));
    return Promise.resolve();
  }
}

export default ModelAdmin;
