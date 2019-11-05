import { initializeApp } from "../lib";

const admin = initializeApp({ path: "./tracker-admin" });
admin.register("cars");
admin.register("makes");

export default admin;
