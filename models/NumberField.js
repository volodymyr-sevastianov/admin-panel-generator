import Field from "./Field";
import { inherit } from "./utils";

const NumberField = function(args) {
  Field.call(this, args);
};

inherit(NumberField, Field);

export default NumberField;
