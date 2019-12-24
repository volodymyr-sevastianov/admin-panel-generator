import express from "express";
import QueryBuilder from "../QueryBuilder";
import { ModelDoesNotExistError, ERROR_CODES } from "../errors";
import ModelAdmin from "./ModelAdmin";

class ModelAdminApi extends ModelAdmin {
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
    res.status(200).send({ data: {} });
  }

  listEndpoint = async (req, res, next) => {
    const model = this._modelForList();
    const query = new QueryBuilder({
      model,
      selectRelated: this.selectRelated,
      prefetchRelated: this.prefetchRelated
    });
    const fields = model.getFields().map(f => f.name);
    const customFields = this.listFields.filter(f => {
      if (!fields.includes(f)) {
        if (!this[f] || typeof this[f] !== "function") {
          throw Error(`Field ${f} doesn't exist`);
        }
        return f;
      }
    });
    this.repository
      .find({ queryBuilder: query.create() }, r => {
        const item = new model(r, { useDefault: false, passWithErrors: true });
        if (customFields.length) {
          return Object.assign(
            item.toJSFull(),
            customFields.reduce((acc, f) => {
              acc[f] = this[f](item);
              return acc;
            }, {})
          );
        }
        return item.toJSFull();
      })
      .then(results => {
        // if (this.listFields.length) {
        //   const listFields = [...this.listFields];
        //   const pk = model.getPrimaryField().name;
        //   if (!listFields.includes(pk)) {
        //     listFields.unshift(pk);
        //   }
        //   return res.status(200).send({
        //     data: results.map(item => {
        //       const newItem = {};
        //       listFields.forEach(f => {
        //         newItem[f] = item[f];
        //       });
        //       return newItem;
        //     })
        //   });
        // }
        res.status(200).send({ data: results });
      })
      .catch(err => {
        res.status(500).send(err.message);
      });
  };

  detailEndpoint = (req, res, next) => {
    const data = {};
    res.status(200).send({ data });
  };

  editEndpoint = (req, res, next) => {
    res.status(204).send();
  };

  addEndpoint = (req, res, next) => {
    res.status(201).send({ data: 1 });
  };

  validateOnAdd = (req, res, next) => {
    next();
  };

  validateOnEdit = (req, res, next) => {
    next();
  };
  // END API Endpoints
}

export default ModelAdminApi;
