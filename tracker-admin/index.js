import { initializeApp } from "../lib";

const admin = initializeApp({ path: "./tracker-admin" });
admin.register("users");
admin.register("userProject");

export default admin;
