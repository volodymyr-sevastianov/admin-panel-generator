import {
  createModel,
  NumberField,
  TextField,
  EmailField,
  ForeignKey,
  ManyToManyField
} from "@vbait/json-schema-model";
import User from "./User";

const Company = createModel("companies_companies", null, {
  id: new NumberField({ primary: true }),
  name: new TextField({ label: "Name", maxLength: 10 }),
  email: new EmailField({ label: "Email", maxLength: 200 }),
  description: new TextField({
    required: false,
    label: "Description",
    maxLength: 200
  }),
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

Company.__table__ = "companies_companies";
Company.displayName = "Company";

Company.prototype.__display__ = function() {
  return this.name;
};

export default Company;
