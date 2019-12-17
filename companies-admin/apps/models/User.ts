import { createModel, NumberField, TextField } from "@vbait/json-schema-model";

const User = createModel("User", null, {
  id: new NumberField({ primary: true }),
  username: new TextField({ maxLength: 200 }),
  email: new TextField({ maxLength: 200 })
});

User.dbTableName = "companies_user";

export default User;
