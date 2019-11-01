import Field from "./Field";
import { inherit } from "./utils";

const TextField = function(args) {
  Field.call(this, args);
};

inherit(TextField, Field);

export default TextField;
