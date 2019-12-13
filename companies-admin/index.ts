import { CreateApp } from "../lib/registration";
import CompanyAdmin from "./apps/Company";

const adminApp = new CreateApp({
  name: "Admin Dashboard",
  path: "./companies-admin"
});

adminApp.addTable("companies_companies", {
  modelAdmin: CompanyAdmin,
  section: ["My Models", "models"]
});

export default adminApp;
