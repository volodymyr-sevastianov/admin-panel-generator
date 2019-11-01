class FieldsErrors extends Error {
  constructor(errors, message, ...params) {
    super(message, ...params);
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FieldsErrors);
    }

    this.type = "FieldsErrors";
    this.name = "FieldsErrors";
    this.date = new Date();
    this.errors = { ...errors };
  }
}

export default FieldsErrors;
