import fs from "fs";
import path from "path";
import express from "express";
import ModelAdmin from "./model-admin";
import errors from "./errors";

class Admin {
  models = {};

  constructor({ repository, configFolderPath, name }) {
    this.appName = name || "Admin";
    this.repository = repository;
    this.configFolderPath = configFolderPath;
    const configFilePath = path.resolve(configFolderPath, "global-config.json");
    this.configFilePath = configFilePath;
    try {
      this.globalConfig = JSON.parse(fs.readFileSync(configFilePath));
    } catch (e) {
      throw new Error(
        "You should run 'yarn generate' script to get all neccessary config files!"
      );
    }
  }

  register(configFileName, admin = ModelAdmin, sectionName) {
    const model = new admin({
      configFileName,
      repository: this.repository,
      configFolderPath: this.configFolderPath,
      section: sectionName ? { name: sectionName } : undefined
    });
    this.models[configFileName] = model;
  }

  getConfig = (req, res) => {
    if (!this.models) {
      res.status(404).send(new Error("No global config found!"));
      return;
    }

    const sections = {};
    Object.entries(this.models).forEach(([table_name, model]) => {
      if (sections[model.section.name]) {
        sections[model.section.name].models.push(model.getConfig());
      } else {
        sections[model.section.name] = {
          ...model.section,
          models: [model.getConfig()]
        };
      }
    });

    const config = {
      name: this.appName,
      sections: Object.entries(sections).map(([, section]) => section)
    };
    res.status(200).send({ data: config });
  };

  getModelConfig = (req, res, next) => {
    const modelName = req.params.model;
    if (!modelName) {
      next();
    }
    const modelAdmin = this.models[modelName];
    res.status(200).send({ data: modelAdmin.getFullConfig() });
  };

  getAllData = (req, res) => {
    const modelName = req.params.model;
    this.models[modelName].getAll().then(
      resolve => {
        res.status(200).send({ data: resolve });
      },
      err => {
        res.status(400).send(err);
        throw e;
      }
    );
  };

  getDetail = (req, res) => {
    const modelName = req.params.model;
    const id = req.params.id;
    this.models[modelName].get(id).then(
      resolve => {
        res.status(200).send({ data: resolve });
      },
      err => {
        res.status(400).send(err);
        throw e;
      }
    );
  };

  post = async (req, res) => {
    const modelName = req.params.model;
    const data = req.body;
    try {
      await this.models[modelName].insert({ data });
    } catch (e) {
      res.status(400).send({ error: e });
      throw e;
    }
    res.status(200).send("SUCCESS");
    return;
  };

  put = async (req, res) => {
    const modelName = req.params.model;
    const data = req.body;
    try {
      await this.models[modelName].update({ data });
    } catch (e) {
      res.status(500).send(e);
      throw e;
    }
    res.status(200).send("SUCCESS");
    return;
  };

  delete = async (req, res) => {
    const modelName = req.params.model;
    const id = req.params.id;
    try {
      await this.models[modelName].delete({ id });
    } catch (e) {
      res.status(500).send(e);
      throw e;
    }
    res.status(200).send("SUCCESS");
    return;
  };

  validateRequest = (req, res, next) => {
    const modelName = req.params.model;
    if (!modelName) {
      next();
    }
    if (!this.models[modelName]) {
      const error = new errors.ModelDoesNotExistError({
        modelName,
        code: errors.ERROR_CODES.MODEL_DOES_NOT_EXIST
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

  getRoutes() {
    const router = express.Router();

    router.get("/config", this.getConfig);
    router.get("/config/:model", this.validateRequest, this.getModelConfig);
    router.get("/:model", this.validateRequest, this.getAllData);
    router.get("/:model/:id", this.validateRequest, this.getDetail);
    router.post("/:model", this.validateRequest, this.post);
    router.put("/:model", this.validateRequest, this.put);
    router.delete("/:model/:id", this.validateRequest, this.delete);
    return router;
  }
}

export default Admin;
