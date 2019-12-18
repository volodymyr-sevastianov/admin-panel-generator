import express from "express";
import Knex from "knex";
import dotenv from "dotenv";
import paths from "path";
import {
  ICreateApp,
  IAppItemConfig,
  IModelAdmin,
  IModelAdminConfig,
  IModelAdminConstructor
} from "./interfaces";
import ModelAdmin from "./ModelAdminOld";
import { ModelDoesNotExistError, ERROR_CODES } from "./errors";
import { resolveConfigsFolder } from "../helpers/config-writer";
import repositories from "../repositories";

dotenv.config();

const createRepository = path => {
  const knexFileName = process.env.KNEX_FILE_CONVENTION_NAME;
  const knexFilePath = paths.resolve(process.cwd(), path, knexFileName);
  const knexConfig = require(knexFilePath);
  const knex = Knex(knexConfig);
  return repositories.makeUniversalRepostitory({ knex });
};

const defaultConfig = {
  section: ["My Models", "models"]
} as IAppItemConfig;

class CreateApp implements ICreateApp {
  private repository: any;
  private path: string;
  private models: { [name: string]: IModelAdmin } = {};
  private sections: {
    [name: string]: { name: string; path: string; models: [IModelAdminConfig] };
  } = {};
  name: string;

  constructor(args: { name: string; path: string }) {
    this.name = args.name;
    this.path = resolveConfigsFolder({ path: args.path });
    this.repository = createRepository(args.path);
  }

  private updateConfig(
    modelAdmin: IModelAdmin,
    config: IAppItemConfig = defaultConfig
  ) {
    const {
      section: [name, path]
    } = config;

    const modelConfig = modelAdmin.getConfig();
    if (this.sections[name]) {
      this.sections[name].models.push(modelConfig);
    } else {
      this.sections[name] = {
        name,
        path,
        models: [modelConfig]
      };
    }
  }

  addTable(tableName: string, config: IAppItemConfig = defaultConfig) {
    // const modelAdmin = ModelAdmin.create(this.path, tableName);
    const modelAdmin = new ModelAdmin(this.path, tableName);
    modelAdmin.addRepository(this.repository);
    this.models[tableName] = modelAdmin;
    this.updateConfig(modelAdmin, config);
  }

  addModelAdmin(
    modelAdminConstructor: IModelAdminConstructor,
    tableName: string,
    config: IAppItemConfig = defaultConfig
  ) {
    const modelAdmin = new modelAdminConstructor(this.path, tableName);
    modelAdmin.addRepository(this.repository);
    this.models[tableName] = modelAdmin;
    this.updateConfig(modelAdmin, config);
  }

  getRoutes() {
    const router = express.Router();
    router.get("/config", this.apiGetConfig);
    router.get("/config/:model", this.apiModelValidate, this.apiGetModelConfig);
    router.get("/:model", this.apiModelValidate, this.apiGetAll);
    router.get("/:model/:id", this.apiModelValidate, this.apiGetDetail);
    router.get(
      "/:model/:id/:field",
      this.apiModelValidate,
      this.apiGetAllForField
    );
    return router;
  }

  apiGetConfig = (req, res) => {
    const config = {
      name: this.name,
      sections: Object.entries(this.sections).map(([, section]) => section)
    };
    res.status(200).send({ data: config });
  };

  apiGetModelConfig = (req, res) => {
    const modelName = req.params.model;
    const modelAdmin = this.models[modelName];
    res.status(200).send({ data: modelAdmin.getFullConfig() });
  };

  apiGetAll = (req, res) => {
    const modelName = req.params.model;
    const modelAdmin = this.models[modelName];
    const schema = modelAdmin.getListFieldsSelector().getSchema();
    modelAdmin.getAll().then(
      data => {
        res.status(200).send({ data, schema });
      },
      err => {
        res.status(400).send(err.message);
      }
    );
  };

  apiGetDetail = (req, res) => {
    const modelName = req.params.model;
    const id = req.params.id;
    const modelAdmin = this.models[modelName];
    const schema = modelAdmin.getFieldsSelector().getSchema();
    modelAdmin.get(id).then(
      data => {
        res.status(200).send({ data, schema });
      },
      err => {
        res.status(400).send(err.message);
      }
    );
  };

  apiGetAllForField = (req, res) => {
    const modelName = req.params.model;
    const id = req.params.id;
    const field = req.params.field;
    const modelAdmin = this.models[modelName];
    modelAdmin.getForField(id, field).then(
      data => {
        res.status(200).send({ data });
      },
      err => {
        res.status(400).send(err);
      }
    );
  };

  apiModelValidate = (req, res, next) => {
    const modelName = req.params.model;
    if (!modelName || !this.models[modelName]) {
      const error = new ModelDoesNotExistError({
        modelName,
        code: ERROR_CODES.MODEL_DOES_NOT_EXIST
      });
      res.status(404).send({
        error: {
          message: error.message,
          code: error.code
        }
      });
      return;
    }
    next();
  };
}

export default CreateApp;
