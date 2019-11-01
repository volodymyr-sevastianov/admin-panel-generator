import Field from "./Field";
import { inherit } from "./utils";

const EmailField = function(args) {
  Field.call(this, args);
};

inherit(EmailField, Field);

export default EmailField;
