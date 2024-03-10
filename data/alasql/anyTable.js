/* jshint sub:true */
/* jshint esversion: 9 */
/* globals anyTableFactory,dbTable,alasql, */
"use strict";

/********************************************************************************************
 *                                                                                          *
 * anyVista is copyright (C) 2011-2024 Arne D. Morken and Balanse Software.                 *
 *                                                                                          *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use. *
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).                  *
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
  this.orderDir  = orderDir ? orderDir : "DESC";

  this.linking   = null;
  this.maxId     = -1;

  // TODO! i18n
  this.insertSuccessMsg  = "Insert succeeded. ";
  this.insertNothingToDo = "Nothing to insert. ";
  this.itemExists        = "Item already exist. ";
  this.itemUnexists      = "Item does not exist. ";
  this.deleteSuccessMsg  = "%% deleted. ";
  this.deleteNothingToDo = "Nothing to delete. ";
}; // constructor

anyTable.prototype = new dbTable();
anyTable.prototype.constructor = anyTable;

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

anyTable.prototype.findDefaultHeader = function(type)
{
  return "Other "+type+"s"; // TODO! i18n
}; // findDefaultHeader

anyTable.prototype.findDefaultListHeader = function(type)
{
  return type.charAt(0).toUpperCase() + type.slice(1) + " list"; // TODO! i18n
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
    this.error = this.nameKey + " missing"; // TODO! i18n
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
    this.error = "dbSearch: type missing. ";
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
anyTable.prototype._dbSearch = function(type,id)
{
  if (!type) {
    // Error
    this.error = "dbSearch: type missing. ";
    return Promise.resolve(null);
  }
  this.error = "";
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
        self.data = data ? self.prepareData(data) : null;
        return Promise.resolve(self.data);
      });
    }
    else {
      // Search for a list
      return this.dbSearchList(type)
      .then(function(data) {
        self.data = data ? self.prepareData(data) : null;
        return Promise.resolve(self.data);
      });
    }
  } // else
}; // _dbSearch

////////////////////////////// Misc. searches //////////////////////////////

//
// Find max id for a table.
//
anyTable.prototype.dbSearchMaxId = async function()
{
  let maxstr = "MAX("+this.idKey+")";
  let stmt = "SELECT "+maxstr+" FROM "+this.tableName;
  let self = this;
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
  let factory = new anyTableFactory(this.connection);
  let self = this;
  for (let link_type in linking) {
    if (linking.hasOwnProperty(link_type)) {
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
anyTable.prototype.getRowData = function(rows,data,type,mode)
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
    if ((mode == "list" || mode == "head")) {
      if (!data[gidx])
        data[gidx] = {};
      data[gidx][idx]       = rows[i];
      data[gidx][idx][mode] = type;
    }
    else {
      if (!data[idx])
        data[idx] = {};
      data[idx]       = rows[i];
      data[idx][mode] = type;
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
                    let err = "Warning: Item "+idx+" ("+name+") does not have parent in same group. ";
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
  let data_tree = {};
  data_tree["grouping"] = true; // TODO! Should be able to specify this via option
  for (let gidx in data) {
    if (data.hasOwnProperty(gidx)) {
      let ngidx = linkId
                  ? this.type
                  : Number.isInteger(gidx)
                    ? "+"+gidx
                    : gidx;
      if (!data_tree[ngidx]) // TODO! This may not be the correct solution
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
      if (!data_tree[ngidx]["data"]) // TODO! This may not be the correct solution
        data_tree[ngidx]["data"] = this.buildDataTree(data[gidx],null);
      if (!data_tree[ngidx]["data"])
        delete data_tree[ngidx]["data"];
    } // if
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
    if (flatdata.hasOwnProperty(idx)) {
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
      } // if
    } // if
  } // for
  return retval;
}; // buildDataTree

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

  // Find and set the header
  let hdr = this.findHeader(inData);
  if (hdr && hdr != "") {
    data["data"][topidx]["head"] = "group";
    data["data"][topidx]["group_name"] = hdr;
  }

  // Set data
  data["data"][topidx]["data"] = inData;

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
    return this.dbInsert(options); // Assume it is a new item to be inserted

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
  .then( async function(res) {
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
  if (this.tableFieldsLeftJoin[link_type]) {
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
    if (self.linking) {
      for (let link_type in self.linking) {
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
