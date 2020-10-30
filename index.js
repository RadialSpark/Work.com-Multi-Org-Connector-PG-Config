//configure the environment if in development env
if (process.env.NODE_ENV != 'Production') require('dotenv').config();

/* ----- imports ----- */
const express = require('express');
const pgService = require('./services/pg.service');

const TABLES_WITH_VIEWS = [pgService.TABLE_NAMES.EMPLOYEE, pgService.TABLE_NAMES.EMPLOYEE_CRISIS_ASSESSMENT];

/**
 * @description Boots Express application and defines endpoint to build PG Views for use as Heroku External Objects
 * @return void
 */
const start = () => {
    const app = express();

    /* ----- add middleware ----- */
    app
        .use(require('helmet')())
        .use(require('cors')())

    /* ----- declare endpoints ----- */
    app.get(`/api/buildExternalObjectViews`, (req, res) => buildExternalObjectViews(req, res))
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log('Work.com Multi-Org Connector: PG Config app listening on port: ' + PORT);
    })
}

/**
 * @description Initializes PG Views for specified tables with either data existing in [spoke org] schemas or sample data (placeholder rows to declare PG View columns)
 * @return void
 */
const buildExternalObjectViews = async (req, res) => {
    try {
        //init connection to PG DB
        const pgClient = await pgService.initPgConnection(process.env.DATABASE_URL);

        //init PG Views for specified PG tables
        for (const tableName of TABLES_WITH_VIEWS) await pgService.initPgView(pgClient, tableName);

        //send success response
        res.sendStatus(204);
    }
    catch (err) {
        console.error('Error initializing PG DB for Work.com Multi-Org Connector: ', err)
        
        res.status(500);
        res.send(err);
    }
}

//init with view on initial deploy
buildExternalObjectViews();

//boot app
start();