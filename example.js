import modelExtend from "./models/modelExtend";
import {
  TextField,
  DateField,
  TimeField,
  DateTimeField,
  EmailField,
  NumberField,
  BooleanField,
  UUIDField,
  ForeignKey,
  ManyToManyField,
  Validator
} from "./models";

const User = modelExtend("User", {
  id: new NumberField({ primary: true }),
  fullName: new TextField({ required: true, maxLength: 255 })
});

const Companies = modelExtend("Companies", {
  id: new NumberField({ primary: true }),
  name: new TextField({ defaultValue: "Agiliway", maxLength: 255 }),
  date: new DateField({ required: true }),
  time: new TimeField({ required: true }),
  datetime: new DateTimeField({ required: true }),
  email: new EmailField({ required: true }),
  number: new NumberField({ required: true }),
  integer: new NumberField({ required: true, integer: true }),
  bool: new BooleanField({ required: true }),
  uuid: new UUIDField({ required: true }),
  fk: new ForeignKey({ to: User, required: true }),
  m2m: new ManyToManyField({ to: User, required: true })
});

const test = () => {
  const company = new Companies({
    name: "Bizico",
    date: "2019-02-28",
    time: "23:59:59",
    datetime: "2019-02-28T23:59:59Z",
    email: "vbait@bizico.com",
    number: 100.1,
    integer: 100,
    bool: false,
    uuid: "6a2f41a3-c54c-fce8-32d2-0324e1c32e22",
    fk: 1,
    m2m: [1]
  });

  // console.log("FULL", JSON.stringify(Companies.getJsonSchema(), null, 2));
  // console.log("SHORT", Companies.getJsonSchema("name", "datetime"));

  try {
    company.clean_fields();
  } catch (err) {
    console.log("ERROR", JSON.stringify(err.errors));
  }
  console.log(company.toJS());
  console.log(company.getJsonSchema());
  console.log(
    new Validator().validate(company.toJS(), company.getJsonSchema()).valid
  );
};

export default test;
