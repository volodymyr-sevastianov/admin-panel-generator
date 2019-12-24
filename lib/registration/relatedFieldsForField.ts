const relatedFieldsForField = (list, field) => {
  return list
    .map(f => {
      const splitted = f.split("__");
      if (splitted[0] === field && splitted.length > 1) {
        return splitted.slice(1).join("__");
      }
      return null;
    })
    .filter(f => f);
};

export default relatedFieldsForField;
