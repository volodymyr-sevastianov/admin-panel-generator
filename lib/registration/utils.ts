export const displayModelItem = instance => {
  return instance.__display__ ? instance.__display__() : instance.pk;
};

export const tableName = model => {
  return model.__table__ || model.name;
};
