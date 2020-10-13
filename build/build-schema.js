const fs = require('fs');

/**
 * @description Builds schema with example values for the "dummy" PG views
 * @param tableName Name of the PG table that the view will be built for
 * @return void
 */
const buildWithExamples = (tableName) => {
    console.log('Building schema template for ' + tableName);
    const rawSchema = require(`../pg-schema/${tableName}.raw.json`);

    const result = {};
    for (let prop in rawSchema) {
        if (rawSchema[prop].includes('VARCHAR')) {
            result[prop] = {
                type: rawSchema[prop],
                default: `'${prop}'`
            };
        }
        else if (rawSchema[prop].includes('timestamp') || rawSchema[prop].includes('date')) {
            result[prop] = {
                type: rawSchema[prop],
                default: 'NOW()'
            }
        }
        else if (rawSchema[prop].includes('boolean')) {
            result[prop] = {
                type: rawSchema[prop],
                default: true
            }
        }
    }

    console.log(`Writing field names with sample data to pg-schema/${tableName}.schema.json`)
    fs.writeFileSync(`./pg-schema/${tableName}.schema.json`, JSON.stringify(result))
}

buildWithExamples('employee');
buildWithExamples('employeecrisisassessment');