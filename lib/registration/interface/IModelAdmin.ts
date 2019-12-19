export interface IModelAdmin {
  name(): string;
  configForApp(): IModelAdminAppConfig;
  routeApiPrefix(): string;
  routes(): any;
}

export interface IModelAdminConstructor {
  new (args: {
    path: string;
    routeApi?: string;
    table?: string;
    model?: any;
    m2m?: [string, string, string, string][];
  }): IModelAdmin;
}

export interface IModelAdminAppConfig {
  name: string;
  path: string;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}
