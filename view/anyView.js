/* jshint sub:true */
/* jshint esversion: 9 */
/* globals $,i18n,any_defs,isFunction,w3_modaldialog,w3_modaldialog_close,tinyMCE,tinymce */
"use strict";
/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2022 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ***************************************************************************************/
/**
 * __anyView: View for the anyVista data model.__
 *
 * See <a href="../classes/anyModel.html">`anyModel`</a> for a description of the data model class.
 *
 * Note: All jQuery id's in anyVista are on the format [id_base]\_[type]\_[kind]\_[id]\_[html_name].
 *
 * @class anyView
 * @constructor Sets the view's variables according to `options`, or to default values.
 * @param {Object}  options An object which may contain these elements:
 *
 *        {Object}  model:                 The model with data to be displayed. Default: null.
 *        {Object}  filters:               The filters define how the data will be displayed. Default: null.
 *        {string}  id:                    The jQuery id of a container element in which to display the view. Default: null.
 *        {boolean} isCreatable:
 *        {boolean} isSelectable:          An icon for selecting a list row will be displayed. Ignored for items. If isSelectable is set,
 *                                         isAddable, isRemovable, isEditable and isDeletable will be ignored. Default: false.
 *        {boolean} isAddable:             An icon for adding new rows may be displayed. Ignored if isSelectable is set. Default: false.
 *        {boolean} isRemovable:           An icon for removing will be displayed. Ignored if isSelectable is set. Default: false.
 *        {boolean} isEditable:            Icons for edit, update and cancel will be displayed. Ignored if isSelectable is set. Default: false.
 *        {boolean} isDeletable:           An icon for deleting will be displayed. Ignored if isSelectable is set. Default: false.
 *        {boolean} isSortable:            List tables will be sortable by clicking on column headers. An icon indicating
 *                                         the direction of the sort wil be displayed. Default: true.
 *        {boolean} confirmRemove:         A remove confirmation dialog will be displayed. Default: true.
 *        {boolean} confirmDelete:         A delete confirmation dialog will be displayed. Default: true.
 *        {boolean} showHeader:            If false, all headers will be suppressed. Default: true.
 *        {boolean} showTableHeader:       Whether to show headers for list tables. Default: true.
 *        {boolean} showTableFooter:       Whether to show footers for list tables. Default: true.
 *        {boolean} showTableIngress:      Whether to show a description for list tables. Default: true.
 *        {boolean} showSearcher:          Whether to show a search field for list tables. Default: false.
 *        {boolean} showPaginator:         Whether to show paginator buttons for list tables. Default: true.
 *        {boolean} showToolbar:           Will show a toolbar at the bottom. Default: true.
 *        {boolean} showMessages:          Will show a message field in a toolbar. Default: false.
 *        {boolean} showServerErrors:      If true, errors from a server will be shown directly. Default: false.
 *        {boolean} showServerMessages:    If true, messages from a server will be shown directly. Default: true.
 *        {boolean} showEmptyRows:         Shows empty rows in non-edit mode. Default: false.
 *        {boolean} showButtonNew:         If isCreatable is true, a button for creating a new item may be shown. Default: false.
 *        {boolean} showButtonSelectAll:   If isSelectable is true, a button for selecting all rows may be shown in list table headers. Default: false.
 *        {integer} showButtonAdd:         If isAddable is true, a button for adding new rows may be shown in list table headers. Possible values:
 *                                         0: Do not show button. 1: Show button in first column. 2: Show button in last column. Default: 0.
 *        {boolean} showButtonRemove:      If isRemovable is true, a remove button may be shown. Possible values:
 *                                         0: Do not show button. 1: Show button in first column. 2: Show button in last column. Default: 2.
 *        {boolean} showButtonEdit:        If isEditable is true, an edit button may be shown. Possible values:
 *                                         0: Do not show button. 1: Show button in first column. 2: Show button in last column. Default: 1.
 *        {boolean} showButtonUpdate:      If isEditable is true, an update button may be shown in edit-mode. Possible values:
 *                                         0: Do not show button. 1: Show button in first column. 2: Show button in last column. Default: 1.
 *        {boolean} showButtonDelete:      If isEditable is true, a delete button may be shown in edit-mode. Possible values:
 *                                         0: Do not show button. 1: Show button in first column. 2: Show button in last column. Default: 2.
 *        {boolean} showButtonCancel:      If isEditable is true, a cancel button may be shown in edit-mode. Possible values:
 *                                         0: Do not show button. 1: Show button in first column. 2: Show button in last column. Default: 2.
 *        {boolean} showButtonSelect:      If isSelectable is true, a button for selecting a row may be shown. Possible values:
 *                                         0: Do not show button. 1: Show button in first column. 2: Show button in last column. Default: 1.
 *        {boolean} showButtonAddLink:     Will show a button for adding links to an item. Default: true.
 *        {boolean} showButtonLabels:      Will show labels for buttons on the button panel. Default: false.
 *        {boolean} onEnterCallDatabase:   Pressing enter will update the database with the value of the row being edited. Default: true.
 *        {boolean} onEnterInsertNew:      A new row will be inserted when pressing enter while editing a list. Default: false.
 *        {boolean} onEnterMoveFocus:      Pressing enter will move the focus to the next input element if editing an item. Default: True.
 *        {boolean} onEscRemoveEmpty:      The current row being edited in a list will be removed when pressing the Esc key if the row is empty. Default: true.
 *        {boolean} onEscEndEdit:          Pressing the Esc key will end the current editing. Default: true.
 *        {boolean} onFocusoutRemoveEmpty: The current row being edited in a list will be removed when loosing focus if the row is empty. Default: true.
 *        {boolean} onUpdateEndEdit:       Pressing the update button will close the element currently being edited for editing. Default: true.
 *        {boolean} useOddEven:            If true, tags for odd and even columns will be generated for list entries. Default: false.
 *        {string}  defaultKind:           The default kind to use. One of `head`. `list` or `item`. Default: `list`.
 *        {integer} itemsPerPage:          The number of rows to show per page. Only applicable for "list" and "select" kinds.
 *        {integer} currentPage:           The current page to show. Only applicable for "list" and "select" kinds.
 *        {string}  grouping:              How to group data: Empty string for no grouping, "tabs" for using anyViewTabs to group data into tabs. Default: "".
 *        {string}  sortBy:                The filter id of the table header that the table should be sorted by. Only valid if isSortable is `true`. Default: "".
 *        {string}  sortDirection:         Whether the sorting of tables should be ascending (`ASC`) or descending (`DESC`). Only valid if isSortable is `true`. Default: "`ASC`".
 *        {boolean} refresh:               If true, the constructor will call `this.refresh` at the end of initialization. Default: false.
 *        {boolean} uploadDirect:          If true, the selected file will be uploaded without the user having to press the "edit" and "update" buttons. Default: true.
 *        {object}  linkIcons:             Icons to use in the link popup menu. Default: null.
 *
 * @example
 *      new anyView({filters:my_filters,id:"my_content"});
 */
(function($) {
var ANY_LOCALE_NOT_FOUND = "No locale found. ";
var ANY_MAX_REF_REC = 30;

$.widget("any.anyView", {
  // Default options
  options: {
    model:                 null,
    filters:               null,
    id:                    null,
  //isCreatable:           true, // TODO! NOT IMPLEMENTED
    isSelectable:          false,
    isAddable:             true,
    isRemovable:           true,
    isEditable:            true,
    isDeletable:           true,
    isSortable:            true,
    confirmRemove:         true,
    confirmDelete:         true,
    showHeader:            true,
    showTableHeader:       true,
    showTableFooter:       true,
    showTableIngress:      true,
    showSearcher:          true,
    showPaginator:         true,
    showToolbar:           true,
    showMessages:          true,
    showServerErrors:      false,
  //showServerMessages:    true,  // TODO! NOT IMPLEMENTED
    showEmptyRows:         false,
    showButtonNew:         true,
  //showButtonSelectAll:   false, // TODO! NOT IMPLEMENTED
    showButtonAdd:         1,
    showButtonRemove:      2,
    showButtonEdit:        1,
    showButtonUpdate:      1,
    showButtonDelete:      2,
    showButtonCancel:      2,
    showButtonSelect:      1,
    showButtonAddLink:     true,
    showButtonLabels:      false,
    onEnterCallDatabase:   true,
    onEnterInsertNew:      true, // Note: Only used for lists, ignored for items
    onEnterMoveFocus:      true, // Will be overridden by onEnterCallDatabase==true TODO! Make it work for lists
    onEscRemoveEmpty:      true,
    onEscEndEdit:          true,
    onFocusoutRemoveEmpty: true,
  //onUpdateEndEdit:       true, // TODO! NOT IMPLEMENTED
    useOddEven:            true,
    defaultKind:           "list",
    itemsPerPage:          20,
    currentPage:           1,
    grouping:              "",
    sortBy:                "",
    sortDirection:         "ASC",
    refresh:               false,
    uploadDirect:          true,
    linkIcons:             null,

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
    itemLinkClicked: null, // TODO! rename?

    // "Private" and undocumented options:
    subscribe_default: true, // The default onModelChange method will be subscribed to.
    reset_listeners:   true, // The array of listeners will be erased on each call to the constructor.
    top_view:          null, // The top view for all views in the view tree (used by dialogs and item view)
    id_base:           "",
    data_level:        0,    // Current "vertical" level in data tree (used for class ids)
    indent_tables:     false,
    indent_level:      0,
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

    this.id_base  = this.options.id_base
                    ? this.options.id_base
                    : this._createIdBase();

    this.data_level = this.options.data_level
                      ? this.options.data_level
                      : 0;

    this.group_id = this.options.group_id; // TODO! Can we get rid of this?

    this.con_id_str = "";

    this.model = this.options.model
                 ? this.options.model
                 : null;

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
  },
}); // anyView widget constructor

///////////////////////////////////////////////////////////////////////////////
// Getters
///////////////////////////////////////////////////////////////////////////////

/**
 * @method getIdBase
 * @description
 * @return this.id_base
 */
$.any.anyView.prototype.getIdBase = function ()
{
  return this.id_base;
}; // getIdBase

/**
 * @method getFilter
 * @description
 * @return If neither `type` nor `kind` are given or if only `kind` is given, `this.options.filters` is returned.
 *         `this.options.filters` is an object containing all the view's data filters (indexed by type (e.g. "event")
 *         and kind ("item", "list", "head" or "select")).
 *         If only `type` is given, the filters of the given type are returned.
 *         If both `type` and `kind` are given, the filter of the given type and kind is returned.
 *         If no filters exist, `null` is returned.
 * @param {String} type Object type (e.g. "event"). Optional, but mandatory if `kind` is given.
 * @param {String} kind "item", "list", "head" or "select". Ignored if `type` is not given.
 */
$.any.anyView.prototype.getFilter = function (type,kind)
{
  if (!this.options.filters)
    return null;
  if (type && this.options.filters[type]) {
    if (kind && this.options.filters[type][kind])
      return this.options.filters[type][kind];
    return this.options.filters[type];
  }
  return this.options.filters;
}; // getFilter

///////////////////////////////////////////////////////////////////////////////
// Internal methods
///////////////////////////////////////////////////////////////////////////////

$.any.anyView.prototype._createIdBase = function ()
{
  return "idBase" + 1 + Math.floor(Math.random()*10000000); // Pseudo-unique id
}; // _createIdBase

// Get filters, or create them if they dont exist yet
$.any.anyView.prototype._getOrCreateFilters = function (model)
{
  let type = model ? model.type : null;
  let f = this.options.filters;
  if (!type) {
    console.warn("No type specified, cannot create filters. ");
    return f;
  }
  // Return the filter if it already exists
  if (f && f[type])
    return f;
  // Create filter for given type, if the filter exists
  let f_str = type+"Filter";
  if (!window[f_str]) {
    let def_str = "anyFilter";
    //console.warn("Filter class "+f_str+" not found, using "+def_str+". ");
    f_str = def_str;
    if (!window[f_str]) {
      console.warn("Filter class "+f_str+" not found. No filter for "+type+". ");
      return f;
    }
  }
  let filt = new window[f_str]({type:type,model:model});
  if (!f)
    f = {};
  f[type] = filt.filters[type]; // Add new filters, but dont overwrite old ones
  filt = null;
  return f;
}; // _getOrCreateFilters

$.any.anyView.prototype._findType = function (data,id,otype)
{
  let type = null;
  if (data) {
    if (id || id === 0) {
      let d = data[id] ? data[id] : data["+"+id] ? data["+"+id] : null;
      if (d)
        type = d.list ? d.list : d.item ? d.item : d.head ? d.head : null;
    }
    if (!type)
      type = data.list ? data.list : data.item ? data.item : data.head ? data.head : null;
  }
  if (!type)
    type = otype;
  if (!type)
    type = this.model.type;
  if (!type)
    type = "";
  return type;
}; // _findType

$.any.anyView.prototype._findKind = function (data,id,okind)
{
  let kind = null;
  if (data) {
    if (id || id === 0) {
      let d = data[id] ? data[id] : data["+"+id] ? data["+"+id] : null;
      if (d)
        kind = d.list ? "list" : d.item ? "item" : d.head ? "head" : null;
    }
    if (!kind)
      kind = data.list ? "list" : data.item ? "item" : data.head ? "head" : null;
  }
  if (!kind && okind != "head")
    kind = okind;
  if (!kind)
    kind = this.options.defaultKind; // If not found, set default
  if (kind == "list" && this.options.isSelectable)
    kind = "select";
  return kind;
}; // _findKind

$.any.anyView.prototype._setPermissions = function ()
{
  if (this.options.admin_always_edits) {
    let is_admin = this.model && this.model.permission && this.model.permission.is_admin;
    this.options.isEditable = this.options.isEditable || is_admin;
  }
  else
  if (this.model.permission) {
    if (this.model.permission.isEditable)
      this.options.isEditable = this.model.permission.isEditable;
  }
}; // _setPermissions

///////////////////////////////////////////////////////////////////////////////
// The onModelChange method
///////////////////////////////////////////////////////////////////////////////

/**
 * @method onModelChange
 * @description Default callback method.
 *              Calls `this.refresh` to refresh the view after model has changed.
 *              Normally, it is not neccessary to call this method directly.
 *              Override in derived classes if necessary.
 * @param {Object} model The model to refresh.
 *                 If not specified, the current model (`this.model`) is used.
 *                 If specified, `this.model` will be set to `model`, before calling `this.refresh`.
 * @return `this`.
 */
$.any.anyView.prototype.onModelChange = function (model)
{
  if (model) {
    this.model = model;
    this._setPermissions(); // Model permissions may have changed
  }
  this.refresh();
  this.showMessages(model);
  return this;
}; // onModelChange

///////////////////////////////////////////////////////////////////////////////
// Refreshments
///////////////////////////////////////////////////////////////////////////////

// Calls the empty method of the (jQuery) element
$.any.anyView.prototype.empty = function (params)
{
  if (this.element)
    this.element.empty();
  else
    $("#"+this.options.id).empty();
}; // empty

/**
 * @method refresh
 * @description Displays data in a DOM element. If an element matching the type/kind/id combination
 *              is found in the DOM, that element will be used for displaying the data. Otherwise,
 *              new elements will be created as needed.
 * @params {Object}  params  An object which may contain these elements:
 *
 *         {Object}  parent   The element in which to display data.
 *                            Default: `this.element`.
 *         {string}  type     The type of the data to display.
 *                            Default: null.
 *         {string}  kind     The kind of the data to display.
 *                            Default: null.
 *         {Object}  data     The data to display / display from.
 *                            Default: `this.model.data`.
 *         {string}  id       The id of the data to display. If given, only the matching item (`data[id]`)
 *                            and its subdata will be refreshed, otherwise the entire data structure will
 *                            be refreshed.
 *                            Default: null.
 *         {Object}  pdata    The data on the level above `data`.
 *                            Default: null.
 *         {string}  pid      The id in `pdata` where `data` may be found (`pdata[pid] == data`).
 *                            Default: null.
 *         {boolean} edit     If true, the item should be displayed as editable.
 *                            Default: false.
 *
 * @return parent
 *
 * @throws {VIEW_AREA_MISSING} If both `parent` and `this.element` are null or undefined.
 */
$.any.anyView.prototype.refresh = function (params)
{
  if (!params || !params.dont_reset_rec)
    this.options.ref_rec = 0; // Reset on every call to refresh, unless specifically told not to do so

  let parent     = params && params.parent     ? params.parent        : this.element;
  let type       = params && params.type       ? params.type          : this.model && this.model.type ? this.model.type : "";
  let kind       = params && params.kind       ? params.kind          : "";
  let data       = params && params.data       ? params.data          : this.model && this.model.data ? this.model.data : null;
  let id         = params && params.id         ? params.id            : "";
  let con_id_str = params && params.con_id_str ? ""+params.con_id_str : ""; // Id string for containers and table
  let row_id_str = params && params.row_id_str ? ""+params.row_id_str : ""; // Id string accumulated through recursion
  let pdata      = params && params.pdata      ? params.pdata         : null;
  let pid        = params && params.pid        ? params.pid           : "";
  let edit       = params && params.edit       ? params.edit          : false;
  let from       = params && params.from       ? params.from          : 1;
  let num        = params && params.num        ? params.num           : this.options.itemsPerPage;

  if (!parent)
    throw i18n.error.VIEW_AREA_MISSING;

  if (!params || !params.data)
    this._clearBeforeRefresh(parent); // Top level display of the model, so clear everything first

  if (this.must_empty) {
    // Someone thinks we should remove data from the must_empty element.
    this.must_empty.empty();
    this.must_empty = null;
  }

  if (this.preRefresh)
    this.preRefresh(params);

  // Find the filters to use
  this.options.filters = this._getOrCreateFilters(this.model);

  // Refresh top close button for item
  if (!this.options.isSelectable && this.options.item_opening && con_id_str != "")
    this.refreshCloseItemButton(params);

  if (data) {
    // Display data
    if (kind == "head")
      ++this.data_level;

    // Loop over all entries and refresh
    let view = this;
    let prev_type = type;
    let prev_kind = kind;
    let row_no = 0;
    for (let idc in data) {
      if (data.hasOwnProperty(idc)) {
        if (view && !idc.startsWith("grouping")) {
          // Find the type and kind of the current data item
          let curr_type = view._findType(data,idc,prev_type);
          let curr_kind = view._findKind(data,idc,prev_kind);
          // Skip the current data item if we could not determine its type or kind
          if (!curr_type || !curr_kind) {
            console.warn(i18n.error.TYPEKIND_MISSING+idc+" ("+curr_type+","+curr_kind+")");
            continue;
          }
          // Find identifier strings for containers and rows
          let idx = Number.isInteger(parseInt(idc))
                    ? parseInt(idc)
                    : idc;
          let curr_row_id_str = row_id_str
                                ? row_id_str+"_"+idx
                                : ""+idx;
          let curr_con_id_str = curr_kind == "list" || curr_kind == "select"
                                ? view.con_id_str
                                  ? view.con_id_str
                                  : con_id_str
                                : curr_row_id_str;
          // Create new view whenever we encounter a new type or a new kind
          let the_parent = parent;
          if (prev_type != curr_type || (prev_kind != curr_kind && prev_kind != "")) {
            // Check to see if the new type/kind is contained within a list.
            // In that case, create a new row to contain the new container.
            if (prev_kind == "list" || prev_kind == "select") {
              let f = view.getFilter(prev_type,prev_kind);
              let max_num_cols = f ? Object.size(f) : 5;
              let row_id = view.id_base+"_"+curr_type+"_"+curr_kind+"_"+row_id_str+"_tr";
              let new_tr  = $("<tr id='"+row_id+"'><td style='padding-left:"+view.options.indent_amount+"px;' colspan='"+max_num_cols+"' class='any-td any-list-td'></td></tr>"); // TODO! CSS
              let tbody = $("#"+view.id_base+"_"+prev_type+"_"+prev_kind+"_"+row_id_str+"_tbody");
              if (tbody.length)
                tbody.append(new_tr);
              else {
                let tr = $("#"+view.id_base+"_"+prev_type+"_"+prev_kind+"_"+row_id_str+"_tr");
                if (tr.length)
                  new_tr.insertAfter(tr);
              }
              if (new_tr) {
                the_parent = new_tr.find("td");
                if (!the_parent.length)
                  the_parent = parent;
              }
              curr_con_id_str = row_id_str; // TODO! curr_con_id_str = curr_row_id_str?
            }
            // TODO! options.localRemove etc. must be sent as params when creating new view
            let view_class = params && params.view_class ? params.view_class : null;
            let mdl        = params && params.model      ? params.model      : null;
            view = view.createView({
                      parent:     the_parent,
                      type:       curr_type,
                      kind:       curr_kind,
                      data:       data,
                      id:         idc,
                      con_id_str: curr_con_id_str,
                      data_level: view.data_level,
                      view_class: view_class,
                      model:      mdl, // Let the calling method specify the model explicitely
                   });
          }
          if (view) {
            // Refresh a header, a single list row or a single item
            ++row_no;
            if (!this.options.showPaginator || (from == -1 || from <= row_no && row_no < from + num)) {
              view.con_id_str = curr_con_id_str; // Remember con_id_str for this view, in case missing from params
              view.refreshOne({
                 parent:     the_parent,
                 type:       curr_type,
                 kind:       curr_kind,
                 data:       data,
                 id:         idc,
                 con_id_str: curr_con_id_str,
                 row_id_str: curr_row_id_str,
                 pdata:      pdata,
                 pid:        pid,
                 edit:       edit,
              });
            }
          } // if view
          prev_type = curr_type;
          prev_kind = curr_kind;
        } // if view
      }
    } // for

    if (kind == "head")
      --this.data_level;
  } // if data
  else {
    // No data, but must still have the opportunity to add new data.
    // New data may be added by entering a new entry in a list or by
    // entering a new item, so make sure this is possible.
    this.refreshOne({
       parent:     parent,
       type:       type,
       kind:       kind,
       data:       null,
       id:         null,
       con_id_str: "",
       row_id_str: "",
       pdata:      pdata,
       pid:        pid,
       edit:       edit,
    });
  }

  if (edit) // Initialize thirdparty components (tinymce, etc.)
    this.initComponents();

  // Clean up
  if (!parent.children().length)
    parent.children().remove();

  // Refresh bottom toolbar
  if (this.options.showToolbar && this.options.data_level == 0) {
    if (!this.options.isSelectable && this.model.type && this.data_level==0 && con_id_str == "" &&
        (this.options.showMessages || this.options.showButtonNew || this.options.showButtonAddLink)) {
      this.refreshToolbarBottom({
         parent:     parent,
         type:       this.model.type,
         kind:       this.model.kind,
         data:       data,
         id:         this.model.id,
         con_id_str: "",
      });
    }
  }

  if (this.postRefresh)
    this.postRefresh(params);

  // Bind key-back on tablets. TODO! Untested
  //document.addEventListener("backbutton", $.proxy(this._processKeyup,this), false);

  return parent;
}; // refresh

$.any.anyView.prototype._clearBeforeRefresh = function (parent)
{
  parent.empty();
  this.current_edit = null;
}; // _clearBeforeRefresh

//
// Refresh header and data for one list entry or one item
//
$.any.anyView.prototype.refreshOne = function (params)
{
  let parent     = params.parent;
  let type       = params.type;
  let kind       = params.kind;
  let data       = params.data;
  let id         = params.id;
  let con_id_str = params.con_id_str;
  let row_id_str = params.row_id_str;
  let pdata      = params.pdata;
  let pid        = params.pid;
  let edit       = params.edit;

  if (type == "group")
    this.group_id = id;

  let new_params = {
    parent:     parent,
    type:       type,
    kind:       kind,
    data:       data,
    id:         id,
    con_id_str: con_id_str,
    pdata:      pdata,
    pid:        pid,
    edit:       edit,
    doNotEmpty: false,
  };

  // Refresh header
  let have_data = data && Object.size(data[id]) > 0;
  new_params.header_div = this.getOrCreateHeaderContainer(parent,type,kind,con_id_str,have_data,false);
  this.refreshHeader(new_params);

  // Refresh data, including ingress
  new_params.data_div = this.getOrCreateDataContainer(parent,type,kind,con_id_str);
  let ingress_str = data && data[id] ? data[id].group_description : "";
  if (ingress_str && ingress_str != "") {
    new_params.ingress = this.getOrCreateIngress(new_params.data_div,type,kind,con_id_str);
    this.refreshIngress(new_params);
  }
  new_params.table = this.getOrCreateTable(new_params.data_div,type,kind,con_id_str);
  this.refreshData(new_params);

  // If the data contains subdata, make a recursive call
  if (data && ((data[id] && data[id].data) || (data["+"+id] && data["+"+id].data))) {
    ++this.options.ref_rec;
    if (this.options.ref_rec > ANY_MAX_REF_REC) {
      this.options.ref_rec = 0;
      throw i18n.error.TOO_MUCH_RECURSION;
    }
    if ((kind == "list" || kind == "select"))
      ++this.options.indent_level;
    this.refresh({
       parent:     new_params.data_div,
       type:       type,
       kind:       kind,
       data:       data[id] ? data[id].data : data["+"+id].data,
       id:         null,
       con_id_str: con_id_str,
       row_id_str: row_id_str,
       pdata:      data,
       pid:        id,
       edit:       edit,
       dont_reset_rec: true,
    });
    if ((kind == "list" || kind == "select"))
      --this.options.indent_level;
  }
  // Clean up
  if (new_params.header_div && !new_params.header_div.children().length)
    new_params.header_div.remove();
  if (new_params.data_div && !new_params.data_div.children().length)
    new_params.data_div.remove();
  if (new_params.table && !new_params.table.children().length)
    new_params.table.remove();
  return this;
}; // refreshOne

//
// Display a toolbar for messages and a "new item" button
//
$.any.anyView.prototype.refreshToolbarBottom = function (params)
{
  let parent     = params.parent;
  let type       = params.type;
  let kind       = params.kind;
  let data       = params.data;
  let id         = params.id;
  let con_id_str = params.con_id_str;

  if (!parent || !type)
    return null;
  if (!this.options.showMessages && !this.options.showButtonNew && !this.options.showButtonAddLink)
    return null;

  // Create container
  let div_id   = this.id_base+"_"+type+"_"+con_id_str+"_toolbar";
  let class_id = "any-toolbar-bottom any-toolbar any-toolbar-"+this.data_level;
  if ($("#"+div_id).length)
    $("#"+div_id).remove();
  let bardiv   = $("<div id='"+div_id+"' class='"+class_id+"'></div>");
  parent.append(bardiv);

  if (this.options.showMessages) {
    // Create a message area
    let opt = {
      parent: bardiv,
      type:   type,
      kind:   kind,
    };
    this.refreshMessageArea(opt);
    this.showMessages();
  }
  if (this.options.showButtonNew) {
    // Create a "new item"  button
    let opt = {
      parent:     bardiv,
      type:       type,
      kind:       "item",
      data:       data,
      id:         id, // Find a new id
      con_id_str: con_id_str,
      is_new:     true,
    };
    this.refreshNewItemButton(opt);
  }
  if (this.options.showButtonAddLink && this.model.id) {
    // Create an "add link" button
    let the_id = Number.isInteger(parseInt(id)) ? parseInt(id) : id;
    let opt = {
      parent:     bardiv,
      type:       type,
      kind:       "item",
      data:       data,
      id:         id,
      con_id_str: the_id,
      edit:       true,
    };
    this.refreshAddLinkButton(opt);
  }
  return bardiv;
}; // refreshToolbarBottom

//
// Display a message area
//
$.any.anyView.prototype.refreshMessageArea = function (opt)
{
  let parent = opt.parent;

  let div_id   = this.id_base+"_any_message";
  let class_id = "any-message any-"+opt.kind+"-message any-message-"+this.data_level;
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
$.any.anyView.prototype.getOrCreateHeaderContainer = function (parent,type,kind,con_id_str,haveData,doNotEmpty)
{
  if (!parent || !this.options.showHeader)
    return null;
  let div_id = this.id_base+"_"+type+"_"+kind+"_"+con_id_str+"_header";
  let header_div = $("#"+div_id);
  if (header_div.length) {
    if (!doNotEmpty && header_div && header_div.length)
      header_div.empty();
  }
  else
  if (haveData) {
    // Create new header container if we have data
    let class_id = "any-header any-"+kind+"-header any-header-"+this.data_level;
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
$.any.anyView.prototype.refreshHeader = function (params)
{
  if (!params)
    return null;

  let header_div = params.header_div;
  let type       = params.type;
  let kind       = params.kind;
  let data       = params.data;
  let id         = params.id;

  if (!header_div || !header_div.length)
    return null;
  if (!this.options.showHeader || !data || (kind != "head" && !data.grouping))
    return null;

  // Get the correct filter
  if (!this.options.filters) {
    this.model.error = type.capitalize()+" "+kind+" "+i18n.error.FILTERS_MISSING;
    console.error(this.model.error);
    return null;
  }
  let fkind  = this.options.filters[type] && !this.options.filters[type]["head"] ? "list" : kind;
  let filter = this.options.filters[type] &&  this.options.filters[type][fkind]  ? this.options.filters[type][fkind]: null;
  if (!filter) {
    this.model.message = i18n.error.FILTER_NOT_FOUND.replace("%%", type+" "+kind+"");
    console.warn(this.model.message);
    return null;
  }
  // Create the header entries
  header_div.empty();
  let d = data && data[id] ? data[id] : data && data["+"+id] ? data["+"+id] : null; // TODO! Do this other places in the code too
  let n = 0;
  for (let filter_id in filter) {
    if (d && d[filter_id]) {
      let filter_key = filter[filter_id];
      if (filter_key && filter_key.DISPLAY)
        this.refreshHeaderEntry(header_div,data,id,filter_id,n++);
    }
  }
  // Clean up
  if (!header_div.children().length)
    header_div.remove();
  return header_div;
}; // refreshHeader

//
// Refresh a single header entry
//
$.any.anyView.prototype.refreshHeaderEntry = function (header_div,data,id,filter_id,n)
{
  if (!header_div)
    return null;
  let d = data && data[id] ? data[id] : data && data["+"+id] ? data["+"+id] : null; // TODO! Do this other places in the code too
  if (!header_div || !d)
    return null;
  let stylestr = (n==0) ? "style='display:inline-block;'" : "";
  let div = $("<div class='"+filter_id+"' "+stylestr+">"+d[filter_id]+"</div>");
  header_div.append(div);
  return div;
}; // refreshHeaderEntry

//
// Create an ingress, or find an ingress created previously
//
$.any.anyView.prototype.getOrCreateIngress = function (parent,type,kind,con_id_str)
{
  if (!parent)
    return null;
  if (!type || !kind)
    return null;
  let div_id = this.id_base+"_"+type+"_"+kind+"_"+con_id_str+"_ingress";
  let ingress  = $("#"+div_id); // Can we reuse ingress div?
  if (!ingress.length) {
    let class_id = "any-ingress any-"+kind+"-ingress any-ingress-"+this.data_level;
    let ingress_row = jQuery("<tr/>");
    ingress_row.append("<div id='"+div_id+"' class='"+class_id+"'></div>");
    parent.append(ingress_row);
  }
  return ingress;
}; // getOrCreateIngress

//
// Refresh the table description (ingress)
//
$.any.anyView.prototype.refreshIngress = function (params)
{
  if (!params)
    return null;

  let parent     = params.parent;
  let type       = params.type;
  let kind       = params.kind;
  let data       = params.data;
  let id         = params.id;
  let con_id_str = params.con_id_str;
  let pdata      = params.pdata;
  let pid        = params.pid;

  if (!parent)
    return null;
  if (!data || !data[id] || !data[id].group_description || !con_id_str)
    return null;

  let ingress_str = data[id].group_description;
  if (!ingress_str || ingress_str == "")
    return null;

  let div_id = this.id_base+"_"+type+"_"+kind+"_"+con_id_str+"_ingress";
  let div    = $("#"+div_id);
  if (!div.length) {
    div = $("<div id='"+div_id+"'></div>");
    parent.append(div);
  }
  div.append(ingress_str);
  // Clean up
  if (!div.length)
    div.remove();
  return div;
}; // refreshIngress

//
// Refresh the data for an object.
//
$.any.anyView.prototype.refreshData = function (params)
{
  if (!params)
    return null;

  let table      = params.table;
  let type       = params.type;
  let kind       = params.kind;
  let data       = params.data;
  let id         = params.id;
  let edit       = params.edit;
  let con_id_str = params.con_id_str;
  let pdata      = params.pdata;
  let pid        = params.pid;

  if (!table)
    return null;

  let extra_foot = this.getOrCreateExtraFoot(table,type,kind,con_id_str);
  if (extra_foot) {
    this.refreshExtraFoot({
       parent:     extra_foot,
       type:       type,
       kind:       kind,
       data:       data,
       id:         id,
       con_id_str: con_id_str,
       pdata:      pdata,
       pid:        pid,
    });
  }
  let thead = table.find("thead").length ? table.find("thead") : null;
  if (!thead) {
    thead = this.getOrCreateThead(table,type,kind,con_id_str);
    if (thead)
      this.refreshThead({
         parent:     thead,
         type:       type,
         kind:       kind,
         data:       data,
         id:         id,
         con_id_str: con_id_str,
      });
  }
  if (kind == "list" || kind == "select" || kind == "item") {
    let tbody = this.getOrCreateTbody(table,type,kind,con_id_str);
    if (tbody) {
      this.refreshTbodyRow({
         parent:     tbody,
         type:       type,
         kind:       kind,
         data:       data,
         id:         id,
         con_id_str: con_id_str,
         pdata:      pdata,
         pid:        pid,
         edit:       edit,
      });
    }
  }
  let tfoot = this.getOrCreateTfoot(table,type,kind,con_id_str);
  if (tfoot) {
    this.refreshTfoot({
       parent:     tfoot,
       type:       type,
       kind:       kind,
       data:       data,
       id:         id,
       con_id_str: con_id_str,
    });
  }
  // Clean up
  if (extra_foot && !extra_foot.children().length)
    extra_foot.remove();
  return table;
}; // refreshData

//
// Get the current data div, or create a new one if it does not exist
//
$.any.anyView.prototype.getOrCreateDataContainer = function (parent,type,kind,con_id_str)
{
  if (!parent)
    return null;
  let div_id   = this.id_base+"_"+type+"_"+kind+"_"+con_id_str+"_data";
  let data_div = $("#"+div_id);
  if (!data_div.length) {
    // Create new data container if we have data
    let class_id = "any-data any-"+kind+"-data any-data-"+this.data_level+" any-data-view";
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
$.any.anyView.prototype.getOrCreateTable = function (parent,type,kind,con_id_str)
{
  if (!parent)
    return null;
  let div_id = this.id_base+"_"+type+"_"+kind+"_"+con_id_str+"_table";
  let table  = $("#"+div_id); // Can we reuse list table?
  if (!table.length) {
    // Create the table
    let class_id = "any-table any-"+kind+"-table any-table-"+this.data_level;
    table = $("<table id='"+div_id+"' class='"+class_id+"'></table>");
    parent.append(table);
  }
  return table;
}; // getOrCreateTable

//
// Create a tbody, or find a tbody created previously
//
$.any.anyView.prototype.getOrCreateTbody = function (table,type,kind,con_id_str)
{
  if (!table)
    return null;
  if (!type || !kind)
    return null;
  let div_id = this.id_base+"_"+type+"_"+kind+"_"+con_id_str+"_tbody";
  let tbody  = $("#"+div_id); // Can we reuse list tbody?
  if (!tbody.length) {
    let class_id = "any-"+kind+"-tbody any-tbody-"+this.data_level;
    tbody = $("<tbody id='"+div_id+"' class='"+class_id+"'></tbody>");
    table.append(tbody);
  }
  return tbody;
}; // getOrCreateTbody

//
// Create a thead, or find a thead created previously
//
$.any.anyView.prototype.getOrCreateThead = function (table,type,kind,con_id_str)
{
  if (!this.options.showTableHeader || !table)
    return null;
  if (!type || !kind || (kind != "list" && kind != "select"))
    return null;
  let div_id = this.id_base+"_"+type+"_"+kind+"_"+con_id_str+"_thead";
  let thead  = $("#"+div_id);
  if (thead.length)
    thead.remove();
  thead = $("<thead id='"+div_id+"'></thead>");
  table.prepend(thead);
  return thead;
}; // getOrCreateThead

//
// Create a tfoot, or find a tfoot created previously
//
$.any.anyView.prototype.getOrCreateTfoot = function (table,type,kind,con_id_str)
{
  if (!this.options.showTableFooter || !table)
    return null;
  if (!type || !kind || (kind != "list" && kind != "select"))
    return null;
  let div_id = this.id_base+"_"+type+"_"+kind+"_"+con_id_str+"_tfoot";
  let tfoot = $("#"+div_id); // Can we reuse tfoot?
  if (!tfoot.length) {
    tfoot = $("<tfoot id='"+div_id+"'></tfoot>");
    table.append(tfoot);
  }
  return tfoot;
}; // getOrCreateTfoot

//
// Create a special footer to contain pager, search box, etc.
//
$.any.anyView.prototype.getOrCreateExtraFoot = function (table,type,kind,con_id_str)
{
  if (!table || !type || !kind || (kind != "list" && kind != "select"))
    return null;
  let foot_div_id = this.id_base+"_"+type+"_"+kind+"_"+con_id_str+"_extrafoot";
  let foot_div = $("#"+foot_div_id); // Can we reuse extrafoot?
  if (!foot_div.length) {
    foot_div = $("<div id='"+foot_div_id+"' class='table_extrafoot'></div>");
    foot_div.insertAfter(table);
  }
  return foot_div;
}; // getOrCreateExtraFoot

//
// Refresh a table header
//
$.any.anyView.prototype.refreshThead = function (params)
{
  if (!params || ! params.parent)
    return null;

  let thead      = params.parent;
  let type       = params.type;
  let kind       = params.kind;
  let data       = params.data;
  let con_id_str = params.con_id_str;

  if (!this.options.filters) {
    this.model.error = type.capitalize()+" "+kind+" "+i18n.error.FILTERS_MISSING;
    console.error(this.model.error);
    return null;
  }
  let fkind = kind == "head" && this.options.filters[type] ? "list" : kind;
  let filter = this.options.filters[type] && this.options.filters[type][fkind] ? this.options.filters[type][fkind]: null;
  if (!filter) {
    this.model.message = i18n.error.FILTER_NOT_FOUND.replace("%%", type+" "+kind+"");
    console.warn(this.model.message);
    return null;
  }
  let add_opt = null;
  if (this.options.showButtonAdd && !this.options.isSelectable && (!this.model.data || this.model.data && !this.model.data.grouping_for_id))
    add_opt = {
      type:       type,
      kind:       kind,
      data:       data,
      id:         "new", // Find a new id
      con_id_str: con_id_str,
      filter:     filter,
      edit:       true,
      is_new:     true,
    };
  let tr = $("<tr></tr>");
  thead.append(tr);
  // First tool cell for editable list
  if ((this.options.isSelectable && this.options.showButtonSelect == 1 && (kind == "list" || kind == "select")) ||
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
          let th_opt = { table_id: this.id_base+"_"+type+"_"+kind+"_"+con_id_str+"_table",
                         filter_id:  filter_id,
                         filter_key: filter_key,
                         type:       type,
                         group_id:   this.group_id,
                       };
          th.off("click").on("click",th_opt,$.proxy(fun,this));
        }
        else
          th.css("cursor","default");
      }
    }
  }
  // Last tool cell for editable list
  if ((this.options.isSelectable && this.options.showButtonSelect == 2 && (kind == "list" || kind == "select")) ||
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
  if (!params || !params.parent || !params.con_id_str)
    return null;

  let tfoot      = params.parent;
  let type       = params.type;
  let kind       = params.kind;
  let con_id_str = params.con_id_str;

  con_id_str = con_id_str.substr(0,con_id_str.lastIndexOf("_"));
  let tr_id = this.id_base+"_"+type+"_"+kind+"_"+con_id_str+"_tr_foot";
  let tr    = $("#"+tr_id);
  if (!tr.length) {
    tr = $("<tr id='"+tr_id+"'></tr>");
    tfoot.append(tr);
  }
  let td_id = this.id_base+"_"+type+"_"+kind+"_"+con_id_str+"_td_foot";
  let td    = $("#"+td_id);
  if (!td.length) {
    let f = this.getFilter(type,kind);
    let max_num_cols = f ? Object.size(f) : 5;
    td = $("<td colspan='"+max_num_cols+"' id='"+td_id+"' class='any-td any-td-list-foot'></td>");
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
$.any.anyView.prototype.refreshExtraFoot = function (params)
{
  if (!params || !params.parent)
    return null;
  if (!this.options.showPaginator && !this.options.showSearcher)
    return null;

  let extra_foot = params.parent;
  let type       = params.type;
  let kind       = params.kind;
  let data       = params.data;
  let con_id_str = params.con_id_str;
  let pdata      = params.pdata;
  let pid        = params.pid;

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
                     type:       type,
                     kind:       kind,
                     con_id_str: con_id_str,
                     group_id:   pid,
                   },
                });
        pager.numItems(num_results);
        pager.currentPage(this.options.currentPage);
        extra_foot.data("pager",pager);
        if (!pager.options.hideIfOne || num_results > pager.options.itemsPerPage)
          $("#"+pager.container_id).css("display","inline-block");
      }
    }
  } // if
  if (this.options.showSearcher && num_results > this.options.itemsPerPage) {
    // Initialize searching if results span more than one page
    let searcher = extra_foot.data("searcher");
    if (!searcher) {
      let search_box_id = this.id_base+"_"+type+"_"+kind+"_"+con_id_str+"_search_box";
      let search_box    = "Search: <input id='"+search_box_id+"' type='search' style='height:25px;min-height:25px;'>";
      let searcher_id = this.id_base+"_"+type+"_"+kind+"_"+con_id_str+"_searcher_foot";
      searcher = $("<div id='"+searcher_id+"' style='display:inline-block;float:right;padding-top:10px;'>"+search_box+"</div>"); // TODO! CSS
      extra_foot.append(searcher);
      let search_opt = { data: data,
                         type: type,
                         group_id: pid,
                         inp_id: search_box_id,
                       };
      searcher.off("keypress").on("keypress", search_opt, $.proxy(this._processSearch,this));
    }
    extra_foot.data("searcher",searcher);
  } // if
  return extra_foot;
}; // refreshExtraFoot

//
// Refresh a single table row
//
$.any.anyView.prototype.refreshTbodyRow = function (params)
{
  if (!params)
    return null;
  if (params.kind == "list" || params.kind == "select")
    return this.refreshListTableDataRow(params);
  if (params.kind == "item")
    return this.refreshItemTableDataRow(params);
  return null;
}; // refreshTbodyRow

$.any.anyView.prototype.refreshListTableDataRow = function (params)
{
  let tbody      = params.parent;
  let type       = params.type;
  let kind       = params.kind;
  let data       = params.data;
  let id         = params.id;
  let edit       = params.edit;
  let con_id_str = params.con_id_str;
  let pdata      = params.pdata;
  let pid        = params.pid;

  if (!tbody || !data || !data[id])
    return null;

  if (!this.options.filters) {
    this.model.error = type.capitalize()+" "+kind+" "+i18n.error.FILTERS_MISSING;
    console.error(this.model.error);
    return null;
  }
  let filter = this.options.filters[type] && this.options.filters[type][kind]
               ? this.options.filters[type][kind]
               : null;
  if (!filter) {
    if (kind == "select")
      filter = this.options.filters[type]["list"];
    if (!filter) {
      this.model.message = i18n.error.FILTER_NOT_FOUND.replace("%%", type+" "+kind+"");
      console.warn(this.model.message);
      return null;
    }
  }

  let d = data[id] ? data[id] : data["+"+id];
  let row_has_data = this._rowHasData(d,filter);
  if (!row_has_data)
    return null; // Nothing to display

  let the_id     = Number.isInteger(parseInt(id)) ? parseInt(id) : id;
  let row_id_str = con_id_str ? con_id_str+"_"+the_id : ""+the_id;

  let tr_id  = this.id_base+"_"+type+"_"+kind+"_"+row_id_str+"_tr";
  let tr = $("#"+tr_id);
  if (tr.length) {
    let td_ids = tr_id+" > td";
    $("#"+td_ids).remove(); // Do not remove the tr tag, only the contents TODO! Should we use detach or empty instead of remove?
  }
  else {
    tr = $("<tr id='"+tr_id+"'></tr>");
    tbody.append(tr);
  }
  let cell_opt = {
    parent:     tr,
    type:       type,
    kind:       kind,
    data:       data,
    id:         id,
    filter:     filter,
    edit:       edit,
    con_id_str: con_id_str,
    row_id_str: row_id_str,
    pdata:      pdata,
    pid:        pid,
  };
  this.refreshTableDataFirstCell(cell_opt);
  this.refreshTableDataListCells(cell_opt);
  this.refreshTableDataLastCell(cell_opt);
  // Clean up
  if (!tr.children().length || (!row_has_data && !this.options.showEmptyRows))
    tr.remove();
  return tr;
}; // refreshListTableDataRow

$.any.anyView.prototype.refreshTableDataListCells = function (params)
{
  let tr         = params.parent;
  let type       = params.type;
  let kind       = params.kind;
  let data       = params.data;
  let id         = params.id;
  let filter     = params.filter;
  let edit       = params.edit;
  let con_id_str = params.con_id_str;
  let row_id_str = params.row_id_str;
  let pdata      = params.pdata;
  let pid        = params.pid;

  if (!filter || !tr|| !data || !data[id])
    return false;
  let pl     = this.options.indent_level * this.options.indent_amount;
  let pl_str = pl > 0 ? "padding-left:"+pl+"px;" : "";
  let n = 0;
  for (let filter_id in filter) {
    if (filter.hasOwnProperty(filter_id)) {
      let filter_key = filter[filter_id];
      if (filter_key && filter_key.DISPLAY) {
        let model_str = params.filter
                        ? params.filter[filter_id].MODEL
                        : null;
        let disp_str = filter_key.DISPLAY == 2 || filter_key.DISPLAY == "2"
                       ? "display:none;"
                       : "";
        ++n;
        let td_id    = this.id_base+"_"+type+"_"+kind+"_"+row_id_str+"_"+filter_id;
        let odd_even = this.options.useOddEven
                       ? n%2
                         ? "any-even"
                         : "any-odd"
                       : "";
        let class_id = "any-list-"+filter_id;
        let pln_str  = this.model.name_key
                       ? filter_id == this.model.name_key  ? pl_str : ""
                       : filter_id == type+"_name"         ? pl_str : "";
        let style_str = disp_str || pln_str ? "style='"+disp_str+pln_str+"'" : "";
        let td  = $("<td id='"+td_id+"' class='any-td any-list-td "+odd_even+" "+class_id+"' "+style_str+"></td>");
        tr.append(td);
        let str = this.getCellEntryStr(id,type,kind,row_id_str,filter_id,filter_key,data[id],data.lists,edit,model_str,td);
        if (typeof str == "string")
          td.append(str);
        this.initTableDataCell(td_id,type,kind,data,id,con_id_str,row_id_str,filter,filter_id,filter_key,edit,n,pdata,pid);
      }
    }
  }
  return true;
}; // refreshTableDataListCells

$.any.anyView.prototype.refreshItemTableDataRow = function (params)
{
  let tbody      = params.parent;
  let type       = params.type;
  let kind       = params.kind;
  let data       = params.data;
  let id         = params.id;
  let edit       = params.edit;
  let con_id_str = params.con_id_str;
  let pdata      = params.pdata;
  let pid        = params.pid;

  if (!tbody || !data || !data[id])
    return null;

  if (!this.options.filters) {
    this.model.error = type.capitalize()+" "+kind+" "+i18n.error.FILTERS_MISSING;
    console.error(this.model.error);
    return null;
  }
  let filter = this.options.filters[type] && this.options.filters[type][kind]
               ? this.options.filters[type][kind]
               : null;
  if (!filter) {
    this.model.message = i18n.error.FILTER_NOT_FOUND.replace("%%", type+" "+kind+"");
    console.warn(this.model.message);
    return null;
  }

  let d = data[id] ? data[id] : data["+"+id];
  let row_has_data = this._rowHasData(d,filter);
  if (!row_has_data)
    return null; // Nothing to display

  let row_id_str = con_id_str; // Note! con_id_str == row_id_str for kind == item

  let pl     = this.options.indent_level * this.options.indent_amount;
  let pl_str = pl > 0 ? "style='padding-left:"+pl+"px;'" : "";
  let n = 0;
  let is_hidden = false;
  tbody.empty();
  for (let filter_id in filter) {
    if (filter.hasOwnProperty(filter_id)) {
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
                       "<span id='"+this.id_base+"_"+type+"_"+kind+"_"+row_id_str+"_"+filter_key.TYPE+"' class='pointer hiddenText'>"+
                       filter_key.HEADER+
                       "</span>"+
                       "</td>");
            tr.append(td);
            tbody.append(tr);
            let params   = { panel_id:   this.id_base+"_"+type+"_"+kind+"_"+row_id_str+"_"+filter_key.TYPE,
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
          kind:       kind,
          data:       data,
          id:         id,
          filter:     filter,
          edit:       edit,
          con_id_str: con_id_str,
          row_id_str: row_id_str,
          pdata:      pdata,
          pid:        pid,
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
  let tr         = params.parent;
  let type       = params.type;
  let kind       = params.kind;
  let data       = params.data;
  let id         = params.id;
  let filter     = params.filter;
  let filter_id  = params.filter_id;
  let filter_key = params.filter_key;
  let edit       = params.edit;
  let con_id_str = params.con_id_str;
  let row_id_str = params.row_id_str;
  let pdata      = params.pdata;
  let pid        = params.pid;
  let pl_str     = params.pl_str;
  let n          = params.n;
  let model_str  = params.filter ? params.filter[filter_id].MODEL : null;
  let view_str   = params.filter ? params.filter[filter_id].VIEW  : null;

  let class_id_name = "any-item-name-"+filter_id;
  let class_id_val  = "any-item-val-"+filter_id;
  let td_id         = this.id_base+"_"+type+"_"+kind+"_"+row_id_str+"_"+filter_id;
  let td2           = $("<td "+             "class='any-td any-item-name "+class_id_name+"' "+pl_str+">"+filter_key.HEADER+"</td>");
  let td3           = $("<td id= '"+td_id+"' class='any-td any-item-val  "+class_id_val +"'></td>");
  tr.append(td2);
  tr.append(td3);
  let str = this.getCellEntryStr(id,type,kind,row_id_str,filter_id,filter_key,data[id],data.lists,edit,model_str,view_str,td3);
  if (typeof str == "string")
    td3.append(str);
  this.initTableDataCell(td_id,type,kind,data,id,con_id_str,row_id_str,filter,filter_id,filter_key,edit,n,pdata,pid);
}; // refreshTableDataItemCells

$.any.anyView.prototype.refreshTableDataFirstCell = function (params)
{
  if (!((this.options.isSelectable && this.options.showButtonSelect == 1 && (params.kind == "list" || params.kind == "select")) ||
        (this.options.isAddable    && this.options.showButtonAdd == 1) ||
        (this.options.isRemovable  && this.options.showButtonRemove == 1) ||
        (this.options.isEditable   && (this.options.showButtonEdit == 1 || this.options.showButtonUpdate == 1 ||  this.options.showButtonDelete == 1 || this.options.showButtonCancel == 1))))
   return;
  let tr         = params.parent;
  let type       = params.type;
  let kind       = params.kind;
  let data       = params.data;
  let id         = params.id;
  let filter     = params.filter;
  let edit       = params.edit;
  let con_id_str = params.con_id_str;
  let row_id_str = params.row_id_str;
  let pdata      = params.pdata;
  let pid        = params.pid;

  let first = true;
  let td_id  = this.id_base+"_"+type+"_"+kind+"_"+row_id_str+"_edit"; // First tool cell
  if ($("#"+td_id).length)
    if (kind != "item")
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
    kind:       kind,
    data:       data,
    id:         id,
    con_id_str: con_id_str,
    row_id_str: row_id_str,
    filter:     filter,
    pdata:      pdata,
    pid:        pid,
  };
  if (this.options.isSelectable && this.options.showButtonSelect==1 && (kind == "list" || kind == "select")) {
    let checked = this.model.select.has(parseInt(id));
    first_opt.checked = checked;
    this.refreshSelectButton(first_opt);
  }
  else {
    first_opt.edit = edit;
    if (this.options.isEditable && this.options.showButtonEdit==1 && !edit) {
      this.refreshEditButton(first_opt);
    }
    if (this.options.isEditable && this.options.showButtonUpdate==1 && edit) {
      first_opt.is_new = data && data[id] ? data[id].is_new : false;
      first_opt.indata = data;
      first_opt.data    = null;
      this.refreshUpdateButton(first_opt);
    }
    if (this.options.isEditable || edit ||
        (this.options.isRemovable && this.options.showButtonRemove==1) ||
        (this.options.isDeletable && this.options.showButtonDelete==1)) {
      if (this.options.showButtonRemove==1 && this.options.isRemovable && id && kind == "list")
        this.refreshRemoveButton(first_opt);
      if (this.options.showButtonDelete==1 && this.options.isDeletable && id)
        this.refreshDeleteButton(first_opt);
      if (this.options.showButtonCancel==1 && edit)
        this.refreshCancelButton(first_opt);
    }
  }
}; // refreshTableDataFirstCell

$.any.anyView.prototype.refreshTableDataLastCell = function (params)
{
  if (!((this.options.isSelectable && this.options.showButtonSelect == 2 && (params.kind == "list" || params.kind == "select")) ||
        (this.options.isAddable    && this.options.showButtonAdd == 2) ||
        (this.options.isRemovable  && this.options.showButtonRemove == 2) ||
        (this.options.isEditable   && (this.options.showButtonEdit == 2 || this.options.showButtonUpdate == 2 ||  this.options.showButtonDelete == 2 || this.options.showButtonCancel == 2))))
   return;
  let tr         = params.parent;
  let type       = params.type;
  let kind       = params.kind;
  let data       = params.data;
  let id         = params.id;
  let filter     = params.filter;
  let edit       = params.edit;
  let con_id_str = params.con_id_str;
  let row_id_str = params.row_id_str;
  let pdata      = params.pdata;
  let pid        = params.pid;

  let first = true;
  let td_id  = this.id_base+"_"+type+"_"+kind+"_"+row_id_str+"_unedit"; // Last tool cell
  if ($("#"+td_id).length)
    if (kind != "item")
      $("#"+td_id).remove();
    else
      first = false;
  let td = $("<td id='"+td_id+"' class='any-td any-td-last'></td>");
  tr.append(td);
  if (!first)
    return;
  if (this.options.isSelectable && (kind == "list" || kind == "select")) {
  }
  else {
    if (this.options.isEditable || this.options.isRemovable || edit) {
      let last_opt = {
        parent:     td,
        type:       type,
        kind:       kind,
        data:       data,
        id:         id,
        con_id_str: con_id_str,
        row_id_str: row_id_str,
        filter:     filter,
        edit:       edit,
        pdata:      pdata,
        pid:        pid,
      };
      if (this.options.showButtonRemove==2 && this.options.isRemovable && id && kind == "list" && !edit)
        this.refreshRemoveButton(last_opt);
      if (this.options.showButtonDelete==2 && this.options.isDeletable && id)
        this.refreshDeleteButton(last_opt);
      if (this.options.showButtonCancel==2 && edit)
        this.refreshCancelButton(last_opt);
    }
  }
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

//
// Buttons
//

// Create a button for closing item view
// By default calls closeItem
$.any.anyView.prototype.refreshCloseItemButton = function (params)
{
  let parent = params && params.parent ? params.parent : null;
  let type   = params && params.type   ? params.type   : null;
  let kind   = params && params.kind   ? params.kind   : null;

  if (!parent || !type || !kind)
    return null;

  // Create cancel/close button for item view
  let opt = {
    type:     type,
    kind:     kind,
    edit:     false,
    top_view: this.options.top_view,
  };
  let tit_str = i18n.button.buttonCancel;
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
  btn.off("click").on("click",opt,$.proxy(fun,con));
  if (parent && parent.length)
    parent.prev().prepend(btn);
  this.options.item_opening = false;
  return btn;
}; // refreshCloseItemButton

// Create an add button
// By default calls addListEntry
$.any.anyView.prototype.refreshAddButton = function (opt)
{
  let parent  = opt.parent;

  let tit_str = i18n.button.buttonAddToList.replace("%%",opt.type);
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.id_base+"_"+opt.type+"_"+opt.kind+"_"+opt.con_id_str+"_new_line_icon";
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
  let parent  = opt.parent;

  let tit_str = i18n.button.buttonSelect;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.id_base+"_"+opt.type+"_"+opt.kind+"_"+opt.row_id_str+"_select_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let check_str = opt.checked
                  ? "<i class='far fa-check-square'></i>"
                  : "<i class='far fa-square'></i>";
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

// Edit-button in first list or item table cell
// Only displayed if not editing
// By default calls toggleEdit
$.any.anyView.prototype.refreshEditButton = function (opt)
{
  let parent  = opt.parent;

  let tit_str = i18n.button.buttonEdit;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.id_base+"_"+opt.type+"_"+opt.kind+"_"+opt.row_id_str+"_edit_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let btn = $("<div id='"+btn_id+"' class='any-edit-icon any-icon pointer' title='"+tit_str+"'>"+
              "<i class='fas fa-pencil-alt'></i>"+
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

// Update-button in first list or item table cell
// Only displayed if editing
// By default calls dbUpdate
$.any.anyView.prototype.refreshUpdateButton = function (opt)
{
  let parent  = opt.parent;

  let tit_str = i18n.button.buttonUpdate;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.id_base+"_"+opt.type+"_"+opt.kind+"_"+opt.row_id_str+"_update_icon";
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

// Delete-button in last list or item table cell
// Only displayed if editing
// By default calls dbDeleteDialog
$.any.anyView.prototype.refreshDeleteButton = function (opt)
{
  let parent  = opt.parent;

  let tit_str = i18n.button.buttonDelete;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.id_base+"_"+opt.type+"_"+opt.kind+"_"+opt.row_id_str+"_delete_icon";
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

// Cancel-button in last list or item table cell
// Only displayed if editing
// By default calls toggleEdit
$.any.anyView.prototype.refreshCancelButton = function (opt)
{
  let parent  = opt.parent;

  let tit_str = i18n.button.buttonCancel;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.id_base+"_"+opt.type+"_"+opt.kind+"_"+opt.row_id_str+"_cancel_icon";
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

// Remove-button in last list or item table cell
// May be displayed while editing or not editing depending on the ... option
// By default calls dbRemoveDialog
$.any.anyView.prototype.refreshRemoveButton = function (opt)
{
  let parent  = opt.parent;

  let tit_str = i18n.button.buttonRemove;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.id_base+"_"+opt.type+"_"+opt.kind+"_"+opt.row_id_str+"_remove_icon";
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

// Button in bottom toolbar for opening a new empty item view
// By default calls showItem
$.any.anyView.prototype.refreshNewItemButton = function (opt)
{
  let parent  = opt.parent;

  let tit_str = this.options.newButtonLabel ? this.options.newButtonLabel : i18n.button.buttonNew+" "+opt.type;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'> "+/*tit_str+*/"</span>" : "";
  let btn_id  = this.id_base+"_"+opt.type+"_"+opt.kind+"_"+opt.con_id_str+"_new_icon";
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

// Button in bottom toolbar for displaying a menu for adding links
// By default calls showLinkMenu
$.any.anyView.prototype.refreshAddLinkButton = function (opt)
{
  if (!this.model.plugins || !this.options.linkIcons)
    return;

  let parent  = opt.parent;

  opt.top_view = parent.parent();
  let tit_str = i18n.button.buttonAddLink+"...";
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.id_base+"_"+opt.type+"_add_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let btn     = $("<div id='"+btn_id+"' class='any-tool-addremove any-tool-button pointer' title='"+tit_str+"'>"+
                  "<i class='fa fa-plus'></i>&nbsp;"+i18n.message.addRemove+
                  btn_str+
                  "</div>");
  if (parent && parent.length)
    parent.append(btn);
  if (!opt.edit)
    btn.hide();
  let fun = this.option("localShowLinkMenu")
            ? this.option("localShowLinkMenu")
            : this.showLinkMenu;
  let con = this.option("menuContext")
            ? this.option("menuContext")
            : this.option("context")
              ? this.option("context")
              : this;
  btn.off("click").on("click", opt, $.proxy(fun,con));

  let menu_id = this.id_base+"_"+opt.type+"_"+opt.kind+"_"+opt.con_id_str+"_link_dropdown";
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
  let self = this;
  window.onkeydown = function(e) {
    if (e.keyCode == 27) {
      e.data = {};
      e.data.element_id = opt.element_id;
      self.showLinkMenu(e);
    }
  };

  // Add the clickable menu entries
  for (let plugin_type in this.options.linkIcons) {
    if (this.options.linkIcons.hasOwnProperty(plugin_type)) {
      let plugin_opt = { data:      opt.data,
                         id:        opt.id,
                         type:      opt.type,
                         link_type: plugin_type,
                         link_icon: this.options.linkIcons[plugin_type],
                       };
      let link_btn = this.refreshLinkButton(plugin_opt,this.dbSearchLinks);
      dd_menu.append(link_btn); // Subevents
    }
  }
  return btn;
}; // refreshAddLinkButton

// Button in menu for adding a link
// By default calls dbSearchLinks
$.any.anyView.prototype.refreshLinkButton = function (options,onClickMethod)
{
  if (!this.model)
    throw i18n.error.MODEL_MISSING;
  let sub     = options.type == options.link_type ? "sub"+options.type : options.link_type;
  let tit_str = sub; //i18n.button.buttonAdd+" "+sub;
  let btn_str = tit_str; //this.option("showButtonLabels") ? tit_str : "";
  let btn_id  = this.id_base+"_"+options.type+"_"+options.link_type+"_link_icon";
  let btn = $("<div id='"+btn_id+"' style='display:inline-block;' class='any-tool-button pointer' title='"+tit_str+"'>"+
              "<div style='display:inline-block;width:20px;'><i class='"+options.link_icon+"'></i></div>..."+
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
  btn.off("click").on("click", options, $.proxy(fun,con));
  return btn;
}; // refreshLinkButton

// Display or hide the link menu
$.any.anyView.prototype.showLinkMenu = function (event)
{
  let dd_menu = $("#"+event.data.element_id);
  let elem = document.getElementById(event.data.element_id);
  if (elem) {
    // TODO! w3-show should not be hardcoded
    if (elem.className.indexOf("w3-show") == -1 && event.data.edit !== false && event.which !== 27) {
      elem.className += " w3-show";
      dd_menu.show();
      // Clicking off the menu (inside this.element) will hide it
      if (this.element && this.element.length) {
        let opt2 = {...event.data};
        opt2.edit    = false;
        opt2.elem    = elem;
        opt2.dd_menu = dd_menu;
        this.element.off("click").on("click", opt2,
          function(e) {
            e.data.elem.className = elem.className.replace(" w3-show", "");
            e.data.dd_menu.hide();
          }
        );
      }
    }
    else {
      elem.className = elem.className.replace(" w3-show", "");
      dd_menu.hide();
    }
  }
  event.preventDefault();
  return false;
}; // showLinkMenu

///////////////////////////////////////////////////////////////////////////////

$.any.anyView.prototype.initTableDataCell = function (td_id,type,kind,data,id,con_id_str,row_id_str,filter,filter_id,filter_key,edit,n,pdata,pid)
{
  if (!filter_key || !td_id)
    return;

  let init_opt = {
    type:       type,
    kind:       kind,
    data:       data,
    id:         id,
    edit:       edit,
    con_id_str: con_id_str,
    row_id_str: row_id_str,
    filter:     filter,
    filter_id:  filter_id,
    pdata:      pdata,
    pid:        pid,
    plugins:    this.model.plugins,
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
    inp_elem.inputFilter(function(value) { return /^\d*\.?\d*$/.test(value); }); // Allow digits and '.' only
  }
  // Bind a function to be called when clicking/pressings the element
  if (filter_key.FUNCTION && filter_key.TYPE != "select") {
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
    // Bind enter key
    inp_elem.off("keyup").on("keyup",     init_opt, $.proxy(this._processKeyup,this));
    inp_elem.off("keydown").on("keydown", init_opt, $.proxy(this._processKeyup,this)); // For catching the ESC key on Vivaldi
  }
  // Set focus to first editable text field and make sure cursor is at the end of the field
  if ((this.options.isEditable || this.options.isAddable) && edit && n==1) {
    inp_elem.trigger("focus");
    let tmp = inp_elem.val();
    inp_elem.val("");
    inp_elem.val(tmp);
  }
}; // initTableDataCell

///////////////////////////////////////////////////////////////////////////////

//
// Create a new model in a new view and return the view
//
$.any.anyView.prototype.createView = function (params)
{
  let parent     = params && params.parent     ? params.parent     : null;
  let type       = params && params.type       ? params.type       : null;
  let kind       = params && params.kind       ? params.kind       : null;
  let data       = params && params.data       ? params.data       : null;
  let id         = params && params.id         ? params.id         : "";
  let data_level = params && params.data_level ? params.data_level : 0;
  let model      = params && params.model      ? params.model      : type == this.model.type ? this.model : null;

  if (!parent)
    parent = this.element;
  if (!parent)
    return null;
  if (!data)
    return null;
  type = type ? type : this._findType(data,id,null);
  kind = kind ? kind : this._findKind(data,id,null);
  if (!type || !kind)
    return null;

  // Create a new model if we dont already have one or if the caller asks for it
  let model_opt = this.getCreateModelOptions(data,id,type,kind);
  if (!model || typeof model === "string") {
    let m_str = model
              ? model         // Use supplied model name
              : type+"Model"; // Use default model name derived from type
    if (!window[m_str]) {
      let def_str = "anyModel"; // Use fallback model name
      console.warn("Model class "+m_str+" not found, using "+def_str+". "); // TODO! i18n
      m_str = def_str;
    }
    try {
      model = new window[m_str](model_opt);
    }
    catch (err) {
      console.error("Couldn't create model "+m_str+": "+err);
      return null;
    }
  }
  else
  if (typeof model != "object") {
    console.error("Model is "+(typeof model)+", not object. ");
    return null;
  }
  model.data = data;
  if (id)
    model.id = id;
  // Create the view
  let view_opt = this.getCreateViewOptions(model,parent,kind,data_level);
  if (params.showHeader === false)
    view_opt.showHeader = false
  let v_str    = params && params.view_class
               ? params.view_class
               : view_opt.grouping
                 ? type+"View"+view_opt.grouping.capitalize()
                 : type+"View";
  if (!window[v_str]) {
    let def_str = view_opt.grouping ? "anyView"+view_opt.grouping.capitalize() : "anyView";
    console.warn("View class "+v_str+" not found, using "+def_str+". "); // TODO! i18n
    v_str = def_str;
  }
  let view = null;
  try {
    view = new window[v_str](view_opt);
    if (!Object.keys(view).length) {
      console.error("Couldn't create view "+v_str+" with id "+view_opt.id);
      view = null;
    }
  }
  catch (err) {
    console.error("Couldn't create view "+v_str+": "+err);
    return null;
  }
  return view;
}; // createView

$.any.anyView.prototype.getCreateModelOptions = function(data,id,type,kind)
{
  return {
    type:       type,
    kind:       kind,
    data:       data,
    id:         kind == "item" ? id : null,
    mode:       this.model.mode,
    fields:     this.model.fields,
    permission: this.model.permission,
    plugins:    this.model.plugins,
    select:     this.model.select,
    unselect:   this.model.unselect,
    last_term:  this.model.last_term,
  };
}; // getCreateModelOptions

$.any.anyView.prototype.getCreateViewOptions = function(model,parent,kind,data_level)
{
  return {
    model:            model,
    filters:          this._getOrCreateFilters(model), // Create filter if we don't already have one
    id:               parent.attr("id"),
    view:             this,
    id_base:          this.id_base,
    data_level:       data_level || data_level==0 ? data_level : this.data_level,
    group_id:         this.group_id, // Current group id (for table headers)
    grouping:         this.options.grouping,
    item_opening:     this.options.item_opening,
    top_view:         this.options.top_view,
    currentPage:      this.options.currentPage,
    showHeader:       this.options.showHeader,
    showTableHeader:  this.options.showTableHeader,
    showTableFooter:  this.options.showTableFooter,
    showToolbar:      this.options.showToolbar,
    showSearcher:     this.options.showSearcher,
    showPaginator:    this.options.showPaginator,
    showServerErrors: this.options.showServerErrors,
    showButtonNew:    this.options.showButtonNew,
    showButtonAddLink:this.options.showButtonAddLink,
    sortBy:           this.options.sortBy,
    sortDirection:    this.options.sortDirection,
    link_options:     this.options.link_options,
    indent_level:     this.options.indent_level,
    // Give same permissions to new view as the current one. This may not always
    // be the desired behaviour, in that case override this method and correct.
    isEditable:       this.options.isEditable,
    isRemovable:      this.options.isRemovable || kind == "item", // TODO! Not a good solution
    isDeletable:      this.options.isDeletable,
    isSelectable:     this.options.isSelectable,
    itemLinkClicked:  this.options.itemLinkClicked,
    clickContext:     this.options.clickContext,
    preselected:      this.options.isSelectable ? this.options.preselected : null,
    onEscEndEdit:     params && params.onEscEndEdit     !== undefined ? params.onEscEndEdit     : this.options.onEscEndEdit,
  };
}; // getCreateViewOptions

///////////////////////////////////////////////////////////////////////////////
// Methods that create cell items
///////////////////////////////////////////////////////////////////////////////

$.any.anyView.prototype.getCellEntryStr = function (id,type,kind,row_id_str,filter_id,filter_key,data_item,data_lists,edit,model_str,view_str,parent)
{
  if (!filter_id || !filter_key)
    return "";
  let val = data_item[filter_id];
  let pid = data_item["parent_id"];
  if (typeof val != "object")
    val = $("<textarea />").html(val).text(); // Convert html entities to real html
  if (filter_key.EDITABLE===0 || filter_key.EDITABLE===false)
    edit = false;
  switch (filter_key.TYPE) {
    case "label":    return this.getLabelStr   (type,kind,id,val); // Always noneditable
    case "html":     return this.getHtmlStr    (type,kind,id,val,edit);
    case "textarea": return this.getTextAreaStr(type,kind,id,val,edit,filter_id,row_id_str);
    case "text":     return this.getTextStr    (type,kind,id,val,edit);
    case "password": return this.getPasswordStr(type,kind,id,val,edit);
    case "link":     return this.getLinkStr    (type,kind,id,val,edit);
    case "mailto":
    case "email":    return this.getEmailStr   (type,kind,id,val,edit);
    case "number":   return this.getNumberStr  (type,kind,id,val,edit);
    case "date":     return this.getDateStr    (type,kind,id,val,edit);
    case "image":    return this.getImageStr   (type,kind,id,val,edit,filter_key);
    case "radio":    return this.getRadioStr   (type,kind,id,val,edit,filter_key,filter_id);
    case "check":    return this.getCheckStr   (type,kind,id,val,edit,filter_key,filter_id);
    case "select":   return this.getSelectStr  (type,kind,id,val,edit,filter_key,pid,data_item["parent_name"]);
    case "function": return this.getFunctionStr(type,kind,id,val,edit,filter_key,pid,data_item["parent_name"]);
    case "list":     return this.getListView   (type,kind,id,val,edit,filter_key,row_id_str,data_lists,model_str,view_str,parent);
    case "upload":   return this.getUploadStr  (type,kind,id,val,edit,data_item,filter_id,row_id_str);
    case "fileview": return this.getFileViewStr(type,kind,id,val,edit,data_item,filter_id,row_id_str);
    /* Not used yet
    case "http":
    case "https":    return this.getHttpStr    (type,kind,id,val,edit);
    case "textspan": return this.getTextspanStr(type,kind,id,val,edit);
    case "tokenlist":return this.getTokenlist  (type,kind,id,val,edit);
    */
  }
  if (!val)
    val = "";
  return val;
}; // getCellEntryStr

$.any.anyView.prototype.getHtmlStr = function (type,kind,id,val,edit)
{
  return val;
}; // getHtmlStr

$.any.anyView.prototype.getLabelStr = function (type,kind,id,val)
{
  //val = (val.replace(/<(?:.|\n)*?>/gm,''));
  let val_cleaned = typeof val == "string" && this.options.cutoff > 0 ? val.substring(0,this.options.cutoff) : ""+val;
  val_cleaned += (val.length > this.options.cutoff && this.options.cutoff > 0) ? " [...]" : "";
  val = val_cleaned;
  //if (!val || val == "")
  //  val = "&nbsp;";
  return "<div class='itemUnedit itemLabel'>"+val+"</div>";
}; // getLabelStr

$.any.anyView.prototype.getTextAreaStr = function (type,kind,id,val,edit,filter_id,row_id_str)
{
  if (edit) {
    if (typeof tinyMCE !== "undefined") {
      let nameid = this.id_base+"_"+type+"_"+kind+"_"+row_id_str+"_"+filter_id;
      if (tinyMCE.EditorManager.get(nameid))
        tinymce.EditorManager.execCommand('mceRemoveEditor',true, nameid);
    }
    return "<textarea class='itemEdit tinymce'>"+val+"</textarea>";
  }
  else
    return this.getLabelStr(type,kind,id,val);
}; // getTextAreaStr

$.any.anyView.prototype.getTextStr = function (type,kind,id,val,edit)
{
  if (edit)
    return "<input class='itemEdit itemText' type='text' value='"+val+"'/>";
  else
    return this.getLabelStr(type,kind,id,val);
}; // getTextStr

$.any.anyView.prototype.getPasswordStr = function (type,kind,id,val,edit)
{
  if (edit)
    return "<input class='itemEdit itemText password' type='password' value='"+val+"'/>";
  else
    return this.getLabelStr(type,kind,id,"");
}; // getLabelStr

$.any.anyView.prototype.getLinkStr = function (type,kind,id,val,edit)
{
  if (edit)
    return this.getTextStr(type,kind,id,val,edit);
  else
    return "<div class='itemUnedit itemText pointer underline' attr='link'>"+val+"</div>";
}; // getLinkStr

$.any.anyView.prototype.getEmailStr = function (type,kind,id,val,edit)
{
  if (edit)
    return this.getTextStr(type,kind,id,val,edit);
  else
    return "<div class='itemUnedit itemText pointer underline'><a href='mailto:"+val+"'>"+val+"</a></div>";
}; // getEmailStr

// In edit mode, the input field is modified with a filter
// in append methods to allow only numerals and '.'
$.any.anyView.prototype.getNumberStr = function (type,kind,id,val,edit)
{
  if (edit)
    return "<input class='itemEdit itemNumber' type='text' value='"+val+"'/>";
  else {
    let val_cleaned = typeof val == "string" && this.options.cutoff > 0 ? val.substring(0,this.options.cutoff) : ""+val;
    val_cleaned += (val.length > this.options.cutoff && this.options.cutoff > 0) ? " [...]" : "";
    val = val_cleaned;
    return "<div class='itemUnedit itemNumber'>"+val+"</div>";
  }
}; // getNumberStr

// In edit mode, a date selector will be shown.
$.any.anyView.prototype.getDateStr = function (type,kind,id,val,edit)
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
$.any.anyView.prototype.getFunctionStr = function (type,kind,id,val,edit,filter_key,pid,pname)
{
  let func_name = filter_key.FUNCTION;
  if (isFunction(this[func_name])) // Method in view class
    return this[func_name](type,kind,id,val,edit,pid);
  if (isFunction(window[func_name])) // Normal function
    return window[func_name](type,kind,id,val,edit,pid);
  return ""; // Function not found
}; // getFunctionStr

$.any.anyView.prototype.getImageStr = function (type,kind,id,val,edit,filter_key)
{
  let image_src = filter_key.IMAGE;
  if (!image_src && filter_key.FUNCTION && typeof window[filter_key.FUNCTION] == "function")
    return this.getFunctionStr(type,kind,id,val,edit,filter_key);
  return "<div class='itemUnedit'>"+
         "<img class='imageRef pointer' src='"+image_src+"' title='"+val+"'style='box-shadow:none;'>"+
         "</div>";
}; // getImageStr

$.any.anyView.prototype.getSelectStr = function (type,kind,id,val,edit,filter_key,pid,pname)
{
  let str  = "";
  let sval = val;
  let fval = filter_key.SELECT ? filter_key.SELECT : filter_key.FUNCTION;
  if (fval) {
    if (typeof this[fval] === 'function')
      sval = this[fval](type,kind,id,val,edit,pid);
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
          let sel = (fid != "" && fid == parseInt(val)) ? "selected" : "";
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

$.any.anyView.prototype.getRadioStr = function (type,kind,id,val,edit,filter_key,filter_id)
{
  let str  = "";
  let sval = val;
  let fval = filter_key.RADIO;
  if (fval) {
    if (typeof this[fval] == "function")
      sval = this[fval](type,kind,id,val,edit);
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

$.any.anyView.prototype.getCheckStr = function (type,kind,id,val,edit,filter_key,filter_id)
{
  let str = "";
  if (edit) {
    let checked = val == "1" ? "checked" : "";
    str = "<input class='itemEdit' type='checkbox' onclick='$(this).val(this.checked?1:0)' value='"+val+"' "+checked+"/>";
  }
  else {
    let the_id      = Number.isInteger(parseInt(id)) ? parseInt(id) : id;
    let row_id_str  = ""+the_id;
    let it_id       = this.id_base+"_"+filter_key+"_"+row_id_str;
    let check_class = (val == "1") ? "far fa-check-square" : "far fa-square";
    let title   = "Check if attended"; // TODO! Move to event class
    str = "<div class='itemUnedit inlineDiv pointer' "+
          "id='"+it_id+"' "+
          "title='"+title+"'>"+
          "<i class='"+check_class+"'></i>"+
          "</div>";
  }
  return str;
}; // getCheckStr

// Return a view containing a list
$.any.anyView.prototype.getListView = function (type,kind,id,val,edit,filter_key,row_id_str,data_lists,model_str,view_str,parent)
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
  list_model.data = data_lists ? data_lists[filter_key.LIST] : null;

  // Create the list view
  let list_view_id = this.id_base+"_"+type+"_"+kind+"_"+row_id_str+"_"+list_type+"_list";
  let view_opt     = this.getListViewOptions(list_model,list_view_id,edit,this);
  let v_str = view_str && typeof view_str === "string"
              ? view_str
              : view_opt.grouping
                ? list_type.capitalize()+"View"+view_opt.grouping.capitalize()
                : list_type.capitalize()+"View";
  if (!window[v_str]) {
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
    link_type:  type,
    link_id:    "???", // TODO!
    search:     false,
    mode:       this.model.mode,
    permission: this.model.permission,
  };
}; // getListModelOptions

// May be overidden by derived classes
$.any.anyView.prototype.getListViewOptions = function (model,view_id,edit,view)
{
  return {
    model:           model,
    filters:         this.options.filters,
    id:              view_id,
    grouping:        this.options.grouping,
    view:            view,
    isRemovable:     false,
    isEditable:      false,
    isDeletable:     false,
    showSearch:      true,
    showTableHeader: false,
    showTableFooter: false,
    showToolbar:     false,
    onEscEndEdit:    view ? view.options.onEscEndEdit : this.options.onEscEndEdit,
  };
}; // getListViewOptions

$.any.anyView.prototype.getUploadStr = function (type,kind,id,val,edit,data_item,filter_id,row_id_str)
{
  // Shows a clickable label that opens a file select dialog when pressed
  let elem_id = this.id_base+"_"+type+"_"+kind+"_"+row_id_str+"_"+filter_id; // element id
  let name    = data_item[type+"_name"];                                 // real file name from user
  let style   = "style='cursor:pointer;'";
  let title   = "title='Select a new file for upload'"; // TODO i18n
  let filter  = this.getFilter(type,kind);
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

$.any.anyView.prototype._uploadClicked = function (event)
{
  if (!this.options.uploadDirect && !event.data.edit) {
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
    this.model.dataUpdate({ type:   event.data.type,
                            data:   event.data.data,
                            id:     event.data.id,
                            indata: { [filter_id]: fname },
                         });
    // Update the field to be sent to server
    $("#"+elem_id+" .itemText").val(fname);

    // Empty the file input field, so that the event will fire a second time even for the same file
    $("#"+elem_id+"_upload").val(null);

    // See if we should upload the file immediately
    if (this.options.uploadDirect) {
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

$.any.anyView.prototype.getFileViewStr = function (type,kind,id,val,edit,data_item,filter_id,row_id_str)
{
  let elem_id  = this.id_base+"_"+type+"_"+kind+"_"+row_id_str+"_"+filter_id; // element id
  let filename = data_item[filter_id] ? data_item[filter_id]          : ""; // local file name on server
  let fileurl  = filename             ? any_defs.uploadURL + filename : ""; // url of server file
  let style    = kind == "list" ? "style='text-align:center;'" : "";
  let str_open = "View file in new tab/window"; // TODO i18n
  let str = "<div id='"+elem_id+"_fileview' "+style+">"+
            "<a href='"+fileurl+"' onclick='return false;'>"+
            "<input class='itemText' value='"+filename+"' type='hidden'></input>"+
            "<i class='far fa-file' title='"+str_open+"'></i>"+
            "</a>"+
            "</div>";
  return str;
}; // getFileViewStr

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

/************ The following get methods are not used yet ************/
/*
$.any.anyView.prototype.getHttpStr = function (nameid,val,type,group_id,id)
{
  if (edit) {
    return this.getTextStr(type,kind,id,val,edit);
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

///////////////////////////////////////////////////////////////////////////////

/**
 * @method initComponents
 * @description Initializes various javascript components.
 *              If overridden by derived classes, this method *must* be called.
 * @return      `this`.
 */
$.any.anyView.prototype.initComponents = function ()
{
  // TinyMCE
  if (typeof tinyMCE != "undefined") {
    tinymce.init({
      width:      "100%",
      mode:       "specific_textareas",
      selector:   ".tinymce",
      theme:      "modern",
      menubar:    false,
      statusbar:  false,
      force_br_newlines: false,
      force_p_newlines:  false,
      forced_root_block: false, // Or ''?
      plugins: [
        "link image media autoresize"
      ],
      toolbar_items_size: "small",
      toolbar1: "undo redo | cut copy paste | link unlink anchor image media code | bullist numlist | outdent indent blockquote | alignleft aligncenter alignright alignjustify | hr",
      toolbar2: "bold italic underline strikethrough subscript superscript | styleselect formatselect fontselect fontsizeselect | searchreplace",
    });
  }
  return this;
}; // initComponents

/**
 * @method showMessages
 * @description Shows errors and/or messages.
 * @param {Object} modelOrString If a string, the message/error to display.
 *                               If a model, the model from which to display a message/error.
 *                               If null, `this.model` is assumed.
 * @return `this`.
 */
$.any.anyView.prototype.showMessages = function (modelOrString)
{
  let div_id = this.id_base+"_any_message";
  let msgdiv = $("#"+div_id);
  if (msgdiv.length) {
    msgdiv.empty();
    if (!modelOrString)
      modelOrString = this.model;
    let close_icon = "<span id='"+div_id+"_close' style='padding-right:5px;' class='far fa-window-close'></span>";
    if (typeof modelOrString == "object") {
      let err = this.options.showServerErrors && modelOrString.error_server ? modelOrString.error_server : modelOrString.error;
      if (err || modelOrString.message)
        msgdiv.append(close_icon+"<span style='color:red;'>"+err+"</span> "+modelOrString.message);
    }
    else
    if (typeof modelOrString == "string") {
        msgdiv.append(close_icon+"<span style='color:red;'>"+modelOrString+"</span>");
    }
    $("#"+div_id+"_close").off("click").on("click",function(event) { let msgdiv = $("#"+div_id); msgdiv.empty(); });
  }
  return this;
}; // showMessages

$.any.anyView.prototype.sortTable = function (event)
{
  if (!event || !event.data) {
    console.log("sortTable: Missing event or event.data. "); // TODO! i18n
    return;
  }
  let type     = event.data.type;
  let group_id = event.data.group_id;
  let order    = event.data.filter_id;
  let last_sort_by = this.options.sortBy;
  this.options.sortBy = order;
  if (this.options.sortBy == last_sort_by)
    this.options.sortDirection = this.options.sortDirection == "ASC" ? "DESC" : "ASC";
  let from = null;
  let num  = null;
  let table = $("#"+event.data.table_id);
  if (table.length && this.options.showPaginator) {
    let extra_foot = table.parent().find(".table_extrafoot");
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
    this.must_empty = $("#"+this.options.id); // Tell refresh loop to empty this view (to avoid flashing)
  }
  let mod_opt = {
    context:   this.model,
    type:      type,
    group_id:  group_id,
    from:      from,
    num:       num,
    order:     order,
    direction: this.options.sortDirection,
  };
  if (this.model.mode == "remote") {
    // Remote search, let the database do the sorting.
    // Will (normally) call refresh via onModelChange
    this.options.indent_level = -1;
    this.options.ref_rec = 0;
    this.model.dbSearch(mod_opt);
  } // if remote
  else {
    // TODO! Local sort not implemented yet
    console.log("sortTable: Local sort not implemented. ");
  }
}; // sortTable

$.any.anyView.prototype._processSearch = function (event)
{
  if (event.keyCode == 13) {
    let search_opt = event.data;
    search_opt.term = $("#"+search_opt.inp_id).val();
    search_opt.success   = this.searchSuccess; // TODO! Parameters to searchSuccess
    search_opt.context   = this;
    search_opt.grouping  = this.options.grouping;
    search_opt.order     = this.options.sortBy;
    search_opt.direction = this.options.sortDirection;
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

    let search_view = self.createView({
                         parent:     ll_contents,
                         data:       self.model.data,
                         id:         null,
                         type:       list_type,
                         kind:       "list",
                         row_id_str: options ? options.row_id_str : "", // TODO!
                      });
    if (search_view) {
      if (search_view.model && self.model)
        search_view.model.last_term = self.model.last_term; // If paginating and we need to call server, repeat the last seach term
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
  // Close dialog
  w3_modaldialog_close(opt);
}; // searchSuccessOk

//
// Refresh when a paginator is activated
//
$.any.anyView.prototype.pageNumClicked = function (pager)
{
  if (!pager || !pager.options || !pager.options.div_info) {
    console.error("System error: Pager or pager options missing for pageNumClicked. "); // TODO! i18n
    return;
  }
  this.must_empty = $("#"+this.options.id); // Tell refresh loop to empty (to avoid flashing)
  this.options.currentPage = pager.currentPage();
  let from = pager.options.itemsPerPage *(pager.currentPage() - 1) + 1;
  let num  = pager.options.itemsPerPage;
  let mod_opt = {
    from:      from,
    num:       num,
    context:   this.model,
    type:      pager.options.div_info.type,
    group_id:  pager.options.div_info.group_id,
    grouping:  this.options.grouping,
    order:     this.options.sortBy,
    direction: this.options.sortDirection,
    head:      this.options.grouping == "tabs",
    simple:    this.options.grouping === null,
  };
  if (this.model.mode == "remote" && !mod_opt.simple) { // If "simple" mode, we assume all data is read already
    this.options.ref_rec = 0;
    mod_opt.from -= 1; // from is 0-based on server
    if (this.model.last_term && this.model.last_term != "")
      mod_opt.term = this.model.last_term;
    this.model.dbSearch(mod_opt);
  }
  else {
    this.refresh({from:from,num:num});
  }
}; // pageNumClicked

///////////////////////////////////////////////////////////////////////////////

// Process Esc and Enter keys.
$.any.anyView.prototype._processKeyup = function (event)
{
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
      let is_new = event.data.is_new ? event.data.is_new : data && data[id] ? data[id].is_new : false
      event.data.is_new = is_new;
      event.data.indata = event.data.data;
      if (this.options.onEnterCallDatabase)
        this.dbUpdate(event);
      let kind = event.data.kind;
      if (kind == "list" || kind == "select") {
        this.current_edit = null;
        if (this.options.onEnterInsertNew) {
          // Add a new row to the list
          event.data.is_new = true;
          event.data.new_id = null;
          this.addListEntry(event);
        }
        else
        if (this.options.onEnterMoveFocus) {
          // TODO! Enter in a list input field should optionally move to next row and start editing it, unless onEnterInsertNew or onEnterCallDatabase are true.
          // TODO! Also make TAB (optionally) move to next field.
        }
      }
      else
      if (kind == "item") {
        if (this.options.onEnterMoveFocus && !this.options.onEnterCallDatabase) {
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

///////////////////////////////////////////////////////////////////////////////

$.any.anyView.prototype.addListEntry = function (event)
{
  let type       = event.data.type;
  let id         = event.data.id;
  let con_id_str = event.data.con_id_str;
  let filter     = event.data.filter;
  let edit       = event.data.edit;
  let new_id     = event.data.new_id;
  let is_new     = event.data.is_new;
  let pdata      = event.data.pdata;
  let pid        = event.data.pid;

  if (edit && (new_id || new_id === 0)) {
    this.model.dataDelete({ id: new_id });
    let new_params = {
      parent: this.element,
      data:   this.model.data,
      id:     pid,
      type:   type,
      pdata:  pdata,
      pid:    pid,
    };
    this.refreshData(new_params);
  }
  // Get a new id (from database, if we use that) and add a new empty item to the data model.
  let the_data = this.model.dataSearch({
                    type: type,
                    id:   pid,
                    data: this.model.data,
                    parent: true,
                 }); // Find the place to add the new item
  if (is_new) {
    if (this.model.mode != "remote") {
      let new_id = this.model.dataSearchNextId(type);
      if (new_id >= 0) {
        // Find a new row_id_str
        let the_id = Number.isInteger(parseInt(new_id)) ? parseInt(new_id) : new_id;
        let row_id_str = con_id_str ? con_id_str+"_"+the_id : ""+the_id;
        this._addListEntry({
           type:       type,
           kind:       "list",
           data:       the_data,
           new_id:     new_id,
           con_id_str: con_id_str,
           row_id_str: row_id_str,
           filter:     filter,
           pdata:      pdata,
           pid:        pid,
        });
      }
      else {
        this.model.error = "Next id not found. "; // TODO! i18n
        console.error(this.model.error);
        return false;
      }
    }
    else { // remote
      // Find a new row_id_str
      let the_id = Number.isInteger(parseInt(new_id)) ? parseInt(new_id) : new_id;
      let row_id_str = con_id_str ? con_id_str+"_"+the_id : ""+the_id;
      this.model.dbSearchNextId({
         type:       type,
         data:       the_data,
         con_id_str: con_id_str,
         row_id_str: row_id_str,
         pdata:      pdata,
         pid:        pid,
         success:    this._addListEntryFromDB,
         context:    this,
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
      serverdata.kind       = "list";
      serverdata.type       = options.type;
      serverdata.con_id_str = options.con_id_str;
      serverdata.row_id_str = options.row_id_str;
      serverdata.new_id     = serverdata.id;
      let the_id = Number.isInteger(parseInt(serverdata.new_id)) ? parseInt(serverdata.new_id) : serverdata.new_id;
      serverdata.row_id_str = serverdata.con_id_str ? serverdata.con_id_str+"_"+the_id : ""+the_id;
      if (typeof serverdata.new_id == "string")
        if (serverdata.new_id.length && serverdata.new_id[0] != "+")
          serverdata.new_id = "+"+serverdata.new_id;
      serverdata.data   = options.data  ? options.data  : view.model.data;
      serverdata.filter = view.getFilter(serverdata.type,serverdata.kind);
      serverdata.pdata  = options.pdata ? options.pdata : null;
      serverdata.pid    = options.pid   ? options.pid   : null;
      view._addListEntry(serverdata);
    }
  }
}; // _addListEntryFromDB

$.any.anyView.prototype._addListEntry = function (opt)
{
  let type       = opt.type;
  let kind       = opt.kind;
  let new_id     = opt.new_id;
  let con_id_str = opt.con_id_str;
  let row_id_str = opt.row_id_str;
  let filter     = opt.filter;
  let pdata      = opt.pdata;
  let pid        = opt.pid;

  let indata = {};
  if ((new_id || new_id===0) && !indata[new_id])  { // New row
    indata = {};
    indata[kind] = type;
    //indata.data = {}; // TODO! Why?
  }
  if (indata) {
    indata.type = type;
    indata.kind = kind;
    let id_key  = this.model.id_key
                  ? this.model.id_key
                  : type+"_id";
    for (let filter_id in filter) {
      if (filter_id == id_key)
        indata[filter_id] = new_id;
      else
        indata[filter_id] = "";
    }
    indata.is_new = true;
  }
  let the_data = opt.data ? opt.data : this.model.data;
  if (new_id || new_id===0)
    this.model.dataInsert({
       type:   opt.type,
       data:   the_data,
       id:     null,
       indata: indata,
       new_id: new_id,
    });
  else
    this.model.dataUpdate({
       type:   opt.type,
       data:   the_data,
       id:     opt.id,
       indata: indata,
    });
  opt.new_id = null; // Important! To make addListEntry work with id == 0

  this.refreshOne({
     parent:     this.element,
     type:       type,
     kind:       kind,
     data:       opt.data,
     id:         new_id,
     con_id_str: con_id_str,
     row_id_str: row_id_str,
     pdata:      pdata,
     pid:        pid,
     edit:       true,
  });
}; // _addListEntry

///////////////////////////////////////////////////////////////////////////////

// Default action when clicking on a name link.
$.any.anyView.prototype.itemLinkClicked = function (event)
{
  this.data_level = 0;
  if (this.resetTabs)
    this.resetTabs(); // TODO! Calling method in tabs class!
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
    // Find id for a new item
    if (this.model.mode == "local") {
      id = this.model.dataSearchNextId(type,this.model.data);
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
      this.model.dbSearchNextId({
         type:    type,
         is_new:  true,
         success: this._foundNextIdFromDB,
         context: this,
      }); // TODO! Asynchronous database call
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
      serverdata.view = view;
      view._doShowItem(serverdata);
    }
  }
}; // _foundNextIdFromDB

// Open a (possibly new and empty) item view.
$.any.anyView.prototype._doShowItem = function (opt)
{
  let type     = opt.head ? opt.head : opt.item ? opt.item : opt.list ? opt.list : opt.type ? opt.type : "";
  let kind     = "item";
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
    the_id = id;
  if (!the_id && the_id !== 0) {
    console.error("System error: Could not find id. "); // Should never happen TODO! i18n
    return false;
  }

  // Find the item name
  let item_name = null;
  if (the_id && !is_new)
    item_name = the_data[the_id][name_key];
  else
    item_name = i18n.message.newType.replace("%%",type); // Edit new

  // Create a new item
  let the_item = {
    "+0": { // Header
      head: type,
      [name_key]: item_name,
      data: {},
    },
  };
  if (is_new) {
    // Fill the item with empty data for all displayable entries
    the_item["+0"].data[the_id] = {};
    let filter = this.getFilter(type,"item");
    for (let filter_id in filter)
      if (filter[filter_id].DISPLAY)
        the_item["+0"].data[the_id][filter_id] = "";
  }
  else {
    // Fill the item with data copied from original data structure
    the_item["+0"].data[the_id] = (the_data && the_data[the_id])
                                  ? $.extend(true, {}, the_data[the_id])
                                  : null;
    if (the_item["+0"].data[the_id].head)
      delete the_item["+0"].data[the_id].head; // TODO! Why?
    if (the_item["+0"].data[the_id].list)
      delete the_item["+0"].data[the_id].list; // TODO! Why?
  }
  the_item["+0"].data[the_id].item   = type;
  the_item["+0"].data[the_id].is_new = is_new;

  // Create and prepare a new display area
  let view = this.createView({
    parent:     this.element,
    type:       type,
    kind:       kind,
    data:       the_item,
    id:         the_id,
    row_id_str: opt.row_id_str,
    data_level: 0, // Reset data_level for the new view
    showHeader: opt.showHeader === false ? false : true,
    onEscEndEdit:     opt.onEscEndEdit     !== undefined ? opt.onEscEndEdit     : this.options.onEscEndEdit,
  });
  if (!view || !view.options || !view.options.top_view) {
    console.error("System error: View missing. "); // Should never happen TODO! i18n
    return false;
  }
  let top_view = this.options.top_view;
  if (top_view) {
    if (top_view.resetTabs)
      top_view.resetTabs(); // TODO! Calling method in tabs class!
    if (top_view.element && top_view.element.length) {
      top_view.element.empty();
      view.element = top_view.element;
    }
  }
  // Set the state of the new view
  view.options.item_opening = true; // To make top right close icon appear
  if (is_new) {
    view.options.isEditable  = true;
    view.options.isDeletable = false;
    view.options.isRemovable = false;
  }
  // Display the item data
  if (view.model.mode == "remote" && !is_new) {
    // Remote search: Will (normally) call refresh via onModelChange
    view.model.dbSearch({
      type:     type,
      id:       the_id,
      head:     true,
      grouping: this.options.grouping,
      context:  view.model,
    });
  }
  else {
    // Local refresh: Display the empty data structure just created
    if (is_new)
      the_id = "+0";
    view.refresh({
      type:     type,
      kind:     "item",
      data:     the_item,
      id:       the_id,
      edit:     is_new,
    });
  } // else
  return true;
}; // _doShowItem

$.any.anyView.prototype.closeItem = function (event)
{
  // TODO! Should check for changed values and give warning before closing
  if (this.options.top_view)
    this.options.top_view.refresh();
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
  let prefix  = this.id_base+"_"+opt.type+"_"+opt.kind+"_"+opt.row_id_str;
  let elem_id = opt.kind == "item"
                ? prefix+"_tbody"
                : prefix+"_tr";
  let elem = $("#"+elem_id);
  if (elem.length) {
    if (opt.kind != "item") {
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
        kind:       opt.kind,
        data:       opt.data,
        id:         opt.id,
        con_id_str: opt.con_id_str,
        pdata:      opt.pdata,
        pid:        opt.pid,
        edit:       opt.edit,
      };
      let have_data = Object.size(opt.data) > 0;
      new_params.data_div = this.getOrCreateDataContainer(this.element,opt.type,opt.kind,opt.con_id_str);
      new_params.table    = this.getOrCreateTable(new_params.data_div,opt.type,opt.kind,opt.con_id_str);
      this.refreshData(new_params);
    }
    else {
      this.refreshItemTableDataRow({
        parent:     elem,
        type:       opt.type,
        kind:       opt.kind,
        data:       opt.data,
        id:         opt.id,
        con_id_str: opt.con_id_str,
        pdata:      opt.pdata,
        pid:        opt.pid,
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
      kind:       opt.kind,
      data:       opt.data,
      id:         opt.id,
      con_id_str: opt.con_id_str,
      row_id_str: opt.row_id_str,
      filter:     opt.filter,
      is_new:     opt.is_new,
      pdata:      opt.pdata,
      pid:        opt.pid,
      isEditable: opt.isEditable, // TODO! Not used?
      edit:       true,
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
  let chk_id  = this.id_base+"_"+opt.type+"_"+opt.kind+"_"+opt.row_id_str+"_select_icon .check";
  let check_str = (opt.checked)
                  ? "<i class='far fa-square'></i>"
                  : "<i class='far fa-check-square'></i>";
  let chk = $("#"+chk_id);
  if (chk.length)
    chk.html(check_str);
  opt.checked = !opt.checked;
  if (opt.checked) {
    this.model.select.add(parseInt(opt.id));
    this.model.unselect.delete(parseInt(opt.id));
  }
  else {
    this.model.select.delete(parseInt(opt.id));
    this.model.unselect.add(parseInt(opt.id));
  }
}; // _toggleChecked

///////////////////////////////////////////////////////////////////////////////
// Methods that call db methods
///////////////////////////////////////////////////////////////////////////////

/**
 * @method dbSearchParents
 * @description Search for the list of possible parent items for the item with the given id.
 *              Called when processing plugin filters.
 *              The success metod builds a dropdown menu.
 * @param  type
 * @param  kind
 * @param  id
 * @param  val
 * @param  pid
 * @param  edit
 * @return true on success, false on error.
 */
$.any.anyView.prototype.dbSearchParents = function (type,kind,id,val,edit,pid)
{
  if (!this.model)
    return val;
  let options = {
   type:      type,
   kind:      kind,
   id:        null, // Search for all items of given type
   parent_id: pid,
   child_id:  id,
   simple:    true,
   success:   this.createParentDropdownMenu,
   context:   this,
  };
  if (edit)
    return this.model.dbSearch(options); // TODO! What if mode == "local"?
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
  self.last_db_command = "sea";

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
      console.log("anyView.createParentDropdownMenu: "+self.message);
    if (self.error_server)
      console.error("anyView.createParentDropdownMenu: "+self.error_server);
    if (serverdata.data) {
      let view = options.context ? options.context : null;
      if (view) {
        let kind      = options.kind;
        let type_name = options.type+"_name";
        let the_id    = Number.isInteger(parseInt(options.child_id)) ? parseInt(options.child_id) : options.child_id;
        let id_str    = "0_"+the_id;
        let data      = serverdata.data;
        let item_id = view.id_base+"_"+options.type+"_"+kind+"_"+id_str+"_parent_id .itemSelect";
        let did_select = "selected='true'";
        $.each(data,function (id,item) {
          if (parseInt(id) != the_id) {
            let sel = parseInt(id) == parseInt(options.parent_id) ? "selected='true'" : "";
            let pname = data[id][type_name];
            $("#"+item_id).append($("<option "+sel+">").attr("value",parseInt(id)).text(pname));
            if (sel != "") {
              $("#"+item_id+"-button .ui-selectmenu-text").text(item[type_name]); // TODO! .ui-selectmenu-text no longer used
              did_select = "";
            }
          }
        });
        $("#"+item_id).prepend($("<option "+did_select+">").attr("value","null").text("[None]")); // TODO! i18n
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
  let kind       = event.data.kind;
  let indata     = event.data.indata;
  let id         = event.data.id;
  let con_id_str = event.data.con_id_str;
  let row_id_str = event.data.row_id_str;
  let pdata      = event.data.pdata;
  let pid        = event.data.pid;

  this.model.error = "";
  if (!id && id !== 0) // Should never happen
    this.model.error += i18n.error.ID_MISSING;
  if (!indata || !indata[id]) // Should never happen
    this.model.error += i18n.error.DATA_MISSING;
  if (this.model.error) {
    console.error("System error: "+this.model.error);
    this.showMessages();
    return false;
  }

  // Update model with contents of input fields
  let filter = this.getFilter(type,kind);
  let data_values = {};
  for (let filter_id in filter) {
    if (filter.hasOwnProperty(filter_id)) {
      let val = null;
      let input_id = this.id_base+"_"+type+"_"+kind+"_"+row_id_str+"_"+filter_id+" .itemEdit";
      if ($("#"+input_id).length)
        val = $("#"+input_id).val();
      else {
        // Send values marked as dirty to server even if they are not editable
        input_id = this.id_base+"_"+type+"_"+kind+"_"+row_id_str+"_"+filter_id+"[dirty='true']";
        if ($("#"+input_id).length)
          val = $("#"+input_id).val();
      }
      if (val || val == "") {
        data_values[filter_id] = val;
        if (filter_id == "parent_id") {
          let input_id = this.id_base+"_"+type+"_"+kind+"_"+row_id_str+"_"+filter_id+" .itemSelect option:selected";
          let pname = $("#"+input_id).text();
          data_values["parent_name"] = pname;
        }
      }
    }
  }
  this.model.dataUpdate({
     type:   type,
     id:     id,
     indata: data_values,
  });
  if (data_values["parent_name"])
    delete data_values["parent_name"]; // TODO! Why?
  if (id || id === 0) { // TODO!
    if (kind == "item") {
      // Update header for item view
      let head_item = this.model.dataSearch({ type: type,
                                              id:   "+0",
                                           });
      if (head_item && head_item["+0"]) {
        if (data_values[this.model.name_key]) {
          head_item["+0"][this.model.name_key] = data_values[this.model.name_key];
          let con_div = this.element; // TODO! UNTESTED!
          let new_params = {
            parent:     con_div,
            type:       type,
            kind:       "head",
            data:       this.model.data,
            id:         "0",
            con_id_str: "0",
            doNotEmpty: true,
          };
          this.refreshHeader(new_params); // TODO! Does not work?
        }
      }
    }
    /* TODO! Neccessary for mode == "remote"?
    // Make sure the items original model is also updated
    if (this.options.view && this.options.view != this) { // TODO! no view here
      if (!event.data.is_new)
        this.options.view.model.dataUpdate({
           type:   type,
           id:     id,
           indata: data_values,
        });
      else {
        let dv = {};
        dv[id] = data_values;
        this.options.view.model.dataInsert({
           type:   type,
           id:     pid,
           indata: dv,
           new_id: id,
        });
        }
    }
    */
  }
  // Update view TODO! Neccessary for mode == "remote"?
  let item = this.model.dataSearch({ type: type,
                                     id:   id,
                                  });
  if (item && item[id])
    delete item[id].is_new; // TODO! Neccessary?
  if (kind == "list" || kind == "select") {
    let tr_id = this.id_base+"_"+type+"_"+kind+"_"+row_id_str+"_tr";
    let tr    = $("#"+tr_id);
    if (!tr.length) {
      console.error("dbUpdate: Could find row "+tr_id);
      return false;
    }
    let params = {
      parent:     tr.parent(),
      type:       type,
      kind:       kind,
      data:       indata,
      id:         id,
      edit:       false,
      con_id_str: con_id_str,
      row_id_str: row_id_str,
      pdata:      pdata,
      pid:        pid,
    };
    this.refreshListTableDataRow(params);
  }
  else {
    this.options.isDeletable = this.options.isEditable;
    this.refreshData(); // TODO! refresh()
  }

  if (kind == "item")
    this.options.item_opening = true; // To make top right close icon appear

  // Update database
  if (this.model.mode == "remote")
    return this.model.dbUpdate(event.data);

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
 * @method dbSearchLinks
 * @description Search for the list of items to select from.
 *              Called when selecting in the "Add..." menu in bottom toolbar of an item.
 *              The success metod builds a list of selectable items in a dialog.
 * @param  {Object} event
 * @return true on success, false on error.
 */
$.any.anyView.prototype.dbSearchLinks = function (event)
{
  if (!this.model)
    return false;
  let options = {
   parent_view: this,
   type:        event.data.link_type, // Switch types
   id:          null,
   link_type:   event.data.type,      // Switch types
   simple:      true,
   head:        true,
   grouping:    null,
   from:        0,
   num:         this.options.itemsPerPage,
   success:     this.dbUpdateLinkListDialog, // Call the view success handler
  };
  return this.model.dbSearch(options); // TODO! What if mode == "local"?
}; // dbSearchLinks

// Create a list of selectable items and display in a modal dialog.
// Note: The 'this' context is here the calling model! Use options.parent_view for view methods!
$.any.anyView.prototype.dbUpdateLinkListDialog = function (context,serverdata,options)
{
  let self = context ? context : this;
  self.last_db_command = "sea";

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
      console.log("anyView.dbUpdateLinkListDialog: "+self.message);
    if (self.error_server)
      console.error("anyView.dbUpdateLinkListDialog: "+self.error_server);

    if (serverdata.data) {
      let parent_view = options.parent_view ? options.parent_view : this;
      if (parent_view) {
        let list_type   = options.type;
        let new_id_base = parent_view._createIdBase();
        let ll_id       = new_id_base+"_"+list_type+"_link_list";
        let ll_contents = $("<div id='"+ll_id+"'></div>");

        let select_list_view = parent_view.createView({
                                  parent:     ll_contents,
                                  type:       list_type,
                                  kind:       "list",
                                  data:       serverdata.data,
                                  id:         null,
                                  row_id_str: options.row_id_str,
                               });
        if (select_list_view) {
          select_list_view.id_base = new_id_base;
          select_list_view.options.grouping        = null;
          select_list_view.options.showHeader      = false;
          select_list_view.options.showTableHeader = false;
          select_list_view.options.showTableFooter = false;
          select_list_view.options.isSelectable    = true; // Use the select filter, if available
          select_list_view.options.preselected     = parent_view.model.dataSearch({ type:list_type });
          let mod_opt = { select: new Set() };
          if (select_list_view.options && select_list_view.options.preselected)
            for (var val of select_list_view.options.preselected) {
              let sel_id = val[select_list_view.model.id_key];
              if (sel_id && sel_id != self.id && (self.type != val.list || !val.parent_id || val.parent_id == self.id))
                mod_opt.select.add(parseInt(val[select_list_view.model.id_key]));
            }
          select_list_view.model.dataInit(mod_opt);
          let par_view_id = parent_view.id_base+"_"+self.type+"_head_0_data";
          w3_modaldialog({
            parentId:    par_view_id,
            elementId:   "",
            heading:     "Select "+list_type+"s to add / remove", // TODO! i18n
            contents:    select_list_view.element,
            width:       "25em", // TODO! css
            ok:          true,
            cancel:      true,
            okFunction:  parent_view.dbUpdateLinkList,
            context:     parent_view,
            // Sent to okFunction:
            type:        self.type,
            data:        self.data,
            id:          self.id,
            link_type:   select_list_view.model.type,
            link_id:     null,
            select:      select_list_view.model.select,
            unselect:    select_list_view.model.unselect,
            name_key:    select_list_view.model.name_key,
          });
          select_list_view.refresh();
        }
      } // if parent_view
    }
  }
  if (options.parent_view) {
    let view = options.parent_view;
    if (view.options.showToolbar) {
      view.options.item_opening = true; // To make top right close icon appear
      view.refreshToolbarBottom({
         parent:     view.element,
         type:       view.model.type,
         kind:       view.model.kind,
         data:       view.model.data,
         id:         view.model.id,
         con_id_str: "",
         edit:       false,
      });
    }
  }
  return context;
}; // dbUpdateLinkListDialog

$.any.anyView.prototype.dbUpdateLinkList = function (opt)
{
  // Close dialog
  w3_modaldialog_close(opt);

  if (!this.model)
    throw i18n.error.MODEL_MISSING;

  this.removeFromView(opt); // TODO! Neccessary?
  if (this.resetTabs)
    this.resetTabs(); // TODO! Calling method in tabs class!

  // Update database
  this.options.item_opening = true; // To make top right close icon appear
  if (!this.model.dbUpdateLinkList({ // TODO! What if mode == "local"?
         view:      opt.view, // Refresh only this view
         type:      opt.type,
         data:      opt.data,
         id:        opt.id,
         link_type: opt.link_type,
         link_id:   opt.link_id,
         select:    opt.select,
         unselect:  opt.unselect,
         name_key:  opt.name_key,
         head:      true,
         grouping:  this.options.grouping,
       }))
    return false;

  return true;
}; // dbUpdateLinkList

$.any.anyView.prototype.dbRemoveDialog = function (event)
{
  if (!this.model)
    throw i18n.error.MODEL_MISSING;
  if (!event || !event.data)
    throw i18n.error.DATA_MISSING;

  let type       = event.data.type;
  let kind       = event.data.kind;
  let data       = event.data.data;
  let id         = event.data.id;
  let row_id_str = event.data.row_id_str;
  let pdata      = event.data.pdata;
  let pid        = event.data.pid;
  let link_id    = pdata && pdata.grouping_for_id   ? pdata.grouping_for_id   : pid && pdata[pid] ? pid : null;
  let link_type  = pdata && pdata.grouping_for_type ? pdata.grouping_for_type : pid && pdata[pid] ? pdata[pid].list ? pdata[pid].list : pdata[pid].head ? pdata[pid].head : null : null;
  if (!data || !data[id]) {
    console.warn("Data not found ("+type+" id="+id+"). ");
    return null;
  }
  if (!link_id || !link_type) {
    // No parent, it must be a new and unsaved entry, so just update view and return
    this.removeFromView(event.data);
    return null;
  }
  if (this.options.confirmRemove && !data[id].is_new) {
    let linkdata = this.model.dataSearch({ type:   type,
                                           id:     id,
                                           parent: true,
                                        });
    let name_key = this.model && this.model.name_key ? this.model.name_key : type+"_name";
    let the_name = data[id][name_key] ? data[id][name_key] : "";
    let msgstr   = i18n.message.removeByName.replace("%%","'"+the_name+"'");
    if (kind == "list") {
      let lfname = linkdata && linkdata[this.model.name_key]
                   ? "from the "+linkdata[this.model.name_key]+" list"
                   : "from this list"; // TODO! i18n
      msgstr += " "+lfname;
    }
    let msg = "<div class='any-confirm-remove-dialog' id='"+this.id_base+"_confirm_remove' style='padding:.8em;'>"+
              msgstr+"?"+
              "</div>";
    let parent_id = this.element.attr("id");
    if (parent_id)
      w3_modaldialog({
        parentId:   parent_id,
        elementId:  "",
        heading:    kind == "item" ? i18n.button.buttonRemove : i18n.button.buttonRemoveFromList.replace("%%",type),
        contents:   msg,
        width:      "25em",
        ok:         true,
        cancel:     true,
        okFunction: this.dbUpdateLinkList,
        context:    this,
        // Sent to okFunction:
        type:       type,
        kind:       kind,
        id:         id,
        data:       data,
        row_id_str: row_id_str,
        link_type:  link_type,
        link_id:    link_id,
        select:     new Set(),
        unselect:   new Set().add(id),
      });
  }
  else {
    let opt = {
        type:       type,
        kind:       kind,
        data:       data,
        id:         id,
        row_id_str: row_id_str,
        link_type:  link_type,
        link_id:    link_id,
        select:     new Set(),
        unselect:   new Set().add(id),
    };
    this.dbUpdateLinkList(opt);
  }
  return this;
}; // dbRemoveDialog

/**
 * @method dbDeleteDialog
 * @description Deletes an item from memory and database and refreshes view.
 * @param {Object}  options
 *
 * @return this
 *
 * @throws {MODEL_MISSING} If `this.model` or `this.model.permission` are null or undefined.
 * @throws {DATA_MISSING}
 */
$.any.anyView.prototype.dbDeleteDialog = function (event)
{
  if (!this.model)
    throw i18n.error.MODEL_MISSING;
  if (!event || !event.data)
    throw i18n.error.DATA_MISSING;

  let type       = event.data.type;
  let kind       = event.data.kind;
  let data       = event.data.data;
  let id         = event.data.id;
  let row_id_str = event.data.row_id_str;

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
        kind:       kind,
        data:       data,
        id:         id,
        row_id_str: row_id_str,
      });
  }
  return true;
}; // dbDeleteDialog

$.any.anyView.prototype.dbDelete = function (opt)
{
  // Close dialog
  w3_modaldialog_close(opt);

  if (!this.model)
    throw i18n.error.MODEL_MISSING;

  let item = this.model.dataSearch(opt);
  if (!item || !item[opt.id])
    throw i18n.error.SYSTEM_ERROR; // Should never happen

  let is_new = item[opt.id].is_new;

  // Delete from model
  // If deleting an item (as opposed to a list entry), we must also delete from a potential top view
  if (opt.kind == "item") {
    this.model.data = null;
    if (this.options.top_view && this.options.top_view.model) {
      let top_model = this.options.top_view.model;
      opt.success = top_model.dbDeleteSuccess;
      opt.context = top_model;
      top_model.dataDelete({id:opt.id,type:opt.type});
    }
  }
  else {
    opt.success = null;
    opt.context = null;
    this.model.dataDelete(opt);
  }

  // Update view
  this.removeFromView(opt);

  // If in an item view, close the view
  if (opt.kind == "item")
    this.closeItem({data:opt});

  // Delete from database, but only if the item is not new (i.e. exists in db).
  if (!is_new)
    this.model.dbDelete(opt); // TODO! What if mode == "local"?

  return true;
}; // dbDelete

// Remove a row (and subrows, if any) from a list, or the main container of an item.
// Does not  remove from memory (data structure).
$.any.anyView.prototype.removeFromView = function (opt)
{
  let type       = opt.type;
  let kind       = opt.kind;
  let data       = opt.data;
  let id         = opt.id;
  let row_id_str = opt.row_id_str;

  if (kind == "list" || kind == "select") {
    let elem_id = this.id_base+"_"+type+"_"+kind+"_"+row_id_str +"_tr";
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
      for (let new_id in item[id].data) {
        if (item[id].data.hasOwnProperty(new_id)) {
          let the_id = Number.isInteger(parseInt(new_id)) ? parseInt(new_id) : new_id;
          let elem_id = this.id_base+"_"+type+"_"+kind+"_"+row_id_str+"_"+the_id+"_tr";
          let tr      = $("#"+elem_id);
          if (tr.length)
            tr.remove();
        }
      }
    }
  }
  else
  if (kind == "item") {
    let elem_id = this.id_base+"_"+type+"_"+kind+"_"+row_id_str+"_container";
    let con = $("#"+elem_id);
    if (con.length && con.parent().length && con.parent().parent().length)
      con.parent().parent().remove();
  }
  return this;
}; // removeFromView

})($);

///////////////////////////////////////////////////////////////////////////////
// This can be used to instantiate anyView:
///////////////////////////////////////////////////////////////////////////////
var anyView = function (options)
{
  if (!options)
    return null;
  return $.any.anyView(options);
};
//@ sourceURL=anyView.js