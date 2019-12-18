import { FieldsSelector } from "@vbait/json-schema-model";

export interface IAppItemConfig {
  // modelAdmin?: IModelAdminConstructor;
  section: [string, string];
}

export interface IModelAdminConfig {
  tableName: string;
  name: string;
  path: string;
}

export interface IModelAdminFullConfig extends IModelAdminConfig {
  schema: any;
}

export interface ICreateApp {
  addTable(tableName: string, config: IAppItemConfig): void;
  addModelAdmin(
    modelAdminConstructor: IModelAdminConstructor,
    tableName: string,
    config: IAppItemConfig
  ): void;
  getRoutes(): any;
  apiGetConfig(req: any, res: any): void;
}

export interface IModelAdminConstructor {
  new (sourcePath: string, tableName: string): IModelAdmin;
}

export interface IModelAdmin {
  model: any;
  addRepository(repository: any): void;
  getConfig(): IModelAdminConfig;
  getFullConfig(): {};
  getFieldsSelector(): FieldsSelector;
  getListFieldsSelector(): FieldsSelector;
  getAll(): Promise<any[]>;
  get(id: string): Promise<any>;
  getForField(id: string, field: string): Promise<any>;
}
