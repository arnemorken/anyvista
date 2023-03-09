/* jshint sub:true */
/* jshint esversion: 6 */
/* globals alasql,isInt */
"use strict";
/********************************************************************************************
 *                                                                                          *
 * anyVista is copyright (C) 2011-2023 Arne D. Morken and Balanse Software.                 *
 *                                                                                          *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use. *
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).                  *
 *                                                                                          *
 ********************************************************************************************/
/**
 * Class for creating and connecting to an alasql database.
 * The constructor optionally calls a user-defined function and returns a Promise.
 *
 * @class dbConnection
 * @constructor
 */
var dbConnection = function (options)
{
  if (!options)
    return;
  this.error   = "";
  if (!options.dbtype || options.dbtype == "")
    this.error += "Database type not specified. ";
  if (!options.dbname || options.dbname == "")
    this.error += "Database name missing. ";
  if (!options.dbversion || options.dbversion == "")
    this.error += "Unknown database version. ";
  if (this.error)
    return;

  let success_func = options.onSuccess,
      fail_func    = options.onFail,
      context      = options.context;
  if (!context)
    context = this;

  this.any_dbname = options.dbname + "_" + options.dbversion;

  // Create/connect to the database and create the tables
  let self = this;
  alasql.options.cache      = false;
  alasql.options.autocommit = true;
  alasql.promise(
    "CREATE "+options.dbtype+" DATABASE IF NOT EXISTS "+this.any_dbname+";"+
    "ATTACH "+options.dbtype+" DATABASE "              +this.any_dbname+";"+
    "USE "                                             +this.any_dbname
  )
  .then( function(res) {
    // Database should now be created and connected
    // res[0] == 1 if CREATE succeeded
    // res[1] == 1 if ATTACH succeeded
    // res[2] == 1 if USE succeeded
    //console.log("create res:"+res);
    self.aladbase = alasql.databases[self.any_dbname]; // Used by tableExists
    return success_func
           ? success_func.call(context,options) // Call user defined success handler
           : res;
  })
  // Catch alasql errors
  .catch( function(err) {
    // Fatal error: Could not create or connect to database
    self.error = self.any_dbname+":"+err;
    console.error(self.error);
    return fail_func
           ? fail_func.call(context,err) // Call user defined error handler
           : false;
  });
}; // constructor

dbConnection.prototype.tableExists = function(tableName)
{
  if (!this.aladbase)
    return false;
  let res = this.aladbase.tables && this.aladbase.tables[tableName];
  return res === undefined
         ? false
         : res;
}; // tableExists
