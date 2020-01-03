import express from "express";
import * as fs from "fs";
import * as paths from "path";
import { FieldsSelector, ValidationError } from "@vbait/json-schema-model";
import { IModelAdmin } from "../interface/IModelAdmin";
import createDynamicModel from "../createDynamicModel";
import QueryBuilder from "../QueryBuilder";
import parseTableConfig from "../parseTableConfig";
import checkModelToValidTableConfig from "../checkModelToValidTableConfig";
import { ModelDoesNotExistError, ERROR_CODES } from "../errors";
import selectorForModel from "./selectorForModel";
import { displayModelItem, tableName } from "../utils";

class ModelAdmin implements IModelAdmin {
  private _configSourcePath: string;
  private _tableConfig: { columns: any; relationMappings?: any };
  private _modelFieldsSelector: FieldsSelector;
  private _addFieldsSelector: FieldsSelector;
  private _editFieldsSelector: FieldsSelector;

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
      if (!this.model.__table__) {
        this.model.__table__ = this.model.name;
      }
      return this.model;
    }
    if (this.table) {
      this.model = createDynamicModel(
        this.table,
        this._tableToConfig(),
        this.levelToParse
      );
      this.model.__table__ = this.table;
      return this.model;
    }
    throw Error(
      `${this.constructor.name}: Provide model or table (filename from your configuration)`
    );
  }

  private _modelForAdd() {
    if (this.addModel) {
      if (!this.addModel.__table__) {
        this.addModel.__table__ = this.addModel.name;
      }
      return this.addModel;
    }
    return this._modelForList();
  }

  private _modelForEdit() {
    if (this.editModel) {
      if (!this.editModel.__table__) {
        this.editModel.__table__ = this.editModel.name;
      }
      return this.editModel;
    }
    return this._modelForList();
  }

  protected _listData = async ({
    where = []
  }: {
    where?: [string, string, string][];
  }) => {
    const fields = this.model.getFields().map(f => f.name);
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

    const queryBuilder = new QueryBuilder({
      model: this.model,
      selectRelated: this.selectRelated,
      prefetchRelated: this.prefetchRelated
    }).create();

    where.forEach(([property, value, operator]) => {
      queryBuilder.addWhere([property, value, operator]);
    });

    const results = await this.repository.find(
      { queryBuilder },
      repositoryValue => {
        const item = new this.model(repositoryValue, {
          useDefault: false,
          passWithErrors: true
        });
        const newItem = item.toJSFull();
        Object.assign(newItem, {
          __display__: item.__display__ ? item.__display__() : item.pk
        });
        if (extendFields.length) {
          Object.assign(
            newItem,
            extendFields.reduce((acc, [name, func]) => {
              acc[name] = func(item);
              return acc;
            }, {})
          );
        }
        return newItem;
      }
    );
    return results;
  };

  protected _detailData = async id => {
    const property = `${this.model.__table__}.${
      this.model.getPrimaryField().sourceName
    }`;
    const filter = [property, id, "="] as [string, string, string];
    return this._listData({ where: [filter] });
  };

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
    return this.model.__display__ || this.model.name;
  }

  init() {
    this.model = this._modelForList();
    this.addModel = this._modelForAdd();
    this.editModel = this._modelForEdit();

    if (!this._addFieldsSelector) {
      const relatedFields = this.addModel.getRelatedFields();
      const selectRelated = relatedFields
        .filter(field => !field.hasMany())
        .map(field => field.name);
      const prefetchRelated = relatedFields
        .filter(field => field.hasMany())
        .map(field => field.name);
      this._addFieldsSelector = selectorForModel(
        this.addModel,
        selectRelated,
        prefetchRelated
      );
    }
    if (!this._editFieldsSelector) {
      const relatedFields = this.editModel.getRelatedFields();
      const selectRelated = relatedFields
        .filter(field => !field.hasMany())
        .map(field => field.name);
      const prefetchRelated = relatedFields
        .filter(field => field.hasMany())
        .map(field => field.name);
      this._editFieldsSelector = selectorForModel(
        this.editModel,
        selectRelated,
        prefetchRelated
      );
    }
    if (!this._modelFieldsSelector) {
      this._modelFieldsSelector = selectorForModel(
        this.model,
        this.selectRelated,
        this.prefetchRelated
      );
    }

    if (!this.listFields.length) {
      this.listFields = ["__display__"];
    }

    if (!this.listLinkedFields.length) {
      this.listLinkedFields = [this.listFields[0]];
    }

    if (!this.addFormFields.length) {
      this.addFormFields = this.addModel
        .getFields()
        .filter(field => !field.exclude)
        .map(field => field.name);
    }

    if (!this.editFormFields.length) {
      this.editFormFields = this.editModel
        .getFields()
        .filter(field => !field.exclude)
        .map(field => field.name);
    }

    Object.assign(this.listMapLabels, { __display__: this.model.name });

    this.routeApiPrefix();
    return this;
  }

  configSimpleForApp() {
    return {
      name: this.name(),
      path: this.routeApi,
      canAdd: true,
      canEdit: true,
      canDelete: true
    };
  }

  configForApp() {
    return {
      name: this.name(),
      path: this.routeApi,
      canAdd: true,
      canEdit: true,
      canDelete: true,
      listFields: this.listFields,
      addFormFields: this.addFormFields,
      editFormFields: this.editFormFields,
      listMapLabels: this.listMapLabels,
      listLinkedFields: this.listLinkedFields,
      selectRelated: this.selectRelated,
      prefetchRelated: this.prefetchRelated,
      schema: {
        view: this._modelFieldsSelector.getSchema(),
        add: this._addFieldsSelector.getSchema(),
        edit: this._editFieldsSelector.getSchema()
      }
    };
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
    router.get(`/${prefix}/fields/:field`, this.fieldListEndpoint);
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
    try {
      const results = await this._listData({});
      const fields = undefined;
      if (fields && fields.length) {
        const listFields = [...fields];
        const pk = this.model.getPrimaryField().name;
        if (!listFields.includes(pk)) {
          listFields.unshift(pk);
        }
        return results.map(item => {
          const newItem = {};
          listFields.forEach(f => {
            newItem[f] = item[f];
          });
          return newItem;
        });
      }
      res.status(200).send({ data: results });
    } catch (err) {
      res.status(500).send(err.message);
    }
  };

  editInitialEndpoint = async (req, res, next) => {
    const { id } = req.params;
    const model = this.editModel;
    const pk = model.getPrimaryField().sourceName;

    const queryBuilder = QueryBuilder.createFromSelector(
      this._editFieldsSelector
    )
      .create()
      .addWhere([`${model.__table__}.${pk}`, id, "="]);

    try {
      const data = await this.repository.find({ queryBuilder });
      if (!data.length) {
        res.status(404).send();
      } else {
        const instance = new model(data[0]);
        const detail = Object.assign(instance.toJSFull(), {
          __display__: displayModelItem(instance)
        });
        const schema = req.query.hasOwnProperty("withSchema")
          ? this._editFieldsSelector.getSchema()
          : undefined;
        res.status(200).send({ data: detail, schema });
      }
    } catch (err) {
      res.status(500).send();
    }
  };

  fieldListEndpoint = async (req, res, next) => {
    const { field: fieldName } = req.params;
    const model = this._modelForEdit();
    const field = model.getFieldByName(fieldName);
    if (!field || field.isLocal()) {
      return res.status(400).send(`Field ${fieldName} is not related.`);
    }
    const relatedModel = field.getRelatedModel();
    const queryBuilder = new QueryBuilder({
      model: relatedModel
    }).create();

    const data = await this.repository.find({ queryBuilder }, r => {
      const instance = new relatedModel(r);
      return Object.assign(instance.toJSFull(), {
        __display__: displayModelItem(instance)
      });
    });
    const schema = req.query.hasOwnProperty("withSchema")
      ? relatedModel.getSchema()
      : undefined;
    res.status(200).send({ data, schema });
  };

  detailEndpoint = async (req, res, next) => {
    const { id } = req.params;
    try {
      const data = await this._detailData(id);
      if (!data.length) {
        res.status(404).send();
      } else {
        res.status(200).send({ data: data[0] });
      }
    } catch (err) {
      res.status(500).send(err.message);
    }
  };

  editEndpoint = async (req, res, next) => {
    const { id } = req.params;
    const table = this.editModel.__table__;
    try {
      const pkName = this.editModel.getPrimaryField().sourceName;
      const m2mFields = this.editModel
        .getRelatedFields()
        .filter(f => this.editFormFields.includes(f.name) && f.hasMany());
      const item = new this.editModel(req.body).clean(
        false,
        this.addFormFields
      );
      const source = item.toSourceFields({
        fields: this.editFormFields,
        emptyValue: null
      });
      const subquery = [];
      m2mFields.forEach(f => {
        const { name, from, to } = f.getRelatedData();
        subquery.push({
          table: name,
          from,
          to,
          fromValue: id,
          toValue: source[f.sourceName] || []
        });
        delete source[f.sourceName];
      });

      await this.repository.editWithTransaction({
        table,
        where: [[pkName, id]],
        values: source,
        returning: pkName,
        subquery
      });
      res.status(204).send();
    } catch (err) {
      if (err instanceof ValidationError) {
        return res.status(400).send(err.errors);
      }
      res.status(500).send(err.message);
    }
  };

  addEndpoint = async (req, res, next) => {
    const table = this.addModel.__table__;
    try {
      const pkName = this.addModel.getPrimaryField().sourceName;
      const m2mFields = this.addModel
        .getRelatedFields()
        .filter(f => this.addFormFields.includes(f.name) && f.hasMany());
      const item = new this.addModel(req.body).clean(false, this.addFormFields);
      const source = item.toSourceFields({ fields: this.addFormFields });
      const subquery = [];
      m2mFields.forEach(f => {
        const { name, from, to } = f.getRelatedData();
        subquery.push({
          table: name,
          from,
          to,
          toValue: source[f.sourceName] || []
        });
        delete source[f.sourceName];
      });

      const ids = await this.repository.addWithTransaction({
        table,
        values: source,
        returning: pkName,
        subquery
      });
      res.status(201).send({ data: ids[0] });
    } catch (err) {
      if (err instanceof ValidationError) {
        return res.status(400).send(err.errors);
      }
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
}

export default ModelAdmin;
