import Field from "./Field";
import { inherit } from "./utils";

const UUIDField = function(args) {
  Field.call(this, args);
};

inherit(UUIDField, Field);

export default UUIDField;
