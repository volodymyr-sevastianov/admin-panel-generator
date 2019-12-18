import express from "express";
import * as fs from "fs";
import * as paths from "path";
import { FieldsSelector } from "@vbait/json-schema-model";
import { IModelAdmin } from "./interfaces";
import createDynamicModel from "./createDynamicModel";
import Query from "./Query";
import parseTableConfig from "./parseTableConfig";

class ModelAdmin {
  private _configSourcePath: string;
  private _tableConfig: { columns: any; relationMappings?: any };

  // api route
  routeApi: string;

  // DB table name
  table?: string;
  m2m?: [string, string, string, string][];

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
    this._configSourcePath =
      path ||
      "/Users/flamps/Documents/WORK/Node/Shared/admin-panel-generator/companies-admin/configs";
    this.routeApi = routeApi;
    this.table = table;
    this.model = model;
    this.m2m = m2m || [
      [
        "people",
        "companies_companies",
        "companies_companies_people",
        "companies_user"
      ],
      [
        "parents",
        "companies_user",
        "companies_user_parents",
        "companies_parents"
      ]
    ];
  }

  private _tableToConfig() {
    if (!this._configSourcePath) {
      throw Error(`${this.constructor.name}: Provide source path for table`);
    }
    this._tableConfig = parseTableConfig(this._configSourcePath, this.table);
    return this._tableConfig;
  }

  private _modelForList() {
    if (this.model) {
      if (!this.model.__dbTableConfig && this.table) {
        this.model.__dbTableConfig = this._tableToConfig();
      }
      return this.model;
    }
    if (this.table) {
      this._tableToConfig();
      this.model = createDynamicModel(this.table, this._tableConfig);
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

  private routeApiPrefix() {
    if (this.routeApi) {
      return this.routeApi;
    }
    // if (this.table) {
    //   this.routeApi = this.table;
    //   return this.routeApi;
    // }
    const model = this._modelForList();
    if (this._modelForList()) {
      this.routeApi = model.name;
      return this.routeApi;
    }
    throw Error(`${this.constructor.name}: Provide correct routeApi property`);
  }

  routes() {
    const router = express.Router();
    const prefix = this.routeApiPrefix();
    console.log(this.model);
    router.get(`${prefix}/config`, () => {});
    // CRUD
    router.post(`${prefix}`, this.validateOnAdd, this.addEndpoint);
    router.get(`${prefix}`, this.listEndpoint);
    router.get(`${prefix}/:id`, this.detailEndpoint);
    router.put(`${prefix}/:id`, this.validateOnEdit, this.editEndpoint);
    return router;
  }

  // API Endpoints
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
