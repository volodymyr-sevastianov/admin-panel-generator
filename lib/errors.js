class ModelDoesNotExistError extends Error {
  constructor({ modelName, code }) {
    let message = `Model '${modelName}' does not registered.`;
    super(message);
    this.code = code;
  }
}

const ERROR_CODES = {
  MODEL_DOES_NOT_EXIST: "DoesNotExistError"
};

export default Object.freeze({ ModelDoesNotExistError, ERROR_CODES });
