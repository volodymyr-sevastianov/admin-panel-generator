import { IModelAdminConstructor } from "./IModelAdmin";

export interface IAppItemConfig {
  section: [string, string];
}

export interface IModelAdminConfig {
  name: string;
  path: string;
}

export interface ICreateApp {
  addTable(tableName: string, config: IAppItemConfig): void;
  addModelAdmin(
    modelAdminConstructor: IModelAdminConstructor,
    config: IAppItemConfig
  ): void;
  getRoutes(): any;
  apiGetConfig(req: any, res: any): void;
}
