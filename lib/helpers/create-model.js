import modelExtend from "../../models/modelExtend";
import {
  TextField,
  DateField,
  TimeField,
  DateTimeField,
  EmailField,
  NumberField,
  BooleanField,
  UUIDField,
  ForeignKey,
  ManyToManyField
} from "../../models";

const createModel = ({ rawModel, modelName }) => {
  let model = {};
  Object.keys(rawModel.columns).forEach(columnName => {
    const column = rawModel.columns[columnName];
    switch (column.type) {
      case "integer":
        model[columnName] = createNumberField(column, true);
        break;
      case "bigint":
        model[columnName] = createNumberField(column, true);
        break;
      case "string":
        model[columnName] = createStringField(column);
        break;
      case "real":
        model[columnName] = createNumberField(column);
        break;
      case "numeric":
        model[columnName] = createNumberField(column);
        break;
      case "boolean":
        model[columnName] = createBooleanField();
        break;
      case "date":
        model[columnName] = createDateField();
        break;
      case "uuid":
        model[columnName] = createUUIDField();
        break;
    }
    if (column.constraint === "foreign key") {
      const toTable = rawModel.relationMappings[columnName].join.toTable;
      // model[columnName] = createFKField(toTable);
    }
  });
  return modelExtend(modelName, model);
};

function createNumberField(field, integer = false) {
  return new NumberField({ maxLength: field.maxLength, integer });
}

function createStringField(field) {
  return new TextField({ maxLength: field.maxLength });
}

function createBooleanField() {
  return new BooleanField({ maxLength: field.maxLength });
}

function createDateField() {
  return new DateField({ maxLength: field.maxLength });
}

function createUUIDField() {
  return new UUIDField({ maxLength: field.maxLength });
}

function createFKField(toTable) {
  return new ForeignKey({ to: toTable });
}

export { createModel };
