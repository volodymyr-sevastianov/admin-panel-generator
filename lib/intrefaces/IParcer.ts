interface IParcer {
  schema: any;
  repository: any;
  getDBConfig();
  getPublicConfig(config);
  mergeConfig(devConfig, publicConfig);
}

export default IParcer;
