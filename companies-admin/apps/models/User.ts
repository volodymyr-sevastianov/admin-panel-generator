import {
  createModel,
  NumberField,
  TextField,
  ForeignKey
} from "@vbait/json-schema-model";

const Profile = createModel("companies_profile", null, {
  id: new NumberField({ primary: true }),
  firstName: new TextField({ maxLength: 200 }),
  lastName: new TextField({ maxLength: 200 })
});

Profile.prototype.fullName = function() {
  return this.firstName + " " + this.lastName;
};

const User = createModel("companies_user", null, {
  id: new NumberField({ primary: true }),
  username: new TextField({ maxLength: 200 }),
  email: new TextField({ maxLength: 200 }),
  profile: new ForeignKey({
    to: Profile,
    sourceName: "profile_id"
  })
});

export default User;
