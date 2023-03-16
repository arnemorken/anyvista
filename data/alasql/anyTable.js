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
var anyTable = function (connection,tableName,type,idKey,nameKey,orderBy,orderDir)
{
  // Initiate the database connection
  dbTable.call(this,connection);

  // Initialize properties
  this.tableName = tableName;
  this.data      = null;
  this.type      = type;
  this.idKey     = idKey;
  this.nameKey   = nameKey;
  this.orderBy   = orderBy;
  this.orderDir  = orderDir ? orderDir : "ASC";

  this.linking   = null;
  this.maxId     = -1;
}; // constructor

anyTable.prototype = new dbTable();
anyTable.prototype.constructor = anyTable;

/////////////////////////
//////// finders ////////
/////////////////////////

anyTable.prototype.findDefaultItemListHeader = function(linkType)
{
  return linkType+"s"; // TODO!
}; // findDefaultItemListHeader

anyTable.prototype.findDefaultHeader = function(linkType)
{
  return "Other "+linkType+"s"; // TODO!
}; // findDefaultHeader

anyTable.prototype.findLinkTableName = function(linkType)
{
  if (!linkType)
    return "";
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
  if (!options) {
    let err = "dbSearch: options missing. ";
    console.log(err);
    this.error = err;
    return Promise.resolve(null);
  }
  let self = this;
  return this._dbSearch(options)
  .catch(function(err) {
    console.log(err);
    self.error = err;
    return Promise.resolve(false);
  });
}; // dbSearch

// Internal method, do not call directly.
// Error handling is done by dbSearch
anyTable.prototype._dbSearch = function(options)
{
  let type = options.type;
  if (!type)
    type = this.type;
  if (!type) {
    // Error
    let err = "dbSearch: type missing. ";
    console.log(err);
    this.error = err;
    return Promise.resolve(null);
  }
  let id     = options.id;
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
  else
  if (id || id === 0) {
    // Search for an item
    return this.dbSearchItem(id)
    .then(function(data) {
      if (!data) {
        let err = "Warning: Cold not find "+type+" with id "+id+". ";
        console.warn(err);
        self.error = err;
      }
      self.data = data ? data : null;
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
      self.data = data ? data : null;
      return Promise.resolve(self.data);
    });
  }
}; // _dbSearch

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
    //console.log("max:");
    //console.log(self.maxId["MAX("+self.idKey+")"]);
  });
}; // dbSearchMaxId

anyTable.prototype.dbSearchParents = function()
{
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
  //console.log(stmt);
  return alasql.promise(stmt)
  .then (function(rows) {
    //console.log("raw item data:");
    //console.log(rows);
    self.data = self.getRowData(rows,self.data,self.type,"item");
    //console.log("item data:");
    //console.log(self.data);
    if (!self.data || Object.keys(self.data).length === 0)
      return Promise.resolve(null);
    return self.dbSearchItemLists(id,self.linking)
    .then (function(res) {
    });
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
    return Promise.resolve(false);
  }
  let factory = new anyTableFactory(gDbase);
  let self = this;
  for (let link_type in linking) {
    let link_object    = linking[link_type];
    let link_tablename = link_object[0];
    let link_classname = link_object[1];
    //console.log(self.type+";"+link_type+":"+link_tablename+","+link_classname);
    if (self.tableExists(link_tablename)) {
      let tab = await factory.create(link_classname,true,true); // TODO!
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
  return Promise.resolve(true);
}; // dbSearchItemLists

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
    //console.log("list data:");
    //console.log(data);
    self.data = self.buildGroupTreeAndAttach(data,linkId);
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
    //console.log("raw list data:");
    //console.log(rows);
    let data = self.getRowData(rows,self.data,self.type,"list");
    return Promise.resolve(data);
  });
}; // dbExecListStmt

// Build the query
anyTable.prototype.dbPrepareSearchListStmt = function(type,linkType,linkId)
{
  let stmt = this.findListSelect(type,linkType)+
             this.findListLeftJoin(type,linkType)+
             this.findListWhere(type,linkType,linkId)+
             this.findListOrderBy();
  return stmt;
}; // dbPrepareSearchListStmt

anyTable.prototype.findListSelect = function(type,linkType)
{
  // Select from own table
  let sl = "SELECT DISTINCT "+this.tableName+".* ";
  if (linkType) {
    let link_table_name = this.findLinkTableName(type);
    sl += ", " + link_table_name + ".* ";
  }
  sl += "FROM "+this.tableName+" ";
  return sl;
}; // findListSelect

anyTable.prototype.findListLeftJoin = function(type,linkType)
{
  let lj = "";
  if (linkType) {
    let link_table_name = this.findLinkTableName(type);
    lj += "LEFT JOIN " + link_table_name + " " +
          "ON " + link_table_name + "." + this.idKey + "=" + this.tableName + "." + this.idKey + " ";
  }
  return lj;
}; // findListLeftJoin

anyTable.prototype.findListWhere = function(type,linkType,linkId)
{
  let where = "";
  if (linkType && linkId) {
    let link_table_name = this.findLinkTableName(type);
    where = link_table_name + "." + type+"_id" + "=" + linkId +" ";
    where = "WHERE " + where;
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
              this.setMessage(err);
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

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Insert //////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

anyTable.prototype.dbInsert = function(options)
{
}; // dbInsert

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Update //////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

anyTable.prototype.dbUpdate = function(options)
{
}; // dbUpdate

/////////////////////////////////////////////////////////////////////////////
/////////////////////////// Insert or update link ///////////////////////////
/////////////////////////////////////////////////////////////////////////////

anyTable.prototype.dbUpdateLink = function(options)
{
}; // dbUpdateLink

/////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Delete //////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

anyTable.prototype.dbDelete = function(options)
{
}; // dbDelete
