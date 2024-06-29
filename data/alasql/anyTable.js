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
 * @param {Object}        connection  Info about the database connection. See `db/dbConnection.js`
 * @param {Object|string} paramOrType A parameter object OR a type overriding the one set by deriving class.
 *                                    If an object, paramOrType may contain the following properties:
 *
 * @param {String}     parameters.type       Type of the table, e.g. "event".
 * @param {String}     parameters.idKey      The id key used in the table, e.g. "event_id".
 * @param {String}     parameters.nameKey    The name key used in the table, e.g. "event_name".
 * @param {String}     parameters.tableName  Name of the main table, e.g. "any_event". Mandatory.
 * @param {String}     parameters.orderBy    The field to sort by. e.g. "event_date_start".
 * @param {String}     parameters.orderDir   The direction of the sort, "ASC" or "DESC".
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
  this.tableNameGroup = "acugroup"; // TODO!

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

//
// Set properties from table definitions or type.
// Setting properties from type can be used in simple situations where
// the type class doesnt need to supply its own table definitions.
//
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
    if (paramOrType["idKey"])               this.idKey               = paramOrType["idKey"];
    if (paramOrType["nameKey"])             this.nameKey             = paramOrType["nameKey"];
    if (paramOrType["orderBy"])             this.orderBy             = paramOrType["orderBy"];
    if (paramOrType["orderDir"])            this.orderDir            = paramOrType["orderDir"];
  //if (paramOrType["header"] != undefined) this.header              = paramOrType["header"];
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
                                                 tableName:     this.type, // TODO! Not general enough
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
   * initFilters
   *
   * Extra initialization of filters, override this in deriving classes if needed
   */
anyTable.prototype.initFilters = function(filters)
{
  // TODO! Not implemented yet
} // initFilters

anyTable.prototype.initFiltersFromParam = function()
{
  // TODO! Not implemented yet
} // initFiltersFromParam

anyTable.prototype.initFieldsFromParam = function()
{
  // TODO! Not implemented yet
} // initFieldsFromParam

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

anyTable.prototype.findHeader = function(type,inData,id)
{
  let hdr = "";
  let h = this.header;
  if (h && h !== true && h !== "true" && h !== false && h !== "false")
    hdr = h; // Use the header provided in the in-parameter
  else
  if (!id || id == "") {
    if (h === true || h === "true")
      hdr = this.findDefaultListHeader(type);
  }
  else {
    if (h !== false && h !== "false")
      hdr = this.findDefaultItemHeader(type,inData,id);
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

anyTable.prototype.findDefaultItemHeader = function(type,inData,id)
{
  if (!inData || (!id && id !== 0))
    return type.charAt(0).toUpperCase() + type.slice(1);
  let hdr = "";
  if (inData["nogroup"] && inData["nogroup"]["data"]) {
    if (inData["nogroup"]["data"][id][this.nameKey])
      hdr = inData["nogroup"]["data"][id][this.nameKey];
  }
  else
    this.error = this.nameKey + " missing"; // TODO! i18n
  return hdr;
}; // findDefaultItemHeader

anyTable.prototype.findDefaultItemListHeader = function(type,skipOther)
{
  return this.findDefaultHeader(type,skipOther);
}; // findDefaultItemListHeader

anyTable.prototype.findDefaultNogroupHeader = function(type,skipOther)
{
  return this.findDefaultHeader(type,skipOther);
}; // findDefaultNogroupHeader

anyTable.prototype.findLinkTableName = function(linkType)
{
  if (!linkType || linkType == "")
    return null;
  if (linkType == this.type)
    return this.tableName;
  return this.linkTypes[linkType] ? this.linkTypes[linkType].linkTableName : null;
}; // findLinkTableName

anyTable.prototype.findLinkTableId = function(linkType)
{
  let str = linkType+"_id";
  return str;
}; // findLinkTableId

anyTable.prototype.findTypeTableName = function(type)
{
  if (type == "group")
    return this.tableNameGroup;
  return this.tablePrefix+type;
}; // findTypeTableName

anyTable.prototype.findTypeTableId = function(type)
{
  return type+"_id";
}; // findTypeTableId

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Searches ////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

/**
 * Search database for an item, a list, a max id or a list of parents.
 *
 * If options.id == "max", search for max id.
 * If options.id == "par", search for parent list.
 * If options.id has another non-null value, search for the item with the given id.
 * Otherwise, search for a list of the given type.
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
    if (self.maxId >= 0)
      return Promise.resolve(self.data);
    return Promise.resolve(self.prepareData(options?options.id:null));
  })
  .catch( function(err) {
    self.error = err;
    console.error(err);
    return Promise.resolve(null);
  });
}; // dbSearch

// Internal method called by dbSearch(), do not call directly.
anyTable.prototype._dbSearch = async function(options)
{
  if (!options)
    options = {};

  if (options.type)
    this.type = options.type;

  let id = this._initSearch(options);
  if (id == -1)
    return Promise.resolve(null);

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

anyTable.prototype._initSearch = function(options)
{
  let type = options &&  options.type ? options.type : this.type;
  if (!type) {
    this.error = "_initSearch: type missing. ";
    console.log(this.error);
    return -1;
  }
  this.data  = null;
  this.error = "";
  this.numResults = 0;

  //this.initFieldsFromParam();  // TODO! Not implemented yet
  //this.initFiltersFromParam(); // TODO! Not implemented yet

  let id = options && (options.id || options.id === 0) ? options.id   : null;
  return id;
}; // _initSearch

//////////////////////////////// Item search ////////////////////////////////

//
// Search database for an item, including linked lists.
// Return data structure on success, null on error.
//
anyTable.prototype.dbSearchItem = function(options)
{
  let id = this._initSearch(options);
  if (id == -1)
    return Promise.resolve(null);

  if (options) {
    options.key = this.idKey;
    options.val = id;
  }
  return this.dbSearchItemByKey(options);
}; // dbSearchItem

anyTable.prototype.dbSearchItemByKey = function(options)
{
  let key = options ? options.key : null;
  let val = options ? options.val : null;
  if (!key || !val) {
    this.error = "Missing key or value. "; // TODO! i18n
    return Promise.resolve(null);
  }
  let id        = options ? options.id      : null; // The id of the item to search for.
  let skipLinks = options && typeof options.skipLinks == "boolean" ? options.skipLinks : false;
  let groupId   = options ? options.groupId : null; // If "groupId" is specified, search only in that group.
  let grouping  = options && typeof options.grouping  == "boolean" ? options.grouping  : true; // Grouping of the lists of the item

  this.numResults = 0;
  // Build and execute the query
  let stmt = this.dbPrepareSearchItemStmt(key,val);
  //console.log("dbSearchItemByKey:"+stmt);
  let self = this;
  return alasql.promise(stmt)
  .then (async function(rows) {
    // Get the data
    if (self.getRowData(rows,self.data,"item",false,grouping)) {
      if (self.data && Object.keys(self.data).length > 0) {
        // Organize group at top
        let idx = Object.keys(self.data)[0];
        self.data[idx]["data"] = {};
        $.extend(true,self.data[idx]["data"],self.data[idx]); // TODO! Could slow down execution if large data structure
        delete self.data[idx][id];
      }
      if (!skipLinks)
        await self.dbSearchItemLists(id,grouping,groupId); // Get lists associated with the item
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
    si += ", tmp."+this.nameKey+" AS parent_name";

  si += " ";
  return si;
}; // findItemSelect

anyTable.prototype.findItemLeftJoin = function()
{
  let lj = "";
  // Get parent name
  if (this.hasParentId())
      lj += "LEFT JOIN "+this.tableName+" AS tmp "+
            "ON "       +this.tableName+".parent_id=tmp."+this.idKey+" ";
  return lj;
}; // findItemLeftJoin

anyTable.prototype.findItemWhere = function(key,val)
{
  let where = "WHERE "+this.tableName+"."+key+"="+val+" ";
  return where;
}; // findItemWhere

//
// Search for lists associated with the item
//
anyTable.prototype.dbSearchItemLists = async function(id,grouping,groupId)
{
  // If no link types found, return immediately
  if (!this.linkTypes)
    return Promise.resolve(null);
  // Must have an id
  if (!id && id !== 0) {
    this.error = "No id while searching for linked lists. "; // TODO! i18n
    return Promise.resolve(null);
  }
  // Search through all registered link types/tables
  for (let link_type in this.linkTypes) {
    if (this.linkTypes.hasOwnProperty(link_type))
      await this.dbSearchItemListOfType(id,link_type,grouping,groupId);
  }
  return Promise.resolve(this.data);
}; // dbSearchItemLists

anyTable.prototype.dbSearchItemListOfType = async function(id,linkType,grouping,groupId)
{
  let link_tablename = this.findLinkTableName(linkType);
  if (this.tableExists(link_tablename)) {
    let factory = new anyTableFactory(this.connection);
    let link_classname = this.linkTypes[linkType].className;
    let table = await factory.createClass(link_classname,{type:linkType, header:true, path:this.path});
    //console.log("created class "+link_classname);
    if (table && (table.type != this.type || this.hasParentId())) {
      grouping = false; // Do not group
      let self = this;
      return await table.dbSearchList({ linkType: self.type,
                                        linkId:   id,
                                        grouping: grouping,
                                        groupId:  groupId,
                                     })
      .then( function(data) {
        if (table.error)
          self.error += table.error;
        if (!data)
          return Promise.resolve(null);
        let gidx = Object.keys(self.data)[0];
        let idx  = id;
        let lidx = "link-"+linkType;
        let tgidx = idx;
        if (table.type == "group" || ((id || id === 0) && self.type != "group"))
          tgidx = gidx;
        if (!self.data)                                  self.data                                  = {};
        if (!self.data[gidx])                            self.data[gidx]                            = {};
        if (!self.data[gidx]["data"])                    self.data[gidx]["data"]                    = {};
        if (!self.data[gidx]["data"][idx])               self.data[gidx]["data"][idx]               = {};
        if (!self.data[gidx]["data"][idx]["data"])       self.data[gidx]["data"][idx]["data"]       = {};
        if (!self.data[gidx]["data"][idx]["data"][lidx]) self.data[gidx]["data"][idx]["data"][lidx] = {};
        self.data[gidx]["data"][idx]["data"]["grouping"]       = true;  // Group different link types by default.
        self.data[gidx]["data"][idx]["data"][lidx]["grouping"] = false; // The lists themselves are not grouped. TODO! Is this neccessary?
        self.data[gidx]["data"][idx]["data"][lidx]["head"]     = linkType;
        self.data[gidx]["data"][idx]["data"][lidx]["data"]     = table.data;
        if (table.nameKey)
          self.data[gidx]["data"][idx]["data"][lidx][table.nameKey] = self.findDefaultItemListHeader(linkType);
        //console.log("item list "+linkType+":"); console.log(self.data);
        return Promise.resolve(data);
      });
    } // if
  }
}; // dbSearchItemListOfType

//////////////////////////////// List search ////////////////////////////////

//
// Search database for a list.
// Return data structure on success, null on error.
//
anyTable.prototype.dbSearchList = async function(options)
{
  if (this._initSearch(options) == -1)
    return Promise.resolve(null);

  let linkId    = options                                         ? options.linkId    : null;
  let linkType  = options                                         ? options.linkType  : null;
  let groupId   = options                                         ? options.groupId   : null; // If "groupId" is specified, we need only search in that group
  let groupType = options                                         ? options.groupType : null; // If "groupType" is specified, search only for groups of that type
  let grouping  = options && typeof options.grouping == "boolean" ? options.grouping  : true;
  grouping      = grouping !== false && grouping !== "false" && grouping !== "0";
  let simple    = options && typeof options.simple   == "boolean" ? options.simple   : false; // In a "simple" list search we get only the id, name and parent_id
  simple        = simple === true || simple === "true" || simple   === "1";

  // Get group data, unless we are searching in a specific group
  let group_data = null;
  if (grouping) {
    if (this.groupTable)
      group_data = this.groupTable.data; // We already have group data
    else
    if (this.type != "group" && groupId != "nogroup") { // Read from group table
      // Get a "flat" group list, make it into a tree below
      let factory     = new anyTableFactory(this.connection);
      this.groupTable = await factory.createClass("groupTable",{type:"group",header:false,path:this.path});
      group_data = this.groupTable && (!this.groupTable.error || this.groupTable.error == "")
                   ? await this.groupTable.dbSearchGroupInfo(this.type,groupId,true)
                   : null;
      if (!group_data)
        this.message = this.groupTable.error; // Failing to find group data table is not an error
    }
  }

  // Build and execute the query
  let limit = ""; // TODO! Not implemented yet
  let success = false;
  this.numResults = 0; // Init total number of results

  // If a group id is given, query data from the given group only
  if (groupId || groupId === 0) {
    success = await this.dbExecListStmt(groupType,groupId,linkType,linkId,grouping,simple,limit);
  }
  else
  // If a 'LIMIT' operator applies, we need to search for results for each group separately
  if (limit) {
    // TODO! Not implemented yet
  }
  // Query data from all groups
  else {
    success = await this.dbExecListStmt(groupType,null,linkType,linkId,grouping,simple,limit);
  }

  if (!success)
    return Promise.resolve(null);

  // Sort the list
  // TODO! Not implemented yet

  // Group the data and build the data tree
  if (!this.groupTable || (this.groupTable.error && this.groupTable.error != ""))
    this.groupTable = this;
  if (!group_data)
    if (this.type == "group")
      group_data = this.data;
    else
      group_data = {};
  if (grouping || this.type == "group") {
    if (this.type == "group")
      group_data = this.groupTable.buildDataTree(group_data["nogroup"]);
    else
      group_data = this.groupTable.buildDataTree(group_data);
    this.buildGroupTreeAndAttach(group_data,linkId,grouping);
  }
  else
  if (!grouping) {
    let gtype = null;
    if (this.hostTable &&
        this.hostTable.data &&
        this.hostTable.data["nogroup"] &&
        this.hostTable.data["nogroup"]["data"] &&
        this.hostTable.data["nogroup"]["data"][linkId] &&
        this.hostTable.data["nogroup"]["data"][linkId]["group_type"])
      gtype = this.hostTable.data["nogroup"]["data"][linkId]["group_type"];
    if (gtype && gtype != this.type) {
      // We have an item in an illegal group. Ignore it, but log a warning.
      this.data = null;
      let gn = this.hostTable.data["nogroup"]["data"][linkId]["group_name"];
      let err = "Warning: One or more items of type "+this.type+" is in "+gtype+" group '"+gn+"' with id "+linkId; // TODO i18n
      this.setMessage(err);
      console.log(err);
    }
    else
    if (linkType != "group") {
      if (this.data && this.data["nogroup"])
        this.data = this.data["nogroup"];
    }
    else {
      if (this.data && this.data[linkId])
        this.data = this.data[linkId];
    }
  }
  //console.log("dbSearchList, tree list data:"); console.log(this.data);

  return Promise.resolve(this.data);
}; // dbSearchList

anyTable.prototype.dbExecListStmt = function(groupType,groupId,linkType,linkId,grouping,simple,limit,searchTerm)
{
  // Build and execute the query for a group
  let partial_stmt = this.dbPrepareSearchListStmt(groupType,groupId,linkType,linkId,grouping,searchTerm);
  let stmt = partial_stmt+limit;
  //console.log("dbExecListStmt1:"+stmt);
  let self = this;
  return alasql.promise(stmt)
  .then( function(rows) {
    // Get the data
    let success = self.getRowData(rows,self.data,"list",simple,grouping);
    let group_idx = Number.isInteger(groupId) ? parseInt(groupId) : groupId;
    if ((!group_idx && group_idx !== 0) || group_idx == "")
      group_idx = "nogroup";
    if (limit != "") {
      // Count how many rows would have been returned without LIMIT
      // TODO! Not implemented
    } // if
    else {
      // Report back number of elements in groups
      if (self.data && group_idx in self.data) {
        let n = Object.size(self.data[group_idx]);
        self.data[group_idx]["grouping_num_results"] = n;
        self.numResults += n;
      }
    }

    //console.log("dbExecListStmt, raw list data:"); console.log(data);
    return Promise.resolve(success);
  });
}; // dbExecListStmt

 // Get query fragments and build the query
anyTable.prototype.dbPrepareSearchListStmt = function(groupType,groupId,linkType,linkId,grouping,searchTerm)
{
  let linktable_name = this.findLinkTableName(linkType);
  let has_linktable  = this.tableExists(linktable_name);
  let select         = this.findListSelect  (groupId,linkType,linkId,grouping,linktable_name,has_linktable);
  let left_join      = this.findListLeftJoin(groupId,linkType,linkId,grouping,linktable_name,has_linktable);
  let where          = this.findListWhere   (groupType,groupId,linkType,linkId,grouping,searchTerm,linktable_name,has_linktable);
  let order_by       = this.findListOrderBy ();

  let stmt = select+
             "FROM "+this.tableName+" "+
             left_join+
             where+
             order_by;
  return stmt;
}; // dbPrepareSearchListStmt

anyTable.prototype.findListSelect = function(groupId,linkType,linkId,grouping,linktable_name,has_linktable)
{
  // Select from own table
  let sl = "SELECT DISTINCT "+this.tableName+".* ";

  // Select from link table
  if ((linkId || linkId === 0) && linkType &&
      this.tableFieldsLeftJoin && this.tableFieldsLeftJoin[linkType]) {
    let linktable_name = this.findLinkTableName(linkType);
    if (has_linktable) {
      for (let idx in this.tableFieldsLeftJoin[linkType]) {
        let field = this.tableFieldsLeftJoin[linkType][idx];
        if (field)
          sl += ", "+linktable_name+"."+field;
      }
      if (this.hasParentId())
        sl += ", tmp."+this.nameKey+" AS parent_name";
    }
  }
  // Select from group table
  let linktable_name_grp = this.findLinkTableName("group");
  let has_linktable_grp  = this.tableExists(linktable_name_grp);
  if (grouping && this.type != "group" && groupId != "nogroup" &&
      has_linktable_grp && this.groupTable && this.groupTable.tableFields) {
    let has_grouptable = this.tableExists(this.tableNameGroup);
    if (has_grouptable) {
      for (let idx in this.groupTable.tableFields) { // TODO! Is it neccessary to select all fields when this.type != group?
        let field = this.groupTable.tableFields[idx];
        if (field && field != "parent_id") // To avoid conflict with the current tables parent_id
          sl += ", "+this.tableNameGroup+"."+field;
      }
    }
  }
  sl += " ";
  return sl;
}; // findListSelect

anyTable.prototype.findListLeftJoin = function(groupId,linkType,linkId,grouping,linktable_name,has_linktable)
{
  let lj = "";

  // Left join own table to get parent name
  if (this.hasParentId())
    lj += "LEFT JOIN "+this.tableName+" AS tmp ON "+this.tableName+".parent_id=tmp."+this.idKey+" ";

  // Left join link  table
  if ((linkId || linkId === 0) && linkType && linkType != this.type)
    lj += this.findListLeftJoinOne(groupId,linkType,linkId,grouping,linktable_name,has_linktable);

  // Left join group table
  if (grouping && this.type != "group" && groupId != "nogroup" &&
      this.groupTable) {
    let linktable_name_grp = this.findLinkTableName("group");
    let has_linktable_grp  = this.tableExists(linktable_name_grp);
    lj += this.findListLeftJoinOne(groupId,"group",linkId,grouping,linktable_name_grp,has_linktable_grp);
  }

  return lj;
}; // findListLeftJoin

anyTable.prototype.findListLeftJoinOne = function(groupId,linkType,linkId,grouping,linktable_name,has_linktable)
{
  let typetable_name = this.findTypeTableName(linkType);
  let typetable_id   = this.findTypeTableId(linkType);
  let has_typetable  = this.tableExists(typetable_name);
  let linktable_id   = this.findLinkTableId(linkType);

  let lj = "";
  if (has_linktable) {
    lj += "LEFT JOIN "+linktable_name+" ON CAST("+linktable_name+"."+this.idKey+" AS INT)=CAST("+this.tableName+"."+this.idKey+" AS INT) ";

    // Also left join on parent id:
    if (this.hasParentId() && linkId == null)
      lj += "OR "+linktable_name+"."+this.idKey+"=tmp."+this.idKey+" ";

    if (has_typetable) {
      if (linkType != "group")
        lj += "LEFT JOIN "+typetable_name+" ON CAST("+linktable_name+"."+linktable_id+" AS INT)=CAST("+typetable_name+"."+typetable_id+" AS INT) ";
    }
  }
  let db_gid = !groupId && groupId !== 0 // No gid specified
               ? has_linktable
                 ? "CAST("+linktable_name+"."+linktable_id+" AS INT)"
                 : null
               : isNumeric(groupId) // Only left join with specified group
                 ? "CAST("+groupId+" AS INT)"
                 : "'"+groupId+"'";
  let has_grouptable = this.tableExists(this.tableNameGroup);
  if (db_gid && has_grouptable && has_typetable && typetable_name == this.tableNameGroup && this.type != "group"&& groupId != "nogroup") {
    lj += "LEFT JOIN "+typetable_name+" ON CAST("+typetable_name+"."+typetable_id+" AS INT)="+db_gid+" ";
    lj += "AND "+this.tableNameGroup+".group_type='"+this.type+"' ";
  }
  return lj;
}; // findListLeftJoinOne

anyTable.prototype.findListWhere = function(groupType,groupId,linkType,linkId,grouping,searchTerm,linktable_name,has_linktable)
{
  let where = "";

   // Match with linktable
  if (linkType && linkType != this.type && (linkId || linkId === 0) && linkId != "nogroup") {
    if (has_linktable) {
      let db_lid = linkType == "group" ? "'"+linkId+"'" : parseInt(linkId);
      let where_id = linktable_name+"."+linkType+"_id="+db_lid+" "; // TODO! semi-hardcoded name of link table id
      where += "WHERE "+where_id;
    }
  }

  let has_grouptable      = this.tableExists(this.tableNameGroup);
  let has_group_linktable = this.tableExists(this.tableNameGroupLink);

  // If has parent_id while being a list-for list
  if (this.hasParentId() && (linkType || (linkId || linkId === 0))) {
    if ((linkId || linkId === 0) && isNumeric(linkId) && (!linkType || linkType == this.type)) {
      let gstr = this.tableName+"."+this.idKey+" IN ( "+
                 "SELECT "+this.tableName+"."+this.idKey+" "+
                 "FROM (SELECT @pv := '"+linkId+"') "+
                 "INITIALISATION WHERE find_in_set("+this.tableName+".parent_id, @pv) > 0 "+
                 "AND   @pv := concat(@pv, ',', "   +this.tableName+"."+this.idKey+") "+
                 ") ";
      if (where === "")
        where  = "WHERE ("+gstr+") ";
      else
        where += " OR ("+gstr+") ";
      if (grouping && (groupId || groupId === 0) && has_group_linktable) {
        let db_gid = isNumeric(groupId) ? "CAST("+groupId+" AS INT)" : "'"+groupId+"'";
        where += "AND "+this.tableNameGroupLink+".group_id="+db_gid+" ";
      }
    }
  }

  // TODO! What's this for?
  if (linkType == this.type && linkId != "nogroup") {
    let db_id = this.type == "group" ? "'"+linkId+"'" : linkId;
    let skip_str = this.tableName+"."+this.idKey+" != "+db_id+"";
    if (where === "")
      where  = "WHERE ("+skip_str+") ";
    else
      where += " AND ("+skip_str+") ";
  }

  // Match with group table
  if (grouping && this.type != "group" && (groupId || groupId === 0) && groupId != "nogroup" &&
      has_grouptable && this.groupTable) {
    if (groupType) {
      let gt_str = this.tableNameGroup+".group_type='"+groupType+"' ";
      if (where === "")
        where  = " WHERE "+gt_str;
      else
        where += " AND "+gt_str;
    }
    if (has_group_linktable && !linkType) {
      let db_gid = isNumeric(groupId) ? "CAST("+groupId+" AS INT)" : "'"+groupId+"'";
      let lf_str = this.tableNameGroup+".group_id="+db_gid+" ";
      if (where === "")
        where  = " WHERE "+lf_str;
      else
        where += " AND "+lf_str;
      where += "AND "+this.tableNameGroupLink+".group_id="+db_gid+" ";
    }
  } // if grouping
  else
  if (this.type == "group" && groupType) {
    let gt_str = this.tableNameGroup+".group_type='"+groupType+"' ";
    if (where === "")
      where  = " WHERE "+gt_str;
    else
      where += " AND "+gt_str;
  }

  // Match search term
  if (searchTerm) {
    let term_str = this.tableName+"."+this.nameKey+" LIKE '%"+searchTerm+"%'";
    if (where === "")
      where  = "WHERE ("+term_str+") ";
    else
      where += " AND ("+term_str+") ";
  }
  return where;
}; // findListWhere

anyTable.prototype.findListOrderBy = function()
{
  let orderBy = this.orderBy;
  if (!this.tableFields.includes(orderBy))
    orderBy = this.tableFields[0];
  if (!orderBy)
    return "";
  let dir = this.orderDir ? this.orderDir : "";
  let ob = "ORDER BY " + this.tableName + "." + orderBy + " " + dir + " ";
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
  this.maxId = -1;

  let maxstr = "MAX("+this.idKey+")";
  let stmt   = "SELECT "+maxstr+" FROM "+this.tableName;
  let self   = this;
  return await alasql.promise(stmt)
  .then (function(data) {
    if (data && data[0])
      self.maxId = data[0][maxstr];
    //console.log("max:"+self.maxId);
    if (self.maxId == -1)
      self.error = "Max id not found. "; // TODO! i18n
    return {id:self.maxId};
  });
}; // dbSearchMaxId

anyTable.prototype.dbSearchParents = function()
{
  // Not implemented yet
}; // dbSearchParents

anyTable.prototype.dbSearchNameExists = function(tableName,name)
{
  if (tableName == "group")
    tableName = "acugroup";
  this.err = "";
  if (!this.tableExists(tableName)) {
    this.err = "anyTable: Table does not exist:"+tableName+". "; // TODO! i18n
    console.error(this.err);
    return Promise.resolve(false);
  }
  let illegal_char = (/^[\u3400-\u9FBFa-zæøåA-ZÆØÅ0-9������/(),.;:\-+_! ]*$/.test(name) === false); // Allow chinese chars
  if (!name || illegal_char) {
    this.err = "Missing or illegal file name. "; // TODO! i18n
    console.error(this.err);
    return Promise.resolve(false);
  }
  let query_str = "SELECT * FROM "+tableName+" WHERE "+tableName+"_name='"+name+"'";
  let self = this;
  return alasql.promise(query_str)
    .then (function(rows) {
      if (!rows || rows.length <= 0)
        return false;
      let dataType = tableName == "acugroup" ? "group" : tableName;
      self.exist_id = rows[0][dataType+"_id"];
      return true;
    })
    .catch(function(err) {
      self.err = err;
      console.error(self.err);
      return null;
    });
}; // dbSearchNameExists

/*
// TODO! Not tested!
anyTable.prototype.dbSearchIdExists = function(tableName,id)
{
  if (id == "new")
    return Promise.resolve(false);

  if (tableName == "group")
    tableName = "acugroup";
  this.err = "";
  if (!this.tableExists(tableName)) {
    this.err = "anyTable: Table does not exist:"+tableName+". "; // TODO! i18n
    console.error(this.err);
    return Promise.resolve(false);
  }
  let query_str = "SELECT "+tableName+"_id FROM "+tableName+" WHERE "+tableName+"_id="+id;
  let self = this;
  return alasql.promise(query_str)
    .then (function(rows) {
      if (!rows)
        return false;
      return (rows.length > 0);
    })
    .catch(function(err) {
      self.err = err;
      console.error(self.err);
      return null;
    });
}; // dbSearchIdExists
*/
// Check if item exists
anyTable.prototype.dbItemExists = async function(id)
{
  let stmt = "SELECT * FROM " + this.tableName + " WHERE " + this.idKey + "=" + id + " ";
  //console.log("dbItemExists:"+stmt);
  try {
    return await alasql.promise(stmt)
    .then( function(res) {
      return (res.length > 0);
    })
    .catch(error => {
       console.error(error);
       return false;
    });
  }
  catch (err) {
    console.log("dbItemExists: "+err);
  }
}; // dbItemExists

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Data retrieval //////////////////////////////
/////////////////////////////////////////////////////////////////////////////

//
// Get the data from query result (rows) to data array. If data is to be grouped, the first index
// is the group_id, otherwise it is "nogroup". The second index is the id of the data element, as
// specified by this.idKey. If the data element does not contain an id or has an illegal id, it is
// silently ignored.
//
anyTable.prototype.getRowData = function(rows,data,mode,simple,grouping)
{
  if (!data) {
    data = {};
    this.data = data;
  }
  for (let i=0; i<rows.length; i++) {
    //console.log("getRowData,row "+i+":"+JSON.stringify(rows[i]));
    if (rows[i]) {
      let gidx = grouping && !simple && this.type != "group" && rows[i]["group_id"]
                 ? rows[i]["group_id"]
                 : "nogroup";
      let idx  = rows[i][this.idKey]
                 ? rows[i][this.idKey]
                 : null;
      if (!idx && idx !== 0 || (typeof idx != "number" && typeof idx != "string"))
        continue; // Ignore element without id

      if (!data[gidx])      data[gidx]      = {};
      if (!data[gidx][idx]) data[gidx][idx] = {};

      data[gidx][idx][mode] = this.type;

      // Main table
      if (this.tableFields) {
        for (let t=0; t<this.tableFields.length; t++) {
          let tablefield = this.tableFields[t];
          if (!simple || tablefield == this.idKey || tablefield == this.nameKey || tablefield == "parent_id")
            this.getCellData(tablefield,rows[i],data,gidx,idx,null/*filter*/,mode);
        } // for
      }

      // Link tables for item
      if (this.linkTypes) {
        for (let link_type in this.linkTypes) {
          if (link_type && link_type != "" && this.tableFieldsLeftJoin[link_type]) {
            for (let t=0; t<this.tableFieldsLeftJoin[link_type].length; t++) {
              let tablefield = this.tableFieldsLeftJoin[link_type][t];
              if (!simple || tablefield == this.idKey || tablefield == this.nameKey || tablefield == "parent_id")
                this.getCellData(tablefield,rows[i],data,gidx,idx,null/*filter*/,mode);
            } // for
          } // if
        } // for
      } // if
    } // if rows
  } // for
  //console.log("getRowData ("+this.type+"),data:"); console.log(data);

  if (!data)
    return false;
  return true;
}; // getRowData

anyTable.prototype.getCellData = function(tablefield,nextrow,data,gidx,idx,filter,mode)
{
  let field = null;
  if (tablefield == this.idKey)
    field = this.idKey; // Map id name (e.g. "user_id" and not "ID") TODO! Not implemented
  else
    field = tablefield;
  if (nextrow[tablefield]) {
    let val = null;
    //if ((filter === null || (filter[field] && filter[field] == 1))) // TODO! Server filter not implemented
      val = nextrow[tablefield];
    //else
    //  val = null;
    if (val != null && val != "")
      data[gidx][idx][field] = val;
    //console.log("getCellData:"+gidx+","+idx+","+field+":"+val);
  }
}; // getCellData

//
// Build the data group tree for all groups for a list search.
//
anyTable.prototype.buildGroupTreeAndAttach = function(group_data,linkId,grouping)
{
  if (!this.data)
    return null;

  // Make sure parent/child items are present in all groups where parent exists
  //console.log("buildGroupTreeAndAttach,data before copying parent/child:"); console.log(this.data);
  for (let gidx in this.data) {
    if (this.data.hasOwnProperty(gidx)) {
      let grp = this.data[gidx];
      if (grp) {
        for (let idx in grp) {
          if (grp.hasOwnProperty(idx)) {
            let item = grp[idx];
            if (item && item["parent_id"] && item["parent_id"] != "") {
              let pid = item["parent_id"];
              for (let gidx2 in this.data) {
                if (this.data.hasOwnProperty(gidx2)) {
                  let grp2 = this.data[gidx2];
                  if (grp2) {
                    let item_parent = grp2[pid] || grp2[pid] === 0
                                      ? grp2[pid]
                                      : null;
                    if (item_parent && gidx2 != gidx) {
                      //console.log("found child "+idx+" in group "+gidx+" with parent "+pid+"...");
                      if (!grp2[idx] && grp2[idx] !== 0)
                        grp2[idx] = item;  // Copy child to other group
                      if (!grp[pid] && grp[pid] !== 0) {
                        let name = item[this.nameKey];
                        let err = "Warning: The parent of "+name+"("+idx+") also belongs to a different group. "; // TODO i18n
                        this.error = err;
                        console.log(err);
                      }
                    }
                  } // if grp2
                }
              } // for
            }
          }
        } // for
      } // if grp
    }
  } // for

  // Build data tree
  //console.log("buildGroupTreeAndAttach,group_data:");                console.log(group_data);
  //console.log("buildGroupTreeAndAttach,data before building tree:"); console.log(this.data);
  let data_tree = {};
  data_tree["grouping"] = grouping;
  for (let gidx in this.data) {
    if (this.data.hasOwnProperty(gidx) && !gidx.startsWith("grouping")) {
      let ngidx = gidx;
      if (!data_tree[ngidx])
        data_tree[ngidx] = {};
      if (grouping && this.data[gidx]) { // Add a head data layer
        data_tree[ngidx]["head"]       = "group";
        data_tree[ngidx]["group_type"] = this.type;
        data_tree[ngidx]["group_id"]   = ngidx;
        let gname = null;
        if (linkId || linkId === 0) {
          let gname = group_data && group_data[ngidx] && group_data[ngidx]["group_name"]
                      ? group_data[ngidx]["group_name"]
                      : data_tree[ngidx]["group_type"].capitalize()+" groups"; // TODO i18n
          if (!gname || gname == "")
            gname = this.findDefaultHeader(this.type);
        } // if linkId
        else {
          let idx = linkId;
          if (this.data[gidx]["data"] && this.data[gidx]["data"][idx])
            gname = this.data[gidx]["data"][idx][this.nameKey];
        }
        data_tree[ngidx]["group_name"] = gname
                                         ? gname
                                         : "Unknown group"; // TODO! i18n
      } // if grouping
      if (!data_tree[ngidx]["data"])
        data_tree[ngidx]["data"] = this.buildDataTree(this.data[gidx],null);

      // Preserve "grouping_num_results" value
      if (this.data[gidx] && this.data[gidx]["grouping_num_results"])
        data_tree[ngidx]["data"]["grouping_num_results"] = this.data[gidx]["grouping_num_results"];
      if (data_tree[ngidx]["data"] && Object.size(data_tree[ngidx]["data"]) == 0)
        delete data_tree[ngidx]["data"];
    } // if hasOwnProperty
  } // for
  //console.log("buildGroupTreeAndAttach,data_tree1:"); console.log(data_tree);
  //
  // If grouping is specified, build group tree and stick data tree to it
  //
  if (grouping && (!linkId && linkId !== 0 || linkId == "")) {
    if (!data_tree["unknown"])
      data_tree["unknown"] = null;
    if (data_tree["unknown"]) {
      group_data["unknown"] = null;
      group_data["unknown"]["group_id"]   = "unknown";
      group_data["unknown"]["group_name"] = "Unknown"; // TODO! i18n
      group_data["unknown"]["group_description"] = this.type.capitalize()+"s belonging to non-"+this.type+" group&nbsp;&nbsp;"+
                                                   '<i style="color:red" class="fa fad fa-exclamation-triangle"></i>'; // TODO! i18n and CSS
    }
    if (!group_data)
      group_data = {};
    this.dbAttachToGroups(group_data,data_tree,this.type);
    group_data["grouping"] = true;
    //console.log("buildGroupTreeAndAttach,group_data:"); console.log(group_data);
    if (Object.size(group_data) > 1)
      this.data = group_data;
    else {
      this.data = data_tree;
      if (this.data["unknown"] == null)
        delete this.data["unknown"];
    }
  }
  else {
    if (linkId || linkId === 0)
      this.data = data_tree[this.type] && data_tree[this.type]["data"]
                  ? data_tree[this.type]["data"]
                  : data_tree;
    else
      this.data = data_tree;
  }
  //console.log("buildGroupTreeAndAttach,data after building tree:"); console.log(this.data);
  return this.data;
}; // buildGroupTreeAndAttach

// Overridden in group table
anyTable.prototype.dbSearchGroupInfo = async function(type,groupId,grouping)
{
  // Get group tree and append data to it
  let data = {};
  data = this.buildDataTree(this.data["nogroup"]);
  //console.log("dbSearchGroupInfo,data:"); console.log(data);

  // Add the default "nogroup" group
  if (type && type != "") {
    data["nogroup"]               = {};
    data["nogroup"]["group_type"] = type;
    data["nogroup"]["group_id"]   = "nogroup";
    data["nogroup"]["group_name"] = this.findDefaultNogroupHeader(type);
    data["nogroup"]["head"]       = "group";
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
        let parent_not_in_group = (subdata["parent_id"] || subdata["parent_id"] === 0) && subdata["parent_id"] != "" &&
                                  !flatdata[subdata["parent_id"]] && flatdata[subdata["parent_id"]] !== 0;
        let pid = null;
        if (parent_not_in_group) {
          pid = subdata["parent_id"];
          delete subdata["parent_id"];
        }
        if (typeof subdata === "object") {
          if (!subdata["parent_id"] && subdata["parent_id"] !== 0)
            delete subdata["parent_id"]; // = null;
          if (subdata["parent_id"] == parentId) {
            let children = null;
            if (subdata[id_name] && subdata[id_name] != "")
              children = this.buildDataTree(flatdata,subdata[id_name]);
            if (children && Object.size(children) > 0)
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

anyTable.prototype.dbAttachToGroups = function(group_tree,data_tree,type)
{
  //console.log("dbAttachToGroups,group_tree:"); console.log(group_tree);
  //console.log("dbAttachToGroups,data_tree:");  console.log(data_tree);
  if (group_tree) {
    for (let gid in group_tree) { // Iterate over group ids
      let group = group_tree[gid];
      if (group) {
        if (group["data"] && Object.size(group["data"]) > 0)
          this.dbAttachToGroups(group["data"],data_tree,type); // Recursive call
        if (group["data"]) {
          group["head"] = "group";
          if (type != "group") {
            if (group["list"]) delete group["list"];
            if (group["item"]) delete group["item"];
          }
        }
        let idx = gid;
        if (idx && data_tree[idx]) {
          if (data_tree[idx]["data"]) {
            group["head"] = "group";
            if (type != "group") {
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
anyTable.prototype.prepareData = function(id)
{
  //console.log("data before prepare:"); console.log(this.data);
  // Make room for a top level header
  let topidx = "0";
  if ((id || id === 0) && id != "")
    topidx = id;
  let data = {"data": { [topidx]: {} }};

  // Set header and "head"
  let hdr = this.findHeader(this.type,this.data,id);
  if (hdr && hdr != "") {
    data["data"][topidx]["head"] = this.type;
    data["data"][topidx][this.nameKey] = hdr;
  }

  // Set data
  if (this.data && Object.keys(this.data).length > 0) {
    if ((id || id === 0) && id != "") {
      let gidx = Object.keys(this.data)[0];
      data["data"][topidx]["data"] = this.data[gidx]["data"];
    }
    else
      data["data"][topidx]["data"] = this.data;
  }
  else
    data["data"][topidx]["data"] = null;

  // Set link types
  data["linkTypes"] = this.linkTypes;

  this.data = data;
  //console.log("data after prepare:"); console.log(this.data);
  return this.data;
}; // prepareData

anyTable.prototype.prepareParents = function(type,itemIdKey,itemNameKey)
{
  // TODO! Not implemented yet
}; // prepareParents

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Insert //////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

  /**
   * Insert data in table.
   * Also sets last_insert_id if a the new id was auto-created by the database.
   *
   * @return array|null Data object on success, null on error
   */
anyTable.prototype.dbInsert = async function(options)
{
  // Validate
  if (!this.dbValidateInsert(options))
    return Promise.resolve(null);

  // Insert in normal table
  let stmt = await this.dbPrepareInsertStmt(options);
  if (!stmt)
    return Promise.resolve(null);
  let self = this;
  return await alasql.promise(stmt)
  .then( async function(nrc) {
    // Number of rows changed == 1 if the insert succeeded
    self.numRowsChanged = nrc;
    if (self.numRowsChanged === 0) {
      self.message = self.insertNothingToDo;
      return Promise.resolve(self);
    }
    // An id will have been auto-created if the insert succeeded
    self.last_insert_id = await self.queryMaxId(self.tableName);
    self.id = self.last_insert_id;

    // Insert in group table
    let group_id = options.group_id;
    if (group_id || group_id === 0 && group_id != "" && group_id != "nogroup" && self.type != "group") {
      if (self.tableExists(self.tableNameGroupLink)) {
        stmt = "INSERT INTO " + self.tableNameGroupLink + " (group_id," + self.type + "_id) " +
               "VALUES ('" + group_id + "','" + self.last_insert_id + "')";
        //console.log("stmt:"+stmt);
        await alasql.promise(stmt)
        .then( async function(res) {
          if (!res)
            throw "Error while inserting into group table. "; // TODO i18n
        })
        .catch(error => {
          self.error = error;
          console.error(error);
          return Promise.resolve(self);
        });
      }
    }
    // Insert in link table
    let link_id = options.link_id;
    if ((link_id || link_id === 0) && link_id != "") {
      options.add = link_id;
      await this.dbUpdateLinkList(options);
    }
    // Set result message
    self.message = self.insertSuccessMsg;

    // Call success handler
    if (options.onSuccess && options.context)
      options.onSuccess.call(options.context,options.context,self,options);

    return Promise.resolve(self);
  })
  .catch(error => {
     console.error(error);
     return Promise.resolve(null);
  });
}; // dbInsert

anyTable.prototype.dbValidateInsert = function(options)
{
  this.error = "";

  if (!options)
    this.error += "Options missing. "; // TODO! i18n
  if (options && (!options.keys || !options.values))
    this.error += "Missing keys/values for insert. ";

  if (this.error != "")
    return false;
  return true;
}; // dbValidateInsert

anyTable.prototype.dbPrepareInsertStmt = async function(options)
{
  let id     = options.id;
  let keys   = options.keys;
  let values = options.values;
  let stmt = "INSERT INTO " + this.tableName + " (";
  let at_least_one = false;
  let has_id       = id || id === 0;
  if (has_id) {
    stmt += this.idKey + ",";
    at_least_one = true;
  }
  for (let i=0; i<keys.length; i++) {
    let key = keys[i];
    if (key == this.idKey && has_id || key == "is_new" || key == "dirty" || ["head","item","list"].includes(key)) // Do not update the id key field, unless told to do so
      continue;
    let val = values[i];
    if (val || val === 0 || val === "") { // Only allow values that are set (or blank)
      stmt += key + ",";
      at_least_one = true;
    }
    if (has_id && key == this.idKey) {
      // Check if item with this id key already exists
      let res = await this.dbItemExists(val);
      if (res) {
        this.error = this.type+" "+id+": "+this.itemExists;
        return null;
      }
    }
  } // for
  if (!at_least_one) {
    this.message = this.insertNothingToDo;
    return null;
  }
  let pos = stmt.length-1;
  stmt    = stmt.substring(0,pos) + "" + stmt.substring(pos+1); // Replace last "," with ""
  stmt += ") VALUES (";
  if (has_id)
    stmt += id + ",";
  for (let i=0; i<keys.length; i++) {
    let key = keys[i];
    let val = values[i];
    if (key == this.idKey && has_id || key == "is_new" || key == "dirty" || ["head","item","list"].includes(key)) // Do not update the id key field, unless told to do so
      continue;
    if (val || val === 0 || val === "") { // Only allow values that are set (or blank)
      if (typeof val === "string")
        stmt += "'" + val + "',";
      else
        stmt += val + ",";
    }
  }
  pos  = stmt.length-1;
  stmt = stmt.substring(0,pos) + "" + stmt.substring(pos+1); // Replace last "," with ""
  stmt += ")";
  stmt = stmt.replace(/(?:\r\n|\r|\n)/g," "); // Remove all newlines
  //console.log("dbPrepareInsertStmt:"+stmt);
  return stmt;
}; // dbPrepareInsertStmt

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Update //////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

/**
 * Update data, either an existing item or a link to one.
 *
 * @return array|null Data array, or null on error or no data
 */
anyTable.prototype.dbUpdate = async function(options)
{
  // Validate
  if (!this.dbValidateUpdate(options))
    return Promise.resolve(null);

  let id = options.id;

    // If no id, assume it is a new item
  if ((!options.id && options.id !== 0) || options.id == "" || options.is_new)
    return await this.dbInsert(options);

    // Add or remove to/from list
  if (options.add || options.rem)
    return this.dbUpdateLinkList(options);

  // Change a link TODO! Not tested
  if (options.cha)
    return this.dbUpdateLink();

  // Update normal table
  let stmt = await this.dbPrepareUpdateStmt(options);
  if (this.error)
    return Promise.resolve(null);
  if (stmt) { // May be null if we only update link fields for item lists
    let self = this;
    await alasql.promise(stmt)
    .then( function(nrc) {
      self.numRowsChanged = nrc;
      self.id = options.id;
      return Promise.resolve(self);
    })
    .catch(error => {
       console.error(error);
       return Promise.resolve(null);
    });
  } // if stmt
  let nrc = this.numRowsChanged;

  // Update link table(s) if any of the link fields (left join fields) are changed
  let link_id = options.link_id;
  if ((link_id || link_id === 0) && link_id != "" && options.link_type)
    await this.dbUpdateLink();

  // Set result message
  if (nrc === 0) {
    this.message = this.updateNothingToDo;
    return Promise.resolve(this);
  }
  this.message = this.updateSuccessMsg;

  // Call success handler
  if (options.onSuccess && options.context)
    options.onSuccess.call(options.context,options.context,this,options);

  return Promise.resolve(this);
}; // dbUpdate

anyTable.prototype.dbValidateUpdate = function(options)
{
  this.error = "";

  if (!options)
    this.error += "Options missing. "; // TODO! i18n

  if (this.error != "")
    return false;
  return true;
}; // dbValidateUpdate

anyTable.prototype.dbPrepareUpdateStmt = async function(options)
{
  let id     = options.id;
  let keys   = options.keys;
  let values = options.values;
  let res = await this.dbItemExists(id);
  if (!res) {
    this.error = this.type+" "+id+": "+this.itemUnexists;
    return null;
  }
  let stmt = "UPDATE "+this.tableName+" SET ";
  let at_least_one = false;
  let to_set = "";
  for (let i=0; i<keys.length; i++) {
    let key = keys[i];
    let val = values[i];
    if (key == this.idKey || key == "is_new" || key == "dirty" || ["head","item","list"].includes(key)) // Do not update the id key field, unless told to do so
      continue;
    if (val || val === 0 || val === "") { // Only allow values that are set (or blank)
      to_set += this.dbPrepareUpdateStmtKeyVal(key,val);
      at_least_one = true;
  }
  }
  if (to_set == "")
    return null;
  let pos = to_set.length-1;
  to_set = to_set.substring(0,pos) + "" + to_set.substring(pos+1); // Replace last "," with ""
  stmt += to_set + " WHERE " + this.idKey + "=" + id + " ";
  stmt = stmt.replace(/(?:\r\n|\r|\n)/g,""); // Remove all newlines
  if (!at_least_one) {
    this.message = this.updateNothingToDo;
    return null;
  }
  //console.log("dbUpdate:"+stmt);
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

/////////////////////////////////////////////////////////////////////////////
/////////////////////////// Insert or update link ///////////////////////////
/////////////////////////////////////////////////////////////////////////////

/**
 * Add or remove a link
 *
 * options.link_type:
 * options.id:
 * options.add:
 * options.rem:
 *
 * @return
 */
anyTable.prototype.dbUpdateLinkList = async function(options)
{
  // Validate
  if (!this.dbValidateUpdateLinkList(options))
    return Promise.resolve(null);

  let link_type   = options.link_type;
  let id_key      = this.idKey;
  let id_key_link = link_type + "_id"; // TODO! Not general enough
  let id          = options.id;
  let inslist     = options.add;
  let dellist     = options.rem;

  if (link_type != this.type) {
    // Link with different type (sublist of item)
    let link_tablename = this.findLinkTableName(link_type);
    if (!link_tablename || link_tablename == "") {
      this.error = "Link table not found. "; // TODO! i18n
      return Promise.resolve(null);
    }
    if (dellist) {
      // Remove elements from the item's list
      for (let i=0; i<dellist.length; i++) {
        let delval = dellist[i];
        if (delval) {
          let stmt = "DELETE FROM " + link_tablename + " " +
                     "WHERE " +
                     id_key_link + "=" + delval + " " +
                     "AND " +
                     id_key +      "=" + id + "";
          //console.log("dbUpdateLinkList(1):"+stmt);
          await alasql.promise(stmt);
        }
      }
    }
    if (inslist) {
      // Add elements to the item's list (delete before insert to avoid error if element already exists in list)
      for (let i=0; i<inslist.length; i++) {
        let insval = inslist[i];
        if (insval) {
          let stmt = "DELETE FROM " + link_tablename + " " +
                     "WHERE " +
                     id_key_link + "=" + insval + " " +
                     "AND " +
                     id_key +      "=" + id + "";
          //console.log("dbUpdateLinkList(2):"+stmt);
          await alasql.promise(stmt);
          stmt = "INSERT INTO " + link_tablename + " (" +
                 id_key_link + "," + id_key +
                 ") VALUES (" +
                 insval + "," + id +
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
            let stmt = "UPDATE " + this.tableName + " " +
                       "SET parent_id=NULL " +
                       "WHERE " + id_key + "=" + delval + "";
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
            let stmt = "UPDATE " + this.tableName + " " +
                       "SET parent_id=" + id + " " +
                       "WHERE " + id_key + "=" + updval + "";
            //console.log("dbUpdateLinkList(5):"+stmt);
            await alasql.promise(stmt);
          }
        }
      }
    }
  }
  this.message = this.updateSuccessMsg;

  // Get the (updated) list for the item
  await this.dbSearchItemListOfType(link_type);

  if (this.error)
    return Promise.resolve(null);

  if (this.data) {
    this.data["data"] = this.data;
    this.data["nogroup"] = null;
  }
  return Promise.resolve(this);
}; // dbUpdateLinkList

anyTable.prototype.dbValidateUpdateLinkList = function(options)
{
  this.error = "";

  if (!options)
    this.error += "Options missing. "; // TODO! i18n
  if (!options.link_type || options.link_type == "")
    this.error += "Link type missing. "; // TODO! i18n
  if ((!options.id && options.id !== 0) || options.id == "")
    this.error += this.type+" id missing. "; // TODO! i18n

  if (this.error != "")
    return false;
  return true;
}; // dbValidateUpdateLinkList

/**
 * Update the fields of a link. The link must exist in the link table.
 *
 * options.link_type:
 * options.idKey:
 * options.id:
 * options.link_id:
 *
 * @return
 */
anyTable.prototype.dbUpdateLink = async function(options)
{
  // Validate
  if (!this.dbValidateUpdateLink(options))
    return Promise.resolve(null);

  // Link found, we can update it
  let id_key         = options.idKey ? options.idKey : this.idKey;
  let id             = options.id    ? options.id    : null;
  let link_type      = options.link_type;
  let link_id        = options.link_id;
  let link_tablename = this.findLinkTableName(link_type);
  if (this.tableFieldsLeftJoin && this.tableFieldsLeftJoin[link_type]) {
    let val_found = false;
    let stmt = "UPDATE " + link_tablename + " SET ";
    for (let t=0; t<this.tableFieldsLeftJoin[link_type].length; t++) {
      let str = this.tableFieldsLeftJoin[link_type][t];
      let val = options[str];
      if ((val || val===0) && val != "") {
        let pstr = typeof val === "string"
                   ? "='"+val+"',"
                   : "="+val+",";
        stmt += str + pstr;
        val_found = true;
      }
    }
    if (!val_found)
      return Promise.resolve(null);
    stmt = stmt.substring(0,stmt.length-1) + ""; // Replace last  "," with ""
    stmt += "WHERE " + id_key + "=" + id;
    //console.log("dbUpdateLink:"+stmt);
    if (!this.query(stmt,false,true))
      return Promise.resolve(null);
  }
  return Promise.resolve(this);
}; // dbUpdateLink

anyTable.prototype.dbValidateUpdateLink = function(options)
{
  this.error = "";

  if (!options)
    this.error += "Options missing. "; // TODO! i18n
  if ((!options.id && options.id !== 0) || options.id == "")
    this.error += this.type+" id missing. "; // TODO! i18n
  if (!options.link_type || options.link_type == "")
    this.error += "Link type missing. "; // TODO! i18n
  if ((!options.link_id && options.link_id !== 0) || options.link_id == "")
    this.error += options.link_type + " id missing. "; // TODO! i18n
  if (options.link_type) {
    // Check if exists
    let link_tablename = this.findLinkTableName(options.link_type);
    if (!link_tablename)
      this.error += "Link table "+link_tablename+" not found";
    let id_key_link = options.link_type+"_id"; // TODO! Not general enough
    if (!this.dbTableHasLink(link_tablename,id_key_link,options.link_id,this.idKey,options.id))
      this.message = "Link not found in "+link_tablename; // TODO! i18n
  }
  if (this.error != "")
    return false;
  return true;
}; // dbValidateUpdateLink

// TODO! Not tested!
anyTable.prototype.dbTableHasLink = async function(tableName,idName1,id1,idName2,id2)
{
  let cntstr = "COUNT(*)";
  let stmt = "SELECT " + cntstr + " AS num_rows FROM " + tableName + " " +
             "WHERE " + idName1 + "='" + id1 + "' AND " + idName2 + "='" + id2 + "'";
  //console.log("dbTableHasLink:"+stmt);
  let cnt = 0;
  await alasql.promise(stmt)
  .then (function(data) {
    if (data && data[0])
      cnt = data[0][cntstr];
  });
  return (cnt > 0);
}; // dbTableHasLink

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
  // Validate
  if (!this.dbValidateDelete(options))
    return Promise.resolve(null);

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
  let tableName = options.tableName ? options.tableName : this.tableName;
  let idKey     = options.idKey     ? options.idKey     : this.idKey;
  let id        = options.id        ? options.id        : null;
  let stmt      = "DELETE FROM "+tableName+" WHERE "+idKey+"="+id;
  let self = this;
  //console.log("dbDelete(1):"+stmt);
  return await alasql.promise(stmt)
  .then( async function(res) {
    //console.log("del res:"+res);
    self.numRowsChanged = res; // numRowsChanged >= 1 if the delete succeeded
    if (self.numRowsChanged > 0) {
      let msg = self.deleteSuccessMsg.replace("%%",""+this.type);
      self.message = msg;
    }
    else
      self.message = self.deleteNothingToDo;

    // Update parent_id of children
    if (self.hasParentId()) {
      stmt = "UPDATE "+tableName+" SET parent_id=NULL WHERE parent_id="+id; // TODO! Check for id not integer!
      //console.log("dbDelete(2):"+stmt);
      if (!self.query(stmt,false,true)) // TODO! Use alasql.promise!
        return Promise.resolve(null);
    }
    // Delete all links for an item with given id from associated tables (to avoid orphaned links)
    if (self.linkTypes) {
      for (let link_type in self.linkTypes) {
        if (self.type !== link_type) {
          let link_tablename = self.findLinkTableName(link_type);
          if (self.tableExists(link_tablename)) {
            let stmt = "DELETE FROM "+link_tablename+" WHERE "+self.idKey+"="+id;
            //console.log("dbDelete(3):"+stmt);
            if (!self.query(stmt)) // TODO! Use alasql.promise!
              self.error += "Delete from "+link_tablename+" failed. ";
          }
        }
      }
    }
    // Call success handler
    if (options.onSuccess && options.context)
      options.onSuccess.call(options.context,options.context,self,options);

    if (self.error)
      return Promise.resolve(null);
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

  if (!options)
    this.error += "Options missing. "; // TODO! i18n
  let tableName = options && options.tableName ? options.tableName : this.tableName;
  if (!tableName)
    this.error += "Table name missing. "; // TODO! i18n
  let idKey = options && options.idKey ? options.idKey : this.idKey;
  if (!idKey)
    this.error += "Id key missing. "; // TODO! i18n
  let id = options && options.id ? options.id : null;
  if ((!id && id !== 0) || id == "")
    this.error += this.type+" id missing. "; // TODO! i18n

  if (this.error != "")
    return false;
  return true;
}; // dbValidateDelete

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
