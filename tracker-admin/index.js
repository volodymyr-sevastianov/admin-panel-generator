import { initializeApp } from "../lib";

const admin = initializeApp("tracker-admin");
admin.register("cars");
admin.register("makes");

export default admin;
