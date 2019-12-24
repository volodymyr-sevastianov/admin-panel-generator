import { CreateApp, ModelAdmin } from "../lib/registration";
// import CompanyAdmin from "./apps/CompanyAdmin";
import Company from "./apps/models/Company";

const adminApp = new CreateApp({
  name: "Admin Dashboard",
  path: "./companies-admin"
});

// adminApp.addTable("companies_companies", {
//   section: ["My Models", "models"]
// });

// adminApp.addModelAdmin(CompanyAdmin, "companies_companies", {
//   section: ["My Models", "models"]
// });

const sourcePath =
  "/Users/flamps/Documents/WORK/Node/Shared/admin-panel-generator/companies-admin/configs";

const modelAdmin = new ModelAdmin({
  path:
    "/Users/flamps/Documents/WORK/Node/Shared/admin-panel-generator/companies-admin/configs",
  table: "companies_companies",
  m2m: [
    [
      "people",
      "companies_companies",
      "companies_companies_people",
      "companies_user"
    ],
    ["parents", "companies_user", "companies_user_parents", "companies_parents"]
  ]
});
// modelAdmin.routes();
// console.log(modelAdmin.routes());

class CompanyAdmin extends ModelAdmin {
  levelToParse = 2;
  table = "companies_companies";
  m2m = [
    [
      "people",
      "companies_companies",
      "companies_companies_people",
      "companies_user"
    ]
  ] as [string, string, string, string][];
  model = Company;
  listFields = ["name", "email", "ownerFullName"];
  listMapLabels = { name: "Company Name", ownerFullName: "Full Name" };
  // selectRelated = ["owner_id", "owner_id__profile_id", "people__profile_id"];
  selectRelated = ["owner", "owner__profile", "people__profile"];
  prefetchRelated = ["people"];

  ownerFullName = item => {
    if (item.owner) {
      // return item.owner.profile.fullName();
      return `${item.owner.profile.firstName} ${item.owner.profile.lastName}`;
    }
  };
}

adminApp.addModelAdmin(CompanyAdmin, {
  section: ["My Models", "models"]
});

export default adminApp;
