//configure the environment if in development env
if (process.env.NODE_ENV != 'Production') require('dotenv').config();

/* ----- imports ----- */
const pgService = require('./services/pg.service');

const TABLES_WITH_VIEWS = [pgService.TABLE_NAMES.EMPLOYEE, pgService.TABLE_NAMES.EMPLOYEE_CRISIS_ASSESSMENT];

/**
 * @description Initializes PG Views for specified tables with either data existing in [spoke org] schemas or sample data (placeholder rows to declare PG View columns)
 * @return void
 */
const run = async () => {
    try {
        //init connection to PG DB
        const pgClient = await pgService.initPgConnection(process.env.DATABASE_URL);

        //init PG Views for specified PG tables
        for (const tableName of TABLES_WITH_VIEWS) await pgService.initPgView(pgClient, tableName);

        // //terminate script
        // process.exit(0);
    }
    catch (err) {
        console.error('Error initializing PG DB for Work.com Multi-Org Connector: ', err)
        
        //terminate script with error code
        process.exit(1);
    }
}

//run the DB init script
run();