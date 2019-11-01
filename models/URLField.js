import Field from "./Field";
import { inherit } from "./utils";

const URLField = function(args) {
  Field.call(this, args);
};

inherit(URLField, Field);

export default URLField;
