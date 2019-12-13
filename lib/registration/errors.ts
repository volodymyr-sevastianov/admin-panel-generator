class ModelDoesNotExistError extends Error {
  code: string;
  constructor({ modelName, code }) {
    const message = `Model '${modelName}' does not registered.`;
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ModelDoesNotExistError);
    }
    this.code = code;
  }
}

class DirectoryDoesNotExistError extends Error {
  code: string;
  constructor({ message, code }) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DirectoryDoesNotExistError);
    }
    this.code = code;
  }
}

const ERROR_CODES = {
  MODEL_DOES_NOT_EXIST: "DoesNotExistError",
  DIRECTORY_DOES_NOT_EXIST: "DirectoryDoesNotExist"
};

export { ModelDoesNotExistError, DirectoryDoesNotExistError, ERROR_CODES };
