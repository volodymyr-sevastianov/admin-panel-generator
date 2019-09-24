import fs from "fs";
import path from "path";
import express from "express";
import ModelAdmin from "./model-admin";
import { CONFIG_FOLDER_PATH } from "./constants";

class Admin {
  models = {};

  constructor({ repository }) {
    this.repository = repository;
    let configFilePath = path.resolve(CONFIG_FOLDER_PATH, "global-config.json");
    this.globalConfig = JSON.parse(fs.readFileSync(configFilePath));
  }

  register(configFileName) {
    let model = new ModelAdmin({ configFileName, repository: this.repository });
    this.models[configFileName] = model;
  }

  getConfig = (req, res) => {
    if (!this.models) {
      res.status(404).send(new Error("No global config found!"));
      return;
    }
    res.status(200).send(this.models);
  };

  getModelConfig = (req, res) => {
    let modelName = req.params.model;
    if (!this.models[modelName]) {
      res
        .status(404)
        .send(new Error(`Config for model ${modelName} does not exist.`));
      return;
    }
    let responseBody = {
      [modelName]: this.models[modelName]
    };
    res.status(200).send(responseBody);
  };

  getAllData = async (req, res) => {
    let modelName = req.params.model;
    let responseBody = await this.models[modelName].getAll();

    res.status(200).send(responseBody);
  };

  post = async (req, res) => {
    let modelName = req.params.model;
    let data = req.body;
    try {
      await this.models[modelName].insert({ data });
    } catch (e) {
      res.status(500).send(e);
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
    let id = req.body.id;
    try {
      await this.models[modelName].delete({ id });
    } catch (e) {
      res.status(500).send(e);
      throw e;
    }
    res.status(200).send("SUCCESS");
    return;
  };

  getRoutes() {
    let router = express.Router();

    router.get("/config", this.getConfig);
    router.get("/config/:model", this.getModelConfig);
    router.get("/:model", this.getAllData);
    router.post("/:model", this.post);
    router.put("/:model", this.put);
    router.delete("/:model", this.delete);
    return router;
  }
}

export default Admin;
