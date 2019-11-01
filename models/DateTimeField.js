import Field from "./Field";
import { inherit } from "./utils";

const DateTimeField = function(args) {
  Field.call(this, args);
};

inherit(DateTimeField, Field);

export default DateTimeField;
