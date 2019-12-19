import {
  createModel,
  NumberField,
  TextField,
  ForeignKey,
  ManyToManyField
} from "@vbait/json-schema-model";
import { ONE_TO_MANY, MANY_TO_MANY } from "../constants";

const createDynamicModel = (tableName, config, level = 1) => {
  const fields = {};
  Object.entries(config.columns).forEach(([name, props]) => {
    fields[name] = createLocalFieldByProps(props);
  });
  if (level) {
    Object.entries(config.relationMappings).forEach(([name, props]: any) => {
      switch (props.relation) {
        case ONE_TO_MANY:
          fields[name] = createFKFieldByProps(
            { ...props, attrs: config.columns[name] },
            level
          );
          break;
        case MANY_TO_MANY:
          fields[name] = createM2MFieldByProps(props, level);
          break;
      }
    });
  }
  return createModel(tableName, null, fields);
  // throw Error(`Configuration for table "${tableName}" is incorrect.`);
};

const createLocalFieldByProps = ({ constraint, type, ...props }: any) => {
  const attrs = { ...props, primary: constraint === "primary key" };
  let field = TextField;
  switch (type) {
    case "integer":
      field = NumberField;
      break;
  }
  return new field({ required: false, ...attrs });
};

const createFKFieldByProps = (props, level) => {
  const attrs = { required: false, ...props.attrs };
  const config = props.config;
  attrs.to = createDynamicModel(config.tableName, config, level - 1);
  return new ForeignKey(attrs);
};

const createM2MFieldByProps = (props, level) => {
  const { throught, to } = props;
  const attrs = {
    required: false,
    table: { name: throught.table, from: throught.from, to: throught.to },
    to: createDynamicModel(to.table, to.config, level - 1)
  };
  return new ManyToManyField(attrs);
};

export default createDynamicModel;
