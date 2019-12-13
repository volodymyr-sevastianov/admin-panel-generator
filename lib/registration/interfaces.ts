export interface IAppItemConfig {
  modelAdmin?: IModelAdminConstructor;
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
  getRoutes(): any;
  apiGetConfig(req: any, res: any): void;
}

export interface IModelAdminConstructor {
  new (tableName: string): IModelAdmin;
}

export interface IModelAdmin {
  // public static createModel(): void;
  addRepository(repository: any): void;
  getConfig(): IModelAdminConfig;
  getFullConfig(): {};
  getAll(): Promise<any[]>;
  get(id: string): Promise<any>;
}
