const { Client } = require('pg');

const TABLE_NAMES = {
    EMPLOYEE: 'employee',
    EMPLOYEE_CRISIS_ASSESSMENT: 'employeecrisisassessment'
};

const TABLE_TO_VIEW_NAME_MAPPINGS = {
    employee: 'spoke_employees',
    employeecrisisassessment: 'spoke_employeecrisisassessments'
}

const CREATE_VIEW_QUERY_PLACEHOLDER = '{CREATE_VIEW_QUERY_PLACEHOLDER}';
const VIEW_NAME_PLACEHOLDER = '{VIEW_NAME_PLACEHOLDER}';
const INIT_VIEW_QUERY_BASE = `CREATE OR REPLACE VIEW public.${VIEW_NAME_PLACEHOLDER} AS ${CREATE_VIEW_QUERY_PLACEHOLDER}`;

const SPOKE_SCHEMA_IDENTIFIER = 'spoke00d';
const TABLE_NAME_PLACEHOLDER = '{TABLE_NAME_PLACEHOLDER}'
const GET_SCHEMAS_QUERY_BASE = `SELECT * from information_schema.tables where table_type='BASE TABLE' AND table_name='${TABLE_NAME_PLACEHOLDER}' AND table_schema LIKE '${SPOKE_SCHEMA_IDENTIFIER}%'`
const DUMMY_COLUMN_NAMES_PLACEHOLDER = '{DUMMY_COLUMN_NAMES_PLACEHOLDER}';
const DUMMY_VALUES_PLACEHOLDER = '{DUMMY_VALUES_PLACEHOLDER}';
const CREATE_DUMMY_VIEW_QUERY_BASE = `SELECT * FROM ( VALUES (${DUMMY_VALUES_PLACEHOLDER}) ) AS r (${DUMMY_COLUMN_NAMES_PLACEHOLDER})`;

/**
 SELECT r.test
   FROM ( VALUES ('1'::numeric)) r(test);
 */

/**
 * @description Creates a client connection to a PG database
 * @param dbConnectionString Indicates which database to connect to
 * @return PG Client
 */
const initPgConnection = async dbConnectionString => {
    //database connection configuration
    const config = {
        connectionString: dbConnectionString,
        ssl: {
            rejectUnauthorized: false,
        }
    }

    //init new PG Client
    const client = new Client(config);
    //attempt to connect to the PG database (database configuration defined in ENV)
    await client.connect();
    
    console.log('Connected to PG database')

    return client;
}

/**
 * @description 
 * @return 
 */
const getSchemasQuery = (tableName) => {
    return GET_SCHEMAS_QUERY_BASE.replace(TABLE_NAME_PLACEHOLDER, tableName);
}

/**
 * @description 
 * @return 
 */
const buildCreateViewQuery = (schemaNames, tableName) => {
    //to do todo: move to method
    const schemaDefinition = require(`../pg-schema/${tableName}.schema.json`);

    const queryList = schemaNames.map(schemaName => {
        const fieldQuery = Object.keys(schemaDefinition).map(field => `${schemaName}.${tableName}.${field}`).join(',');

        return `SELECT ${fieldQuery} FROM ${schemaName}.${tableName}`;
    });
    
    return INIT_VIEW_QUERY_BASE
        .replace(VIEW_NAME_PLACEHOLDER, TABLE_TO_VIEW_NAME_MAPPINGS[tableName])
        .replace(CREATE_VIEW_QUERY_PLACEHOLDER, queryList.join(' UNION '));
}

/**
 * @description 
 * @return 
 */
const buildCreateDummyViewQuery = (fields, tableName) => {
    const createViewQuery =  CREATE_DUMMY_VIEW_QUERY_BASE
        .replace(DUMMY_VALUES_PLACEHOLDER, Object.keys(fields).map(fieldName => `${fields[fieldName].default}::${fields[fieldName].type}`))
        .replace(DUMMY_COLUMN_NAMES_PLACEHOLDER, Object.keys(fields));

    return INIT_VIEW_QUERY_BASE
        .replace(VIEW_NAME_PLACEHOLDER, TABLE_TO_VIEW_NAME_MAPPINGS[tableName])
        .replace(CREATE_VIEW_QUERY_PLACEHOLDER, createViewQuery);
}

/**
 * @description Sends query request to the PG database
 * @param client Client connection to the configured PG database
 * @param query Query to perform; can be string or pg Query object
 * @return Result of running the DB query
 */
const query = async (client, query) => {
    //send query request to the PG database
    const queryResult = await client.query(query);
    //return results of the query
    return queryResult;
}

// console.log('building query: ', buildCreateViewQuery(['SCHEMA_NAME_1', 'SCHEMA_NAME_2'], TABLE_NAMES.EMPLOYEE));

module.exports = {
    initPgConnection,
    query,
    getSchemasQuery,
    buildCreateViewQuery,
    buildCreateDummyViewQuery,
    TABLE_NAMES,
    SPOKE_SCHEMA_IDENTIFIER
}