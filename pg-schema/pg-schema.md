# PG Schema
## Raw schemas
- Files ending in *.raw.json are simple mappings of **FIELD NAME** to **FIELD TYPE**
  - This information is derived from the CREATE script of each Heroku Connect table
- The fields listed in this configuration should match the Static Resources in the Work.com Multi-Org Connector package, which is used for Heroku Connect configuration
- Metadata fields related to Heroku Connect (ex. _hc_lastop, _hc_err) should not be included
- The PG ID (id) should not be included

### Example
```
{
    "employeestatus": "VARCHAR(255)",
    "sfid": "VARCHAR(18)",
    ...
}
```


## Formatted schemas
- Files ending in *.schema.json are used to generate sample data in a "dummy" PG View
  - This "dummy" view is created when there are no Heroku Connect tables available to contribute data to the specified view