function inherit(newClass, cls) {
  newClass.prototype = Object.create(cls.prototype);
  Object.defineProperty(newClass.prototype, "constructor", {
    value: newClass,
    enumerable: false,
    writable: true
  });
}

function fromEntries(iterable) {
  return [...iterable].reduce((obj, [key, val]) => {
    obj[key] = val;
    return obj;
  }, {});
}

export { inherit, fromEntries };
