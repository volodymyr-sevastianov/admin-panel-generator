import express from "express";
import Knex from "knex";
import dotenv from "dotenv";
import paths from "path";
import { ICreateApp, IAppItemConfig } from "./interface/ICreateApp";
import {
  IModelAdminConstructor,
  IModelAdmin,
  IModelAdminAppConfig
} from "./interface/IModelAdmin";
import ModelAdmin from "./ModelAdmin";
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
  private models: IModelAdmin[] = [];
  private sections: {
    [name: string]: {
      name: string;
      path: string;
      models: [IModelAdminAppConfig];
    };
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

    this.models.push(modelAdmin);

    const modelConfig = modelAdmin.configSimpleForApp();
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
    const modelAdmin = new ModelAdmin({
      path: this.path,
      table: tableName,
      repository: this.repository
    }).init();
    this.updateConfig(modelAdmin, config);
  }

  addModelAdmin(
    modelAdminConstructor: IModelAdminConstructor,
    config: IAppItemConfig = defaultConfig
  ) {
    const modelAdmin = new modelAdminConstructor({
      path: this.path,
      repository: this.repository
    }).init();
    this.updateConfig(modelAdmin, config);
  }

  getRoutes() {
    const router = express.Router();
    router.get("/config", this.apiGetConfig);
    this.models.forEach(modelAdmin => {
      router.use(modelAdmin.routes());
    });
    return router;
  }

  apiGetConfig = (req, res) => {
    const config = {
      name: this.name,
      sections: Object.entries(this.sections).map(([, section]) => section)
    };
    res.status(200).send({ data: config });
  };

  // apiGetModelConfig = (req, res) => {
  //   const modelName = req.params.model;
  //   const modelAdmin = this.models[modelName];
  //   res.status(200).send({ data: modelAdmin.getFullConfig() });
  // };

  // apiGetAll = (req, res) => {
  //   const modelName = req.params.model;
  //   const modelAdmin = this.models[modelName];
  //   const schema = modelAdmin.getListFieldsSelector().getSchema();
  //   modelAdmin.getAll().then(
  //     data => {
  //       res.status(200).send({ data, schema });
  //     },
  //     err => {
  //       res.status(400).send(err.message);
  //     }
  //   );
  // };

  // apiGetDetail = (req, res) => {
  //   const modelName = req.params.model;
  //   const id = req.params.id;
  //   const modelAdmin = this.models[modelName];
  //   const schema = modelAdmin.getFieldsSelector().getSchema();
  //   modelAdmin.get(id).then(
  //     data => {
  //       res.status(200).send({ data, schema });
  //     },
  //     err => {
  //       res.status(400).send(err.message);
  //     }
  //   );
  // };

  // apiGetAllForField = (req, res) => {
  //   const modelName = req.params.model;
  //   const id = req.params.id;
  //   const field = req.params.field;
  //   const modelAdmin = this.models[modelName];
  //   modelAdmin.getForField(id, field).then(
  //     data => {
  //       res.status(200).send({ data });
  //     },
  //     err => {
  //       res.status(400).send(err);
  //     }
  //   );
  // };

  // apiModelValidate = (req, res, next) => {
  //   const modelName = req.params.model;
  //   if (!modelName || !this.models[modelName]) {
  //     const error = new ModelDoesNotExistError({
  //       modelName,
  //       code: ERROR_CODES.MODEL_DOES_NOT_EXIST
  //     });
  //     res.status(404).send({
  //       error: {
  //         message: error.message,
  //         code: error.code
  //       }
  //     });
  //     return;
  //   }
  //   next();
  // };
}

export default CreateApp;
