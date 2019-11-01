import Field from "./Field";
import { inherit } from "./utils";

const TimeField = function(args) {
  Field.call(this, args);
};

inherit(TimeField, Field);

export default TimeField;
