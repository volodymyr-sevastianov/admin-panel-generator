import express from "express";
import * as fs from "fs";
import * as paths from "path";
import { FieldsSelector } from "@vbait/json-schema-model";
// import { IModelAdmin } from "./interfaces";
import { IModelAdmin } from "./interface/IModelAdmin";
import createDynamicModel from "./createDynamicModel";
import Query from "./Query";
import parseTableConfig from "./parseTableConfig";
import checkModelToValidTableConfig from "./checkModelToValidTableConfig";
import { ModelDoesNotExistError, ERROR_CODES } from "./errors";

class ModelAdmin implements IModelAdmin {
  private _configSourcePath: string;
  private _tableConfig: { columns: any; relationMappings?: any };

  // api route
  routeApi: string;

  // DB
  repository: any;
  table?: string;
  m2m?: [string, string, string, string][];
  levelToParse: number = 2;

  // Models
  model: any;
  addModel?: any;
  editModel?: any;

  // fields for WEB APP
  listFields: string[];
  addFields: string[];
  editFields: string[];

  constructor({
    path,
    routeApi,
    table,
    model,
    m2m
  }: {
    path: string;
    routeApi?: string;
    table?: string;
    model?: any;
    m2m?: [string, string, string, string][];
  }) {
    this._configSourcePath = path;
    this.routeApi = routeApi;
    this.table = table;
    this.model = model;
    this.m2m = m2m || [];
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
        `${this.constructor.name}: Provide correct configuration. Error: ${
          err.message
        }`
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
      `${
        this.constructor.name
      }: Provide model or table (filename from your configuration)`
    );
  }

  private _modelForAdd() {
    return this.addModel || this._modelForList();
  }

  private _modelForEdit() {
    return this.editModel || this._modelForList();
  }

  configForApp() {
    return {
      name: this.name(),
      path: this.routeApiPrefix(),
      canAdd: true,
      canEdit: true,
      canDelete: true
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
  configEndpoint(req, res) {
    res.status(200).send({ data: "CONFIG" });
  }

  listEndpoint(req, res, next) {
    const data = [];
    res.status(200).send({ data });
  }

  detailEndpoint(req, res, next) {
    const data = {};
    res.status(200).send({ data });
  }

  editEndpoint(req, res, next) {
    res.status(204).send();
  }

  addEndpoint(req, res, next) {
    res.status(201).send({ data: 1 });
  }

  validateOnAdd(req, res, next) {
    next();
  }

  validateOnEdit(req, res, next) {
    next();
  }
  // END API Endpoints
}

export default ModelAdmin;
