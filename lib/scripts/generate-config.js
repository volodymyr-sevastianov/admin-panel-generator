import { generate } from "../index";
import commandLineArgs from "command-line-args";
import fs from "fs";
import Errors from "../errors";

const optionsDefinition = [{ name: "path", type: String }];

const args = commandLineArgs(optionsDefinition);

const { path } = args;

const folderName = path.substring(path.lastIndexOf("/") + 1);
if (!fs.existsSync(path)) {
  throw new Errors.DirectoryDoesNotExistError({
    message: `Folder "${folderName}" does not exist. You should create it before running this command.`,
    code: Errors.ERROR_CODES.DIRECTORY_DOES_NOT_EXIST
  });
}

generate({ path }).then(() => {
  process.exit(0);
});
