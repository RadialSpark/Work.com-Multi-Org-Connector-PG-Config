const fs = require('fs');
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

    fs.writeFileSync(`./pg-schema/${tableName}.schema.json`, JSON.stringify(result))
    console.log(result)
}

buildWithExamples('employee');
buildWithExamples('employeecrisisassessment');