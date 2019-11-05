import { generate } from "../index";
import commandLineArgs from "command-line-args";

const optionsDefinition = [{ name: "path", type: String }];

const args = commandLineArgs(optionsDefinition);

const { path } = args;

generate({ path }).then(() => {
  process.exit(0);
});
