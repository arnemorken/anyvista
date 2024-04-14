/* jshint sub:true */
/* jshint esversion: 9 */
/* globals $,i18n,any_defs,isFunction,w3_modaldialog,w3_modaldialog_close,tinyMCE,tinymce,doUploadFile, */
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
 * The anyView class can display, edit and persist data in an anyVista data model.
 * <p/>
 * See <a href="anyModel.html">`anyModel`</a> for a description of the data model class.
 * <p/>
 * Note: All jQuery id's in anyVista are on the format [id_base]\_[type]\_[mode]\_[id]\_[html_name].
 *
 * @constructs anyView
 * @param {Object} options An object which may contain these elements:
 *
 * @param {Object}  options.model                  The model with data to be displayed. Default: null.
 * @param {Object}  options.filters                The filters define how the data will be displayed. Default: null.
 * @param {String}  options.id                     The jQuery id of a container element in which to display the view. Default: null.
 * @param {String}  options.mode                   The current mode of display for the view. Default: this.options.defaultMode.
 * @param {boolean} options.isSelectable           An icon for selecting a list row will be displayed. Ignored for items. If isSelectable is set,
 *                                                 isAddable, isRemovable, isEditable and isDeletable will be ignored. Default: false.
 * @param {boolean} options.isAddable              An icon for adding new rows may be displayed. Ignored if isSelectable is set. Default: false.
 * @param {boolean} options.isRemovable            An icon for removing will be displayed. Ignored if isSelectable is set. Default: false.
 * @param {boolean} options.isEditable             Icons for edit, update and cancel will be displayed. Ignored if isSelectable is set. Default: false.
 * @param {boolean} options.isDeletable            An icon for deleting will be displayed. Ignored if isSelectable is set. Default: false.
 * @param {boolean} options.isSortable             List tables will be sortable by clicking on column headers. An icon indicating
 *                                                 the direction of the sort wil be displayed. Default: true.
 * @param {boolean} options.confirmRemove          A remove confirmation dialog will be displayed. Default: true.
 * @param {boolean} options.confirmDelete          A delete confirmation dialog will be displayed. Default: true.
 * @param {boolean} options.showHeader             If false, data headers will not be shown. Default: true.
 * @param {boolean} options.showTableHeader        If false, list tables headers will not be shown. Default: true.
 * @param {boolean} options.showTableFooter        If false, list tables footers will not be shown. Default: true.
 * @param {boolean} options.showTableIngress       If false, a description for list tables will not be shown. Default: true.
 * @param {boolean} options.showRowIngress         If true and "[type]_ingress" exists in the data, an extra row will be shown beneath the ordinary
 *                                                 row displaying the contents of the "[type]_ingress" data field. Default: false.
 * @param {boolean} options.showSearcher           If true, a search field for list tables will be shown. Default: false.
 * @param {boolean} options.showPaginator          If false, a paginator buttons for list tables will not be shown. Default: true.
 * @param {boolean} options.showToolbar            If true, will show a toolbar at the bottom. Default: true.
 * @param {boolean} options.showMessages           If true, will show a message field in a toolbar. Default: false.
 * @param {boolean} options.showServerErrors       If true, errors from a server will be shown directly. Default: false.
 * @param {boolean} options.showEmptyRows          If true, empty rows will be shown in non-edit mode. Default: false.
 * @param {boolean} options.showButtonNew          If true, a button for creating a new item may be shown. Default: false.
 * @param {integer} options.showButtonAdd          If isAddable is true, a button for adding new rows may be shown in list table headers. Possible values:
 *                                                 0: Do not show button. 1: Show button in first column. 2: Show button in last column. Default: 0.
 * @param {boolean} options.showButtonRemove       If isRemovable is true, a remove button may be shown. Possible values:
 *                                                 0: Do not show button. 1: Show button in first column. 2: Show button in last column. Default: 2.
 * @param {boolean} options.showButtonEdit         If isEditable is true, an edit button may be shown. Possible values:
 *                                                 0: Do not show button. 1: Show button in first column. 2: Show button in last column. Default: 1.
 * @param {boolean} options.showButtonUpdate       If isEditable is true, an update button may be shown in edit-mode. Possible values:
 *                                                 0: Do not show button. 1: Show button in first column. 2: Show button in last column. Default: 1.
 * @param {boolean} options.showButtonDelete       If isEditable is true, a delete button may be shown in edit-mode. Possible values:
 *                                                 0: Do not show button. 1: Show button in first column. 2: Show button in last column. Default: 2.
 * @param {boolean} options.showButtonCancel       If isEditable is true, a cancel button may be shown in edit-mode. Possible values:
 *                                                 0: Do not show button. 1: Show button in first column. 2: Show button in last column. Default: 2.
 * @param {boolean} options.showButtonSelect       If isSelectable is true, a button for selecting a row may be shown. Possible values:
 *                                                 0: Do not show button. 1: Show button in first column. 2: Show button in last column. Default: 1.
 * @param {boolean} options.showButtonAddLinkItem  If true, will show a button for adding links to an item. Default: true.
 * @param {boolean} options.showButtonAddLinkGroup If true, will show a button for adding items to a group. Default: true.
 * @param {boolean} options.showButtonLabels       Will show labels for buttons on the button panel. Default: false.
 * @param {boolean} options.onEnterUpdateEdit      Pressing enter will update the database with the value of the row being edited. Default: true.
 * @param {boolean} options.onEnterInsertNew       A new row will be inserted when pressing enter while editing a list. Default: false.
 * @param {boolean} options.onEnterMoveFocus       Pressing enter will move the focus to the next input element if editing an item. Default: True.
 * @param {boolean} options.onEscRemoveEmpty       The current row being edited in a list will be removed when pressing the Esc key if the row is empty. Default: true.
 * @param {boolean} options.onEscEndEdit           Pressing the Esc key will end the current editing. Default: true.
 * @param {boolean} options.onFocusoutRemoveEmpty  The current row being edited in a list will be removed when loosing focus if the row is empty. Default: true.
 * @param {boolean} options.useOddEvenColums       If true, tags for odd and even columns will be generated for list entries. Default: false.
 * @param {boolean} options.useOddEvenRows         If true, tags for odd and even rows will be generated for list entries. Default: false.
 * @param {String}  options.defaultMode            The default mode to use for display. One of `head`. `list` or `item`. Default: `list`.
 * @param {integer} options.itemsPerPage           The number of rows to show per page. Only applicable for "list" and "select" modes. Default: 20.
 * @param {integer} options.currentPage            The current page to show. Only applicable for "list" and "select" modes. Default: 1.
 * @param {String}  options.grouping               How to group data: Empty string for no grouping, "tabs" for using anyViewTabs to group data into tabs. Default: "".
 * @param {boolean} options.simple                 If true, display only the value of the [name_key] data entry and disregard other data entires. Default: false.
 * @param {String}  options.sortBy                 The filter id of the table header that the table should be sorted by. Only valid if isSortable is `true`. Default: "".
 * @param {String}  options.sortDirection          Whether the sorting of tables should be ascending (`ASC`) or descending (`DESC`). Only valid if isSortable is `true`. Default: "`ASC`".
 * @param {boolean} options.refresh                If true, the constructor will call `this.refresh` at the end of initialization. Default: false.
 * @param {boolean} options.uploadDirect           If true, the selected file will be uploaded without the user having to press the "edit" and "update" buttons. Default: true.
 * @param {Object}  options.linkIcons              Icons to use in the link popup menu. Default: null.
 * @param {Set}     options.select                 List of ids that are marked as selected. Default: new Set().
 * @param {Set}     options.unselect               List of ids that are marked as unselected. Default: new Set().
 *
 * @example
 *      new anyView({model:mymodel,filters:myfilters,id:"mycontent"});
 */
var ANY_LOCALE_NOT_FOUND = "No locale found. ";
var ANY_MAX_REF_REC = 50;

var anyViewWidget = $.widget("any.anyView", {
  // Default options
  options: {
    model:                  null,
    filters:                null,
    id:                     null,
    isSelectable:           false,
    isAddable:              true,
    isRemovable:            true,
    isEditable:             true,
    isDeletable:            true,
    isSortable:             true,
    confirmRemove:          true,
    confirmDelete:          true,
    showHeader:             true,
    showTableHeader:        true,
    showTableFooter:        true,
    showTableIngress:       true,
    showRowIngress:         false,
    showSublists:           true,
    showSearcher:           true,
    showPaginator:          true,
    showToolbar:            true,
    showMessages:           true,
    showServerErrors:       false,
    showEmptyRows:          false,
    showButtonNew:          true,
    showButtonAdd:          1,
    showButtonRemove:       2,
    showButtonEdit:         1,
    showButtonUpdate:       1,
    showButtonDelete:       2,
    showButtonCancel:       2,
    showButtonSelect:       1,
    showButtonAddLinkItem:  true,
    showButtonAddLinkGroup: true,
    showButtonLabels:       false,
    onEnterUpdateEdit:      true,
    onEnterInsertNew:       true, // Note: Only used for lists, ignored for items
    onEnterMoveFocus:       true, // Will be overridden by onEnterUpdateEdit==true TODO! Make it work for lists
    onEscRemoveEmpty:       true,
    onEscEndEdit:           true,
    onFocusoutRemoveEmpty:  true,
    useOddEvenColums:       true,
    useOddEvenRows:         true,
    mode:                   null,
    defaultMode:            "list",
    itemsPerPage:           20,
    currentPage:            1,
    grouping:               "",
    simple:                 false,
    sortBy:                 "",
    sortDirection:          "DESC",
    refresh:                false,
    uploadDirect:           true,
    linkIcons:              null,
    select:                 new Set(), // List of ids that are marked as selected.
    unselect:               new Set(), // List of ids that are marked as unselected.

    // Local methods
    localSelect:     null,
    localUpdate:     null,
    localDelete:     null,
    localAdd:        null,
    localRemove:     null,
    localNew:        null,
    localEdit:       null,
    localCancel:     null,
    localCloseItem:  null,
    itemLinkClicked: null,

    // "Private" and undocumented options:
    subscribe_default: true, // The default onModelChange method will be subscribed to.
    reset_listeners:   true, // The array of listeners will be erased on each call to the constructor.
    top_view:          null, // The top view for all views in the view tree (used by dialogs and item view)
    id_base:           "",
    data_level:        0,    // Current vertical level in data tree (used for class ids)
    indent_tables:     false,
    indent_level:      0,    // Current horisontal level in data tree (used for indentation of rows)
    indent_amount:     20,
    cutoff:            100,
    item_opening:      false,
    ref_rec:           0,    // Used to prevent (theoretical) infinite recursion
  }, // options

  // Constructor
  _create: function() {
    if (typeof i18n === "undefined")
      throw ANY_LOCALE_NOT_FOUND;

    if (this.options.id)
      if ($("#"+this.options.id).length)
        this.element = $("#"+this.options.id);
      else
        this.element.attr("id",this.options.id);

    if (!this.element || !this.element.length)
      throw i18n.error.VIEW_AREA_MISSING;

    this.element.addClass("any-data-view");

    this.options.id = this.element.attr("id");

    if (!this.options.top_view)
      this.options.top_view = this;

    this.id_base      = this.options.id_base
                        ? this.options.id_base
                        : this._createIdBase();

    this.data_level   = this.options.data_level
                        ? this.options.data_level
                        : 0;

    this.indent_level = this.options.indent_level
                        ? this.options.indent_level
                        : 0;

    this.model        = this.options.model
                        ? this.options.model
                        : null;

    this.mode         = this.options.mode
                        ? this.options.mode
                        : this.options.defaultMode;

    this.id_stack = []; // Dynamic stack of id strings for views
    this.views    = {};

    if (this.model && this.options.subscribe_default) {
      if (this.options.reset_listeners)
        this.model.cbUnsubscribe(this.onModelChange);
      this.model.cbSubscribe(this.onModelChange,this);
    }

    this._setPermissions();

    // API access through jQuery. Note small "v".
    $.fn.anyview = this;

    if (this.options.refresh)
      this.refresh();

    return this;
  }, // constructor

  refresh: function() {
    return this.refresh();
  },

  empty: function() {
    return this.empty();
  },

  // Destructor
  _destroy: function() {
    this.element.removeClass("any-data-view");
    this.options.top_view = null;
    this.options          = null;
    this.model            = null;
  }, // destructor

}); // anyView widget constructor

/////////////////////////////////////////////////////////////////////////////////////////
//
// Getters
//
/////////////////////////////////////////////////////////////////////////////////////////

/**
 * All jQuery ids in anyVista are on the format `[id_base]_[type]_[mode]_[id]_[html_name]`.
 * This method will return the `id_base` prefix string.
 *
 * @method  anyView.getIdBase
 * @return  {String} `this.id_base`
 */
$.any.anyView.prototype.getIdBase = function ()
{
  return this.id_base;
}; // getIdBase

/**
 * Returns the filter for the given type/mode combination.
 *
 * @method  anyView.getFilter
 * @param   {String} type Object type (e.g. "event"). Optional, but mandatory if `mode` is given.
 * @param   {String} mode "item", "list" or "head". Optional, and ignored if `type` is not given.
 * @return  {Object}
 *          <li>If neither `type` nor `mode` are given or if only `mode` is given, `this.options.filters` is returned.
 *          `this.options.filters` is an object containing all the view's data filters (indexed by type (e.g. "event")
 *          and mode ("item", "list" or "head")).</li>
 *          <li>If only `type` is given, the filters of the given type are returned.</li>
 *          <li>If both `type` and `mode` are given, the filter of the given type and mode is returned.</li>
 *          <li>If no filters matching `type`/ `mode` exist, `null` is returned.</li>
 * <p/>
 */
$.any.anyView.prototype.getFilter = function (type,mode)
{
  if (!this.options || !this.options.filters)
    return null;
  if (type && this.options.filters[type]) {
    if (mode && this.options.filters[type][mode])
      return this.options.filters[type][mode];
    return this.options.filters[type];
  }
  return this.options.filters;
}; // getFilter

/////////////////////////////////////////////////////////////////////////////////////////
//
// Internal methods
//
/////////////////////////////////////////////////////////////////////////////////////////

// Get a unique id to be used as a prefix for elements
$.any.anyView.prototype._createIdBase = function ()
{
  return "av" + 1 + Math.floor(Math.random()*10000000); // Pseudo-unique id
}; // _createIdBase

// Get filters, or create them if they dont exist yet
$.any.anyView.prototype._getOrCreateFilters = function (type,data)
{
  let f = this.options.filters;
  if (!type)
   type = this._findType(data);
  if (!type) {
    console.warn("No type specified, cannot create filters. ");
    return f;
  }
  // Return the filter for given type if we already have it in this.options
  if (f && f[type])
    return f;
  // Check if filter class for given type exists
  let f_str = type+"Filter";
  if (!window[f_str]) {
    let def_str = "anyFilter";
    //console.warn("Filter class "+f_str+" not found, using "+def_str+". ");
    f_str = def_str;
    // Check if default filter exists (it always should)
    if (!window[f_str]) {
      console.warn("Filter class "+f_str+" not found. No filter for "+type+". ");
      return f;
    }
  }
  // Create minimal working filter for given type
  let filt = new window[f_str]({type:type});
  if (!f)
    f = {};
  f[type] = filt.filters[type]; // Add new filters, but dont overwrite old ones
  filt = null;
  return f;
}; // _getOrCreateFilters

// Find the current type to use
$.any.anyView.prototype._findType = function (data,id,otype)
{
  let type = null;
  if (data) {
    // Data item exists, see if it has a specified type
    if (id || id === 0) {
      let d = data[id] ? data[id] : data["+"+id] ? data["+"+id] : null;
      if (d)
        type = d.list ? d.list : d.item ? d.item : d.head ? d.head : null;
    }
    if (!type)
      type = data.list ? data.list : data.item ? data.item : data.head ? data.head : null;
  }
  if (!type && otype)
    type = otype; // Set to previous type
  if (!type)
    type = this._findTypeFromData(data); // Find type from *_name element of data[0]
  if (!type && this.model)
    type = this.model.type; // Set to model type
  return type;
}; // _findType

// Try to determine type from *_name element of first item in data
$.any.anyView.prototype._findTypeFromData = function (data)
{
  if (data) {
    let ix = Object.keys(data)[0];
    if (ix) {
      for (let key in data[ix]) {
        if (data[ix].hasOwnProperty(key)) {
          let n = key.lastIndexOf("_");
          if (n != -1 && key.substring(0,n)) {
            return key.substring(0,n);
          }
        }
      }
    }
  }
  return "";
}; // _findTypeFromData

// Find the current mode to use
$.any.anyView.prototype._findMode = function (data,id)
{
  let mode = null;
  if (data) {
    // Data item exists, see if it has a specified mode
    if (id || id === 0) {
      let d = data[id] ? data[id] : data["+"+id] ? data["+"+id] : null;
      if (d)
        mode = d.list ? "list" : d.item ? "item" : d.head ? "head" : null;
    }
    if (!mode)
      mode = data.list ? "list" : data.item ? "item" : data.head ? "head" : null;
  }
  if (!mode) {
    // No mode specified, so fall back to default
    mode = this.options.defaultMode;
  }
  return mode;
}; // _findMode

// Set isEditable according to model's permissions
$.any.anyView.prototype._setPermissions = function ()
{
  if (this.options) {
    if (this.options.admin_always_edits) {
      let is_admin = this.model && this.model.permission && this.model.permission.is_admin;
      this.options.isEditable = this.options.isEditable || is_admin;
    }
    else
    if (this.model && this.model.permission && this.model.permission.isEditable) {
      this.options.isEditable = this.model.permission.isEditable;
    }
  }
}; // _setPermissions

/////////////////////////////////////////////////////////////////////////////////////////
//
// The onModelChange method
//
/////////////////////////////////////////////////////////////////////////////////////////

/**
 * Default callback method.
 * Calls `this.refresh` to refresh the view after the model has changed.
 * Normally, it is not neccessary to call this method directly.
 * Override in derived classes if necessary.
 *
 * @method  anyView.onModelChange
 * @param   {Object} model The model to refresh.
 *                   If not specified, the current model (`this.model`) is used.
 *                   If specified, `this.model` will be set to `model`, before calling `this.refresh`.
 * @return  {Object} `this`.
 */
$.any.anyView.prototype.onModelChange = function (model,params)
{
  if (model) {
    this.model = model;
    this._setPermissions(); // Model permissions may have changed
  }
  this.refresh(params);
  this.showMessages(model);
  return this;
}; // onModelChange

/////////////////////////////////////////////////////////////////////////////////////////
//
// Refreshments
//
/////////////////////////////////////////////////////////////////////////////////////////

// Calls the empty method of the (jQuery) element
$.any.anyView.prototype.empty = function (params)
{
  if (this.element)
    this.element.empty();
  else
    $("#"+this.options.id).empty();
}; // empty

/**
 * Displays data in a DOM element. If an element matching the type/mode/id combination
 * is found in the DOM, that element will be used for displaying the data. Otherwise,
 * new elements will be created as needed. The data may be given as `data`, contained in
 * `model` or, by default, in `this.model`. If `model` is given, `data` and `type` will
 * be ignored.
 *
 * @method anyView.refresh
 * @param {Object} params Undefined or an object which may contain these elements:
 *
 * @param {Object}  params.parent   The element in which to display data.
 *                                  Default: `this.element`.
 * @param {Object}  params.model    A model containing the data to display.
 *                                  Default: `this.model`.
 * @param {string}  params.type     The type of the data to display.
 *                                  Ignored if `model` is given.
 *                                  Default: "".
 * @param {string}  params.mode     The mode in which to display data ("list", "item" or "head").
 *                                  Default: "".
 * @param {Object}  params.data     The data to display / display from.
 *                                  Ignored if `model` is given.
 *                                  Default: `this.model.data` if `this.model` is set, null otherwise.
 * @param {string}  params.par_type The type of the data on the level above.
 *                                  Ignored if `model` is given, in which case `model.parent.type` is used.
 *                                  Default: "".
 * @param {string}  params.par_mode The mode of the data on the level above, or of `model.parent`, if `model`
 *                                  is given.
 *                                  Default: "".
 * @param {Object}  params.par_data The data on the level above `data`.
 *                                  Ignored if `model` is given, in which case `model.parent.data` is used.
 *                                  Default: null.
 * @param {string}  params.par_id   The id in `par_data` where `data` may be found (`par_data[par_id] == data`).
 *                                  Ignored if `model` is given, in which case `model.parent.id` is used.
 *                                  Default: null.
 * @param {boolean} params.edit     If true, the item should be displayed as editable.
 *                                  Default: false.
 * @param {integer} params.from     Pagination start.
 *                                  Default: 1.
 * @param {integer} params.num      Pagination number of elements.
 *                                  Default: `this.options.itemsPerPage`.
 *
 * @return this
 *
 * @throws {VIEW_AREA_MISSING} If both `parent` and `this.element` are null or undefined.
 */
$.any.anyView.prototype.refresh = function (params)
{
  if (params && params.reset_rec) {
    if (!this.options)
      this.options = {};
    this.options.ref_rec = 0; // Reset on every call to refresh
  }
  let parent   = params && params.parent   ? params.parent   : this.element;
  let model    = params && params.model    ? params.model    : this.model;
  let type     = params && params.type     ? params.type     : model                 ? model.type        : "";
  let data     = params && params.data     ? params.data     : model                 ? model.data        : null;
  let par_id   = params && params.par_id   ? params.par_id   : model                 ? model.link_id     : "";
  let mode     = params && params.mode     ? params.mode     : "";
  let par_type = params && params.par_type ? params.par_type : model && model.parent ? model.parent.type : "";
  let par_data = params && params.par_data ? params.par_data : model && model.parent ? model.parent.data : null;
  let par_mode = params && params.par_mode ? params.par_mode : "";
  let edit     = params && params.edit     ? params.edit     : false;
  let from     = params && params.from     ? params.from     : 1;
  let num      = params && params.num      ? params.num      : this.options.itemsPerPage;
  if (!type)
    type = this._findType(data); // Find type from *_name element of data[0]

  if (!parent)
    throw i18n.error.VIEW_AREA_MISSING;

  // See if we should clear the view area before displaying
  if (params && params.clear)
    this.clearBeforeRefresh();

  // See if we need a top close button (for item mode)
  if (this.options.item_opening && this.id_stack.length == 1)
    this.refreshCloseItemButton(params);

  // Find the filters to use if we don't have them already
  if (!this.options.filters || !this.options.filters[type])
    this.options.filters = this._getOrCreateFilters(type,data);

  if (this.preRefresh)
    this.preRefresh(params);

  if (data) {
    if (Object.size(data) !== 0) {
      let row_no     = 0;
      let prev_type  = type;
      let prev_mode  = mode;
      let the_parent = parent;
      let view       = this;
      if (mode == "head")
        ++this.data_level;
      // Display data: Loop over all entries and refresh views
      for (let id in data) {
        if (data.hasOwnProperty(id) && id != "id" && !id.startsWith("grouping") && !(id.startsWith("link-") && !this.options.showSublists)) {
          if (view) {
            // Find the type and mode of the current data item (default is the previous type/mode)
            let curr_type = view._findType(data,id,prev_type);
            let curr_mode = view._findMode(data,id);
            // See if we need to add to id_stack
            if (curr_mode == "head" || curr_mode == "item") {
              let idx = Number.isInteger(parseInt(id)) ? ""+parseInt(id) : id;
              this.id_stack.push(idx);
            }
            else
            if (curr_mode == "list" && prev_mode == "list" && prev_type != curr_type) {
              let idx = Number.isInteger(parseInt(par_id)) ? ""+parseInt(par_id) : par_id;
              this.id_stack.push(idx);
            }
            // Create the current id_str
            let id_str = this.id_stack.join('_');
            let new_view   = false;
            // Create new view whenever we encounter a new type or a new mode
            if ((prev_type != "" && prev_type != curr_type) ||
                (/*prev_mode != "" &&*/ prev_mode != curr_mode)) {
              // If the new type/mode is contained within a list, create a new row to contain a new parent container
              if (prev_mode == "list" && prev_type != curr_type &&
                  params.par_id != "+0" && params.par_id !== 0 // TODO! Not a good test
                  )
                the_parent = view._addContainerRow(parent,prev_type,prev_mode,curr_type,curr_mode,id_str);
              model = this.createModel({
                             type:     curr_type,
                             data:     data,
                             id:       curr_mode=="item" ? id : "",
                             par_type: par_type,
                             par_data: par_data,
                             par_id:   par_id,
                           });
              view  = this.createView({
                             model:    model,
                             id:       id,
                             parent:   the_parent,
                             id_str:   id_str,
                             par_mode: par_mode,
                           });
              if (view) {
                view.empty();
                this.views[id_str] = view;
                new_view = true;
              }
            }
            if (view) {
              view.id_stack = JSON.parse(JSON.stringify(this.id_stack));
              ++row_no;
              if (this.options && (!this.options.showPaginator || (from == -1 || from <= row_no && row_no < from + num))) {
                // If we have an item as (grand)parent, use its' type/data/id, not the immediate level above
                let it = this._findParentItemModel();
                if (it && it.id) {
                  par_type = it.type;
                  par_data = it.data;
                  par_id   = it.id;
                }
                // Refresh a header, a single list row or a single item
                view.refreshOne({
                       parent:   the_parent,
                       type:     curr_type,
                       mode:     curr_mode,
                       data:     data,
                       id:       id,
                       par_type: par_type,
                       par_mode: par_mode,
                       par_data: par_data,
                       par_id:   par_id,
                       edit:     edit,
                       row_no:   row_no,
                     });
                if (curr_mode == "list" && !view.rows_changed)
                  --row_no;
              }
            } // if view
            if (id_str && view) {
              // Refresh bottom toolbar for this view
              let p_id = view.element.attr("id");
              let p    = $("#"+p_id);
              view.refreshToolbarForView({
                     parent:   p,
                     type:     curr_type,
                     mode:     curr_mode,
                     data:     data,
                     par_type: par_type,
                     par_mode: par_mode,
                     par_data: par_data,
                     par_id:   par_id ? par_id : view.model.link_id,
                     id_str:   id_str,
                   });
              new_view = false;
            }
            if (curr_mode == "head" || curr_mode == "item")
              this.id_stack.pop();
            else
            if (curr_mode == "list" && prev_mode == "list" && prev_type != curr_type)
              this.id_stack.pop();
            prev_type = curr_type;
            prev_mode = curr_mode;
          } // if view
        } // if
      } // for
      if (mode == "head")
        --this.data_level;
    }
    else {
      let elm = $("#"+this.element[0].id);
      elm.empty();
    }
  } // if data
  else {
    // Arrive here if no data
    this.refreshNoData({
           parent:   parent,
           type:     type,
           mode:     mode,
           data:     null,
           id:       null,
           par_type: par_type,
           par_mode: par_mode,
           par_data: par_data,
           par_id:   par_id,
           edit:     edit,
         });
  }

  if (edit) // Initialize thirdparty components (tinymce, etc.)
    this.initComponents();

  // Clean up
  if (!parent.children().length)
    parent.children().remove();

  // Refresh bottom toolbar
  if (!model)
    model = this.model;
  if (this.options && this.options.showToolbar && !this.options.isSelectable &&
      this.options.data_level === 0 && this.id_stack.length === 0 && this.model &&
      (this.options.showMessages || this.options.showButtonNew || this.options.showButtonAddLinkItem || this.options.showButtonAddLinkGroup)) {
    this.refreshToolbarBottom({
           parent:   parent,
           type:     type,
           mode:     mode,
           data:     data,
           id:       this.model.id,
           par_type: par_type,
           par_mode: par_mode,
           par_data: par_data,
           par_id:   par_id,
           id_str:   "",
         });
  }

  if (this.postRefresh)
    this.postRefresh(params);

  // Bind key-back on tablets. TODO! Untested
  //document.addEventListener("backbutton", $.proxy(this._processKeyup,this), false);

  return this;
}; // refresh

$.any.anyView.prototype._findParentItemModel = function ()
{
  let cntdwn = ANY_MAX_REF_REC;
  let it = this.model;
  while (cntdwn-- && it) {
    if (it.id)
      break;
    it = it.parent;
  }
  return it;
}; // _findParentItemModel

// Called by refresh() if no data was given.
// Shows a new, empty item for entering data.
$.any.anyView.prototype.refreshNoData = function (params)
{
  //this.showItem({ data: params });
}; // refreshNoData

$.any.anyView.prototype.clearBeforeRefresh = function ()
{
  let e_id = this.element.attr("id");
  $("#"+e_id).empty();
  this.current_edit = null;
}; // clearBeforeRefresh

$.any.anyView.prototype._addContainerRow = function (parent,par_type,par_mode,curr_type,curr_mode,id_str)
{
  id_str = id_str.substr(0, id_str.lastIndexOf("_"));
  let the_parent = parent;
  let filter   = this.getFilter(par_type,par_mode);
  let num_cols = filter ? Object.size(filter) : 5;
  let row_id   = this.id_base+"_"+curr_type+"_"+curr_mode+"_"+id_str+"_tr";
  let new_tr   = $("<tr id='"+row_id+"'>"+
                   "<td colspan='"+num_cols+"' style='padding-left:"+this.options.indent_amount+"px;' class='any-td any-list-td'></td>"+
                   "</tr>");
  let tbody    = $("#"+this.id_base+"_"+par_type+"_"+par_mode+"_"+id_str+"_tbody");
  if (tbody.length) {
    tbody.append(new_tr);
    the_parent = tbody.find("#"+row_id).find("td");
  }
  else {
    let tr = $("#"+this.id_base+"_"+par_type+"_"+par_mode+"_"+id_str+"_tr");
    if (tr.length) {
      new_tr.insertAfter(tr);
      the_parent = new_tr.find("td");
    }
    else
      the_parent = $("<div id='"+row_id+"'></div>").appendTo(parent);
  }
  if (!the_parent.length)
    the_parent = parent;
  return the_parent;
}; // _addContainerRow

//
// Refresh header and data for one list entry or one item
//
$.any.anyView.prototype.refreshOne = function (params)
{
  if (!params || !this.options)
    return this;

  let parent = params.parent;
  let type   = params.type;
  let mode   = params.mode;
  let data   = params.data;
  let id     = params.id;
  let edit   = params.edit;

  // Find identifier strings for containers and rows
  let id_str = this.id_stack.join('_');
  let idx = Number.isInteger(parseInt(id))
            ? ""+parseInt(id)
            : id;
  let row_id_str = mode == "list"
                   ? id_str && id_str != ""
                     ? id_str+"_"+idx
                     : idx
                   : id_str;
  params.id_str     = id_str;
  params.row_id_str = row_id_str;

  // Refresh header
  let have_data  = data && Object.size(data[id]) > 0;
  let header_div = this.getOrCreateHeaderContainer({
                          parent:     parent,
                          type:       type,
                          mode:       mode,
                          id_str:     id_str,
                          have_data:  have_data,
                          doNotEmpty: false,
                        });
  params.grandparent = parent; // TODO! Fix for anyViewTabs remember-current-tab problem
  if (header_div && header_div.length)
    params.parent = header_div;
  this.refreshHeader(params);

  // Refresh data
  params.data_div  = this.getOrCreateDataContainer({
                            parent: parent,
                            type:   type,
                            mode:   mode,
                            id_str: id_str,
                          });
  params.table_div = this.getOrCreateTable({
                            parent: params.data_div,
                            type:   type,
                            mode:   mode,
                            id_str: id_str,
                          });
  this.refreshData(params);

  // If the data contains subdata, make a recursive call
  if (data) {
    let subdata = data[id] ? data[id] : data["+"+id] ? data["+"+id] : null;
    if (subdata && subdata.data && Object.size(subdata.data) > 0) {
      ++this.options.ref_rec;
      if (this.options.ref_rec > ANY_MAX_REF_REC) {
        this.options.ref_rec = 0;
        throw i18n.error.TOO_MUCH_RECURSION;
      }
      if (mode == "list")
        ++this.options.indent_level;
      subdata = subdata.data;
      this.refresh({
             parent:    params.data_div,
             type:      type,
             mode:      mode,
             data:      subdata,
             par_type:  type,
             par_mode:  mode,
             par_data:  data,
             par_id:    id,
             edit:      edit,
             reset_rec: false,
           });
      if (mode == "list")
        --this.options.indent_level;
    } // if subdata
  } // if data

  // Clean up
  if (header_div && !header_div.children().length)
    header_div.remove();
  if (params.data_div && !params.data_div.children().length)
    params.data_div.remove();
  if (params.table_div && (!params.table_div.children().length || !params.table_div.children("tbody").length || !params.table_div.children("tbody").children().length))
    params.table_div.remove();
  return this;
}; // refreshOne

//
// Display a toolbar for a new view
//
$.any.anyView.prototype.refreshToolbarForView = function (params)
{
  if (!params || !this.options)
    return null;

  let parent   = params.parent;
  let type     = params.type;
  let mode     = params.mode;
  let data     = params.data;
  let id_str   = params.id_str;
  let par_type = params.par_type;
  let par_mode = params.par_mode;
  let par_data = params.par_data;
  let par_id   = params.par_id;

  if (!parent || !parent.length || !type || mode != "item" ||
      par_type !== "group" || par_id === "nogroup" || par_id === "unknown" ||
      (type == "group" && par_type == "group"))
    return null;

  // Create container
  let div_id   = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_toolbar_view";
  let class_id = "any-toolbar-bottom any-toolbar any-toolbar-"+this.data_level;
  if ($("#"+div_id).length)
    $("#"+div_id).remove();
  let bardiv   = $("<div id='"+div_id+"' class='"+class_id+"'></div>");
  parent.append(bardiv);

  this.refreshAddLinkButton({
         parent: bardiv,
         type:   type,
         mode:   mode,
         data:   data,
         par_type: par_type,
         par_mode: par_mode,
         par_data: par_data,
         par_id:   par_id,
         id_str: id_str,
         edit:   true,
       });

  let nc = bardiv.children().length;
  if (!nc)
    bardiv.remove();
  return null;
}; // refreshToolbarForView

//
// Display a toolbar for messages and "new item" button.
// Also, if viewing a list-for-item, display an "add-to-group" button and/or an "add-to-item" button.
//
$.any.anyView.prototype.refreshToolbarBottom = function (params)
{
  if (!this.model || !params || !this.options)
    return null;

  let parent   = params.parent;
  let type     = params.type;
  let mode     = params.mode;
  let data     = params.data;
  let id       = params.id;
  let par_type = params.par_type;
  let par_mode = params.par_mode;
  let par_data = params.par_data;
  let par_id   = params.par_id;

  if (!parent || !type)
    return null;

  // Create container
  let div_id   = this.id_base+"_"+type+"_toolbar_bottom";
  let class_id = "any-toolbar-bottom any-toolbar any-toolbar-"+this.data_level;
  if ($("#"+div_id).length)
    $("#"+div_id).remove();
  let bardiv   = $("<div id='"+div_id+"' class='"+class_id+"'></div>");
  parent.append(bardiv);

  if ((this.options.showButtonAddLinkItem || this.options.showButtonAddLinkGroup) && data && id && data[id] &&
     (data[id].item || data[id].head && data[id].data && data[id].data[id] && data[id].data[id].item)) {
    // Create an "add link" button
    this.refreshAddLinkButton({
           parent: bardiv,
           type:   type,
           mode:   "item",
           data:   data,
           id:     id,
           par_type: par_type,
           par_mode: par_mode,
           par_data: par_data,
           par_id:   par_id,
           id_str: Number.isInteger(parseInt(id)) ? parseInt(id) : id,
           edit:   true,
         });
  }

  if (this.options.showMessages) {
    // Create a message area
    this.refreshMessageArea({
           parent: bardiv,
           type:   type,
           mode:   mode,
         });
    this.showMessages();
  }
  let new_type = null;
  if (data && data["+0"])
    new_type = data["+0"].group_type;
  else
  if (data && data[0])
    new_type = data[0].group_type;
  else
    new_type = this.model.type;
  if (!new_type)
    new_type = this.model.type;
  if (this.options.showButtonNew && new_type) {
    // Create a "new item"  button
    //console.log("New "+new_type);
    this.refreshNewItemButton({
           parent: bardiv,
           type:   new_type,
           mode:   "item",
           data:   data,
           id:     id, // Find a new id
           is_new: true,
         });
  }
  return bardiv;
}; // refreshToolbarBottom

//
// Display a message area
//
$.any.anyView.prototype.refreshMessageArea = function (params)
{
  if (!params)
    return null;

  let parent = params.parent;
  let mode   = params.mode;

  let div_id   = this.id_base+"_any_message";
  let class_id = "any-message any-"+mode+"-message any-message-"+this.data_level;
  let msgdiv = $("#"+div_id);
  if (msgdiv.length)
    msgdiv.empty();
  else
    msgdiv = $("<div id='"+div_id+"' class='"+class_id+"'></div>");
  parent.append(msgdiv);
  return msgdiv;
}; // refreshMessageArea

//
// Get the current header div, or create a new one if it does not exist
//
$.any.anyView.prototype.getOrCreateHeaderContainer = function (params)
{
  let parent     = params.parent;
  let type       = params.type;
  let mode       = params.mode;
  let id_str     = params.id_str;
  let haveData   = params.have_data;
  let doNotEmpty = params.doNotEmpty;

  if (!parent || !type || !this.options || !this.options.showHeader)
    return null;

  let div_id = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_header";
  let header_div = $("#"+div_id);
  if (header_div.length) {
    if (!doNotEmpty && header_div && header_div.length)
      header_div.empty();
  }
  else
  if (haveData && mode == "head") {
    // Create new header container if we have data
    let class_id = "any-header any-"+mode+"-header any-header-"+this.data_level;
    let pl       = this.options.indent_tables ? this.options.indent_level * this.options.indent_amount : 0;
    let pl_str   = pl > 0 ? "style='margin-left:"+pl+"px;'" : "";
    header_div   = $("<div id='"+div_id+"' class='"+class_id+"' "+pl_str+"></div>");
    parent.append(header_div);
  }
  return header_div;
}; // getOrCreateHeaderContainer

//
// Refresh the header for an object.
//
$.any.anyView.prototype.refreshHeader = function (params,skipName)
{
  if (!this.model || !params || !this.options || !this.options.showHeader)
    return null;

  let parent = params.parent;
  let type   = params.type;
  let mode   = params.mode;
  let data   = params.data;
  let id     = params.id;

  if (!parent || !parent.length || !data || (mode != "head" && !data.grouping))
    return null;

  // Get the correct filter
  if (!this.options.filters) {
    this.model.error = type.capitalize()+" "+mode+" "+i18n.error.FILTERS_MISSING;
    console.error(this.model.error);
    return null;
  }
  let fmode  = this.options.filters[type] && !this.options.filters[type]["head"] ? "list" : mode;
  let filter = this.options.filters[type] &&  this.options.filters[type][fmode]  ? this.options.filters[type][fmode]: null;
  if (!filter) {
    this.model.message = i18n.error.FILTER_NOT_FOUND.replace("%%", type+" "+mode+"");
    console.warn(this.model.message);
    return null;
  }
  // Create the header entries
  //if (params.id != "nogroup") // TODO! Temporary fix - unclear why we have to do this check!
  //  parent.empty();
  let d = data[id] ? data[id] : data["+"+id] ? data["+"+id] : null;
  let n = 0;
  for (let filter_id in filter) {
    if (filter.hasOwnProperty(filter_id)) {
      let name_key = this.model && this.model.name_key ? this.model.name_key : type+"_name";
      let dont_display = skipName && filter_id == name_key;
      if (d && d[filter_id] && !dont_display) {
        let filter_key = filter[filter_id];
        if (filter_key && filter_key.DISPLAY)
          this.refreshHeaderEntry(parent,d,filter_id,n++);
      }
    }
  }
  // Clean up
  if (!parent.children().length)
    parent.remove();
  return parent;
}; // refreshHeader

//
// Refresh a single header entry
//
$.any.anyView.prototype.refreshHeaderEntry = function (parent,data_item,filter_id,n)
{
  if (!parent || !data_item)
    return null;

  let stylestr = (n === 0) ? "style='display:inline-block;'" : "";
  let div = $("<div class='"+filter_id+"' "+stylestr+">"+data_item[filter_id]+"</div>");
  parent.append(div);
  return div;
}; // refreshHeaderEntry

//
// Refresh the data for an object.
//
$.any.anyView.prototype.refreshData = function (params)
{
  if (!params || !params.table_div)
    return null;

  let table_div  = params.table_div;
  let type       = params.type;
  let mode       = params.mode;
  let data       = params.data;
  let id         = params.id;
  let par_type   = params.par_type;
  let par_mode   = params.par_mode;
  let par_data   = params.par_data;
  let par_id     = params.par_id;
  let id_str     = params.id_str;
  let row_id_str = params.row_id_str;
  let edit       = params.edit;

  let extra_foot = this.getOrCreateDataFooter(table_div,type,mode,id_str);
  if (extra_foot) {
    this.refreshDataFooter({
           parent:     extra_foot,
           type:       type,
           mode:       mode,
           data:       data,
           par_data:   par_data,
           par_id:     par_id,
           par_type:   par_type,
           edit:       edit,
           id_str:     id_str,
           row_id_str: row_id_str,
         });
  }
  let thead = table_div.find("thead").length ? table_div.find("thead") : null;
  if (!thead) {
    thead = this.getOrCreateThead(table_div,type,mode,id_str);
    if (thead)
      this.refreshThead({
             parent:     thead,
             type:       type,
             mode:       mode,
             data:       data,
             par_data:   par_data,
             par_id:     par_id,
             par_type:   par_type,
             id_str:     id_str,
             row_id_str: row_id_str,
             edit:       edit,
           });
  }
  if (mode == "list" || mode == "item") {
    let tbody = this.getOrCreateTbody(table_div,type,mode,id_str);
    if (tbody) {
      this.rows_changed = this.refreshTbodyRow({
                                 parent:     tbody,
                                 type:       type,
                                 mode:       mode,
                                 data:       data,
                                 id:         id,
                                 par_type:   par_type,
                                 par_mode:   par_mode,
                                 par_data:   par_data,
                                 par_id:     par_id,
                                 id_str:     id_str,
                                 row_id_str: row_id_str,
                                 edit:       edit,
                                 row_no:     params.row_no,
                               });
    }
  }
  let tfoot = this.getOrCreateTfoot(table_div,type,mode,id_str);
  if (tfoot) {
    this.refreshTfoot({
           parent:   tfoot,
           type:     type,
           mode:     mode,
           data:     data,
           id:       id,
           par_data: par_data,
           par_id:   par_id,
           id_str:   id_str,
           edit:     edit,
         });
  }
  // Clean up
  if (extra_foot && !extra_foot.children().length)
    extra_foot.remove();
  return table_div;
}; // refreshData

//
// Get the current data div, or create a new one if it does not exist
//
$.any.anyView.prototype.getOrCreateDataContainer = function (params)
{
  let parent = params.parent;
  let type   = params.type;
  let mode   = params.mode;
  let id_str = params.id_str;

  if (!parent || !type || !this.options)
    return null;

  let div_id   = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_data";
  let data_div = $("#"+div_id);
  if (!data_div.length) {
    // Create new data container if we have data
    let class_id = "any-data any-"+mode+"-data any-data-"+this.data_level+" any-data-view";
    let pl       = this.options.indent_tables ? this.options.indent_level * this.options.indent_amount : 0;
    let pl_str   = pl > 0 ? "style='margin-left:"+pl+"px;'" : "";
    data_div     = $("<div id='"+div_id+"' class='"+class_id+"' "+pl_str+"></div>");
    parent.append(data_div);
  }
  return data_div;
}; // getOrCreateDataContainer

//
// Create a table, or find a table created previously
//
$.any.anyView.prototype.getOrCreateTable = function (params)
{
  let parent = params.parent;
  let type   = params.type;
  let mode   = params.mode;
  let id_str = params.id_str;

  if (!parent || !type)
    return null;

  let div_id = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_table";
  let table_div = $("#"+div_id); // Can we reuse list table?
  if (!table_div.length) {
    // Create the table
    let class_id = "any-table any-"+mode+"-table any-table-"+this.data_level;
    table_div = $("<table id='"+div_id+"' class='"+class_id+"'></table>");
    parent.prepend(table_div);
  }
  return table_div;
}; // getOrCreateTable

//
// Create a tbody, or find a tbody created previously
//
$.any.anyView.prototype.getOrCreateTbody = function (table,type,mode,id_str)
{
  if (!table || !type || !mode)
    return null;

  let div_id = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_tbody";
  let tbody_div = $("#"+div_id); // Can we reuse list tbody?
  if (!tbody_div.length) {
    let class_id = "any-"+mode+"-tbody any-tbody-"+this.data_level;
    tbody_div = $("<tbody id='"+div_id+"' class='"+class_id+"'></tbody>");
    table.append(tbody_div);
  }
  return tbody_div;
}; // getOrCreateTbody

//
// Create a thead, or find a thead created previously
//
$.any.anyView.prototype.getOrCreateThead = function (table,type,mode,id_str)
{
  if (!table || !type || !mode || mode != "list" || !this.options ||
      !this.options.showTableHeader)
    return null;

  let div_id = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_thead";
  let thead_div = $("#"+div_id);
  if (thead_div.length)
    thead_div.remove();
  thead_div = $("<thead id='"+div_id+"'></thead>");
  table.prepend(thead_div);
  return thead_div;
}; // getOrCreateThead

//
// Create a tfoot, or find a tfoot created previously
//
$.any.anyView.prototype.getOrCreateTfoot = function (table,type,mode,id_str)
{
  if (!table || !type || !mode || !this.options ||
      !this.options.showTableFooter ||
      mode != "list")
    return null;

  let div_id = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_tfoot";
  let tfoot_div = $("#"+div_id); // Can we reuse list tfoot?
  if (!tfoot_div.length) {
    tfoot_div = $("<tfoot id='"+div_id+"'></tfoot>");
    table.append(tfoot_div);
  }
  return tfoot_div;
}; // getOrCreateTfoot

//
// Create a special footer to contain pager, search box, etc.
//
$.any.anyView.prototype.getOrCreateDataFooter = function (table,type,mode,id_str)
{
  if (!table || !type || !mode || mode != "list")
    return null;

  let foot_div_id = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_datafooter";
  let foot_div = $("#"+foot_div_id); // Can we reuse datafooter?
  if (!foot_div.length) {
    foot_div = $("<div id='"+foot_div_id+"' class='table_datafooter'></div>");
    foot_div.insertAfter(table);
  }
  return foot_div;
}; // getOrCreateDataFooter

//
// Refresh a table header
//
$.any.anyView.prototype.refreshThead = function (params)
{
  if (!this.model || !params || ! params.parent || !this.options)
    return null;

  let thead      = params.parent;
  let type       = params.type;
  let mode       = params.mode;
  let data       = params.data;
  let id_str     = params.id_str;
  let row_id_str = params.id_str; // TODO! Check if this is correct when adding a new entry

  if (!this.options.filters) {
    this.model.error = type.capitalize()+" "+mode+" "+i18n.error.FILTERS_MISSING;
    console.error(this.model.error);
    return null;
  }
  let fmode = mode == "head" && this.options.filters[type] ? "list" : mode;
  let filter = this.options.filters[type] && this.options.filters[type][fmode] ? this.options.filters[type][fmode]: null;
  if (!filter) {
    this.model.message = i18n.error.FILTER_NOT_FOUND.replace("%%", type+" "+mode+"");
    console.warn(this.model.message);
    return null;
  }
  let add_opt = null;
  if (this.options.showButtonAdd && !this.options.isSelectable) {
    add_opt = {
      type:       type,
      mode:       mode,
      data:       data,
      id:         "new", // Find a new id
      par_data:   params.par_data,
      par_id:     params.par_id,
      par_type:   params.par_type,
      id_str:     id_str,
      row_id_str: row_id_str,
      filter:     filter,
      edit:       true,
      is_new:     true,
    };
  }
  let tr = $("<tr></tr>");
  thead.append(tr);
  // First tool cell for editable list
  if ((this.options.isSelectable && this.options.showButtonSelect == 1 && mode == "list") ||
      (this.options.isAddable    && this.options.showButtonAdd == 1) ||
      (this.options.isRemovable  && this.options.showButtonRemove == 1) ||
      (this.options.isEditable   && (this.options.showButtonEdit == 1 || this.options.showButtonUpdate == 1 ||  this.options.showButtonDelete == 1 || this.options.showButtonCancel == 1))) {
    let th = $("<th class='any-th any-list-th any-tools-first-th'></th>");
    if (add_opt && this.options.showButtonAdd == 1) {
      add_opt.parent = th;
      this.refreshAddButton(add_opt);
    }
    tr.append(th);
  }
  // Table header cells
  for (let filter_id in filter) {
    if (filter.hasOwnProperty(filter_id)) {
      let filter_key = filter[filter_id];
      if (filter_key && filter_key.DISPLAY) {
        let disp_str = filter_key.DISPLAY == 2 || filter_key.DISPLAY == "2"
                       ? "display:none;"
                       : "";
        let name_key = this.model.name_key
                       ? this.model.name_key
                       : type+"_name";
        let pl        = this.options.indent_level * this.options.indent_amount;
        let pl_str    = pl > 0 && filter_id == name_key ? "padding-left:"+pl+"px;" : "";
        let style_str = disp_str || pl_str ? "style='"+disp_str+pl_str+"'" : "";
        let sort_dir  = this.options.sortDirection == "ASC" ? "fas fa-sort-up" : "fas fa-sort-down";
        let sort_arr  = this.options.isSortable && this.options.sortBy == filter_id ? "&nbsp;<div class='"+sort_dir+"'/>" : "";
        let th = $("<th class='any-th any-list-th "+filter_id+"-th' "+style_str+">"+filter_key.HEADER+sort_arr+"</th>");
        tr.append(th);
        if (this.options.isSortable) {
          th.css("cursor","pointer");
        let fun = this.option("sortFunction")
                  ? this.option("sortFunction")
                  : this.sortTable;
          let th_opt = { table_id:   this.id_base+"_"+type+"_"+mode+"_"+id_str+"_table",
                         filter_id:  filter_id,
                         filter_key: filter_key,
                         type:       type,
                         par_id:     params.par_id,
                         par_type:   params.par_type,
                       };
          th.off("click").on("click",th_opt,$.proxy(fun,this));
        }
        else
          th.css("cursor","default");
      }
    }
  }
  // Last tool cell for editable list
  if ((this.options.isSelectable && this.options.showButtonSelect == 2 && mode == "list") ||
      (this.options.isAddable    && this.options.showButtonAdd == 2) ||
      (this.options.isRemovable  && this.options.showButtonRemove == 2) ||
      (this.options.isEditable   && (this.options.showButtonEdit == 2 || this.options.showButtonUpdate == 2 ||  this.options.showButtonDelete == 2 || this.options.showButtonCancel == 2))) {
    let th  = $("<th class='any-th any-list-th any-tools-last-th'></th>");
    if (add_opt && this.options.showButtonAdd == 2) {
      add_opt.parent = th;
      this.refreshAddButton(add_opt);
    }
    tr.append(th);
  }
  // Clean up
  if (!tr.children().length)
    tr.remove();
  if (!thead.children().length)
    thead.remove();
  return thead;
}; // refreshThead

//
// Refresh the table footer
//
$.any.anyView.prototype.refreshTfoot = function (params)
{
  if (!params || !params.parent || !params.id_str)
    return null;

  let tfoot  = params.parent;
  let type   = params.type;
  let mode   = params.mode;
  let id_str = params.id_str;

  id_str    = id_str.substr(0,id_str.lastIndexOf("_"));
  let tr_id = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_tr_foot";
  let tr    = $("#"+tr_id);
  if (!tr.length) {
    tr = $("<tr id='"+tr_id+"'></tr>");
    tfoot.append(tr);
  }
  let td_id = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_td_foot";
  let td    = $("#"+td_id);
  if (!td.length) {
    let f = this.getFilter(type,mode);
    let num_cols = f ? Object.size(f) : 5;
    td = $("<td colspan='"+num_cols+"' id='"+td_id+"' class='any-td any-td-list-foot'></td>");
    tr.append(td);
  }
  // Clean up
  if (!tr.children().length)
    tr.remove();
  if (!tfoot.children().length)
    tfoot.remove();
  return tfoot;
}; // refreshTfoot

//
// Refresh the extra table footer
//
$.any.anyView.prototype.refreshDataFooter = function (params)
{
  if (!params || !params.parent || !this.options)
    return null;
  if (!this.options.showPaginator && !this.options.showSearcher)
    return null;

  let extra_foot = params.parent;
  let type       = params.type;
  let mode       = params.mode;
  let data       = params.data;
  let id_str     = params.id_str;

  let num_results = 0;
  if (data && data.grouping_num_results)
    num_results = data.grouping_num_results;
  else {
    for (let id in data) {
      if (data.hasOwnProperty(id)) {
        if (!id.startsWith("grouping"))
          ++num_results;
      }
    }
  }
  if (this.options.showPaginator && num_results > this.options.itemsPerPage) {
    // Initialize paging
    let pager = extra_foot.data("pager");
    if (!pager) {
      if (extra_foot.anyPaginator) {
        pager = extra_foot.anyPaginator({
                   itemsPerPage: this.options.itemsPerPage,
                   onClick:      this.pageNumClicked,
                   context:      this, // onClick context
                   hideGoto:     true,
                   // Set in paginator options that are sent to onClick handler:
                   div_info: {
                     type:     type,
                     mode:     mode,
                     group_id: params.par_id, // TODO! Is this used?
                     id_str:   JSON.parse(JSON.stringify(this.id_stack)),
                   },
                });
        pager.numItems(num_results);
        pager.currentPage(this.options.currentPage);
        extra_foot.data("pager",pager);
        if (!pager.options.hideIfOne || num_results > pager.options.itemsPerPage)
          $("#"+pager.container_id).css("display","inline-block");
      }
      else
        console.warn("anyPaginator missing, cannot paginate data. ");
    }
  } // if
  if (this.options.showSearcher && num_results > this.options.itemsPerPage) {
    // Initialize searching if results span more than one page
    let searcher = extra_foot.data("searcher");
    if (!searcher) {
      let search_box_id = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_search_box";
      let search_box    = "Search: <input id='"+search_box_id+"' type='search' style='height:25px;min-height:25px;'>";
      let searcher_id = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_searcher_foot";
      searcher = $("<div id='"+searcher_id+"' style='display:inline-block;float:right;padding-top:10px;'>"+search_box+"</div>"); // TODO! CSS
      extra_foot.append(searcher);
      let search_opt = { data:   data,
                         type:   type,
                         inp_id: search_box_id,
                       };
      searcher.off("keypress").on("keypress", search_opt, $.proxy(this._processSearch,this));
    }
    extra_foot.data("searcher",searcher);
  } // if
  return extra_foot;
}; // refreshDataFooter

//
// Refresh a single table row.
// Return table row (if list) or body (if item), or null on error.
//
$.any.anyView.prototype.refreshTbodyRow = function (params)
{
  if (!params)
    return null;

  if (params.mode == "list")
    return this.refreshListTableDataRow(params);
  if (params.mode == "item")
    return this.refreshItemTableDataRow(params);
  return null;
}; // refreshTbodyRow

// Return table row, or null on error
$.any.anyView.prototype.refreshListTableDataRow = function (params)
{
  if (!this.model || !params || !this.options)
    return null;

  let tbody      = params.parent;
  let type       = params.type;
  let mode       = params.mode;
  let data       = params.data;
  let id         = params.id;
  let par_type   = params.par_type;
  let par_mode   = params.par_mode;
  let par_data   = params.par_data;
  let par_id     = params.par_id;
  let edit       = params.edit;
  let id_str     = params.id_str;
  let row_id_str = params.row_id_str;

  if (!tbody || !data || !data[id])
    return null;

  if (!this.options.filters) {
    this.model.error = type.capitalize()+" "+mode+" "+i18n.error.FILTERS_MISSING;
    console.error(this.model.error);
    return null;
  }
  let filter = this.options.filters[type] && this.options.filters[type][mode]
               ? this.options.filters[type][mode]
               : null;
  if (!filter) {
    if (mode == "list" && this.options.filters[type])
      filter = this.options.filters[type]["list"];
    if (!filter) {
      this.model.message = i18n.error.FILTER_NOT_FOUND.replace("%%", type+" "+mode+"");
      console.warn(this.model.message);
      return null;
    }
  }

  let d = data[id] ? data[id] : data["+"+id];
  let row_has_data = this._rowHasData(d,filter);
  if (!row_has_data)
    return null; // Nothing to display

  let odd_even = this.options.useOddEvenRows && params.row_no
                 ? params.row_no%2
                   ? "class='any-rows-even'"
                   : "class='any-rows-odd'"
                 : "";
  let tr_id  = this.id_base+"_"+type+"_"+mode+"_"+row_id_str+"_tr";
  let tr = $("#"+tr_id);
  if (tr.length) {
    let td_ids = tr_id+" > td";
    $("#"+td_ids).remove(); // Do not remove the tr tag, only the contents TODO! Should we use detach or empty instead of remove?
  }
  else {
    tr = $("<tr id='"+tr_id+"'"+odd_even+"></tr>");
    tbody.append(tr);
  }
  let cell_opt = {
    parent:     tr,
    type:       type,
    mode:       mode,
    data:       data,
    id:         id,
    par_type:   par_type,
    par_mode:   par_mode,
    par_data:   par_data,
    par_id:     par_id,
    id_str:     id_str,
    row_id_str: row_id_str,
    edit:       edit,
    filter:     filter,
    row_no:     params.row_no,
  };
  this.refreshTableDataFirstCell(cell_opt);
  this.refreshTableDataListCells(cell_opt);
  this.refreshTableDataLastCell(cell_opt);
  if (this.options.showRowIngress)
    this.refreshTableDataIngress(cell_opt);
  // Clean up
  if (!tr.children().length || (!row_has_data && !this.options.showEmptyRows))
    tr.remove();
  return tr;
}; // refreshListTableDataRow

$.any.anyView.prototype.refreshTableDataListCells = function (params)
{
  if (!params)
    return false;

  let tr         = params.parent;
  let type       = params.type;
  let mode       = params.mode;
  let data       = params.data;
  let id         = params.id;
  let par_data   = params.par_data;
  let par_id     = params.par_id;
  let id_str     = params.id_str;
  let row_id_str = params.row_id_str;
  let edit       = params.edit;
  let filter     = params.filter;

  if (!filter || !tr|| !data || !data[id])
    return false;
  let pl     = this.options.indent_level * this.options.indent_amount;
  let pl_str = pl > 0 ? "padding-left:"+pl+"px;" : "";
  let n = 0;
  for (let filter_id in filter) {
    if (filter.hasOwnProperty(filter_id) && filter_id != type+"_ingress") {
      let filter_key = filter[filter_id];
      if (filter_key && filter_key.DISPLAY) {
        let model_str = params.filter
                        ? params.filter[filter_id].MODEL
                        : null;
        let disp_str = filter_key.DISPLAY == 2 || filter_key.DISPLAY == "2"
                       ? "display:none;"
                       : "";
        ++n;
        let td_id    = this.id_base+"_"+type+"_"+mode+"_"+row_id_str+"_"+filter_id;
        let odd_even = this.options.useOddEvenColums
                       ? n%2
                         ? "any-cols-even"
                         : "any-cols-odd"
                       : "";
        let class_id = "any-list-"+filter_id;
        let pln_str  = this.model.name_key
                       ? filter_id == this.model.name_key  ? pl_str : ""
                       : filter_id == type+"_name"         ? pl_str : "";
        let style_str = disp_str || pln_str ? "style='"+disp_str+pln_str+"'" : "";
        let td  = $("<td id='"+td_id+"' class='any-td any-list-td "+odd_even+" "+class_id+"' "+style_str+"></td>");
        tr.append(td);
        let lists = filter_key.TYPE == "list" && data[id] && data[id].data ? data[id].data["link-"+filter_key.LIST] : null;
        let str = this.getCellEntryStr(id,type,mode,row_id_str,filter_id,filter_key,data[id],lists,edit,model_str,td);
        if (typeof str == "string")
          td.append(str);
        this.initTableDataCell(td_id,type,mode,data,id,id_str,row_id_str,filter,filter_id,filter_key,edit,n,par_data,par_id);
      }
    }
  }
  return true;
}; // refreshTableDataListCells

$.any.anyView.prototype.refreshTableDataIngress = function (params)
{
  if (!params || !params.data)
    return false;

  let tr         = params.parent;
  let type       = params.type;
  let mode       = params.mode;
  let data       = params.data;
  let id         = params.id;
  let par_data   = params.par_data;
  let par_id     = params.par_id;
  let id_str     = params.id_str;
  let row_id_str = params.row_id_str;
  let edit       = params.edit;
  let filter     = params.filter;
  let filter_id  = type+"_ingress";
  let filter_key = filter[filter_id];

  if (data[id] && data[id][filter_id]) {
    let lists = filter_key.TYPE == "list" && data[id] && data[id].data ? data[id].data["link-"+filter_key.LIST] : null;
    let str = this.getCellEntryStr(id,type,mode,row_id_str,filter_id,filter_key,data[id],lists,edit);
    let ncells = Object.size(data[id]);
    let odd_even = this.options.useOddEvenRows && params.row_no
                   ? params.row_no%2
                     ? "class='any-rows-even'"
                     : "class='any-rows-odd'"
                   : "";
    let tr_id2 = this.id_base+"_"+type+"_"+mode+"_"+row_id_str+"_tr_ingress";
    $("#"+tr_id2).remove();
    let tr2    = $("<tr id='"+tr_id2+"' "+odd_even+"><td/><td colspan='"+ncells+"' class='any-list-ingress' style='font-size:90%;'>"+str+"</td><td/></tr>");
    tr2.insertAfter(tr);
  }
}; // refreshTableDataIngress

// Return table body, or null on error
$.any.anyView.prototype.refreshItemTableDataRow = function (params)
{
  if (!this.model || !params || !this.options)
    return null;

  let tbody      = params.parent;
  let type       = params.type;
  let mode       = params.mode;
  let data       = params.data;
  let id         = params.id;
  let par_data   = params.par_data;
  let par_id     = params.par_id;
  let id_str     = params.id_str;
  let row_id_str = params.row_id_str;
  let edit       = params.edit;

  if (!tbody || !data || (!data[id] && !data["+"+id]))
    return null;

  if (!this.options.filters) {
    this.model.error = type.capitalize()+" "+mode+" "+i18n.error.FILTERS_MISSING;
    console.error(this.model.error);
    return null;
  }
  let filter = this.options.filters[type] && this.options.filters[type][mode]
               ? this.options.filters[type][mode]
               : null;
  if (!filter) {
    this.model.message = i18n.error.FILTER_NOT_FOUND.replace("%%", type+" "+mode+"");
    console.warn(this.model.message);
    return null;
  }

  let d = data[id] ? data[id] : data["+"+id];
  let row_has_data = this._rowHasData(d,filter);
  if (!row_has_data)
    return null; // Nothing to display

  let pl     = this.options.indent_level * this.options.indent_amount;
  let pl_str = pl > 0 ? "style='padding-left:"+pl+"px;'" : "";
  let n = 0;
  let is_hidden = false;
  tbody.empty();
  for (let filter_id in filter) {
    if (filter.hasOwnProperty(filter_id) && filter_id != type+"_ingress") {
      let filter_key = filter[filter_id];
      if (filter_key && filter_key.DISPLAY) {
        ++n;
        // Hidden rows?
        let display_class = is_hidden ? "class='hiddenToggle'" : "";
        if (filter_id == "_HIDEEND_") {
          is_hidden = false;
          continue;
        }
        else
        if (filter_id == "_HIDEBEGIN_") {
          is_hidden = (id !== null && id != undefined);
          if (is_hidden && edit) {
            let tr = $("<tr "+display_class+"></tr>");
            let td = $("<td/><td colspan='2' class='td_item'>"+
                       "<span id='"+this.id_base+"_"+type+"_"+mode+"_"+row_id_str+"_"+filter_key.TYPE+"' class='pointer hiddenText'>"+
                       filter_key.HEADER+
                       "</span>"+
                       "</td>");
            tr.append(td);
            tbody.append(tr);
            let params   = { panel_id:   this.id_base+"_"+type+"_"+mode+"_"+row_id_str+"_"+filter_key.TYPE,
                             start_text: filter_key.HEADER,
                             end_text:   filter_key.HEADER2,
                           };
            $("#"+params.panel_id).off("click");
            $("#"+params.panel_id).on("click",params,
                function(event)
                {
                  if (!event || !event.data) {
                    console.warn(i18n.error.DATA_MISSING);
                    return;
                  }
                  let elem_id = "#"+event.data.panel_id;
                  if ($(elem_id).text() == event.data.start_text) {
                    $(elem_id).text(event.data.end_text);
                    $(".hiddenToggle").css("display","table-row");
                  }
                  else {
                    $(elem_id).text(event.data.start_text);
                    $(".hiddenToggle").css("display","none");
                  }
                }
            );
          }
          continue;
        }
        // Normal row:
        let tr = $("<tr "+display_class+"></tr>");
        tbody.append(tr);
        let cell_opt = {
          parent:     tr,
          type:       type,
          mode:       mode,
          data:       data,
          id:         id,
          par_data:   par_data,
          par_id:     par_id,
          id_str:     id_str,
          row_id_str: row_id_str,
          edit:       edit,
          filter:     filter,
          // The options below are only used by refreshTableDataItemCells
          filter_id:  filter_id,
          filter_key: filter_key,
          pl_str:     pl_str,
          n:          n,
        };
        this.refreshTableDataFirstCell(cell_opt);
        this.refreshTableDataItemCells(cell_opt);
        this.refreshTableDataLastCell(cell_opt);
        if (!tr.children().length)
          tr.remove();
      }
    }
  } // for
  return tbody;
}; // refreshItemTableDataRow

$.any.anyView.prototype.refreshTableDataItemCells = function (params)
{
  if (!params)
    return false;

  let tr         = params.parent;
  let type       = params.type;
  let mode       = params.mode;
  let data       = params.data;
  let id         = params.id;
  let par_data   = params.par_data;
  let par_id     = params.par_id;
  let id_str     = params.id_str;
  let row_id_str = params.row_id_str;
  let edit       = params.edit;
  let filter     = params.filter;
  let filter_id  = params.filter_id;
  let filter_key = params.filter_key;
  let pl_str     = params.pl_str;
  let n          = params.n;
  let model_str  = params.filter ? params.filter[filter_id].MODEL : null;
  let view_str   = params.filter ? params.filter[filter_id].VIEW  : null;

  let class_id_name = "any-item-name-"+filter_id;
  let class_id_val  = "any-item-val-"+filter_id;
  let td_id         = this.id_base+"_"+type+"_"+mode+"_"+row_id_str+"_"+filter_id;
  let td2           = null;
  let td3           = null;
  if (filter_key.DISPLAY == 1) {
    td2 = $("<td "+             "class='any-td any-item-name "+class_id_name+"' "+pl_str+">"+filter_key.HEADER+"</td>");
    td3 = $("<td id= '"+td_id+"' class='any-td any-item-val  "+class_id_val +"'></td>");
    tr.append(td2);
  }
  else {
    let brk = filter[filter_id].HEADER ? "<br/>" : "";
    td3 = $("<td id= '"+td_id+"' class='any-td any-item-val  "+class_id_val +"' colspan='2'>"+"<div class='"+class_id_name+"'>"+filter_key.HEADER+brk+"</div>"+"</td>");
  }
  tr.append(td3);
  let lists = filter_key.TYPE == "list" && data[id] && data[id].data ? data[id].data["link-"+filter_key.LIST] : null;
  let str = this.getCellEntryStr(id,type,mode,row_id_str,filter_id,filter_key,data[id],lists,edit,model_str,view_str,td3);
  if (typeof str == "string")
    td3.append(str);
  this.initTableDataCell(td_id,type,mode,data,id,id_str,row_id_str,filter,filter_id,filter_key,edit,n,par_data,par_id);
  return true;
}; // refreshTableDataItemCells

$.any.anyView.prototype.refreshTableDataFirstCell = function (params)
{
  if (!params)
    return false;
  if (!((this.options.isSelectable && this.options.showButtonSelect == 1 && params.mode == "list") ||
        (this.options.isAddable    && this.options.showButtonAdd == 1) ||
        (this.options.isRemovable  && this.options.showButtonRemove == 1) ||
        (this.options.isEditable   && (this.options.showButtonEdit == 1 || this.options.showButtonUpdate == 1 ||  this.options.showButtonDelete == 1 || this.options.showButtonCancel == 1))))
   return false;

  let tr         = params.parent;
  let type       = params.type;
  let mode       = params.mode;
  let data       = params.data;
  let id         = params.id;
  let par_type   = params.par_type;
  let par_mode   = params.par_mode;
  let par_data   = params.par_data;
  let par_id     = params.par_id;
  let id_str     = params.id_str;
  let row_id_str = params.row_id_str;
  let edit       = params.edit;
  let filter     = params.filter;

  let first = true;
  let td_id  = this.id_base+"_"+type+"_"+mode+"_"+row_id_str+"_edit"; // First tool cell
  if ($("#"+td_id).length)
    if (mode != "item")
      $("#"+td_id).remove();
    else
      first = false;
  let td = $("<td id='"+td_id+"' class='any-td any-td-first'></td>");
  tr.append(td);
  if (!first)
    return;

  let first_opt = {
    parent:     td,
    type:       type,
    mode:       mode,
    data:       data,
    id:         id,
    par_type:   par_type,
    par_mode:   par_mode,
    par_data:   par_data,
    par_id:     par_id,
    id_str:     id_str,
    row_id_str: row_id_str,
    filter:     filter,
  };
  if (this.options.isSelectable && this.options.showButtonSelect==1 && mode == "list") {
    let checked = this.options.select.has(parseInt(id));
    first_opt.checked = checked;
    this.refreshSelectButton(first_opt);
  }
  else {
    first_opt.edit = edit;
    if (this.options.isEditable && this.options.showButtonEdit==1 && !edit) {
      this.refreshEditButton(first_opt);
    }
    if (this.options.isEditable && this.options.showButtonUpdate==1 && edit) {
      first_opt.is_new   = data && data[id] ? data[id].is_new : false;
      first_opt.new_data = data;
      first_opt.data     = null;
      this.refreshUpdateButton(first_opt);
    }
    if (this.options.isEditable || edit ||
        (this.options.isRemovable && this.options.showButtonRemove==1) ||
        (this.options.isDeletable && this.options.showButtonDelete==1)) {
      if (this.options.showButtonRemove==1 && this.options.isRemovable && id && mode == "list")
        this.refreshRemoveButton(first_opt);
      if (this.options.showButtonDelete==1 && this.options.isDeletable && id)
        this.refreshDeleteButton(first_opt);
      if (this.options.showButtonCancel==1 && edit)
        this.refreshCancelButton(first_opt);
    }
  }
  return true;
}; // refreshTableDataFirstCell

$.any.anyView.prototype.refreshTableDataLastCell = function (params)
{
  if (!params)
    return false;
  if (!((this.options.isSelectable && this.options.showButtonSelect == 2 && params.mode == "list") ||
        (this.options.isAddable    && this.options.showButtonAdd == 2) ||
        (this.options.isRemovable  && this.options.showButtonRemove == 2) ||
        (this.options.isEditable   && (this.options.showButtonEdit == 2 || this.options.showButtonUpdate == 2 ||  this.options.showButtonDelete == 2 || this.options.showButtonCancel == 2))))
   return false;

  let tr         = params.parent;
  let type       = params.type;
  let mode       = params.mode;
  let data       = params.data;
  let id         = params.id;
  let par_type   = params.par_type;
  let par_mode   = params.par_mode;
  let par_data   = params.par_data;
  let par_id     = params.par_id;
  let id_str     = params.id_str;
  let row_id_str = params.row_id_str;
  let edit       = params.edit;
  let filter     = params.filter;

  let first = true;
  let td_id  = this.id_base+"_"+type+"_"+mode+"_"+row_id_str+"_unedit"; // Last tool cell
  if ($("#"+td_id).length)
    if (mode != "item")
      $("#"+td_id).remove();
    else
      first = false;
  let td = $("<td id='"+td_id+"' class='any-td any-td-last'></td>");
  tr.append(td);
  if (!first)
    return;
  if (this.options.isSelectable && mode == "list") {
  }
  else {
    if (this.options.isEditable || this.options.isRemovable || edit) {
      let last_opt = {
        parent:     td,
        type:       type,
        mode:       mode,
        data:       data,
        id:         id,
        par_type:   par_type,
        par_mode:   par_mode,
        par_data:   par_data,
        par_id:     par_id,
        id_str:     id_str,
        row_id_str: row_id_str,
        edit:       edit,
        filter:     filter,
      };
      if (this.options.showButtonRemove==2 && this.options.isRemovable && id && mode == "list" && !edit)
        this.refreshRemoveButton(last_opt);
      if (this.options.showButtonDelete==2 && this.options.isDeletable && id)
        this.refreshDeleteButton(last_opt);
      if (this.options.showButtonCancel==2 && edit)
        this.refreshCancelButton(last_opt);
    }
  }
  return true;
}; // refreshTableDataLastCell

// Helper function for refreshListTableDataRow and refreshItemTableDataRow
$.any.anyView.prototype._rowHasData = function (data,filter)
{
  let row_has_data = false;
  for (let filter_id in filter) {
    if (filter.hasOwnProperty(filter_id)) {
      let filter_key = filter[filter_id];
      if (filter_key && filter_key.DISPLAY) {
        row_has_data = data && data[filter_id] != undefined;
        if (row_has_data)
          break;
      }
    }
  }
  return row_has_data;
}; // _rowHasData

/////////////////////////////////////////////////////////////////////////////////////////
//
// Table data cell initialization
//
/////////////////////////////////////////////////////////////////////////////////////////

$.any.anyView.prototype.initTableDataCell = function (td_id,type,mode,data,id,id_str,row_id_str,filter,filter_id,filter_key,edit,n,par_data,par_id)
{
  if (!filter_key || !td_id)
    return;

  let init_opt = {
    element_id: td_id,
    type:       type,
    mode:       mode,
    data:       data,
    id:         id,
    par_data:   par_data,
    par_id:     par_id,
    id_str:     id_str,
    row_id_str: row_id_str,
    edit:       edit,
    filter:     filter,
    filter_id:  filter_id,
    options:    this.options,
  };
  // Bind a method that is called while clicking on the text link, file view or file name (in non-edit mode)
  if (["link", "upload", "fileview"].includes(filter_key.TYPE)) {
    let link_elem = $("#"+td_id);
    if (link_elem.length) {
      if (this.options.isSelectable) {
        let fun = this.options.localSelect
                  ? this.options.localSelect
                  : this._toggleChecked;
        link_elem.off("click").on("click",init_opt, $.proxy(fun,this));
      }
      else {
        if (filter_key.TYPE == "upload") {
          // File select link in edit mode opens file select dialog
          let inp_id = td_id+"_upload";
          let inp_elem = $("#"+inp_id);
          if (inp_elem.length) {
            let self = this;
            let fun = this.options.localUpload
                      ? this.options.localUpload
                      : this._uploadClicked;
            init_opt.elem_id = td_id;
            inp_elem.off("click").on("click", init_opt,
              // Only open file dialog if cell is being edited
              function(e) {
                if (!self.options.uploadDirect && !e.data.edit) e.preventDefault();
              }
            );
            inp_elem.off("change").on("change", init_opt, $.proxy(fun,this));
          }
        }
        else
        if (filter_key.TYPE == "fileview") {
          // File view link opens the file in a new window
          let inp_id = td_id+"_fileview";
          let inp_elem = $("#"+inp_id);
          if (inp_elem.length) {
            let fun = this.options.localFileview
                      ? this.options.localFileview
                      : this._fileViewClicked;
            init_opt.elem_id = td_id;
            inp_elem.off("click").on("click", init_opt, $.proxy(fun,this));
          }
        }
        else
        if (!edit) {
          // A link click in non-edit mode opens the item view window
          let fun = this.options.itemLinkClicked
                    ? this.options.itemLinkClicked
                    : this.itemLinkClicked;
          let con = this.option("clickContext")
                    ? this.option("clickContext")
                    : this.option("context")
                      ? this.option("context")
                      : this;
          init_opt.showHeader = true; // TODO! Perhaps not the right place to do this
          link_elem.off("click").on("click", init_opt, $.proxy(fun,con));
          $("#"+td_id).prop("title", "Open item view"); // TODO i18n
        }
      } // else
    } // if link_elem.length
  }
  // Find the element to work with
  let inp_id = td_id+" .itemEdit";
  let inp_elem = $("#"+inp_id);
  if (!inp_elem.length) {
    inp_id = td_id+" .itemUnedit";
    inp_elem = $("#"+inp_id);
    if (!inp_elem.length)
      return;
  }
  // Set numerical filter for number fields
  if (filter_key.TYPE == "number") {
    inp_elem.inputFilter(function(value) {
                           return /^\d*\.?\d*$/.test(value);
                         }
                        ); // Allow digits and '.' only
  }
  // Bind a function to be called when clicking/pressings the element
  if (filter_key.FUNCTION) {
    let func_name = filter_key.FUNCTION;
    let func = isFunction(this[func_name])
               ? this[func_name] // Method in view class
               : isFunction(this.model[func_name])
                 ? this.model[func_name] // Method in model class
                 : isFunction(window[func_name])
                   ? window[func_name] // Normal function
                   : null; // Function not found
    let con  = isFunction(this[func_name])
               ? this // Method in view class
               : isFunction(this.model[func_name])
                 ? this.model // Method in model class
                 : isFunction(window[func_name])
                   ? window // Normal function
                   : null; // Function not found
    if (func && con)
      inp_elem.on("click", init_opt, $.proxy(func,con));
    else
      console.warn("Couldnt bind "+func_name+" on "+filter_key.TYPE+" element. ");
  }
  // Bind some keyboard events in edit mode
  if (edit && ["link","text","number","password","date"].indexOf(filter_key.TYPE) > -1) {
    this.bindTableDataCellEdit(inp_elem,init_opt);
  }
  // Set focus to first editable text field and make sure cursor is at the end of the field
  if ((this.options.isEditable || this.options.isAddable) && edit && n==1) {
    inp_elem.trigger("focus");
    let tmp = inp_elem.val();
    inp_elem.val("");
    inp_elem.val(tmp);
  }
}; // initTableDataCell

$.any.anyView.prototype.bindTableDataCellEdit = function (elem,params)
{
  // Bind enter key
  elem.off("keyup").on("keyup",     params, $.proxy(this._processKeyup,this));
  elem.off("keydown").on("keydown", params, $.proxy(this._processKeyup,this)); // For catching the ESC key on Vivaldi
}; // bindTableDataCellEdit

/////////////////////////////////////////////////////////////////////////////////////////
//
// Buttons
//
/////////////////////////////////////////////////////////////////////////////////////////

// Create a button for closing item view
// By default calls closeItem
$.any.anyView.prototype.refreshCloseItemButton = function (opt)
{
  if (!opt)
    return null;

  let parent = opt.parent ? opt.parent : null;
  let type   = opt.type   ? opt.type   : null;
  let mode   = opt.mode   ? opt.mode   : null;

  if (!parent || !type || !mode)
    return null;

  // Create cancel/close button for item view
  let new_opt = {
    type:     type,
    mode:     mode,
    edit:     false,
    top_view: this.options.top_view,
  };
  let tit_str = i18n.button.buttonClose;
  //let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.id_base+"_cancel_new_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let btn = $("<div id='"+btn_id+"' class='any-tool-cancel any-tool-button pointer' title='"+tit_str+"'>"+
              //tit_str+
              //btn_str+
              "<i class='far fa-window-close fa-lg'></i>"+
              "</div>");
  let fun = this.option("localCloseItem")
            ? this.option("localCloseItem")
            : this.closeItem;
  let con = this.option("closeContext")
            ? this.option("closeContext")
            : this.option("context")
              ? this.option("context")
              : this;
  btn.off("click").on("click",new_opt,$.proxy(fun,con));
  if (parent && parent.length)
    parent.prev().prepend(btn);
  this.options.item_opening = false;
  return btn;
}; // refreshCloseItemButton

// Create an add button
// By default calls addListEntry
$.any.anyView.prototype.refreshAddButton = function (opt)
{
  if (!opt)
    return null;

  let parent  = opt.parent;
  let id_str  = opt.id_str;

  let tit_str = i18n.button.buttonAddToList.replace("%%",opt.type);
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.id_base+"_"+opt.type+"_"+opt.mode+"_"+id_str+"_new_line_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let btn = $("<div id='"+btn_id+"' style='display:inline-block;' class='any-tool-add any-tool-button pointer' title='"+tit_str+"'>"+
              "<i class='fa fa-plus'></i>"+
              btn_str+
              "</div>");
  let fun = this.option("localAdd")
            ? this.option("localAdd")
            : this.addListEntry;
  let con = this.option("addContext")
            ? this.option("addContext")
            : this.option("context")
              ? this.option("context")
              : this;
  btn.off("click").on("click", opt, $.proxy(fun,con));
  if (parent && parent.length)
    parent.append(btn);
  return btn;
}; // refreshAddButton

// Create a select button
// By default calls _toggleChecked
$.any.anyView.prototype.refreshSelectButton = function (opt)
{
  if (!opt)
    return null;

  let parent  = opt.parent;
  let id_str  = opt.row_id_str;

  let tit_str = i18n.button.buttonSelect;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.id_base+"_"+opt.type+"_"+opt.mode+"_"+id_str+"_select_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let check_str = opt.checked
                  ? "<i class='fa-regular fa-square-check'></i>"
                  : "<i class='fa-regular fa-square'></i>";
  let btn = $("<div id='"+btn_id+"' style='display:inline-block;' class='any-select-icon any-icon pointer' title='"+tit_str+"'>"+
              "<span class='check'>"+check_str+"</span>"+
              btn_str+
              "</div>");
  if (parent && parent.length)
    parent.append(btn);
  let fun = this.option("localSelect")
            ? this.option("localSelect")
            : this._toggleChecked;
  let con = this.option("selectContext")
            ? this.option("selectContext")
            : this.option("context")
              ? this.option("context")
              : this;
  btn.off("click").on("click",opt,$.proxy(fun,con));
  return btn;
}; // refreshSelectButton

// Create an edit button
// Only displayed if not editing
// By default calls toggleEdit
$.any.anyView.prototype.refreshEditButton = function (opt)
{
  if (!opt)
    return null;

  let parent  = opt.parent;
  let id_str  = opt.row_id_str;

  let tit_str = i18n.button.buttonEdit;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.id_base+"_"+opt.type+"_"+opt.mode+"_"+id_str+"_edit_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let btn = $("<div id='"+btn_id+"' class='any-edit-icon any-icon pointer' title='"+tit_str+"'>"+
              "<i class='fas fa-pencil-alt'></i>"+  // TODO! CSS
              btn_str+
              "</div>");
  if (parent && parent.length)
    parent.append(btn);
  if (opt.edit)
    btn.hide();
  let fun = this.option("localEdit")
            ? this.option("localEdit")
            : this.toggleEdit;
  let con = this.option("editContext")
            ? this.option("editContext")
            : this.option("context")
              ? this.option("context")
              : this;
  btn.off("click").on("click",opt,$.proxy(fun,con));
  return btn;
}; // refreshEditButton

// Create an update button
// Only displayed if editing
// By default calls dbUpdate
$.any.anyView.prototype.refreshUpdateButton = function (opt)
{
  if (!opt)
    return null;

  let parent  = opt.parent;
  let id_str  = opt.row_id_str;

  let tit_str = i18n.button.buttonUpdate;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.id_base+"_"+opt.type+"_"+opt.mode+"_"+id_str+"_update_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let btn = $("<div id='"+btn_id+"' class='any-update-icon any-icon pointer' title='"+tit_str+"'>"+
              "<i class='fas fa-check'></i>"+
              btn_str+
              "</div>");
  if (parent && parent.length)
    parent.append(btn);
  if (!opt.edit)
    btn.hide();
  let fun = this.option("localUpdate")
            ? this.option("localUpdate")
            : this.dbUpdate;
  let con = this.option("updateContext")
            ? this.option("updateContext")
            : this.option("context")
              ? this.option("context")
              : this;
  btn.off("click").on("click",opt,$.proxy(fun,con));
  return btn;
}; // refreshUpdateButton

// Create a delete button
// Only displayed if editing
// By default calls dbDeleteDialog
$.any.anyView.prototype.refreshDeleteButton = function (opt)
{
  if (!opt)
    return null;

  let parent  = opt.parent;
  let id_str  = opt.row_id_str;

  let tit_str = i18n.button.buttonDelete;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.id_base+"_"+opt.type+"_"+opt.mode+"_"+id_str+"_delete_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let btn = $("<div id='"+btn_id+"' class='any-delete-icon any-tool-button pointer' title='"+tit_str+"'>"+
              "<i class='fas fa-trash-alt'></i>"+
              btn_str+
              "</div>");
  if (parent && parent.length)
    parent.append(btn);
  if (!opt.edit)
    btn.hide();
  let fun = this.option("localDelete")
            ? this.option("localDelete")
            : this.dbDeleteDialog;
  let con = this.option("deleteContext")
            ? this.option("deleteContext")
            : this.option("context")
              ? this.option("context")
              : this;
  btn.off("click").on("click",opt,$.proxy(fun,con));
  return btn;
}; // refreshDeleteButton

// Create a cancel button
// Only displayed if editing
// By default calls toggleEdit
$.any.anyView.prototype.refreshCancelButton = function (opt)
{
  if (!opt)
    return null;

  let parent  = opt.parent;
  let id_str  = opt.row_id_str;

  let tit_str = i18n.button.buttonCancel;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.id_base+"_"+opt.type+"_"+opt.mode+"_"+id_str+"_cancel_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let btn = $("<div id='"+btn_id+"' class='any-cancel-icon any-tool-button pointer' title='"+tit_str+"'>"+
              "<i class='fas fa-ban'></i>"+
              btn_str+
              "</div>");
  if (parent && parent.length)
    parent.append(btn);
  if (!opt.edit)
    btn.hide();
  let fun = this.option("localCancel")
            ? this.option("localCancel")
            : this.toggleEdit;
  let con = this.option("cancelContext")
            ? this.option("cancelContext")
            : this.option("context")
              ? this.option("context")
              : this;
  btn.off("click").on("click",opt,$.proxy(fun,con));
  return btn;
}; // refreshCancelButton

// Create a remove button
// By default calls dbRemoveDialog
$.any.anyView.prototype.refreshRemoveButton = function (opt)
{
  if (!opt)
    return null;

  let parent  = opt.parent;
  let id_str  = opt.row_id_str;

  let tit_str = i18n.button.buttonRemove;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.id_base+"_"+opt.type+"_"+opt.mode+"_"+id_str+"_remove_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let btn = $("<div id='"+btn_id+"' class='any-remove-icon any-tool-button pointer' title='"+tit_str+"'>"+
              "<i class='fas fa-times'></i>"+
              btn_str+
              "</div>");
  if (parent && parent.length)
    parent.append(btn);
  if (opt.edit)
    btn.hide();
  let fun = this.option("localRemove")
            ? this.option("localRemove")
            : this.dbRemoveDialog;
  let con = this.option("removeContext")
            ? this.option("removeContext")
            : this.option("context")
              ? this.option("context")
              : this;
  btn.off("click").on("click",opt,$.proxy(fun,con));
  return btn;
}; // refreshRemoveButton

// Create a button for opening a new empty item view
// By default calls showItem
$.any.anyView.prototype.refreshNewItemButton = function (opt)
{
  if (!opt)
    return null;

  let parent  = opt.parent;

  let tit_str = this.options.newButtonLabel ? this.options.newButtonLabel : i18n.button.buttonNew+" "+opt.type;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'> "+/*tit_str+*/"</span>" : "";
  let btn_id  = this.id_base+"_"+opt.type+"_"+opt.mode+"_new_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let btn = $("<div id='"+btn_id+"' class='any-new-icon any-icon pointer' title='"+tit_str+"'>"+
              "<i class='fas fa-plus-circle fa-lg'></i>"+
              btn_str+
              "</div>");
  if (parent && parent.length)
    parent.append(btn);
  let fun = this.option("localNew")
            ? this.option("localNew")
            : this.showItem;
  let con = this.option("newContext")
            ? this.option("newContext")
            : this.option("context")
              ? this.option("context")
              : this;
  btn.off("click").on("click",opt,$.proxy(fun,con));
  return btn;
}; // refreshNewItemButton

// Create a button for displaying a menu for adding links
// By default calls showLinkMenu
$.any.anyView.prototype.refreshAddLinkButton = function (opt)
{
  if (!opt || !opt.par_id || !this.options)
    return null;
  if (!this.options.linkIcons)
    return;
  if (!this.options.showButtonAddLinkItem && !this.options.showButtonAddLinkGroup)
    return;

  let parent  = opt.parent;
  let id_str  = opt.id_str;
  let tit_str = i18n.message.addRemove;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.id_base+"_"+opt.type+"_"+opt.mode+"_"+opt.id_str+"_add_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let btn     = $("<div id='"+btn_id+"' class='any-tool-addremove any-tool-button pointer' title='"+tit_str+"'>"+
                  "<i class='fa-solid fa-plus-minus'></i>&nbsp;&nbsp;"+i18n.message.addRemove+
                  btn_str+
                  "</div>");
  if (parent && parent.length)
    parent.append(btn);
  if (!opt.edit)
    btn.hide();
  let fun = opt.mode == "item" && this.options.showButtonAddLinkItem
            ? this.option("localShowLinkMenu")
              ? this.option("localShowLinkMenu")
              : this.showLinkMenu
            : this.options.showButtonAddLinkGroup
              ? this.option("localAddGroupLink")
                ? this.option("localAddGroupLink")
                : this.addGroupLink
              : null;
  let con = this.option("menuContext")
            ? this.option("menuContext")
            : this.option("context")
              ? this.option("context")
              : this;
  opt.top_view = this.options.top_view; //parent.parent();
  btn.off("click").on("click", opt, $.proxy(fun,con));

  if (opt.mode == "item" && this.options.showButtonAddLinkItem) {
    // Popup menu for selecting types is only available for item views
    let menu_id = this.id_base+"_"+opt.par_type+"_"+opt.par_mode+"_"+opt.id_str+"_link_dropdown";
    opt.element_id = menu_id;
    if ($("#"+menu_id).length)
      $("#"+menu_id).remove();
    let dd_menu = $("<div "+
                    "class='w3-dropdown-content w3-bar-block w3-border any-link-menu' "+
                    "id='"+menu_id+"'>"+
                    "</div>");
    btn.append(dd_menu);
    dd_menu.hide();

    // Pressing ESC (27) will hide the menu
    if (!window.anyKeydownHandler)
      window.anyKeydownHandler = [];
    if (window.anyKeydownHandler.indexOf(id_str) == -1) {
      window.addEventListener("keydown", (e) => this.handleEsc(e,opt,this));
      window.anyKeydownHandler.push(id_str);
    }
    // Add the clickable menu entries
    for (let link_type in this.options.linkIcons) {
      if (this.options.linkIcons.hasOwnProperty(link_type)) {
        let link_opt = { data:      opt.par_data,
                         id:        opt.par_id,
                         type:      opt.par_type,
                         link_type: link_type,
                         link_icon: this.options.linkIcons[link_type],
                         id_str:    opt.id_str,
                       };
        let link_btn = this.refreshLinkButton(link_opt,this.dbSearchLinks);
        dd_menu.append(link_btn); // Subevents
      }
    }
  }
  return btn;
}; // refreshAddLinkButton

$.any.anyView.prototype.handleEsc = function(e,opt,self) {
    if (e.keyCode == 27) {
      e.data = {};
      e.data.element_id = opt.element_id;
      self.showLinkMenu(e);
    }
}; // handleEsc

// Create a button for adding a link
// By default calls dbSearchLinks
$.any.anyView.prototype.refreshLinkButton = function (opt,onClickMethod)
{
  if (!opt)
    return null;

  let tit_str = opt.link_type == opt.type ? "sub"+opt.type : opt.link_type;
  let btn_str = tit_str; //this.option("showButtonLabels") ? tit_str : "";
  let btn_id  = this.id_base+"_"+opt.type+"_"+opt.link_type+"_link_icon";
  let btn = $("<div id='"+btn_id+"' style='display:inline-block;' class='any-tool-button pointer' title='"+tit_str+"'>"+
              "<div style='display:inline-block;width:20px;'><i class='"+opt.link_icon+"'></i></div>..."+
              btn_str+
              "</div><br/>");
  let fun = onClickMethod
            ? onClickMethod
            : this.dbSearchLinks;
  let con = this.option("menulinkContext")
            ? this.option("menulinkContext")
            : this.option("context")
              ? this.option("context")
              : this;
  btn.off("click").on("click", opt, $.proxy(fun,con));
  return btn;
}; // refreshLinkButton

// Display or hide the link menu
$.any.anyView.prototype.showLinkMenu = function (event)
{
  let dd_menu = $("#"+event.data.element_id);
  let elem = document.getElementById(event.data.element_id);
  if (elem) {
    if (elem.className.indexOf("showmenu") == -1 && event.data.edit !== false && event.which !== 27) {
      elem.className += " showmenu";
      dd_menu.show();
      // Clicking off the menu (inside this.element) will hide it
      if (this.element && this.element.length) {
        let opt2 = {...event.data};
        opt2.edit    = false;
        opt2.elem    = elem;
        opt2.dd_menu = dd_menu;
        if (this.options.top_view.element.length) {
            let tv_id = this.options.top_view.element.attr("id");
            $("#"+tv_id).off("click").on("click", opt2,
              function(e) {
                e.data.elem.className = elem.className.replace(" showmenu", "");
                e.data.dd_menu.hide();
              }
            );
        }
      }
    }
    else {
      elem.className = elem.className.replace(" showmenu", "");
      dd_menu.hide();
    }
  }
  event.preventDefault();
  return false;
}; // showLinkMenu

$.any.anyView.prototype.addGroupLink = function (event)
{
  let e = {};
  e.data = {
    link_type: event.data.type,
    type:      event.data.par_type,
    id:        event.data.par_id,
    id_str:    event.data.id_str,
  };
  this.dbSearchLinks(e);
}; // addGroupLink

/////////////////////////////////////////////////////////////////////////////////////////

/**
 * Create and return a new model.
 *
 * @method anyView.createModel
 * @return model
 */
$.any.anyView.prototype.createModel = function (params)
{
  let type      = params && params.type                            ? params.type      : null;
  let data      = params && params.data                            ? params.data      : null;
  let id        = params && (params.id     || params.id     === 0) ? params.id        : "";
  let par_id    = params && (params.par_id || params.par_id === 0) ? params.par_id    : "";
  let modelName = params && typeof params.modelName === "string"   ? params.modelName : null;

  type = type ? type : this._findType(data,id,null);
  if (!type)
    return null;

  // Create a new model if we dont already have one or if the caller asks for it
  let model_opt = this.getCreateModelOptions(type,data,id,par_id);
  let model = null;
  let m_str = modelName
              ? modelName     // Use supplied model name
              : type+"Model"; // Use default model name derived from type
  try {
    if (!window[m_str]) {
      //console.warn("Model class "+m_str+" not found, using anyModel. "); // TODO! i18n
      m_str = "anyModel"; // Use fallback model name
    }
    model = new window[m_str](model_opt);
  }
  catch (err) {
    console.error("Couldn't create model "+m_str+": "+err);
    return null;
  }
  return model;
}; // createModel

/**
 * Get the model options for a new view.
 *
 * @method anyView.getCreateModelOptions
 * @return opt
 */
$.any.anyView.prototype.getCreateModelOptions = function(type,data,id,link_id)
{
  return {
    type:          type,
    data:          data,
    id:            id,
    link_id:       link_id,
    parent:        this.model ? this.model               : null, // TODO! Not always correct.
    source:        this.model ? this.model.source        : null,
    table_fields:  this.model ? this.model.table_fields  : null,
    db_connection: this.model ? this.model.db_connection : null,
    db_last_term:  this.model ? this.model.db_last_term  : null,
    permission:    this.model ? this.model.permission    : null,
  };
}; // getCreateModelOptions

/**
 * Create a new model in a new view and return the view.
 *
 * @method anyView.createView
 * @return view
 */
$.any.anyView.prototype.createView = function (params)
{
  let model        = params && params.model                                       ? params.model        : null;
  let type         = model                                                        ? model.type          : null;
  let mode         = model                                                        ? model.mode          : null;
  let data         = model                                                        ? model.data          : null;
  let id           = params && params.id                                          ? params.id           : model && model.id ? model.id          : "";
  let parent       = params && params.parent                                      ? params.parent       : null;
  let data_level   = params && (params.data_level   || params.data_level   === 0) ? params.data_level   : this.data_level   ? this.data_level   : 0;
  let indent_level = params && (params.indent_level || params.indent_level === 0) ? params.indent_level : this.indent_level ? this.indent_level : 0;
  let id_str       = params && params.id_str                                      ? params.id_str       : "";

  if (!model)
    return null;
  type = type ? type : this._findType(data,id);
  mode = mode ? mode : this._findMode(data,id);
  if (!type || !mode)
    return null;
  if (!parent)
    parent = this.element;
  if (!parent)
    return null;

  // Create the view
  let view_opt = this.getCreateViewOptions(model,parent,type,mode,id_str,data_level,indent_level,params);
  if (params && params.showHeader === false)
    view_opt.showHeader = false;
  let view  = null;
  let v_str = view_opt.grouping
              ? type+"View"+view_opt.grouping.capitalize()
              : type+"View"; // Use default view name derived from type
  try {
    if (!window[v_str]) {
      // Use fallback view name
      //console.warn("View class "+v_str+" not found, using anyView. "); // TODO! i18n
      let def_str = view_opt.grouping
                    ? "anyView"+view_opt.grouping.capitalize()
                    : "anyView";
      //console.warn(v_str+" is not a valid list view, using "+def_str+". ");
      v_str = def_str;
    }
    let elm = $("#"+view_opt.id);
    if (elm.length)
      view = this._findViewById(view_opt.id); // See if we can reuse view
    if (!view)
      view = new window[v_str](view_opt); // Create a new view
    if (!Object.keys(view).length)
      throw i18n.error.COULD_NOT_CREATE_VIEW+" "+v_str;
  }
  catch (err) {
    let errstr = err+" with id "+view_opt.id; // TODO! i18n
    this.model.error = i18n.error.SYSTEM_ERROR+"See console log for details. ";
    console.error(errstr);
    return null;
  }
  return view;
}; // createView

/**
 * Get the view options for a new view.
 *
 * @method anyView.getCreateViewOptions
 * @return opt
 */
// TODO! Check that all relevant options are sent as params when creating new view
$.any.anyView.prototype.getCreateViewOptions = function(model,parent,type,mode,id_str,data_level,indent_level,params)
{
  if (!this.options)
    return {};
  let view_id = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_data";
  return {
    model:                  model,
    mode:                   mode,
    filters:                this._getOrCreateFilters(type,model?model.data:null), // Create filter if we don't already have one
    id:                     view_id,
    view:                   this, // Used by dbUpdate and dbDeleteDialog
    id_base:                this.id_base,
    data_level:             data_level   || data_level   === 0 ? data_level   : this.data_level,
    indent_level:           indent_level || indent_level === 0 ? indent_level : this.indent_level,
    grouping:               this.options.grouping,
    simple:                 this.options.simple,
    item_opening:           this.options.item_opening,
    top_view:               this.options.top_view,
    currentPage:            this.options.currentPage,
    showHeader:             this.options.showHeader,
    showTableHeader:        params && params.showTableHeader  !== undefined ? params.showTableHeader  : this.options.showTableHeader,
    showTableFooter:        params && params.showTableFooter  !== undefined ? params.showTableFooter  : this.options.showTableFooter,
    showTableIngress:       this.options.showTableIngress,
    showRowIngress:         this.options.showRowIngress,
    showSublists:           this.options.showSublists,
    showButtonEdit:         params && params.showButtonEdit   !== undefined ? params.showButtonEdit   : this.options.showButtonEdit,
    showButtonUpdate:       params && params.showButtonUpdate !== undefined ? params.showButtonUpdate : this.options.showButtonUpdate,
    showButtonCancel:       params && params.showButtonCancel !== undefined ? params.showButtonCancel : this.options.showButtonCancel,
    onEscEndEdit:           params && params.onEscEndEdit     !== undefined ? params.onEscEndEdit     : this.options.onEscEndEdit,
    showToolbar:            this.options.showToolbar,
    showSearcher:           this.options.showSearcher,
    showPaginator:          this.options.showPaginator,
    showServerErrors:       this.options.showServerErrors,
    showButtonNew:          this.options.showButtonNew,
    showButtonAddLinkItem:  this.options.showButtonAddLinkItem,
    showButtonAddLinkGroup: this.options.showButtonAddLinkGroup,
    useOddEvenColums:       this.options.useOddEvenColums,
    useOddEvenRows:         this.options.useOddEvenRows,
    defaultMode:            this.options.defaultMode,
    sortBy:                 this.options.sortBy,
    sortDirection:          this.options.sortDirection,
    link_options:           this.options.link_options,
    cutoff:                 this.options.cutoff,
    // Give same permissions to new view as the current one. This may not
    // always be the desired behaviour, in that case, override this method.
    isEditable:             this.options.isEditable,
    isAddable:              this.options.isAddable,
    isRemovable:            this.options.isRemovable || mode == "item", // TODO! Not a good solution
    isDeletable:            this.options.isDeletable,
    isSelectable:           this.options.isSelectable,

    itemLinkClicked:        this.options.itemLinkClicked ? this.options.itemLinkClicked : null,
    clickContext:           this.options.clickContext    ? this.options.clickContext    : null,
    closeContext:           this.options.closeContext    ? this.options.closeContext    : null,
    addContext:             this.options.addContext      ? this.options.addContext      : null,
    selectContext:          this.options.selectContext   ? this.options.selectContext   : null,
    editContext:            this.options.editContext     ? this.options.editContext     : null,
    updateContext:          this.options.updateContext   ? this.options.updateContext   : null,
    deleteContext:          this.options.deleteContext   ? this.options.deleteContext   : null,
    cancelContext:          this.options.cancelContext   ? this.options.cancelContext   : null,
    removeContext:          this.options.removeContext   ? this.options.removeContext   : null,
    newContext:             this.options.newContext      ? this.options.newContext      : null,
    menuContext:            this.options.menuContext     ? this.options.menuContext     : null,
    menulinkContext:        this.options.menulinkContext ? this.options.menulinkContext : null,

    preselected:            this.options.isSelectable    ? this.options.preselected     : null,
    select:                 this.options.isSelectable    ? this.options.select          : null,
    unselect:               this.options.isSelectable    ? this.options.unselect        : null,
    localSelect:            this.options.localSelect     ? this.options.localSelect     : null,
    localUpdate:            this.options.localUpdate     ? this.options.localUpdate     : null,
    localDelete:            this.options.localDelete     ? this.options.localDelete     : null,
    localAdd:               this.options.localAdd        ? this.options.localAdd        : null,
    localRemove:            this.options.localRemove     ? this.options.localRemove     : null,
    localNew:               this.options.localNew        ? this.options.localNew        : null,
    localEdit:              this.options.localEdit       ? this.options.localEdit       : null,
    localCancel:            this.options.localCancel     ? this.options.localCancel     : null,
    localCloseItem:         this.options.localCloseItem  ? this.options.localCloseItem  : null,
  };
}; // getCreateViewOptions

/////////////////////////////////////////////////////////////////////////////////////////
//
// Methods that create cell items
//
/////////////////////////////////////////////////////////////////////////////////////////

$.any.anyView.prototype.getCellEntryStr = function (id,type,mode,id_str,filter_id,filter_key,data_item,data_lists,edit,model_str,view_str,parent)
{
  if (!filter_id || !filter_key)
    return "";
  let val    = data_item[filter_id];
  let par_id = data_item["parent_id"];
  if (typeof val != "object")
    val = $("<textarea />").html(val).text(); // Convert html entities to real html
  if (filter_key.EDITABLE === 0 || filter_key.EDITABLE === false)
    edit = false;
  switch (filter_key.TYPE) {
    case "label":    return this.getLabelStr   (type,mode,id,val); // Always noneditable
    case "html":     return this.getHtmlStr    (type,mode,id,val,edit);
    case "textarea": return this.getTextAreaStr(type,mode,id,val,edit,filter_id,id_str);
    case "text":     return this.getTextStr    (type,mode,id,val,edit);
    case "password": return this.getPasswordStr(type,mode,id,val,edit);
    case "link":     return this.getLinkStr    (type,mode,id,val,edit);
    case "mailto":
    case "email":    return this.getEmailStr   (type,mode,id,val,edit);
    case "number":   return this.getNumberStr  (type,mode,id,val,edit);
    case "date":     return this.getDateStr    (type,mode,id,val,edit);
    case "image":    return this.getImageStr   (type,mode,id,val,edit,filter_key);
    case "radio":    return this.getRadioStr   (type,mode,id,val,edit,filter_key,filter_id);
    case "check":    return this.getCheckStr   (type,mode,id,val,edit,filter_key,filter_id);
    case "select":   return this.getSelectStr  (type,mode,id,val,edit,filter_key,par_id,data_item["parent_name"]);
    case "function": return this.getFunctionStr(type,mode,id,val,edit,filter_key,par_id,data_item["parent_name"]);
    case "list":     return this.getListView   (type,mode,id,val,edit,filter_key,id_str,data_lists,model_str,view_str,parent);
    case "upload":   return this.getUploadStr  (type,mode,id,val,edit,data_item,filter_id,id_str);
    case "fileview": return this.getFileViewStr(type,mode,id,val,edit,data_item,filter_id,id_str);
    /* Not used yet
    case "http":
    case "https":    return this.getHttpStr    (type,mode,id,val,edit);
    case "textspan": return this.getTextspanStr(type,mode,id,val,edit);
    case "tokenlist":return this.getTokenlist  (type,mode,id,val,edit);
    */
  }
  if (!val)
    val = "";
  return val;
}; // getCellEntryStr

$.any.anyView.prototype.getHtmlStr = function (type,mode,id,val,edit)
{
  return val;
}; // getHtmlStr

$.any.anyView.prototype.getLabelStr = function (type,mode,id,val)
{
  if (val == null || val == undefined)
    val = "";
  //val = (val.replace(/<(?:.|\n)*?>/gm,''));
  let val_cleaned = typeof val == "string" && this.options.cutoff > 0 ? val.substring(0,this.options.cutoff) : ""+val;
  val_cleaned += (val.length > this.options.cutoff && this.options.cutoff > 0) ? " [...]" : "";
  val = val_cleaned;
  //if (!val || val == "")
  //  val = "&nbsp;";
  return "<div class='itemUnedit itemLabel'>"+val+"</div>";
}; // getLabelStr

$.any.anyView.prototype.getTextAreaStr = function (type,mode,id,val,edit,filter_id,id_str)
{
  if (edit) {
    if (typeof tinyMCE !== "undefined") {
      let nameid = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_"+filter_id;
      if (tinyMCE.EditorManager.get(nameid))
        tinymce.EditorManager.execCommand('mceRemoveEditor',true, nameid);
    }
    return "<textarea class='itemEdit tinymce'>"+val+"</textarea>";
  }
  else
    return this.getLabelStr(type,mode,id,val);
}; // getTextAreaStr

$.any.anyView.prototype.getTextStr = function (type,mode,id,val,edit)
{
  if (edit)
    return "<input class='itemEdit itemText' type='text' value='"+val+"'/>";
  else
    return this.getLabelStr(type,mode,id,val);
}; // getTextStr

$.any.anyView.prototype.getPasswordStr = function (type,mode,id,val,edit)
{
  if (edit)
    return "<input class='itemEdit itemText password' type='password' value='"+val+"'/>";
  else
    return this.getLabelStr(type,mode,id,"");
}; // getLabelStr

$.any.anyView.prototype.getLinkStr = function (type,mode,id,val,edit)
{
  if (edit)
    return this.getTextStr(type,mode,id,val,edit);
  else
    return "<div class='itemUnedit itemText pointer underline' attr='link'>"+val+"</div>";
}; // getLinkStr

$.any.anyView.prototype.getEmailStr = function (type,mode,id,val,edit)
{
  if (edit)
    return this.getTextStr(type,mode,id,val,edit);
  else
    return "<div class='itemUnedit itemText pointer underline'><a href='mailto:"+val+"'>"+val+"</a></div>";
}; // getEmailStr

// In edit mode, the input field is modified with a filter
// in append methods to allow only numerals and '.'
$.any.anyView.prototype.getNumberStr = function (type,mode,id,val,edit)
{
  if (edit)
    return "<input class='itemEdit itemNumber' type='text' value='"+val+"'/>";
  else {
    if (val == null || val == undefined)
      val = "";
    let val_cleaned = typeof val == "string" && this.options.cutoff > 0 ? val.substring(0,this.options.cutoff) : ""+val;
    val_cleaned += (val.length > this.options.cutoff && this.options.cutoff > 0) ? " [...]" : "";
    val = val_cleaned;
    return "<div class='itemUnedit itemNumber'>"+val+"</div>";
  }
}; // getNumberStr

// In edit mode, a date selector will be shown.
$.any.anyView.prototype.getDateStr = function (type,mode,id,val,edit)
{
  let str = "";
  if (edit) {
    let dateval = "";
    if (val) {
      val = val.split(" ");
      dateval = val[0].split("-");
      dateval = dateval[0]+"-"+dateval[1]+"-"+dateval[2];
    }
    str = "<input class='itemEdit itemDate' type='date' value='"+dateval+"'/>";
  }
  else {
    if (val) {
      val = val.split(" ");
      val = new Date(val[0]);
      val = isNaN(val.getTime()) ? "" : val.getFullYear()+"-"+(val.getMonth()+1)+"-"+val.getDate();
    }
    str = "<div class='itemUnedit itemDate'>"+val+"</div>";
  }
  return str;
}; // getDateStr

// Execute a function which should return an html string
$.any.anyView.prototype.getFunctionStr = function (type,mode,id,val,edit,filter_key,par_id,pname)
{
  let func_name = filter_key.FUNCTION;
  if (isFunction(this[func_name])) // Method in view class
    return this[func_name](type,mode,id,val,edit,par_id);
  if (isFunction(window[func_name])) // Normal function
    return window[func_name](type,mode,id,val,edit,par_id);
  return ""; // Function not found
}; // getFunctionStr

$.any.anyView.prototype.getImageStr = function (type,mode,id,val,edit,filter_key)
{
  let image_src = filter_key.IMAGE;
  if (!image_src && filter_key.FUNCTION && typeof window[filter_key.FUNCTION] == "function")
    return this.getFunctionStr(type,mode,id,val,edit,filter_key);
  return "<div class='itemUnedit'>"+
         "<img class='imageRef pointer' src='"+image_src+"' title='"+val+"' style='box-shadow:none;'>"+
         "</div>";
}; // getImageStr

$.any.anyView.prototype.getSelectStr = function (type,mode,id,val,edit,filter_key,par_id,pname)
{
  let str  = "";
  let sval = val;
  let fval = filter_key.SELECT ? filter_key.SELECT : filter_key.FUNCTION;
  if (fval) {
    if (typeof this[fval] === 'function')
      sval = this[fval](type,mode,id,val,edit,par_id);
    else
    if (typeof fval == "object")
      sval = edit ? fval : fval[val];
    else
      sval = fval;
  }
  if (edit) {
    str =  "<select class='itemEdit itemSelect'>";
    if (typeof sval == "object") {
      let o_str = "";
      for (let fid in sval) {
        if (sval.hasOwnProperty(fid)) {
          let sel = (fid != "" && (fid == val || fid == parseInt(val))) ? "selected" : "";
          o_str += "<option class='itemOption' id='"+parseInt(fid)+"' name='"+fid+"' "+"value='"+fid+"' "+sel+">"+sval[fid]+"</option>";
        }
      }
      str += o_str;
    }
    else
      str += "<i>"+sval+"</i>";
    str += "</select>";
  }
  else {
    str = sval;
    if (!str)
      str = "";
    str = "<div class='itemUnedit itemSelect'>"+str+"</div>";
  }
  return str;
}; // getSelectStr

$.any.anyView.prototype.getRadioStr = function (type,mode,id,val,edit,filter_key,filter_id)
{
  let str  = "";
  let sval = val;
  let fval = filter_key.RADIO;
  if (fval) {
    if (typeof this[fval] == "function")
      sval = this[fval](type,mode,id,val,edit);
    else
    if (typeof fval == "object")
      sval = edit ? fval : fval[val];
    else
      sval = fval;
  }
  if (edit) {
    if (typeof sval == "object") {
      for (let fid in sval) {
        if (sval.hasOwnProperty(fid)) {
          let chk = (fid != "" && fid == parseInt(val)) ? "checked" : "";
          str += "<input class='itemEdit itemRadio' type='radio' id='"+fid+"' name='"+filter_id+"' value='"+sval[fid]+"' "+chk+"/>";
          str += "<label for='"+fid+"'>&nbsp;"+sval[fid]+"</label>&nbsp;";
        }
      }
    }
    else
      str += sval;
  }
  else {
    str = sval;
    if (!str)
      str = "";
    str = "<div class='itemUnedit itemSelect'>"+str+"</div>";
  }
  return str;
}; // getRadioStr

$.any.anyView.prototype.getCheckStr = function (type,mode,id,val,edit,filter_key,filter_id)
{
  let str = "";
  if (edit) {
    let checked = val == "1" ? "checked" : "";
    str = "<input class='itemEdit' type='checkbox' onclick='$(this).val(this.checked?1:0)' value='"+val+"' "+checked+"/>";
  }
  else {
    let the_id      = Number.isInteger(parseInt(id)) ? parseInt(id) : id;
    let id_str      = ""+the_id;
    let it_id       = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_"+filter_id+"_check";
    let check_class = (val == "1")
                      ? "fa-regular fa-square-check"
                      : "fa-regular fa-square";
    let title   = "Check if attended"; // TODO! Move to event class, also i18n
    str = "<div class='itemUnedit inlineDiv pointer' "+
          "id='"+it_id+"' "+
          "title='"+title+"'>"+
          "<i class='"+check_class+"'></i>"+
          "</div>";
  }
  return str;
}; // getCheckStr

// Return a view containing a list
$.any.anyView.prototype.getListView = function (type,mode,id,val,edit,filter_key,id_str,data_lists,model_str,view_str,parent)
{
  if (!this.model)
    throw i18n.error.MODEL_MISSING;

  // TODO! Should we return null here if val is empty?

  // Create the list model
  let list_type = filter_key.LIST;
  let model_opt = this.getListModelOptions(type,list_type,val);
  let m_str     = model_str && typeof model_str === "string"
                  ? model_str
                  : list_type.capitalize()+"Model";
  if (!window[m_str]) {
    let def_str = "anyModel";
    console.warn(m_str+" is not a valid list model, using "+def_str+". ");
    m_str = def_str;
  }
  let list_model = new window[m_str](model_opt);
  list_model.data = data_lists ? data_lists.data : null;

  // Create the list view
  let list_view_id = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_"+list_type+"_list";
  let view_opt     = this.getListViewOptions(list_model,list_view_id,edit,this);
  let v_str = view_str && typeof view_str === "string"
              ? view_str
              : view_opt.grouping
                ? list_type.capitalize()+"View"+view_opt.grouping.capitalize()
                : list_type.capitalize()+"View";
  if (!window[v_str]) {
    // Use fallback view name
    //console.warn("View class "+v_str+" not found, using anyView. "); // TODO! i18n
    let def_str = view_opt.grouping
                  ? "anyView"+view_opt.grouping.capitalize()
                  : "anyView";
    console.warn(v_str+" is not a valid list view, using "+def_str+". ");
    v_str = def_str;
  }
  view_opt.filter_key = filter_key;
  view_opt.top_view = this.options.top_view;
  let view = null;
  try {
    view = new window[v_str](view_opt);
    if (!Object.keys(view).length) {
      console.error("Couldn't create list view "+v_str+" with id "+list_view_id);
      view = null;
    }
    if (view) {
      if (parent)
        parent.append(view.element);
      view.is_item_list = true; // Mark this list as a "client" list of an item
      if (view.refresh)
        view.refresh();
      return null;
    }
  }
  catch (err) {
    console.error("Couldn't create list view "+v_str+": "+err);
  }
  return view;
}; // getListView

// May be overidden by derived classes
$.any.anyView.prototype.getListModelOptions = function (type,list_type,data)
{
  return {
    type:       list_type,
    data:       data,
    par_type:   type,
    par_id:     "???", // TODO!
    db_search:  false,
    source:     this.model.source,
    permission: this.model.permission,
  };
}; // getListModelOptions

// May be overidden by derived classes
$.any.anyView.prototype.getListViewOptions = function (model,view_id,edit,view)
{
  return {
    model:           model,
    id:              view_id,
    filters:         this.options.filters,
    grouping:        this.options.grouping,
    view:            view,
    isRemovable:     false,
    isAddable:       false,
    isEditable:      false,
    isDeletable:     false,
    showSearch:      true,
    showTableHeader: false,
    showTableFooter: false,
    showToolbar:     false,
    onEscEndEdit:    true,
    defaultMode:     "list",
  };
}; // getListViewOptions

$.any.anyView.prototype.getUploadStr = function (type,mode,id,val,edit,data_item,filter_id,id_str)
{
  // Shows a clickable label that opens a file select dialog when pressed
  let elem_id = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_"+filter_id; // element id
//let name    = data_item[type+"_name"];                                 // real file name from user
  let style   = "style='cursor:pointer;'";
  let title   = "title='Select a new file for upload'"; // TODO i18n
  let filter  = this.getFilter(type,mode);
  let img_str = "<i class='fa fa-upload'></i>";
  if (filter && filter[filter_id] && filter[filter_id]["IMAGE"])
    img_str = "<img src='"+filter[filter_id]["IMAGE"]+"' style='border:0;box-shadow:none;'/>";
  let str     = "<label id='"+elem_id+"_label' for='"+elem_id+"_upload' class='itemLabel' "+style+" "+title+">"+
                img_str+
                "</label>"+
                "<input id='"+elem_id+"_upload'  name='"+elem_id+"_upload' type='file' style='display:none;'/>"+
                "<input class='itemText itemEdit' value='"+val+"' type='hidden'/>"; // Sent to database
  return str;
}; // getUploadStr

$.any.anyView.prototype.getFileViewStr = function (type,mode,id,val,edit,data_item,filter_id,id_str)
{
  let elem_id  = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_"+filter_id; // element id
  let filename = data_item[filter_id] ? data_item[filter_id]          : ""; // local file name on server
  let fileurl  = filename             ? any_defs.uploadURL + filename : ""; // url of server file
  let style    = mode == "list" ? "style='text-align:center;'" : "";
  let str_open = "View file in new tab/window"; // TODO i18n
  let str = "<div id='"+elem_id+"_fileview' "+style+">"+
            "<a href='"+fileurl+"' onclick='return false;'>"+
            "<input class='itemText' value='"+filename+"' type='hidden'></input>"+
            "<i class='far fa-file' title='"+str_open+"'></i>"+
            "</a>"+
            "</div>";
  return str;
}; // getFileViewStr

/************ The following get methods are not used yet ************/
/*
$.any.anyView.prototype.getHttpStr = function (nameid,val,type,group_id,id)
{
  if (edit) {
    return this.getTextStr(type,mode,id,val,edit);
  }
  else {
    let id_str  = "" + (Number.isInteger(parseInt(id))       ? parseInt(id)       : id);
    let gid_str = "" + (Number.isInteger(parseInt(group_id)) ? parseInt(group_id) : group_id);
    val = val.replace("https://","");
    val = val.replace("http://","");
    let it_id = this.id_base+"_link_"+filterKey+"_"+gid_str+"_"+id_str;
    let protocol = filterVal.TYPE;
    val = "<div id='"+it_id+"' class='pointer underline'><a class='td_list_link' href='"+protocol+"://"+val+"' target='_blank'>"+val+"</a></div>";
  }
};

$.any.anyView.prototype.getTokenList = function (nameid,val,type,group_id,id)
{
  return "<input id='"+nameid+"' name='"+nameid+"' class='tokenList' type='text' value='"+val+"'/>";
};

$.any.anyView.prototype.getTextspanStr = function (nameid,val,type,group_id,id)
{
  return "<span class='itemInput' value='"+val+"'>"+val+"</span>"+
         "<input id='"+nameid+"' name='"+nameid+"' type='hidden' value='"+val+"'/>";
};
*/

/////////////////////////////////////////////////////////////////////////////////////////
//
// Callbacks
//
/////////////////////////////////////////////////////////////////////////////////////////

$.any.anyView.prototype._uploadClicked = function (event)
{
  if (!this.options || !this.options.uploadDirect && !event.data.edit) {
    console.log(event.data.filter_id+" not editable. "); // TODO! i18n
    return null;
  }
  let elem_id = event.data.elem_id;
  let fname = $("#"+elem_id+"_upload").val().replace(/C:\\fakepath\\/i, '');
  if (fname) {
    // Remember the file in case it should be uploaded later
    let the_file = $("#"+elem_id+"_upload")[0].files[0];
    window.any_current_file = the_file;

    // Update the model
    let filter_id = event.data.filter_id;
    this.model.dataUpdate({
                 type:     event.data.type,
                 data:     event.data.data,
                 id:       event.data.id,
                 new_data: { [filter_id]: fname },
               });
    // Update the field to be sent to server
    $("#"+elem_id+" .itemText").val(fname);

    // Empty the file input field, so that the event will fire a second time even for the same file
    $("#"+elem_id+"_upload").val(null);

    // See if we should upload the file immediately
    if (this.options.uploadDirect && typeof doUploadFile === "function") {
      let uid = this.model && this.model.permission ? this.model.permission.current_user_id : "u";
      if (uid<0)
        uid = "u";
      doUploadFile(any_defs.uploadScript,
                   the_file,
                   uid,
                   the_file.name);
      console.log("Uploaded "+the_file.name);
    }
  }
  else
    window.any_current_file = null;
  return fname;
}; // _uploadClicked

$.any.anyView.prototype._fileViewClicked = function (event)
{
  let type = event.data.type;
  let id   = event.data.id;
  let item = this.model.dataSearch({ type:type, id:id });
  if (item && item[id]) {
    let filter_id = event.data.filter_id;
    let fileurl   = any_defs.uploadURL + item[id][filter_id];
    if (fileurl)
      window.open(fileurl); // Open file in a new window
    else
      this.showMessages("File not found. "); // TODO! i18n
  }
}; // _fileViewClicked

$.any.anyView.prototype.sortTable = function (event)
{
  if (!event || !event.data) {
    console.log("sortTable: Missing event or event.data. "); // TODO! i18n
    return;
  }
  let type  = event.data.type;
  let order = event.data.filter_id;
  let last_sort_by = this.options.sortBy;
  this.options.sortBy = order;
  if (this.options.sortBy == last_sort_by)
    this.options.sortDirection = this.options.sortDirection == "ASC" ? "DESC" : "ASC";
  let from = null;
  let num  = null;
  let table = $("#"+event.data.table_id);
  if (table.length && this.options.showPaginator) {
    let extra_foot = table.parent().find(".table_datafooter");
    if (extra_foot.length) {
      let pager = extra_foot.data("pager");
      if (pager) {
        from = pager.options.itemsPerPage *(pager.currentPage() - 1);
        num  = pager.options.itemsPerPage;
      }
      else {
        from = 0;
        num  = this.options.itemsPerPage;
      }
    }
  }
  let mod_opt = {
    context:   this.model,
    type:      type,
    from:      from,
    num:       num,
    order:     order,
    direction: this.options.sortDirection,
    par_type:  type,
    group_id:  event.data.par_id,
    header:    false,
    grouping:  false,
  };
  if (this.model.source == "remote") {
    // Remote search, let the database do the sorting.
    // Will (normally) call refresh via onModelChange
    this.options.indent_level = -1;
    this.options.ref_rec = 0;
    this.showMessages("",true);
    this.id_stack.pop(); // TODO! Not a good solution
    this.model.dbSearch(mod_opt);
  } // if remote
  else {
    console.log("sortTable: Local sort not implemented. "); // TODO!
  }
}; // sortTable

$.any.anyView.prototype._processSearch = function (event)
{
  if (event.keyCode == 13) {
    let search_opt = event.data;
    search_opt.db_search_term = $("#"+search_opt.inp_id).val();
    search_opt.onSuccess      = this.searchSuccess; // TODO! Parameters to searchSuccess
    search_opt.context        = this;
    search_opt.grouping       = this.options.grouping;
    search_opt.order          = this.options.sortBy;
    search_opt.direction      = this.options.sortDirection;
    this.showMessages("",true);
    this.model.dbSearch(search_opt);
  }
}; // _processSearch

$.any.anyView.prototype.searchSuccess = function (context,serverdata,options)
{
  let self = context ? context : this;
  if (options) // TODO!
    options.auto_refresh = false;
  self.model.dbSearchSuccess(self.model,serverdata,options); // Initialize model without calling refresh
  if (self.model.data) {
    let list_type   = options ? options.type : null;
    let new_id_base = self._createIdBase();
    let ll_id       = new_id_base+"_"+list_type+"_search_list";
    let ll_contents = $("<div id='"+ll_id+"'></div>");

    let model = this.createModel({
                       type:     list_type,
                       data:     self.model.data,
                       id:       null,
                     });
    let search_view = self.createView({
                             model:        model,
                             parent:       ll_contents,
                             data_level:   0,
                             indent_level: 0,
                             //id_str:       "", // TODO!
                          });
    if (search_view) {
      if (search_view.model && self.model)
        search_view.model.db_last_term = self.model.db_last_term; // If paginating and we need to call server, repeat the last seach term
      search_view.id_base = new_id_base;
      search_view.options.link_options    = context.options; // Remember options for link click
      search_view.options.grouping        = null;
      search_view.options.isEditable      = null;
      search_view.options.showHeader      = false;
      search_view.options.showToolbar     = false;
      search_view.options.showTableHeader = true;
      search_view.options.showTableFooter = true;
      search_view.options.showSearcher    = false;
      search_view.options.indent_level    = 0;
      search_view.options.itemLinkClicked = search_view.searchLinkClicked;
      let par_view_id = self.id_base+"_"+self.model.type+"_head_0_data";
      w3_modaldialog({
        parentId:    par_view_id,
        elementId:   "",
        heading:     list_type+" search results", // TODO! i18n
        contents:    search_view.element,
        //width:       "30em", // TODO! css
        ok:          true,
        cancel:      false,
        okFunction:  self.searchSuccessOk,
        context:     self,
        // Sent to okFunction:
        type:        self.type,
        data:        self.data,
      });
      search_view.refresh();
    } // if search_view
  } // if self.model.data
}; // searchSuccess

$.any.anyView.prototype.searchLinkClicked = function (event)
{
  // TODO! Check for options undefined
  this.options.grouping        = event.data.options.link_options.grouping;
  this.options.isEditable      = event.data.options.link_options.isEditable;
  this.options.showHeader      = event.data.options.link_options.showHeader;
  this.options.showToolbar     = event.data.options.link_options.showToolbar;
  this.options.showTableHeader = event.data.options.link_options.showTableHeader;
  this.options.showTableFooter = event.data.options.link_options.showTableFooter;
  this.options.showSearcher    = event.data.options.link_options.showSearcher;
  this.link_options = null;
  this.itemLinkClicked(event); // TODO! use method specified in this.options.itemLinkClicked?
}; // searchLinkClicked

$.any.anyView.prototype.searchSuccessOk = function (opt)
{
  // Close dialog and stop spinner
  w3_modaldialog_close(opt.parentId,opt.elementId);
  this.showMessages("",false);
}; // searchSuccessOk

// Refresh when a paginator is activated
$.any.anyView.prototype.pageNumClicked = function (pager)
{
  if (!pager || !pager.options || !pager.options.div_info) {
    console.error("System error: Pager or pager options missing for pageNumClicked. "); // TODO! i18n
    return;
  }
  this.options.currentPage = pager.currentPage();
  let from = pager.options.itemsPerPage *(pager.currentPage() - 1) + 1;
  let num  = pager.options.itemsPerPage;
  let mod_opt = {
    from:      from,
    num:       num,
    context:   this.model,
    group_id:  pager.options.div_info.group_id,
    type:      pager.options.div_info.type,
    grouping:  this.options.grouping,
    simple:    this.options.grouping === null,
    header:    "All "+pager.options.div_info.type+"s", // TODO! Not a good solution
    order:     this.options.sortBy,
    direction: this.options.sortDirection,
  };
  this.options.data_level = 0;
  this.data_level = 0; // TODO! Why is this in 2 places?
  if (this.model.source == "remote" && !mod_opt.simple) { // If "simple" mode, we assume all data is read already
    this.id_stack = [];
    this.options.ref_rec = 0;
    mod_opt.from -= 1; // from is 0-based on server
    if (this.model.db_last_term && this.model.db_last_term != "")
      mod_opt.db_search_term = this.model.db_last_term;
    this.showMessages("",true);
    this.model.dbSearch(mod_opt);
  }
  else {
    this.refresh({
           from:  from,
           num:   num,
           clear: true,
         });
  }
}; // pageNumClicked

// Process Esc and Enter keys.
$.any.anyView.prototype._processKeyup = function (event)
{
  if (!this.options)
    return true;
  if ((event.type == "keyup"   && event.which != 13) ||
      (event.type == "keydown" && event.which != 27)) // For catching the ESC key on Vivaldi
    return true; // Only process ESC and Enter keys

  if (event.preventDefault)
    event.preventDefault();

  if (event.which == 27 && this.options.onEscEndEdit) { // esc
    this.doToggleEdit(event.data);
  }
  else
  if (event.which == 13) { // enter
    if (event.data) {
      let data   = event.data.data;
      let id     = event.data.id;
      let is_new = event.data.is_new ? event.data.is_new : data && data[id] ? data[id].is_new : false;
      event.data.is_new   = is_new;
      event.data.new_data = event.data.data;
      if (this.options.onEnterUpdateEdit)
        this.dbUpdate(event);
      let mode = event.data.mode;
      if (mode == "list") {
        this.current_edit = null;
        if (this.options.onEnterInsertNew) {
          // Add a new row to the list
          event.data.is_new = true;
          event.data.new_id = null;
          this.addListEntry(event);
        }
        else
        if (this.options.onEnterMoveFocus) {
          // TODO! Enter in a list input field should optionally move to next row and start editing it, unless onEnterInsertNew or onEnterUpdateEdit are true.
        }
      }
      else
      if (mode == "item") {
        if (this.options.onEnterMoveFocus && !this.options.onEnterUpdateEdit) {
          let elem = $(":focus");
          if (elem.length) {
            let next_input = elem.parent().parent().next().find("input");
            if (next_input.length) {
              next_input.trigger("focus");
              // Make sure cursor is at the end of the text field
              let tmp = next_input.val();
              next_input.val("");
              next_input.val(tmp);
            }
          }
        }
      }
    }
  }
  return true;
}; // _processKeyup

$.any.anyView.prototype.addListEntry = function (event)
{
  let type       = event.data.type;
  let id         = event.data.id;
  let par_data   = event.data.par_data;
  let par_id     = event.data.par_id;
  let par_type   = event.data.par_type;
  let id_str     = event.data.id_str;
  let row_id_str = event.data.row_id_str;
  let edit       = event.data.edit;
  let filter     = event.data.filter;
  let new_id     = event.data.new_id;
  let is_new     = event.data.is_new;

  let table_div  = $("#"+this.element.attr("id")).find("table");
  if (edit && (new_id || new_id === 0)) {
    this.model.dataDelete({ id: new_id });
    let new_params = {
      table_div: table_div,
      type:      type,
      data:      this.model.data,
      id:        par_id, // TODO! Is this correct?
      par_data:  par_data,
      par_id:    par_id,
      par_type:  par_type,
    };
    this.refreshData(new_params);
  }
  // Get a new id (from database, if we use that) and add a new empty item to the data model.
  let the_data = this.model.dataSearch({
                              type: type,
                              id:   par_id,
                              data: this.model.data,
                              parent: true,
                            }); // Find the place to add the new item
  if (is_new) {
    if (this.model.source != "remote") {
      let new_id = this.model.dataSearchNextId(null,type);
      if (new_id >= 0) {
        row_id_str  = row_id_str.substr(0, row_id_str.lastIndexOf("_"));
        row_id_str += row_id_str ? "_"+new_id : new_id;
        this._addListEntry({
               type:       type,
               mode:       "list",
               data:       the_data,
               new_id:     new_id,
               par_data:   par_data,
               par_id:     par_id,
               par_type:   par_type,
               id_str:     id_str,
               row_id_str: row_id_str,
               table_div:  table_div,
               filter:     filter,
             });
      }
      else {
        this.model.error = "Next id not found. "; // TODO! i18n
        console.error(this.model.error);
        return false;
      }
    }
    else { // remote
      let f = []; f[0] = this.model.id_key;
      this.showMessages("",true);
      this.model.dbSearchNextId({
                   type:         type,
                   table_fields: f,
                   onSuccess:    this._addListEntryFromDB,
                   context:      this,
                   id_str:       id_str,
                   row_id_str:   row_id_str,
                   table_div:    table_div,
                   par_data:     par_data,
                   par_id:       par_id,
                   par_type:     par_type,
                 });
    }
  }
  else
    console.error("Item "+id+" not found. "); // TODO! i18n
  return true;
}; // addListEntry

$.any.anyView.prototype._addListEntryFromDB = function (context,serverdata,options)
{
  let self = context ? context : this;
  if (serverdata) {
    if (serverdata.JSON_CODE)
      serverdata = serverdata.JSON_CODE;
    self.message = serverdata.message;
    if (serverdata.error) {
      self.error_server = serverdata.error;
      self.error        = i18n.error.SERVER_ERROR;
    }
    if (self.message)
      console.log("anyView._addListEntryFromDB: "+self.message);
    if (self.error_server)
      console.error("anyView._addListEntryFromDB: "+self.error_server);
    let view = options.context ? options.context : null;
    if (view) {
      view.showMessages("",false);
      serverdata.mode       = "list";
      serverdata.type       = options.type;
      serverdata.id_str     = options.id_str;
      serverdata.row_id_str = options.row_id_str;
      serverdata.new_id     = serverdata.id;
      let the_id = Number.isInteger(parseInt(serverdata.new_id)) ? parseInt(serverdata.new_id) : serverdata.new_id;
      serverdata.row_id_str = serverdata.id_str ? serverdata.id_str+"_"+the_id : ""+the_id;
      if (typeof serverdata.new_id == "string")
        if (serverdata.new_id.length && serverdata.new_id[0] != "+")
          serverdata.new_id = "+"+serverdata.new_id;
      serverdata.data      = options.data     ? options.data     : view.model.data;
      serverdata.par_data  = options.par_data ? options.par_data : null;
      serverdata.par_id    = options.par_id   ? options.par_id   : null;
      serverdata.par_type  = options.par_type ? options.par_type : null;
      serverdata.filter    = view.getFilter(serverdata.type,serverdata.mode);
      serverdata.table_div = options.table_div;
      view._addListEntry(serverdata);
    }
  }
}; // _addListEntryFromDB

$.any.anyView.prototype._addListEntry = function (opt)
{
  let type       = opt.type;
  let mode       = opt.mode;
  let new_id     = opt.new_id;
  let par_data   = opt.par_data;
  let par_id     = opt.par_id;
  let par_type   = opt.par_type;
  let id_str     = opt.id_str;
  let row_id_str = opt.row_id_str;
  let filter     = opt.filter;
  let table_div  = opt.table_div;
  if (!table_div) {
    console.error("Table missing. "); // TODO! i18n
    return null;
  }

  let indata = {};
  if ((new_id || new_id===0) && !indata[new_id]) { // New row
    indata = {};
    indata[mode] = type;
  }
  if (indata) {
    indata.type = type;
    indata.mode = mode;
    let id_key  = this.model.id_key
                  ? this.model.id_key
                  : type+"_id";
    for (let filter_id in filter) {
      if (filter_id == id_key)
        indata[filter_id] = new_id;
      else
      if (filter_id != "group_id")
        indata[filter_id] = "";
    }
    indata.is_new = true;
  }
  let the_data = opt.data ? opt.data : this.model.data;
  if (new_id || new_id===0)
    this.model.dataInsert({
                 type:     opt.type,
                 data:     the_data,
                 id:       null,
                 new_data: indata,
                 new_id:   new_id,
               });
  else
    this.model.dataUpdate({
                 type:     opt.type,
                 data:     the_data,
                 id:       opt.id,
                 new_data: indata,
               });
  opt.new_id = null; // Important! To make addListEntry work with id === 0

  this.refreshData({
         table_div:  table_div,
         type:       type,
         mode:       mode,
         data:       the_data,
         id:         new_id,
         par_data:   par_data,
         par_id:     par_id,
         par_type:   par_type,
         id_str:     id_str,
         row_id_str: row_id_str,
         edit:       true,
       });
}; // _addListEntry

// Default action when clicking on a name link.
$.any.anyView.prototype.itemLinkClicked = function (event)
{
  this.data_level = 0;
  return this.showItem(event);
}; // itemLinkClicked

// Find and open a (possibly new and empty) item view.
$.any.anyView.prototype.showItem = function (event)
{
  event.data.view = this;
  let type   = event.data.type;
  let id     = event.data.id;
  let is_new = event.data.is_new;

  if (is_new || id == "new" || id == -1 || (!id && id !== 0)) {
    // Find id for a new item if one is not specified
    if (this.model.source == "local") {
      if ((!id && id !== 0) || id < 0)
        id = this.model.dataSearchNextId(this.model.data,type);
      if ((!id && id !== 0) || id < 0) {
        this.model.error = i18n.error.NEW_ID_NOT_FOUND.replace("%%", type);
        console.error(this.model.error,null);
        return false;
      }
      event.data.id = id;
      event.data.is_new = true;
      return this._doShowItem(event.data);
    }
    else { // remote
      if ((!id && id !== 0) || id < 0) {
        let f = []; f[0] = this.model.id_key;
        this.showMessages(null,true); // TODO! i18n
        let model = this.model;
        let view  = this;
        if (type != this.model.type) {
          model = this.createModel({
                         type: type,
                         data: null,
                         id:   null,
                       });
          view  = this.createView({
                    model:        model,
                  });
        }
        if (model && view)
          model.dbSearchNextId({
                  type:         type,
                  is_new:       is_new,
                  table_fields: f,
                  onSuccess:    view._foundNextIdFromDB,
                  context:      view,
                }); // TODO! Asynchronous database call
      }
      else
        this._doShowItem(event.data); // TODO! Not tested!
    }
  }
  else
    return this._doShowItem(event.data);
}; // showItem

$.any.anyView.prototype._foundNextIdFromDB = function (context,serverdata,options)
{
  let self = context ? context : this;
  if (serverdata) {
    if (serverdata.JSON_CODE)
      serverdata = serverdata.JSON_CODE;
    self.message = serverdata.message;
    if (serverdata.error) {
      self.error_server = serverdata.error;
      self.error        = i18n.error.SERVER_ERROR;
    }
    if (self.message)
      console.log("anyView._foundNextIdFromDB: "+self.message);
    if (self.error_server)
      console.error("anyView._foundNextIdFromDB: "+self.error_server);
    let view = options.context ? options.context : null;
    self.model.dbSearchNextIdSuccess(self.model,serverdata,options);
    if (view) {
      options.id = serverdata.id;
      view._doShowItem(options);
    }
  }
}; // _foundNextIdFromDB

// Open a (possibly new and empty) item view.
$.any.anyView.prototype._doShowItem = function (opt)
{
  let type     = opt.head ? opt.head : opt.item ? opt.item : opt.list ? opt.list : opt.type ? opt.type : "";
  let data     = opt.data;
  let id       = opt.id;
  let is_new   = opt.is_new != undefined ? opt.is_new : false;
  let name_key = this.model.name_key ? this.model.name_key : type+"_name";

  // Determine the id and the data to display - new or existing
  let the_data = null;
  if (is_new)
    the_data = data;
  else
    the_data = this.model.dataSearch({ type:type, id:id });
  let the_id = null;
  if (the_data && the_data[id])
    the_id = id;
  else
  if (the_data && the_data["+"+id])
    the_id = "+"+id;
  if (!the_id && is_new)
    if (id)
      the_id = id;
    else
      the_id = 0;
  if (!the_id && the_id !== 0 || this.model.error) {
    console.error("System error: Could not find id. "); // TODO! i18n
    if (this.message)
      console.log("anyView._doShowItem: "+this.message);
    if (this.error_server)
      console.error("anyView._doShowItem: "+this.error_server);
    this.showMessages(i18n.error.SERVER_ERROR);
    return false;
  }

  // Find the item name
  let item_name = null;
  if (the_id && !is_new)
    item_name = the_data[the_id][name_key];
  else
    item_name = i18n.message.newType.replace("%%",type); // Edit new

  // Create a new item
  let topidx = "+0";
  if (the_id || the_id === 0)
    topidx = the_id;
  let the_item = {
    [topidx]: { // Header
      head: type,
      [name_key]: item_name,
      data: {},
    },
  };
  let the_item_data = the_item[topidx].data;
  if (!opt.showHeader && !is_new)
    the_item = the_item_data;
  if (is_new) {
    // Fill the item with empty data for all displayable entries
    the_item_data[the_id] = {};
    let filter = this.getFilter(type,"item");
    for (let filter_id in filter)
      if (filter[filter_id].DISPLAY)
        the_item_data[the_id][filter_id] = "";
  }
  else {
    // Fill the item with data copied from original data structure
    the_item_data[the_id] = the_data && the_data[the_id]
                            ? $.extend(true, {}, the_data[the_id])
                            : null;
    if (the_item_data[the_id].head)
      delete the_item_data[the_id].head; // ...because this is an item
    if (the_item_data[the_id].list)
      delete the_item_data[the_id].list; // ...because this is an item
  }
  the_item_data[the_id].item   = type;
  the_item_data[the_id].is_new = is_new;

  // Create and prepare a new display area
  let idx = Number.isInteger(parseInt(the_id)) ? ""+parseInt(the_id) : the_id;

  let model = this.createModel({
                     type: type,
                     data: the_item,
                     id:   the_id,
                   });
  let view = this.createView({
                    model:        model,
                    parent:       this.element,
                    id_str:       idx, // TODO! Is this correct?
                    data_level:   0, // Reset data_level for the new view
                    indent_level: 0, // Reset indent_level for the new view
                    showHeader:       opt.showHeader       === false     ? false                : true,
                    showButtonEdit:   opt.showButtonEdit   !== undefined ? opt.showButtonEdit   : this.options.showButtonEdit,
                    showButtonUpdate: opt.showButtonUpdate !== undefined ? opt.showButtonUpdate : this.options.showButtonUpdate,
                    showButtonCancel: opt.showButtonCancel !== undefined ? opt.showButtonCancel : this.options.showButtonCancel,
                    showTableHeader:  opt.showTableHeader  !== undefined ? opt.showTableHeader  : this.options.showTableHeader,
                    onEscEndEdit:     opt.onEscEndEdit     !== undefined ? opt.onEscEndEdit     : this.options.onEscEndEdit,
                  });
  if (!view || !view.options || !view.options.top_view) {
    console.error("System error: View missing. "); // TODO! i18n
    return false;
  }
  let top_view = this.options.top_view;
  if (top_view && top_view.element && top_view.element.length)
    view.element = top_view.element;

  // Set the state of the new view
  view.options.item_opening = true; // To make top right close icon appear
  if (is_new) {
    view.options.isEditable  = true;
    view.options.isDeletable = false;
    view.options.isRemovable = false;
  }
  // Display the item data
  if (view.model.source == "remote" && !is_new) {
    // Remote search: Will (normally) call refresh via onModelChange
    view.showMessages("",true);
    view.model.dbSearch({
                 type:     type,
                 id:       the_id,
                 header:   true,
                 grouping: this.options.grouping,
                 context:  view.model,
               });
  }
  else {
    // Local refresh: Display the empty data structure just created
    if (is_new && opt.showHeader)
      the_id = topidx;
    view.refresh({
           type:  type,
           mode:  "item",
           data:  the_item,
           id:    the_id,
           edit:  is_new,
           clear: true,
         });
  } // else
  return true;
}; // _doShowItem

$.any.anyView.prototype.closeItem = function (event)
{
  if (this.options.top_view)
    this.options.top_view.refresh({clear:true});
}; // closeItem

$.any.anyView.prototype.toggleEdit = function (event)
{
  if (!event || !event.data)
    return null;
  return this.doToggleEdit(event.data);
}; // toggleEdit

$.any.anyView.prototype.doToggleEdit = function (opt)
{
  if (!opt)
    return null;
  /*
  if (this.current_edit && this.current_edit.edit) {
    opt = this.current_edit;
    opt.edit = false;
  }
  */
  opt.edit = !opt.edit;
  let prefix  = this.id_base+"_"+opt.type+"_"+opt.mode+"_"+opt.row_id_str;
  let elem_id = opt.mode == "item"
                ? prefix+"_tbody"
                : prefix+"_tr";
  let elem = $("#"+elem_id);
  if (elem.length) {
    if (opt.mode != "item") {
      if (!opt.edit && (this.options.onEscRemoveEmpty || this.options.onFocusoutRemoveEmpty)) {
        // Check all entries defined in filter, then remove if empty
        let is_empty = true;
        for (let filter_id in opt.filter) {
          if (opt.filter.hasOwnProperty(filter_id)) {
            let input_id = prefix+"_"+filter_id;
            let val = $("#"+input_id).find(".itemText").val();
            if (!val || val == "")
              val = $("#"+input_id).find(".itemText").text();
            if (val) {
              is_empty = false;
              break;
            }
          }
        }
        if (this.model && is_empty) {
          this.model.dataDelete({
             type: opt.type,
             data: opt.data,
             id:   opt.id,
          });
          elem.remove();
          this.current_edit = null;
        }
      }
      let new_params = {
        parent:     this.element,
        type:       opt.type,
        mode:       opt.mode,
        data:       opt.data,
        id:         opt.id,
        par_type:   opt.par_type,
        par_mode:   opt.par_mode,
        par_data:   opt.par_data,
        par_id:     opt.par_id,
        id_str:     opt.id_str,
        row_id_str: opt.row_id_str,
        edit:       opt.edit,
      };
      new_params.data_div  = this.getOrCreateDataContainer({
                                    parent: this.element,
                                    type:   opt.type,
                                    mode:   opt.mode,
                                    id_str: opt.id_str,
                                  });
      new_params.table_div = this.getOrCreateTable({
                                    parent:     new_params.data_div,
                                    type:       opt.type,
                                    mode:       opt.mode,
                                    id_str:     opt.id_str,
                                  });
      this.refreshData(new_params);
    }
    else {
      this.refreshItemTableDataRow({
             parent:     elem,
             type:       opt.type,
             mode:       opt.mode,
             data:       opt.data,
             id:         opt.id,
             par_data:   opt.par_data,
             par_id:     opt.par_id,
             id_str:     opt.id_str,
             row_id_str: opt.row_id_str,
             edit:       opt.edit,
           });
    }
  }
  let edit_icon   = prefix+"_edit .any-edit-icon";
  let update_icon = prefix+"_edit .any-update-icon";
  let add_icon    = prefix+"_add_icon";
  let remove_icon = prefix+"_remove_icon";
  let delete_icon = prefix+"_delete_icon";
  let cancel_icon = prefix+"_cancel_icon";
  if (this.options.isEditable && opt.edit) {
    $("#"+edit_icon).hide();
    $("#"+update_icon).show();
    $("#"+add_icon).show();
    $("#"+remove_icon).hide();
    if (this.options.isDeletable && this.options.showButtonDelete)
      $("#"+delete_icon).show();
    $("#"+cancel_icon).show();
    this.current_edit = {
      type:       opt.type,
      mode:       opt.mode,
      data:       opt.data,
      id:         opt.id,
      par_data:   opt.par_data,
      par_id:     opt.par_id,
      id_str:     opt.id_str,
      row_id_str: opt.row_id_str,
      edit:       true,
      filter:     opt.filter,
      is_new:     opt.is_new,
      isEditable: opt.isEditable, // TODO! Not used?
    };
    let filter_id = this.model && this.model.name_key ? this.model.name_key : opt.type+"_name";
    let nameid = prefix+"_"+filter_id+" .itemEdit";
    let txt = $("#"+nameid);
    if (txt.length) {
      // Bind enter key
      txt.off("keyup").on("keyup",     this.current_edit, $.proxy(this._processKeyup,this));
      txt.off("keydown").on("keydown", this.current_edit, $.proxy(this._processKeyup,this)); // For catching the ESC key on Vivaldi
    }
    // Initialize thirdparty components (tinymce, etc.)
    this.initComponents();
  }
  else {
    if (this.options.isEditable && this.options.showButtonEdit)
      $("#"+edit_icon).show();
    $("#"+update_icon).hide();
    $("#"+add_icon).hide();
    if (this.options.isRemovable && this.options.showButtonRemove)
      $("#"+remove_icon).show();
    $("#"+delete_icon).hide();
    $("#"+cancel_icon).hide();
    this.current_edit = null;
    this.showMessages("");
  }
  return this;
}; // doToggleEdit

$.any.anyView.prototype._toggleChecked = function (event)
{
  let opt = event.data;
  let chk_id  = this.id_base+"_"+opt.type+"_"+opt.mode+"_"+opt.row_id_str+"_select_icon .check";
  let check_str = opt.checked
                  ? "<i class='fa-regular fa-square'></i>"
                  : "<i class='fa-regular fa-square-check'></i>";
  let chk = $("#"+chk_id);
  if (chk.length)
    chk.html(check_str);
  opt.checked = !opt.checked;
  if (!this.options.select)
    this.options.select = new Set();
  if (!this.options.unselect)
    this.options.unselect = new Set();
  if (opt.checked) {
    this.options.select.add(parseInt(opt.id));
    this.options.unselect.delete(parseInt(opt.id));
  }
  else {
    this.options.select.delete(parseInt(opt.id));
    this.options.unselect.add(parseInt(opt.id));
  }
}; // _toggleChecked

// Remove a row (and subrows, if any) from a list, or the main container of an item.
// Does not  remove from memory (data structure).
$.any.anyView.prototype.removeFromView = function (opt)
{
  let type   = opt.type;
  let mode   = opt.mode;
  let data   = opt.data;
  let id     = opt.id;
  let id_str = opt.id_str;

  if (mode == "list") {
    let elem_id = this.id_base+"_"+type+"_"+mode+"_"+id_str +"_tr";
    let tr = $("#"+elem_id);
    if (tr.length)
      tr.remove();
    // Remove subrows, if any
    let item = this.model.dataSearch({
                            type: type,
                            data: data,
                            id:   id,
                          });
    if (!item || !item[id])
      return null; // Should never happen
    if (item[id].data) {
      // Remove subdata
      for (let new_id in item[id].data) {
        if (item[id].data.hasOwnProperty(new_id)) {
          let the_id = Number.isInteger(parseInt(new_id)) ? parseInt(new_id) : new_id;
          let elem_id = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_"+the_id+"_tr";
          let tr      = $("#"+elem_id);
          if (tr.length)
            tr.remove();
        }
      }
    }
  }
  else
  if (mode == "item") {
    let elem_id = this.id_base+"_"+type+"_"+mode+"_"+id_str+"_container";
    let con = $("#"+elem_id);
    if (con.length && con.parent().length && con.parent().parent().length)
      con.parent().parent().remove();
  }
  return this;
}; // removeFromView

/////////////////////////////////////////////////////////////////////////////////////////
//
// Methods that call db methods
//
/////////////////////////////////////////////////////////////////////////////////////////

/**
 * Search for the list of possible parent items for the item with the given id.
 * Called when processing type filters.
 * The success metod builds a dropdown menu.
 *
 * @method anyView.dbSearchParents
 * @param  type
 * @param  mode
 * @param  id
 * @param  val
 * @param  par_id
 * @param  edit
 * @return true on success, false on error.
 */
$.any.anyView.prototype.dbSearchParents = function (type,mode,id,val,edit,par_id)
{
  if (!this.model)
    return val;
  let options = {
   type:      type,
   mode:      mode,
   id:        null, // Search for all items of given type
   parent_id: par_id,
   child_id:  id,
   simple:    true,
   onSuccess: this.createParentDropdownMenu,
   context:   this,
  };
  if (edit) {
    this.showMessages("",true);
    return this.model.dbSearch(options); // TODO! What if source == "local"?
  }
  else {
    options.id = id;
    let item = this.model.dataSearch(options);
    if (item)
      return item[id].parent_name;
    return "";
  }
}; // dbSearchParents

// Create the dropdown menu to select parent from.
$.any.anyView.prototype.createParentDropdownMenu = function (context,serverdata,options)
{
  let self = context ? context : this;
  self.db_last_command = "sea";

  if (serverdata) {
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
      console.log("anyView.createParentDropdownMenu: "+self.message);
    if (self.error_server)
      console.error("anyView.createParentDropdownMenu: "+self.error_server);
    if (serverdata.data) {
      let view = options.context ? options.context : null;
      if (view) {
        let mode      = options.mode;
        let type_name = options.type+"_name";
        let the_id    = Number.isInteger(parseInt(options.child_id)) ? parseInt(options.child_id) : options.child_id;
        let id_str    = "0_"+the_id;
        let data      = serverdata.data;
        let itemsel_id = view.id_base+"_"+options.type+"_"+mode+"_"+id_str+"_parent_id .itemSelect";
        let itemsel_dd = $("#"+itemsel_id);
        let did_select = "selected='true'";
        let topidx = "+0";
        if (the_id || the_id === 0)
          topidx = the_id;
        data = data[topidx] ? data[topidx].data : data;
        data = data[options.type] ? data[options.type].data : data;
        $.each(data,function (id,item) {
          if (parseInt(id) != the_id) {
            let sel = parseInt(id) == parseInt(options.parent_id) ? "selected='true'" : "";
            let pname = data[id][type_name];
            itemsel_dd.append($("<option "+sel+">").attr("value",parseInt(id)).text(pname));
            if (sel != "") {
              $("#"+itemsel_id+"-button").text(item[type_name]);
              did_select = "";
            }
          }
        });
        itemsel_dd.prepend($("<option "+did_select+">").attr("value","null").text("[None]")); // TODO! i18n
      } // if view
    }
  }
}; // createParentDropdownMenu

$.any.anyView.prototype.dbUpdate = function (event)
{
  if (!this.model)
    throw i18n.error.MODEL_MISSING;
  if (!event || !event.data) {
    console.warn("event or event.data missing. ");
    return false;
  }
  // Validate input data
  let errstr = this.validateUpdate(event.data);
  if (errstr) {
    this.model.error = errstr;
    console.error(this.model.error);
    this.showMessages();
    return false;
  }
  let type       = event.data.type;
  let mode       = event.data.mode;
  let new_data   = event.data.new_data;
  let id         = event.data.id;
  let par_type   = event.data.par_type;
  let par_mode   = event.data.par_mode;
  let par_data   = event.data.par_data;
  let par_id     = event.data.par_id;
  let id_str     = event.data.id_str;
  let row_id_str = event.data.row_id_str;

  this.model.error = "";
  if (!id && id !== 0) // Should never happen
    this.model.error += i18n.error.ID_MISSING;
  if (!new_data || !new_data[id]) // Should never happen
    this.model.error += i18n.error.DATA_MISSING;
  if (this.model.error) {
    console.error("System error: "+this.model.error);
    this.showMessages();
    return false;
  }
  // Update model with contents of input fields
  let filter = this.getFilter(type,mode);
  let data_values = {};
  for (let filter_id in filter) {
    if (filter.hasOwnProperty(filter_id)) {
      let val = null;
      let input_id = this.id_base+"_"+type+"_"+mode+"_"+row_id_str+"_"+filter_id+" .itemEdit";
      if ($("#"+input_id).length)
        val = $("#"+input_id).val();
      else {
        // Send values marked as dirty to server even if they are not editable
        input_id = this.id_base+"_"+type+"_"+mode+"_"+row_id_str+"_"+filter_id+"[dirty='true']";
        if ($("#"+input_id).length)
          val = $("#"+input_id).val();
      }
      if (val || val == "") {
        data_values[filter_id] = val;
        if (filter_id == "parent_id") {
          let input_id = this.id_base+"_"+type+"_"+mode+"_"+row_id_str+"_"+filter_id+" .itemSelect option:selected";
          let pname = $("#"+input_id).text();
          data_values["parent_name"] = pname;
        }
      }
    }
  }
  this.model.dataUpdate({
     type:     type,
     id:       id,
     new_data: data_values,
  });
  if (mode == "item" && this.options.top_view && this.options.top_view.model) {
    // If a top_view exists, insert/update the data there too
    if (event.data.is_new) {
      // Insert new
      let indata = {};
      $.extend(true, indata, new_data[id]);
      delete indata.dirty;
      delete indata.item;
      indata.head = new_data[id].item; // TODO! Is this a good solution in every case?
      this.options.top_view.model.dataInsert({
                                    type:     type,
                                    new_id:   id,
                                    new_data: indata,
                                  });
    }
    else {
      // Update existing
      this.options.top_view.model.dataUpdate({
        type:     type,
        id:       id,
        new_data: data_values,
      });
    }
  }
  if (id || id === 0) { // TODO!
    if (mode == "item" && this.options.view) {
      // Update header for item view
      let topidx = "+0";
      if (id || id === 0)
        topidx = id;
      let head_item = this.options.view.model.dataSearch({
                                                type: type,
                                                id:   topidx,
                                              });
      if (head_item && head_item[topidx]) {
        if (data_values[this.model.name_key]) {
          head_item[topidx][this.options.view.model.name_key] = data_values[this.model.name_key];
          this.options.view.options.item_opening = true;
          this.options.view.id_stack = [];
          this.options.view.refresh(); // TODO! Refreshes entire view, but only need to refresh header
        }
      }
    }
  }
  // Update view TODO! Neccessary for source == "remote"?
  let item = this.model.dataSearch({
                          type: type,
                          id:   id,
                        });
  if (item && item[id])
    delete item[id].is_new; // TODO! Neccessary?
  if (mode == "list") {
    let tr_id = this.id_base+"_"+type+"_"+mode+"_"+row_id_str+"_tr";
    let tr    = $("#"+tr_id);
    if (!tr.length) {
      console.error("dbUpdate: Could find row "+tr_id);
      return false;
    }
    let params = {
      parent:     tr.parent(),
      type:       type,
      mode:       mode,
      data:       new_data,
      id:         id,
      par_type:   par_type,
      par_mode:   par_mode,
      par_data:   par_data,
      par_id:     par_id,
      id_str:     id_str,
      row_id_str: row_id_str,
      edit:       false,
    };
    this.refreshListTableDataRow(params);
  }
  else {
    this.options.isDeletable = this.options.isEditable;
    this.id_stack.pop();
    this.refresh();
  }
  // Update database
  if (this.model.source == "remote") {
    // Spinner
    let icid = event.currentTarget.id.replace("update","edit");
    if (icid && icid != "") {
      let icdiv = $("#"+icid);
      let res = icdiv.find($(".fas"));
      res.toggleClass('fa-pencil-alt').toggleClass('fa-solid fa-spinner fa-spin'); // TODO! CSS
    }
    if (par_id && par_data && par_data[par_id] && (par_data[par_id].head == "group" || par_data[par_id].item == "group" || par_data[par_id].list == "group"))
      event.data.group_id = par_id;
    return this.model.dbUpdate(event.data);
  }

  if (item && item[id]) {
    delete item[id].is_new;
    delete item[id].dirty;
  }
  return true;
}; // dbUpdate

// Override this in derived classes
$.any.anyView.prototype.validateUpdate = function (data)
{
  return "";
}; // validateUpdate

/**
 * Search for the list of items to select from.
 * Called when selecting in the "Add..." menu in bottom toolbar of an item.
 * The success metod builds a list of selectable items in a dialog.
 *
 * @method anyView.dbSearchLinks
 * @param  {Object} event
 * @return true on success, false on error.
 */
$.any.anyView.prototype.dbSearchLinks = function (event)
{
  if (!this.model)
    return false;
  let options = {
   parent_view: this,
   type:        event.data.link_type,
   id:          null,
   par_type:    event.data.type,
   par_id:      event.data.id,
   id_str:      event.data.id_str,
   header:      true,
   grouping:    null,
   simple:      true,
   from:        0,
   num:         this.options.itemsPerPage,
   onSuccess:   this.dbUpdateLinkListDialog, // Call the view success handler
  };
  this.showMessages("",true);
  return this.model.dbSearch(options); // TODO! What if source == "local"?
}; // dbSearchLinks

// Create a list of selectable items and display in a modal dialog.
// Note: The 'this' context is here the calling model! Use options.parent_view for view methods!
$.any.anyView.prototype.dbUpdateLinkListDialog = function (context,serverdata,options)
{
  let model = context ? context : this;
  model.db_last_command = "sea";

  if (serverdata) {
    if (serverdata.JSON_CODE)
      serverdata = serverdata.JSON_CODE;
    if (Object.size(serverdata.data) === 0)
      serverdata.data = null;
    model.message = serverdata.message;
    if (serverdata.error) {
      model.error_server = serverdata.error;
      model.error        = i18n.error.SERVER_ERROR;
    }
    if (model.message)
      console.log("anyView.dbUpdateLinkListDialog: "+model.message);
    if (model.error_server)
      console.error("anyView.dbUpdateLinkListDialog: "+model.error_server);

    if (serverdata.data && options) {
      let parent_view = options.parent_view ? options.parent_view : null;
      if (parent_view) {
        let type        = options.par_type ? options.par_type : model.type;
        let data        = options.par_data ? options.par_data : serverdata.data;
        let id          = options.par_id   ? options.par_id   : model.id;
        let new_id_base = parent_view._createIdBase();
        let link_type   = options.type;
        let ll_id       = new_id_base+"_"+link_type+"_link_list";
        let ll_contents = $("<div id='"+ll_id+"'></div>");
        let ll_model = parent_view.createModel({
                                     type: link_type,
                                     data: serverdata.data,
                                   });
        let select_list_view = parent_view.createView({
                                             model:        ll_model,
                                             parent:       ll_contents,
                                             data_level:   0,
                                             indent_level: 0,
                                             id_str:       "", // TODO!
                                           });
        if (select_list_view && select_list_view.options) {
          select_list_view.id_base = new_id_base;
          select_list_view.options.grouping        = null;
          select_list_view.options.showHeader      = false;
          select_list_view.options.showTableHeader = false;
          select_list_view.options.showTableFooter = false;
          select_list_view.options.showButtonAddLinkItem  = false;
          select_list_view.options.showButtonAddLinkGroup = false;
          select_list_view.options.simple                 = options.simple; // true
          select_list_view.options.isSelectable    = true; // Use the select filter, if available
          select_list_view.options.unselect        = new Set();
          select_list_view.options.select          = new Set();
          select_list_view.options.preselected = model.dataSearch({ data: model.data,
                                                                    type: link_type });
          let the_view = parent_view._findViewOfType(link_type);
          if (!the_view) {
            if (options.par_type == "group")
              the_view = parent_view;
            else {
              let data_idx = "link-"+link_type;
              parent_view.model.data[id].data[id].data[data_idx] =
                {
                  data: {
                   0: { // Dummy entry, to make parent create a list view/model
                     list: link_type,
                     grouping: true,
                   }
                  },
                  head: link_type,
                  grouping: true,
                  [link_type+"_name"]: link_type+"s", // TODO!
                };
              parent_view.options.item_opening = true;
              parent_view.refresh();
              the_view = parent_view._findViewOfType(link_type);
            }
          }
          if (select_list_view.options.preselected)
            parent_view._addPreSelections(select_list_view);
          let par_view_id = parent_view.id_base+"_"+options.par_type+"_head_"+options.id_str+"_data";
          let mod_opt = {
            parentId:   par_view_id,
            elementId:  "",
            heading:    "Select "+link_type+"s to add / remove", // TODO! i18n
            contents:   select_list_view.element,
            width:      "25em", // TODO! css
            ok:         true,
            cancel:     true,
            okFunction: the_view.dbUpdateLinkList,
            context:    the_view,
            // Used by okFunction:
            data:       data,
            type:       type,
            mode:       "item",
            id:         id,
            link_data:  select_list_view.model.data,
            link_type:  select_list_view.model.type,
            link_mode:  "list",
            link_id:    null,
            select:     select_list_view.options.select,
            unselect:   select_list_view.options.unselect,
            name_key:   select_list_view.model.name_key,
          };
          w3_modaldialog(mod_opt);
          select_list_view.refresh();
        }
        if (parent_view.options.showToolbar) {
          parent_view.options.item_opening = true; // To make top right close icon appear
          parent_view.refreshToolbarForView({
            parent: parent_view.element,
            type:   type,
            mode:   "item",
            data:   data,
            id:     id,
            edit:   false,
          });
        }
      } // if parent_view
    }
  }
  return context;
}; // dbUpdateLinkListDialog

$.any.anyView.prototype._addPreSelections = function (select_list_view)
{
  let model       = select_list_view.model;
  let preselected = select_list_view.options.preselected;
  let select      = select_list_view.options.select;
  for (var val in preselected) {
    if (preselected.hasOwnProperty(val)) {
      let d = preselected[val];
      let sel_id = d[model.id_key];
      if ((sel_id || sel_id === 0) && d.list == model.type)
        select.add(parseInt(sel_id));
      if (d.data && this.model.id && sel_id != this.model.id && parseInt(sel_id) != parseInt(this.model.id))
        this._addPreSelections(select_list_view);
    }
  }
}; // _addPreSelections

// This method is used by dbUpdateLinkListDialog()
$.any.anyView.prototype._findViewOfType = function (type)
{
  let v = null;
  if (this.views) {
    // Find the view to refresh
    for (let x in this.views) {
      if (this.views.hasOwnProperty(x)) {
        let the_view = this.views[x];
        if (the_view.model && the_view.model.type == type &&
            the_view.mode != "head") // TODO! We should get rid of this.mode, this seems to be the only place it is used
          return the_view;
        else {
          v = the_view._findViewOfType(type);
          if (v && v.model && v.model.type == type)
            return v;
        }
      }
    }
  }
  return v;
}; // _findViewOfType

$.any.anyView.prototype._findViewById = function (id)
{
  let v = null;
  if (this.views) {
    // Find the view to refresh
    for (let x in this.views) {
      if (this.views.hasOwnProperty(x)) {
        let the_view = this.views[x];
        let elm = the_view.element;
        let eid = elm.attr(id);
        if ($("#"+eid).length)
          return the_view;
        else
          v = the_view._findViewById(id);
      }
    }
  }
  return v;
}; // _findViewById

$.any.anyView.prototype.dbRemoveDialog = function (event)
{
  if (!this.model)
    throw i18n.error.MODEL_MISSING;
  if (!event || !event.data)
    throw i18n.error.DATA_MISSING;

  let type      = event.data.type;
  let mode      = event.data.mode;
  let data      = event.data.data;
  let id        = event.data.id;
  let link_type = event.data.par_type;
  let link_mode = event.data.par_mode;
  let link_data = event.data.par_data;
  let link_id   = event.data.par_id;

  if (!data || !data[id]) {
    console.warn("Data not found ("+type+" id="+id+"). ");
    return null;
  }
  let name_key = this.model && this.model.name_key ? this.model.name_key : type+"_name";
  if (this.options.confirmRemove && !data[id].is_new) {
    let linkdata = this.model.dataSearch({ type:   type,
                                           id:     id,
                                           parent: true,
                                        });
    let the_name = data[id][name_key] ? data[id][name_key] : "";
    let msgstr   = i18n.message.removeByName.replace("%%",type+" '"+the_name+"'");
    if (mode == "list") {
      let lfname = linkdata && linkdata[this.model.name_key]
                   ? "from the "+linkdata[this.model.name_key]+" list"
                   : "from this "+link_type; // TODO! i18n
      msgstr += " "+lfname;
    }
    let msg = "<div class='any-confirm-remove-dialog' id='"+this.id_base+"_confirm_remove' style='padding:.8em;'>"+
              msgstr+"?"+
              "</div>";
    let parent_id = this.element.attr("id");
    if (parent_id) {
      let mod_opt = {
        parentId:   parent_id,
        elementId:  "",
        heading:    mode == "item" ? i18n.button.buttonRemove : i18n.button.buttonRemoveFromList.replace("%%",type),
        contents:   msg,
        width:      "25em", // TODO! css
        ok:         true,
        cancel:     true,
        okFunction: this.dbUpdateLinkList,
        context:    this,
        // Sent to okFunction:
        data:       link_data,
        type:       link_type,
        mode:       link_mode,
        id:         link_id,
        link_data:  data,
        link_type:  type,
        link_mode:  mode,
        link_id:    id,
        name_key:   name_key,
        select:     new Set(),
        unselect:   new Set().add(id),
      };
      w3_modaldialog(mod_opt);
    } // if
  } // if
  else {
    let opt = {
        data:      link_data,
        type:      link_type,
        mode:      link_mode,
        id:        link_id,
        link_data: data,
        link_type: type,
        link_mode: mode,
        link_id:   id,
        name_key:  name_key,
        select:    new Set(),
        unselect:  new Set().add(id),
    };
    this.dbUpdateLinkList(opt);
  } // else
  return this;
}; // dbRemoveDialog

$.any.anyView.prototype.dbUpdateLinkList = function (opt)
{
  // Close dialog and stop spinner
  w3_modaldialog_close(opt.parentId,opt.elementId);
  this.showMessages("",false);

  // Make top right close icon appear
  if (this.options)
    this.options.item_opening = true;

  // Update database
  opt.context = this.model;
  if (!opt.id)
    opt.id  = this.model.link_id; // TODO! Is this always correct?
  if (!opt.type)
    if (this.model.type)
      opt.type = this.model.type;
    else
      opt.type = opt.link_type;
  if (!this.model.dbUpdateLinkList(opt))
    return false;
  return true;
}; // dbUpdateLinkList

/**
 * Deletes an item from memory and database and refreshes view.
 *
 * @method anyView.dbDeleteDialog
 * @param {Object}  options
 *
 * @return this
 *
 * @throws {MODEL_MISSING} If `this.model` or `this.model.permission` are null or undefined.
 * @throws {DATA_MISSING}
 */
$.any.anyView.prototype.dbDeleteDialog = function (event)
{
  if (!this.options)
    return false;
  if (!this.model)
    throw i18n.error.MODEL_MISSING;
  if (!event || !event.data)
    throw i18n.error.DATA_MISSING;

  let type   = event.data.type;
  let mode   = event.data.mode;
  let data   = event.data.data;
  let id     = event.data.id;
  let id_str = event.data.row_id_str;

  let item = this.model.dataSearch({
                          type: type,
                          id:   id,
                          data: data,
                        });
  if (!item || !item[id])
    throw i18n.error.SYSTEM_ERROR; // Should never happen

  if (item[id].is_new || !this.options.confirmDelete) {
    if (item[id].is_new)
      event.data.top_view = this.options.view;
    this.dbDelete(event.data);
  }
  else { // Ask for confirmation
    let name_key = this.model && this.model.name_key ? this.model.name_key : type+"_name";
    let the_name = item[id][name_key] ? item[id][name_key] : "";
    let msgstr = event.data.message
                 ? event.data.message
                 : i18n.message.deleteByName.replace("%%", the_name);
    let msg = "<div class='any-confirm-delete-dialog' id='"+this.id_base+"_confirm_delete' style='padding:1em;'>"+
              msgstr+
              "</div>";
    let parent_id = this.element.attr("id");
    if (parent_id)
      w3_modaldialog({
        parentId:   parent_id,
        elementId:  "",
        heading:    i18n.button.buttonDelete,
        contents:   msg,
        width:      "25em",
        ok:         true,
        cancel:     true,
        okFunction: this.dbDelete,
        context:    this,
        // Sent to okFunction dbDelete:
        type:       type,
        mode:       mode,
        data:       data,
        id:         id,
        id_str:     id_str,
      });
  }
  return true;
}; // dbDeleteDialog

$.any.anyView.prototype.dbDelete = function (opt)
{
  // Close dialog and start spinner
  w3_modaldialog_close(opt.parentId,opt.elementId);
  this.showMessages("",true);

  if (!this.model)
    throw i18n.error.MODEL_MISSING;

  let item = this.model.dataSearch(opt);
  if (!item || !item[opt.id])
    throw i18n.error.SYSTEM_ERROR; // Should never happen

  let is_new = item[opt.id].is_new;

  // Delete from model
  // If deleting an item (as opposed to a list entry), we must also delete from a potential top view
  if (opt.mode == "item") {
    this.model.data = null;
    if (this.options.top_view && this.options.top_view.model) {
      let top_model = this.options.top_view.model;
      opt.onSuccess = top_model.dbDeleteSuccess;
      opt.context   = top_model;
      top_model.dataDelete({id:opt.id,type:opt.type});
    }
  }
  else {
    opt.onSuccess = null;
    opt.context   = null;
    this.model.dataDelete(opt);
  }

  // Update view
  this.removeFromView(opt);

  // If in an item view, close the view
  if (opt.mode == "item")
    this.closeItem({data:opt});

  // Delete from database, but only if the item is not new (i.e. exists in db).
  if (!is_new)
    this.model.dbDelete(opt); // TODO! What if source == "local"?

  return true;
}; // dbDelete

/////////////////////////////////////////////////////////////////////////////////////////
//
// Miscellaneous methods
//
/////////////////////////////////////////////////////////////////////////////////////////

/**
 * Shows errors and/or messages.
 *
 * @method anyView.showMessages
 * @param {Object} modelOrString If a string, the message/error to display.
 *                               If a model, the model from which to display a message/error.
 *                               If null, `this.model` is assumed.
 * @return `this`.
 */
$.any.anyView.prototype.showMessages = function (modelOrString,spin)
{
  let div_id = this.id_base+"_any_message";
  let msgdiv = $("#"+div_id);
  if (msgdiv.length) {
    msgdiv.empty();
    if (!modelOrString && modelOrString != "")
      modelOrString = this.model;
    let close_icon = "<span id='"+div_id+"_close' style='padding-right:5px;' class='far fa-window-close'></span>";
    if (typeof modelOrString == "object" && this.options) {
      let err = this.options.showServerErrors && modelOrString.error_server ? modelOrString.error_server : modelOrString.error;
      if (err)
        msgdiv.append(close_icon+"<span style='color:red;'>"+err+"</span>");
      if (modelOrString.message) {
        if (!err)
          msgdiv.append(close_icon);
        msgdiv.append(modelOrString.message);
      }
    }
    else
    if (typeof modelOrString == "string") {
      let cl_ic = modelOrString == "" ? "" : close_icon;
      msgdiv.append(cl_ic+"<span style='color:red;'>"+modelOrString+"</span>");
    }
    $("#"+div_id+"_close").off("click").on("click",function(event) { let msgdiv = $("#"+div_id); msgdiv.empty(); });
  }
  if (spin)
    msgdiv.append("<i class='fas fa-spinner fa-spin'></i>"); // TODO! CSS
  else
    msgdiv.removeClass("fas fa-spinner fa-spin"); // TODO! CSS
  return this;
}; // showMessages

/**
 * Initializes various javascript components.
 * If overridden by derived classes, this method *must* be called.
 *
 * @method anyView.initComponents
 * @return `this`.
 */
$.any.anyView.prototype.initComponents = function ()
{
  // TinyMCE
  if (typeof tinyMCE != "undefined") {
    tinymce.init({
      selector:   ".tinymce",
      width:      "100%",
      resize:     true,
      menubar:    false,
      statusbar:  false,
      force_br_newlines: false,
      forced_root_block: 'p',
      plugins: ["link", "image", "media", "autoresize", "lists"],
      autoresize_bottom_margin: 0,
      toolbar_items_size: "small",
      theme:      "silver",
      skin: "tinymce-5",
      content_style: "body { margin: .5em; line-height: 1; }",
      toolbar1: "undo redo | cut copy paste | link unlink anchor image media code | bullist numlist | outdent indent blockquote | alignleft aligncenter alignright alignjustify | hr",
      toolbar2: "bold italic underline strikethrough subscript superscript | styleselect formatselect fontselect fontsizeselect | searchreplace",

  /* enable title field in the Image dialog*/
  image_title: true,
  /* enable automatic uploads of images represented by blob or data URIs*/
  automatic_uploads: true,
  /*
    URL of our upload handler (for more details check: https://www.tiny.cloud/docs/configure/file-image-upload/#images_upload_url)
    images_upload_url: 'postAcceptor.php',
    here we add custom filepicker only to Image dialog
  */
  file_picker_types: 'image',
  /* and here's our custom image picker*/
  file_picker_callback: (cb, value, meta) => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        /*
          Note: Now we need to register the blob in TinyMCEs image blob
          registry. In the next release this part hopefully won't be
          necessary, as we are looking to handle it internally.
        */
        const id = 'blobid' + (new Date()).getTime();
        const blobCache =  tinymce.activeEditor.editorUpload.blobCache;
        const base64 = reader.result.split(',')[1];
        const blobInfo = blobCache.create(id, file, base64);
        blobCache.add(blobInfo);

        /* call the callback and populate the Title field with the file name */
        cb(blobInfo.blobUri(), { title: file.name });
      });
      reader.readAsDataURL(file);
    });

    input.click();
  },

    });
  }
  return this;
}; // initComponents

///////////////////////////////////////////////////////////////////////////////
// This can be used to instantiate anyView
///////////////////////////////////////////////////////////////////////////////
var anyView = function (options)
{
  if (!options)
    return null;
  return $.any.anyView(options);
};
//@ sourceURL=anyView.js