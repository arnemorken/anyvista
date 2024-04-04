/* jshint sub:true */
/* jshint esversion: 9 */
/* globals anyTableFactory,dbTable,alasql, */
"use strict";

/********************************************************************************************
 *                                                                                          *
 * anyVista is copyright (C) 2011-2024 Arne D. Morken and Balanse Software.                 *
 *                                                                                          *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use. *
 * Get licences here: http://balanse.info/anyvista/license/                                 *
 *                                                                                          *
 ********************************************************************************************/

/**
 * Class for interacting with an anyVista Alasql database table.
 *
 * Inherits from `dbTable`, which manages the database connection.
 * Contains methods for doing search, insert, update and delete on an AlaSQL database table.
 * Supports user defined table format.
 * The table format must be described in a table class that inherits from `anyTable`.
 * See `types/userTable.js` and `types/groupTable.js` for examples.
 *
 * @class anyTable
 * @constructor
 * @param {Object} connection Info about the database connection. See `db/dbConnection.js`
 * @param {Object} parameters An object which may contain the following properties:
 *
 * @param {String}     parameters.type       Type of the table, e.g. "event".
 * @param {String}     parameters.idKey      The id key used in the table, e.g. "event_id".
 * @param {String}     parameters.nameKey    The name key used in the table, e.g. "event_name".
 * @param {String}     parameters.tableName  Name of the main table, e.g. "any_event". Mandatory.
 * @param {String}     parameters.orderBy    The field to sort by. e.g. "event_date_start".
 * @param {String}     parameters.orderDir   The direction of the sort, "ASC" or "DESC".
 * @param {String|int} parameters.id
 * ... TODO!
 */
var anyTable = function (connection,paramOrType)
{
  /**
  * The type of the table data (e.g. "event").
  *
  * @type       {String}
  * @default    null
  */
  this.type = null;

  /**
  * The id key used by the client, e.g. "event_id" or "user_id".
  *
  * @type       {String}
  * @default    null
  */
  this.idKey = null;

  /**
  * The name key used by the client and in the table, e.g. "event_name" or "login_name".
  *
  * @type       {String}
  * @default    null
  */
  this.nameKey = null;

  /**
  * The field to sort by. e.g. "event_date_start".
  *
  * @type       {String}
  * @default    null
  */
  this.orderBy = null;

  /**
  * The direction of the sort, "ASC" or "DESC".
  *
  * @type       {String}
  * @default    "DESC"
  */
  this.orderDir = "DESC";

  /**
  * Whether a header should be generated, or the header to return.
  *
  * @type       {Boolean|String}
  * @default    true
  */
  this.header = false;

  /**
  * Name of the main table, e.g. "any_event".
  *
  * @type       {String}
  * @default    null
  */
  this.tableName = null;

  /**
  * Name of the group table, e.g. "any_group".
  *
  * @type       {String}
  * @default    "any_group"
  */
  this.tableNameGroup = "any_group";

  /**
  * Name of the group link table for this table type, e.g. "any_event_group".
  *
  * @type       {String}
  * @default    null
  */
  this.tableNameGroupLink = null;

  /**
  * The field names of the table.
  * Must be set by deriving class.
  *
  * @type       {Array}
  * @default    null
  */
  this.tableFields = null;

  /**
  * The field names to left join with (for each type).
  * Should be set by deriving class.
  *
  * @type       {Object}
  * @default    null
  */
  this.tableFieldsLeftJoin = null;

  /**
  *
  *
  * @type       {Array}
  * @default    null
  */
  this.linkTypes = null;

  /**
  *
  *
  * @type       {String}
  * @default    null
  */
  this.path = "";

  /**
  * Contains data for a list or an item.
  *
  * @type       {Object}
  * @default    null
  */
  this.data = null;

  /**
  * The id is null if operating on a list, non-null if item.
  *
  * @type       {String|int}
  * @default    null
  */
  this.id = null;

  /**
  * The value of max id after a search for it.
  *
  * @type       {String|int}
  * @default    null
  */
  this.maxId = -1;

  /**
  * Number of rows returned by search.
  *
  * @type       {int}
  * @default    null
  */
  this.numResults = -1;

  /**
  * Prefix of tables.
  *
  * @type       {String}
  * @default    null
  */
  this.tablePrefix = ""; // TODO! Give as param!

  // TODO! i18n
  this.insertSuccessMsg  = "Insert succeeded. ";
  this.deleteSuccessMsg  = "%% deleted. ";
  this.itemExists        = "Item already exist. ";
  this.itemUnexists      = "Item does not exist. ";
  this.insertNothingToDo = "Nothing to insert. ";
  this.deleteNothingToDo = "Nothing to delete. ";

  this.groupTable = null; // Set by dbSearchItemLists, dbSearchList and dbUpdateLinkList

  // Initiate the database connection
  dbTable.call(this,connection);
  if (!this.connection) {
    this.error = "No connection to database. ";
    return;
  }
  // Initialize properties
  if (!this.initProperties(paramOrType))
    return;
}; // constructor

anyTable.prototype = new dbTable();
anyTable.prototype.constructor = anyTable;

anyTable.prototype.initProperties = function(paramOrType)
{
  this.error   = "";
  this.message = "";
  //
  // Determine type (mandatory)
  //
  if (typeof paramOrType == "string")
    this.type = paramOrType;
  else
  if (typeof paramOrType == "object")
    this.type = paramOrType.type;
  if (!this.type) {
    this.error += "anyTable: Type missing. ";
    console.error(this.error);
    return false;
  }
  //
  // Override class properties from properties in paramOrType (if it is an array)
  //
  if (typeof paramOrType == "object") {
    if (paramOrType["id"])                  this.id                  = paramOrType["id"];

    if (paramOrType["idKey"])               this.idKey               = paramOrType["idKey"];
    if (paramOrType["nameKey"])             this.nameKey             = paramOrType["nameKey"];
    if (paramOrType["orderBy"])             this.orderBy             = paramOrType["orderBy"];
    if (paramOrType["orderDir"])            this.orderDir            = paramOrType["orderDir"];
    if (paramOrType["header"] != undefined) this.header              = paramOrType["header"];
    if (paramOrType["tableName"])           this.tableName           = paramOrType["tableName"];
    if (paramOrType["tableNameGroup"])      this.tableNameGroup      = paramOrType["tableNameGroup"];
    if (paramOrType["tableNameGroupLink"])  this.tableNameGroupLink  = paramOrType["tableNameGroupLink"];
    if (paramOrType["tableFields"])         this.tableFields         = paramOrType["tableFields"];
    if (paramOrType["tableFieldsLeftJoin"]) this.tableFieldsLeftJoin = paramOrType["tableFieldsLeftJoin"];
    if (paramOrType["linkTypes"])           this.linkTypes           = paramOrType["linkTypes"];

    if (paramOrType["path"])                this.path                = paramOrType["path"];
  }
  //
  // Set defaults if not set yet
  //
  if (!this.idKey)               this.idKey          = this.type + "_id";
  if (!this.nameKey)             this.nameKey        = this.type + "_name";
  if (!this.orderBy)             this.orderBy        = this.nameKey;
  if (!this.orderDir)            this.orderDir       = "DESC";
  if (this.header === undefined) this.header         = false;
  if (!this.tableName)           this.tableName      = this.tablePrefix + this.type;
  if (!this.tableNameGroup)      this.tableNameGroup = this.tablePrefix + "group";
  if (!this.tableNameGroupLink) {
    let ltn = ["group",this.type].sort();
    this.tableNameGroupLink = this.tablePrefix + ltn.join("_");
  }
  if (!this.tableFields) { // Set default minimal table fields
    this.tableFields = [ this.idKey,
                         this.nameKey,
                       ];
  }
  if (!this.tableFieldsLeftJoin) { // Set default left join to group_id
    this.tableFieldsLeftJoin = {
      group: [ "group_id" ]
    };
  }
  if (!this.linkTypes)
    this.linkTypes = { group: { className:     "groupTable",
                                tableName:     "group",
                                linkTableName: "group_"+this.type  } };
  if (!this.linkTypes[this.type]) // Add the current type as a "link" in order to work with sub-items
    this.linkTypes[this.type] = { [this.type]: { className:     this.type+"Table",
                                                 tableName:     this.type,
                                                 linkTableName: "group_"+this.type  } };

  if (!this.insertSuccessMsg)
    this.insertSuccessMsg = this.type.capitalize()+" created. ";
  if (!this.updateSuccessMsg)
    this.updateSuccessMsg = this.type.capitalize()+" updated. ";
  if (!this.deleteSuccessMsg)
    this.deleteSuccessMsg = this.type.capitalize()+" deleted. ";

  // Make sure some vital fields exist
  if (!this.tableFields.includes(this.orderBy))
    this.orderBy = this.tableFields[0];
  if (!this.tableFields.includes(this.idKeyTable))
    this.idKeyTable = this.tableFields[0];

  return true;
}; // initProperties

/**
 * Override and return true in table classes which have parent_id.
 */
anyTable.prototype.hasParentId = function()
{
  return false;
}; // hasParentId

/////////////////////////
//////// finders ////////
/////////////////////////

anyTable.prototype.findHeader = function(inData)
{
  let hdr = "";
  let h = this.header;
  if (h && h !== "false" && h !== "true" && h !== false && h !== true)
    hdr = h; // Use the header provided in the in-parameter
  else
  if (!this.id || this.id == "") {
    if (h === true || h === "true")
      hdr = this.findDefaultListHeader(this.type);
  }
  else {
    if (h !== false && h !== "false")
      hdr = this.findDefaultItemHeader(this.type,inData);
  }
  return hdr;
}; // findHeader

anyTable.prototype.findDefaultHeader = function(type,skipOther)
{
  let other = skipOther ? "" : "Other "; // TODO: i18n
  return other+type+"s";                 // TODO: i18n
}; // findDefaultHeader

anyTable.prototype.findDefaultListHeader = function(type)
{
  return type.charAt(0).toUpperCase() + type.slice(1) + " list"; // TODO! i18n
}; // findDefaultListHeader

anyTable.prototype.findDefaultItemHeader = function(type,inData,linkId)
{
  let hdr = "";
  if (!inData)
    return type.charAt(0).toUpperCase() + type.slice(1);
  let ix = inData["+" + this.id]
           ? "+" + this.id
           : this.id;
  hdr = "";
  if (inData[ix][this.nameKey])
    hdr = inData[ix][this.nameKey];
  else
  if (linkId)
    this.error = this.nameKey + " missing"; // TODO! i18n
  return hdr;
}; // findDefaultItemHeader

anyTable.prototype.findDefaultItemListHeader = function(linkType)
{
  let s = linkType.charAt(0).toUpperCase() + linkType.slice(1);
  return s+"s"; // TODO! i18n
}; // findDefaultItemListHeader

anyTable.prototype.findDefaultNogroupHeader = function(type,skipOther)
{
  return this.findDefaultHeader(type,skipOther);
}; // findDefaultNogroupHeader

anyTable.prototype.findLinkTableId = function(linkType)
{
  let str = linkType+"_id";
  return str;
}; // findLinkTableId

anyTable.prototype.findLinkTableName = function(linkType)
{
  if (!linkType)
    return null;
  if (linkType == this.type)
    return this.tableName;
  return this.linkTypes[linkType].linkTableName;
}; // findLinkTableName

anyTable.prototype.findTypeTableId = function(type)
{
  let str = (type == "user")
            ? ANY_DB_USER_ID
            : type+"_id";
  return str;
}; // findTypeTableId

anyTable.prototype.findTypeTableName = function(type)
{
  let str = (type == "user")
            ? ANY_DB_USER_TABLE
            : this.linkTypes && this.linkTypes[type]
              ? this.linkTypes[type].tableName
              : "";
  return str;
}; // findTypeTableName

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Searches ////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

/**
 * Search database for an item, a list, a max id or a list of parents.
 *
 * If options.id == "max", search for max id.
 * If options.id == "par", search for parent list.
 * If options.id has another non-null value, search for the item with the given id.
 * Otherwise, search for a list.
 *
 * @return array|null Data array, or null on error or no data
 */
anyTable.prototype.dbSearch = function(options)
{
  let self = this;
  return this._dbSearch(options)
  .then( function(data) {
    if (self.error)
      throw self.error;
    if (data)
      self.data = self.prepareData(data);
    return Promise.resolve(self.data);
  })
  .catch(function(err) {
    console.log(err);
    self.error = err;
    return Promise.resolve(null);
  });
}; // dbSearch

// Internal method, do not call directly.
anyTable.prototype._dbSearch = async function(options)
{
  let type = options && options.type ? options.type : this.type;
  let id   = options && options.id   ? options.id   : this.id;
  if (!type) {
    this.error = "dbSearch: type missing. ";
    return Promise.resolve(null);
  }
  this.type  = type;
  this.id    = id;
  this.data  = null;
  this.error = "";

  if (id == "max")
    return await this.dbSearchMaxId();
  else
  if (id == "par")
    return await this.dbSearchParents();
  else
  if (id || id === 0)
    return await this.dbSearchItem(options);
  else
    return await this.dbSearchList(options);
}; // _dbSearch

//////////////////////////////// Item search ////////////////////////////////

//
// Search database for an item, including linked lists.
//
anyTable.prototype.dbSearchItem = async function(options) // TODO! Is async needed here?
{
  options.key = options ? this.idKey : null;
  options.val = options ? options.id : null;
  return this.dbSearchItemByKey(options);
}; // dbSearchItem

anyTable.prototype.dbSearchItemByKey = function(options)
{
  let groupId   = options ? options.groupId : null; // If "groupId" is specified, search only in that group.
  let grouping  = options && typeof options.grouping  == "boolean" ? options.grouping  : true; // Grouping of the lists of the item (currently not used)
  let skipLinks = options && typeof options.skipLinks == "boolean" ? options.skipLinks : false;
  let key       = options ? options.key     : null;
  let val       = options ? options.val     : null;

  if (!key || !val) {
    this.error = "Missing key or value. "; // TODO! i18n
    return Promise.resolve(false);
  }
  this.numResults = 0;
  // Build and execute the query
  let stmt = this.dbPrepareSearchItemStmt(key,val);
  //console.log("dbSearchItemByKey:"+stmt);
  let self = this;
  return alasql.promise(stmt)
  .then (async function(rows) { // TODO! Is async needed here?
    // Get the data
    if (self.getRowData(rows,"item",grouping)) {
      if (!skipLinks)
        await self.dbSearchItemLists(groupId,grouping); // TODO! Is await needed here?
      if (self.id && self.data[self.id]) {
        self.data[self.id]["item"] = self.type;
        self.data["id"] = self.id;
      }
      self.numResults = 1;
    }
    return Promise.resolve(self.data);
  });
}; // dbSearchItemByKey

// Get query fragments and build the query
anyTable.prototype.dbPrepareSearchItemStmt = function(key,val)
{
  let select    = this.findItemSelect();
  let left_join = this.findItemLeftJoin();
  let where     = this.findItemWhere(key,val);
  let stmt = select+
             "FROM " +this.tableName+" "+
             left_join+
             where;
  return stmt;
}; // dbPrepareSearchItemStmt

anyTable.prototype.findItemSelect = function()
{
    // Select from own table
  let si = "SELECT DISTINCT "+this.tableName+".* ";

  // Get parent name
  if (this.hasParentId())
    si += ", temp."+this.nameKey+" AS parent_name";

  si += " ";
  return si;
}; // findItemSelect

anyTable.prototype.findItemLeftJoin = function()
{
  let lj = "";
  // Get parent name
  if (this.hasParentId())
      lj += "LEFT JOIN "+this.tableName+" temp "+
            "ON "       +this.tableName+".parent_id=temp."+this.idKey+" ";
  return lj;
}; // findItemLeftJoin

anyTable.prototype.findItemWhere = function(key,val)
{
  let where = "";
  if (key && val)
    where += "WHERE "+this.tableName+"."+key+"="+val+" ";
  return where;
}; // findItemWhere

//
// Search for lists associated with the item
//
anyTable.prototype.dbSearchItemLists = async function(groupId,grouping)
{
  // If no link types found, return with no error
  if (!this.linkTypes)
    return Promise.resolve(true);
  // Must have an id
  if (!this.id && this.id !== 0) {
    this.error = "No id while searching for linked lists. "; // TODO! i18n
    return Promise.resolve(false);
  }
  // Search through all registered link types/tables
  for (let link_type in this.linkTypes) {
    if (this.linkTypes.hasOwnProperty(link_type))
      await this.dbSearchItemListOfType(link_type,groupId,grouping);
  }
  return Promise.resolve(this.data);
}; // dbSearchItemLists

anyTable.prototype.dbSearchItemListOfType = async function(linkType,groupId,grouping)
{
  let link_tablename = this.findLinkTableName(linkType);
  if (this.tableExists(link_tablename)) {
    let factory = new anyTableFactory(this.connection);
    let link_classname = this.linkTypes[linkType].className;
    let table = await factory.createClass(link_classname,{type:linkType,header:true,path:this.path});
    //console.log("created class "+link_classname);
    let self = this;
    return await table.dbSearchList({ linkType: self.type,
                                      linkId:   self.id,
                                      groupId:  groupId,
                                      grouping: grouping })
    .then( function(data) {
      if (table.error)
        self.error += table.error;
      if (data) {
        let idx      = self.id;
        let link_idx = "link-"+linkType;
        if (!self.data[idx]["data"])
          self.data[idx]["data"] = {};
        if (!self.data[idx]["data"][link_idx])
          self.data[idx]["data"][link_idx] = {};
        self.data[idx]["data"]["grouping"]           = grouping;
        self.data[idx]["data"][link_idx]["grouping"] = grouping;
        self.data[idx]["data"][link_idx]["head"]     = linkType;
        self.data[idx]["data"][link_idx]["data"]     = table.data;
        if (table.nameKey)
          self.data[idx]["data"][link_idx][table.nameKey] = self.findDefaultItemListHeader(linkType);
        //console.log("item list "+linkType+":");
        //console.log(self.data);
        return Promise.resolve(data);
      }
    });
  }
}; // dbSearchItemListOfType

//////////////////////////////// List search ////////////////////////////////

//
// Search database for a list
// Returns true on success, false on error
//
anyTable.prototype.dbSearchList = async function(options)
{
  if (!this.type) {
    this.error = "dbSearchList: No type. ";
    console.error(this.error);
    return Promise.resolve(null);
  }
  let linkType = options                                         ? options.linkType : null;
  let linkId   = options                                         ? options.linkId   : null;
  let groupId  = options                                         ? options.groupId  : null;
  let grouping = options && typeof options.grouping == "boolean" ? options.grouping : true;
  let simple   = options && typeof options.simple   == "boolean" ? options.simple   : false;

  let group_data = {};
  if (this.groupTable)
    group_data = this.groupTable.data; // We already have group data
  else
  if (grouping && this.type != "group") {
    // Get group data to a "flat" list
    let factory     = new anyTableFactory(this.connection);
    this.groupTable = await factory.createClass("groupTable",{type:"group",header:false,path:this.path});
    group_data = await this.groupTable.dbSearchGroupInfo(this.type,groupId,false);
    //console.log("dbSearchList,group_data("+this.type+","+groupId+"):"); console.log(group_data);
    if (!group_data || !group_data["group"])
      this.error = this.groupTable.error;
  }
  // Build and execute the query
  this.numResults = 0;
  let success = false;
  if ((groupId || groupId===0) && this.type != "group") {
    // Query data from the given group (or "nogroup")
    success = await this.dbExecListStmt(groupId,this.type,linkType,linkId,grouping,simple);
  }
  else
  if (!grouping || this.type == "group") {
    // Query all data, non-grouped
    success = await this.dbExecListStmt(null,this.type,linkType,linkId,grouping,simple);
  }
  else {
    // Query grouped data
    let has_nogroup = false;
    if (group_data && group_data["group"]) {
      for (let gid in group_data["group"]) {
        let group = group_data["group"][gid];
        if (group["group_type"] == this.type) {
          if (this.tableExists(this.tableNameGroupLink)) {
            success = await this.dbExecListStmt(gid,this.type,linkType,linkId,grouping,simple) || success;
            if (gid == "nogroup")
              has_nogroup = true;
          }
        }
      } // for
    } // if
    // Build and execute the query for ungrouped data (if not queried already)
    if (!has_nogroup)
      success = await this.dbExecListStmt("nogroup",this.type,linkType,linkId,grouping,simple) || success;

    // Build and execute the query for grouped data that may have illegal group type (i.e. not same as list type).
    // TODO!
  } // else

  if (!success)
    return Promise.resolve(null);

  // Sort the list
  // TODO!

  // Group the data and build the data tree
  if (!this.groupTable) {
    this.groupTable = this;
    group_data = this.data;
  }
  if (group_data && grouping) {
    group_data["group"] = this.groupTable.buildDataTree(group_data["group"]);
    this.data = this.buildGroupTreeAndAttach(this.data,group_data,linkId,grouping,simple);
  }
  //console.log("dbSearchList, tree list data:"); console.log(this.data);

  return Promise.resolve(this.data);
}; // dbSearchList

anyTable.prototype.dbExecListStmt = function(groupId,type,linkType,linkId,grouping,simple,groupType,searchTerm)
{
  // Build and execute the query for a group
  if (groupId == "nogroup")
    groupId = null;
  let stmt = this.dbPrepareSearchListStmt(groupId,type,linkType,linkId,grouping,groupType,searchTerm);
  //console.log("dbExecListStmt1:"+stmt);
  let self = this;
  return alasql.promise(stmt)
  .then( function(rows) {
    let success = self.getRowData(rows,"list",grouping,simple);
    self.numResults += rows.length;
    //console.log("dbExecListStmt, raw list data:"); console.log(data);
    return Promise.resolve(success);
  });
}; // dbExecListStmt

 // Get query fragments and build the query
anyTable.prototype.dbPrepareSearchListStmt = function(groupId,type,linkType,linkId,grouping,groupType,searchTerm)
{
  let link_tablename = this.findLinkTableName(linkType);

  let select    = this.findListSelect  (link_tablename,groupId,type,linkType,linkId,grouping);
  let left_join = this.findListLeftJoin(link_tablename,groupId,type,linkType,linkId,grouping);
  let where     = this.findListWhere   (link_tablename,groupId,type,linkType,linkId,grouping,groupType,searchTerm);
  let order_by  = this.findListOrderBy();

  let stmt = select+
             "FROM "+this.tableName+" "+
             left_join+
             where+
             order_by;
  return stmt;
}; // dbPrepareSearchListStmt

anyTable.prototype.findListSelect = function(linkTableName,groupId,type,linkType,linkId,grouping)
{
  // Select from own table
  let sl = "SELECT DISTINCT "+this.tableName+".* ";

  // Always select from group table, except if has parent_id while being a list-for list
  if ((groupId || groupId === 0) && this.groupTable && this.type != "group") {
    for (let idx in this.groupTable.tableFields) {
      let field = this.groupTable.tableFields[idx];
      if (field != "parent_id") // To avoid conflict with the current tables parent_id
        sl += ", "+this.tableNameGroup+"."+field;
    }
  }
  // Select from link table
  if ((linkId || linkId === 0) && linkType) {
    if (linkType != "group" &&
        this.tableFieldsLeftJoin && this.tableFieldsLeftJoin[linkType]) {
      let linktable = linkTableName ? linkTableName : this.findLinkTableName(linkType);
      if (this.tableExists(linktable)) {
        for (let idx in this.tableFieldsLeftJoin[linkType]) {
          let field = this.tableFieldsLeftJoin[linkType][idx];
          sl += ", "+linktable+"."+field;
        }
      }
    }
    if (this.hasParentId())
      sl += ", temp."+this.nameKey+" AS parent_name";
  }
  sl += " ";
  return sl;
}; // findListSelect

anyTable.prototype.findListLeftJoin = function(linkTableName,groupId,type,linkType,linkId,grouping)
{
  let lj = "";
  if (this.hasParentId())
    lj += "LEFT JOIN "+this.tableName+" temp ON "+this.tableName+".parent_id=temp."+this.idKey+" ";
  // Always left join group table, except if has parent_id while being a list-for list
  if (type != "group")
    lj += this.findListLeftJoinOne(groupId,"group",linkId,grouping);

  // Left join link  table
  if (linkId || linkId === 0 && linkType) {
    if (linkType != "group" &&
        this.tableFieldsLeftJoin && this.tableFieldsLeftJoin[linkType]) {
      lj += this.findListLeftJoinOne(groupId,linkType,linkId,grouping);
    }
  }
  return lj;
}; // findListLeftJoin

function isNumeric(n) { // TODO! Put somewhere else
  return !isNaN(parseFloat(n)) && isFinite(n);
}

anyTable.prototype.findListLeftJoinOne = function(groupId,linkType,linkId,grouping)
{
  let linktable     = this.findLinkTableName(linkType);
  let typetable     = this.findTypeTableName(linkType);
  let linktable_id  = this.findLinkTableId(linkType);
  let typetable_id  = this.findTypeTableId(linkType);
  let has_linktable = this.tableExists(linktable);
  let has_typetable = this.tableExists(typetable);

  let lj = "";
  if (has_linktable) {
    lj += "LEFT JOIN "+linktable+" ON CAST("+linktable+"."+this.idKey+" AS INT)=CAST("+this.tableName+"."+this.idKey+" AS INT) ";
    if (this.hasParentId() && linkId == null)
      lj += "OR "+linktable+"."+this.idKey+"=temp."+this.idKey+" ";
    if (has_typetable) {
      if (linkType != "group") {
        lj += "LEFT JOIN "+typetable+" ON CAST("+linktable+"."+linktable_id+" AS INT)=CAST("+typetable+"."+typetable_id+" AS INT) ";
      }
    }
  }
  if (has_typetable && linkType == "group" && (groupId || groupId === 0)) {
    let db_gid = isNumeric(groupId) ? "CAST("+groupId+" AS INT)" : "'"+groupId+"'";
    lj += "LEFT JOIN "+typetable+" ON CAST("+typetable+"."+typetable_id+" AS INT)="+db_gid+" ";
    lj += "AND "+this.tableNameGroup+".group_type='"+this.type+"' ";
  }
  return lj;
}; // findListLeftJoinOne

anyTable.prototype.findListWhere = function(linkTableName,groupId,type,linkType,linkId,grouping,groupType,searchTerm)
{
  let where = "";
  let skipOwnType = linkType == this.type;

  if (!skipOwnType &&
      linkType &&
      (linkId || linkId === 0) && linkId != "nogroup" &&
      this.tableExists(linkTableName)) {
    let db_id = linkType == "group" ? "'"+linkId+"'" : linkId;
    let where_id = linkTableName+"."+linkType+"_id="+db_id+" "; // TODO! semi-hardcoded id of link table
    where += "WHERE "+where_id;
  }
  let has_group_linktable = this.tableExists(this.tableNameGroupLink);
  // If has parent_id while being a list-for list
  if (this.hasParentId() && (linkType || (this.id || this.id === 0))) {
    if ((this.id || this.id === 0) && isNumeric(this.id) &&
        (!linkType || (linkType && linkType == this.type))) {
      let gstr = this.tableName+"."+this.idKey+" IN ( "+
                 "SELECT "+this.tableName+"."+this.idKey+" "+
                 "FROM (SELECT @pv := 'this.id') "+
                 "INITIALISATION WHERE find_in_set("+this.tableName+".parent_id, @pv) > 0 "+
                 "AND   @pv := concat(@pv, ',', "   +this.tableName+"."+this.idKey+") "+
                 ") ";
      if (where === "")
        where  = "WHERE ("+gstr+") ";
      else
        where += " OR ("+gstr+") ";
      if ((groupId || groupId === 0) && has_group_linktable)
        where += "AND "+this.tableNameGroupLink+".group_id=CAST("+groupId+" AS INT) ";
    }
  }
  if (skipOwnType &&
      this.id != "nogroup") {
    let db_id = this.type == "group" ? "'"+this.id+"'" : this.id;
    let skip_str = this.tableName+"."+this.idKey+" != "+db_id+"";
    if (where === "")
      where  = "WHERE ("+skip_str+") ";
    else
      where += " AND ("+skip_str+") ";
  }
  if (searchTerm) { // TODO
    let term_str = this.tableName+"."+this.mNameKey+" LIKE '%"+searchTerm+"%'";
    if (where === "")
      where  = "WHERE ("+term_str+") ";
    else
      where += " AND ("+term_str+") ";
  }
  if (groupId) {
    if (groupType) {
      let gt_str = this.tableNameGroup+".group_type='"+groupType+"' ";
      if (where === "")
        where  = " WHERE "+gt_str;
      else
        where += " AND "+gt_str;
    }
    if (!linkType) {
      if (has_group_linktable) {
        let db_gid = isNumeric(groupId) ? "CAST("+groupId+" AS INT)" : "'"+groupId+"'";
        let lf_str = this.tableNameGroup+".group_id="+db_gid+" ";
        if (where === "")
          where  = " WHERE "+lf_str;
        else
          where += " AND "+lf_str;
        where += "AND "+this.tableNameGroupLink+".group_id=CAST("+groupId+" AS INT) ";
      }
      else {
        if (this.message == "")
          this.message += "No link table for '"+this.type+"' group. ";
      }
    }
  }
  else {
    if (grouping && this.type != "group" && has_group_linktable &&
        !(this.hasParentId() && (linkType || (this.id && this.id != "")))) {
      let n_str = this.tableNameGroupLink+".group_id is null ";
      if (where === "")
        where  = " WHERE "+n_str;
      else
        where += " AND "+n_str;
    }
  }
  return where;
}; // findListWhere

anyTable.prototype.findListOrderBy = function()
{
  if (!this.orderBy)
    return "";
  let dir = this.orderDir ? this.orderDir : "";
  let ob  = "ORDER BY " + this.tableName + "." + this.orderBy + " " + dir + " ";
  return ob;
}; // findListOrderBy

anyTable.prototype.findLimit = function()
{
  // TODO! Not implemented
  return "";
}; // findLimit

////////////////////////////// Misc. searches //////////////////////////////

//
// Find max id for a table.
//
anyTable.prototype.dbSearchMaxId = async function()
{
  let maxstr = "MAX("+this.idKey+")";
  let stmt   = "SELECT "+maxstr+" FROM "+this.tableName;
  let self   = this;
  self.maxId = -1;
  return await alasql.promise(stmt)
  .then (function(data) {
    if (data && data[0])
      self.maxId = data[0][maxstr];
    //console.log("max:"); console.log(self.maxId);
    return {id:self.maxId};
  });
}; // dbSearchMaxId

anyTable.prototype.dbSearchParents = function()
{
  // Not implemented yet
}; // dbSearchParents

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Data retrieval //////////////////////////////
/////////////////////////////////////////////////////////////////////////////

//
// Get the data from query result (rows) to data array.
//
anyTable.prototype.getRowData = function(rows,mode,grouping,simple)
{
  if (!this.data)
    this.data = {};
  for (let i=0; i<rows.length; i++) {
    //console.log(i+":"+JSON.stringify(rows[i]));
    let gid  = rows[i]["group_id"]
               ? rows[i]["group_id"]
               : "nogroup";
    let gidx = grouping && this.type != "group"
               ? gid
               : this.type;
    let idx  = rows[i][this.idKey]
               ? rows[i][this.idKey]
               : null;
    if (!idx && idx !== 0)
      continue;

    if ((mode == "list" || mode == "head")) {
      if (!this.data[gidx])
        this.data[gidx] = {};
      if (!this.data[gidx][idx])
        this.data[gidx][idx] = {};
      this.data[gidx][idx][mode] = this.type;
    }
    else {
      if (!this.data[idx])
        this.data[idx] = {};
      this.data[idx] = {};
      this.data[idx][mode] = this.type;
    }

    // Main table
    if (this.tableFields) {
      for (let t=0; t<this.tableFields.length; t++) {
        let field = this.tableFields[t];
        if (!simple || field == this.idKey || field == this.nameKey || field == "parent_id") // TODO!
          this.getCellData(field,rows[i],this.data,idx,gidx,null/*filter*/,mode);
      } // for
    }

    // Link tables for item
    if (this.linkTypes) {
      for (let link_type in this.linkTypes) {
        if (this.tableFieldsLeftJoin[link_type]) {
          for (let t=0; t<this.tableFieldsLeftJoin[link_type].length; t++) {
            let field = this.tableFieldsLeftJoin[link_type][t];
            if (!simple || field == this.idKey || field == this.nameKey || field == "parent_id") // TODO!
              this.getCellData(field,rows[i],this.data,idx,gidx,null/*filter*/,mode);
          } // for
        } // if
      } // for
    } // if

  } // for
  //console.log("getRowData ("+this.type+"),this.data:"); console.log(this.data);

  if (!this.data)
    return false;
  return true;
}; // getRowData

anyTable.prototype.getCellData = function(tablefield,nextrow,data,idx,gidx,filter,mode)
{
    if (nextrow != null) {
      let field = null;
      if (tablefield == this.idKey)
        field = this.idKey; // Map id name (e.g. "user_id" and not "ID")
      else
        field = tablefield;
      if (nextrow[tablefield]) {
        let val = null;
        //if ((filter === null || (filter[field] && filter[field] == 1)))
          val = nextrow[tablefield];
        //else
        //  val = null;
        if (val != null && val != "") {
          if (mode == "list" || mode == "head")
            data[gidx][idx][field] = val;
          else
            data[idx][field] = val;
          //console.log("getCellData:"+gidx+","+idx+","+tablefield+","+field+":"+val);
        }
      }
    }
}; // getCellData

//
// Build the data group tree for all groups for a list search.
//
anyTable.prototype.buildGroupTreeAndAttach = function(data,group_data,linkId,grouping,simple)
{
  if (!data)
    return null;

  // Make sure parent/child items are present in all groups where parent exists
  //console.log("buildGroupTreeAndAttach,data before copying parent/child:"); console.log(data);
  for (let gidx in data) {
    if (data.hasOwnProperty(gidx)) {
      let grp = data[gidx];
      for (let idx in grp) {
        if (grp.hasOwnProperty(idx)) {
          let item = grp[idx];
          if (item && item["parent_id"]) {
            let pid = item["parent_id"];
            for (let gidx2 in data) {
              if (data.hasOwnProperty(gidx2)) {
                let grp2 = data[gidx2];
                let item_parent = grp2[pid] || grp2[pid] === 0
                                  ? grp2[pid]
                                  : grp2["+"+pid] || grp2["+"+pid] === 0
                                    ? grp2["+"+pid]
                                    : null;
                if (item_parent && gidx2 != gidx) {
                  //console.log("found child "+idx+" in group "+gidx+" with parent "+pid+"...");
                  if (!grp2[idx] && !grp2["+"+idx])
                    grp2[idx] = item;  // Copy child to other group
                  if (!grp[pid] && !grp["+"+pid]) {
                    let name = item[this.nameKey];
                    let err = "Warning: Item "+idx+" ("+name+") does not have parent in same group. "; // TODO i18n
                    this.error = err;
                    console.log(err);
                  }
                } // if
              } // if
            } // for
          } // if
        } // if
      } // for
    } // if
  } // for

  // Build data tree
  //console.log("buildGroupTreeAndAttach,group_data:");                console.log(group_data);
  //console.log("buildGroupTreeAndAttach,data before building tree:"); console.log(data);
  let data_tree = {};
  data_tree["grouping"] = grouping;
  for (let gidx in data) {
    if (data.hasOwnProperty(gidx) && !gidx.startsWith("grouping")) {
      let ngidx = linkId
                  ? this.type
                  : Number.isInteger(gidx)
                    ? "+"+gidx
                    : gidx;
      if (!data_tree[ngidx]) // TODO! This may not be the correct solution
        data_tree[ngidx] = {};
      if (grouping && data[gidx]) {
        data_tree[ngidx]["head"] = "group";
        if (!linkId) {
          data_tree[ngidx]["group_type"] = this.type;
          data_tree[ngidx]["group_id"]   = ngidx;
          let gname = group_data && group_data["group"] && group_data["group"][ngidx]
                      ? group_data["group"][ngidx]["group_name"]
                      : data_tree[ngidx]["group_type"].capitalize()+" groups"; // TODO i18n
          if (this.type != "group") {
            if (!gname || gname == "")
              gname = this.findDefaultHeader(this.type);
          }
          else {
            if (!gname || gname == "")
              if (gidx != "group")
                gname = data_tree[ngidx]["group_type"].capitalize()+" groups"; // TODO i18n
              else
                gname = "Other groups"; // TODO i18n
          }
          data_tree[ngidx]["group_name"] = gname;
        }
        else {
          let idx = data[gidx][linkId] ? linkId : "+" + linkId;
          if (data[gidx][idx])
            data_tree[ngidx][this.nameKey] = data[gidx][idx][this.nameKey];
        }
      } // if grouping
      if (!data_tree[ngidx]["data"]) { // TODO! This may not be the correct solution
        data_tree[ngidx]["data"] = this.buildDataTree(data[gidx],null);
        if (data_tree[ngidx]["data"] && data_tree[ngidx]["data"].data)
          data_tree[ngidx]["data"] = data_tree[ngidx]["data"].data; // TODO! Not the correct solution!
      }
      // Preserve "grouping_num_results" value
      if (data[gidx] && data[gidx]["grouping_num_results"])
        data_tree[ngidx]["data"]["grouping_num_results"] = data[gidx]["grouping_num_results"];
      if (data_tree[ngidx]["data"] && !Object.size(data_tree[ngidx]["data"]))
        delete data_tree[ngidx]["data"];
    } // if hasOwnProperty
  } // for
  //console.log("buildGroupTreeAndAttach,data_tree1:"); console.log(data_tree);
  //
  // If grouping is specified, build group tree and stick data tree to it
  //
  if (grouping && !simple &&
      (!this.id && this.id !== 0) &&
      (!linkId && linkId !== 0)) {
    /*
    if (!data_tree["unknown"])
      data_tree["unknown"] = null;
    if (data_tree["unknown"]) {
      group_data["group"]["unknown"] = null;
      group_data["group"]["unknown"]["group_id"]   = "unknown";
      group_data["group"]["unknown"]["group_name"] = "Unknown"; // TODO! i18n
      group_data["group"]["unknown"]["group_description"] = this.type.capitalize()+"s belonging to non-"+this.type+" group&nbsp;&nbsp;"+
                                                            '<i style="color:red" class="fa fad fa-exclamation-triangle"></i>'; // TODO! i18n and CSS
    }
    */
    if (!group_data["group"])
      group_data["group"] = {};
    this.dbAttachToGroups(group_data["group"],data_tree);
    group_data["group"]["grouping"] = true;
    //console.log("buildGroupTreeAndAttach,group_data:"); console.log(group_data);
    data = group_data["group"];
  }
  else {
    if (linkId)
      data = data_tree[this.type] && data_tree[this.type]["data"]
             ? data_tree[this.type]["data"]
             : data_tree;
    else
      data = data_tree;
  }
  //console.log("buildGroupTreeAndAttach,data after building tree:"); console.log(data);
  return data;
}; // buildGroupTreeAndAttach

// Overridden in group table
anyTable.prototype.dbSearchGroupInfo = async function(type,groupId,grouping)
{
  // Get group tree and append data to it
  let data = {};
  data["group"] = {};
  data["group"] = this.buildDataTree(data["group"],null);
  //console.log("dbSearchGroupInfo,data:"); console.log(data);

  // Add the default "nogroup" group
  if (type && type != "") {
    data["group"]["nogroup"] = {};
    data["group"]["nogroup"]["group_type"] = type;
    data["group"]["nogroup"]["group_id"]   = "nogroup";
    data["group"]["nogroup"]["group_name"] = this.findDefaultNogroupHeader(type);
    data["group"]["nogroup"]["head"]       = "group";
  }
  //console.log("dbSearchGroupInfo,data:"); console.log(data);
  return data;
}; // dbSearchGroupInfo

// Build data tree from parent-child relations
anyTable.prototype.buildDataTree = function(flatdata,parentId)
{
  if (!flatdata)
    return null;
  let retval = {};
  let id_name = this.idKey;
  for (let idx in flatdata) {
    if (flatdata.hasOwnProperty(idx)) {
      let subdata = flatdata[idx];
      if (subdata && !idx.startsWith("grouping")) {
        let parent_not_in_group = subdata["parent_id"] && subdata["parent_id"] != "" &&
                                  !flatdata[subdata["parent_id"]] && !flatdata["+"+subdata["parent_id"]];
        let pid = null;
        if (parent_not_in_group) {
          pid = subdata["parent_id"];
          delete subdata["parent_id"];
        }
        if (typeof subdata === "object") {
          if (!subdata["parent_id"])
            delete subdata["parent_id"]; // = null;
          if (subdata["parent_id"] == parentId) {
            let children = null;
            if (subdata[id_name] && subdata[id_name] != "")
              children = this.buildDataTree(flatdata,subdata[id_name]);
            if (children && Object.size(children))
              subdata["data"] = children;
            if (parent_not_in_group && (pid || pid === 0))
              subdata["parent_id"] = pid;
            retval[idx] = subdata;
            subdata = null;
          }
          else {
            if (pid != null)
              subdata["parent_id"] = pid;
          }
        } // if typeof
      } // if subdata
    } // if
  } // for
  return retval;
}; // buildDataTree

anyTable.prototype.dbAttachToGroups = function(group_tree,data_tree)
{
  //console.log("dbAttachToGroups,group_tree:"); console.log(group_tree);
  //console.log("dbAttachToGroups,data_tree:");  console.log(data_tree);
  if (group_tree) {
    for (let gid in group_tree) { // Iterate over group ids
      let group = group_tree[gid];
      if (group) {
        if (group["data"] && Object.size(group["data"]))
          this.dbAttachToGroups(group["data"],data_tree); // Recursive call
        if (group["data"]) {
          group["head"] = "group";
          if (this.type != "group") {
            if (group["list"]) delete group["list"];
            if (group["item"]) delete group["item"];
          }
        }
        let idx = null;
        if (data_tree[gid])
          idx = gid;
        else
        if (data_tree["+"+gid])
          idx = "+"+gid;
        if (idx && data_tree[idx]) {
          if (data_tree[idx]["data"]) {
            group["head"] = "group";
            if (this.type != "group") {
              if (group["list"]) delete group["list"];
              if (group["item"]) delete group["item"];
            }
            if (!group["data"])
              group["data"] = {};
            for (let id in data_tree[idx]["data"]) {
              group["data"][id] = data_tree[idx]["data"][id];
            }
          }
        } // if idx
      } // if group
    } // for
  } // if group_tree
}; // dbAttachToGroups

/**
 * Prepare data related to a list or a single item. Adds a default top header.
 */
anyTable.prototype.prepareData = function(inData)
{
  //console.log("inData before prepare:"); console.log(inData);
  // Make room for a top level header
  let topidx = "+0";
  if (this.id || this.id === 0)
    topidx = this.id;
  let data = {"data": { [topidx]: {} }};

  // Set header and "head"
  let hdr = this.findHeader(inData);
  if (hdr && hdr != "") {
    data["data"][topidx]["head"] = "group";
    data["data"][topidx]["group_name"] = hdr;
  }

  // Set data
  data["data"][topidx]["data"] = inData;

  // Set link types
  data["linkTypes"] = this.linkTypes;

  //console.log("data after prepare:"); console.log(data);
  return data;
}; // prepareData

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Insert //////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

anyTable.prototype.dbInsert = async function(options)
{
  if (!options || !options.keys || !options.values || !this.dbValidateInsert(options))
    return Promise.resolve(null);

  this.id = options.id ? options.id : null;

  // Insert in normal table
  let stmt = await this.dbPrepareInsertStmt(options.keys,options.values);
  if (!stmt)
    return Promise.resolve(null);
  stmt = stmt.replace(/(?:\r\n|\r|\n)/g,""); // Remove all newlines
  let self = this;
  //console.log("dbInsert:"+stmt);
  return await alasql.promise(stmt)
  .then( async function(res) {
    // numRowsChanged == 1 if the insert succeeded
    self.numRowsChanged = res;
    //console.log("ins res:"+res);
    if (self.numRowsChanged == 0) {
      self.message = self.insertNothingToDo;
      return Promise.resolve(self);
    }
    // An id will have been auto-created if the insert succeeded
    self.id             = await self.queryMaxId(self.tableName);
    self.last_insert_id = self.id; // TODO! Neccessary?

    // Set result message
    self.message = self.insertSuccessMsg;

    // Call success handler
    if (options.onSuccess && options.context)
      options.onSuccess.call(options.context,options.context,self,options);

    return Promise.resolve(self);
  })
  .catch(error => {
     console.error("Insert error: "+error);
     return Promise.resolve(null);
  });
}; // dbInsert

anyTable.prototype.dbValidateInsert = function(options)
{
  this.error = "";
  // Validate here, set this.error
  if (this.error != "")
    return false;
  return true;
}; // dbValidateInsert

anyTable.prototype.dbPrepareInsertStmt = async function(keys,values)
{
  if (!keys || !values)
    return null;
  let stmt = "INSERT INTO "+this.tableName+" (";
  let at_least_one = false;
  if (this.id) {
    stmt += this.idKey+",";
    at_least_one = true;
  }
  for (let i=0; i<keys.length; i++) {
    let key = keys[i];
    let val = values[i];
    if (["head","item","list"].includes(key))
      continue;
    if (val && val !== "") {
      at_least_one = true;
      stmt += key+",";
    }
    if (key == this.idKey) {
      // Check if item with this id key exists
      let res = await this.dbItemExists(val);
      if (res) {
        this.error = this.type + this.itemExists;
        return null;
      }
    }
  }
  if (!at_least_one)
    return null;
  let pos = stmt.length-1;
  stmt = stmt.substring(0,pos) + "" + stmt.substring(pos+1); // Replace last "," with ""
  stmt += ") VALUES (";
  if (this.id)
    stmt += this.id+",";
  for (let i=0; i<keys.length; i++) {
    let key = keys[i];
    let val = values[i];
    if (["head","item","list"].includes(key))
      continue;
    if (val && val !== "" && typeof val === "string")
      stmt += "'"+val+"',";
    else
      stmt += val+",";
  }
  pos = stmt.length-1;
  stmt = stmt.substring(0,pos) + "" + stmt.substring(pos+1); // Replace last "," with ""
  stmt += ")";
  return stmt;
}; // dbPrepareInsertStmt

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Update //////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

anyTable.prototype.dbUpdate = async function(options)
{
  if (!options || !this.dbValidateUpdate(options))
    return Promise.resolve(null);

  if (!options.id || options.id == "" || options.is_new)
    return await this.dbInsert(options); // Assume it is a new item to be inserted // TODO! Is await needed here?

  this.id = options.id;

  if (options.add || options.rem)
    return this.dbUpdateLinkList();

  if (options.cha) // TODO! Not tested
    return this.dbUpdateLink();

  // Update normal table
  let stmt = await this.dbPrepareUpdateStmt(options.keys,options.values);
  if (!stmt)
    return Promise.resolve(null);

  stmt = stmt.replace(/(?:\r\n|\r|\n)/g,""); // Remove all newlines
  let self = this;
  //console.log("dbUpdate:"+stmt);
  return await alasql.promise(stmt)
  .then( function(res) {
    // numRowsChanged >= 1 if the update succeeded
    self.numRowsChanged = res;
    //console.log("upd res:"+res);
    if (self.numRowsChanged == 0) {
      self.message = self.updateNothingToDo; // TODO! updateNothingToDo
      return Promise.resolve(self);
    }
    // Set result message
    self.message = self.updateSuccessMsg; // TODO! updateSuccessMsg

    // Call success handler
    if (options.onSuccess && options.context)
      options.onSuccess.call(options.context,options.context,self,options);

    return Promise.resolve(self);
  })
  .catch(error => {
     console.error("Update error: "+error);
     return Promise.resolve(null);
  });
}; // dbUpdate

anyTable.prototype.dbValidateUpdate = function(options)
{
  this.error = "";
  // Validate here, set this.error
  if (this.error != "")
    return false;
  return true;
}; // dbValidateUpdate

anyTable.prototype.dbPrepareUpdateStmt = async function(keys,values)
{
  let res = await this.dbItemExists(this.id);
  if (!res) {
    this.error = this.type + this.itemUnexists + " ("+this.id+") ";
    return null;
  }
  if (!keys || !values)
    return null;
  let stmt = "UPDATE "+this.tableName+" SET ";
  let to_set = "";
  for (let i=0; i<keys.length; i++) {
    let key = keys[i];
    let val = values[i];
    if (val && val !== "") {
      to_set += this.dbPrepareUpdateStmtKeyVal(key,val);
    }
  }
  if (to_set == "")
    return null;
  let pos = to_set.length-1;
  to_set = to_set.substring(0,pos) + "" + to_set.substring(pos+1); // Replace last "," with ""
  stmt += to_set + " WHERE " + this.idKey + "=" + this.id + " ";
  return stmt;
}; // dbPrepareUpdateStmt

anyTable.prototype.dbPrepareUpdateStmtKeyVal = function(key,val)
{
  if (!val || val === "")
    return key + "=NULL,";
  let kstr = typeof val === "string"
             ? "='" + val + "',"
             : "=" + val + ",";
  return key + kstr;
}; // dbPrepareUpdateStmtKeyVal

anyTable.prototype.dbItemExists = async function(id)
{
  let stmt = "SELECT * FROM " + this.tableName + " WHERE " + this.idKey + "=" + id + " ";
  //console.log("dbItemExists:"+stmt);
  try {
    return await alasql.promise(stmt)
    .then( function(res) {
      if (res.length)
        return true;
      return false;
    })
    .catch(error => {
       console.error("dbItemExists error: "+error);
       return false;
    });
  }
  catch (err) {
    console.log("dbItemExists: "+err);
  }
}; // dbItemExists

/////////////////////////////////////////////////////////////////////////////
/////////////////////////// Insert or update link ///////////////////////////
/////////////////////////////////////////////////////////////////////////////

// Add or remove a link
anyTable.prototype.dbUpdateLinkList = async function(options)
{
  if (!options)
    return Promise.resolve(null);

  let link_type = options.link_type;
  if (!link_type) {
    this.error = "Link type missing. "; // TODO! i18n
    return Promise.resolve(null);
  }
  let id_key      = this.idKey;
  let id_key_link = link_type + "_id"; // TODO! Not general enough
  let id          = options.id;
  if ((!id && id !== 0) || id == "") {
    this.error = this.type+" id missing. "; // TODO! i18n
    return Promise.resolve(null);
  }
  let inslist = options.add;
  let dellist = options.rem;

  if (link_type != this.type) {
    // Link with different type (sublist of item)
    let link_table = this.findLinkTableName(link_type);
    if (!link_table) {
      this.error = "Link table not found. "; // TODO! i18n
      return Promise.resolve(null);
    }
    if (dellist) {
      // Remove elements from the item's list
      for (let i=0; i<dellist.length; i++) {
        let delval = dellist[i];
        if (delval) {
          let stmt = "DELETE FROM "+link_table+" "+
                     "WHERE "+
                     id_key_link+"="+delval+" "+
                     "AND "+
                     id_key+     "="+id+"";
          //console.log("dbUpdateLinkList(1):"+stmt);
          await alasql.promise(stmt);
        }
      }
    }
    if (inslist) {
      // Add elements to the item's list (delete, then insert to avoid error if element already exists in list)
      for (let i=0; i<inslist.length; i++) {
        let insval = inslist[i];
        if (insval) {
          let stmt = "DELETE FROM "+link_table+" "+
                     "WHERE "+
                     id_key_link+"="+insval+" "+
                     "AND "+
                     id_key+     "="+id+"";
          //console.log("dbUpdateLinkList(2):"+stmt);
          await alasql.promise(stmt);
          stmt = "INSERT INTO "+link_table+" ("+
                 id_key_link+","+id_key+
                 ") VALUES ("+
                 insval+","+id+
                 ")";
          //console.log("dbUpdateLinkList(3):"+stmt);
          await alasql.promise(stmt);
        }
      }
    }
  }
  else {
    // Link with same type (sub-element with parent id)
    if (this.hasParentId()) {
      if (dellist) {
        // Remove parent for elements in dellist
        for (let i=0; i<dellist.length; i++) {
          let delval = dellist[i];
          if (delval) {
            let stmt = "UPDATE "+this.tableName+" "+
                       "SET parent_id=NULL "+
                       "WHERE "+id_key+"="+delval+"";
            //console.log("dbUpdateLinkList(4):"+stmt);
            await alasql.promise(stmt);
          }
        }
      }
      if (inslist) {
        // Set parent for elements in inslist
        for (let i=0; i<inslist.length; i++) {
          let updval = inslist[i];
          if (updval && updval != id) {
            let stmt = "UPDATE "+this.tableName+" "+
                       "SET parent_id="+id+" "+
                       "WHERE "+id_key+"="+updval+"";
            //console.log("dbUpdateLinkList(5):"+stmt);
            await alasql.promise(stmt);
          }
        }
      }
    }
  }
}; // dbUpdateLinkList

// Update the fields of a link. The link must exist in the link table.
anyTable.prototype.dbUpdateLink = async function(options)
{
  if (!options)
    return Promise.resolve(null);

  let link_type = options.link_type;
  if (!link_type || link_type == "") {
    this.error = "Link type missing. "; // TODO! i18n
    return Promise.resolve(null);
  }
  let idKey = options.idKey ? options.idKey : this.idKey;
  let id    = options.id    ? options.id    : this.id;
  if ((!id && id !== 0) || id == "") {
    this.error = this.type+" id missing. "; // TODO! i18n
    return Promise.resolve(null);
  }
  let link_id = options.link_id;
  if ((!link_id && link_id !== 0) || link_id == "") {
    this.error = link_type+" id missing. "; // TODO! i18n
    return Promise.resolve(null);
  }
  // Check if exists
  let link_table = this.findLinkTableName(link_type);
  if (link_table === null) {
    this.error = "Link table not found";
    return Promise.resolve(null);
  }
  /*
  let id_key_link = link_type+"_id"; // TODO! Not general enough
  if (!this.dbTableHasLink(link_table,id_key_link,link_id,this.idKey,this.id)) {
    this.message = "Link not found"; // TODO! i18n
    return Promise.resolve(null);
  }
  */
  // Link found, we can update it
  if (this.tableFieldsLeftJoin && this.tableFieldsLeftJoin[link_type]) {
    let val_found = false;
    let stmt = "UPDATE "+link_table+" SET ";
    for (let t=0; t<this.tableFieldsLeftJoin[link_type].length; t++) {
      let str = this.tableFieldsLeftJoin[link_type][t];
      let par = options[str];
      if (par || par===0) {
        let pstr = typeof par === "string"
                   ? "='"+par+"',"
                   : "="+par+",";
        stmt += str + pstr;
        val_found = true;
      }
    }
    if (!val_found)
      return Promise.resolve(null);
    stmt = stmt.substring(0,stmt.length-1)+' '; // Replace last char (',') with ' *
    stmt += "WHERE "+idKey+"="+id;
    //console.log("dbUpdateLink:"+stmt);
    if (!this.query(stmt,false,true))
      return Promise.resolve(null);
  }
  return Promise.resolve(null);
}; // dbUpdateLink

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Delete //////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

/**
 * Deletes an item of given type with given id from a database table or a file from disk.
 * TODO! Delete a list of items.
 *
 * @return array|null Data array, or null on error or no data
 */
anyTable.prototype.dbDelete = async function(options)
{
  if (!options)
    Promise.resolve(null);

  // Delete item(s) from table or file from disk
  if (options.del == "ulf") {
    // Delete file from disk (upload folder)
    if (!options.fname) {
      this.error = "Filename missing for delete. "; // TODO! i18n
      return Promise.resolve(false);
    }
    //unlink(gUploadPath+options.fname); // TODO! Delete from disk
    return Promise.resolve(true);
  }
  // Delete item(s) from table
  if (!this.dbValidateDelete(options))
    return Promise.resolve(null);
  let tableName = options.tableName ? options.tableName : this.tableName;
  let idKey     = options.idKey     ? options.idKey     : this.idKey;
  let id        = options.id        ? options.id        : this.id;
  let stmt      = "DELETE FROM "+tableName+" WHERE "+idKey+"="+id;
  let self = this;
  //console.log("dbDelete(1):"+stmt);
  return await alasql.promise(stmt)
  .then( async function(res) {
    //console.log("del res:"+res);
    self.numRowsChanged = res; // numRowsChanged >= 1 if the delete succeeded
    if (self.numRowsChanged > 0) {
      let tstr = options.type ? options.type.capitalize() : "unknown type"; // TODO! i18n
      self.message = self.deleteSuccessMsg.replace("%%",""+tstr);
    }
    else
      self.message = self.deleteNothingToDo;

    // Update parent_id of children
    if (self.hasParentId()) {
      stmt = "UPDATE "+tableName+" SET parent_id=NULL WHERE parent_id="+id;
      //console.log("dbDelete(2):"+stmt);
      if (!self.query(stmt,false,true)) // TODO! alasql.promise...
        return Promise.resolve(null);
    }
    // Delete all links for an item with given id from associated tables (to avoid orphaned links)
    if (self.linkTypes) {
      for (let link_type in self.linkTypes) {
        if (self.type !== link_type) {
          let link_table = self.findLinkTableName(link_type);
          let stmt = "DELETE FROM "+link_table+" WHERE "+self.idKey+"="+id;
          //console.log("dbDelete(3):"+stmt);
          if (!self.query(stmt))
            return Promise.resolve(null);
        }
      }
    }
    self.id = null;
    // Call success handler
    if (options.onSuccess && options.context)
      options.onSuccess.call(options.context,options.context,self,options);

    return Promise.resolve(self);
  })
  .catch(error => {
     console.error("Delete error: "+error);
     return Promise.resolve(false);
  });
}; // dbDelete

anyTable.prototype.dbValidateDelete = function(options)
{
  this.error = "";
  if (!options) {
    this.error = "Options missing. "; // TODO! i18n
    return false;
  }
  let tableName = options.tableName ? options.tableName : this.tableName;
  let idKey     = options.idKey     ? options.idKey     : this.idKey;
  let id        = options.id        ? options.id        : this.id;
  if (!tableName)
    this.error += "Table name missing. "; // TODO! i18n
  if (!idKey)
    this.error += "Id key missing. "; // TODO! i18n
  if ((!id && id !== 0) || id == "" || !Number.isInteger(id))
    this.error += this.type+" id missing or not an integer. "; // TODO! i18n

  if (this.error != "")
    return false;
  return true;
}; // dbValidateDelete
