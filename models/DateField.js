import Field from "./Field";
import { inherit } from "./utils";

const DateField = function(args) {
  Field.call(this, args);
};

inherit(DateField, Field);

export default DateField;
