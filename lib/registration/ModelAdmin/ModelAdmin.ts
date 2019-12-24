import express from "express";
import * as fs from "fs";
import * as paths from "path";
import { FieldsSelector } from "@vbait/json-schema-model";
import { IModelAdmin } from "../interface/IModelAdmin";
import createDynamicModel from "../createDynamicModel";
import QueryBuilder from "../QueryBuilder";
import parseTableConfig from "../parseTableConfig";
import checkModelToValidTableConfig from "../checkModelToValidTableConfig";
import { ModelDoesNotExistError, ERROR_CODES } from "../errors";
import ListEndpoint from "./ListEndpoint";
import selectorForModel from "./selectorForModel";

class ModelAdmin implements IModelAdmin {
  private _configSourcePath: string;
  private _tableConfig: { columns: any; relationMappings?: any };
  private _listEndpoint: ListEndpoint;
  private _modelFieldsSelector: FieldsSelector;

  // api route
  routeApi: string;

  // DB
  repository: any;
  table?: string;
  m2m?: [string, string, string, string][];
  levelToParse: number = 2;
  selectRelated?: string[] = [];
  prefetchRelated?: string[] = [];

  // Models
  model: any;
  addModel?: any;
  editModel?: any;

  // fields for WEB APP
  listFields: string[] = [];
  listMapLabels: {} = {};
  addFieldsSelector: FieldsSelector;
  editFieldsSelector: FieldsSelector;

  constructor({
    path,
    routeApi,
    table,
    model,
    m2m,
    repository
  }: {
    path: string;
    routeApi?: string;
    table?: string;
    model?: any;
    m2m?: [string, string, string, string][];
    repository?: any;
  }) {
    this._configSourcePath = path;
    this.routeApi = routeApi;
    this.table = table;
    this.model = model;
    this.m2m = m2m || [];
    this.repository = repository;
  }

  private _tableToConfig() {
    if (this._tableConfig) {
      return this._tableConfig;
    }
    if (!this._configSourcePath) {
      throw Error(`${this.constructor.name}: Provide source path for table`);
    }
    try {
      this._tableConfig = parseTableConfig(
        this._configSourcePath,
        this.table,
        this.m2m,
        this.levelToParse
      );
    } catch (err) {
      throw Error(
        `${this.constructor.name}: Provide correct configuration. Error: ${err.message}`
      );
    }
    return this._tableConfig;
  }

  private _modelForList() {
    if (this.model) {
      if (!this.model.__dbTableConfig && this.table) {
        this.model.__dbTableConfig = this._tableToConfig();
        checkModelToValidTableConfig(this.model, this._tableToConfig());
      }
      return this.model;
    }
    if (this.table) {
      this.model = createDynamicModel(
        this.table,
        this._tableToConfig(),
        this.levelToParse
      );
      this.model.__dbTableConfig = this._tableToConfig();
      return this.model;
    }
    throw Error(
      `${this.constructor.name}: Provide model or table (filename from your configuration)`
    );
  }

  private _modelForAdd() {
    return this.addModel || this._modelForList();
  }

  private _modelForEdit() {
    return this.editModel || this._modelForList();
  }

  configForApp() {
    if (!this.addFieldsSelector) {
      this.addFieldsSelector = selectorForModel(this._modelForAdd());
    }
    if (!this.editFieldsSelector) {
      this.editFieldsSelector = selectorForModel(this._modelForEdit());
    }
    if (!this._modelFieldsSelector) {
      this._modelFieldsSelector = selectorForModel(
        this._modelForList(),
        this.selectRelated,
        this.prefetchRelated
      );
    }
    const prefix = this.routeApiPrefix();
    return {
      name: this.name(),
      path: this.routeApiPrefix(),
      canAdd: true,
      canEdit: true,
      canDelete: true,
      listFields: this.listFields,
      listMapLabels: this.listMapLabels,
      selectRelated: this.selectRelated,
      prefetchRelated: this.prefetchRelated,
      endpoints: {
        view: `/${prefix}`,
        add: `/${prefix}`,
        edit: `/${prefix}/:id`,
        editData: `/${prefix}/:id`
      },
      schema: {
        view: this._modelFieldsSelector.getSchema(),
        add: this.addFieldsSelector.getSchema(),
        edit: this.editFieldsSelector.getSchema()
      }
    };
  }

  routeApiPrefix() {
    if (this.routeApi) {
      return this.routeApi;
    }
    const model = this._modelForList();
    if (this._modelForList()) {
      this.routeApi = model.name.replace(/[_,\s]+/g, "-").toLowerCase();
      return this.routeApi;
    }
    throw Error(`${this.constructor.name}: Provide correct routeApi property`);
  }

  name() {
    const model = this._modelForList();
    return model.name;
  }

  routes() {
    const router = express.Router();
    const prefix = this.routeApiPrefix();
    router.get(`/${prefix}/config`, this.configEndpoint);
    // CRUD
    router.post(`/${prefix}`, this.validateOnAdd, this.addEndpoint);
    router.get(`/${prefix}`, this.listEndpoint);
    router.get(`/${prefix}/:id`, this.detailEndpoint);
    router.put(`/${prefix}/:id`, this.validateOnEdit, this.editEndpoint);
    return router;
  }

  // API Endpoints
  configEndpoint = (req, res) => {
    res.status(200).send({
      data: {
        ...this.configForApp()
      }
    });
  };

  listEndpoint = async (req, res, next) => {
    const listEndpoint = this._createListEndpoint();
    const fields = listEndpoint.validateRequestFields(req);
    try {
      const data = await listEndpoint.fetch({ fields });
      res.status(200).send({ data });
    } catch (err) {
      res.status(500).send(err.message);
    }
  };

  detailEndpoint = (req, res, next) => {
    const data = {};
    res.status(200).send({ data });
  };

  editEndpoint = (req, res, next) => {
    res.status(204).send();
  };

  addEndpoint = (req, res, next) => {
    res.status(201).send({ data: 1 });
  };

  validateOnAdd = (req, res, next) => {
    next();
  };

  validateOnEdit = (req, res, next) => {
    next();
  };
  // END API Endpoints

  // Create Endpoints
  private _createListEndpoint = () => {
    if (this._listEndpoint) {
      return this._listEndpoint;
    }
    const model = this._modelForList();
    const query = new QueryBuilder({
      model,
      selectRelated: this.selectRelated,
      prefetchRelated: this.prefetchRelated
    });
    const fields = model.getFields().map(f => f.name);
    const extendFields = this.listFields
      .filter(f => {
        if (!fields.includes(f)) {
          if (!this[f] || typeof this[f] !== "function") {
            throw Error(`Field ${f} doesn't exist`);
          }
          return f;
        }
      })
      .map(f => [f, this[f]]) as [string, Function][];
    return new ListEndpoint({
      repository: this.repository,
      model,
      query,
      extendFields
    });
  };
}

export default ModelAdmin;
