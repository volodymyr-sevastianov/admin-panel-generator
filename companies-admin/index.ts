import { CreateApp, ModelAdmin } from "../lib/registration";
import CompanyAdmin from "./apps/CompanyAdmin";

const adminApp = new CreateApp({
  name: "Admin Dashboard",
  path: "./companies-admin"
});

// adminApp.addTable("companies_companies", {
//   section: ["My Models", "models"]
// });

adminApp.addModelAdmin(CompanyAdmin, "companies_companies", {
  section: ["My Models", "models"]
});

const modelAdmin = new ModelAdmin({
  path: "",
  routeApi1: "test",
  table: "companies_companies"
});
modelAdmin.routes();
// console.log(modelAdmin.routes());

export default adminApp;
