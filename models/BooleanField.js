import Field from "./Field";
import { inherit } from "./utils";

const BooleanField = function(args) {
  Field.call(this, args);
};

inherit(BooleanField, Field);

export default BooleanField;
