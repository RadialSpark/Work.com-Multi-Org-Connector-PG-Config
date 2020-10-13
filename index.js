/**
   1. Connect to PG DB
   2. Query for Schemas in PG DB
   3. Filter Schemas to only schemas with Employee & EmployeeCrisisAssessment tables
   4. Build query to create or replace PG View
   5. Execute PG View query
 */

//configure the environment if in development env
if (process.env.NODE_ENV != 'Production') require('dotenv').config();

const pgService = require('./services/pg.service');

/**
 * @description 
 * @return 
 */
const initPgView = async (pgClient, tableName) => {
    const schemaQuery = pgService.getSchemasQuery(tableName);
    const schemaQueryResult = await pgService.query(pgClient, schemaQuery);

    if (schemaQueryResult.rows && schemaQueryResult.rows.length > 0) {
        const schemaNames = schemaQueryResult.rows.map(row => row.table_schema);
        const createViewQuery = await pgService.buildCreateViewQuery(schemaNames, tableName);

        console.log('----- create view query: ', createViewQuery)

        await pgService.query(pgClient, createViewQuery);
    }
    //else ==> create dummy view
    else {
        const schemaDefinition = require(`./pg-schema/${tableName}.schema.json`);

        if (schemaDefinition) {
            const createDummyViewQuery = pgService.buildCreateDummyViewQuery(schemaDefinition, tableName);

            console.log('----- create dummy view query: ', createDummyViewQuery);

            await pgService.query(pgClient, createDummyViewQuery);
        }
        else {

        }
    }
}

/**
 * @description 
 * @return 
 */
const run = async () => {
    try {
        const pgClient = await pgService.initPgConnection(process.env.DATABASE_URL);

        await initPgView(pgClient, pgService.TABLE_NAMES.EMPLOYEE);
        await initPgView(pgClient, pgService.TABLE_NAMES.EMPLOYEE_CRISIS_ASSESSMENT);

        process.exit(0);
    }
    catch (err) {
        console.error('Error initializing PG DB for Work.com Multi-Org Connector: ', err)
        process.exit(1);
    }
}

//run the DB init script
run();