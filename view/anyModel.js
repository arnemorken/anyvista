/* jshint sub:true */
/* jshint esversion: 9 */
/* globals $,i18n,any_defs,isInt,dbConnection,anyTableFactory,gSource, */
"use strict";

/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2024 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ***************************************************************************************/

/**
 * The anyModel class contains a tree structure data model that can manipulate data as lists and
 * items and optionally synchronize with a (server or client side) database.
 * <p/>
 * See <a href="anyView.html">`anyView`</a> for a description of a data view class for displaying
 * data in the model.
 * <p/>
 * The model must have a type (e.g. `type = "user"`), an should have id key (e.g. `id_key = "user_id"`)
 * and a name key (e.g. `name_key = "user_name"`). If `id_key` or `name_key` is omitted, they are
 * constructed from `type` (for example will type "foo" give rise to id_key "foo_id" and name_key
 * "foo_name"). If no type is specified, the model cannot be searched, synchronized with database
 * etc. If the model contains data for an item, which may or may not contain subdata (of any kind),
 * the `id` property should be set to the id of the item and either `this.data[id]` or
 * `this.data[hdr_id].data[id]` should exist (where hdr_id is the id of a single `head` entry).
 * <p/>
 * If used in connection with a server side database, `source` should be set to "remote" (see below),
 * otherwise it defaults to "local". `type` corresponds to a database table and `id_key` to an id
 * column in that table.
 * <p/>
 * See <a href="module-anyVista.html">anyVista</a> for a full description of the format of the data
 * structure that the model works with.
 * <p/>
 * The class contains:
 * <li>- a constructor, which sets the model's variables according to `options`, or to default values,</li>
 * <li>- methods for working with data in the internal data structure (`data*` methods),</li>
 * <li>- methods for working with data in a (server or client side) database (`db*` methods),</li>
 * <li>- subscribe/callback methods (`cb*` methods),</li>
 * <li>- helper methods.</li>
 *
 * @constructs anyModel
 * @param {Object} options An object which may contain the following properties, all of which are
 *                         optional unless stated otherwise:
 *
 * @param {Object}   options.data           The data with which to initialize the model.
 *                                          Default: null.
 * @param {String}   options.type           The model's base type, e.g. "user".
 *                                          Default: "".
 * @param {String}   options.id             Item id, e.g. "42". Only used if the top level data
 *                                          represents an item.
 *                                          Default: null.
 * @param {String}   options.id_key         The model's base id key, e.g. "user_id".
 *                                          Default: "[type]_id" if type is set, "" otherwise.
 * @param {String}   options.name_key       The model's base name key, e.g. "user_name".
 *                                          Default: "[type]_name" if type is set, "" otherwise.
 * @param {anyModel} options.parent         The model's "parent" model, if any.
 *                                          Default: null.
 * @param {String}   options.link_id        Links to an item in the parent model (if any).
 *                                          Default: null.
 * @param {String}   options.link_type      Type of an item in the parent model (if any).
 *                                          Default: null.
 * @param {String}   options.source         Indicates whether db* operations should be performed by
 *                                          a locally defined method ("local") or call a database
 *                                          method on a remote server ("remote").
 *                                          Default: "local".
 * @param {Object}   options.db_connection  The database connection.
 *                                          Only valid when `source` is "local", in which case
 *                                          a client side AlaSQL database will be used.
 *                                          Default: null.
 * @param {Object}   options.table_factory  The table factory class.
 *                                          Only valid when `source` is "local", in which case
 *                                          a client side AlaSQL database will be used.
 *                                          Default: null.
 * @param {Array}    options.table_fields   An array of strings to be sent to the server, indicating
 *                                          which columns of the table should be used in a search or
 *                                          update/insert. These fields are only applied if the
 *                                          server fails to find a filter corresponding to `type`.
 *                                          Default: null.
 * @param {boolean}  options.db_search      Whether to call the search method while initializing the
 *                                          class or while searching on the server.
 *                                          Default: false.
 * @param {String}   options.db_search_term The string to search for when `db_search == true`.
 *                                          Default: "".
 * @param {String}   options.db_last_term   The last string that was searched for.
 *                                          Default: "".
 * @param {boolean}  options.auto_search    If true, the model will be initiated with the result of a search, and
 *                                          cbExecute will be called.
 *                                          Default: true.
 * @param {boolean}  options.auto_callback  If true, cbExecute will be called after calling
 *                                          dataInsert, dataUpdate and dataDelete.
 *                                          Default: false.
 * @param {boolean}  options.auto_refresh   If true, cbExecute will be called after calling
 *                                          dbSearch, dbUpdate, dbUpdateLinkList, dbUpdateLink and
 *                                          dbDelete.
 *                                          Default: true.
 * @param {Object}   options.permission     Permissions (normally obtained from server). The object
 *                                          may contain:
 *                                          <li> {integer} current_user_id: The user id the current
 *                                                                          user is logged in with
 *                                                                          (if applicable).
 *                                                                          Default: null.
 *                                          <li> {boolean} is_logged_in:    True if the user is
 *                                                                          logged in.
 *                                                                          Default: true.
 *                                          <li> {boolean} is_admin:        True if the user has
 *                                                                          admin privileges.
 *                                                                          Default: false.
 * @param {String}   options.message        Info messages.
 *                                          Default: "".
 * @param {String}   options.error          Error messages.
 *                                          Default: "".
 * @param {String}   options.error_server   Error messages from server.
 *                                          Default: "".
 *
 * @example
 *      new anyModel({ type:"user",id_key:"user_id",id:"38",data:{38:{user_name:"Aretha Franklin"}}});
 */
var anyModel = function (options)
{
  /**
  * The model's (tree) data structure.
  *
  * @type       {Object}
  * @default    null
  */
  this.data = null;

  /**
  * The model's base type, e.g. `"user"`.
  * If already set (by a derived class), it will not be initialized.
  *
  * @type       {String}
  * @default    ""
  * @example    mymodel.type = "event";
  */
  this.type = this.type ? this.type : "";

  /**
  * Item id, used if and only if the top level data represents an item.
  * If already set (by a derived class), it will not be initialized.
  *
  * @type       {String}
  * @default    null
  * @example    mymodel.id = "42";
  */
  this.id = this.id || this.id === 0 ? this.id : null;

  /**
  * The model's base id key, e.g. `"user_id"`.
  * If already set (by a derived class), it will not be initialized.
  * If not specified and `type` is set, "[type]_id" is used as the model's id key.
  * If `type` is not set, it defaults to "".
  *
  * @type       {String}
  * @default    "[type]_id" if type is set, "" otherwise.
  */
  this.id_key = this.id_key ? this.id_key : this.type ? this.type+"_id" : "";

  /**
  * The model's base name key, e.g. `"user_name"`.
  * If already set (by a derived class), it will not be initialized.
  * If not specified and `type` is set, "[type]_name" is used as the model's name key.
  * If `type` is not set, it defaults to "".
  *
  * @type       {String}
  * @default    "[type]_name" if type is set, "" otherwise.
  */
  this.name_key = this.name_key ? this.name_key : this.type ? this.type+"_name" : "";

  /**
  * The model's "parent" model, if any.
  *
  * @type       {anyModel}
  * @default    null
  */
  this.parent = null;

  /**
  * If this model is linked to an item in the parent model, `link_id` can
  * be used to address the data as: `this.parent.data[this.link_id]`.
  *
  * @type       {String}
  * @default    null
  */
  this.link_id = null;

  /**
  * If this model is linked to an item in the parent model, `link_type` is
  * the type of the parent data.
  *
  * @type       {String}
  * @default    null
  */
  this.link_type = null;

  /**
  * The model's source, e.g. `"local"` or `remote"`.
  *
  * @type       {String}
  * @default    gSource (global var. defined in anyDefs.js)
  */
  this.source = typeof gSource !== 'undefined' ? gSource : "local";

  /**
  * The database connection.
  * Only valid when `source` is "local", in which case a client side AlaSQL database will be used.
  *
  * @type       {String}
  * @default    null
  */
  this.db_connection = null;

  /**
  * The database name.
  * Only valid when `source` is "local", in which case a client side AlaSQL database will be used.
  *
  * @type       {String}
  * @default    null
  */
  this.db_name = null;

  /**
  * The database version.
  * Only valid when `source` is "local", in which case a client side AlaSQL database will be used.
  *
  * @type       {String}
  * @default    null
  */
  this.db_version = null;

  /**
  * The table factory class.
  * Only valid when `source` is "local", in which case a client side AlaSQL database will be used.
  *
  * @type       {String}
  * @default    null
  */
  this.table_factory = null;

  /**
  * An array of strings to be sent to the server, indicating which columns of the table should be
  * used in in a search or update/insert. These fields are only applied if the server fails to find
  * a filter corresponding to `type`.
  *
  * @type       {Array}
  * @default    null
  */
  this.table_fields = null;

  /**
  * Whether to call the search method while initializing the class, or while searching on the
  * server.
  *
  * @type       {boolean}
  * @default    false
  */
  this.db_search = false;

  /**
  * The string to search for when db_search == true.
  *
  * @type       {String}
  * @default    ""
  */
  this.db_search_term = "";

  /**
  * The last string that was searched for.
  *
  * @type       {String}
  * @default    ""
  */
  this.db_last_term = "";

  /**
  * Number of seconds to wait for database reply before timing out.
  *
  * @type       {integer}
  * @default    10
  */
  this.db_timeout_sec = 10;

  /**
  * If auto_callback is true, cbExecute will be called after calling
  * dataInsert, dataUpdate and dataDelete.
  *
  * @type       {boolean}
  * @default    false
  */
  this.auto_callback = false;

  /**
  * If auto_refresh is true, cbExecute will be called after calling dbSearch, dbUpdate,
  * dbUpdateLinkList, dbUpdateLink and dbDelete.
  *
  * @type       {boolean}
  * @default    true
  */
  this.auto_refresh = true;

  /**
  * If auto_search is true, the model will be automatically initialized with the data returned by
  * dbSearch, and cbExecute will be called.
  *
  * @type       {boolean}
  * @default    true
  */
  this.auto_search = true;

  /**
  * Permission related info (normally obtained from server).
  *
  * @type       {Object}
  * @default    {
  *       current_user_id: null,
  *       is_logged_in:    true,
  *       is_admin:        false,
  *     }
  */
  this.permission = {
    current_user_id: null,  // Id the current user is logged in with
    is_logged_in:    true,  // Whether we are logged in or not
    is_admin:        false, // Whether the current user has admin privelegies
  };

  /**
  * Info messages.
  *
  * @type       {String}
  * @default    ""
  */
  this.message = "";

  /**
  * Error messages.
  *
  * @type       {String}
  * @default    ""
  */
  this.error = "";

  /**
  * Error messages received from server.
  *
  * @type       {String}
  * @default    ""
  */
  this.error_server = "";

  // Initialise
  this._dataInitDefault();
  this.dataInit(options);

  // If `this.source` is "local", we will need a connection to the local database and a table factory.
  // If not specified in options, create one.
  if (this.source == "local") {
    if (!this.db_connection && typeof dbConnection !== 'undefined') {
      if (!options.db_name)
        console.warn("anyModel: Local database name missing. "); // TODO! i18n
      if (!options.db_version)
        console.warn("anyModel: Local database version missing. "); // TODO! i18n
      if (options.db_name && options.db_version) {
        let params = {
          dbtype:    "INDEXEDDB", // "LOCALSTORAGE"
          dbname:    options.db_name,
          dbversion: options.db_version,
          onSuccess: async function() {
            console.log("anyModel: Local database "+options.db_name+" ready"); // TODO! i18n
          },
          onFail: function(err) {
            console.error("anyModel: Could not create connection: "+err); // TODO! i18n
            return false;
          },
        };
        this.db_connection = new dbConnection(params);
        if (this.db_connection.error)
          console.error(this.db_connection.error);
      }
    } // if !db_connection
    if (this.db_connection && !this.db_connection.error) {
      if (!this.table_factory)
        if (options.table_factory)
          this.table_factory = options.table_factory;
        else
          this.table_factory = new anyTableFactory(this.db_connection);
    }
  }

  // Show warnings about crucial elements missing
  if (options && !this.type)
    console.warn("anyModel: "+i18n.error.TYPE_MISSING);
  if (options && !this.id_key)
    console.warn("anyModel: "+i18n.error.ID_KEY_MISSING);
  if (options && !this.name_key)
    console.warn("anyModel: "+i18n.error.NAME_KEY_MISSING);

  // Show other warnings and errors (from server, etc.)
  if (this.message !== "")
    console.warn("anyModel: "+this.message);
  if (this.error !== "")
    console.error("anyModel: "+this.error);
  if (this.error_server !== "")
    console.error("anyModel: "+this.error_server);

  // Search
  if (options && options.db_search)
    this.dbSearch(options);
}; // constructor

//
// _dataInitDefault: "Private" method.
// Does not initialize type, id_key or name_key.
//
anyModel.prototype._dataInitDefault = function ()
{
  this.data            = null;
  this.id              = null;
  this.parent          = null;
  this.link_id         = null;
  this.link_type       = null;
  this.source          = typeof gSource !== 'undefined' ? gSource : "local";
  this.db_connection   = null;
  this.table_factory   = null;
  this.table_fields    = null;
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
 * Initialize the model with the specified options or to default values.
 * Called by the constructor and the success method of `dbSearch`.
 *
 * @method anyModel.dataInit
 * @param {Object} options An object containing data with which to initialize the model.
 *                         If the encapsulation `options.JSON_CODE` has been set (by the server),
 *                         it will be removed from `options`. If `options == null`, default values
 *                         will be set.<br/>
 *                         The object may contain these elements:
 *
 * @param {Object}  options.data           Data. Will only be initialised if `dataInit` is called after a search.
 *                                         Optional.
 * @param {String}  options.type           Type, e.g. "user". Optional.
 * @param {String}  options.id             Item id, if the top level data represents an item, e.g. "42". Optional.
 * @param {String}  options.id_key         Id key, e.g. "user_id". Optional. Default: "[type]_id".
 * @param {String}  options.name_key       Name key, e.g. "user_name". Optional. Default: "[type]_name".
 * @param {String}  options.parent         The model's "parent" model, if any. Optional.
 * @param {String}  options.link_id        Links to to an item in the parent model (if any). Optional.
 * @param {String}  options.source         "local" or "remote". Optional.
 * @param {Object}  options.db_connection  The database connection. Only valid when `source` is "local". Optional.
 * @param {Object}  options.table_factory  The table factory class. Only valid when `source` is "local". Optional.
 * @param {Array}   options.table_fields   An array of strings to be sent to the server, indicating which columns
 *                                         of the table should be used in a search or update/insert. Optional.
 * @param {boolean} options.db_search      Whether to call the search method. Optional.
 * @param {String}  options.db_search_term The string to search for. Optional.
 * @param {String}  options.db_last_term   The string to search for. Optional.
 * @param {String}  options.db_timeout_sec Optional.
 * @param {boolean} options.auto_search    Whether to initiated model with the result of a search, and call
 *                                         cbExecute. Optional.
 * @param {boolean} options.auto_callback  Whether to call cbExecute after calling dataInsert, dataUpdate and
 *                                         dataDelete. Optional.
 * @param {boolean} options.auto_refresh   Whether to call cbExecute after calling dbSearch, dbUpdate,
 *                                         dbUpdateLinkList, dbUpdateLink and dbDelete. Optional.
 * @param {Object}  options.permission     Permissions. Optional.
 * @param {String}  options.message        Messages. Optional.
 * @param {String}  options.error          Errors. Optional.
 * @param {String}  options.error_server   Errors from server. Optional.
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
    if (options.parent)                                { this.parent         = options.parent; }
    if (options.link_id)                               { this.link_id        = options.link_id; }
    if (options.link_type)                             { this.link_type      = options.link_type; }
    if (options.source)                                { this.source         = options.source; }
    if (options.db_connection)                         { this.db_connection  = options.db_connection; }
    if (options.table_factory)                         { this.table_factory  = options.table_factory; }
    if (options.table_fields)                          { this.table_fields   = options.table_fields; }
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
      if (this.source == "remote") {
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
 * Add a method to the list of methods to be called by cbExecute.
 *
 * @method anyModel.cbSubscribe
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
 * Remove a method from the list of methods to be called by cbExecute.
 *
 * @method anyModel.cbUnsubscribe
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
 * Empty the list of methods to be called by cbExecute.
 *
 * @method anyModel.cbReset
 * @example
 *      mymodel.cbReset();
 */
anyModel.prototype.cbReset = function ()
{
  this._listeners = [];
}; // cbReset

/**
 * Call all callback methods registered with `cbSubscribe`.
 * This method is called by the default success/fail methods if `auto_callback == true`.
 *
 * @method anyModel.cbExecute
 * @example
 *      mymodel.cbExecute();
 */
anyModel.prototype.cbExecute = function (params)
{
  if (this._listeners) {
    for (let i=0; i<this._listeners.length; ++i) {
      let cb_function = this._listeners[i][0];
      let cb_context  = this._listeners[i][1];
      let cb_params   = this._listeners[i][2];
      if (cb_function) {
        //console.log(cb_function);
        //console.log(cb_context);
        if (params)
          cb_params = params; // Incoming params override params in _listeners array
        cb_function.call(cb_context,this,cb_params);
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
  if (this.source == "remote")
    return any_defs.dataScript;
  return "";
}; // _getDataSourceName

/**
 * Search for item of type `type` and id `id` in `data`.  If the type/id combination exists
 * several places in the data tree, only the first occurence found is returned.
 *
 * @method anyModel.dataSearch
 * @param {Object} options An object which may contain these elements:
 *
 * @param {Object}  options.data   The data structure to search in.
 *                                 Optional. Default: The model's data (`this.data`).
 * @param {String}  options.type   The type of the data to search for.
 *                                 Optional. Default: The model's type (`this.type`).
 * @param {integer} options.id     The id to search for.
 *                                 Optional. Default: null.
 * @param {boolean} options.parent If true, search for parent of the item with the specified id.
 *                                 Optional. Default: Same as `type`.
 *
 * @return If id is specified and parent is false: A pointer to the item found, or null if not found or on error.
 *         If id is specified and parent is true: A pointer to the parent of the item found, or null if not found or on error.
 *         If id is not specified: The first list of items of the specified type found, or null if none found or on error.
 *
 * @example
 *      mymodel.dataSearch({type:"user",id:"38"});
*/
// TODO! Not tested with non-numerical indexes
anyModel.prototype.dataSearch = function (options,
                                          _prev_type,_parent_data,_parent_id)
{
  if (!options || typeof options != "object") {
    console.error("anyModel.dataSearch: "+i18n.error.OPTIONS_MISSING);
    return null;
  }
  let data = options.data                   ? options.data : this.data;
  let type = options.type                   ? options.type : this.type;
  let id   = options.id || options.id === 0 ? options.id   : null;
  if (!_prev_type)
    _prev_type = this.type;

  if (!data)
    return null; // Not found
  if (!type) {
    console.error("anyModel.dataSearch: "+i18n.error.TYPE_MISSING);
    return null;
  }
  if (!id && id !== 0 && !type) {
    console.error("anyModel.dataSearch: "+i18n.error.ID_TYPE_MISSING+" ("+id+","+type+") ");
    return null;
  }

  // See if item is found at top level
  if (isInt(id) && data[this.id_key] == id ||
      parseInt(id) != NaN && parseInt(data[this.id_key]) != NaN && parseInt(id) == parseInt(data[this.id_key]))
    return data;

  let name_key = type == this.type
                 ? this.name_key
                   ? this.name_key
                   : type+"_name"
                 : type+"_name";
  let data_ptr = data[id]
                 ? data[id]
                 : data[""+id]
                   ? data[""+id]
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
    if (_parent_data && _parent_data[_parent_id]) {
      _parent_data[_parent_id].id = _parent_id; // Hack
      return _parent_data[_parent_id];
    }
    if (data[id] && data[id].data && data[id].data[id])
      return data[id].data; // TODO! Not very elegant
    return data;
  }
  let itemlist = {};
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
            item = data; // Note! Ignoring options.parent in this case
          }
        }
        else {
          // type search
          if (!data[idc].head) {
            if (!options.parent)
              itemlist[idc] = data[idc];
            else {
              itemlist = data;
              break;
            }
          }
          else // head
          if (options.parent) {
            itemlist[idc] = data[idc];
            break;
          }
        }
      }
      if (!item && data[idc].data) { // subdata
        let p_data = options.parent ? data : null;
        let p_idc  = options.parent ? idc  : null;
        let data_ptr = data[idc]
                       ? data[idc]
                       : data[""+idc]
                         ? data[""+idc]
                         : data["+"+idc]
                           ? data["+"+idc]
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
        item = this.dataSearch({ data:data[idc].data,id:id,type:type,parent:options.parent },
                                _prev_type,p_data,p_idc);
        if (item && item.data && !options.parent)
          item = item.data;
      }
      if (item && Object.size(itemlist) < 1)
        return item; // Found id
    }
  } // for
  if (Object.size(itemlist) > 0) // Found type list
    if (options.parent)
      return itemlist[Object.keys(itemlist)[0]];
    else
      return itemlist;
  return null; // Not found
}; // dataSearch

/**
 * Set `this.max` to the largest id for the specified type in the in-memory data structure
 * and returns the next id (i.e. `this.max + 1`). If any of the indexes are non-numerical,
 * the number of items in the data structure minus 1 will be returned.
 *
 * @method anyModel.dataSearchNextId
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
 * Set `this.max` to the largest id for the specified type in the in-memory data structure
 * and returns this.max. If any of the indexes are non-numerical, the number of items in the
 * data structure minus 1 will be returned.
 *
 * @method anyModel.dataSearchMaxId
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
  if (!data || Object.size(data) === 0) {
    this.max = 0;
    return 0;
  }
  if (!type)
    type = this.type;
  if (!type)
    return -1;
  // If any non-numerical index is found, return immediately
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
      dtype = type;
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
 * Insert `new_data` into the data structure at a place specified by `type`, `id`
 * and optionally `new_id`. If the type/id combination exists several places in
 * the data structure, only the first place found is used. Data that exist at the
 * insertion point will be overwritten.
 *
 * @method anyModel.dataInsert
 * @param {Object} options An object which may contain these elements:
 *
 * @param {Object}  options.data     The data structure to insert into.
 *                                   Optional. Default: The model's data (`this.data`).
 * @param {String}  options.type     The type of the item where the new data should be inserted (i.e. the type of
 *                                   the item with id `id`.)
 *                                   Optional. Default: The model's type (`this.type`).
 * @param {integer} options.id       The id of the item in `data` where `new_data` should be inserted.
 *                                   The data will be inserted like this:<br/>
 *                                   1) If id is not specified:<br/>
 *                                      - If `new_id` is not specified: `data = new_data`<br/>
 *                                      - If `new_id` is specified:     `data[new_id].data = new_data`<br/>
 *                                   2) If id is specified and an item found in the data structure:<br/>
 *                                      - If `new_id` is not specified: `item[id].data = new_data`<br/>
 *                                      - If `new_id` is specified:     `item[id].data[new_id].data = new_data`<br/>
 *                                   3) If id is specified but not found in the data structure, it is an error.<br/>
 *                                   Optional. Default: undefined.
 * @param {Object}  options.new_data The data item to insert into the data structure.
 *                                   Must be on a format that can be recognized by the model.
 *                                   See <a href="../modules/anyVista.html">`anyVista`</a> for more information.
 *                                   Mandatory.
 * @param {integer} options.new_id   Indicates a new id that will be used when inserting the new data.<br/>
 *                                   1) If `new_id` is not specified:<br/>
 *                                      - If `id` is not specified: `data = new_data`.<br/>
 *                                      - If `id` is specified:     `data[id].data = new_data`.<br/>
 *                                   2) If `new_id` is specified and >= 0 and an item is found in the data structure:<br/>
 *                                      - If `id` is not specified: `item[new_id].data = new_data`.<br/>
 *                                      - If `id` is specified:     `item[id].data[new_id] = new_data`.<br/>
 *                                   3) If `new_id` is < 0, it will be created by `dataSearchNextId` and the
 *                                      data will be inserted as in case 2) above.<br/>
 *                                   Optional. Default: undefined.
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
    console.warn("anyModel.dataInsert: "+errstr);
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
    if (!new_id && new_id !== 0) {
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
 * Insert a header at the top of the data structure
 *
 * @method anyModel.dataInsertHeader
 * @param {Object} options An object which may contain these elements:
 *
 * @param {Object} options.data   The data structue to use. Optional. Default: `this.data`.
 * @param {String} options.type   The type of the data "below" the header. Optional. Default: `this.type`.
 * @param {String} options.header The header string. Mandatory.
 *
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
  let name_key = this.name_key
                 ? this.name_key
                 : the_type+"_name";
  let top_data = {
      head:       the_type,
      [name_key]: the_header,
      data:       the_data,
  };
  return this.dataInsert({ data: the_data, new_data: top_data, new_id: "0" });
}; // dataInsertHeader

/**
 * Update data structure at a place specified by `type` and `id` with data in `new_data`.
 * If the type/id combination exists several places in the data structure, only the first
 * place found is used. Data that exist at the insertion point will be overwritten.
 *
 * @method anyModel.dataUpdate
 * @param {Object} options An object which may contain these elements:
 *
 * @param {Object}  options.data     The data structure to update.
 *                                   Optional. Default: The model's data (`this.data`).
 * @param {String}  options.type     The type of the item in `data` with id `id`.
 *                                   Optional. Default: The model's type (`this.type`).
 * @param {integer} options.id       The id of the item in `data` to update with values from `new_data`.
 *                                   If id is not found in the data structure, it is an error.
 *                                   Mandatory.
 * @param {Object}  options.new_data The data item to update the data structure with.
 *                                   Must be on the format `new_data[filter_id]` where `filter_id` are the
 *                                   values containing new values.
 *                                   For example:
 *                                   <code>
 *                                     new_data = {
 *                                       user_name:        "Johhny B. Goode",
 *                                       user_description: "Musician",
 *                                     }
 *                                   </code>
 *                                   If an item with the specified `id` is found in the structure `data`, it
 *                                   will be updated with the values for `user_name` and `user_description`.
 *                                   If an item is not found it is an error.
 *                                   Mandatory.
 *
 * @return A pointer to the place where the data was updated on success, or null on error.
 *
 * @example
 *      mymodel.dataUpdate({new_data:{user_name:"Foz Baz"},id:"38",type:"user"});
 */
// TODO! Not tested well enough with non-numerical indexes
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
    console.warn("anyModel.dataUpdate: "+i18n.error.NOTHING_TO_UPDATE);
    return null;
  }
  let item = this.dataSearch({data:the_data,id:the_id,type:the_type});
  if (!item || (!item[the_id] && !item[""+the_id] && !item["+"+the_id])) {
    let errstr = i18n.error.ITEM_NOT_FOUND.replace("%%",""+the_type);
    errstr = errstr.replace("&&",""+the_id);
    console.warn("anyModel.dataUpdate: "+errstr);
    return null;
  }
  if (!item[the_id].dirty)
    item[the_id].dirty = {};
  for (let filter_id in new_data) {
    if (new_data.hasOwnProperty(filter_id)) {
      // Only update data that have changed
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
 * Add and/or remove items to/from a link (association) list. This can be used to link/unlink an
 * item to/from another item in the data structure (e.g., add/remove a user to/from an event).
 * For example a user may be associated with several events.
 *
 * @method anyModel.dataUpdateLinkList
 * @param {Object} options An object which may contain these elements:
 *
 * @param {Object}  options.data      The data structure to update.
 *                                    Optional. Default: The model's data (`this.data`).
 * @param {String}  options.type      The type of the item to which the list is linked to (e.g. "user").
 *                                    Optional. Default: `this.type`.
 * @param {integer} options.id        The id of the item to which the list is linked to (e.g. the user id "23").
 *                                    Optional. Default: `this.id`.
 * @param {String}  options.link_type If `link_id` is specified, the type of an item in the data structure with
 *                                    id `link_id`.
 *                                    If `link_id` is not specified, the type of the items in the `select` and
 *                                    the `unselect` arrays.
 *                                    Mandatory.
 * @param {String}  options.link_id   The id of an item to unlink from item with id `id`.
 *                                    If specified, the link will be removed and no other action will be taken
 *                                    (the `select` and `unselect` arrays will be ignored).
 *                                    If not given, links will be added and/or removed as per the `select`
 *                                    and `unselect` arrays.
 *                                    Optional. Default: undefined.
 * @param {Object}  options.unselect  A list of ids to unlink from item with id `id` (if `link_id` is not given).
 *                                    This will be done *before* the ids in `select` are added.
 *                                    Optional. Default: undefined.
 * @param {Object}  options.select    A list of ids to link to item with id `id`(if `link_id` is not given).
 *                                    This will be done *after* the ids in `unselect` has been removed.
 *                                    If the link already exists, the link's data will be update with the data
 *                                    in `new_data`, if specified.
 *                                    Optional. Default: undefined.
 * @param {Object}  options.new_data  An object containing data to update the data structure with when the
 *                                    `select` list is specified and `link_id` is not specified. If `new_data`
 *                                    is not specified, the data to link is assumed to be found in the `data`
 *                                    data structure. If not found, it is an error.
 *                                    Optional. Default: null, and `data` will be searched for the items with
 *                                    ids specified in `select`.
 * @param {String}  options.name_key
 *
 * @return true on success, false on error.
 *
 * @example
 *      Coming soon
 */
anyModel.prototype.dataUpdateLinkList = function (options)
{
  if (!options || typeof options != "object") {
    console.error("anyModel.dataUpdateLinkList: "+i18n.error.OPTIONS_MISSING);
    return false;
  }
  let the_data      = options.data     ? options.data     : this.data;
  let the_type      = options.type     ? options.type     : this.type;
  let the_id        = options.id       ? options.id       : this.id;
  let the_link_type = options.link_type;
  let the_link_id   = options.link_id;
  let the_new_data  = options.new_data;

  if (!the_data)
    return false;
  if (!the_link_type) {
    console.error("anyModel.dataUpdateLinkList: "+i18n.error.LINK_TYPE_MISSING);
    return false;
  }
  if (the_link_id) {
    // Remove the link data and return
    this.dataDelete({ data: the_data,
                      id:   the_link_id,
                      type: the_link_type,
                   });
    return true;
  } // if

  if (options.unselect && options.unselect.size) {
    // Remove links in `unselect`
    for (let rem_id of options.unselect) {
      // Remove (delete) the link data with id 'id'
      if (!this.dataDelete({ data: the_data,
                             id:   rem_id,
                             type: the_link_type,
                          }))
        console.warn("Could not remove "+the_link_type+" item with id "+rem_id+" (not found in data). "); // TODO! i18n
    } // for
    if (the_data && the_type && the_data["link-"+the_type] && (!the_data["link-"+the_type].data || !Object.size(the_data["link-"+the_type].data)))
      delete the_data["link-"+the_type];
  } // if

  // Insert or update link in `select`
  if (options.select && options.select.size && the_id && the_type) {
    for (let sel_id of options.select) {
      // Only insert item if it is not already in model
      if (!this.dataSearch({ data: the_data,
                             id:   sel_id,
                             type: the_link_type,
                          })) {
        // See if we really got an item with id 'sel_id' in the new data
        let item = this.dataSearch({ data: the_new_data,
                                     id:   sel_id,
                                     type: the_link_type,
                                  });
        if (item) {
          // Find insertion point
          let the_ins_data = this.dataSearch({ data: the_data,
                                               id:   the_id,
                                               type: the_type,
                                            });
          if (the_ins_data) {
            if (!the_ins_data[the_id].data)
              the_ins_data[the_id].data = {};
            the_ins_data = the_ins_data[the_id].data;
            let ins_id = "link-"+the_link_type; // See if we have "link-" index (created by server)
            if (!the_ins_data[ins_id])
              the_ins_data[ins_id] = {};
            the_ins_data[ins_id].data = item;
          }
        }
        else
          console.warn("Could not add "+the_link_type+" item with id "+sel_id+" (not found in data). "); // TODO! i18n
      } // if
      else {
        // Link item exists, update it with data in `the_new_data`
        // TODO! Not implemented
      }
    } // for
  } // if
  return true;
}; // dataUpdateLinkList

anyModel.prototype.dataUpdateLink = function (options)
{
  // TODO! Not implemented.
}; // dataUpdateLink

/**
 * Deletes an item with a specified id from the data structure.
 *
 * @method anyModel.dataDelete
 * @param {Object} options An object which may contain these elements:
 *
 * @param {Object}  options.data  The data structure to delete from.
 *                                Optional. Default: The model's data structure (`this.data`).
 * @param {String}  options.type  The type of the item to delete.
 *                                Optional. Default: The model's type (`this.type`).
 * @param {integer} options.id    The id of the item to delete.
 *                                Mandatory.
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
 * Create a database table on server.
 * Experimental - only partially implemented.
 *
 * @method anyModel.dbCreate
 * @param {Object} options An object which may contain these elements:
 *
 * @param {string}   options.type       The table type, this will be the basis for the table name.
 *                                      Optional. Default: `this.type`.
 * @param {Object}   options.table      The fields of the table.
 *                                      Optional. If not specified, only the id and name fields will be created.
 * @param {integer}  options.timeoutSec Number of seconds before timing out.
 *                                      Optional. Default: 10.
 * @param {Function} options.onSuccess  Method to call on success.
 *                                      Optional. Default: `this.dbCreateSuccess`.
 * @param {Function} options.onFail     Method to call on error or timeout.
 *                                      Optional. Default: `this._dbFail`.
 * @param {Function} options.context    The context of the success and fail methods.
 *                                      Optional. Default: `this`.
 *
 * @return true if the database call was made
 */
anyModel.prototype.dbCreate = function (options)
{
  let type = options.type ? options.type : this.type;

  let db_timeout_sec = options.timeoutSec ? options.timeoutSec : this.db_timeout_sec;
  $.ajaxSetup({ timeout: db_timeout_sec*1000 });
  this.success = options.onSuccess ? options.onSuccess : this.dbCreateSuccess;
  this.fail    = options.onFail    ? options.onFail    : this._dbFail;
  this.context = options.context   ? options.context   : this;
  this.message      = "";
  this.error        = "";
  this.error_server = "";
  let self = this;
  if (this.source == "remote") { // Remote server call (MySQL server)
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
  else { // Local method call (AlaSQL server)
    this._dbCreateLocal(options);
    return this.error == "";
  }
}; // dbCreate

// Internal method, do not call directly.
anyModel.prototype._dbCreateLocal = async function (options)
{
  if (this.table_factory) {
    let the_type   = options && options.type      ? options.type      : this.type;
    let table_name = options && options.tableName ? options.tableName : the_type+"Table";
    let table = await this.table_factory.createClass(table_name,{type:the_type,header:true,path:options.path});
    if (table && table.error == "") {
      let self = this;
      return await table.dbCreate(options)
      .then( function(serverdata) {
        if (self.success)
          return self.success(self.context,serverdata,options);
        self.message = i18n.error.SUCCCESS_CB_MISSING;
        console.warn("anyModel._dbCreateLocal: "+self.message);
        return false;
      });
    } // if table
    else {
      if (table && table.error != "") {
        this.error = table.error;
        console.log(this.error);
      }
      console.warn("anyModel._dbCreateLocal: "+"Could not create table "+table_name+". "); // TODO! i18n
    }
  } // if table_factory
  else
    console.warn("anyModel._dbCreateLocal: "+"No table factory. "); // TODO! i18n
  if (this.success)
    return this.success(this,this,options);
  this.message = i18n.error.SUCCCESS_CB_MISSING;
  console.warn("anyModel._dbCreateLocal: "+this.message);
  return false;
}; // _dbCreateLocal

/**
 * Default success callback method for dbSearch.
 *
 * @method anyModel.dbCreateSuccess
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
  if (serverdata && typeof serverdata === "object") {
    if (serverdata.JSON_CODE) // Remove encapsulation, if it exists
      serverdata = serverdata.JSON_CODE;
    if (Object.size(serverdata.data) === 0)
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
 * Gets an item or a list from server.
 * The data will be handed to the success handler specified in options.success,
 * or to this.dbSearchSuccess if no success handler is specified.
 *
 * @method anyModel.dbSearch
 * @param {Object} options An object which may contain these elements:
 *
 * @param {string}   options.type       Item's type.
 *                                      Optional. Default: `this.type`.
 * @param {integer}  options.id         Item's id. If specified, the database will be searched for this item.
 *                                      If not specified, a list of items of the specified type will be searched for.
 *                                      Optional. Default: null.
 * @param {string}   options.link_type
 *                                      Optional. Default: null.
 * @param {integer}  options.link_id
 *                                      Optional. Default: null.
 * @param {integer}  options.group_id   If specified, search only in group with this id.
 *                                      Optional. Default: undefined.
 * @param {boolean}  options.grouping   If specified, tells the server to group the data before returning.
 *                                      If false, 0, null or undefined, data will not be grouped. Any other
 *                                      value will specify grouping.
 *                                      Optional. Default: undefined.
 * @param {boolean}  options.simple     If true, only values for _id and _name (e.g. "user_id" and "user_name")
 *                                      will be returned from the server.
 *                                      Optional. Default: undefined.
 * @param {boolean}  options.header     A parameter sent to the server to indicate whether a header should be
 *                                      auto-generated.
 *                                      Optional. Default: undefined.
 * @param {integer}  options.from       The first element to display. Used in pagination.
 *                                      Optional. Default: 0.
 * @param {integer}  options.num        The number of elements to display. Used in pagination.
 *                                      Optional. Default: 20.
 * @param {string}   options.order      Tell the server how to order the results.
 *                                      Optional. Default: undefined (server decides).
 * @param {string}   options.direction  Sort in ascending or descending direction.
 *                                      Optional. Default: undefined (server decides).
 * @param {string}   options.db_search_term A string to search for.
 *                                          Optional. Default: undefined.
 * @param {Object}   options.table_fields   An array of strings to be sent to the server, indicating which columns
 *                                          of the table should be used in the search. These fields are only
 *                                          applied if the server fails to find a filter corresponding to `type`.
 *                                          Optional. Default: undefined.
 * @param {integer}  options.timeoutSec Number of seconds before timing out.
 *                                      Optional. Default: 10.
 * @param {Function} options.onSuccess  Method to call on success.
 *                                      Optional. Default: `this.dbSearchSuccess`.
 * @param {Function} options.onFail     Method to call on error or timeout.
 *                                      Optional. Default: `this._dbFail`.
 * @param {Function} options.context    The context of the success and fail methods.
 *                                      Optional. Default: `this`.
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
  this.success       = options.onSuccess  ? options.onSuccess  : this.dbSearchSuccess;
  this.fail          = options.onFail     ? options.onFail     : this._dbFail;
  this.context       = options.context    ? options.context    : this;
  this.message       = "";
  this.error         = "";
  this.error_server  = "";
  let self = this;
  if (this.source == "remote") { // Remote server call
    $.ajaxSetup({ timeout: db_timeout_sec*1000 });
    if (options.sync)
      $.ajaxSetup({ async: false });
    let url = this.dbSearchGetURL(options);
    if (!url)
      return false;
    let item_to_send = {};
    if (options.table_fields)
      item_to_send.tableFields = options.table_fields;
    else
    if (this.table_fields)
      item_to_send.tableFields = this.table_fields;
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
  else { // Local method call (AlaSQL server)
    return this._dbSearchLocal(options);
  }
}; // dbSearch

// Internal method, do not call directly.
anyModel.prototype._dbSearchLocal = async function (options)
{
  if (this.table_factory) {
    let the_type   = options && options.type      ? options.type      : this.type;
    let table_name = options && options.tableName ? options.tableName : the_type+"Table";
    let table = await this.table_factory.createClass(table_name,{type:the_type,header:true,path:options.path});
    if (table && table.error == "") {
      let self = this;
      return await table.dbSearch(options)
      .then( function(serverdata) {
        self.error   = table.error;
        self.message = table.message;
        if (self.success)
          return self.success(self.context,serverdata,options);
        self.error = i18n.error.SUCCCESS_CB_MISSING;
        console.warn("anyModel._dbSearchLocal: "+self.message);
        return Promise.resolve(false);
      });
    } // if table
    else {
      if (table && table.error != "") {
        this.error = table.error;
        console.log(this.error);
      }
      console.warn("anyModel._dbSearchLocal: "+"Search in "+table_name+" failed. "); // TODO! i18n
    }
  } // if table_factory
  else
    console.warn("anyModel._dbSearchLocal: "+"No table factory. "); // TODO! i18n
  if (this.success)
    return this.success(this,this,options);
  this.error = i18n.error.SUCCCESS_CB_MISSING;
  console.warn("anyModel._dbSearchLocal: "+this.message);
  return Promise.resolve(false);
}; // _dbSearchLocal

/**
 * Builds a POST string for dbSearch to be sent to server.
 *
 * @method anyModel.dbSearchGetURL
 * @param {Object} options An object which may contain these elements:
 *
 * @param {integer} options.type
 * @param {integer} options.id
 * @param {integer} options.link_type
 * @param {integer} options.link_id
 * @param {integer} options.group_id
 * @param {string}  options.grouping
 * @param {boolean} options.simple
 * @param {string}  options.header
 * @param {integer} options.from
 * @param {integer} options.num
 * @param {string}  options.order
 * @param {string}  options.direction
 * @param {string}  options.db_search_term
 *
 * @return The complete URL for dbSearch or null on error (missing type or id_key).
 */
anyModel.prototype.dbSearchGetURL = function (options)
{
  let the_type   = options.type                              ? options.type   : this.type;
  let the_id_key = options.type && options.type != this.type ? the_type+"_id" : this.id_key;
  if (!the_type) {
    console.error("anyModel.dbSearchGetURL: "+i18n.error.TYPE_MISSING);
    return null;
  }
  if (!the_id_key) {
    console.error("anyModel.dbSearchGetURL: "+i18n.error.ID_KEY_MISSING);
    return null;
  }
  let the_id = Number.isInteger(parseInt(options.id)) && options.id >= 0
               ? parseInt(options.id)
               : options.id
                 ? options.id
                 : null;
  let the_gid = Number.isInteger(parseInt(options.group_id)) && options.group_id >= 0
                ? parseInt(options.group_id)
                : options.group_id
                  ? options.group_id
                  : null;
  let param_str = "?echo=y";
  param_str += "&type="+the_type;
  param_str += the_id                                   ? "&"+the_id_key+"="+the_id : ""; // Item search if id is given, list search otherwise
  param_str += the_gid                                  ? "&group_id="      +the_gid : ""; // If group_id is given, search a specific group
  param_str += the_type == "group" && options.link_type ? "&group_type="    +options.link_type : "";
  param_str += options.grouping                         ? "&grouping="      +options.grouping : "";
  param_str += options.simple                           ? "&simple="        +options.simple : "";
  param_str += options.header === true  ||
               options.header === false ||
               typeof options.header == "string"        ? "&header="        +options.header : "";
  param_str += options.from || options.from === 0       ? "&from="          +options.from : "";
  param_str += options.num                              ? "&num="           +options.num : "";
  param_str += options.order                            ? "&order="         +options.order : "";
  param_str += options.direction                        ? "&dir="           +options.direction : "";
  param_str += options.db_search_term                   ? "&term="          +options.db_search_term : "";
  if (options.db_search_term)
    this.db_last_term = options.db_search_term;
  return this._getDataSourceName() + param_str;
}; // dbSearchGetURL

/**
 * Default success callback method for dbSearch.
 *
 * @method anyModel.dbSearchSuccess
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

  if (serverdata && typeof serverdata === "object") {
    if (serverdata.JSON_CODE)
      serverdata = serverdata.JSON_CODE;
    if (options.id == "max") {
      serverdata.is_new = options.is_new;
      self.max     = parseInt(serverdata.id);
    }
    if (Object.size(serverdata.data) === 0)
      serverdata.data = null;
    self.message = serverdata.message;
    if (serverdata.error) {
      self.error_server = serverdata.error;
      self.error        = i18n.error.SERVER_ERROR;
    }
    if (!serverdata.data) {
      if (serverdata.id || serverdata.id === 0)
        self.message = self.type.capitalize()+" "+i18n.message.notFound;
      else
        self.message = "No "+self.type+"s found. "; // TODO! i18n
    }
    if (self.message)
      console.warn("anyModel.dbSearchSuccess: "+self.message);
    if (self.error_server)
      console.error("anyModel.dbSearchSuccess: "+self.error_server);
    if (self.auto_search && self.dataInit) {
      if (options.id || options.id === 0)
        self.id = options.id;
      self.dataInit(serverdata);
    }
  }
  if (self.cbExecute && self.auto_search && self.auto_refresh && options.auto_refresh !== false) {
    let clr = options && options.clear === false ? false : true;
    self.cbExecute({clear:clr});
  }
  return context;
}; // dbSearchSuccess

/**
 * Gets the next available id for the specified type from server.
 * The data will be handed to the success handler specified in options.success,
 * or to this.dbSearchNextIdSuccess if no success handler is specified.
 *
 * @method anyModel.dbSearchNextId
 * @param {Object} options An object which may contain these elements:
 *
 * @param {integer}  options.type       Item's type.
 *                                      Optional. Default: `this.type`.
 * @param {Array}    options.table_fields
 *
 * @param {integer}  options.timeoutSec Number of seconds before timing out.
 *                                      Optional. Default: 10.
 * @param {Function} options.onSuccess  Method to call on success.
 *                                      Optional. Default: `this.dbSearchNextIdSuccess`.
 * @param {Function} options.onFail     Method to call on error or timeout.
 *                                      Optional. Default: `this._dbFail`.
 * @param {Function} options.context    The context of the success and fail methods.
 *                                      Optional. Default: `this`.
 *
 * @return true if the database call was made, false otherwise.
 */
anyModel.prototype.dbSearchNextId = function (options)
{
  if (!options || typeof options != "object")
    options = {};

  let db_timeout_sec = options.timeoutSec ? options.timeoutSec : this.db_timeout_sec;
  this.success = options.onSuccess ? options.onSuccess : this.dbSearchNextIdSuccess;
  this.fail    = options.onFail    ? options.onFail    : this._dbFail;
  this.context = options.context   ? options.context   : this;
  this.message      = "";
  this.error        = "";
  this.error_server = "";
  let self = this;
  if (this.source == "remote") { // Remote server call
    $.ajaxSetup({ timeout: db_timeout_sec*1000 });
    if (options.sync)
      $.ajaxSetup({ async: false });
    let url = this.dbSearchNextIdGetURL(options);
    if (!url)
      return false;
    let item_to_send = {};
    if (options.table_fields)
      item_to_send.tableFields = options.table_fields;
    else
    if (this.table_fields) // TODO! What is this?
      item_to_send.tableFields = this.table_fields;
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
  else { // Local method call (AlaSQL server)
    this._dbSearchNextIdLocal(options);
    return this.error == "";
  }
}; // dbSearchNextId

// Internal method, do not call directly.
anyModel.prototype._dbSearchNextIdLocal = async function (options)
{
  if (this.table_factory) {
    let the_type   = options && options.type      ? options.type      : this.type;
    let table_name = options && options.tableName ? options.tableName : the_type+"Table";
    let table = await this.table_factory.createClass(table_name,{type:the_type,header:true,path:options.path});
    if (table && table.error == "") {
      let self = this;
      return await table.dbSearchMaxId(options)
      .then( async function(serverdata) {
        self.max = serverdata.id + 1;
        if (self.success)
          return self.success(self.context,serverdata,options);
        self.message = i18n.error.SUCCCESS_CB_MISSING;
        console.warn("anyModel._dbSearchNextIdLocal: "+self.message);
        return false;
      });
    } // if table
    else {
      if (table && table.error != "") {
        this.error = table.error;
        console.log(this.error);
      }
      console.warn("anyModel._dbSearchNextIdLocal: "+"Could not find next id in "+table_name+". "); // TODO! i18n
    }
  } // if table_factory
  else
    console.warn("anyModel._dbSearchNextIdLocal: "+"No table factory. "); // TODO! i18n
  if (this.success)
    return this.success(this,this.data,options);
  this.message = i18n.error.SUCCCESS_CB_MISSING;
  console.warn("anyModel._dbSearchNextIdLocal: "+this.message);
  return false;
}; // _dbSearchLocal

/**
 * Builds a POST string for dbSearchNextId to be sent to server.
 *
 * @method anyModel.dbSearchNextIdGetURL
 * @param {Object} options An object which may contain these elements:
 *
 * @param {integer} options.type Item's type. If specified and not equal to `this.type`, then `[options.type]_id` will
 *                               be used as the id_key instead of the value in `this.id_key` when calling the server.
 *                               Optional. Default: `this.type`.
 *
 * @return The complete URL for dbSearchNextId or null on error (missing type or id_key).
 */
anyModel.prototype.dbSearchNextIdGetURL = function (options)
{
  let the_type   = options.type                              ? options.type   : this.type;
  let the_id_key = options.type && options.type != this.type ? the_type+"_id" : this.id_key;
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
 * Default success callback method for dbSearchNextId.
 *
 * @method anyModel.dbSearchNextIdSuccess
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
  if (serverdata && typeof serverdata === "object") {
    if (serverdata.JSON_CODE) // Remove encapsulation, if it exists
      serverdata = serverdata.JSON_CODE;
    self.message = serverdata.message;
    if (serverdata.error) {
      self.error_server = serverdata.error;
      self.error        = i18n.error.SERVER_ERROR;
    }
    if (self.message)
      console.log("anyModel.dbSearchNextIdSuccess: "+self.message);
    if (self.error_server)
      console.error("anyModel.dbSearchNextIdSuccess: "+self.error_server);
    self.max = parseInt(serverdata.id);
  }
  return context;
}; // dbSearchNextIdSuccess

/**
 * Insert or update an item in a database table.
 *
 * @method anyModel.dbUpdate
 * @param {Object} options An object which may contain these elements:
 *
 * @param {Object}   options.new_data     The data structure from which comes the data to insert/update. If null
 *                                        or not specified, data from `this.data` is used for the update. An item
 *                                        matching id/type, must exist in the data structure. If no such item can
 *                                        be found, it is an error.
 *                                        Optional. Default: `this.data`.
 * @param {integer}  options.type         Type of the datem to update.
 *                                        Optional. Default: `this.type`.
 * @param {integer}  options.id           The data item's id. If given, an existing item in the database will be
 *                                        updated. If not given, a new item will be inserted into the database.
 *                                        Mandatory if updating, undefined if inserting.
 * @param {boolean}  options.is_new       true if the item is new (does not exist in database) and should be inserted
 *                                        rather than updated. Note: If set, an insert operation will be performed
 *                                        even if `options.id` has a value.
 *                                        Optional. Default: false.
 * @param {Object}   options.table_fields An array of strings to be sent to the server, indicating which columns
 *                                        of the table should be used in the update/insert. These fields are only
 *                                        applied if the server fails to find a filter corresponding to `type`.
 *                                        Optional. Default: undefined.
 * @param {integer}  options.timeoutSec   Number of seconds before timing out.
 *                                        Optional. Default: 10.
 * @param {Function} options.onSuccess    Method to call on success.
 *                                        Optional. Default: `this.dbUpdateSuccess`.
 * @param {Function} options.onFail       Method to call on error or timeout.
 *                                        Optional. Default: `this._dbFail`.
 * @param {Function} options.context      The context of the success and fail methods.
 *                                        Optional. Default: `this`.
 *
 * @return true if the database call was made, false otherwise.
 */
anyModel.prototype.dbUpdate = function (options) // TODO! Should this be an async method?
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
    return null; // No new data
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
  if (!item || (!item[this.id_key] && !item[the_id] && !item["+"+the_id])) {
    let errstr = i18n.error.ITEM_NOT_FOUND.replace("%%",""+the_type);
    errstr = errstr.replace("&&",""+the_id);
    console.error("anyModel.dbUpdate: "+errstr);
    return false;
  }
  let it = item; // Return this
  if (!item[this.id_key]) {
    if (item[the_id])
      item = item[the_id];
     else
      item = item["+"+the_id];
  }
  if (!options.is_new && !item.is_new && !Object.size(item.dirty)) {
    this.message = i18n.error.NOTHING_TO_UPDATE;
    console.log("anyModel.dbUpdate: "+this.message);
    this.cbExecute();
    return false;
  }
  // Data to update or insert
  let item_to_send = item.is_new || options.is_new
                     ? item         // insert
                     : item.dirty
                       ? item.dirty // update
                       : {};
  // Data used in dbUpdateSuccess method
  options.client_id = the_id;   // Update this id in existing data structure with new id from server
  options.data      = new_data; // Clean up this data structure after server returns successfully

  let db_timeout_sec = options.timeoutSec ? options.timeoutSec : this.db_timeout_sec;
  this.success = options.onSuccess ? options.onSuccess : this.dbUpdateSuccess;
  this.fail    = options.onFail    ? options.onFail    : this._dbFail;
  this.context = options.context   ? options.context   : this;
  this.message      = "";
  this.error        = "";
  this.error_server = "";
  let self = this;
  if (this.source == "remote") { // Remote server call
    $.ajaxSetup({ timeout: db_timeout_sec*1000 });
    if (options.sync)
      $.ajaxSetup({ async: false });
    let url = this.dbUpdateGetURL(options);
    if (!url)
      return false;
    if (options.table_fields)
      item_to_send.tableFields = options.table_fields;
    else
    if (this.table_fields) // TODO! What is this?
      item_to_send.tableFields = this.table_fields;
    $.getJSON(url,item_to_send) // Call server
    .done(function(serverdata,textStatus,jqXHR) {
      return self.success ? self.success(self.context,serverdata,options) : false;
    })
    .fail(function(jqXHR,textStatus,error) {
      return self.fail    ? self.fail   (self,jqXHR) : false;
    });
    return true;
  }
  else { // Local method call (AlaSQL server)
    this._dbUpdateLocal(options,item_to_send); // TODO! Should we have await here?
    if (this.error)
      console.error(this.error);
    return this.error == "";
  }
}; // dbUpdate

// Internal method, do not call directly.
anyModel.prototype._dbUpdateLocal = async function (options,item_to_send)
{
  if (this.table_factory) {
    let the_type   = options && options.type      ? options.type      : this.type;
    let table_name = options && options.tableName ? options.tableName : the_type+"Table";
    let table = await this.table_factory.createClass(table_name,{type:the_type,header:true,path:options.path});
    if (table && table.error == "") {
      options.keys   = Object.keys  (item_to_send);
      options.values = Object.values(item_to_send);
      let self = this;
      await table.dbUpdate(options)
      .then( function(serverdata) {
        self.error   = table.error;
        self.message = table.message;
        if (self.success)
          return self.success(self.context,serverdata,options);
        self.message = i18n.error.SUCCCESS_CB_MISSING;
        console.warn("anyModel._dbUpdateLocal: "+self.message);
        return false;
      });
      return this.error == "";
    } // if table
    else {
      if (table && table.error != "") {
        this.error = table.error;
        console.log(this.error);
      }
      console.warn("anyModel._dbUpdateLocal: "+"Could not update table "+table_name+". "); // TODO! i18n
      return false;
    }
  } // if table_factory
  else
    console.warn("anyModel._dbUpdateLocal: "+"No table factory. "); // TODO! i18n
  if (this.success)
    return this.success(this,this,options);
  this.message = i18n.error.SUCCCESS_CB_MISSING;
  console.warn("anyModel._dbUpdateLocal: "+this.message);
  return false;
}; // _dbUpdateLocal

/**
 * Builds a POST string for dbUpdate to be sent to server.
 *
 * @method anyModel.dbUpdateGetURL
 * @param {Object} options An object which may contain these elements:
 *
 * @param {integer} options.id      Item's id. If specified, the server will update the item,
 *                                  if not specified, the server will insert the item.
 *                                  Optional. Default: null.
 * @param {integer} options.type    Item's type. If specified and not equal to `this.type`, then `[options.type]_id` will
 *                                  be used as the id_key instead of the value in `this.id_key` when calling the server.
 *                                  Optional. Default: `this.type`.
 * @param {boolean} options.is_new  true if the item is new (does not exist in database) and should be inserted
 *                                  and not updated. Note: If set, an insert operation will be performed even if
 *                                  `options.id` has a value.
 *                                  Optional. Default: false.
 * @param {boolean} options.auto_id Tells the server whether to update the id field by AUTOINCREMENT. If false, the server
 *                                  will use the value provide, if tru use AUTOINCREMENT. Default: true.
 *
 * @return The complete URL for dbUpdate or null on error.
 */
anyModel.prototype.dbUpdateGetURL = function (options)
{
  let the_type   = options.type                              ? options.type   : this.type;
  let the_id_key = options.type && options.type != this.type ? the_type+"_id" : this.id_key;
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
  //param_str += options.par_type && options.par_id
  //             ? "&link_type="+options.par_type+"&link_id="+options.par_id // TODO! Is this used on server?
  //             : "";

  return this._getDataSourceName() + param_str;
}; // dbUpdateGetURL

/**
 * Default success callback method for dbUpdate.
 *
 * @method anyModel.dbUpdateSuccess
 * @param {Object} context
 * @param {Object} serverdata
 * @param {Object} options
 *
 * @return context
 */
anyModel.prototype.dbUpdateSuccess = function (context,serverdata,options)
{
  let self = context ? context : this;
  self.db_last_command = "upd";
  if (serverdata && typeof serverdata == "object") {
    let srv_err = false;
    if (serverdata.JSON_CODE)
      if (typeof serverdata.JSON_CODE != "object")
        srv_err = true;
      else
        serverdata = serverdata.JSON_CODE;
    if (srv_err) {
      console.error("anyModel.dbUpdateSuccess: Illegal server data, check server log. "); // TODO! i18n
      return context;
    }
    if (Object.size(serverdata.data) === 0)
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
      if (options) {
        // TODO! Instead of the following, would it be better/simpler to just set data to what
        // is returned from the server after update (as we do in dbUpdateLinkListSuccess)?
        // If item is in model's data structure, we must update model after successful insert/update
        let type = options.type ? options.type : self.type;
        let item = self.dataSearch({ type: type,
                                     id:   options.client_id,
                                     data: options.data,
                                  });
        if (item) {
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
  }
  if (self.cbExecute && self.auto_refresh && options.auto_refresh !== false)
    self.cbExecute();
  return context;
}; // dbUpdateSuccess

/**
 * Add and/or remove items to/from a link (association) list by updating the link table
 * in the database. This can be used to link/unlink an item to/from another item in the
 * database (e.g., add/remove a user to/from an event). For example a user may be associated
 * with several events.
 *
 * @method anyModel.dbUpdateLinkList
 * @param {Object} options An object which may contain these elements:
 *
 * @param {String}   options.type       The type of the item to which the list is linked to (e.g. "user").
 *                                      Optional. Default: `this.type`.
 * @param {integer}  options.id         The id of the item to which the list is linked to (e.g. the user  id "23").
 *                                      Optional.
 * @param {String}   options.link_type  If `link_id` is specified, the type of an item in the data structure with
 *                                      id `link_id`.
 *                                      If `link_id` is not specified, the type of the items in the `select` and
 *                                      the `unselect` arrays.
 *                                      Mandatory if `link_id` is given.
 * @param {String}   options.link_id    The id of an item to unlink from item with id `id`.
 *                                      If specified, the link will be removed and no other action will be taken
 *                                      (the `select` and `unselect` arrays will be ignored).
 *                                      If not given, links will be added and/or removed as per the `select`
 *                                      and `unselect` arrays.
 *                                      Optional. Default: undefined.
 * @param {Object}   options.unselect   A list of ids to unlink from item with id `id` (if `link_id` is not given).
 *                                      This will be done *before* the ids in `select` are added.
 *                                      Optional. Default: undefined.
 * @param {Object}   options.select     A list of ids to link to item with id `id`(if `link_id` is not given).
 *                                      This will be done *after* the ids in `unselect` has been removed.
 *                                      If the link already exists, the link's data will be update with the data
 *                                      in `new_data`, if specified. TODO! new_data does not exist here!
 *                                      Optional. Default: undefined.
 * @param {Function} options.onSuccess  Method to call on success.
 *                                      Optional. Default: `this.dbUpdateSuccess`.
 * @param {Function} options.onFail     Method to call on error or timeout.
 *                                      Optional. Default: `this._dbFail`.
 * @param {Function} options.context    The context of the success and fail methods.
 *                                      Optional. Default: `this`.
 * @param {integer}  options.timeoutSec Number of seconds before timing out.
 *                                      Optional. Default: 10.
 *
 * @return true if the database call was made, false on error.
 */
anyModel.prototype.dbUpdateLinkList = function (options)
{
  if (!options || typeof options != "object")
    options = {};

  let db_timeout_sec = options.timeoutSec ? options.timeoutSec : this.db_timeout_sec;
  this.success = options.onSuccess ? options.onSuccess : this.dbUpdateLinkListSuccess;
  this.fail    = options.onFail    ? options.onFail    : this._dbFail;
  this.context = options.context   ? options.context   : this;
  this.message      = "";
  this.error        = "";
  this.error_server = "";
  let self = this;
  if (this.source == "remote") { // Remote server call
    $.ajaxSetup({ timeout: db_timeout_sec*1000 });
    if (options.sync)
      $.ajaxSetup({ async: false });
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
  else { // Local method call (AlaSQL server)
    this._dbUpdateLinkListLocal(options);
    return this.error == "";
  }
  return true;
}; // dbUpdateLinkList

// Internal method, do not call directly.
anyModel.prototype._dbUpdateLinkListLocal = async function (options)
{
  if (this.table_factory) {
    let the_type   = options && options.type      ? options.type      : this.type;
    let table_name = options && options.tableName ? options.tableName : the_type+"Table";
    let table = await this.table_factory.createClass(table_name,{type:the_type,header:true,path:options.path});
    if (table && table.error == "") {
      let self = this;
      return table.dbUpdateLinkList(options)
      .then( function(serverdata) {
        if (self.success)
          return self.success(self.context,serverdata,options);
        self.message = i18n.error.SUCCCESS_CB_MISSING;
        console.warn("anyModel._dbUpdateLinkListLocal: "+self.message);
        return false;
      });
    } // if table
    else {
      if (table && table.error != "") {
        this.error = table.error;
        console.log(this.error);
      }
      console.warn("anyModel._dbUpdateLinkListLocal: "+"Could not update link list in table "+table_name+". "); // TODO! i18n
    }
  } // if table_factory
  else
    console.warn("anyModel._dbUpdateLinkListLocal: "+"No table factory. "); // TODO! i18n
  if (this.success)
    return this.success(this,this,options);
  this.message = i18n.error.SUCCCESS_CB_MISSING;
  console.warn("anyModel._dbUpdateLinkListLocal: "+this.message);
  return false;
}; // _dbUpdateLinkListLocal

/**
 * Builds a POST string for dbUpdateLinkListGetURL to be sent to server.
 *
 * @method anyModel.dbUpdateLinkListGetURL
 * @param {Object} options See dbUpdateLinkList().
 *
 * @return The complete URL for dbUpdateLinkList or null on error.
 */
anyModel.prototype.dbUpdateLinkListGetURL = function (options)
{
  let the_type      = options.type
                      ? options.type
                      : this.type;
  let the_id        = Number.isInteger(parseInt(options.id)) && options.id >= 0
                      ? parseInt(options.id)
                      : options.id
                        ? options.id
                        : Number.isInteger(parseInt(this.id)) && this.id >= 0
                          ? this.id
                          : null;
  let the_link_type = options.link_type;
  let the_link_id   = Number.isInteger(parseInt(options.link_id)) && options.link_id >= 0
                      ? parseInt(options.link_id)
                      : options.link_id
                        ? options.link_id
                        : null;
  if (!the_type || !the_link_type) {
    let errstr = "";
    if (!the_type)      errstr += i18n.error.TYPE_MISSING;
    if (!the_link_type) errstr += i18n.error.LINK_TYPE_MISSING;
    console.error("anyModel.dbUpdateLinkListGetURL: "+errstr);
    return null;
  }
  if ((!the_id && the_id !== 0) || (typeof the_id !== "string" && !isInt(the_id))) {
    console.error("anyModel.dbUpdateLinkListGetURL: "+i18n.error.ID_ILLEGAL);
    return null;
  }
  let the_id_key = options.type && options.type != this.type ? the_type+"_id" : this.id_key;
  let param_str = "?echo=y"+
                  "&cmd=upd"+
                  "&type="+the_type+
                  "&"+the_id_key+"="+the_id+
                  "&link_type="+the_link_type;
  if (the_link_id)
    param_str += "&rem="+the_link_id;
  else {
    let has_add_or_rem = false;
    if (options.select && options.select.size) {
      let sel = [...options.select];
      param_str += "&add="+sel;
      has_add_or_rem = true;
    }
    if (options.unselect && options.unselect.size) {
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

/**
 * Default success callback method for dbUpdateLinkList.
 *
 * @method anyModel.dbUpdateLinkListSuccess
 * @param {Object} context
 * @param {Object} serverdata
 * @param {Object} options
 *
 * @return context
 */
anyModel.prototype.dbUpdateLinkListSuccess = function (context,serverdata,options)
{
  let self = context ? context : this;
  self.db_last_command = "updlink";
  if (serverdata && typeof serverdata === "object") {
    if (serverdata.JSON_CODE)
      serverdata = serverdata.JSON_CODE;
    if (Object.size(serverdata.data) === 0)
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
      self.dataUpdateLinkList({
             data:      options.data,
             id:        options.id,
             type:      options.type,
             select:    options.select,
             unselect:  options.unselect,
             link_type: options.link_type,
             new_data:  options.new_data,
           }); // Remove data
      if (serverdata.data) {
        let the_link_id = "link-"+options.link_type; // TODO! Not an ideal solution, depends on server side index
        let data = self.dataSearch({
                          data: serverdata.data,
                          id:   the_link_id,
                        });
        if (data && data[the_link_id])
          self.data = data[the_link_id].data;
      }
    }
  }
  if (self.cbExecute && self.auto_refresh && options.auto_refresh !== false)
    self.cbExecute({ parent: options.parent,
                     clear:  true });
  return context;
}; // dbUpdateLinkListSuccess

/**
 * Change individual value(s) for an item.
 *
 * @method anyModel.dbUpdateLink
 * @param {Object} options An object which may contain these elements:
 *
 * @param {String}   options.type      The type of items in the list.
 *                                     Optional. Default: `this.type`.
 * @param {String}   options.id        The id of the item.
 *                                     Mandatory.
 * @param {Object}   options.link_type The type of the item to which the list "belongs" (is linked to).
 *                                     Optional. Default: `this.type`.
 * @param {String}   options.link_id   The id of the item to which the list "belongs" (is linked to).
 *                                     Mandatory.
 * @param {Array}    options.names
 * @param {Array}    options.values
 * @param {Function} options.onSuccess
 * @param {Function} options.onFail
 * @param {integer}  options.timeoutSec Number of seconds before timing out.
 *                                      Optional. Default: 10.
 *
 * @return true if the database call was made, false on error.
 */
anyModel.prototype.dbUpdateLink = function (options)
{
  if (!options || typeof options != "object")
    options = {};

  let db_timeout_sec = options.timeoutSec ? options.timeoutSec : this.db_timeout_sec;
  this.success = options.onSuccess ? options.onSuccess : this.dbUpdateLinkSuccess;
  this.fail    = options.onFail    ? options.onFail    : this._dbFail;
  this.context = options.context   ? options.context   : this;
  this.message      = "";
  this.error        = "";
  this.error_server = "";
  let self = this;
  if (this.source == "remote") { // Remote server call
    $.ajaxSetup({ timeout: db_timeout_sec*1000 });
    if (options.sync)
      $.ajaxSetup({ async: false });
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
  else { // Local method call (AlaSQL server)
    this._dbUpdateLinkLocal(options);
    return this.error == "";
  }
  return true;
}; // dbUpdateLink

// Internal method, do not call directly.
anyModel.prototype._dbUpdateLinkLocal = async function (options)
{
  if (this.table_factory) {
    let the_type   = options && options.type      ? options.type      : this.type;
    let table_name = options && options.tableName ? options.tableName : the_type+"Table";
    let table = await this.table_factory.createClass(table_name,{type:the_type,header:true,path:options.path});
    if (table && table.error == "") {
      let self = this;
      return table.dbUpdateLink(options)
      .then( function(serverdata) {
        if (self.success)
          return self.success(self.context,serverdata,options);
        self.message = i18n.error.SUCCCESS_CB_MISSING;
        console.warn("anyModel._dbUpdateLinkLocal: "+self.message);
        return false;
      });
    } // if table
    else {
      if (table && table.error != "") {
        this.error = table.error;
        console.log(this.error);
      }
      console.warn("anyModel._dbUpdateLinkLocal: "+"Could not update link in table "+table_name+". "); // TODO! i18n
    }
  } // if table_factory
  else
    console.warn("anyModel._dbUpdateLinkLocal: "+"No table factory. "); // TODO! i18n
  if (this.success)
    return this.success(this,this.data,options);
  this.message = i18n.error.SUCCCESS_CB_MISSING;
  console.warn("anyModel._dbUpdateLinkLocal: "+this.message);
  return false;
}; // _dbUpdateLinkLocal

/**
 * Builds a POST string for dbUpdateLinkGetURL to be sent to server.
 *
 * @method anyModel.dbUpdateLinkGetURL
 * @param {Object} options See dbUpdateLink().
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
  param_str += options.db_search ? "&sea=y"                      : "";
  param_str += options.header    ? "&header="  +options.header   : "";
  param_str += options.grouping  ? "&grouping="+options.grouping : "";
  return this._getDataSourceName() + param_str;
}; // dbUpdateLinkGetURL

/**
 * Default success callback method for dbUpdateLink.
 *
 * @method anyModel.dbUpdateLinkSuccess
 * @param {Object} context
 * @param {Object} serverdata
 * @param {Object} options
 *
 * @return context
 */
anyModel.prototype.dbUpdateLinkSuccess = function (context,serverdata,options)
{
  // TODO! Not implemented
}; // dbUpdateLinkSuccess

/**
 * Deletes an item from a database table.
 *
 * @method anyModel.dbDelete
 * @param {Object} options An object which may contain these elements:
 *
 * @param {integer}  options.type       Item's type.
 *                                      Optional. Default: `this.type`.
 * @param {integer}  options.id         The id of the item to delete.
 *                                      Mandatory.
 * @param {integer}  options.timeoutSec Number of seconds before timing out.
 *                                      Optional. Default: 10.
 * @param {Function} options.onSuccess  Method to call on success.
 *                                      Optional. Default: `this.dbDeleteSuccess`.
 * @param {Function} options.onFail     Method to call on error or timeout.
 *                                      Optional. Default: `this._dbFail`.
 * @param {Function} options.context    The context of the success and fail methods.
 *                                      Optional. Default: `this`.
 *
 * @return true if the database call was made, false otherwise.
 */
// TODO! Check that the server also deletes any links the item may have in other tables.
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
  this.success = options.onSuccess ? options.onSuccess : this.dbDeleteSuccess;
  this.fail    = options.onFail    ? options.onFail    : this._dbFail;
  this.context = options.context   ? options.context   : this;
  this.message      = "";
  this.error        = "";
  this.error_server = "";
  let self = this;
  if (this.source == "remote") { // Remote server call
    $.ajaxSetup({ timeout: db_timeout_sec*1000 });
    if (options.sync)
      $.ajaxSetup({ async: false });
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
  else { // Local method call (AlaSQL server)
    this._dbDeleteLocal(options);
    return this.error == "";
  }
  return true;
}; // dbDelete

// Internal method, do not call directly.
anyModel.prototype._dbDeleteLocal = async function (options)
{
  if (this.table_factory) {
    let the_type   = options && options.type      ? options.type      : this.type;
    let table_name = options && options.tableName ? options.tableName : the_type+"Table";
    let table = await this.table_factory.createClass(table_name,{type:the_type,header:true,path:options.path});
    if (table && table.error == "") {
      let self = this;
      return await table.dbDelete(options)
      .then( function(serverdata) {
        if (self.success)
          return self.success(self.context,serverdata,options);
        self.message = i18n.error.SUCCCESS_CB_MISSING;
        console.warn("anyModel._dbDeleteLocal: "+self.message);
        return false;
      });
    } // if table
    else {
      if (table && table.error != "") {
        this.error = table.error;
        console.log(this.error);
      }
      console.warn("anyModel._dbDeleteLocal: "+"Could not delete from table "+table_name+". "); // TODO! i18n
    }
  } // if table_factory
  else
    console.warn("anyModel._dbDeleteLocal: "+"No table factory. "); // TODO! i18n
  if (this.success)
    return this.success(this,this.data,options);
  this.message = i18n.error.SUCCCESS_CB_MISSING;
  console.warn("anyModel._dbDeleteLocal: "+this.message);
  return false;
}; // _dbDeleteLocal

/**
 * Builds a POST string for dbDelete to be sent to server.
 *
 * @method anyModel.dbDeleteGetURL
 * @param {Object} options See dbDelete().
 *
 * @return The complete URL for dbDelete or null on error.
 */
anyModel.prototype.dbDeleteGetURL = function (options)
{
  let the_type   = options.type                              ? options.type   : this.type;
  let the_id_key = options.type && options.type != this.type ? the_type+"_id" : this.id_key;
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
 * Default success callback method for dbDelete.
 *
 * @method anyModel.dbDeleteSuccess
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

  if (serverdata && typeof serverdata === "object") {
    if (serverdata.JSON_CODE)
      serverdata = serverdata.JSON_CODE;
    if (Object.size(serverdata.data) === 0)
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