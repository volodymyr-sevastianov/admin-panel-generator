import modelExtend from "./models/modelExtend";
import TextField from "./models/TextField";

const Companies = modelExtend({
  name: new TextField({ defaultValue: "Agiliway" })
});

const test = () => {
  const company = new Companies({ name1: "Bizico" });
  console.log(company.name);
  company.clean_fields();
  console.log(company.name);
};

export default test;
