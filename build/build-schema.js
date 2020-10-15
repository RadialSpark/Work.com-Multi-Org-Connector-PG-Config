const fs = require('fs');

/**
 * @description Builds schema with default values for the "dummy" PG views
 * @param tableName Name of the PG table that the view will be built for
 * @return void
 */
const buildSchemaWithDefaultValues = (tableName) => {
    console.log('Building schema template for ' + tableName);
    const rawSchema = require(`../pg-schema/${tableName}.raw.json`);

    const result = {};
    for (let prop in rawSchema) {
        const type = rawSchema[prop];

        let defaultValue;
        if (rawSchema[prop].includes('VARCHAR')) {
            defaultValue = `'${prop}'`;
        }
        else if (rawSchema[prop].includes('timestamp') || rawSchema[prop].includes('date')) {
            defaultValue = 'NOW()';

        }
        else if (rawSchema[prop].includes('boolean')) {
            defaultValue = true;

        }
        else if (rawSchema[prop].includes('integer')) {
            defaultValue = 1;

        }

        if (type && defaultValue) {
            result[prop] = {
                type,
                default: defaultValue
            }
        }
    }

    console.log(`Writing field names with sample data to pg-schema/${tableName}.schema.json`)
    fs.writeFileSync(`./pg-schema/${tableName}.schema.json`, JSON.stringify(result))
}

buildSchemaWithDefaultValues('employee');
buildSchemaWithDefaultValues('employeecrisisassessment');