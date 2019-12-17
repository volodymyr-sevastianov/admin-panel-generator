import {
  createModel,
  NumberField,
  TextField,
  ForeignKey
} from "@vbait/json-schema-model";

const createDynamicModel = (tableName, config, level = 1) => {
  const fields = {};
  Object.entries(config.columns).forEach(([name, props]) => {
    fields[name] = getFieldByProps(props, config.relationMappings[name], level);
  });
  return createModel(tableName, null, fields);
};

const getFieldByProps = (
  { constraint, type, ...props }: any,
  relation,
  level = 0
) => {
  let field = TextField;
  const attrs = { ...props, primary: constraint === "primary key" };
  if (level && relation && constraint === "foreign key") {
    field = ForeignKey;
    const { config } = relation;
    attrs.to = createDynamicModel(config.tableName, config, level - 1);
  } else {
    switch (type) {
      case "integer":
        field = NumberField;
        break;
    }
  }
  return new field(attrs);
};

export default createDynamicModel;
