import fs from "fs";
import path from "path";
import express from "express";
import ModelAdmin from "./model-admin";
import errors from "./errors";

class Admin {
  models = {};

  constructor({ repository, configFolderPath }) {
    this.repository = repository;
    this.configFolderPath = configFolderPath;
    let configFilePath = path.resolve(configFolderPath, "global-config.json");
    this.configFilePath = configFilePath;
    try {
      this.globalConfig = JSON.parse(fs.readFileSync(configFilePath));
    } catch (e) {
      throw new Error(
        "You should run 'yarn generate' script to get all neccessary config files!"
      );
    }
  }

  register(configFileName) {
    let model = new ModelAdmin({
      configFileName,
      repository: this.repository,
      configFolderPath: this.configFolderPath
    });
    this.models[configFileName] = model;
  }

  getConfig = (req, res) => {
    if (!this.models) {
      res.status(404).send(new Error("No global config found!"));
      return;
    }
    res.status(200).send(this.models);
  };

  getModelConfig = (req, res, next) => {
    let modelName = req.params.model;
    if (!modelName) {
      next();
    }
    let responseBody = {
      [modelName]: this.models[modelName]
    };
    res.status(200).send(responseBody);
  };

  getAllData = (req, res) => {
    let modelName = req.params.model;
    this.models[modelName].getAll().then(
      resolve => {
        res.status(200).send(resolve);
      },
      err => {
        res.status(400).send(err);
        throw e;
      }
    );
  };

  post = async (req, res) => {
    let modelName = req.params.model;
    let data = req.body;
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
    let modelName = req.params.model;
    let data = req.body;
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
    let modelName = req.params.model;
    let id = req.params.id;
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
    let modelName = req.params.model;
    if (!modelName) {
      next();
    }
    if (!this.models[modelName]) {
      let error = new errors.ModelDoesNotExistError({
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
    let router = express.Router();

    router.get("/config", this.getConfig);
    router.get("/config/:model", this.validateRequest, this.getModelConfig);
    router.get("/:model", this.validateRequest, this.getAllData);
    router.post("/:model", this.validateRequest, this.post);
    router.put("/:model", this.validateRequest, this.put);
    router.delete("/:model/:id", this.validateRequest, this.delete);
    return router;
  }
}

export default Admin;
