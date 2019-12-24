import { FieldsSelector } from "@vbait/json-schema-model";
import relatedFieldsForField from "../relatedFieldsForField";

const selectorForModel = (
  model: any,
  selectRelated: string[] = [],
  prefetchRelated: string[] = []
) => {
  const selector = new FieldsSelector(model);
  selectRelated.forEach(field => {
    extendSelector(selector, model, field, selectRelated, prefetchRelated);
  });
  prefetchRelated.forEach(field => {
    extendSelector(selector, model, field, selectRelated, prefetchRelated);
  });
  return selector;
};

const extendSelector = (
  selector,
  model,
  field,
  selectRelated,
  prefetchRelated
) => {
  const modelField = model.getFieldByName(field);
  if (!modelField) return;
  const relatedModel = modelField.getRelatedModel();
  const _selectRelated = relatedFieldsForField(selectRelated, field);
  const _prefetchRelated = relatedFieldsForField(prefetchRelated, field);
  selector.addRelated(
    field,
    selectorForModel(relatedModel, _selectRelated, _prefetchRelated)
  );
};

export default selectorForModel;
