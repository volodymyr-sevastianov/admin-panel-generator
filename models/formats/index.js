import { Validator, ValidationError } from "jsonschema";
import date from "./date";
import time from "./time";
import datetime from "./datetime";
import email from "./email";
import uuid from "./uuid";

Validator.prototype.customFormats.DATE = date;
Validator.prototype.customFormats.TIME = time;
Validator.prototype.customFormats.DATETIME = datetime;
Validator.prototype.customFormats.EMAIL = email;
Validator.prototype.customFormats.UUID = uuid;

export { Validator, ValidationError };
