import {
  createModelFromSchema,
  NumberField,
  TextField,
  ForeignKey
} from "@vbait/json-schema-model";

const createDynamicModel = (tableName, config) => {
  const modelName = tableName
    .split("_")
    .map(n => n[0].toUpperCase() + n.slice(1))
    .join(" ");

  const schema = {
    model: modelName,
    relatedFields: [],
    related: {}
  } as any;

  const fieldsDetail = {};
  const fields = [];
  const { columns, relationMappings } = config;

  Object.entries(columns).forEach((column: any) => {
    const [name, props] = column;
    const field = getConstructorByTypeAndConstraint(
      props.type,
      props.constraint
    );
    fields.push(name);
    if (field === ForeignKey) {
      fieldsDetail[name] = createFKConfig(
        field,
        name,
        props,
        relationMappings[name]
      );
    } else {
      fieldsDetail[name] = createLocalConfig(field, name, props);
    }
  });

  schema.fieldsDetail = fieldsDetail;
  schema.fields = fields;
  return createModelFromSchema(schema);
};

export default createDynamicModel;

function createLocalConfig(field, name, props) {
  return {
    name,
    constructor: field.name,
    primary: props.constraint === "primary key",
    maxLength: props.maxLength || undefined
  };
}

function createFKConfig(field, name, props, { join }) {
  const pkField = getConstructorByTypeAndConstraint(props.type);
  return {
    ...createLocalConfig(field, name, props),
    to: join.toTable,
    pk: {
      ...createLocalConfig(pkField, join.to.split(".")[1], props),
      primary: true
    }
  };
}

function getConstructorByTypeAndConstraint(type, constraint?) {
  if (constraint === "foreign key") {
    return ForeignKey;
  }
  switch (type) {
    case "integer":
      return NumberField;
    case "string":
      return TextField;
    default:
      return TextField;
  }
}
