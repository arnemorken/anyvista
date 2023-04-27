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
 * Class for interacting with an anyVista Alasql database table.
 *
 * Inherits from `dbTable`, which manages the database connection.
 * Contains methods for doing search, insert, update and delete on a database table.
 * Supports user defined table format.
 * The table format must be described in a table class that inherits from `anyTable` -
 * see `types/userTable.js` and `types/groupTable.js` for examples.
 *
 * @class anyTable
 * @constructor
 * @param {Object} connection Info about the database connection. See `db/dbConnection.js`
 * @param {String} tableName  Name of the main table, e.g. "any_event".
 * @param {String} type       Type of the table, e.g. "event".
 * @param {String} idKey      The id key used in the table, e.g. "event_id".
 * @param {String} nameKey    The name key used in the table, e.g. "event_name".
 * @param {String} orderBy    The field to sort by. e.g. "event_date_start".
 * @param {String} orderDir   The direction of the sort, "ASC" or "DESC".
 */
var anyTable = function (connection,parameters,tableName,type,id,idKey,nameKey,orderBy,orderDir)
{
  this.parameters = parameters ? parameters : {};

  // Initiate the database connection
  dbTable.call(this,connection);

  // Initialize properties
  this.tableName = tableName;
  this.data      = null;
  this.type      = type;
  this.id        = id;
  this.idKey     = idKey;
  this.nameKey   = nameKey;
  this.orderBy   = orderBy;
  this.orderDir  = orderDir ? orderDir : "ASC";

  this.linking   = null;
  this.maxId     = -1;

  this.insertSuccessMsg  = "Insert succeeded. ";
  this.insertNothingToDo = "Nothing to insert. ";
  this.itemExists        = "Item already exist. ";
  this.itemUnexists      = "Item does not exist. ";
}; // constructor

anyTable.prototype = new dbTable();
anyTable.prototype.constructor = anyTable;

/**
 * Override and return true in table classes which have parent_id.
 */
anyTable.prototype.hasParentId = function()
{
  return false;
} // hasParentId

/////////////////////////
//////// finders ////////
/////////////////////////

anyTable.prototype.findDefaultHeader = function(type)
{
  return "Other "+type+"s"; // TODO!
}; // findDefaultHeader

anyTable.prototype.findDefaultListHeader = function(type)
{
  return type.charAt(0).toUpperCase() + type.slice(1) + " list"; // TODO: i18n
}; // findDefaultListHeader

anyTable.prototype.findDefaultItemHeader = function(type,inData)
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
  if (this.linkId)
    this.error = this.nameKey + " missing"; // TODO: i18n
  return hdr;
}; // findDefaultItemHeader

anyTable.prototype.findDefaultItemListHeader = function(linkType)
{
  let s = linkType.charAt(0).toUpperCase() + linkType.slice(1);
  return s+"s"; // TODO! i18n
}; // findDefaultItemListHeader

anyTable.prototype.findLinkTableName = function(linkType)
{
  if (!linkType)
    return null;
  if (linkType == this.type)
    return this.tableName;
  let ltn = [linkType,this.type].sort();
  ltn = "any_"+ltn[0]+"_"+ltn[1];
  return ltn;
}; // findLinkTableName

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
  let type = options && options.type ? options.type : this.type;
  let id   = options && options.id   ? options.id   : this.id;
  if (id)
    this.id = id;
  if (!type) {
    let err = "dbSearch: type missing. ";
    console.log(err);
    this.error = err;
    return Promise.resolve(null);
  }
  let self = this;
  return this._dbSearch(type,id)
  .catch(function(err) {
    console.log(err);
    self.error = err;
    return Promise.resolve(null);
  });
}; // dbSearch

// Internal method, do not call directly.
// Error handling is done by dbSearch
anyTable.prototype._dbSearch = function(type,id)
{
  if (!type) {
    // Error
    let err = "dbSearch: type missing. ";
    console.log(err);
    this.error = err;
    return Promise.resolve(null);
  }
  this.error = null;
  this.data  = null;
  let self   = this;
  if (id == "max") {
    // Search for max id
    return this.dbSearchMaxId()
    .then(function(data) {
    });
  }
  else
  if (id == "par") {
    // Search for parents
    return this.dbSearchParents()
    .then(function(data) {
    });
  }
  else {
    if (id || id === 0) {
      // Search for an item
      return this.dbSearchItem(id)
      .then(function(data) {
        if (!data) {
          let err = "Warning: Cold not find "+type+" with id "+id+". ";
          console.warn(err);
          self.error = err;
        }
        self.data = self.prepareData(data);
        return Promise.resolve(self.data);
      });
    }
    else {
      // Search for a list
      return this.dbSearchList(type)
      .then(function(data) {
        if (!data) {
          let err = "Warning: Cold not find "+type+" list. ";
          console.warn(err);
          self.error = err;
        }
        self.data = self.prepareData(data);
        return Promise.resolve(self.data);
      });
    }
  } // else
}; // _dbSearch

////////////////////////////// Misc. searches //////////////////////////////

//
// Find max id for a table.
//
anyTable.prototype.dbSearchMaxId = function()
{
  let stmt = "SELECT MAX("+this.idKey+") FROM "+this.tableName;
  let self = this;
  return alasql.promise(stmt)
  .then (function(data) {
    if (data && data[0])
      self.maxId = data[0];
    //console.log("max:"); console.log(self.maxId["MAX("+self.idKey+")"]);
  });
}; // dbSearchMaxId

anyTable.prototype.dbSearchParents = function()
{
  // Not implemented yet
}; // dbSearchParents

//////////////////////////////// Item search ////////////////////////////////

//
// Search database for an item, including linked lists.
//
anyTable.prototype.dbSearchItem = function(id)
{
  if (!id)
    return Promise.resolve(false);
  let stmt = this.dbPrepareSearchItemStmt(this.idKey,id);
  let self = this;
  //console.log("dbSearchItem:"+stmt);
  return alasql.promise(stmt)
  .then (function(rows) {
    //console.log("dbSearchItem, raw item data:"); console.log(rows);
    self.data = self.getRowData(rows,self.data,self.type,"item");
    //console.log("dbSearchItem, grouped item data:"); console.log(self.data);
    if (!self.data || Object.keys(self.data).length === 0)
      return Promise.resolve(null);
    return self.dbSearchItemLists(id,self.linking);
  });
}; // dbSearchItem

anyTable.prototype.dbPrepareSearchItemStmt = function(key,val)
{
  let select = "SELECT DISTINCT "+"* "+
               "FROM  "          +this.tableName+" ";
  if (val)
    select  += "WHERE "          +this.tableName+"."+key+"="+val+" ";
  return select;
}; // dbPrepareSearchItemStmt

//
// Search for lists associated with the item
//
anyTable.prototype.dbSearchItemLists = async function(id,linking)
{
  if (!id || !linking) {
    return Promise.resolve(null);
  }
  let factory = new anyTableFactory(gDbase);
  let self = this;
  for (let link_type in linking) {
    let link_object    = linking[link_type];
    let link_tablename = link_object[0];
    let link_classname = link_object[1];
    //console.log(self.type+";"+link_type+":"+link_tablename+","+link_classname);
    if (self.tableExists(link_tablename)) {
      let tab = await factory.createClass(link_classname,true,true); // TODO!
      //console.log("created "+link_classname);
      await tab.dbSearchList(self.type,tab.type,id)
      .then( function(data) {
        let link_idx = "link-"+link_type;
        let name_key = tab.nameKey;
        if (!self.data[id])
          self.data[id]              = { };
        if (!self.data[id].data)
          self.data[id].data         = { };
        self.data[id].data[link_idx] = { data: { } };
        self.data[id].data[link_idx]["head"] = link_type;
        self.data[id].data[link_idx]["data"] = tab.data;
        if (name_key)
          self.data[id].data[link_idx][name_key] = self.findDefaultItemListHeader(link_type);
        //console.log("item list "+link_type+":");
        //console.log(self.data);
        return Promise.resolve(data);
      });
    }
  }
  return Promise.resolve(this.data);
}; // dbSearchItemLists

//////////////////////////////// List search ////////////////////////////////

anyTable.prototype.dbSearchList = function(type,linkType,linkId)
{
  if (!type)
    type = this.type;
  if (!type) {
    this.error = "dbSearchList: No type. ";
    console.error(this.error);
    return Promise.resolve(null);
  }
  this.num_results = 0;
  let self = this;
  return this.dbExecListStmt(type,linkType,linkId)
  .then( function(data) {
    self.data = self.buildGroupTreeAndAttach(data,linkId);
    //console.log("dbSearchList, tree list data:"); console.log(self.data);
    return Promise.resolve(self.data);
  });
}; // dbSearchList

// Build and execute the query
anyTable.prototype.dbExecListStmt = function(type,linkType,linkId)
{
  let stmt = this.dbPrepareSearchListStmt(type,linkType,linkId);
  let self = this;
  //console.log("dbExecListStmt:"+stmt);
  return alasql.promise(stmt)
  .then( function(rows) {
    //console.log("dbExecListStmt, raw list data:"); console.log(rows);
    let data = self.getRowData(rows,self.data,self.type,"list");
    //console.log("dbExecListStmt, raw list data:"); console.log(data);
    return Promise.resolve(data);
  });
}; // dbExecListStmt

// Build the query
anyTable.prototype.dbPrepareSearchListStmt = function(type,linkType,linkId)
{
  let link_table_name = this.findLinkTableName(type);
  let stmt = this.findListSelect(link_table_name,type,linkType)+
             this.findListLeftJoin(link_table_name,type,linkType)+
             this.findListWhere(link_table_name,type,linkType,linkId)+
             this.findListOrderBy();
  return stmt;
}; // dbPrepareSearchListStmt

anyTable.prototype.findListSelect = function(linkTableName,type,linkType)
{
  // Select from own table
  let sl = "SELECT DISTINCT "+this.tableName+".* ";
  if (linkType && linkTableName) {
    sl += ", " + linkTableName + ".* ";
  }
  sl += "FROM "+this.tableName+" ";
  return sl;
}; // findListSelect

anyTable.prototype.findListLeftJoin = function(linkTableName,type,linkType)
{
  let lj = "";
  if (linkType && linkTableName) {
    lj += "LEFT JOIN " + linkTableName + " " +
          "ON " + linkTableName + "." + this.idKey + "=" + this.tableName + "." + this.idKey + " ";
  }
  return lj;
}; // findListLeftJoin

anyTable.prototype.findListWhere = function(linkTableName,type,linkType,linkId)
{
  let where = "";
  if (linkType && linkId && linkTableName) {
    where = "WHERE " + linkTableName + "." + type+"_id" + "=" + linkId +" ";
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

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Data retrieval //////////////////////////////
/////////////////////////////////////////////////////////////////////////////

//
// Get the data from query result (rows) to data array.
//
anyTable.prototype.getRowData = function(rows,data,type,kind)
{
  if (!data) {
    if (!this.data)
      this.data = {};
    data = this.data;
  }
  for (let i=0; i<rows.length; i++) {
    //console.log(i+":"+JSON.stringify(rows[i]));
    let idKey = type+"_id";
    let gid   = rows[i]["group_id"]
                ? rows[i]["group_id"]
                : "nogroup";
    let gidx  = type != "group"
                ? gid
                : type;
    let idx   = rows[i][idKey]
                ? rows[i][idKey]
                : null;
    if (!idx && idx !== 0)
      continue;
    if ((kind == "list" || kind == "head")) {
      if (!data[gidx])
        data[gidx] = {};
      data[gidx][idx]       = rows[i];
      data[gidx][idx][kind] = type;
    }
    else {
      if (!data[idx])
        data[idx] = {};
      data[idx]       = rows[i];
      data[idx][kind] = type;
    }
  }
  //console.log("getRowData,data:"); console.log(data);
  return data;
}; // getRowData

//
// Build the data group tree for all groups for a list search.
//
anyTable.prototype.buildGroupTreeAndAttach = function(data,linkId)
{
  if (!data)
    return null;

  // Make sure parent/child items are present in all groups where parent exists
  for (let gidx in data) {
    let grp = data[gidx];
    for (let idx in grp) {
      let item = grp[idx];
      if (item && item["parent_id"]) {
        let pid = item["parent_id"];
        for (let gidx2 in data) {
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
              let err = "Warning: Item "+idx+" ("+name+") does not have parent in same group. ";
              this.error = err;
              console.log(err);
            }
          } // if
        } // for
      } // if
    } // for
  } // for

  // Build data tree
  let data_tree = {};
  data_tree["grouping"] = true; // TODO! Should be able to specify this via option
  for (let gidx in data) {
    let grp = data[gidx];
    let ngidx = linkId
                ? this.type
                : Number.isInteger(gidx)
                  ? "+"+gidx
                  : gidx;
    data_tree[ngidx] = {};
    if (data[gidx]) {
      let gname = null;
      data_tree[ngidx]["head"] = "group";
      if (!linkId) {
        data_tree[ngidx]["group_type"] = this.type;
        data_tree[ngidx]["group_id"]   = ngidx;
        gname = this.findDefaultHeader(this.type);
        data_tree[ngidx]["group_name"] = gname;
      }
      else {
        let idx = data[gidx][linkId] ? linkId : "+" + linkId;
        if (data[gidx][idx])
          data_tree[ngidx][this.nameKey] = data[gidx][idx][this.nameKey];
      }
    }
    data_tree[ngidx]["data"] = this.buildDataTree(data[gidx],null);
    if (!data_tree[ngidx]["data"])
      delete data_tree[ngidx]["data"];
  } // for

  // If grouping is specified, build group tree and stick data tree to it
  if (false) { // TODO!
  }
  else {
    if (linkId)
      data = data_tree[this.type] && data_tree[this.type]["data"]
             ? data_tree[this.type]["data"]
             : data_tree;
    else
      data = data_tree;
  }
  return data;
}; // buildGroupTreeAndAttach

// Build data tree from parent-child relations
anyTable.prototype.buildDataTree = function(flatdata,parentId)
{
  if (!flatdata)
    return null;
  let retval = {};
  let id_name = this.idKey;
  for (let idx in flatdata) {
    let subdata = flatdata[idx];
    if (!idx.startsWith("grouping")) {
      let sub_pid = subdata["parent_id"];
      let parent_not_in_group = sub_pid && sub_pid != "" &&
                                !flatdata[sub_pid] && !flatdata["+"+sub_pid];
      let pid = null;
      if (parent_not_in_group) {
        pid = subdata["parent_id"];
        delete subdata["parent_id"];
      }
      if (!subdata["parent_id"])
        subdata["parent_id"] = null;
      if (subdata["parent_id"] == parentId) {
        var children = null;
        if (subdata[id_name] && subdata[id_name] != "")
          children = this.buildDataTree(flatdata,subdata[id_name]);
        if (children)
          subdata["data"] = children;
        if (parent_not_in_group)
          subdata["parent_id"] = pid;
        retval[idx] = subdata;
        subdata = null;
      }
      else {
        if (pid != null)
          subdata["parent_id"] = pid;
      }
    }
  }
  return retval;
}; // buildDataTree

/**
 * Prepare data related to a list or a single item. Adds a default top header.
 */
anyTable.prototype.prepareData = function(inData)
{
  //console.log("inData before prepare:"); console.log(inData);
  // Make room for a top level header
  let data = {"data": { "+0": {} }};

  // Find and set the header
  let hdr = this.findHeader(inData);
  if (hdr && hdr != "") {
    data["data"]["+0"]["head"] = "group";
    data["data"]["+0"]["group_name"] = hdr;
  }

  // Set data
  data["data"]["+0"]["data"] = inData;

  // Set link types
  data["types"] = this.linking;

  //console.log("data after prepare:"); console.log(data);
  return data;
}; // prepareData

anyTable.prototype.findHeader = function(inData)
{
  let hdr = "";
  let h = this.parameters.header;
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

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Insert //////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

anyTable.prototype.dbInsert = async function(options)
{
  if (!options || !options.keys || !options.values || !this.dbValidateInsert(options))
    return Promise.resolve(null);

  // Insert in normal table
  let stmt = await this.dbPrepareInsertStmt(options.keys,options.values);
  if (!stmt) {
    console.log(this.error);
    return null;
  }
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
      return null;
    }
    // An id will have been auto-created if the insert succeeded
    self.last_insert_id = await self.queryMaxId(self.tableName);

    // Set result message
    self.message = self.insertSuccessMsg;

    // Call success handler
    if (options.successHandler && options.context)
      options.successHandler.call(options.context,res);

    return res;
  })
  .catch(error => {
     console.error("Insert error: "+error);
     return null;
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
  for (let i=0; i<keys.length; i++) {
    let key = keys[i];
    let val = values[i];
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
  if (at_least_one) {
    let pos = stmt.length-1;
    stmt = stmt.substring(0,pos) + "" + stmt.substring(pos+1); // Replace last "," with ""
  }
  else
    return null;
  stmt += ") VALUES (";
  for (let i=0; i<keys.length; i++) {
    let key = keys[i];
    let val = values[i];
    if (val && val !== "")
      stmt += "'"+val+"',";
  }
  let pos = stmt.length-1;
  stmt = stmt.substring(0,pos) + "" + stmt.substring(pos+1); // Replace last "," with ""
  stmt += ")";
  return stmt;
}; // dbPrepareInsertStmt

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Update //////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

anyTable.prototype.dbUpdate = async function(options)
{
  if (!options || !options.keys || !options.values || !this.dbValidateUpdate(options))
    return Promise.resolve(null);

  if (!options.id || options.id == "")
    return this.dbInsert(options); // No id, assume it is a new item to be inserted
  this.id = options.id;

  // Update normal table
  let stmt = await this.dbPrepareUpdateStmt(options.keys,options.values);
  if (!stmt) {
    console.log(this.error);
    return null;
  }
  stmt = stmt.replace(/(?:\r\n|\r|\n)/g,""); // Remove all newlines
  let self = this;
  //console.log("dbUpdate:"+stmt);
  return await alasql.promise(stmt)
  .then( async function(res) {
    // numRowsChanged >= 1 if the update succeeded
    self.numRowsChanged = res;
    //console.log("upd res:"+res);
    if (self.numRowsChanged == 0) {
      self.message = self.updateNothingToDo;
      return null;
    }
    // Set result message
    self.message = self.updateSuccessMsg;

    // Call success handler
    if (options.successHandler && options.context)
      options.successHandler.call(options.context,res);

    return res;
  })
  .catch(error => {
     console.error("Update error: "+error);
     return null;
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
  if (!keys || !values)
    return null;
  let res = await this.dbItemExists(this.id);
  if (!res) {
    this.error = this.type + this.itemUnexists + " ("+this.id+") ";
    return null;
  }
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
  return key + "='" + val + "',";
}; // dbPrepareUpdateStmtKeyVal

anyTable.prototype.dbItemExists = async function(id)
{
  let stmt = "SELECT * FROM " + this.tableName + " WHERE " + this.idKey + "=" + id;
  //console.log("dbItemExists:"+stmt);
  return await alasql.promise(stmt)
  .then( function(res) {
    if (res.length)
      return true;
    return false;
  })
  .catch(error => {
     console.error("dbItemExists error: "+error);
     return null;
  });
}; // dbItemExists

/////////////////////////////////////////////////////////////////////////////
/////////////////////////// Insert or update link ///////////////////////////
/////////////////////////////////////////////////////////////////////////////

anyTable.prototype.dbAddRemoveLink = async function(options)
{
  let link_type = options.link_type;
  if (!link_type) {
    this.error = "No link type. ";
    return null;
  }
  let id_key      = this.idKey;
  let id_key_link = link_type + "_id"; // TODO! Not general enough
  let id          = options.id;
  let updlist     = options.updlist;
  let dellist     = options.dellist;
  let link_table  = this.findLinkTableName(link_type);
  if (link_table && link_type != this.type) {
    // Link with different type (sublist of item)
    if (dellist) {
      // Remove elements from the item's list
      for (let i=0; i<dellist.length; i++) {
        let delval = dellist[i];
        if (delval) {
          let stmt = "DELETE FROM "+link_table+" WHERE "+id_key_link+"="+delval+" AND "+id_key+"="+id+"";
          //console.log("dbAddRemoveLink(1):"+stmt);
          await alasql.promise(stmt);
        }
      }
    }
    if (updlist) {
      // Add elements to the item's list (delete, then insert to avoid error if element already exists in list)
      for (let i=0; i<updlist.length; i++) {
        let insval = updlist[i];
        if (insval) {
          let stmt = "DELETE FROM "+link_table+" WHERE "+id_key_link+"="+insval+" AND "+id_key+"="+id+"";
          //console.log("dbAddRemoveLink(2):"+stmt);
          await alasql.promise(stmt);
          stmt = "INSERT INTO "+link_table+" ("+id_key_link+","+id_key+") VALUES ("+insval+","+id+")";
          //console.log("dbAddRemoveLink(3):"+stmt);
          await alasql.promise(stmt);
        }
      }
    }
  }
  else {
    // Link with same type (sub-element with parent id)
    if (dellist) {
      // Remove parent for elements in dellist
      for (let i=0; i<dellist.length; i++) {
        let delval = dellist[i];
        if (delval) {
          let stmt = "UPDATE "+this.tableName+" SET parent_id=NULL WHERE "+id_key+"="+delval+"";
          //console.log("dbAddRemoveLink(4):"+stmt);
          await alasql.promise(stmt);
        }
      }
    }
    if (updlist) {
      // Set parent for elements in updlist
      for (let i=0; i<updlist.length; i++) {
        let updval = updlist[i];
        if (updval && updval != id) {
          let stmt = "UPDATE "+this.tableName+" SET parent_id="+id+" WHERE "+id_key+"="+updval+"";
          //console.log("dbAddRemoveLink(5):"+stmt);
          await alasql.promise(stmt);
        }
      }
    }
  }
}; // dbAddRemoveLink

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Delete //////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

anyTable.prototype.dbDelete = async function(options)
{
  if (!options || !this.dbValidateDelete(options))
    return Promise.resolve(null);

  // Delete item(s) from table or file from disk
  if (options.del == "ulf") {
    // Delete file from disk
    return Promise.resolve(true);
  }
  // Delete item(s) from table
  let tableName = options.tableName ? options.tableName : this.tableName;
  let id        = options.id        ? options.id        : this.id;
  let idKey     = options.idKey     ? options.idKey     : this.idKey;
  let stmt = this.dbPrepareDeleteStmt({ tableName: tableName,
                                        id:        id,
                                        idKey:     idKey,
                                     });
  if (!stmt) {
    console.log(this.error);
    return null;
  }
  stmt = stmt.replace(/(?:\r\n|\r|\n)/g,""); // Remove all newlines
  let self = this;
  //console.log("dbDelete(1):"+stmt);
  return await alasql.promise(stmt)
  .then( async function(res) {
    // numRowsChanged >= 1 if the delete succeeded
    self.numRowsChanged = res;
    //console.log("del res:"+res);
    if (self.numRowsChanged == 0) {
      self.message = self.deleteNothingToDo;
      return null;
    }
    // Update parent_id of children
    if (self.hasParentId()) {
      stmt = "UPDATE "+tableName+" SET parent_id=NULL WHERE parent_id="+id;
      //console.log("dbDelete(2):"+stmt);
      if (!self.query(stmt)) // TODO! alasql.promise...
        return null;
    }
    // Delete all links for an item with given id from associated tables (to avoid orphaned links)
    if (self.linking) {
      for (let link_type in self.linking) {
        if (self.type !== link_type && (id || id === 0)) {
          let link_table = self.findLinkTableName(link_type);
          let stmt = "DELETE FROM "+link_table+" WHERE "+self.idKey+"="+id;
          //console.log("dbDelete(3):"+stmt);
          if (!self.query(stmt))
            return false;
        }
      }
    }
    self.id = null;

    // Set result message
    self.message = self.deleteSuccessMsg;

    // Call success handler
    if (options.successHandler && options.context)
      options.successHandler.call(options.context,res);

    return res;
  })
  .catch(error => {
     console.error("Delete error: "+error);
     return null;
  });
}; // dbDelete

anyTable.prototype.dbValidateDelete = function(options)
{
  this.error = "";
  // Validate here, set this.error
  if (this.error != "")
    return false;
  return true;
}; // dbValidateDelete

anyTable.prototype.dbPrepareDeleteStmt = function(options)
{
  let stmt = "DELETE FROM "+options.tableName+" WHERE "+options.idKey+"="+options.id;
  return stmt;
}; // dbPrepareDeleteStmt
