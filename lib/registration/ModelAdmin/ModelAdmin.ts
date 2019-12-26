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
import ViewEndpoint from "./ViewEndpoint";
import ChangeEndpoint from "./ChangeEndpoint";
import selectorForModel from "./selectorForModel";

class ModelAdmin implements IModelAdmin {
  private _configSourcePath: string;
  private _tableConfig: { columns: any; relationMappings?: any };
  private _viewEndpoint: ViewEndpoint;
  private _changeEndpoint: ChangeEndpoint;
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
  listLinkedFields: string[] = [];
  addFieldsSelector: FieldsSelector;
  editFieldsSelector: FieldsSelector;
  addFormFields: string[] = [];
  editFormFields: string[] = [];

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
    if (this.addModel) {
      if (!this.addModel.__dbTableConfig && this.table) {
        this.addModel.__dbTableConfig = this._tableToConfig();
        checkModelToValidTableConfig(this.addModel, this._tableToConfig());
      }
      return this.addModel;
    }
    return this._modelForList();
  }

  private _modelForEdit() {
    if (this.editModel) {
      if (!this.editModel.__dbTableConfig && this.table) {
        this.editModel.__dbTableConfig = this._tableToConfig();
        checkModelToValidTableConfig(this.editModel, this._tableToConfig());
      }
      return this.editModel;
    }
    return this._modelForList();
  }

  formFields() {
    const addModel = this._modelForAdd();
    const editModel = this._modelForEdit();

    const addFormFields = this.addFormFields.length
      ? this.addFormFields
      : addModel
          .getFields()
          .filter(field => !field.exclude)
          .map(field => field.name);

    const editFormFields = this.editFormFields.length
      ? this.editFormFields
      : editModel
          .getFields()
          .filter(field => !field.exclude)
          .map(field => field.name);
    return {
      addFormFields,
      editFormFields
    };
  }

  configSimpleForApp() {
    return {
      name: this.name(),
      path: this.routeApiPrefix(),
      canAdd: true,
      canEdit: true,
      canDelete: true
    };
  }

  configForApp() {
    const model = this._modelForList();
    const addModel = this._modelForAdd();
    const editModel = this._modelForEdit();

    if (!this.addFieldsSelector) {
      this.addFieldsSelector = selectorForModel(addModel);
    }
    if (!this.editFieldsSelector) {
      this.editFieldsSelector = selectorForModel(editModel);
    }
    if (!this._modelFieldsSelector) {
      this._modelFieldsSelector = selectorForModel(
        model,
        this.selectRelated,
        this.prefetchRelated
      );
    }
    const prefix = this.routeApiPrefix();
    const listFields = this.listFields.length
      ? this.listFields
      : ["__display__"];
    const listLinkedFields = this.listLinkedFields.length
      ? this.listLinkedFields
      : [listFields[0]];

    return {
      name: this.name(),
      path: this.routeApiPrefix(),
      canAdd: true,
      canEdit: true,
      canDelete: true,
      listFields,
      ...this.formFields(),
      listMapLabels: { ...this.listMapLabels, __display__: model.name },
      listLinkedFields,
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
    return model.displayName || model.name;
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
    router.get(`/${prefix}/:id/initial`, this.editInitialEndpoint);
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
    const viewEndpoint = this._createViewEndpoint();
    const fields = viewEndpoint.validateRequestFields(req);
    try {
      const data = await viewEndpoint.fetch({ fields });
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

  editInitialEndpoint = (req, res, next) => {
    res.status(200).send({ data: "" });
  };

  addEndpoint = (req, res, next) => {
    const changeEndpoint = this._createChangeEndpoint();
    try {
      changeEndpoint.create(req.body);
      res.status(201).send({ data: 1 });
    } catch (err) {
      res.status(500).send(err.message);
    }
  };

  validateOnAdd = (req, res, next) => {
    next();
  };

  validateOnEdit = (req, res, next) => {
    next();
  };
  // END API Endpoints

  // Create Endpoints
  private _createViewEndpoint = () => {
    if (this._viewEndpoint) {
      return this._viewEndpoint;
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
    this._viewEndpoint = new ViewEndpoint({
      repository: this.repository,
      model,
      query,
      extendFields
    });
    return this._viewEndpoint;
  };

  private _createChangeEndpoint = () => {
    if (this._changeEndpoint) {
      return this._changeEndpoint;
    }
    this._changeEndpoint = new ChangeEndpoint({
      repository: this.repository,
      addModel: this._modelForAdd(),
      editModel: this._modelForEdit(),
      ...this.formFields()
    });
    return this._changeEndpoint;
  };
}

export default ModelAdmin;
