/**
   1. Connect to PG DB
   2. Query for Schemas in PG DB
   3. Filter Schemas to only schemas with Employee & EmployeeCrisisAssessment tables
   4. Build query to create or replace PG View
   5. Execute PG View query
 */

//configure the environment if in development env
if (process.env.NODE_ENV != 'Production') {
    require('dotenv').config();
}

const pgService = require('./services/pg.service');

const initPgView = async (pgClient, tableName) => {
    const schemaQuery = pgService.getSchemasQuery(tableName);
    const schemaQueryResult = await pgService.query(pgClient, schemaQuery);

    if (schemaQueryResult.rows && schemaQueryResult.rows.length > 0) {
        const schemaNames = schemaQueryResult.rows.map(row => row.table_schema);
        const createViewQuery = await pgService.buildCreateViewQuery(schemaNames, tableName);

        console.log('create view query: ', createViewQuery)

        await pgService.query(pgClient, createViewQuery);
    }
    //else ==> create dummy view
    else {
        const schemaDefinition = require(`./static_resources/${tableName}.schema.json`);

        if (schemaDefinition) {
            const createDummyViewQuery = pgService.buildCreateDummyViewQuery(schemaDefinition, tableName);

            console.log('create dummy view query: ', createDummyViewQuery);

            await pgService.query(pgClient, createDummyViewQuery);
        }
        else {

        }
    }
}

const run = async () => {
    try {
        const pgClient = await pgService.initPgConnection(process.env.DATABASE_URL);

        await initPgView(pgClient, pgService.TABLE_NAMES.EMPLOYEE);
        await initPgView(pgClient, pgService.TABLE_NAMES.EMPLOYEE_CRISIS_ASSESSMENT);

        // //query for DB Schemas
        // const schemas = await pgService.query(pgClient, pgService.STATIC_QUERIES.GET_SCHEMAS);
        // console.log(schemas)
        // const spokeOrgSchemaNames = schemas.rows.filter(schema => schema.schema_name.includes(pgService.SPOKE_SCHEMA_IDENTIFIER)).map(schema => schema.schema_name);

        // console.log('found spoke org schemas: ', spokeOrgSchemaNames)

        // //build PG View for Employee tables
        // const empViewQuery = await pgService.buildCreateViewQuery(spokeOrgSchemaNames, pgService.TABLE_NAMES.EMPLOYEE);
        // // const ecaViewQuery = await pgService.buildCreateViewQuery(spokeOrgSchemaNames, pgService.TABLE_NAMES.EMPLOYEE_CRISIS_ASSESSMENT);

        // console.log('employee view query: ', empViewQuery)
        // // console.log('eca view query: ', ecaViewQuery);

        // const createEmpViewResult = await pgService.query(pgClient, empViewQuery);

        // console.log('create emp view result: ', createEmpViewResult)

        process.exit(0);
    }
    catch (err) {
        console.error('Error initializing PG DB for Work.com Multi-Org Connector: ', err)
        process.exit(1);
    }
}

run();

const fs = require('fs');
const build = () => {
    const employee = require('./static_resources/employeecrisisassessment.schema.json');

    const result = {};
    for (let prop in employee) {
        if (employee[prop].includes('VARCHAR')) {
            result[prop] = {
                type: employee[prop],
                default: `'${prop}'`
            };
        }
        else if (employee[prop].includes('timestamp')) {
            result[prop] = {
                type: employee[prop],
                default: 'NOW()'
            }
        }
        else if (employee[prop].includes('boolean')) {
            result[prop] = {
                type: employee[prop],
                default: true
            }
        }
    }

    fs.writeFileSync('./employee.json', JSON.stringify(result))

    console.log(result)
}

// build();