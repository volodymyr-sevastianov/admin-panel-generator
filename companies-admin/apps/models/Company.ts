import {
  createModel,
  NumberField,
  TextField,
  EmailField,
  ForeignKey,
  ManyToManyField
} from "@vbait/json-schema-model";
import User from "./User";

const Company = createModel("Company", null, {
  id: new NumberField({ primary: true }),
  name: new TextField({ label: "Name" }),
  email: new EmailField({ label: "Email" }),
  description: new TextField({ required: false, label: "Description" }),
  owner: new ForeignKey({
    sourceName: "owner_id",
    required: false,
    to: User
  }),
  people: new ManyToManyField({
    to: User,
    table: {
      name: "companies_companies_people",
      from: "companies_id",
      to: "user_id"
    }
  })
});
Company.dbTableName = "companies_companies";

export default Company;
