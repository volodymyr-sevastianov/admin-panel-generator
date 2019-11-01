class ModelDoesNotExistError extends Error {
  constructor({ modelName, code }) {
    const message = `Model '${modelName}' does not registered.`;
    super(message);
    this.code = code;
  }
}

class DirectoryDoesNotExistError extends Error {
  constructor({ message, code }) {
    super(message);
    this.code = code;
  }
}

const ERROR_CODES = {
  MODEL_DOES_NOT_EXIST: "DoesNotExistError",
  DIRECTORY_DOES_NOT_EXIST: "DirectoryDoesNotExist"
};

export default Object.freeze({
  ModelDoesNotExistError,
  DirectoryDoesNotExistError,
  ERROR_CODES
});
