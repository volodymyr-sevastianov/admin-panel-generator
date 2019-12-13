import express from "express";
import Knex from "knex";
import dotenv from "dotenv";
import paths from "path";
import {
  ICreateApp,
  IAppItemConfig,
  IModelAdmin,
  IModelAdminConfig
} from "./interfaces";
import ModelAdmin from "./ModelAdmin";
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

  addTable(tableName: string, config: IAppItemConfig = defaultConfig) {
    const {
      modelAdmin,
      section: [name, path]
    } = config;

    const model = modelAdmin
      ? new modelAdmin(tableName)
      : ModelAdmin.create(this.path, tableName);
    model.addRepository(this.repository);

    const modelConfig = model.getConfig();
    if (this.sections[name]) {
      this.sections[name].models.push(modelConfig);
    } else {
      this.sections[name] = {
        name,
        path,
        models: [modelConfig]
      };
    }
    this.models[tableName] = model;
  }

  getRoutes() {
    const router = express.Router();
    router.get("/config", this.apiGetConfig);
    router.get("/config/:model", this.apiModelValidate, this.apiGetModelConfig);
    router.get("/:model", this.apiModelValidate, this.apiGetAll);
    router.get("/:model/:id", this.apiModelValidate, this.apiGetDetail);
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
    modelAdmin.getAll().then(
      resolve => {
        res.status(200).send({ data: resolve });
      },
      err => {
        res.status(400).send(err);
      }
    );
  };

  apiGetDetail = (req, res) => {
    const modelName = req.params.model;
    const id = req.params.id;
    const modelAdmin = this.models[modelName];
    modelAdmin.get(id).then(
      resolve => {
        res.status(200).send({ data: resolve });
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
