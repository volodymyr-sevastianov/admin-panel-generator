import { FieldsSelector } from "@vbait/json-schema-model";
import { ModelAdmin, ModelAdminOld } from "../../lib/registration";
import { Company } from "./models";

class CompanyAdmin extends ModelAdminOld {
  model = Company;
  fields = ["name", "owner", "people"];
  listFields = new FieldsSelector(Company, [
    "name",
    "owner",
    "people"
  ]).addRelated("owner", ["id", "username"]); // ["name", "email", "owner", "people"];
}

export default CompanyAdmin;
