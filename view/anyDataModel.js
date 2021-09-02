"use strict";
/**
 ****************************************************************************************
 *
 * anyList is copyright (C) 2011-2021 Arne D. Morken and Balanse Software.
 *
 * @license AGPLv3.0 for open source use or anyList Commercial License for commercial use.
 * Get licences here: http://balanse.info/anylist/license/ (coming soon).
 * 
 ****************************************************************************************
 *
 * __anyDataModel: Tree structure data model that can manipulate data as lists and items
 * and optionally synchronize with a database.__
 *
 * See <a href="../classes/anyDataView.html">`anyDataView`</a> for a description of a data 
 * view class.
 *
 * The model should have a type (e.g. `type = "user"`), an id key (e.g. `id_key = "user_id"`) and a name
 * key (e.g. `name_key = "user_name"`). If `id_key` or `name_key` is omitted, they are constructed from
 * `type` (for example will type "foo" give rise to id_key "foo_id" and name_key "foo_name"). If no type
 * is given, the model cannot be searched, synchronized with database etc. If the model contains data for
 * an item (which may or may not contain any kind of subdata), the `id` property should be set to the id
 * of the item and either `this.data[id]` or `this.data[hdr_id].data[id]` should exist (where hdr_id is
 * the id of a single `head` entry).
 *
 * If used in connection with a database, then `mode` should be set to "remote" (see below). `type` will
 * then correspond to a database table and `id_key` to an id column in that table.
 *
 * See <a href="../modules/anyList.html">anyList`</a> for a full description of the format of the data structure
 * that the model works with.
 *
 * The class contains:
 * - a constructor, which sets the model's variables according to `options`, or to default values,
 * - the `dataInit` method for initializing the data model,
 * - `data*` methods for working with data in the internal data structure,
 * - `db*` methods for working with data in the database,
 * - subscribe/callback methods (`cb*` methods).
 *
 * @class anyDataModel
 * @constructor
 * @param {Object} options An object which may contain the following properties, all of which are optional unless stated otherwise:
 *
 *      {Object}   data:             The data with which to initialize the model.
 *                                   Default: null.
 *      {String}   type:             Type, e.g. "user".
 *                                   Default: "".
 *      {String}   id:               Item id, if the top level data represents an item, e.g. "42".
 *                                   Default: null.
 *      {String}   id_key:           Id key, e.g. "user_id".
 *                                   Default: "[type]_id" if type is set, "" otherwise.
 *      {String}   name_key:         Name key, e.g. "user_name".
 *                                   Default: "[type]_name" if type is set, "" otherwise.
 *      {Object}   plugins:          The plugins the model might interact with.
 *                                   Default: null.
 *      {Array}    select:           List of ids that are marked as selected.
 *                                   Default: new Set().
 *      {Array}    unselect:         List of ids that are are marked as unselected.
 *                                   Default: new Set().
 *      {String}   mode:             Indicates whether db* operations should be performed by a locally defined
 *                                   method ("local") or call the default database method ("remote").
 *                                   Default: "local".
 *      {boolean}  search:           Whether to call the search method while initializing the class or while
 *                                   searching on the server.
 *                                   Default: false.
 *      {String}   search_term:      The string to search for when `search == true`.
 *                                   Default: "".
 *      {boolean}  auto_search_init: If true, the model will be initiated with the result of a search, and
 *                                   cbExecute will be called.
 *                                   Default: true.
 *      {boolean}  auto_callback:    If true, cbExecute will be called after calling dataInsert, dataUpdate
 *                                   and dataDelete.
 *                                   Default: false.
 *      {Array}    page_links:       Pagination links. Not used yet.
 *                                   Default: null.
 *      {Object}   permission:       Permissions (normally obtained from server). The object may contain:
 *                                     {integer} current_user_id:  The user id the current user is logged in with.
 *                                     {boolean} is_logged_in:     True if the user is logged in.
 *                                     {boolean} is_admin:         True if the user has admin privileges.
 *                                   Default: null.
 *      {String}   message:          Messages.
 *                                   Default: "".
 *      {String}   error:            Errors.
 *                                   Default: "".
 *
 * @example
 *      new anyDataModel({ type:"user",id_key:"user_id",id:"38",data:{user_name:"Aretha Franklin"} });
 */
var anyDataModel = function (options)
{
  /**
  * @property {Object} data
  * @default null
  * @description The model's data. Optional. Default: null.
  */
  this.data = null;

  /**
  * @property {String} type
  * @default null
  * @description The model's type, e.g. `"user"`.
  *              If already set by a derived class, it will not be initialized.
  *              Optional. Default: "".
  */
  if (!this.type)
    this.type = "";

  /**
  * @property {String} id
  * @default null
  * @description Item id, if the top level data represents an item, e.g. "42".
  *              Optional. Default: "".
  */
  if (!this.id)
    this.id = null;

  /**
  * @property {String} id_key
  * @default "[type]_id" if type is set, "" otherwise.
  * @description Name of the model's id key, e.g. `"user_id"`.
  *              If already set (by a derived class), it will not be initialized.
  *              Optional. If not specified, "[type]_id" is used as the model's id key.
  */
  if (!this.id_key)
    this.id_key = this.type ? this.type+"_id" : "";

  /**
  * @property {String} name_key
  * @default "[type]_name" if type is set, "" otherwise.
  * @description The model's name key, e.g. `"user_name"`.
  *              If already set (by a derived class), it will not be initialized.
  *              Optional. If not specified, "[type]_name" is used as the model's name key.
  */
  if (!this.name_key)
    this.name_key = this.type ? this.type+"_name" : "";

  /**
  * @property {Object} plugins
  * @default null
  * @description The model's plugins. Optional.
  */
  this.plugins = null;

  /**
  * @property {Object} select
  * @default new Set()
  * @description A list of items that are marked as "selected". Optional.
  */
  this.select = new Set();

  /**
  * @property {Object} unselect
  * @default new Set()
  * @description A list of items that are marled as "unselected". Optional.
  */
  this.unselect = new Set();

  /**
  * @property {String} mode
  * @default "local"
  * @description The model's mode, e.g. `"local"` or `remote"`. Optional.
  */
  this.mode = "local";

  /**
  * @property {Boolean} search
  * @default false
  * @description Whether to call the search method while initializing the class,
  *              or while searching on the server. Optional.
  */
  this.search = false;

  /**
  * @property {String} search_term
  * @default ""
  * @description The string to search for when this.search == true. Optional.
  */
  this.search_term = "";

  /**
  * @property {Boolean} auto_search_init
  * @default true
  * @description If auto_search_init is true, the model will be automatically initialized
  *              with the data returned by dbSearch, and cbExecute will be called.
  */
  this.auto_search_init = true;


  /**
  * @property {Boolean} auto_callback
  * @default false
  * @description If auto_callback is true, cbExecute will be called after calling
  *              dataInsert, dataUpdate and dataDelete.
  */
  this.auto_callback = false;

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
  * @description Optional.
  */
  this.message = "";

  /**
  * @property {String} error
  * @default ""
  * @description Optional.
  */
  this.error = "";

  /**
  * @property {Object} page_links
  * @default null
  * @description Page links when displaying a list. Optional.
  *              Not used yet.
  */
  this.page_links = null;

  // Initialise
  this._dataInitDefault();
  this.dataInit(options);

  // Warnings and errors
  if (options && !this.type)
    this.message += "type missing. ";
  if (options && !this.id_key)
    this.message += "id_key missing. ";
  if (options && !this.name_key)
    this.message += "name_key missing. ";
  if (this.message !== "")
    console.log("anyDataModel constructor: "+this.message);
  if (this.error !== "")
    console.error("anyDataModel constructor: "+this.error);

  // Search
  if (options && options.search)
    this.dbSearch(options);
}; // constructor

//
// _dataInitDefault: "Private" method.
// Does not init type, id_key or name_key.
//
anyDataModel.prototype._dataInitDefault = function ()
{
  this.data             = null;
  this.id               = null;
  this.plugins          = null;
  this.mode             = "local";
  this.search           = false;
  this.search_term      = "";
  this.auto_search_init = true;
  this.auto_callback    = false;
  this.message          = "";
  this.error            = "";
  this._dataInitSelect();
  this.page_links       = null;
  // "Private" variables:
  this._listeners       = [];
  this.max              = -1;
  this.last_db_command  = null; // Used by dataInit
}; // _dataInitDefault

anyDataModel.prototype._dataInitSelect = function ()
{
  this.select   = new Set();
  this.unselect = new Set();
}; // _dataInitSelect

/**
 * @method dataInit
 * @description Set the model's data, such as type, data and more with the given options or to
 *              default values. Called by the constructor and the success method of `dbSearch`.
 * @param {Object} options An object containing data with which to initialize the model.
 *                         If the encapsulation `options.JSON_CODE` has been set, it will be removed
 *                         from `options`. If `options == null`, default values will be set.
 *                         The object may contain these elements:
 *
 *        {String}   type:        Type, e.g. "user". Optional.
 *        {String}   id:          Item id, if the top level data represents an item, e.g. "42". Optional.
 *        {String}   id_key:      Id key, e.g. "user_id". Optional. Default: "[type]_id".
 *        {String}   name_key:    Name key, e.g. "user_name". Optional. Default: "[type]_name".
 *        {Object}   data:        Data. Will only be initialised if `dataInit` is called after a search
 *                                (indicated by `this.last_db_command == "sea"`). Optional.
 *        {String}   mode:        "local" or "remote". Optional.
 *        {boolean}  search:      Whether to call the search method. Optional.
 *        {String}   search_term: The string to search for. Optional.
 *        {Object}   permission:  Permissions. Optional.
 *        {String}   message:     Messages. Optional.
 *        {String}   error:       Errors. Optional.
 *
 * @return options
 */
 anyDataModel.prototype.dataInit = function (options)
{
  // Remove encapsulation which may have been set by server
  if (options && options.JSON_CODE)
    options = options.JSON_CODE;
  if (options === null)
    this._dataInitDefault();
  else
  if (options) {
    //console.log("anyDataModel.dataInit options:\n"+JSON.stringify(options,2,2));
    if (options.data || this.last_db_command == "sea") { this.data             = options.data; }
    if (options.type)                                  { this.type             = options.type; }
    if (options.id)                                    { this.id               = options.id; }
    if (this.id && this.data) {
      let hdr_id = Object.keys(this.data)[0];
      if (!this.data[this.id] || (hdr_id && !this.data[hdr_id].data && this.data[hdr_id].data[this.id])) {
        console.warn("Id "+this.id+" given to constructor, but not found in data. Resetting id to null.");
        this.id = null;
      }
    }
    if (options.id_key)                                { this.id_key           = options.id_key; }
    else
    if (!this.id_key && this.type)                     { this.id_key           = this.type+"_id"; }
    if (options.name_key)                              { this.name_key         = options.name_key; }
    else
    if (!this.name_key && this.type)                   { this.name_key         = this.type+"_name"; }
    if (options.plugins)                               { this.plugins          = options.plugins; }
    if (options.select)                                { this.select           = options.select; }
    if (options.unselect)                              { this.unselect         = options.unselect; }
    if (options.mode)                                  { this.mode             = options.mode; }
    if (options.search)                                { this.search           = options.search; }
    if (options.search_term)                           { this.search_term      = options.search_term; }
    if (options.auto_search_init)                      { this.auto_search_init = options.auto_search_init; }
    if (options.auto_callback)                         { this.auto_callback    = options.auto_callback; }
    if (options.permission)                            { this.permission       = options.permission; }
    if (options.message)                               { this.message          = options.message; }
    if (options.error)                                 { this.error            = options.error; }
    if (options.page_links)                            { this.page_links       = options.page_links; }

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
 * @param {Function} cbFunction A method to add to the list.
 *                              Mandatory.
 * @param {Object}   cbContext  The context the method should be executed in.
 *                              Mandatory.
 *
 * @throws {CALLBACK_MISSING} If `cbFunction` or `cbContext` are missing.
 */
 anyDataModel.prototype.cbSubscribe = function (cbFunction,cbContext)
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
 * @param {Function} cbFunction A method to remove from the list.
 *                              Mandatory.
 */
anyDataModel.prototype.cbUnsubscribe = function (cbFunction)
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
 * @method cbResetListeners
 * @description Empties the list of methods to be called by cbExecute.
 */
anyDataModel.prototype.cbResetListeners = function ()
{
  this._listeners = [];
}; // cbResetListeners

/**
 * @method cbExecute
 * @description Calls all callback methods registered with `cbSubscribe`.
 *              This method is called by the default success/fail methods if `auto_callback == true`.
 */
anyDataModel.prototype.cbExecute = function ()
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
//////// Methods that work with local data structure only (not database) ////////
/////////////////////////////////////////////////////////////////////////////////

//
// _getDataSourceName: "Private" method.
// Returns the complete path to the data source (a script communicating with a database/server backend).
//
anyDataModel.prototype._getDataSourceName = function ()
{
  if (this.mode == "remote")
    return any_defs.dataScript;
  this.message = "No local data source. "; // TODO i18n
  console.warn("anyDataModel._getDataSourceName: "+this.message);
  return "";
}; // _getDataSourceName

/**
 * @method dataSearch
 * @description Search for item of type "type" and id "id" in "data".
 *              If "data" is omitted, `this.data` is used.
 *              If a "type/id" combination exists several places in the tree,
 *              only the first occurence found is returned.
 * @param {Object} options An object which may contain these elements:
 *
 *        {Object}  data: The data structure to search in.
 *                        Optional. Default: The model's data (`this.data`).
 *        {integer} id:   The id to search for.
 *                        Optional. Default: null.
 *        {String}  type: The type of the data to search for.
 *                        Optional. Default: The model's type (`this.type`).
 *        {boolean} parent: If true, search for parent of the given id.
 *
 * @return If id is specified and parent is false: A pointer to the item found, or null if not found or on error.
 *         If id is specified and parent is true: A pointer to the parent of the item found, or null if not found or on error.
 *         If id is not specified: A new set of pointers to all the items of the given type (might be empty if none found).
 *
 * @example
 *      mymodel.dataSearch({type:"user",id:"38"});
*/
// TODO: Not tested with non-numerical indexes
anyDataModel.prototype.dataSearch = function (options,parent_data,parent_id)
{
  if (!options || typeof options != "object") {
    console.error("anyDataModel.dataSearch: "+i18n.error.OPTIONS_MISSING);
    return null;
  }
  let data = options.data                  ? options.data : this.data;
  let id   = options.id || options.id===0  ? options.id   : null;
  let type = options.type                  ? options.type : this.type;

  if (!type) {
    console.error("anyDataModel.dataSearch: "+i18n.error.TYPE_MISSING);
    return null;
  }
  if (id !== null && ((!id && id !== 0) || (Number.isInteger(parseInt(id)) && id < 0))) {
    console.error("anyDataModel.dataSearch: "+i18n.error.ID_MISSING+" ("+id+") ");
    return null;
  }
  if (!data)
    return null; // Not found

  if (!id && id !== 0 && !options.item_list)
    options.item_list = new Set(); // Used if type search

  let name_key = type == this.type
                 ? (this.name_key ? this.name_key : type+"_name")
                 : type+"_name";
  let data_ptr = data[id] ? data[id] : data["+"+id] ? data["+"+id] : null;
  let dp_type  = data_ptr ? data_ptr.list ? data_ptr.list : data_ptr.item ? data_ptr.item : data_ptr.head ? data_ptr.head : null : null;
  if ((id || id === 0) && data_ptr && (dp_type == type || (!dp_type && (data_ptr[name_key] || data_ptr[name_key] === "")))) {
    if (parent_data && parent_data[parent_id]) {
      parent_data[parent_id].id = parent_id; // Hack
      return parent_data[parent_id];
    }
    return data;
  }
  for (let idx in data) {
    if (data.hasOwnProperty(idx) && data[idx]) {
      let item = null;
      let dtype = data[idx].list ? data[idx].list : data[idx].item ? data[idx].item : data[idx].head ? data[idx].head : null
      if (dtype == type || (!dtype && data[idx][name_key])) {
        if (id || id === 0) {
          // id search
          let is_int = Number.isInteger(parseInt(idx));
          if ((is_int && parseInt(idx) == parseInt(id)) || (!is_int && idx == id)) {
            item = data;
          }
        }
        else {
          // type search
          if (!data[idx].head)
            options.item_list.add(data[idx]);
        }
      }
      if (!item && data[idx].data) { // subdata
        let pdata = options.parent ? data : null;
        let pidx  = options.parent ? idx  : null;
        if (id || id === 0)
          item              = this.dataSearch({data:data[idx].data,id:id,type:type},pdata,pidx);
        else
          options.item_list = this.dataSearch({data:data[idx].data,id:id,type:type},pdata,pidx);
      }
      if (item && id != null)
        return item; // Found
    }
  }
  if (id || id === 0)
    return null; // Not found (id search)
  else {
    if (!options.item_list || options.item_list.size === 0)
      return null; // Not found (type search)
    let it_lst = options.item_list;
    delete options.item_list; // We dont want to change in-parameter
    return it_lst;
  }
}; // dataSearch

/**
 * @method dataSearchNextId
 * @description Sets `this.max` to the largest id for the given type in the in-memory data structure
 *              and returns the next id (i.e. `this.max + 1`). Will ignore non-numerical indexes.
 * @param {String} type: The type of the data to search for.
 *                       Optional. Default: The model's type (`this.type`).
 * @param {Object} data: The data structure to search in.
 *                       Optional. Default: The model's data (`this.data`).
 *
 * @return The next available id. If none can be found, -1 is returned and `this.max == -1`.
 */
 anyDataModel.prototype.dataSearchNextId = function (type,data)
 {
   this.max = -1;
   let res = this.dataSearchMaxId(type,data);
   if (res >= 0)
     return 1 + parseInt(this.max);
   this.max = -1;
   return -1;
 }; // dataSearchNextId
 
 /**
  * @method dataSearchMaxId
  * @description Sets `this.max` to the largest id for the given type in the in-memory data structure
  *              and returns this.max. Will ignore non-numerical indexes.
  * @param {String} type: The type of the data to search for.
  *                       Optional. Default: The model's type (`this.type`).
  * @param {Object} data: The data structure to search in.
  *                       Optional. Default: The model's data (`this.data`).
  *
  * @return The largest id found. If none can be found, -1 is returned and `this.max` is not changed.
  */
 anyDataModel.prototype.dataSearchMaxId = function (type,data)
 {
   if (!type)
     type = this.type;
   if (!data)
     data = this.data;
   if (!type || !data)
     return -1;
   // Must at least be bigger than biggest "index" in object
   let datakeys = Object.keys(data);
   for (const key in datakeys) {
     if (datakeys.hasOwnProperty(key)) {
       if (!isInt(datakeys[key]))
         datakeys[key] = "-1";
     }
   }
   let max = $.isEmptyObject(datakeys) ? -1 : Math.max(...datakeys);
   if (!isNaN(max)) {
     let dmax  = data[max] ? max : data["+"+max] ? "+"+max : null;
     let dtype = dmax && data[dmax]
                 ? data[dmax].list ? data[dmax].list : data[dmax].item ? data[dmax].item : data[dmax].head ? data[dmax].head : null
                 : null;
     if (!dtype)
       dtype = this.type;
     if (!dtype)
       return -1;
     if (type == dtype)
       this.max = Math.max(this.max,max);
   }
   // Should also be bigger than biggest id of given type
   let name_key = type == this.type
                  ? (this.name_key ? this.name_key : type+"_name")
                  : type+"_name";
   for (let idx in data) { // TODO Should we search entire this.data in case of duplicate ids?
     if (data.hasOwnProperty(idx) && data[idx]) {
       if (isInt(idx)) {
         let dtype = data[idx].list ? data[idx].list : data[idx].item ? data[idx].item : data[idx].head ? data[idx].head : null;
         if (data[idx][name_key] || data[idx][name_key]=="" || dtype == type) {
           let the_id = Number.isInteger(parseInt(idx)) ? parseInt(idx) : idx;
           let tmpmax = Math.max(this.max,the_id);
           if (!isNaN(tmpmax))
             this.max = tmpmax;
         }
       }
       if (data[idx].data) // subdata
         this.dataSearchMaxId(type,data[idx].data);
     }
   }
   return this.max;
 }; // dataSearchMaxId
 
/**
 * @method dataInsert
 * @description Inserts `indata` into the data structure at a place specified by `type`, `id` and possibly ´nid´.
 * @param {Object} options An object which may contain these elements:
 *
 *        {Object}  data:   The data structure to insert into.
 *                          Optional. Default: The model's data (`this.data`).
 *        {integer} id:     The id of the item where the new data should be inserted. If null or undefined, the data will be
 *                          inserted at top level of the model's data unless `nid` is given, in which case `nid` will be used
 *                          as the index on the top level.
 *                          Optional. Default: null.
 *        {String}  type:   The type of the item where the new data should be inserted.
 *                          Optional. Default: The model's type (`this.type`).
 *        {Object}  indata: The data to be inserted. Should be on a format that can be recognized by the model.
 *                          See <a href="../modules/anyList.html">`anyList`</a>.
 *                          Mandatory.
 *        {integer} nid:    A new id that may be used when inserting the item:
 *                          - If `nid` is specified and is a string or an integer >= 0, it is used as the id for the inserted
 *                            data item. Data that may exist at the position specified by nid is overwritten.
 *                            In this case the indata will be inserted like this: `item[id].data[nid] = indata[nid]`.
 *                          - If `nid` is < 0, a new id is created by `dataSearchNextId` (if `this.mode == "local"`) or by
 *                            dbSearchNextId` (if `this.mode == "remote"` - that is, we will ask the database for a new id)
 *                            and the indata will be inserted like this: `item[id].data[new_id] = indata`. Note that in
 *                            this case the indata should not be indexed (i.e. use {type:"foo"} rather than {38:{type:"foo"}}.
 *                          - If `nid` is not specified, the indata will be inserted like this: `item[id].data = indata`.
 *                          Optional. Default: null.
 *
 * @return A pointer to the place where the indata item was inserted on success, or null if the place was not found or on error.
 *
 * @example
 *      mymodel.dataInsert({type:"user",id:"38",indata:{user_name:"Foo Bar"}});
 */
// TODO: Not tested with non-numerical indexes
// TODO What if type/id combination exists several places in data structure?
anyDataModel.prototype.dataInsert = function (options)
{
  if (!options || typeof options != "object") {
    console.error("anyDataModel.dataInsert: "+i18n.error.OPTIONS_MISSING);
    return null;
  }
  let data   = options.data ? options.data : this.data;
  let id     = options.id;
  let type   = options.type ? options.type : this.type;
  let indata = options.indata;
  let nid    = options.nid;

  if (!type) {
    console.error("anyDataModel.dataInsert: "+i18n.error.TYPE_MISSING);
    return null;
  }
  if ((id || id === 0) &&
      ((Number.isInteger(parseInt(id)) && id < 0) ||
       (!Number.isInteger(parseInt(id)) && typeof id != "string"))) {
    console.error("anyDataModel.dataInsert: "+i18n.error.ID_ILLEGAL);
    return null;
  }
  if (!indata)
    return null; // Nothing to insert
  if (!data) {
    if (options.data !== undefined)
      data = {};
    else {
      this.data = {};
      data = this.data;
    }
  }
  let item = id || id === 0
             ? this.dataSearch({data:data,id:id,type:type})
             : data;
  if (!item)
    return null; // Didnt find insertion point in data
  if (!id && id !== 0) {
    // Insert at top level
    if (nid)
       if (!item[nid])
         item[nid] = {};
    for (let idx in indata)
      if (indata.hasOwnProperty(idx))
        if (nid && nid >= 0)
          item[nid][idx] = indata[idx]; // item[nid] == data
        else
          item[idx] = indata[idx]; // item == data
    return item;
  }
  else {
    if (!item || (!item[id] && !item["+"+id]))
      return null;
    if (item["+"+id])
      id = "+"+id;
    if (!item[id].data)
      item[id].data = {};
    if ((nid && typeof(nid) == "string") || nid >= 0)
      item[id].data[nid] = indata[nid] ? indata[nid] : indata["+"+nid];
    else
    if (nid < 0) {
      nid = this.mode == "local"
            ? this.dataSearchNextId(type)
            : this.dbSearchNextId({type:type}); // TODO! Asynchronous database call
      if ((!nid && nid !== 0) || nid < 0)
        return null;
      item[id].data[nid] = indata; // NOTE: Requires `indata` to be on a different format than when nid != -1!
    }
    else
      item[id].data = indata[id].data; // TODO Is this correct?
  }
  if (this.auto_callback)
    this.cbExecute();
  return item;
}; // dataInsert

/**
 * @method dataUpdate
 * @description Updates data structure at a place specified by `type` and `id` with the data given in `indata`.
 * @param {Object} options An object which may contain these elements:
 *
 *        {Object}  data:   The data structure to update.
 *                          Optional. Default: The model's data (`this.data`).
 *        {integer} id:     The id of the item where the data should be updated.
 *                          Mandatory.
 *        {String}  type:   The type of the item where the data should be updated.
 *                          Optional. Default: The model's type (`this.type`).
 *        {Object}  indata: The values to update the data structure with.
 *                          Should be on the format: `indata[filter_id]`.
 *                          Mandatory.
 *
 * @return A pointer to the place where the data was updated on success,
 *         or null if the place was not found or on error.
 *
 * @example
 *      mymodel.dataUpdate({type:"user",id:"38",indata:{user_name:"Foz Baz"}});
 */
// TODO: Not tested with non-numerical indexes
// TODO What if type/id combination exists several places in data structure?
anyDataModel.prototype.dataUpdate = function (options)
{
  if (!options || typeof options != "object") {
    console.error("anyDataModel.dataUpdate: "+i18n.error.OPTIONS_MISSING);
    return null;
  }
  let data   = options.data ? options.data : this.data;
  let id     = options.id;
  let type   = options.type ? options.type : this.type;
  let indata = options.indata;
  if (!type) {
    console.error("anyDataModel.dataUpdate: "+i18n.error.TYPE_MISSING);
    return null;
  }
  if ((!id && id !== 0) ||
      (Number.isInteger(parseInt(id)) && id < 0) ||
      (!Number.isInteger(parseInt(id)) && typeof id != "string")) {
    console.error("anyDataModel.dataUpdate: "+i18n.error.ID_ILLEGAL);
    return null;
  }
  if (!data)
    return null; // Nowhere to insert
  if (!indata)
    return null; // TODO Error msg

  let item = this.dataSearch({data:data,id:id,type:type});
  if (!item || !item[id])
    return null;
  if (!item[id].dirty)
    item[id].dirty = {};
  for (let filter_id in indata) {
    if (indata.hasOwnProperty(filter_id)) {
      if (item[id][filter_id] != indata[filter_id]) {
        item[id][filter_id] = indata[filter_id];
        if (filter_id != "parent_name")
          item[id].dirty[filter_id] = item[id][filter_id]; // Only send data that have changed to server
      }
    }
  }
  if (!Object.size(item[id].dirty))
    delete item[id].dirty; // Nothing was changed
  if (this.auto_callback)
    this.cbExecute();
  return item;
}; // dataUpdate

/**
 * @method dataUpdateLinkList
 * @description Add or remove items to/from a list. This can be used to update a link from one
 *              data item to another (for example, remove a user from an event).
 * @param {Object} options An object which may contain these elements:
 *
 *        {Object}  data:      The data structure to update. Optional. Default: `this.data`.
 *        {String}  type:      The type of the data to update. Mandatory.
 *        {Set}     del:       A list of ids of the items to be deleted. Optional. Default: null.
 *        {Set}     ins:       A list of ids of the items to be inserted. Optional. Default: null.
 *        {Object}  indata:    Contains the selected items to be inserted. Optional. Default: null.
 *        {integer} insert_id: The id of the item where the selected items should be inserted.
 *                             Mandatory if `ins` and `indata` are given.
 *
 * @return true on success, false on error.
 *
 * @example
 */
anyDataModel.prototype.dataUpdateLinkList = function (options)
{
  if (!options || typeof options != "object") {
    console.error("anyDataModel.dataUpdateLinkList: "+i18n.error.OPTIONS_MISSING);
    return false;
  }
  let data = options.data ? options.data : this.data;
  let type = options.type;
  if (!type) {
    console.error("anyDataModel.dataUpdateLinkList: "+i18n.error.TYPE_MISSING);
    return false;
  }
  // Delete items
  for (let id of options.del) {
    let obj = this.dataDelete({ data: data,
                                id:   id,
                                type: type,
                             });
  }
  // Insert items
  let indata = options.indata;
  let ins_id = options.insert_id;
  for (let id of options.ins) {
    if (!this.dataSearch({id:id})) { // Insert item only if its not already in model
      // See if we got the new data
      let item = this.dataSearch({ data: indata,
                                   id:   id,
                                   type: type,
                                });
      if (item) {
        let obj = this.dataInsert({ data:   data,
                                    id:     ins_id, // TODO
                                    type:   type,
                                    indata: item,
                                    nid:    id,
                                 });
      }
      else
        console.warn("Couldn't add item for "+type+" "+id+" (not found in indata). "); // TODO i18n
    } // if
  } // for
  this._dataInitSelect(); // Reset
  return true;
}; // dataUpdateLinkList

/**
 * @method dataDelete
 * @description Deletes an item with a given id from the data structure.
 * @param {Object} options An object which may contain these elements:
 *
 *        {Object}  data:  The data structure to delete from.
 *                         Optional. Default: The model's data structure (`this.data`).
 *        {integer} id:    The id of the item to delete.
 *                         Mandatory.
 *        {String}  type:  The type of the item to delete.
 *                         Optional. Default: The model's type (`this.type`).
 *
 * @return A pointer to the place where the data was deleted on success, or null if the place was not found or on error.
 */
// TODO What if type/id combination exists several places in data structure?
anyDataModel.prototype.dataDelete = function (options)
{
  if (!options || typeof options != "object") {
    console.error("anyDataModel.dataDelete: "+i18n.error.OPTIONS_MISSING);
    return null;
  }
  let data = options.data ? options.data : this.data;
  let id   = options.id;
  let type = options.type ? options.type : this.type;
  if (!data)
    return null; // Nowhere to insert
  if ((!id && id !== 0) || (Number.isInteger(parseInt(id)) && id < 0)) {
    console.error("anyDataModel.dataDelete: "+i18n.error.ID_MISSING);
    return null;
  }
  if (!type) {
    console.error("anyDataModel.dataDelete: "+i18n.error.TYPE_MISSING);
    return null;
  }
  let item = this.dataSearch({data:data,id:id,type:type});
  if (!item)
    return null;
  if (item[id])
    delete item[id];
  else
  if (item["+"+id])
    delete item["+"+id];
  else
    return null;
  if (this.auto_callback)
    this.cbExecute();
  return item; // Should be null/undefined
}; // dataDelete
