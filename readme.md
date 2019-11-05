## Configuring

To use library firstly you must create knexfile.js with all neccessary configuration then .env file with next fields:

```env
DB_CONNECTION_STRING
DB_SCHEMA_NAME
DB_MIGRATIONS_DIRECTORY
DB_SEEDS_DIRECTORY
DB_DEBUG

KNEX_FILE_CONVENTION_NAME - it's how you name your knexfiles in your project
```

Also you can use our sample_env file.

## Usage

To generate DB configuration use yarn command:

```bash
yarn generate --path <path to folder where needed knexfile located>
```

or NPM:

```bash
npm run generate --path <path to folder where needed knexfile located>
```

Then import initializeApp() from lib/ :

```javascript
import { initializeApp } from "./lib";

const admin = initializeApp({
  path: "path to needed DB knexfile configuration folder"
});
```

To register models in your admin panel use admin.register(). Name of registering table must be equal to the table name in DB.

```javascript
admin.register("cars");
admin.register("makes");
```

After registering all needed schemas get an express router with admin.getRoutes() and pass it to app.use function. Always use json body parser for correct working of our package.

```javascript
app.use("/apiRoute", admin.getRoutes());
```

And that's all, run your server and try any of crud operations throught this routes:

GET /apiRoute/config - to get full db config;

GET /apiRoute/config/:tableName - to get config of specified table;

GET /apiRoute/:tableName - to get all data from specified table;

POST /apiRoute/:tableName - to post specified row to specified table;

PUT /apiRoute/:tableName - to update specified row in specified table;

DELETE /apiRoute/:tableName/:id - to delete row from specified table;
