class Config {
  constructor(config) {
    this.tableList = config.tables;
    this.config = config;
  }

  getTableConfig(tableName) {
    return this.config[tableName];
  }

  getTableList() {
    return this.tableList;
  }
}
