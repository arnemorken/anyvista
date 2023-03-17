/* jshint sub:true */
/* jshint esversion: 9 */
/* globals $,i18n,any_defs,isFunction,w3_modaldialog,w3_modaldialog_close,tinyMCE,tinymce */
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
 * Base class for an Alasql database table.
 * Manages the database connection and performs SQL queries.
 *
 * @class dbTable
 * @constructor
 * @param {dbConnection} connection Info about the database connection
 * @example
 *      dbTable.call(this,connection)
 *
*/
var dbTable = function (connection)
{
  this.connection = connection;
  this.data       = null;
  this.error      = null;
  this.message    = null;
}; // constructor

//
// Create the database table associated with the class
//
dbTable.prototype.createTable = async function(mergeArray)
{
  if (!this.sqlCreate)
    return Promise.resolve(false);
  return await this.query(this.sqlCreate,mergeArray,true); // Create tables
}; // createTable

//
// Perform a single query if SQL is a string or multiple queries if SQL is an array.
// `SQL` should contain one or more SQL statements separated by `;` or an array of
// SQL statements (currently not working due to an error in alasql).
//
dbTable.prototype.query = function(SQL,mergeArray,disregardResult)
{
  if (!SQL)
    return Promise.resolve(false);
  if (Array.isArray(SQL) && (mergeArray==true || mergeArray===undefined)) {
    // Convert array to string
    let sql_str = "";
    SQL.forEach(function(str) { sql_str += str; });
    SQL = sql_str;
  }
  //console.log("dbTable query:"+SQL);
  let self = this;
  return alasql.promise(SQL)
  .then( function (data) {
    if (!disregardResult)
      self.data = data;
    return Promise.resolve(data);
  });
}; // query

dbTable.prototype.tableExists = function(tableName)
{
  if (!this.connection || !this.connection.aladbase || !this.connection.aladbase.tables)
    return false;
  return this.connection.aladbase.tables[tableName] != undefined
         ? true
         : false;
}; // tableExists