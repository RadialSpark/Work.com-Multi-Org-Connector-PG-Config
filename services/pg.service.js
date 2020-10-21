const { Client } = require('pg');

//PG table names
const TABLE_NAMES = {
    EMPLOYEE: 'employee',
    EMPLOYEE_CRISIS_ASSESSMENT: 'employeecrisisassessment'
};

//mapping of PG table name to PG View name
const TABLE_TO_VIEW_NAME_MAPPINGS = {
    employee: 'employees',
    employeecrisisassessment: 'employeecrisisassessments'
}

/* ----- CONSTANTS ----- */
const SPOKE_SCHEMA_IDENTIFIER = 'spoke';

//PLACEHOLDER VALUES (used to construct PG queries)
const VIEW_NAME_PLACEHOLDER = '{VIEW_NAME_PLACEHOLDER}';
const TABLE_NAME_PLACEHOLDER = '{TABLE_NAME_PLACEHOLDER}'
const DUMMY_VALUES_PLACEHOLDER = '{DUMMY_VALUES_PLACEHOLDER}';
const CREATE_VIEW_QUERY_PLACEHOLDER = '{CREATE_VIEW_QUERY_PLACEHOLDER}';
const DUMMY_COLUMN_NAMES_PLACEHOLDER = '{DUMMY_COLUMN_NAMES_PLACEHOLDER}';

//BASE PG QUERIES
const INIT_VIEW_QUERY_BASE = `CREATE OR REPLACE VIEW public.${VIEW_NAME_PLACEHOLDER} AS ${CREATE_VIEW_QUERY_PLACEHOLDER}`;
const CREATE_DUMMY_VIEW_QUERY_BASE = `SELECT * FROM ( VALUES (${DUMMY_VALUES_PLACEHOLDER}) ) AS r (${DUMMY_COLUMN_NAMES_PLACEHOLDER})`;
const GET_SCHEMAS_QUERY_BASE = `SELECT * from information_schema.tables where table_type='BASE TABLE' AND table_name='${TABLE_NAME_PLACEHOLDER}' AND table_schema LIKE '${SPOKE_SCHEMA_IDENTIFIER}%'`

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
 * @description Initializes the PG View (containing either rows from existing spoke org tables or sample rows with placeholder data)
 * @param pgClient PG client connection
 * @param tableName PG table name
 * @return void
 */
const initPgView = async (pgClient, tableName) => {
    const schemaQuery = buildGetSchemasQuery(tableName);
    const schemaQueryResult = await query(pgClient, schemaQuery);

    if (schemaQueryResult.rows && schemaQueryResult.rows.length > 0) {
        const schemaNames = schemaQueryResult.rows.map(row => row.table_schema);
        const createViewQuery = await buildCreateViewQuery(schemaNames, tableName);

        console.log('----- create view query: ', createViewQuery)

        await query(pgClient, createViewQuery);
    }
    //else ==> create dummy view
    else {
        const createDummyViewQuery = buildCreateDummyViewQuery(tableName);

        console.log('----- create dummy view query: ', createDummyViewQuery);

        await query(pgClient, createDummyViewQuery);
    }
}

/**
 * @description Reads and returns schema for the specified table name
 * @param tableName PG table name
 * @return JSON object containing the pre-defined schema for the table
 */
const getSchemaFromFile = tableName => {
    const schema = require(`../pg-schema/${tableName}.schema.json`);

    if (schema) {
        return schema;
    }
    else {
        console.error('No schema definition found for ' + tableName);
    }
}

/**
 * @description Constructs and returns PG query that finds PG schemas that contain the specified PG table
 * @param tableName The name of the PG table
 * @return Constructed PG query string
 */
const buildGetSchemasQuery = (tableName) => {
    return GET_SCHEMAS_QUERY_BASE.replace(TABLE_NAME_PLACEHOLDER, tableName);
}

/**
 * @description Constructs and returns PG query that is used to create a PG View that contains data from schemaNames[*].tableName
 * @param schemaNames List of PG schema names that should be aggreggated into the PG View
 * @param tableName PG table name
 * @return Constructed PG query string
 */
const buildCreateViewQuery = (schemaNames, tableName) => {
    const schemaDefinition = getSchemaFromFile(tableName);

    //generate a query string for each combination of schemaName & tableName
    const queryList = schemaNames.map(schemaName => {
        const fieldQuery = Object.keys(schemaDefinition).map(field => `${schemaName}.${tableName}.${field}`);

        //add primary key mapping of sfid ==> id column
        fieldQuery.push(`${schemaName}.${tableName}.sfid as id`);

        //add column for mapping of SF Org ID --> orgid
        const orgid = schemaName.split(SPOKE_SCHEMA_IDENTIFIER)[1];
        fieldQuery.push(`'${orgid}'::VARCHAR(18) as orgid`)

        return `SELECT ${fieldQuery.join(',')} FROM ${schemaName}.${tableName}`;
    });

    //return formatted PG query
    return INIT_VIEW_QUERY_BASE
        .replace(VIEW_NAME_PLACEHOLDER, TABLE_TO_VIEW_NAME_MAPPINGS[tableName])
        .replace(CREATE_VIEW_QUERY_PLACEHOLDER, queryList.join(' UNION '));
}

/**
 * @description Constructs and returns PG query that is used to create a "dummy" PG View that contains sample data with pre-defined columns that match the PG table
 * @param tableName PG table name
 * @return Constructed PG query string
 */
const buildCreateDummyViewQuery = (tableName) => {
    const schemaDefinition = getSchemaFromFile(tableName);

    //add hard-coded columns for id (primary key) and orgid (SF Org ID)
    const schemaDefinitionWithPK = {
        ...schemaDefinition,
        id: {
            type: 'VARCHAR(18)',
            default: `'sfid'`
        },
        orgid: {
            type: 'VARCHAR(18)',
            default: `'orgid'`
        }
    };

    //generate a query string that contains the pre-defined columns with placeholder values
    const createViewQuery = CREATE_DUMMY_VIEW_QUERY_BASE
        .replace(DUMMY_VALUES_PLACEHOLDER, Object.keys(schemaDefinitionWithPK).map(fieldName => `${schemaDefinitionWithPK[fieldName].default}::${schemaDefinitionWithPK[fieldName].type}`))
        .replace(DUMMY_COLUMN_NAMES_PLACEHOLDER, Object.keys(schemaDefinitionWithPK));

    //return formatted PG query
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

module.exports = {
    initPgConnection,
    initPgView,
    TABLE_NAMES
}