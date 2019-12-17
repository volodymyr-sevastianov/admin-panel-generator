import { CreateApp } from "../lib/registration";
import CompanyAdmin from "./apps/CompanyAdmin";

const adminApp = new CreateApp({
  name: "Admin Dashboard",
  path: "./companies-admin"
});

// adminApp.addTable("companies_companies", {
//   section: ["My Models", "models"]
// });

adminApp.addModel(CompanyAdmin, "companies_companies", {
  section: ["My Models", "models"]
});

export default adminApp;
