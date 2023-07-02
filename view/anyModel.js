/* jshint sub:true */
/* jshint esversion: 9 */
/* globals $,i18n,any_defs,isInt, */
"use strict";

/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2023 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ***************************************************************************************/

/**
 * __anyModel: Tree structure data model that can manipulate data as lists and items and optionally
 * synchronize with a database.__
 *
 * See <a href="../classes/anyView.html">`anyView`</a> for a description of a data view class.
 *
 * The model should have a type (e.g. `type = "user"`), an id key (e.g. `id_key = "user_id"`) and a name
 * key (e.g. `name_key = "user_name"`). If `id_key` or `name_key` is omitted, they are constructed from
 * `type` (for example will type "foo" give rise to id_key "foo_id" and name_key "foo_name"). If no type
 * is specified, the model cannot be searched, synchronized with database etc. If the model contains data
 * for an item (which may or may not contain any kind of subdata), the `id` property should be set to the
 * id of the item and either `this.data[id]` or `this.data[hdr_id].data[id]` should exist (where hdr_id
 * is the id of a single `head` entry).
 *
 * If used in connection with a database, `mode` should be set to "remote" (see below). `type` will then
 * correspond to a database table and `id_key` to an id column in that table.
 *
 * See <a href="../modules/anyVista.html">anyVista</a> for a full description of the format of the data
 * structure that the model works with.
 *
 * The class contains:
 * - a constructor, which sets the model's variables according to `options`, or to default values,
 * - the `dataInit` method for initializing the data model,
 * - `data*` methods for working with data in the internal data structure,
 * - `db*` methods for working with data in the database,
 * - subscribe/callback methods (`cb*` methods).
 *
 * @class anyModel
 * @constructor
 * @param {Object} options An object which may contain the following properties, all of which are optional
 *                         unless stated otherwise:
 *
 *      {Object}   data:           The data with which to initialize the model.
 *                                 Default: null.
 *      {String}   type:           Type, e.g. "user".
 *                                 Default: "".
 *      {String}   id:             Item id, if the top level data represents an item, e.g. "42".
 *                                 Default: null.
 *      {String}   id_key:         Id key, e.g. "user_id".
 *                                 Default: "[type]_id" if type is set, "" otherwise.
 *      {String}   name_key:       Name key, e.g. "user_name".
 *                                 Default: "[type]_name" if type is set, "" otherwise.
 *      {Object}   types:          The types the model might interact (link) with, e.g ["event","document"].
 *                                 Default: null.
 *      {String}   mode:           Indicates whether db* operations should be performed by a locally defined
 *                                 method ("local") or call a database method on a remote server ("remote").
 *                                 Default: "local".
 *      {Array}    db_fields:      An array of strings to be sent to the server, indicating which columns of
 *                                 the table should be used in a search or update/insert. These fields are
 *                                 only applied if the server fails to find a filter corresponding to `type`.
 *                                 Default: null.
 *      {boolean}  db_search:      Whether to call the search method while initializing the class or while
 *                                 searching on the server.
 *                                 Default: false.
 *      {String}   db_search_term: The string to search for when `db_search == true`.
 *                                 Default: "".
 *      {String}   db_last_term:   The last string that was searched for.
 *                                 Default: "".
 *      {boolean}  auto_search:   If true, the model will be initiated with the result of a search, and
 *                                cbExecute will be called.
 *                                Default: true.
 *      {boolean}  auto_callback: If true, cbExecute will be called after calling dataInsert, dataUpdate
 *                                and dataDelete.
 *                                Default: false.
 *      {boolean}  auto_refresh:  If true, cbExecute will be called after calling dbSearch, dbUpdate,
 *                                dbUpdateLinkList, dbUpdateLink and dbDelete.
 *                                Default: true.
 *      {Object}   permission:    Permissions (normally obtained from server). The object may contain:
 *                                  {integer} current_user_id:  The user id the current user is logged in
 *                                                              with (if applicable).
 *                                                              Default: null.
 *                                  {boolean} is_logged_in:     True if the user is logged in.
 *                                                              Default: true.
 *                                  {boolean} is_admin:         True if the user has admin privileges.
 *                                                              Default: false.
 *      {String}   message:       Info messages.
 *                                Default: "".
 *      {String}   error:         Error messages.
 *                                Default: "".
 *      {String}   error_server:  Error messages from server.
 *                                Default: "".
 *
 * @example
 *      new anyModel({ type:"user",id_key:"user_id",id:"38",data:{user_name:"Aretha Franklin"} });
 */
var anyModel = function (options)
{
  /**
  * @property {Object} data
  * @default null
  * @description The model's data.
  */
  this.data = null;

  /**
  * @property {String} type
  * @default ""
  * @description The model's type, e.g. `"user"`.
  *              If already set (by a derived class), it will not be initialized.
  */
  if (!this.type)
    this.type = "";

  /**
  * @property {String} id
  * @default null
  * @description Item id, if the top level data represents an item, e.g. "42".
  */
  if (!this.id)
    this.id = null;

  /**
  * @property {String} id_key
  * @default "[type]_id" if type is set, "" otherwise.
  * @description Name of the model's id key, e.g. `"user_id"`.
  *              If already set (by a derived class), it will not be initialized.
  *              If not specified, "[type]_id" is used as the model's id key
  *              if `type` is set, otherwise it defaults to "".
  */
  if (!this.id_key)
    this.id_key = this.type ? this.type+"_id" : "";

  /**
  * @property {String} name_key
  * @default "[type]_name" if type is set, "" otherwise.
  * @description The model's name key, e.g. `"user_name"`.
  *              If already set (by a derived class), it will not be initialized.
  *              If not specified, "[type]_name" is used as the model's name key
  *              if `type` is set, otherwise it defaults to "".
  */
  if (!this.name_key)
    this.name_key = this.type ? this.type+"_name" : "";

  /**
  * @property {Object} types
  * @default null
  * @description The model's types.
  */
  this.types = null;

  /**
  * @property {String} mode
  * @default "local"
  * @description The model's mode, e.g. `"local"` or `remote"`.
  */
  this.mode = "local";

  /**
  * @property {Boolean} db_fields
  * @default null
  * @description An array of strings to be sent to the server, indicating which columns of
  *              the table should be used in in a search or update/insert. These fields are
  *              only applied if the server fails to find a filter corresponding to `type`.
  */
  this.db_fields = null;

  /**
  * @property {Boolean} db_search
  * @default false
  * @description Whether to call the search method while initializing the class,
  *              or while searching on the server. Optional.
  */
  this.db_search = false;

  /**
  * @property {String} db_search_term
  * @default ""
  * @description The string to search for when this.db_search == true.
  */
  this.db_search_term = "";

  /**
  * @property {String} db_last_term
  * @default ""
  * @description The last string that was search for.
  */
  this.db_last_term = "";

  /**
  * @property {Boolean} auto_search
  * @default true
  * @description If auto_search is true, the model will be automatically initialized
  *              with the data returned by dbSearch, and cbExecute will be called.
  */
  this.auto_search = true;

  /**
  * @property {Boolean} auto_callback
  * @default false
  * @description If auto_callback is true, cbExecute will be called after calling
  *              dataInsert, dataUpdate and dataDelete.
  */
  this.auto_callback = false;

  /**
  * @property {Boolean} auto_refresh
  * @default true
  * @description If auto_refresh is true, cbExecute will be called after calling
  *              dataInsert, dataUpdate and dataDelete.
  */
  this.auto_refresh = true;

  /**
  * @property {Integer} db_timeout_sec
  * @default 10
  * @description Number of seconds to wait for database reply before timing out.
  */
  this.db_timeout_sec = 10;

  /**
  * @property {Object} permission
  * @default An object with the following properties:
  *      `current_user_id:  null,`
  *      `is_logged_in:     true,`
  *      `is_admin:         false,`
  * @description Permission related info (normally obtained from server).
  */
  this.permission = {
    current_user_id: null,  // Id the current user is logged in with
    is_logged_in:    true,  // Whether we are logged in or not
    is_admin:        false, // Whether the current user has admin privelegies
  };

  /**
  * @property {String} message
  * @default ""
  * @description Messages.
  */
  this.message = "";

  /**
  * @property {String} error
  * @default ""
  * @description Errors.
  */
  this.error = "";

  /**
  * @property {String} error_server
  * @default ""
  * @description Errors received from server.
  */
  this.error_server = "";

  // Initialise
  this._dataInitDefault();
  this.dataInit(options);

  // Warnings and errors
  if (options && !this.type)
    this.message += i18n.error.TYPE_MISSING;
  if (options && !this.id_key)
    this.message += i18n.error.ID_KEY_MISSING;
  if (options && !this.name_key)
    this.message += i18n.error.NAME_KEY_MISSING;
  if (this.message !== "")
    console.log("anyModel constructor: "+this.message);
  if (this.error !== "")
    console.error("anyModel constructor: "+this.error);
  if (this.error_server !== "")
    console.error("anyModel constructor: "+this.error_server);

  // Search
  if (options && options.db_search)
    this.dbSearch(options);
}; // constructor

//
// _dataInitDefault: "Private" method.
// Does not init type, id_key or name_key.
//
anyModel.prototype._dataInitDefault = function ()
{
  this.data            = null;
  this.id              = null;
  this.types           = null;
  this.mode            = "local";
  this.db_fields       = null;
  this.db_search       = false;
  this.db_search_term  = "";
  this.db_last_term    = "";
  this.auto_search     = true;
  this.auto_callback   = false;
  this.auto_refresh    = true;
  this.db_timeout_sec  = 10;
  this.message         = "";
  this.error           = "";
  this.error_server    = "";
  // "Private" variables:
  this._listeners      = [];
  this.max             = -1;
  this.db_last_command = null; // Used by dataInit
}; // _dataInitDefault

/**
 * @method dataInit
 * @description Set the model's data, such as type, data and more with the specified options or to
 *              default values. Called by the constructor and the success method of `dbSearch`.
 * @param {Object} options An object containing data with which to initialize the model.
 *                         If the encapsulation `options.JSON_CODE` has been set (ny the server,
 *                         it will be removed from `options`. If `options == null`, default values
 *                         will be set.<br/>
 *                         The object may contain these elements:
 *
 *        {Object}  data:           Data. Will only be initialised if `dataInit` is called after a search
 *                                  (indicated by `this.db_last_command == "sea"`). Optional.
 *        {String}  type:           Type, e.g. "user". Optional.
 *        {String}  id:             Item id, if the top level data represents an item, e.g. "42". Optional.
 *        {String}  id_key:         Id key, e.g. "user_id". Optional. Default: "[type]_id".
 *        {String}  name_key:       Name key, e.g. "user_name". Optional. Default: "[type]_name".
 *        {Object}  types:          The types the model might interact (link) with. Optional.
 *        {String}  mode:           "local" or "remote". Optional.
 *        {Array}   db_fields:      An array of strings to be sent to the server, indicating which columns
 *                                  of the table should be used in a search or update/insert. Optional.
 *        {boolean} db_search:      Whether to call the search method. Optional.
 *        {String}  db_search_term: The string to search for. Optional.
 *        {String}  db_last_term:   The string to search for. Optional.
 *        {boolean} auto_search:    Whether to initiated model with the result of a search, and call
 *                                  cbExecute. Optional.
 *        {boolean}  auto_callback: Whether to call cbExecute after calling dataInsert, dataUpdate and
 *                                  dataDelete. Optional.
 *        {boolean}  auto_refresh:  Whether to call cbExecute after calling dbSearch, dbUpdate,
 *                                  dbUpdateLinkList, dbUpdateLink and dbDelete. Optional.
 *        {Object}  permission:     Permissions. Optional.
 *        {String}  message:        Messages. Optional.
 *        {String}  error:          Errors. Optional.
 *        {String}  error_server:   Errors from server. Optional.
 *
 * @return options
 */
anyModel.prototype.dataInit = function (options)
{
  // Remove encapsulation which may have been set by server
  if (options && options.JSON_CODE)
    options = options.JSON_CODE;
  if (options === null)
    this._dataInitDefault();
  else
  if (options) {
    //console.log("anyModel.dataInit options:\n"+JSON.stringify(options,2,2));
    if (options.data || this.db_last_command == "sea") { this.data           = options.data; }
    if (options.type)                                  { this.type           = options.type; }
    if (options.id)                                    { this.id             = options.id; }
    if (this.id && this.data) {
      let hdr_id = Object.keys(this.data)[0];
      let the_id = this.data[this.id] ? this.id : this.data["+"+this.id] ? "+"+this.id : null;
      if (!the_id && (!hdr_id || !this.data[hdr_id] && (!this.data[hdr_id].data || !this.data[hdr_id].data[this.id]))) {
        console.warn("Id "+this.id+" given to constructor, but not found in data. Resetting id to null.");
        this.id = null;
      }
    }
    if (options.id_key)                                { this.id_key         = options.id_key; }
    else
    if (!this.id_key && this.type)                     { this.id_key         = this.type+"_id"; }
    if (options.name_key)                              { this.name_key       = options.name_key; }
    else
    if (!this.name_key && this.type)                   { this.name_key       = this.type+"_name"; }
    if (options.types)                                 { this.types          = options.types; }
    if (options.mode)                                  { this.mode           = options.mode; }
    if (options.db_fields)                             { this.db_fields      = options.db_fields; }
    if (options.db_search)                             { this.db_search      = options.db_search; }
    if (options.db_search_term)                        { this.db_search_term = options.db_search_term; }
    if (options.db_last_term)                          { this.db_last_term   = options.db_last_term; }
    if (options.db_timeout_sec)                        { this.db_timeout_sec = options.db_timeout_sec; }
    if (options.auto_search)                           { this.auto_search    = options.auto_search; }
    if (options.auto_callback)                         { this.auto_callback  = options.auto_callback; }
    if (options.auto_refresh)                          { this.auto_refresh   = options.auto_refresh; }
    if (options.permission)                            { this.permission     = options.permission; }
    if (options.message)                               { this.message        = options.message; }
    if (options.error)                                 { this.error          = options.error; }
    if (options.error) {
      if (this.mode == "remote") {
        this.error_server = options.error;
        this.error        = i18n.error.SERVER_ERROR;
      }
      else {
        this.error_server = "";
        this.error        = options.error;
      }
    }
    if (options.error_server) {
      this.error_server = options.error_server;
      this.error        = i18n.error.SERVER_ERROR;
    }

    if (this.db_fields && this.id_key && !this.db_fields.includes(this.id_key))
      this.id_key = this.db_fields[0];

    if (!this.error) {
      if (!this.data)
        this.data = null;
      //console.log("dataInit data:\n"+JSON.stringify(this.data));
    }
  }
  return options;
}; // dataInit

////////////////////////////////////////////////////////////////
///////////////////// subscribe / callback /////////////////////
////////////////////////////////////////////////////////////////

/**
 * @method cbSubscribe
 * @description Adds a method to the list of methods to be called by cbExecute.
 * @param {Function} cbFunction A method to add to the list. Mandatory.
 * @param {Object}   cbContext  The context the method should be executed in. Mandatory.
 * @example
 *      mymodel.cbSubscribe(myModelChange,myView);
 *
 * @throws `CALLBACK_MISSING` If `cbFunction` or `cbContext` are missing.
 */
anyModel.prototype.cbSubscribe = function (cbFunction,cbContext)
{
  if (!cbFunction || !cbContext)
    throw i18n.error.CALLBACK_MISSING;

  let cb_arr = [cbFunction,cbContext];
  this._listeners.push(cb_arr);
  return true;
}; // cbSubscribe

/**
 * @method cbUnsubscribe
 * @description Remove a method from the list of methods to be called by cbExecute.
 * @param {Function} cbFunction A method to remove from the list. Mandatory.
 * @example
 *      mymodel.cbUnsubscribe(myModelChange);
 */
anyModel.prototype.cbUnsubscribe = function (cbFunction)
{
  if (this._listeners) {
    for (let i=0; i<this._listeners.length; ++i) {
      let cb_function = this._listeners[i][0];
      if (!cbFunction || cb_function == cbFunction)
        this._listeners.splice(i,1);
    }
  } // if
}; // cbUnsubscribe

/**
 * @method cbReset
 * @description Empties the list of methods to be called by cbExecute.
 * @example
 *      mymodel.cbReset();
 */
anyModel.prototype.cbReset = function ()
{
  this._listeners = [];
}; // cbReset

/**
 * @method cbExecute
 * @description Calls all callback methods registered with `cbSubscribe`.
 *              This method is called by the default success/fail methods if `auto_callback == true`.
 */
anyModel.prototype.cbExecute = function ()
{
  if (this._listeners) {
    for (let i=0; i<this._listeners.length; ++i) {
      let cb_function = this._listeners[i][0];
      let cb_context  = this._listeners[i][1];
      if (cb_function) {
        //console.log(cb_function);
        //console.log(cb_context);
        cb_function.call(cb_context,this);
      }
    } // for
  } // if
}; // cbExecute

/////////////////////////////////////////////////////////////////////////////////
// Methods that work with local data structure only (not database)             //
/////////////////////////////////////////////////////////////////////////////////

//
// _getDataSourceName: "Private" method.
// Returns the complete path to the data source (a script communicating with a database/server backend).
//
anyModel.prototype._getDataSourceName = function ()
{
  if (this.mode == "remote")
    return any_defs.dataScript;
  return "";
}; // _getDataSourceName

/**
 * @method dataSearch
 * @description Search for item of type `type` and id `id` in `data`.  If the type/id combination exists
 *              several places in the data tree, only the first occurence found is returned.
 * @param {Object} options An object which may contain these elements:
 *
 *        {Object}  data   The data structure to search in.
 *                         Optional. Default: The model's data (`this.data`).
 *        {String}  type   The type of the data to search for.
 *                         Optional. Default: The model's type (`this.type`).
 *        {integer} id     The id to search for.
 *                         Optional. Default: null.
 *        {boolean} parent If true, search for parent of the item with the specified id.
 *                         Optional. Default: Same as `type`.
 *
 * @return If id is specified and parent is false: A pointer to the item found, or null if not found or on error.
 *         If id is specified and parent is true: A pointer to the parent of the item found, or null if not found or on error.
 *         If id is not specified: The first list of items of the specified type found, or null if none found or on error.
 *
 * @example
 *      mymodel.dataSearch({type:"user",id:"38"});
*/
// TODO! Not tested with non-numerical indexes
anyModel.prototype.dataSearch = function (options,parent_data,parent_id)
{
  if (!options || typeof options != "object") {
    console.error("anyModel.dataSearch: "+i18n.error.OPTIONS_MISSING);
    return null;
  }
  let data       = options.data                   ? options.data       : this.data;
  let type       = options.type                   ? options.type       : this.type;
  let id         = options.id || options.id === 0 ? options.id         : null;
  let _prev_type = options._prev_type             ? options._prev_type : this.type; // Only used internally!

  if (!data)
    return null; // Not found
  if (!type) {
    console.error("anyModel.dataSearch: "+i18n.error.TYPE_MISSING);
    return null;
  }
  if (((!id && id !== 0) || (Number.isInteger(parseInt(id)) && id < 0)) && !type) {
    console.error("anyModel.dataSearch: "+i18n.error.ID_MISSING+" ("+id+") ");
    return null;
  }

  let name_key = type == this.type
                 ? ( this.name_key
                     ? this.name_key
                     : type+"_name" )
                 : type+"_name";
  let data_ptr = data[id]
                 ? data[id]
                 : data["+"+id]
                   ? data["+"+id]
                   : null;
  let dp_type  = data_ptr
                 ? data_ptr.list
                   ? data_ptr.list
                   : data_ptr.item
                     ? data_ptr.item
                     : data_ptr.head
                       ? data_ptr.head
                       : _prev_type
                 : _prev_type;
  if ((id || id === 0) && data_ptr && (dp_type == type || (!dp_type && (data_ptr[name_key] || data_ptr[name_key] === "")))) {
    if (parent_data && parent_data[parent_id]) {
      parent_data[parent_id].id = parent_id; // Hack
      return parent_data[parent_id];
    }
    return data;
  }
  let itemlist = [];
  for (let idc in data) {
    if (data.hasOwnProperty(idc) && data[idc] && !idc.startsWith("grouping") &&  !["head","item","list"].includes(idc)) {
      let item = null;
      let dtype = data[idc].list
                  ? data[idc].list
                  : data[idc].item
                    ? data[idc].item
                    : data[idc].head
                      ? data[idc].head
                      : _prev_type;
      if (dtype == type || (!dtype && data[idc][name_key])) {
        if (id || id === 0) {
          // id search
          let is_int = Number.isInteger(parseInt(idc));
          if ((is_int && parseInt(idc) == parseInt(id)) || (!is_int && idc == id)) {
            item = data;
          }
        }
        else {
          // type search
          if (!data[idc].head)
            if (!options.parent)
              itemlist.push(data[idc]);
            else {
              itemlist.push(data);
              break;
            }
        }
      }
      if (!item && data[idc].data) { // subdata
        let p_data = options.parent ? data : null;
        let p_idc  = options.parent ? idc  : null;
        let data_ptr  = data[id]
                       ? data[id]
                       : data["+"+id]
                         ? data["+"+id]
                         : null;
        let _prev_type = data_ptr
                         ? data_ptr.list
                           ? data_ptr.list
                           : data_ptr.item
                             ? data_ptr.item
                             : data_ptr.head
                               ? data_ptr.head
                               : dtype
                         : dtype;
        item = this.dataSearch({data:data[idc].data,id:id,type:type,_prev_type:_prev_type},p_data,p_idc);
        if (item && item.data)
          item = item.data;
      }
      if (item && itemlist.length < 1)
        return item; // Found id
    }
  } // for
  if (itemlist.length > 0) // Found type list
    if (options.parent)
      return itemlist[0];
    else
      return itemlist;
  return null; // Not found
}; // dataSearch

/**
 * @method dataSearchNextId
 * @description Sets `this.max` to the largest id for the specified type in the in-memory data structure
 *              and returns the next id (i.e. `this.max + 1`). If any of the indexes are non-numerical,
 *              the number of items in the data structure minus 1 will be returned.
 * @param {Object} data The data structure to search in.
 *                      Optional. Default: The model's data (`this.data`).
 * @param {String} type The type of the data to search for.
 *                      Optional. Default: The model's type (`this.type`).
 *
 * @return The next available id. If none can be found, -1 is returned and `this.max == -1`.
 */
anyModel.prototype.dataSearchNextId = function (data,type)
{
  this.max = -1;
  let res = this.dataSearchMaxId(data,type);
  if (res >= 0)
    return 1 + parseInt(this.max);
  this.max = -1;
  return -1;
}; // dataSearchNextId

/**
 * @method dataSearchMaxId
 * @description Sets `this.max` to the largest id for the specified type in the in-memory data structure
 *              and returns this.max. If any of the indexes are non-numerical, the number of items in the
 *              data structure minus 1 will be returned.
 * @param {Object} data The data structure to search in.
 *                      Optional. Default: The model's data (`this.data`).
 * @param {String} type The type of the data to search for.
 *                      Optional. Default: The model's type (`this.type`).
 *
 * @return The largest id found. If none can be found, -1 is returned and `this.max` is not changed.
 */
anyModel.prototype.dataSearchMaxId = function (data,type,_prev_type)
{
  if (!data)
    data = this.data;
  // If empty dataset, start with 0
  if (!data) {
    this.max = 0;
    return 0;
  }
  if (!type)
    type = this.type;
  if (!type)
    return -1;
  // If a non-numerical index is found, return immediately
  let datakeys = Object.keys(data);
  for (const key in datakeys) {
    if (datakeys.hasOwnProperty(key)) {
      if (!isInt(datakeys[key])) {
        this.max = Object.size(data)-1;
        return this.max;
      }
    }
  }
  // Must at least be bigger than biggest "index" in object
  let max = $.isEmptyObject(datakeys) ? -1 : Math.max(...datakeys);
  if (!isNaN(max)) {
    let dmax  = data[max] ? max : data["+"+max] ? "+"+max : null;
    let dtype = dmax && data[dmax]
                ? data[dmax].list
                  ? data[dmax].list
                  : data[dmax].item
                    ? data[dmax].item
                    : data[dmax].head
                      ? data[dmax].head
                      : null
                : null;
    if (!dtype)
      dtype = _prev_type;
    else
      _prev_type = dtype;
    if (!dtype)
      return -1;
    if (type == dtype)
      this.max = Math.max(this.max,max);
  }
  // Should also be bigger than biggest id of specified type
  let name_key = type == this.type
                 ? (this.name_key
                   ? this.name_key
                   : type+"_name")
                 : type+"_name";
  for (let idc in data) {
    if (data.hasOwnProperty(idc) && data[idc]) {
      if (isInt(idc)) {
        let dtype = data[idc].list
                    ? data[idc].list
                    : data[idc].item
                      ? data[idc].item
                      : data[idc].head
                        ? data[idc].head
                        : null;
        if (data[idc][name_key] || data[idc][name_key]=="" || dtype == type) {
          let the_id = Number.isInteger(parseInt(idc)) ? parseInt(idc) : idc;
          let tmpmax = Math.max(this.max,the_id);
          if (!isNaN(tmpmax))
            this.max = tmpmax;
        }
      }
      if (data[idc].data) // subdata
        this.dataSearchMaxId(data[idc].data,type,_prev_type);
    }
  }
  return this.max;
}; // dataSearchMaxId

/**
 * @method dataInsert
 * @description Inserts `new_data` into the data structure at a place specified by `type`, `id`
 *              and optionally `new_id`. If the type/id combination exists several places in
 *              the data structure, only the first place found is used. Data that exist at the
 *              insertion point will be overwritten.
 * @param {Object} options An object which may contain these elements:
 *
 *        {Object}  data     The data structure to insert into.
 *                           Optional. Default: The model's data (`this.data`).
 *        {String}  type     The type of the item where the new data should be inserted (i.e. the type of
 *                           the item with id `id`.)
 *                           Optional. Default: The model's type (`this.type`).
 *        {integer} id       The id of the item in `data` where `new_data` should be inserted.
 *                           The data will be inserted like this:
 *                           1) If id is not specified:
 *                              - If `new_id` is not specified: `data              = new_data`
 *                              - If `new_id` is specified:     `data[new_id].data = new_data`
 *                           2) If id is specified and an item found in the data structure:
 *                              - If `new_id` is not specified: `item[id].data              = new_data`
 *                              - If `new_id` is specified:     `item[id].data[new_id].data = new_data`
 *                           3) If id is specified but not found in the data structure, it is an error.
 *                           Optional. Default: undefined.
 *        {Object}  new_data The data item to insert into the data structure.
 *                           Must be on a format that can be recognized by the model.
 *                           See <a href="../modules/anyVista.html">`anyVista`</a> for more information.
 *                           Mandatory.
 *        {integer} new_id   Indicates a new id that will be used when inserting the new data.
 *                           1) If `new_id` is not specified:
 *                              - If `id` is not specified: `data          = new_data`.
 *                              - If `id` is specified:     `data[id].data = new_data`.
 *                           2) If `new_id` is specified and >= 0 and an item is found in the data structure:
 *                              - If `id` is not specified: `item[new_id].data     = new_data`.
 *                              - If `id` is specified:     `item[id].data[new_id] = new_data`.
 *                           3) If `new_id` is < 0, it will be created by `dataSearchNextId` and the
 *                              data will be inserted as in case 2) above.
 *                           Optional. Default: undefined.
 *
 * @return A pointer to the place where the new data item was inserted on success, or null on error.
 *
 * @example
 *      mymodel.dataInsert({new_data:{user_name:"Foo Bar"},id:"38",type:"user"});
 */
// TODO! Not tested with non-numerical indexes
// TODO! If type/id combination exists several places in data structure, all places should be inserted into (optionally)
anyModel.prototype.dataInsert = function (options)
{
  if (!options || typeof options != "object") {
    console.error("anyModel.dataInsert: "+i18n.error.OPTIONS_MISSING);
    return null;
  }
  let the_data  = options.data ? options.data : this.data;
  let the_type  = options.type ? options.type : this.type;
  let the_id    = options.id;
  let new_data  = options.new_data;
  let new_id    = options.new_id;

  if (!the_type) {
    console.error("anyModel.dataInsert: "+i18n.error.TYPE_MISSING);
    return null;
  }
  if ((the_id || the_id === 0) &&
      ((Number.isInteger(parseInt(the_id)) && the_id < 0) ||
       (!Number.isInteger(parseInt(the_id)) && typeof the_id != "string"))) {
    console.error("anyModel.dataInsert: "+i18n.error.ID_ILLEGAL);
    return null;
  }
  if (!new_data) {
    console.error("anyModel.dataInsert: "+i18n.error.NOTHING_TO_INSERT);
    return null;
  }
  let data_allocated = false;
  if (!the_data) {
    this.data = {}; // Allocate data if the data structure is empty
    the_data = this.data;
    data_allocated = true;
  }
  let item = the_id || the_id === 0
             ? this.dataSearch({data:the_data,id:the_id,type:the_type})
             : the_data;
  if (!item || ((the_id || the_id === 0) && !item[the_id] && !item["+"+the_id])) {
    if (data_allocated)
      this.data = null;
    let errstr = i18n.error.ITEM_NOT_FOUND.replace("%%",""+the_type);
    errstr = errstr.replace("&&",""+the_id);
    console.error("anyModel.dataInsert: "+errstr);
    return null;
  }
  if (the_id || the_id === 0) {
    // An id was specified and found in the_data
    if (!item[the_id])
      the_id = "+"+the_id;
    if (new_id) {
      // A new id was specified or should be auto-generated
      if (new_id < 0)
        new_id = this.dataSearchNextId(the_data,the_type); // Auto-generate new id
      if (new_id < 0) {
        console.error("anyModel.dataInsert: "+i18n.error.NEW_ID_NOT_FOUND.replace("%%",""+the_type));
        return null;
      }
      if (!item[the_id].data)
        item[the_id].data = {};
      if (!item[the_id].data[new_id])
        item[the_id].data[new_id] = {};
      item = item[the_id].data[new_id];
      for (let filter_id in new_data)
        if (new_data.hasOwnProperty(filter_id))
          item[filter_id] = new_data[filter_id];
    }
    else
    if (!new_id && new_id != 0) {
      // No new id was specified and none should be generated
      if (!item[the_id].data)
        item[the_id].data = {};
      item = item[the_id].data;
      for (let filter_id in new_data)
        if (new_data.hasOwnProperty(filter_id))
          item[filter_id] = new_data[filter_id];
    }
  }
  else {
    // No id was specified, insert at top level
    if (new_id)
       if (!item[new_id])
         item[new_id] = {};
    if (new_id)
      item = item[new_id];
    for (let filter_id in new_data)
      if (new_data.hasOwnProperty(filter_id))
        item[filter_id] = new_data[filter_id];
  }
  if (this.auto_callback)
    this.cbExecute();
  return item;
}; // dataInsert

/**
 * @method dataInsertHeader
 * @description Insert a header at the top of the data structure
 * @param  data   The data structue to use. Optional. Default: `this.data`.
 *         type   The type of the data "below" the header. Optional. Default: `this.type`.
 *         header The header string. Mandatory.
 * @return The header that was inserted.
 *
 * @example
 *      mymodel.dataInsertHeader({type:"rider",header:"TdF 2021 riders"});
 */
anyModel.prototype.dataInsertHeader = function (options)
{
  if (!options || typeof options != "object") {
    console.error("anyModel.dataInsertHeader: "+i18n.error.OPTIONS_MISSING);
    return null;
  }
  let the_header = options.header;
  let the_type = options.type ? options.type : this.type;
  let the_data = options.data ? options.data : this.data;

  if (!the_header && the_header !== "")
    return null;
  if (!the_type) {
    console.error("anyModel.dataInsertHeader: "+i18n.error.TYPE_MISSING);
    return null;
  }
  let top_data = {
      head:               the_type,
      [the_type+"_name"]: the_header,
      data:               the_data,
  };
  return this.dataInsert({ data: the_data, new_data: top_data, new_id: "0" });
}; // dataInsertHeader

/**
 * @method dataUpdate
 * @description Updates data structure at a place specified by `type` and `id` with data in `new_data`.
 *              If the type/id combination exists several places in the data structure, only the first
 *              place found is used. Data that exist at the insertion point will be overwritten.
 * @param {Object} options An object which may contain these elements:
 *
 *        {Object}  data     The data structure to update.
 *                           Optional. Default: The model's data (`this.data`).
 *        {String}  type     The type of the item in `data` with id `id`.
 *                           Optional. Default: The model's type (`this.type`).
 *        {integer} id       The id of the item in `data` to update with values from `new_data`.
 *                           If id is not found in the data structure, it is an error.
 *                           Mandatory.
 *        {Object}  new_data The data item to update the data structure with.
 *                           Must be on the format `new_data[filter_id]` where `filter_id` are the
 *                           values containing new values.
 *                           For example:
 *                             `new_data = { user_name:        "Johhny B. Goode",
 *                                           user_description: "Musician",
 *                                         }`
 *                           If an item with the specified `id` is found in the structure `data`, it
 *                           will be updated with the values for `user_name` and `user_description`.
 *                           If an item is not found it is an error.
 *                           Mandatory.
 *
 * @return A pointer to the place where the data was updated on success, or null on error.
 *
 * @example
 *      mymodel.dataUpdate({new_data:{user_name:"Foz Baz"},id:"38",type:"user"});
 */
// TODO! Not tested with non-numerical indexes
// TODO! If type/id combination exists several places in data structure, all places should be updated (optionally)
anyModel.prototype.dataUpdate = function (options)
{
  if (!options || typeof options != "object") {
    console.error("anyModel.dataUpdate: "+i18n.error.OPTIONS_MISSING);
    return null;
  }
  let the_data = options.data ? options.data : this.data;
  let the_type = options.type ? options.type : this.type;
  let the_id   = options.id;
  let new_data = options.new_data;

  if (!the_data)
    return null;
  if (!the_type) {
    console.error("anyModel.dataUpdate: "+i18n.error.TYPE_MISSING);
    return null;
  }
  if ((!the_id && the_id !== 0) ||
      (Number.isInteger(parseInt(the_id)) && the_id < 0) ||
      (!Number.isInteger(parseInt(the_id)) && typeof the_id != "string")) {
    console.error("anyModel.dataUpdate: "+i18n.error.ID_ILLEGAL);
    return null;
  }
  if (!new_data) {
    console.error("anyModel.dataUpdate: "+i18n.error.NOTHING_TO_UPDATE);
    return null;
  }
  let item = this.dataSearch({data:the_data,id:the_id,type:the_type});
  if (!item || (!item[the_id] && !item["+"+the_id])) {
    let errstr = i18n.error.ITEM_NOT_FOUND.replace("%%",""+the_type);
    errstr = errstr.replace("&&",""+the_id);
    console.error("anyModel.dataUpdate: "+errstr);
    return null;
  }
  if (!item[the_id].dirty)
    item[the_id].dirty = {};
  for (let filter_id in new_data) {
    if (new_data.hasOwnProperty(filter_id)) {
      // Only send data that have changed to server
      if (item[the_id][filter_id] != new_data[filter_id]) {
        item[the_id][filter_id] = new_data[filter_id];
        if (filter_id != "parent_name")
          item[the_id].dirty[filter_id] = item[the_id][filter_id];
      }
    }
  }
  if (!Object.size(item[the_id].dirty))
    delete item[the_id].dirty;
  if (this.auto_callback)
    this.cbExecute();
  return item;
}; // dataUpdate

/**
 * @method dataUpdateLinkList
 * @description Add or remove items to/from a link (association) list. This can be used to update
 *              a link from one data item to another (e.g., add/remove a user to/from an event).
 * @param {Object} options An object which may contain these elements:
 *
 *        {Object}  data      The data structure to update.
 *                            Optional. Default: The model's data (`this.data`).
 *        {String}  type      The type of the item to which the list is linked to (e.g. "user").
 *                            Optional. Default: `this.type`.
 *        {integer} id        The id of the item to which the list is linked to (e.g. the user id "23").
 *                            Optional. Default: `"link-"+type`.
 *        {String}  link_type If `link_id` is specified, the type of an item in the data structure with
 *                            id `link_id`.
 *                            If `link_id` is not specified, the type of the items in the `select` and
 *                            the `unselect` arrays.
 *                            Mandatory.
 *        {String}  link_id   The id of an item to unlink from item with id `id`.
 *                            If specified, the link will be removed and no other action will be taken
 *                            (the `select` and `unselect` arrays will be ignored).
 *                            If not given, links will be added and/or removed as per the `select`
 *                            and `unselect` arrays.
 *                            Optional. Default: undefined.
 *        {Object}  unselect  A list of ids to unlink from item with id `id` (if `link_id` is not given).
 *                            This will be done *before* the ids in `select` are added.
 *                            Optional. Default: undefined.
 *        {Object}  select    A list of ids to link to item with id `id`(if `link_id` is not given).
 *                            This will be done *after* the ids in `unselect` has been removed.
 *                            If the link already exists, the link's data will be update with the data
 *                            in `new_data`, if specified.
 *                            Optional. Default: undefined.
 *        {Object}  new_data  An object containing data to update the data structure with when the
 *                            `select` list is specified and `link_id` is not specified. If `new_data`
 *                            is not specified, the data to link is assumed to be found in the `data`
 *                            data structure. If not found, it is an error.
 *                            Optional. Default: null, and `data` will be searched for the items with
 *                            ids specified in `select`.
 *        {String}  name_key
 *
 * @return true on success, false on error.
 *
 * @example
 */
anyModel.prototype.dataUpdateLinkList = function (options)
{
  if (!options || typeof options != "object") {
    console.error("anyModel.dataUpdateLinkList: "+i18n.error.OPTIONS_MISSING);
    return false;
  }
  let the_data      = options.data     ? options.data     : this.data;
  let the_type      = options.type     ? options.type     : this.type;
  let the_id        = options.id;
  let the_link_type = options.link_type;
  let the_new_data  = options.new_data ? options.new_data : this.data;
  let the_name_key  = options.name_key ? options.name_key : the_link_type+"_name";

  if (!the_data)
    return false;
  if (!the_type) {
    console.error("anyModel.dataUpdateLinkList: "+i18n.error.TYPE_MISSING);
    return false;
  }
  if (options.link_id) {
    // Remove the link data with id 'options.link_id' and return
    this.dataDelete({ data: the_data,
                      id:   options.link_id,
                      type: the_link_type,
                   });
    return true;
  } // if

  if (options.unselect) {
    // Remove links in `unselect`
    for (let id of options.unselect) {
      // Remove (delete) the link data with id 'id'
      if (!this.dataDelete({ data: the_data,
                             id:   id,
                             type: the_link_type,
                          }))
        console.warn("Couldn't remove "+the_link_type+" item with id "+id+" (not found in data). "); // TODO! i18n
    } // for
  } // if

  // Insert or update link in `select`
  if (options.select) {
    for (let id of options.select) {
      // Only insert item if it is not already in model
      if (!this.dataSearch({ data: the_data,
                             id:   id,
                             type: the_link_type,
                          })) {
        // See if we really got an item with id 'id' in the new data
        let item = this.dataSearch({ data: the_new_data,
                                     id:   id,
                                     type: the_link_type,
                                  });
        if (item) {
          let ins_id = "link-"+the_link_type; // See if we have "link-" index (created by server)
          let the_ins_type = the_link_type;
          if (!this.dataSearch({ data: the_data,
                                 id:   ins_id,
                                 type: the_link_type,
                              })) {
            ins_id = the_id; // No "link-" index, use the_id as insertion point
            the_ins_type = the_type;
          }
          let indata = {};
          indata[ins_id] = {};
          indata[ins_id].data = item;
          indata[ins_id].head = the_link_type;
          indata[ins_id][the_name_key] = the_link_type+"s";
          indata.grouping = this.grouping; // TODO! Why?
          this.dataInsert({ data:     the_data,
                            id:       ins_id,
                            type:     the_ins_type,
                            new_data: item[id] ? item[id] : item["+"+id],
                            new_id:   id,
                         });
        }
        else
          console.warn("Couldn't add "+the_link_type+" item with id "+id+" (not found in data). "); // TODO! i18n
      } // if
      else {
        // Link item exists, update it with data in `the_new_data`
        // TODO! Not implemented
      }
    } // for
  }
  return true;
}; // dataUpdateLinkList

anyModel.prototype.dataUpdateLink = function (options)
{
  // TODO! Not implemented.
}; // dataUpdateLink

/**
 * @method dataDelete
 * @description Deletes an item with a specified id from the data structure.
 * @param {Object} options An object which may contain these elements:
 *
 *        {Object}  data  The data structure to delete from.
 *                        Optional. Default: The model's data structure (`this.data`).
 *        {String}  type  The type of the item to delete.
 *                        Optional. Default: The model's type (`this.type`).
 *        {integer} id    The id of the item to delete.
 *                        Mandatory.
 *
 * @return A pointer to the place where the data was deleted on success, or null if the place was not found or on error.
 */
// TODO! What if type/id combination exists several places in data structure?
anyModel.prototype.dataDelete = function (options)
{
  if (!options || typeof options != "object") {
    console.error("anyModel.dataDelete: "+i18n.error.OPTIONS_MISSING);
    return null;
  }
  let the_data = options.data ? options.data : this.data;
  let the_type = options.type ? options.type : this.type;
  let the_id   = options.id;

  if (!the_data)
    return null; // Nowhere to delete from
  if (!the_type) {
    console.error("anyModel.dataDelete: "+i18n.error.TYPE_MISSING);
    return null;
  }
  if ((!the_id && the_id !== 0) || (Number.isInteger(parseInt(the_id)) && the_id < 0)) {
    console.error("anyModel.dataDelete: "+i18n.error.ID_MISSING);
    return null;
  }
  let item = this.dataSearch({data:the_data,id:the_id,type:the_type,parent:true});
  if (!item)
    return null;
  // When parent==true, dataSearch may return item indexed with [id]
  // if id is found on top level of data, so guard against that.
  let it_ptr = null;
  let it_idc = null;
  if (item.data)
    it_ptr = item.data;
  else
    it_ptr = item;
  if (it_ptr[the_id])
    it_idc = the_id;
  else
  if (it_ptr["+"+the_id])
    it_idc = "+"+the_id;
  if ((!it_idc && it_idc !== 0) || !it_ptr || !it_ptr[it_idc])
    return null;
  delete it_ptr[it_idc];

  if (this.auto_callback)
    this.cbExecute();
  return item; // Should be empty
}; // dataDelete

/////////////////////////////////////////////////////////////////////////////////
// Methods that work with database                                             //
/////////////////////////////////////////////////////////////////////////////////

/**
 * @method dbCreate
 * @description
 * @param {Object} options An object which may contain these elements:
 *
 *        {string}   type:       The table type, this will be the basis for the table name.
 *                               Optional. Default: `this.type`.
 *        {Object}   table:      The fields of the table.
 *                               Optional. If not specified, only the id and name fields will be created.
 *        {integer}  timeoutSec: Number of seconds before timing out.
 *                               Optional. Default: 10.
 *        {Function} success:    Method to call on success.
 *                               Optional. Default: `this.dbCreateSuccess`.
 *        {Function} fail:       Method to call on error or timeout.
 *                               Optional. Default: `this._dbFail`.
 *        {Function} context:    The context of the success and fail methods.
 *                               Optional. Default: `this`.
 *
 * @return true if
 */
anyModel.prototype.dbCreate = function (options)
{
  let type = options.type ? options.type : this.type;

  let db_timeout_sec = options.timeoutSec ? options.timeoutSec : this.db_timeout_sec;
  $.ajaxSetup({ timeout: db_timeout_sec*1000 });
  this.success = options.success ? options.success : this.dbCreateSuccess;
  this.fail    = options.fail    ? options.fail    : this._dbFail;
  this.context = options.context ? options.context : this;
  this.message      = "";
  this.error        = "";
  this.error_server = "";
  let self = this;
  if (this.mode == "remote") { // Remote server call
    let url = this._getDataSourceName()+
              "?echo=y"+
              "&cmd=cre"+
              "&type="+type;
    if (options.unique)
      url += "&unique="+options.unique;
    if (!url)
      return false;
    let tab = {};
    tab.table = options.table;
    $.getJSON(url,tab) // Call server
    .done(function(serverdata,textStatus,jqXHR) {
      return self.success ? self.success(self.context,serverdata,options) : false;
    })
    .fail(function(jqXHR,textStatus,error) {
      return self.fail    ? self.fail   (self,jqXHR) : false;
    });
    return true;
  }
  else { // Local method call
    if (!self.success) {
      this.message = i18n.error.SUCCCESS_CB_MISSING;
      console.warn("anyModel.dbCreate: "+this.message);
      return false;
    }
    return self.success(this,this,options);
  }

}; // dbCreate

/**
 * @method dbCreateSuccess
 * @description Default success callback method for dbSearch.
 * @param {Object} context
 *        {Object} serverdata
 *        {Object} options
 *
 * @return context
 */
anyModel.prototype.dbCreateSuccess = function (context,serverdata,options)
{
  let self = context ? context : this;
  self.db_last_command = "cre";
  if (serverdata) {
    if (serverdata.JSON_CODE) // Remove encapsulation, if it exists
      serverdata = serverdata.JSON_CODE;
    if (Object.size(serverdata.data) == 0)
      serverdata.data = null;
    self.message = serverdata.message;
    if (serverdata.error) {
      self.error_server = serverdata.error;
      self.error        = i18n.error.SERVER_ERROR;
    }
    if (self.message)
      console.log("anyModel.dbCreateSuccess: "+self.message);
    if (self.server_error)
      console.error("anyModel.dbCreateSuccess: "+self.server_error);
  }
  if (self.cbExecute)
    self.cbExecute();
  return context;
}; // dbCreateSuccess

/**
 * @method dbSearch
 * @description Gets an item or a list from server.
 *              The data will be handed to the success handler specified in options.success,
 *              or to this.dbSearchSuccess if no success handler is specified.
 * @param {Object} options An object which may contain these elements:
 *
 *        {string}   type:           Item's type.
 *                                   Optional. Default: `this.type`.
 *        {integer}  id:             Item's id. If specified, the database will be searched for this item.
 *                                   If not specified, a list of items of the specified type will be searched for.
 *                                   Optional. Default: null.
 *        {integer}  group_id:       If specified, search only in group with this id.
 *                                   Optional. Default: undefined.
 *        {integer}  link_type:
 *
 *        {boolean}  simple:         If true, only values for _id and _name (e.g. "user_id" and "user_name")
 *                                   will be returned from the server.
 *                                   Optional. Default: undefined.
 *        [boolean}  header:         A parameter sent to the server to indicate whether a header should be
 *                                   auto-generated.
 *                                   Optional. Default: undefined.
 *        [boolean}  grouping:       If specified, tells the server to group the data before returning.
 *                                   If false, 0, null or undefined, data will not be grouped. Any other
 *                                   value will specify grouping.
 *                                   Optional. Default: undefined.
 *        {integer}  from:
 *
 *        {integer}  num:
 *
 *        (string)   order:          Tell the server how to order the results.
 *                                   Optional. Default: undefined (server decides).
 *        {string}   direction:      Sort in ascending or descending direction.
 *                                   Optional. Default: undefined (server decides).
 *        (string)   db_search_term: A string to search for.
 *                                   Optional. Default: undefined.
 *        {Object}   db_fields:      An array of strings to be sent to the server, indicating which columns
 *                                   of the table should be used in the search. These fields are only
 *                                   applied if the server fails to find a filter corresponding to `type`.
 *                                   Optional. Default: undefined.
 *        {integer}  timeoutSec:     Number of seconds before timing out.
 *                                   Optional. Default: 10.
 *        {Function} success:        Method to call on success.
 *                                   Optional. Default: `this.dbSearchSuccess`.
 *        {Function} fail:           Method to call on error or timeout.
 *                                   Optional. Default: `this._dbFail`.
 *        {Function} context:        The context of the success and fail methods.
 *                                   Optional. Default: `this`.
 *
 * @return true if the database call was made, false otherwise.
 */
anyModel.prototype.dbSearch = function (options)
{
  if (!options || typeof options != "object")
    options = {};

  if (options.id == "max")
    return this.dbSearchNextId(options);

  let db_timeout_sec = options.timeoutSec ? options.timeoutSec : this.db_timeout_sec;
  $.ajaxSetup({ timeout: db_timeout_sec*1000 });
  if (options.sync)
    $.ajaxSetup({ async: false });
  this.success = options.success ? options.success : this.dbSearchSuccess;
  this.fail    = options.fail    ? options.fail    : this._dbFail;
  this.context = options.context ? options.context : this;
  this.message      = "";
  this.error        = "";
  this.error_server = "";
  let self = this;
  if (this.mode == "remote") { // Remote server call
    let url = this.dbSearchGetURL(options);
    if (!url)
      return false;
    let item_to_send = {};
    if (options.db_fields)
      item_to_send.fields = options.db_fields;
    else
    if (this.db_fields) // TODO! What is this?
      item_to_send.fields = this.db_fields;
    else
      item_to_send = null;
     //const start = Date.now();
    $.getJSON(url,item_to_send) // Call server
    .done(function(serverdata,textStatus,jqXHR) {
    //const end = Date.now();
    //console.log("anyModel.dbSearch execution time: ${end - start} ms");
      return self.success ? self.success(self.context,serverdata,options) : false;
    })
    .fail(function(jqXHR,textStatus,error) {
      return self.fail    ? self.fail   (self,jqXHR) : false;
    });
    return true;
  }
  else { // Local method call
    if (!self.success) {
      this.message = i18n.error.SUCCCESS_CB_MISSING;
      console.warn("anyModel.dbSearch: "+this.message);
      return false;
    }
    return self.success(this,this,options);
  }
}; // dbSearch

/**
 * @method dbSearchGetURL
 * @description Builds a POST string for dbSearch to be sent to server.
 * @param {Object} options An object which may contain these elements:
 *
 *        {integer} type:
 *        {integer} id:
 *        {integer} group_id:
 *        {integer} link_type:
 *        {boolean} simple:
 *        {string}  header:
 *        {string}  grouping:
 *        {integer} from:
 *        {integer} num:
 *        {string}  order:
 *        {string}  direction:
 *        {string}  db_search_term:
 *
 * @return The complete URL for dbSearch or null on error (missing type or id_key).
 */
anyModel.prototype.dbSearchGetURL = function (options)
{
  let the_type      = options.type ? options.type   : this.type;
  let the_id_key    = the_type     ? the_type+"_id" : this.id_key;
  let the_link_type = options.link_type;
  if (!the_type) {
    console.error("anyModel.dbSearchGetURL: "+i18n.error.TYPE_MISSING);
    return null;
  }
  if (!the_id_key) {
    console.error("anyModel.dbSearchGetURL: "+i18n.error.ID_KEY_MISSING);
    return null;
  }
  let param_str = "?echo=y"+
                  "&type="+the_type;
  let the_id = Number.isInteger(parseInt(options.id)) && options.id >= 0
               ? parseInt(options.id)
               : options.id
                 ? options.id
                 : null;
  param_str += the_id
               ? "&"+the_id_key+"="+the_id // Item search
               : ""; // List search
  let the_gid = Number.isInteger(parseInt(options.group_id)) && options.group_id >= 0
                ? parseInt(options.group_id)
                : options.group_id
                  ? options.group_id
                  : null;
  param_str += the_gid
               ? "&group_id="+the_gid // Search specific group
               : ""; // Search all groups
  param_str += the_type == "group" && the_link_type ? "&group_type="+the_link_type : "";
  param_str += options.header === true  ||
               options.header === false ||
               typeof options.header == "string"    ? "&header="    +options.header : "";
  param_str += options.grouping                     ? "&grouping="  +options.grouping : "";
  param_str += options.simple                       ? "&simple="    +options.simple : "";
  param_str += options.from || options.from === 0   ? "&from="      +options.from : "";
  param_str += options.num                          ? "&num="       +options.num : "";
  param_str += options.order                        ? "&order="     +options.order : "";
  param_str += options.direction                    ? "&dir="       +options.direction : "";
  param_str += options.db_search_term               ? "&term="      +options.db_search_term : "";
  if (options.db_search_term)
    this.db_last_term = options.db_search_term;
  return this._getDataSourceName() + param_str;
}; // dbSearchGetURL

/**
 * @method dbSearchSuccess
 * @description Default success callback method for dbSearch.
 * @param {Object} context
 *        {Object} serverdata
 *        {Object} options
 *
 * @return context
 */
anyModel.prototype.dbSearchSuccess = function (context,serverdata,options)
{
  let self = context ? context : this;
  self.db_last_command = "sea";

  if (serverdata) {
    if (serverdata.JSON_CODE)
      serverdata = serverdata.JSON_CODE;
    if (Object.size(serverdata.data) == 0)
      serverdata.data = null;
    self.message = serverdata.message;
    if (serverdata.error) {
      self.error_server = serverdata.error;
      self.error        = i18n.error.SERVER_ERROR;
    }
    if (!serverdata.data) {
      if (serverdata.id || serverdata.id === 0)
        self.message = self.type.capitalize()+" not found. "; // TODO! i18n
      else
        self.message = "No "+self.type+"s found. "; // TODO! i18n
    }
    if (self.message)
      console.log("anyModel.dbSearchSuccess: "+self.message);
    if (self.error_server)
      console.error("anyModel.dbSearchSuccess: "+self.error_server);
    if (self.auto_search && self.dataInit)
      self.dataInit(serverdata);
  }
  if (self.cbExecute && self.auto_search && self.auto_refresh && options.auto_refresh !== false)
    self.cbExecute();
  return context;
}; // dbSearchSuccess

/**
 * @method dbSearchNextId
 * @description Gets the next available id for the specified type from server.
 *              The data will be handed to the success handler specified in options.success,
 *              or to this.dbSearchNextIdSuccess if no success handler is specified.
 * @param {Object} options An object which may contain these elements:
 *
 *        {integer}  type:       Item's type.
 *                               Optional. Default: `this.type`.
 *        {Array}    db_fields:  (Coming soon.)
 *
 *        {integer}  timeoutSec: Number of seconds before timing out.
 *                               Optional. Default: 10.
 *        {Function} success:    Method to call on success.
 *                               Optional. Default: `this.dbSearchNextIdSuccess`.
 *        {Function} fail:       Method to call on error or timeout.
 *                               Optional. Default: `this._dbFail`.
 *        {Function} context:    The context of the success and fail methods.
 *                               Optional. Default: `this`.
 *
 * @return true if the database call was made, false otherwise.
 */
anyModel.prototype.dbSearchNextId = function (options)
{
  if (!options || typeof options != "object")
    options = {};

  let db_timeout_sec = options.timeoutSec ? options.timeoutSec : this.db_timeout_sec;
  $.ajaxSetup({ timeout: db_timeout_sec*1000 });
  if (options.sync)
    $.ajaxSetup({ async: false });
  this.success = options.success ? options.success : this.dbSearchNextIdSuccess;
  this.fail    = options.fail    ? options.fail    : this._dbFail;
  this.context = options.context ? options.context : this;
  this.message      = "";
  this.error        = "";
  this.error_server = "";
  let self = this;
  if (this.mode == "remote") { // Remote server call
    let url = this.dbSearchNextIdGetURL(options);
    if (!url)
      return false;
    let item_to_send = {};
    if (options.db_fields)
      item_to_send.fields = options.db_fields;
    else
    if (this.db_fields) // TODO! What is this?
      item_to_send.fields = this.db_fields;
    else
      item_to_send = null;
    $.getJSON(url,item_to_send) // Call server
    .done(function(serverdata,textStatus,jqXHR) {
      return self.success ? self.success(self.context,serverdata,options) : false;
    })
    .fail(function(jqXHR,textStatus,error) {
      return self.fail    ? self.fail   (self,jqXHR) : false;
    });
    return true;
  }
  else { // Local method call
    if (!self.success) {
      this.message = i18n.error.SUCCCESS_CB_MISSING;
      console.warn("anyModel.dbSearchNextId: "+this.message);
      return false;
    }
    return self.success(this,this,options);
  }
}; // dbSearchNextId

/**
 * @method dbSearchNextIdGetURL
 * @description Builds a POST string for dbSearchNextId to be sent to server.
 * @param {Object} options An object which may contain these elements:
 *
 *        {integer} type: Item's type. If specified and not equal to `this.type`, then `[options.type]_id` will
 *                        be used as the id_key instead of the value in `this.id_key` when calling the server.
 *                        Optional. Default: `this.type`.
 *
 * @return The complete URL for dbSearchNextId or null on error (missing type or id_key).
 */
anyModel.prototype.dbSearchNextIdGetURL = function (options)
{
  let the_type   = options.type ? options.type   : this.type;
  let the_id_key = the_type     ? the_type+"_id" : this.id_key;
  if (!the_type) {
    console.error("anyModel.dbSearchNextIdGetURL: "+i18n.error.TYPE_MISSING);
    return null;
  }
  if (!the_id_key) {
    console.error("anyModel.dbSearchNextIdGetURL: "+i18n.error.ID_KEY_MISSING);
    return null;
  }
  let param_str = "?echo=y"+
                  "&type="+the_type;
  param_str += "&"+the_id_key+"=max";
  return this._getDataSourceName() + param_str;
}; // dbSearchNextIdGetURL

/**
 * @method dbSearchNextIdSuccess
 * @description Default success callback method for dbSearchNextId.
 * @param {Object} context
 *        {Object} serverdata
 *        {Object} options
 *
 * @return context
 */
anyModel.prototype.dbSearchNextIdSuccess = function (context,serverdata,options)
{
  let self = context ? context : this;
  self.db_last_command = "sea";
  if (serverdata) {
    if (serverdata.JSON_CODE) // Remove encapsulation, if it exists
      serverdata = serverdata.JSON_CODE;
    serverdata.is_new = options.is_new;
    self.max     = parseInt(serverdata.id);
    self.message = serverdata.message;
    if (serverdata.error) {
      self.error_server = serverdata.error;
      self.error        = i18n.error.SERVER_ERROR;
    }
    if (self.message)
      console.log("anyModel.dbSearchNextIdSuccess: "+self.message);
    if (self.error_server)
      console.error("anyModel.dbSearchNextIdSuccess: "+self.error_server);
  }
  return context;
}; // dbSearchNextIdSuccess

/**
 * @method dbUpdate
 * @description Insert or update an item in a database table.
 * @param {Object} options An object which may contain these elements:
 *
 *        {Object}   new_data:   The data structure from which comes the data to insert/update. If null
 *                               or not specified, data from `this.data` is used for the update. A data
 *                               item matching id/type, must exist in the data structure. If no such
 *                               item can be found, it is an error.
 *                               Optional. Default: `this.data`.
 *        {integer}  type:       Type of the datem to update.
 *                               Optional. Default: `this.type`.
 *        {integer}  id:         The data item's id. If given, an existing item in the database will be
 *                               updated. If not given, a new item will be inserted into the database.
 *                               Mandatory if updating, null or undefined if inserting.
 *        {boolean}  is_new:     true if the item is new (does not exist in database) and should be inserted
 *                               rather than updated. Note: If set, an insert operation will be performed
 *                               even if `options.id` has a value.
 *                               Optional. Default: false.
 *        {Object}   db_fields:  An array of strings to be sent to the server, indicating which columns
 *                               of the table should be used in the update/insert. These fields are only
 *                               applied if the server fails to find a filter corresponding to `type`.
 *                               Optional. Default: undefined.
 *        {integer}  timeoutSec: Number of seconds before timing out.
 *                               Optional. Default: 10.
 *        {Function} success:    Method to call on success.
 *                               Optional. Default: `this.dbUpdateSuccess`.
 *        {Function} fail:       Method to call on error or timeout.
 *                               Optional. Default: `this._dbFail`.
 *        {Function} context:    The context of the success and fail methods.
 *                               Optional. Default: `this`.
 *
 * @return true if the database call was made, false otherwise.
 */
anyModel.prototype.dbUpdate = function (options)
{
  if (!options || typeof options != "object")
    options = {};

  let new_data = options.new_data ? options.new_data : this.data;
  let the_type = options.type     ? options.type     : this.type;
  let the_id   = Number.isInteger(parseInt(options.id)) && options.id >= 0
                 ? parseInt(options.id)
                 : options.id
                   ? options.id
                   : null;
  if (!new_data)
    return null; // Nowhere to delete from
  if (!the_type) {
    console.error("anyModel.dbUpdate: "+i18n.error.TYPE_MISSING);
    return false;
  }
  if (!the_id && the_id !== 0 && typeof the_id !== "string") {
    console.error("anyModel.dbUpdate: "+i18n.error.ID_ILLEGAL);
    return false;
  }
  // Check that we have new or dirty data
  let item = this.dataSearch({ data: new_data,
                               type: the_type,
                               id:   the_id,
                            });
  if (!item || !item[the_id]) {
    let errstr = i18n.error.ITEM_NOT_FOUND.replace("%%",""+the_type)
    errstr = errstr.replace("&&",""+the_id)
    console.error("anyModel.dbUpdate: "+errstr);
    return false;
  }
  if (!options.is_new && !item[the_id].is_new && !Object.size(item[the_id].dirty)) {
    this.message = i18n.error.NOTHING_TO_UPDATE;
    console.log("anyModel.dbUpdate: "+this.message);
    this.cbExecute();
    return false;
  }
  // Data to update or insert
  let item_to_send = item[the_id].is_new || options.is_new
                     ? item[the_id]        // insert
                     : item[the_id].dirty
                       ? item[the_id].dirty
                       : {}; // update
  // Data used in dbUpdateSuccess method
  options.client_id = the_id;   // Update this id in existing data structure with new id from server
  options.data      = new_data; // Clean up this data structure after server returns successfully

  let db_timeout_sec = options.timeoutSec ? options.timeoutSec : this.db_timeout_sec;
  $.ajaxSetup({ timeout: db_timeout_sec*1000 });
  if (options.sync)
    $.ajaxSetup({ async: false });
  this.success = options.success ? options.success : this.dbUpdateSuccess;
  this.fail    = options.fail    ? options.fail    : this._dbFail;
  this.context = options.context ? options.context : this;
  this.message      = "";
  this.error        = "";
  this.error_server = "";
  let self = this;
  if (this.mode == "remote") { // Remote server call
    let url = this.dbUpdateGetURL(options);
    if (!url)
      return false;
    if (options.db_fields)
      item_to_send.fields = options.db_fields;
    else
    if (this.db_fields) // TODO! What is this?
      item_to_send.fields = this.db_fields;
    $.getJSON(url,item_to_send) // Call server
    .done(function(serverdata,textStatus,jqXHR) {
      return self.success ? self.success(self.context,serverdata,options) : false;
    })
    .fail(function(jqXHR,textStatus,error) {
      return self.fail    ? self.fail   (self,jqXHR) : false;
    });
    return true;
  }
  else {
    if (!self.success) {
      this.message = i18n.error.SUCCCESS_CB_MISSING;
      console.warn("anyModel.dbUpdate: "+this.message);
      return false;
    }
    return self.success(this,this,options);
  }
}; // dbUpdate

/**
 * @method dbUpdateGetURL
 * @description Builds a POST string for dbUpdate to be sent to server.
 * @param {Object} options An object which may contain these elements:
 *
 *        {integer}  id:      Item's id. If specified, the server will update the item,
 *                            if not specified, the server will insert the item.
 *                            Optional. Default: null.
 *        {integer}  type:    Item's type. If specified and not equal to `this.type`, then `[options.type]_id` will
 *                            be used as the id_key instead of the value in `this.id_key` when calling the server.
 *                            Optional. Default: `this.type`.
 *        {boolean}  is_new:  true if the item is new (does not exist in database) and should be inserted
 *                            and not updated. Note: If set, an insert operation will be performed even if
 *                            `options.id` has a value.
 *                            Optional. Default: false.
 *        {boolean} auto_id:  Tells the server whether to update the id field by AUTOINCREMENT. If false, the server
 *                            will use the value provide, if tru use AUTOINCREMENT. Default: true.
 *
 * @return The complete URL for dbUpdate or null on error.
 */
anyModel.prototype.dbUpdateGetURL = function (options)
{
  let the_type   = options.type ? options.type   : this.type;
  let the_id_key = the_type     ? the_type+"_id" : this.id_key;
  if (!the_type) {
    console.error("anyModel.dbUpdateGetURL: "+i18n.error.TYPE_MISSING);
    return null;
  }
  if (!the_id_key) {
    console.error("anyModel.dbUpdateGetURL: "+i18n.error.ID_KEY_MISSING);
    return null;
  }
  let param_str = "?echo=y"+
                  "&type="+the_type;
  let the_id   = Number.isInteger(parseInt(options.id)) && options.id >= 0
                 ? parseInt(options.id)
                 : options.id
                   ? options.id
                   : null;
  param_str += the_id
               ? "&"+the_id_key+"="+the_id // Update item
               : ""; // Insert item

  // If a group id is given, the item will be put into that group immediately
  let group_id     = the_type != "group" ? options.group_id : null;
  let the_group_id = the_type != "group"
                     ? Number.isInteger(parseInt(group_id)) && group_id >= 0
                       ? parseInt(group_id)
                       : group_id
                         ? group_id
                         : null
                     : null;
  if (the_group_id)
    param_str += "&group_id="+the_group_id;

  // Auto id
  param_str += options.auto_id
               ? "&auto_id=1"
               : "&auto_id=0";

  // Command
  param_str += options.is_new || !the_id
               ? "&cmd=ins"
               : "&cmd=upd";

  // Link elements?
  param_str += options.item_id && options.item_type
               ? "&link_type="+options.item_type+"&link_id="+options.item_id
               : "";

  return this._getDataSourceName() + param_str;
}; // dbUpdateGetURL

/**
 * @method dbUpdateSuccess
 * @description Default success callback method for dbUpdate.
 * @param {Object} context
 *        {Object} serverdata
 *        {Object} options
 *
 * @return context
 */
anyModel.prototype.dbUpdateSuccess = function (context,serverdata,options)
{
  let self = context ? context : this;
  self.db_last_command = "upd";
  if (serverdata) {
    if (serverdata.JSON_CODE)
      serverdata = serverdata.JSON_CODE;
    if (Object.size(serverdata.data) == 0)
      serverdata.data = null;
    self.message = serverdata.message;
    if (serverdata.error) {
      self.error_server = serverdata.error;
      self.error        = i18n.error.SERVER_ERROR;
    }
    if (self.message)
      console.log("anyModel.dbUpdateSuccess: "+self.message);
    if (self.error_server)
      console.error("anyModel.dbUpdateSuccess: "+self.error_server);
    else {
      // If item is in model's data structure, we must update model after successful insert/update
      let type = options.type ? options.type : self.type;
      let item = self.dataSearch({ type: type,
                                   id:   options.client_id,
                                   data: options.data,
                                });
      if (item) {
        if (options.id == options.client_id && (!item || (!item[options.client_id] && !item["+"+options.client_id]))) {
          // Should never happen
          console.error("anyModel.dbUpdateSuccess: System error: Could not find item with id "+options.client_id);
          return false;
        }
        if (!["head","item","list"].includes(serverdata.id)) { // head, item and list are illegal as ids
          self.last_insert_id = serverdata.id; // Id of the item inserted/updated, as provided by server
          if ((options.client_id || options.client_id === 0) && (serverdata.id || serverdata.id === 0) && parseInt(options.client_id) != parseInt(serverdata.id)) {
            // Replace item with defunct id with an item using new id from server
            item[serverdata.id] = item[options.client_id]
                                  ? item[options.client_id]
                                  : item["+"+options.client_id];
            if (item[serverdata.id][self.id_key])
              item[serverdata.id][self.id_key] = serverdata.id;
            delete item[serverdata.id].is_new;
            delete item[serverdata.id].dirty;
            self.dataDelete({ type: options.type,
                              id:   options.client_id,
                           });
          }
          // Remove the is_new mark and dirty data
          let tmp_id = item[options.client_id]
                       ? options.client_id
                       : item["+"+options.client_id]
                         ? "+"+options.client_id
                         : null;
          if (tmp_id && item[tmp_id]) {
            delete item[tmp_id].is_new;
            delete item[tmp_id].dirty;
          }
        }
      } // if (item)
      delete options.client_id; // Delete property set by dbUpdate
    }
  }
  if (self.cbExecute && self.auto_refresh && options.auto_refresh !== false)
    self.cbExecute();
  return context;
}; // dbUpdateSuccess

/**
 * @method dbUpdateLinkList
 * @description Add and/or remove items to/from a link (association) list by updating the link table
 *              in the database. This can be used to link/unlink an item to/from another item.
 * @param {Object}  options An object which may contain these elements:
 *
 *        {String}  type       The type of the item to which the list is linked to (e.g. "user").
 *                             Optional. Default: `this.type`.
 *        {integer} id         The id of the item to which the list is linked to (e.g. the user  id "23").
 *                             Optional.
 *        {String}  link_type  If `link_id` is specified, the type of an item in the data structure with
 *                             id `link_id`.
 *                             If `link_id` is not specified, the type of the items in the `select` and
 *                             the `unselect` arrays.
 *                             Mandatory if `link_id` is given.
 *        {String}  link_id    The id of an item to unlink from item with id `id`.
 *                             If specified, the link will be removed and no other action will be taken
 *                             (the `select` and `unselect` arrays will be ignored).
 *                             If not given, links will be added and/or removed as per the `select`
 *                             and `unselect` arrays.
 *                             Optional. Default: undefined.
 *        {Object}  unselect   A list of ids to unlink from item with id `id` (if `link_id` is not given).
 *                             This will be done *before* the ids in `select` are added.
 *                             Optional. Default: undefined.
 *        {Object}  select     A list of ids to link to item with id `id`(if `link_id` is not given).
 *                             This will be done *after* the ids in `unselect` has been removed.
 *                             If the link already exists, the link's data will be update with the data
 *                             in `new_data`, if specified.
 *                             Optional. Default: undefined.
 *        {integer} timeoutSec Number of seconds before timing out.
 *                             Optional. Default: 10.
 *
 * @return true if the database call was made, false on error.
 */
anyModel.prototype.dbUpdateLinkList = function (options)
{
  if (!options || typeof options != "object")
    options = {};

  let db_timeout_sec = options.timeoutSec ? options.timeoutSec : this.db_timeout_sec;
  $.ajaxSetup({ timeout: db_timeout_sec*1000 });
  if (options.sync)
    $.ajaxSetup({ async: false });
  this.success = options.success ? options.success : this.dbUpdateLinkListSuccess;
  this.fail    = options.fail    ? options.fail    : this._dbFail;
  this.context = options.context ? options.context : this;
  this.message      = "";
  this.error        = "";
  this.error_server = "";
  let self = this;
  if (this.mode == "remote") { // Remote server call
    let url = this.dbUpdateLinkListGetURL(options);
    if (!url)
      return false;
    $.getJSON(url) // Call server
    .done(function(serverdata,textStatus,jqXHR) {
      return self.success ? self.success(self.context,serverdata,options) : false;
    })
    .fail(function(jqXHR,textStatus,error) {
      return self.fail    ? self.fail   (self,jqXHR) : false;
    });
  }
  else {
    if (!self.success) {
      this.message = i18n.error.SUCCCESS_CB_MISSING;
      console.warn("anyModel.dbUpdateLinkList: "+this.message);
      return false;
    }
    return self.success(this,this,options);
  }
  return true;
}; // dbUpdateLinkList

/**
 * @method dbUpdateLinkListGetURL
 * @description Builds a POST string for dbUpdateLinkListGetURL to be sent to server.
 * @param {Object} options See dbUpdateLinkList().
 *
 * @return The complete URL for dbUpdateLinkList or null on error.
 */
anyModel.prototype.dbUpdateLinkListGetURL = function (options)
{
  let the_type      = options.type ? options.type : this.type;
  let the_link_type = options.link_type;
  let the_id        = Number.isInteger(parseInt(options.id)) && options.id >= 0
                      ? parseInt(options.id)
                      : options.id
                        ? options.id
                        : Number.isInteger(parseInt(this.id))
                          ? parseInt(this.id)
                          : this.id;
  if (!the_type) {
    console.error("anyModel.dbUpdateLinkListGetURL: "+i18n.error.TYPE_MISSING);
    return null;
  }
  if (!the_link_type) {
    console.error("anyModel.dbUpdateLinkListGetURL: "+i18n.error.LINK_TYPE_MISSING);
    return null;
  }
  if (typeof options.id !== "string" && !the_id && the_id !== 0) {
    console.error("anyModel.dbUpdateLinkListGetURL: "+i18n.error.ID_ILLEGAL);
    return null;
  }
  let param_str = "?echo=y"+
                  "&cmd=upd"+
                  "&type="+the_type+
                  "&"+the_type+"_id"+"="+the_id+
                  "&link_type="+the_link_type;
  if (options.link_id)
    param_str += "&rem="+options.link_id;
  else {
    let has_add_or_rem = false;
    if (options.select) {
      let sel = [...options.select];
      param_str += "&add="+sel;
      has_add_or_rem = true;
    }
    if (options.unselect) {
      let unsel = [...options.unselect];
      param_str += "&rem="+unsel;
      has_add_or_rem = true;
    }
    if (!has_add_or_rem) {
      console.error("anyModel.dbUpdateLinkListGetURL: "+i18n.error.LINK_ITEMS_MISSING);
      return null;
    }
  }
  param_str += options.db_search ? "&sea=y"                      : "";
  param_str += options.header    ? "&header="  +options.header   : "";
  param_str += options.grouping  ? "&grouping="+options.grouping : "";
  return this._getDataSourceName() + param_str;
}; // dbUpdateLinkListGetURL

// Default success callback method for dbUpdateLinkList
anyModel.prototype.dbUpdateLinkListSuccess = function (context,serverdata,options)
{
  let self = context ? context : this;
  self.db_last_command = "updlink";
  if (serverdata) {
    if (serverdata.JSON_CODE)
      serverdata = serverdata.JSON_CODE;
    if (Object.size(serverdata.data) == 0)
      serverdata.data = options.data ? options.data : self.data;
    self.message = serverdata.message;
    if (serverdata.error) {
      self.error_server = serverdata.error;
      self.error        = i18n.error.SERVER_ERROR;
    }
    if (self.message)
      console.log("anyModel.dbUpdateLinkListSuccess: "+self.message);
    if (self.error_server)
      console.error("anyModel.dbUpdateLinkListSuccess: "+self.error_server);
    if (serverdata.error == "") {
      options.new_data = serverdata.data;
      self.dataUpdateLinkList(options);
    }
  }
  if (self.cbExecute && self.auto_refresh && options.auto_refresh !== false)
    self.cbExecute();
  return context;
}; // dbUpdateLinkListSuccess

/**
 * @method dbUpdateLink
 * @description Change individual value(s) for an item.
 * @param {Object} options An object which may contain these elements:
 *
 *        {String}  type:       The type of items in the list.
 *                              Optional. Default: `this.type`.
 *        {String}  id:         The id of the item.
 *                              Mandatory.
 *        {Object}  link_type:  The type of the item to which the list "belongs" (is linked to).
 *                              Optional. Default: `this.type`.
 *        {String}  link_id:    The id of the item to which the list "belongs" (is linked to).
 *                              Mandatory.
 *        {Array}   names:
 *        {Array}   values:
 *        {integer} timeoutSec: Number of seconds before timing out.
 *                              Optional. Default: 10.
 *
 * @return true if the database call was made, false on error.
 */
anyModel.prototype.dbUpdateLink = function (options)
{
  if (!options || typeof options != "object")
    options = {};

  let db_timeout_sec = options.timeoutSec ? options.timeoutSec : this.db_timeout_sec;
  $.ajaxSetup({ timeout: db_timeout_sec*1000 });
  if (options.sync)
    $.ajaxSetup({ async: false });
  this.success = options.success ? options.success : this.dbUpdateLinkSuccess;
  this.fail    = options.fail    ? options.fail    : this._dbFail;
  this.context = options.context ? options.context : this;
  this.message      = "";
  this.error        = "";
  this.error_server = "";
  let self = this;
  if (this.mode == "remote") { // Remote server call
    let url = this.dbUpdateLinkGetURL(options);
    if (!url)
      return false;
    $.getJSON(url) // Call server
    .done(function(serverdata,textStatus,jqXHR) {
      return self.success ? self.success(self.context,serverdata,options) : false;
    })
    .fail(function(jqXHR,textStatus,error) {
      return self.fail    ? self.fail   (self,jqXHR) : false;
    });
  }
  else {
    if (!self.success) {
      this.message = i18n.error.SUCCCESS_CB_MISSING;
      console.warn("anyModel.dbUpdateLink: "+this.message);
      return false;
    }
    return self.success(this,this,options);
  }
  return true;
}; // dbUpdateLink

/**
 * @method dbUpdateLinkGetURL
 * @description Builds a POST string for dbUpdateLinkGetURL to be sent to server.
 * @param {Object} options An object which may contain these elements:
 *
 * @return The complete URL for dbUpdateLink or null on error.
 */
anyModel.prototype.dbUpdateLinkGetURL = function (options)
{
  let the_type      = options.type ? options.type : this.type;
  let the_id        = Number.isInteger(parseInt(options.id)) && options.id >= 0
                      ? parseInt(options.id)
                      : options.id
                        ? options.id
                        : null;
  let the_link_type = options.link_type;
  if (!the_type) {
    console.error("anyModel.dbUpdateLinkGetURL: "+i18n.error.TYPE_MISSING);
    return null;
  }
  if (!the_id && typeof options.id !== "string") {
    console.error("anyModel.dbUpdateLinkGetURL: "+i18n.error.ID_ILLEGAL);
    return null;
  }
  if (!options.values) {
    console.error("anyModel.dbUpdateLinkGetURL: No values to change. "); // TODO! i18n
    return null;
  }
  let param_str = "?echo=y"+
                  "&cmd=upd"+
                  "&cha=y"+
                  "&type="+the_type+
                  "&"+the_type+"_id"+"="+the_id;
  if (the_link_type)
    param_str += "&link_type="+the_link_type;
  param_str += "&link_id="+options.link_id;
  let nam = [...options.names];  // TODO! Whats this for?
  let val = [...options.values]; // TODO! Whats this for?
  param_str += options.db_search ? "&sea=y"                      : "";
  param_str += options.header    ? "&header="  +options.header   : "";
  param_str += options.grouping  ? "&grouping="+options.grouping : "";
  return this._getDataSourceName() + param_str;
}; // dbUpdateLinkGetURL

// Default success callback method for dbUpdateLink
anyModel.prototype.dbUpdateLinkSuccess = function (context,serverdata,options)
{
  // TODO! Not implemented
}; // dbUpdateLinkSuccess

/**
 * @method dbDelete
 * @description Deletes an item from a database table.
 *              TODO! Check that the server also deletes any links the item may have in other tables.
 * @param {Object} options An object which may contain these elements:
 *
 *        {integer}  type:       Item's type.
 *                               Optional. Default: `this.type`.
 *        {integer}  id:         The id of the item to delete.
 *                               Mandatory.
 *        {integer}  timeoutSec: Number of seconds before timing out.
 *                               Optional. Default: 10.
 *        {Function} success:    Method to call on success.
 *                               Optional. Default: `this.dbDeleteSuccess`.
 *        {Function} fail:       Method to call on error or timeout.
 *                               Optional. Default: `this._dbFail`.
 *        {Function} context:    The context of the success and fail methods.
 *                               Optional. Default: `this`.
 *
 * @return true if the database call was made, false otherwise.
 */
anyModel.prototype.dbDelete = function (options)
{
  if (!options || typeof options != "object")
    options = {};

  if (options.is_new)
    return false; // No need to call database

  let the_type = options.type ? options.type : this.type;
  if (!the_type) {
    console.error("anyModel.dbDelete: "+i18n.error.TYPE_MISSING);
    return false;
  }
  let the_id = Number.isInteger(parseInt(options.id)) && options.id >= 0
               ? parseInt(options.id)
               : options.id
                 ? options.id
                 : null;
  if (!the_id && typeof options.id !== "string") {
    console.error("anyModel.dbDelete: "+i18n.error.ID_ILLEGAL);
    return false;
  }

  let db_timeout_sec = options.timeoutSec ? options.timeoutSec : this.db_timeout_sec;
  $.ajaxSetup({ timeout: db_timeout_sec*1000 });
  if (options.sync)
    $.ajaxSetup({ async: false });
  this.success = options.success ? options.success : this.dbDeleteSuccess;
  this.fail    = options.fail    ? options.fail    : this._dbFail;
  this.context = options.context ? options.context : this;
  this.message      = "";
  this.error        = "";
  this.error_server = "";
  let self = this;
  if (this.mode == "remote") { // Remote server call
    let url = this.dbDeleteGetURL(options);
    if (!url)
      return false;
    $.getJSON(url) // Call server
    .done(function(serverdata,textStatus,jqXHR) {
      return self.success ? self.success(self.context,serverdata,options) : false;
    })
    .fail(function(jqXHR,textStatus,error) {
      return self.fail    ? self.fail   (self,jqXHR) : false;
    });
    return true;
  }
  else {
    if (!self.success) {
      this.message = i18n.error.SUCCCESS_CB_MISSING;
      console.warn("anyModel.dbDelete: "+this.message);
      return false;
    }
    return self.success(this,this,options);
  }
}; // dbDelete

/**
 * @method dbDeleteGetURL
 * @description Builds a POST string for dbDelete to be sent to server.
 * @param {Object} options An object which may contain these elements:
 *
 * @return The complete URL for dbDelete or null on error.
 */
anyModel.prototype.dbDeleteGetURL = function (options)
{
  let the_type   = options.type ? options.type   : this.type;
  let the_id_key = the_type     ? the_type+"_id" : this.id_key;
  let the_id     = Number.isInteger(parseInt(options.id)) && options.id >= 0
                   ? parseInt(options.id)
                   : options.id
                     ? options.id
                     : null;
  if (!the_type) {
    console.error("anyModel.dbDeleteGetURL: "+i18n.error.TYPE_MISSING);
    return null;
  }
  if (!the_id && typeof options.id !== "string") {
    console.error("anyModel.dbDeleteGetURL: "+i18n.error.ID_ILLEGAL);
    return false;
  }
  if (!the_id_key) {
    console.error("anyModel.dbDeleteGetURL: "+i18n.error.ID_KEY_MISSING);
    return null;
  }
  let param_str = "?echo=y"+
                  "&type="+the_type;
  param_str += "&cmd=del"+
               "&del="+the_type+
               "&"+the_id_key+"="+the_id;

  return this._getDataSourceName() + param_str;
}; // dbDeleteGetURL

/**
 * @method anyModel.dbDeleteSuccess
 * @description Default success callback method for dbDelete.
 * @param {Object} context
 *        {Object} serverdata
 *        {Object} options
 *
 * @return context
 */
anyModel.prototype.dbDeleteSuccess = function (context,serverdata,options)
{
  let self = context ? context : this;
  self.db_last_command = "del";

  if (serverdata) {
    if (serverdata.JSON_CODE)
      serverdata = serverdata.JSON_CODE;
    if (Object.size(serverdata.data) == 0)
      serverdata.data = null;
    self.message = serverdata.message;
    if (serverdata.error) {
      self.error_server = serverdata.error;
      self.error        = i18n.error.SERVER_ERROR;
    }
    if (self.message)
      console.log("anyModel.dbDeleteSuccess: "+self.message);
    if (self.error_server)
      console.error("anyModel.dbDeleteSuccess: "+self.error_server);
  }
  if (self.cbExecute && self.auto_refresh && options.auto_refresh !== false)
    self.cbExecute();
  return context;
}; // dbDeleteSuccess

// Default fail callback for all db* methods
anyModel.prototype._dbFail = function (context,jqXHR)
{
  let self = context ? context : this;
  if (!self)
    return false; // Should never happen
  if (jqXHR) {
    self.error_server = jqXHR.statusText+" ("+jqXHR.status+"). ";
    if (jqXHR.responseText)
      self.error_server += jqXHR.responseText;
    self.error = i18n.error.SERVER_ERROR;
    console.error("anyModel._dbFail: "+self.error_server);
    if (self.cbExecute)
      self.cbExecute();
  }
  return context;
}; // _dbFail
//@ sourceURL=anyModel.js