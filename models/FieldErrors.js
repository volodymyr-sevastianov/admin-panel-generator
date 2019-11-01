class FieldErrors extends Error {
  constructor(errors, message, ...params) {
    super(message, ...params);
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FieldErrors);
    }

    this.type = "FieldErrors";
    this.name = "FieldErrors";
    this.date = new Date();
    this.errors = [...errors];
  }
}

export default FieldErrors;