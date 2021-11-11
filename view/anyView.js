/* jshint sub:true */
/* jshint esversion: 9 */
/* globals $,i18n,isFunction,w3_modaldialog,w3_modaldialog_close,tinyMCE,tinymce,isInt */
"use strict";
/****************************************************************************************
 *
 * anyList is copyright (C) 2011-2021 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyList Commercial License for commercial use.
 * Get licences here: http://balanse.info/anylist/license/ (coming soon).
 *
 ***************************************************************************************/
/**
 * __View for the anyList data model.__
 *
 * See <a href="../classes/anyModel.html">`anyModel`</a> for a description of the data model class.
 *
 * Note: All jQuery id's in anyList are on the format [base_id]\_[type]\_[kind]\_[id]\_[html_name].
 *
 * @class anyView
 * @constructor Sets the view's variables according to `options`, or to default values.
 * @param {Object}  options An object which may contain these elements:
 *
 *        {Object}  model:                 The model with data to be displayed. Default: null.
 *        {Object}  filters:               The filters define how the data will be displayed. Default: null.
 *        {string}  id:                    The jQuery id of a container element in which to display the view. Default: null.
 *        {boolean} refresh:               If true, the constructor will call `this.refresh` at the end of initialization. Default: false.
 *        {boolean} isEditable:            Icons for edit, update and cancel will be displayed. Ignored if isSelectable is set. Default: false.
 *        {boolean} isRemovable:           An icon for removing will be displayed. Ignored if isSelectable is set. Default: false.
 *        {boolean} isDeletable:           An icon for deleting will be displayed. Ignored if isSelectable is set. Default: false.
 *        {boolean} isSelectable:          An icon for selecting a list row will be displayed. Ignored for items. If isSelectable is set,
 *                                         isEditable, isRemovable and isDeletable will be ignored. Default: false.
 *        {boolean} confirmRemove:         A remove confirmation dialog will be displayed. Default: true.
 *        {boolean} confirmDelete:         A delete confirmation dialog will be displayed. Default: true.
 *        (boolean) showHeader:            If false, all headers will be suppressed. Default: true.
 *        (boolean) showTableHeader:       Whether to show headers for list tables. Default: true.
 *        (boolean) showToolbar:           Will show a toolbar at the bottom. Default: true.
 *        (boolean) showMessages:          Will show a message field in a toolbar. Default: false.
 *        (boolean) showEmptyRows:         Shows empty rows in non-edit mode. Default: false.
 *        (boolean) showSelectAll:         If isSelectable is true, a button for selecting all rows will be shown. Default: false.
 *        (integer) showButtonAdd:         If isEditable is true, a button for adding new rows may be shown in list table headers. Possible values:
 *                                         0: Do not show an add button. 1: Show button in first column. 2: Show button in last column. Default: 0.
 *        (boolean) showButtonEdit:        If isEditable is true, will show an edit button in front of each list table row. Default: true.
 *        (boolean) showButtonUpdate:      If isEditable is true, will show an update button in front of each list table row in edit-mode. Default: true.
 *        (boolean) showButtonRemove:      If isEditable is true, will show a remove button after each list table row. Default: false.
 *        (boolean) showButtonDelete:      If isEditable is true, will show a delete button after each list table row in edit-mode. Default: false.
 *        (boolean) showButtonCancel:      If isEditable is true, will show a cancel button after each list table row in edit-mode. Default: true.
 *        (boolean) showButtonNew:         If isEditable is true, will show a button for adding a new item. Default: false.
 *        (boolean) showButtonAddLink:     Will show a button for adding links to an item. Default: true.
 *        {boolean} showButtonLabels:      Will show labels for buttons on the button panel. Default: false.
 *        {boolean} onEnterCallDatabase:   Pressing enter will update the database with the value of the row being edited. Default: true.
 *        {boolean} onEnterInsertNew:      A new row will be inserted when pressing enter while editing a list. Default: false.
 *        {boolean} onEnterMoveFocus:      Pressing enter will move the focus to the next input element if editing an item. Default: True.
 *        {boolean} onEscRemoveEmpty:      The current row being edited in a list will be removed when pressing the Esc key if the row is empty. Default: true.
 *        {boolean} onFocusoutRemoveEmpty: The current row being edited in a list will be removed when loosing focus if the row is empty. Default: true.
 *        {boolean} onUpdateEndEdit:       NOT IMPLEMENTED. Pressing the update button will close the element currently being edited for editing. Default: true.
 *        {boolean} useOddEven:            If true, tags for odd and even columns will be generated for list entries. Default: false.
 *
 * @example
 *      new anyView({filters:my_filters,id:"my_content"});
 */
(function($) {
var ANY_LOCALE_NOT_FOUND = "No locale found. ";
var ANY_MAX_REF_REC = 30;

$.widget("any.View", {
  // Default options
  options: {
    model:                 null,
    filters:               null,
    id:                    null,

    refresh:               false,
    isEditable:            true,
    isRemovable:           true,
    isDeletable:           true,
    isSelectable:          false,
    confirmRemove:         true,
    confirmDelete:         true,
    showHeader:            true,
    showTableHeader:       true,
    showToolbar:           true,
    showMessages:          true,
    showEmptyRows:         false,
  //showSelectAll:         false, // TODO! NOT IMPLEMENTED
    showButtonAdd:         1, // 0 == do not show, 1 == first cell, 2 == last cell
    showButtonEdit:        true,
    showButtonUpdate:      true,
    showButtonRemove:      true,
    showButtonDelete:      true,
    showButtonCancel:      true,
    showButtonNew:         true,
    showButtonAddLink:     true,
    showButtonLabels:      false,
    onEnterCallDatabase:   true,
    onEnterInsertNew:      true, // Note: Only used for lists, ignored for items
    onEnterMoveFocus:      true, // Will me overridden by onEnterCallDatabase==true TODO! Make it work for lists
    onEscRemoveEmpty:      true,
    onFocusoutRemoveEmpty: true,
  //onUpdateEndEdit:       true, // TODO! NOT IMPLEMENTED
    useOddEven:            true,
    linkIcons:             null,

    // Local methods
    localSelect:           null,
    localEdit:             null,
    localUpdate:           null,
    localRemove:           null,
    localDelete:           null,
    localCancel:           null,
    localNewItem:          null,
    localCloseItem:        null,
    localAddListEntry:     null,

    // "Private" and undocumented options:
    subscribe_default:     true, // The default onModelChange method will be subscribed to.
    reset_listeners:       true, // The array of listeners will be erased on each call to the constructor.
    top_view:              null, // The top view for all views in the view tree (used by dialogs and item view)
    main_div:              null, // The main div for this view (used by dialogs)
    base_id:               "",
    id_stack:              null,
    data_level:            0,    // Current "vertical" level in data tree
    indent_tables:         false,
    indent_level:          0,
    indent_amount:         20,
    cutoff:                100,
    item_opening:          false,
    ref_rec:               0, // Used to prevent (theoretical) infinite recursion
  }, // options

  // Constructor
  _create: function() {
    if (typeof i18n === "undefined")
      throw ANY_LOCALE_NOT_FOUND;

    this.element.addClass("any-data-view");

    this.model = this.options.model
                 ? this.options.model
                 : null;

    if (this.options.id)
      this.element = $("#"+this.options.id);
    else
      this.options.id = this.element.attr("id");

    if (!this.options.top_view)
      this.options.top_view = this;

    this.main_div = this.options.main_div
                    ? this.options.main_div
                    : null;

    this.base_id  = this.options.base_id
                    ? this.options.base_id
                    : this._createBaseId();

    this.id_stack      = [];
    this.root_id_stack = this.options.id_stack
                         ? this.options.id_stack
                         : [];

    if (this.model && this.options.subscribe_default) {
      if (this.options.reset_listeners)
        this.model.cbUnsubscribe(this.onModelChange);
      this.model.cbSubscribe(this.onModelChange,this);
    }

    if (this.options.refresh)
      this.refresh();

    return this;
  }, // constructor

  refresh: function() {
    return this.refresh();
  },

  // Destructor
  _destroy: function() {
    this.model               = null;
    this.options.main_view   = null;
    this.options.top_view    = null;
    this.options             = null;
    this.element.removeClass("any-data-view");
  },
}); // View widget constructor

/////////////////////////
// Getters
/////////////////////////

/**
 * @method getBaseId
 * @description
 * @return this.baseId
 */
$.any.View.prototype.getBaseId = function ()
{
  return this.base_id;
}; // getBaseId

/**
 * @method getFilter
 * @description
 * @return If neither `type` nor `kind` are given or if only `kind` is given, `this.options.filters` is returned.
 *         `this.options.filters` is an object containing all the view's data filters (indexed by type (e.g. "event")
 *         and kind ("item", "list", "head" or "select")).
 *         If only `type` is given, the filters of the given type are returned.
 *         If both `type` and `kind` are given, the filter of the given type and kind is returned.
 *         Returns null if `this.options.filters` does not exist.
 * @param {String} type Object type (e.g. "event"). Optional, but mandatory if `kind` is given.
 * @param {String} kind "item", "list", "head" or "select". Ignored if `type` is not given.
 */
$.any.View.prototype.getFilter = function (type,kind)
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

/////////////////////////
// Internal methods
/////////////////////////

$.any.View.prototype._createBaseId = function ()
{
  return "baseId" + 1 + Math.floor(Math.random()*10000000); // Pseudo-unique id
}; // _createBaseId

$.any.View.prototype._createFilters = function (model)
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
    console.warn("Filter class "+f_str+" not found, using "+def_str+". ");
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
}; // _createFilters

$.any.View.prototype._findType = function (data,otype,id)
{
  let type = null;
  if (data && (id || id === 0)) {
    let d = data[id] ? data[id] : data["+"+id] ? data["+"+id] : null;
    if (d)
      type = d.list ? d.list : d.item ? d.item : d.head ? d.head : null;
  }
  if (!type)
    type = otype;
  if (!type)
    type = this.model.type;
  if (!type)
    type = "";
  return type;
}; // _findType

$.any.View.prototype._findKind = function (data,okind,id)
{
  let kind = null;
  if (data && (id || id === 0)) {
    let d = data[id] ? data[id] : data["+"+id] ? data["+"+id] : null;
    if (d)
      kind = d.list ? "list" : d.item ? "item" : d.head ? "head" : null;
  }
  if (!kind && okind != "head")
    kind = okind;
  if (!kind)
    kind = "list"; // Default
  if (kind == "list" && this.options.isSelectable)
    kind = "select";
  return kind;
}; // _findKind

///////////////////////////////////////////////////////////////////////////////

/**
 * @method showMessages
 * @description Shows errors and/or messages.
 * @param {Object} modelOrString If a string, the message/error to display.
 *                               If a model, the model from which to display a message/error.
 *                               If null, `this.model` is assumed.
 * @return `this`.
 */
$.any.View.prototype.showMessages = function (modelOrString)
{
  let div_id = this.base_id+"_any_message";
  let msgdiv = $("#"+div_id);
  if (msgdiv.length) {
    msgdiv.empty();
    if (!modelOrString)
      modelOrString = this.model;
    let close_icon = "<span id='"+div_id+"_close' style='padding-right:5px;' class='far fa-window-close'></span>";
    if (typeof modelOrString == "object") {
      if (modelOrString.error || modelOrString.message)
        msgdiv.append(close_icon+"<span style='color:red;'>"+modelOrString.error+"</span> "+modelOrString.message);
    }
    else
    if (typeof modelOrString == "string") {
        msgdiv.append(close_icon+"<span style='color:red;'>"+modelOrString+"</span>");
    }
    let self = this;
    $("#"+div_id+"_close").off("click").on("click",function(event) { let msgdiv = $("#"+div_id); msgdiv.empty(); });
  }
  return this;
}; // showMessages

/**
 * @method onModelChange
 * @description Default callback method.
 *              Calls `this.refreshLoop` to refresh the view after model has changed.
 *              Normally, it is not neccessary to call this method directly.
 *              Override in derived classes if necessary.
 * @param {Object} model The model to refresh.
 *                 If not specified, the current model (`this.model`) is used.
 *                 If specified, `this.model` will be set to `model`, before calling `this.refresh`.
 * @return `this`.
 */
$.any.View.prototype.onModelChange = function (model)
{
  if (model) {
    this.model = model;
  }
  this.refreshLoop();
  this.showMessages(model);
  return this;
}; // onModelChange

/**
 * @method refresh
 * @description Displays data in a jQuery element.
 *              "Top-level" refresh: Resets filters etc. before displaying.
 * @param {Object}  parent The element in which to display data. If not given, `this.element` is used.
 *                         Default: null.
 * @param {Object}  data   The data to display. If not given, `this.model.data` is used.
 *                         Default: null.
 * @param {string}  id     The id of the data to display. If given, only the item with the given id and its
 *                         subdata will be refreshed, otherwise the entire data structure will be refreshed.
 *                         Default: null.
 * @param {string}  type   The type of the data to display.
 *                         Default: null.
 * @param {string}  kind   The kind of the data to display.
 *                         Default: null.
 * @param {boolean} edit   If true, the item should be displayed as editable.
 *
 * @return parent
 *
 * @throws {VIEW_AREA_MISSING} If both `parent` and `this.element` are null or undefined.
 */
$.any.View.prototype.refresh = function (parent,data,id,type,kind,edit,pdata,pid)
{
  this.options.filters = this._createFilters(this.model); // Create filters if they dont exist yet
  this.options.data_level = 0;
  this.id_stack = [...this.root_id_stack];

  this.element.empty();

  this.refreshLoop(parent,data,id,type,kind,edit,pdata,pid);

  // Bind key-back on tablets. TODO! Untested
  //document.addEventListener("backbutton", $.proxy(this._processKeyup,this), false);

}; // refresh

//
// Main refresh loop
//
$.any.View.prototype.refreshLoop = function (parent,data,id,type,kind,edit,pdata,pid)
{
  if (!parent)
    parent = this.element;
  if (!parent)
    throw i18n.error.VIEW_AREA_MISSING;

  ++this.options.ref_rec;
  if (this.options.ref_rec > ANY_MAX_REF_REC)
    throw i18n.error.TOO_MUCH_RECURSION;

  if (!data && this.model)
    data = this.model.data;

  this.current_edit = null;

  if (this.preRefresh)
    this.preRefresh(parent,data,id,type,kind,edit);

  if (data) {
    if (kind == "head")
      ++this.options.data_level;

    // Refresh top toolbar
    if (!this.options.isSelectable && kind && this.id_stack && this.id_stack.length==1)
      this.refreshToolbarTop(parent,data,id,type,kind,edit);

    // Refresh header and data for all entries
    let view = this;
    let prev_type = type;
    let prev_kind = kind;
    for (let idc in data) {
      if (data.hasOwnProperty(idc)) {
        if (view && !idc.startsWith("grouping")) {
          //if (view.model.error)
            //console.log("Error: "+view.model.error);
          let curr_type = view._findType(data,prev_type,idc);
          let curr_kind = view._findKind(data,prev_kind,idc);
          if ((prev_type || curr_type != view.model.type) && (prev_type != curr_type /*|| (prev_type == "group" && view.model.type == "group")*/))
            view = view.createView(parent,data,idc,curr_type,curr_kind); // New type to display, create new view
          if (view)
            view.refreshOne(parent,data,idc,curr_type,curr_kind,edit,"",pdata,pid);
          prev_type = curr_type;
          prev_kind = curr_kind;
        }
      }
    }
    if (kind == "head")
      --this.options.data_level;
  } // if data
  else
    parent.empty();

  // Refresh bottom toolbar
  if (this.options.showToolbar) {
    if (!this.options.isSelectable && this.model.type && this.options.data_level==0 && this.id_stack && this.id_stack.length==0 &&
        (this.options.showMessages || this.options.showButtonNew || this.options.showButtonAddLink)) {
      this.refreshToolbarBottom(parent,data,this.model.id,this.model.type,this.model.kind,edit);
    }
  }

  if (this.postRefresh)
    this.postRefresh(parent,data,id,type,kind,edit);

  return parent;
}; // refreshLoop

//
// Display a "close item" button
//
$.any.View.prototype.refreshToolbarTop = function (parent,data,id,type,kind,edit)
{
  if (!parent)
    return null;
  // Create cancel/close button for item view
  if (this.options.item_opening) {
    let cls_opt = {
      type:     type,
      kind:     kind,
      edit:     false,
      top_view: this.options.top_view,
    };
    this.refreshCloseItemButton(parent,cls_opt);
    this.options.item_opening = false;
  }
}; // refreshToolbarTop

//
// Display a toolbar for messages and a "new item" button
//
$.any.View.prototype.refreshToolbarBottom = function (parent,data,id,type,kind,edit)
{
  if (!parent || !type)
    return null;
  if (!this.options.showMessages && !this.options.showButtonNew && !this.options.showButtonAddLink)
    return null;

  // Create container
  let con_id_str = this.id_stack.join("_");
  let div_id     = this.base_id+"_"+type+"_"+con_id_str+"_toolbar";
  let class_id   = "any-toolbar-bottom any-toolbar any-toolbar-"+this.options.data_level;
  if ($("#"+div_id).length)
    $("#"+div_id).remove();
  let bardiv   = $("<div id='"+div_id+"' class='"+class_id+"'></div>");
  parent.append(bardiv);

  if (this.options.showMessages) {
    // Create a message area
    let opt = { type: type,
                kind: kind,
              };
    this.refreshMessageArea(bardiv,opt);
    this.showMessages();
  }
  if (this.options.showButtonNew) {
    // Create a "new item" button
    let opt = { data:   data,
                id:     id, // Find a new id
                type:   type,
                kind:   "item",
                id_str: con_id_str,
                edit:   true,
                is_new: true,
              };
    this.refreshNewItemButton(bardiv,opt);
  }
  if (this.options.showButtonAddLink && this.model.id) {
    // Create an "add link" button
    let opt = {
      data:   data,
      id:     id,
      type:   type,
      kind:   "item",
      id_str: id,
      edit:   true,
    };
    this.refreshAddLinkButton(bardiv,opt);
  }
  return bardiv;
}; // refreshToolbarBottom

//
// A message area
//
$.any.View.prototype.refreshMessageArea = function (parent,opt)
{
  let div_id   = this.base_id+"_any_message";
  let class_id = "any-message any-"+opt.kind+"-message any-message-"+this.options.data_level;
  let msgdiv = $("#"+div_id);
  if (msgdiv.length)
    msgdiv.empty();
  else
    msgdiv = $("<div id='"+div_id+"' class='"+class_id+"'></div>");
  parent.append(msgdiv);
  return msgdiv;
}; // refreshMessageArea

//
// Refresh header and data for one list entry or one item
//
$.any.View.prototype.refreshOne = function (parent,data,id,last_type,last_kind,edit,id_str,pdata,pid)
{
  if (!data || (!id && id !== 0) || (typeof id == "string" && id.startsWith("grouping")))
    return null;

  let type = last_type ? last_type : this._findType(data,last_type,id);
  let kind = last_kind ? last_kind : this._findKind(data,last_kind,id);

  // Create the string used to uniquely identify current data element
  let the_id = Number.isInteger(parseInt(id)) ? parseInt(id) : id;
  if (kind != "list" && kind != "select")
    this.id_stack.push(the_id);
  id_str = id_str ? id_str : this.id_stack.join("_");
  if (kind == "list" || kind == "select")
    id_str += id_str ? "_"+the_id : the_id;

  // Create or get main container for header and data containers
  let con_div = this.getOrCreateMainContainer(parent,type,kind,id_str);
  if (kind == "head" || (data && data.grouping)) {
    // Refresh header
    this.refreshHeader(con_div,data,id,type,kind,edit,id_str);
  }
  // Refresh data
  let data_div = con_div;
  data_div = this.refreshData(con_div,data,id,type,kind,edit,id_str,pdata,pid);

  // If we have subdata, make a recursive call
  if (data && data[id] && data[id].data) {
    if ((kind == "list" || kind == "select"))
      ++this.options.indent_level;
    let p_data = data;
    let p_id   = id;
    data = data[id].data;
    this.refreshLoop(data_div,data,null,type,kind,edit,p_data,p_id);
    if ((kind == "list" || kind == "select"))
      --this.options.indent_level;
  }
  // Clean up
  if (con_div && !con_div.children().length) {
    con_div.remove();
    con_div = null;
  }
  if (kind != "list" && kind != "select")
    this.id_stack.pop();

  return parent;
}; // refreshOne

//
// Get the current main div, or create a new one if it does not exist
//
$.any.View.prototype.getOrCreateMainContainer = function (parent,type,kind,id_str)
{
  let con_id_str = (kind == "list" || kind == "select" ? this.id_stack.join("_") : id_str);
  let div_id = this.base_id+"_"+type+"_"+kind+"_"+con_id_str+"_container";
  let con_div = $("#"+div_id);
  if (!con_div.length && parent) {
    // Create new main container
    let class_id = "any-container any-"+kind+"-container any-"+kind+"-container-"+this.options.data_level;
    con_div = $("<div id='"+div_id+"' class='"+class_id+"'></div>");
    parent.append(con_div);
    if (!this.main_div)
      this.main_div = parent;
  }
  return con_div;
}; // getOrCreateMainContainer

//
// Refresh the header for an object.
//
$.any.View.prototype.refreshHeader = function (parent,data,id,type,kind,edit,id_str,doNotEmpty)
{
  if (!data || !this.options.showHeader)
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
  // Create or get container for header
  let have_data = Object.size(data) > 0;
  let header_div = this.getOrCreateHeaderContainer(parent,type,kind,id_str,have_data,doNotEmpty);
  // Create the header "cells"
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
// Get the current header div, or create a new one if it does not exist
//
$.any.View.prototype.getOrCreateHeaderContainer = function (parent,type,kind,id_str,haveData,doNotEmpty)
{
  let div_id = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_header";
  let header_div = $("#"+div_id);
  if (header_div.length) {
    if (!doNotEmpty)
      this._emptyDataDiv(header_div);
  }
  else
  if (haveData) {
    // Create new header container if we have data
    let class_id = "any-header any-"+kind+"-header any-header-"+this.options.data_level;
    let pl       = this.options.indent_tables ? this.options.indent_level * this.options.indent_amount : 0;
    let pl_str   = pl > 0 ? "style='margin-left:"+pl+"px;'" : "";
    header_div   = $("<div id='"+div_id+"' class='"+class_id+"' "+pl_str+"></div>");
    parent.append(header_div);
  }
  return header_div;
}; // getOrCreateHeaderContainer

$.any.View.prototype._emptyHeaderDiv = function (div)
{
  return div && div.length ? div.empty() : null;
}; // _emptyHeaderDiv

//
// Refresh a single header entry
//
$.any.View.prototype.refreshHeaderEntry = function (header_div,data,id,filter_id,n)
{
  let d = data && data[id] ? data[id] : data && data["+"+id] ? data["+"+id] : null; // TODO! Do this other places in the code too
  if (!header_div || !d)
    return null;
  let stylestr = (n==0) ? "style='display:inline-block;'" : "";
  let div = $("<div "+stylestr+" class='"+filter_id+"'>"+d[filter_id]+"</div>");
  header_div.append(div);
  return div;
}; // refreshHeaderEntry

//
// Refresh the data for an object.
//
$.any.View.prototype.refreshData = function (parent,data,id,type,kind,edit,id_str,pdata,pid)
{
  // Create or get container for data
  let have_data = Object.size(data) > 0;
  let data_div = this.getOrCreateDataContainer(parent,type,kind,id_str,have_data);
  if (kind == "list" || kind == "select" || kind == "item") {
    let tab_id_str = id_str;
    if (kind == "list" || kind == "select") {
      var n = id_str ? id_str.lastIndexOf("_") : -1;
      if (n < 0)
        tab_id_str = "";
      else
        tab_id_str = id_str.substring(0,n);
    }
    let table = this.getOrCreateTable(data_div,type,kind,tab_id_str);
    if (table) {
      let thead = table.find("thead").length ? table.find("thead") : null;
      if (!thead) {
        thead = this.getOrCreateThead(table,type,kind,tab_id_str);
        if (thead)
          this.refreshThead(thead,data,id,type,kind,edit,tab_id_str);
      }
      let tbody = this.getOrCreateTbody(table,type,kind,tab_id_str);
      if (tbody)
        this.refreshTbody(tbody,data,id,type,kind,edit,id_str,pdata,pid);
    }
  }
  return data_div;
}; // refreshData

//
// Get the current data div, or create a new one if it does not exist
//
$.any.View.prototype.getOrCreateDataContainer = function (parent,type,kind,id_str,haveData)
{
  let div_id = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_data";
  let data_div = $("#"+div_id);
  if (kind != "list" && kind != "select") {
    if (data_div.length)
      this._emptyDataDiv(data_div);
    else
    if (haveData) {
      // Create new data container if we have data
      let class_id = "any-data any-"+kind+"-data any-data-"+this.options.data_level;
      let pl       = this.options.indent_tables ? this.options.indent_level * this.options.indent_amount : 0;
      let pl_str   = pl > 0 ? "style='margin-left:"+pl+"px;'" : "";
      data_div     = $("<div id='"+div_id+"' class='"+class_id+"' "+pl_str+"></div>");
      parent.append(data_div);
    }
  }
  else
    data_div = parent;
  return data_div;
}; // getOrCreateDataContainer

$.any.View.prototype._emptyDataDiv = function (div)
{
  return div && div.length ? div.empty() : null;
}; // _emptyDataDiv

//
// Create a table, or find a table created previously
//
$.any.View.prototype.getOrCreateTable = function (parent,type,kind,id_str)
{
  if (!parent)
    return null;
  let div_id = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_table";
  let table  = $("#"+div_id); // Can we reuse list table?
  if (!table.length) {
    // Create the table
    let class_id = "any-table any-"+kind+"-table any-table-"+this.options.data_level;
    table = $("<table id='"+div_id+"' class='"+class_id+"'></table>");
    parent.append(table);
  }
  return table;
}; // getOrCreateTable

//
// Create a tbody, or find a tbody created previously
//
$.any.View.prototype.getOrCreateTbody = function (table,type,kind,id_str)
{
  if (!table)
    return null;
  let div_id = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_tbody";
  let tbody  = $("#"+div_id); // Can we reuse list tbody?
  if (!tbody.length) {
    let class_id = "any-"+kind+"-tbody any-tbody-"+this.options.data_level;
    tbody = $("<tbody id='"+div_id+"' class='"+class_id+"'></tbody>");
    table.append(tbody);
  }
  return tbody;
}; // getOrCreateTbody

//
// Create a thead, or find a thead created previously
//
$.any.View.prototype.getOrCreateThead = function (table,type,kind,id_str)
{
  if (!this.options.showTableHeader || !table)
    return null;
  if (!type || !kind || (kind != "list" && kind != "select"))
    return null;
  let div_id = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_thead";
  if ($("#"+div_id).length)
    $("#"+div_id).remove();
  let thead = $("<thead id='"+div_id+"'></thead>");
  table.prepend(thead);
  return thead;
}; // getOrCreateThead

//
// Refresh a table header
//
$.any.View.prototype.refreshThead = function (thead,data,id,type,kind,edit,id_str)
{
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
  if (this.options.showButtonAdd && !this.options.isSelectable && (this.model.data && !this.model.data.groupingForId))
    add_opt = { data:       data,
                id:         "new", // Find a new id
                type:       type,
                kind:       kind,
                pid:        id,
                id_str:     id_str,
                filter:     filter,
                isEditable: true,
                is_new:     true,
                edit:       true,
              };
  let tr = $("<tr></tr>");
  thead.append(tr);
  // First tool cell for editable list
  if ((this.options.isSelectable && (kind == "list" || kind == "select")) ||
      (this.options.isEditable && (this.options.showButtonAdd || this.options.showButtonEdit || this.options.showButtonUpdate))) {
    let th = $("<th class='any-th any-list-th any-tools-first-th'></th>");
    if (add_opt && this.options.showButtonAdd == 1)
      this.refreshAddButton(th,add_opt);
    tr.append(th);
  }
  // Table header cells
  for (let filter_id in filter) {
    if (filter.hasOwnProperty(filter_id)) {
      let filter_key = filter[filter_id];
      if (filter_key && filter_key.DISPLAY) {
        let disp_str = filter_key.DISPLAY == 2 || filter_key.DISPLAY == "2" ? "display:none;" : "";
        let name_key = this.model.name_key
                       ? this.model.name_key
                       : type+"_name";
        let pl        = this.options.indent_level * this.options.indent_amount;
        let pl_str    = pl > 0 && filter_id == name_key ? "padding-left:"+pl+"px;" : "";
        let style_str = disp_str || pl_str ? "style='"+disp_str+pl_str+"'" : "";
        let th = $("<th class='any-th any-list-th "+filter_id+"-th' "+style_str+">"+filter_key.HEADER+"</th>");
        tr.append(th);
      }
    }
  }
  // Last tool cell for editable list
  if ((this.options.isSelectable && (kind == "list" || kind == "select")) || this.options.isEditable) {
    let th  = $("<th class='any-th any-list-th any-tools-last-th'></th>");
    if (add_opt && this.options.showButtonAdd == 2)
      this.refreshAddButton(th,add_opt);
    tr.append(th);
  }
  // Clean up
  if (!tr.children().length)
    tr.remove();
  if (!thead.children().length)
    thead.remove();
}; // refreshThead

//
// Refresh a single table row
//
$.any.View.prototype.refreshTbody = function (tbody,data,id,type,kind,edit,id_str,pdata,pid)
{
  if (kind == "list" || kind == "select")
    this.refreshListTableDataRow(tbody,data,id,type,kind,edit,id_str,pdata,pid);
  else
  if (kind == "item")
      this.refreshItemTableDataRow(tbody,data,id,type,kind,edit,id_str,pdata,pid);
}; // refreshTbody

$.any.View.prototype.refreshListTableDataRow = function (tbody,data,id,type,kind,edit,id_str,pdata,pid)
{
  if (!tbody || !data || !data[id])
    return null;

  if (!this.options.filters) {
    this.model.error = type.capitalize()+" "+kind+" "+i18n.error.FILTERS_MISSING;
    console.error(this.model.error);
    return null;
  }
  let filter = this.options.filters[type] && this.options.filters[type][kind] ? this.options.filters[type][kind]: null;
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
  let tr_id  = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_tr";
  let tr = $("#"+tr_id);
  if (tr.length) {
    let td_ids = tr_id+" > td";
    $("#"+td_ids).remove(); // Do not remove the tr tag, only the contents TODO! Should we use detach or empty instead of remove?
  }
  else {
    tr = $("<tr id='"+tr_id+"'></tr>");
    tbody.append(tr);
  }
  if ((this.options.isSelectable && (kind == "list" || kind == "select")) ||
      (this.options.isEditable && (this.options.showButtonEdit || this.options.showButtonUpdate)))
    this.refreshTableDataFirstCell(tr,data,id,type,kind,filter,edit,id_str,true,pdata,pid);

  this.refreshListTableDataCells(tr,data,id,type,kind,filter,edit,id_str,true,pdata,pid);

  if ((this.options.isSelectable && (kind == "list" || kind == "select")) ||
      (this.options.isEditable && (this.options.showButtonRemove || this.options.showButtonDelete || this.options.showButtonCancel)))
    this.refreshTableDataLastCell(tr,data,id,type,kind,filter,edit,id_str,true,pdata,pid);

  // Clean up
  if (!tr.children().length || (!row_has_data && !this.options.showEmptyRows))
    tr.remove();
  return tr;
}; // refreshListTableDataRow

$.any.View.prototype.refreshListTableDataCells = function (tr,data,id,type,kind,filter,edit,id_str,isEditable,pdata,pid)
{
  if (!filter || !tr|| !data || !data[id])
    return false;
  let pl     = this.options.indent_level * this.options.indent_amount;
  let pl_str = pl > 0 ? "padding-left:"+pl+"px;" : "";
  let n = 0;
  for (let filter_id in filter) {
    if (filter.hasOwnProperty(filter_id)) {
      let filter_key = filter[filter_id];
      if (filter_key && filter_key.DISPLAY) {
        let disp_str = filter_key.DISPLAY == 2 || filter_key.DISPLAY == "2" ? "display:none;" : "";
        ++n;
        let td_id    = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_"+filter_id;
        let odd_even = this.options.useOddEven ? n%2 ? "any-even" : "any-odd" : "";
        let class_id = "any-list-"+filter_id;
        let pln_str  = this.model.name_key
                       ? filter_id == this.model.name_key  ? pl_str : ""
                       : filter_id == type+"_name"         ? pl_str : "";
        let style_str = disp_str || pln_str ? "style='"+disp_str+pln_str+"'" : "";
        let td  = $("<td id='"+td_id+"' class='any-td any-list-td "+odd_even+" "+class_id+"' "+style_str+"></td>");
        tr.append(td);
        let str = this.createCellEntry(id,type,kind,id_str,filter_id,filter_key,data[id],edit);
        td.append(str);
        this.initTableDataCell(td_id,data,id,type,kind,id_str,filter,filter_id,filter_key,edit,n,isEditable,pdata,pid);
      }
    }
  }
  return true;
}; // refreshListTableDataCells

$.any.View.prototype.refreshItemTableDataRow = function (tbody,data,id,type,kind,edit,id_str,pdata,pid)
{
  if (!tbody || !data || !data[id])
    return null;

  if (!this.options.filters) {
    this.model.error = type.capitalize()+" "+kind+" "+i18n.error.FILTERS_MISSING;
    console.error(this.model.error);
    return null;
  }
  let filter = this.options.filters[type] && this.options.filters[type][kind] ? this.options.filters[type][kind]: null;
  if (!filter) {
    this.model.message = i18n.error.FILTER_NOT_FOUND.replace("%%", type+" "+kind+"");
    console.warn(this.model.message);
    return null;
  }
  let d = data[id] ? data[id] : data["+"+id];
  let row_has_data = this._rowHasData(d,filter);
  if (!row_has_data)
    return null; // Nothing to display

  tbody.empty();
  let pl     = this.options.indent_level * this.options.indent_amount;
  let pl_str = pl > 0 ? "style='padding-left:"+pl+"px;'" : "";
  let n = 0;
  let is_hidden = false;
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
                       "<span id='"+this.base_id+"_"+type+"_"+kind+"_"+id_str+"_"+filter_key.HTML_TYPE+"' class='pointer hiddenText'>"+
                       filter_key.HEADER+
                       "</span>"+
                       "</td>");
            tr.append(td);
            tbody.append(tr);
            let params   = { panel_id:   this.base_id+"_"+type+"_"+kind+"_"+id_str+"_"+filter_key.HTML_TYPE,
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
        if ((this.options.isSelectable && (kind == "list" || kind == "select")) ||
            (this.options.isEditable && (this.options.showButtonEdit || this.options.showButtonUpdate))) {
          if (n == 1)
            this.refreshTableDataFirstCell(tr,data,id,type,kind,filter,edit,id_str,true,pdata,pid);
          else
            tr.append("<td/>");
        }
        this.refreshItemTableDataCells(tr,data,id,type,kind,filter,filter_id,filter_key,id_str,pl_str,n,edit,true,pdata,pid);
        if ((this.options.isSelectable && (kind == "list" || kind == "select")) ||
            (this.options.isEditable && (this.options.showButtonRemove || this.options.showButtonDelete || this.options.showButtonCancel))) {
          if (n == 1)
            this.refreshTableDataLastCell(tr,data,id,type,kind,filter,edit,id_str,true,pdata,pid);
          else
            tr.append("<td/>");
        }
        if (!tr.children().length)
          tr.remove();
      }
    }
  } // for
  return tbody;
}; // refreshItemTableDataRow

$.any.View.prototype.refreshItemTableDataCells = function (tr,data,id,type,kind,filter,filter_id,filter_key,id_str,pl_str,n,edit,isEditable,pdata,pid)
{
  let class_id_name = "any-item-name-"+filter_id;
  let class_id_val  = "any-item-val-"+filter_id;
  let td_id         = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_"+filter_id;
  let td2           = $("<td "+             "class='any-td any-item-name "+class_id_name+"' "+pl_str+">"+filter_key.HEADER+"</td>");
  let td3           = $("<td id= '"+td_id+"' class='any-td any-item-val  "+class_id_val +"'></td>");
  tr.append(td2);
  tr.append(td3);
  let str = this.createCellEntry(id,type,kind,id_str,filter_id,filter_key,data[id],edit);
  td3.append(str);
  this.initTableDataCell(td_id,data,id,type,kind,id_str,filter,filter_id,filter_key,edit,n,isEditable,pdata,pid);
}; // refreshItemTableDataCells

$.any.View.prototype.refreshTableDataFirstCell = function (tr,data,id,type,kind,filter,edit,id_str,isEditable,pdata,pid)
{
  let td_id  = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_edit"; // First tool cell
  if ($("#"+td_id).length)
    $("#"+td_id).remove();
  let td = $("<td id='"+td_id+"' class='any-td any-td-first'></td>");
  tr.append(td);
  if (this.options.isSelectable && (kind == "list" || kind == "select")) {
    let checked = this.model.select.has(parseInt(id));
    let sel_opt = { data:       data,
                    id:         id,
                    type:       type,
                    kind:       kind,
                    id_str:     id_str,
                    filter:     filter,
                    isEditable: isEditable,
                    checked:    checked,
                    pdata:      pdata,
                    pid:        pid,
                  };
    this.refreshSelectButton(td,sel_opt);
  }
  else
  if (this.options.isEditable || edit || isEditable) {
    if (this.options.showButtonEdit) {
      let edt_opt = { data:       data,
                      id:         id,
                      type:       type,
                      kind:       kind,
                      id_str:     id_str,
                      filter:     filter,
                      isEditable: isEditable,
                      edit:       edit,
                      pdata:      pdata,
                      pid:        pid,
                    };
      this.refreshEditButton(td,edt_opt);
    }
    if (this.options.showButtonUpdate) {
      let upd_opt = { indata:     data,
                      id:         id,
                      type:       type,
                      kind:       kind,
                      filter:     filter,
                      id_str:     id_str,
                      is_new:     data && data[id] ? data[id].is_new : false,
                      isEditable: isEditable,
                      edit:       edit,
                      pdata:      pdata,
                      pid:        pid,
                    };
      this.refreshUpdateButton(td,upd_opt);
    }
  }
}; // refreshTableDataFirstCell

$.any.View.prototype.refreshTableDataLastCell = function (tr,data,id,type,kind,filter,edit,id_str,isEditable,pdata,pid)
{
  let td_id  = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_unedit"; // Last tool cell
  if ($("#"+td_id).length)
    $("#"+td_id).remove();
  let td = $("<td id='"+td_id+"' class='any-td any-td-last'></td>");
  tr.append(td);
  if (this.options.isSelectable && (kind == "list" || kind == "select")) {
  }
  else
  if (this.options.isEditable || edit || isEditable) {
    let last_opt = { data:       data,
                     id:         id,
                     type:       type,
                     kind:       kind,
                     id_str:     id_str,
                     filter:     filter,
                     isEditable: true,
                     edit:       edit,
                     pdata:      pdata,
                     pid:        pid,
                   };
    last_opt.isEditable = isEditable;
    if (this.options.showButtonRemove && this.options.isRemovable && id && kind == "list")
      this.refreshRemoveButton(td,last_opt);
    if (this.options.showButtonDelete && this.options.isDeletable && id)
      this.refreshDeleteButton(td,last_opt);
    if (this.options.showButtonCancel && isEditable && edit)
      this.refreshCancelButton(td,last_opt);
  }
}; // refreshTableDataLastCell

$.any.View.prototype._rowHasData = function (data,filter)
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

///////////////////////////////////////////////////////////////////////////////

$.any.View.prototype.initTableDataCell = function (td_id,data,id,type,kind,id_str,filter,filter_id,filter_key,edit,n,isEditable,pdata,pid)
{
  if (!filter_key || !td_id)
    return;

  let init_opt = {
        data:       data,
        id:         id,
        type:       type,
        kind:       kind,
        id_str:     id_str,
        filter:     filter,
        filter_id:  filter_id,
        isEditable: isEditable,
        edit:       edit,
        pdata:      pdata,
        pid:        pid,
        plugins:    this.model.plugins,
  };
  // Bind a method that is called while clicking on the text link (in non-edit mode)
  if (filter_key.HTML_TYPE == "link" && !edit) {
    let link_elem = $("#"+td_id);
    if (link_elem.length) {
      if (this.options.isSelectable) {
        let fun = this.options.localSelect
                  ? this.options.localSelect
                  : this._toggleChecked;
        link_elem.off("click").on("click",init_opt ,$.proxy(fun,this));
      }
      else {
        let fun = this.options.itemLinkClicked
                  ? this.options.itemLinkClicked
                  : this.itemLinkClicked;
        link_elem.off("click").on("click", init_opt, $.proxy(fun,this));
      }
    }
  }
  // Find the element to work with
  let inp_edit = td_id+" .itemEdit";
  let inp_elem = $("#"+inp_edit);
  if (!inp_elem.length) {
    inp_edit = td_id+" .itemUnedit";
    inp_elem = $("#"+inp_edit);
    if (!inp_elem.length)
      return;
  }
  // Set numerical filter for number fields
  if (filter_key.HTML_TYPE == "number") {
    inp_elem.inputFilter(function(value) { return /^\d*\.?\d*$/.test(value); }); // Allow digits and '.' only
  }
  // Bind a function to be called when clicking/pressings the element
  if (filter_key.OBJ_FUNCTION) {
    let func_name = filter_key.OBJ_FUNCTION;
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
      console.warn("Couldnt bind "+func_name+" on "+filter_key.HTML_TYPE+" element. ");
  }
  // Bind some keyboard events in edit mode
  if (edit && ["link","text","number","password","date"].indexOf(filter_key.HTML_TYPE) > -1) {
    // Bind enter key
    inp_elem.off("keyup").on("keyup",     init_opt, $.proxy(this._processKeyup,this));
    inp_elem.off("keydown").on("keydown", init_opt, $.proxy(this._processKeyup,this)); // For catching the ESC key on Vivaldi
  }
  // Set focus to first editable text field
  if (this.options.isEditable && edit && n==1) {
    inp_elem.trigger("focus");
    // Make sure cursor is at the end of the text field
    let tmp = inp_elem.val();
    inp_elem.val("");
    inp_elem.val(tmp);
  }
}; // initTableDataCell

///////////////////////////////////////////////////////////////////////////////

//
// Create a new model in a new view and return the view
//
$.any.View.prototype.createView = function (parent,data,id,type,kind)
{
  if (!parent)
    parent = this.element;
  if (!parent)
    return null;
  if (!data)
    return null;
  type = type ? type : this._findType(data,null,id);
  kind = kind ? kind : this._findKind(data,null,id);
  if (!type || !kind)
    return null;

  // Create a new model
  let model_opt = {
    data:       data,
    id:         id,
    type:       type,
    kind:       kind,
    mode:       this.model.mode,
    fields:     this.model.fields,
    permission: this.model.permission,
    plugins:    this.model.plugins,
    select:     this.model.select,
    unselect:   this.model.unselect,
  };
  let m_str = type+"Model";
  if (!window[m_str]) {
    let def_str = "anyModel";
    console.warn("Model class "+m_str+" not found, using "+def_str+". ");
    m_str = def_str;
  }
  let model = new window[m_str](model_opt);

  // Create the view
  let id_str   = this.id_stack.join("_");
  let view_id  = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_container";
  let view_opt = {
    model:            model,
    filters:          this._createFilters(model), // Create filter if we don't already have one
    id:               view_id,
    main_div:         parent,
    base_id:          this.base_id,
    item_opening:     this.options.item_opening,
    top_view:         this.options.top_view,
    view:             this,
    data_level:       this.options.data_level,
    showHeader:       this.options.showHeader,
    showTableHeader:  this.options.showTableHeader,
    // Give same permissions to new view as the current one.
    // TODO! May NOT always be the desired behaviour!
    isEditable:       this.options.isEditable,
    isRemovable:      this.options.isRemovable || kind == "item", // TODO! Not a good solution
    isDeletable:      this.options.isDeletable,
    isSelectable:     this.options.isSelectable, // TODO!
    itemLinkClicked:  this.options.itemLinkClicked,
    preselected:      this.options.isSelectable ? this.options.preselected : null,
  };
  let v_str = view_opt.grouping ? type+"View"+view_opt.grouping.capitalize() : type+"View";
  if (!window[v_str])
    v_str = type+"ViewTabs";
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
    else {
      view.id_stack = [...this.id_stack];
    }
  }
  catch (err) {
    console.error("Couldn't create view "+v_str+": "+err);
  }
  return view;
}; // createView

///////////////////////////////////////////////////////////////////////////////

//
// Methods that create cell items
//

$.any.View.prototype.createCellEntry = function (id,type,kind,id_str,filter_id,filter_key,data_item,edit)
{
  if (!filter_id || !filter_key)
    return "";
  let val = data_item[filter_id];
  let pid = data_item["parent_id"];
  if (typeof val != "object")
    val = $("<textarea />").html(val).text(); // Convert html entities to real html
  if (filter_key.EDITABLE===0 || filter_key.EDITABLE===false)
    edit = false;
  switch (filter_key.HTML_TYPE) {
    case "label":    return this.getLabelStr   (type,kind,id,val); // Always noneditable
    case "html":     return this.getHtmlStr    (type,kind,id,val,edit);
    case "textarea": return this.getTextAreaStr(type,kind,id,val,edit,filter_id,id_str);
    case "text":     return this.getTextStr    (type,kind,id,val,edit);
    case "password": return this.getPasswordStr(type,kind,id,val,edit);
    case "link":     return this.getLinkStr    (type,kind,id,val,edit);
    case "mailto":
    case "email":    return this.getEmailStr   (type,kind,id,val,edit);
    case "number":   return this.getNumberStr  (type,kind,id,val,edit);
    case "date":     return this.getDateStr    (type,kind,id,val,edit);
    case "image":    return this.getImageStr   (type,kind,id,val,edit,filter_key,id_str);
    case "radio":    return this.getRadioStr   (type,kind,id,val,edit,filter_key,filter_id);
    case "check":    return this.getCheckStr   (type,kind,id,val,edit,filter_key,filter_id);
    case "select":   return this.getSelectStr  (type,kind,id,val,edit,filter_key,pid,data_item["parent_name"]);
    case "function": return this.getFunctionStr(type,kind,id,val,edit,filter_key,pid,data_item["parent_name"]);
    case "list":     return this.getListView   (type,kind,id,val,edit,filter_key,id_str);
    /* Not used yet
    case "file":     return this.getFileStr    (type,kind,id,val,edit);
    case "http":
    case "https":    return this.getHttpStr    (type,kind,id,val,edit);
    case "textspan": return this.getTextspanStr(type,kind,id,val,edit);
    case "tokenlist":return this.getTokenlist  (type,kind,id,val,edit);
    */
  }
  if (!val)
    val = "";
  return val;
}; // createCellEntry

$.any.View.prototype.getHtmlStr = function (type,kind,id,val,edit)
{
  return val;
}; // getHtmlStr

$.any.View.prototype.getLabelStr = function (type,kind,id,val)
{
  //val = (val.replace(/<(?:.|\n)*?>/gm,''));
  let val_cleaned = typeof val == "string" ? val.substring(0,this.options.cutoff) : ""+val;
  val_cleaned += (val.length > this.options.cutoff) ? " [...]" : "";
  val = val_cleaned;
  //if (!val || val == "")
  //  val = "&nbsp;";
  return "<div class='itemUnedit itemLabel'>"+val+"</div>";
}; // getLabelStr

$.any.View.prototype.getTextAreaStr = function (type,kind,id,val,edit,filter_id,id_str)
{
  if (edit) {
    let nameid = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_"+filter_id;
    if (typeof tinyMCE !== "undefined" && tinyMCE.EditorManager.get(nameid) !== null &&
        id != "0" && id !== 0) { // TODO! id !== 0 is not the correct test, temporary solution
      tinymce.EditorManager.execCommand('mceRemoveEditor',true, nameid);
    }
    return "<textarea class='itemEdit tinymce'>"+val+"</textarea>";
  }
  else
    return this.getLabelStr(type,kind,id,val);
}; // getTextAreaStr

$.any.View.prototype.getTextStr = function (type,kind,id,val,edit)
{
  if (edit)
    return "<input class='itemEdit itemText' type='text' value='"+val+"'/>";
  else
    return this.getLabelStr(type,kind,id,val);
}; // getTextStr

$.any.View.prototype.getPasswordStr = function (type,kind,id,val,edit)
{
  if (edit)
    return "<input class='itemEdit itemText password' type='password' value='"+val+"'/>";
  else
    return this.getLabelStr(type,kind,id,"");
}; // getLabelStr

$.any.View.prototype.getLinkStr = function (type,kind,id,val,edit)
{
  if (edit)
    return this.getTextStr(type,kind,id,val,edit);
  else
    return "<div class='itemUnedit itemText pointer underline' attr='link'>"+val+"</div>";
}; // getLinkStr

$.any.View.prototype.getEmailStr = function (type,kind,id,val,edit)
{
  if (edit)
    return this.getTextStr(type,kind,id,val,edit);
  else
    return "<div class='itemUnedit itemText pointer underline'><a href='mailto:"+val+"'>"+val+"</a></div>";
}; // getEmailStr

// In edit mode, the input field is modified with a filter
// in append methods to allow only numerals and '.'
$.any.View.prototype.getNumberStr = function (type,kind,id,val,edit)
{
  if (edit)
    return "<input class='itemEdit itemNumber' type='text' value='"+val+"'/>";
  else {
    let val_cleaned = typeof val == "string" ? val.substring(0,this.options.cutoff) : ""+val;
    val_cleaned += (val.length > this.options.cutoff) ? " [...]" : "";
    val = val_cleaned;
    return "<div class='itemUnedit itemNumber'>"+val+"</div>";
  }
}; // getNumberStr

// In edit mode, a date selector will be shown.
$.any.View.prototype.getDateStr = function (type,kind,id,val,edit)
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
$.any.View.prototype.getFunctionStr = function (type,kind,id,val,edit,filter_key,pid,pname)
{
  let func_name = filter_key.OBJ_FUNCTION;
  if (isFunction(this[func_name])) // Method in view class
    return this[func_name](type,kind,id,val,edit,pid);
  if (isFunction(window[func_name])) // Normal function
    return window[func_name](type,kind,id,val,edit,pid);
  return ""; // Function not found
}; // getFunctionStr

$.any.View.prototype.getImageStr = function (type,kind,id,val,edit,filter_key,id_str)
{
  let image_src = filter_key.OBJ_IMAGE;
  if (!image_src && filter_key.OBJ_FUNCTION && typeof window[filter_key.OBJ_FUNCTION] == "function")
    return this.getFunctionStr(type,kind,id,val,edit,filter_key);
  return "<div class='itemUnedit'>"+
         "<img class='imageRef pointer' src='"+image_src+"' title='"+val+"'style='box-shadow:none;'>"+
         "</div>";
}; // getImageStr

$.any.View.prototype.getSelectStr = function (type,kind,id,val,edit,filter_key,pid,pname)
{
  let str = "";
  let fval = filter_key.OBJ_SELECT;
  if (fval) {
    if (isFunction(this[fval]))
      val = this[fval](type,kind,id,val,edit,pid);
    else
    if (typeof fval != "object")
      fval = "";
  }
  if (edit) {
    str =  "<select class='itemEdit itemSelect'>";
    //str += "<option class='itemOption' id='select' name='select' value=''></option>";
    if (fval && typeof fval == "object") {
      let o_str = "";
      for (let fid in fval) {
        if (fval.hasOwnProperty(fid)) {
          let sel = (fid == val) ? "selected" : "";
          o_str += "<option class='itemOption' id='"+parseInt(fid)+"' name='"+fid+"' "+"value='"+fid+"' "+sel+">"+fval[fid]+"</option>";
        }
      }
      str += o_str;
    }
    else {
      str += "<i>"+fval+"</i>";
    }
    str += "</select>";
  }
  else {
    str = fval && val != "" && fval[val] ? fval[val] : val ? val : ""; //pname;
    if (!str)
      str = "";
    str = "<div class='itemUnedit itemSelect'>"+str+"</div>";
  }
  return str;
}; // getSelectStr

$.any.View.prototype.getRadioStr = function (type,kind,id,val,edit,filter_key,filter_id)
{
  let str = "";
  let fval = filter_key.OBJ_RADIO;
  if (fval) {
    if (typeof this[fval] == "function")
      fval = this[fval](type,kind,id,val,edit);
    else
    if (typeof fval != "object")
      fval = "";
  }
  if (edit) {
    if (fval && typeof fval == "object") {
      for (let fid in fval) {
        if (fval.hasOwnProperty(fid)) {
          let chk = (fid == parseInt(val)) ? "checked" : "";
          str += "<input class='itemEdit itemRadio' type='radio' id='"+fid+"' name='"+filter_id+"' value='"+fval[fid]+"' "+chk+"/>";
          str += "<label for='"+fid+"'>&nbsp;"+fval[fid]+"</label>&nbsp;";
        }
      }
    }
  }
  else {
    if (fval && fval[parseInt(val)])
      str = fval[parseInt(val)];
  }
  return str;
}; // getRadioStr

$.any.View.prototype.getCheckStr = function (type,kind,id,val,edit,filter_key,filter_id)
{
  let str = "";
  if (edit) {
    let checked = val == "1" ? "checked" : "";
    str = "<input class='itemEdit' type='checkbox' onclick='$(this).val(this.checked?1:0)' value='"+val+"' "+checked+"/>";
  }
  else { // noneditable
    let the_id  = Number.isInteger(parseInt(id)) ? parseInt(id) : id;
    let id_str  = ""+the_id;
    let it_id = this.base_id+"_"+filter_key+"_"+id_str;
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
$.any.View.prototype.getListView = function (type,kind,id,val,edit,filter_key,id_str)
{
  if (!this.model)
    throw i18n.error.MODEL_MISSING;

  // TODO! Should we return null here if val is empty?

  // Create the list model
  let list_type = filter_key.OBJ_LIST;
  let model_opt = this.getListModelOptions(type,list_type,val);
  let m_str     = list_type.capitalize()+"Model";
  if (!window[m_str]) {
    let def_str = "anyModel";
    console.warn(m_str+" is not a valid list model, using "+def_str+". ");
    m_str = def_str;
  }
  let list_model = new window[m_str](model_opt);

  // Create the list view
  let list_view_id = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_"+list_type+"_list";
  let view_opt     = this.getListViewOptions(list_model,list_view_id,this);
  let v_str = view_opt.grouping ? list_type.capitalize()+"View"+view_opt.grouping.capitalize() : list_type.capitalize()+"View";
  if (!window[v_str]) {
    let def_str = view_opt.grouping ? "anyView"+view_opt.grouping.capitalize() : "anyView";
    console.warn(v_str+" is not a valid view, using "+def_str+". ");
    v_str = def_str;
  }
  view_opt.filter_key = filter_key;
  let view = null;
  try {
    view = new window[v_str](view_opt);
    if (!Object.keys(view).length) {
      console.error("Couldn't create view "+v_str+" with id "+list_view_id);
      view = null;
    }
    if (view && view.refresh)
      view.refreshLoop();
  }
  catch (err) {
    console.error("Couldn't create view "+v_str+": "+err);
  }
  return view;
}; // getListView

// May be overidden by derived classes
$.any.View.prototype.getListModelOptions = function (type,list_type,data)
{
  return {
    type:       list_type,
    link_type:  type,
    link_id:    "???", // TODO!
    data:       data,
    search:     false,
    mode:       this.model.mode,
    permission: this.model.permission,
  };
}; // getListModelOptions

// May be overidden by derived classes
$.any.View.prototype.getListViewOptions = function (model,view_id,view)
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
  };
}; // getListViewOptions

///////////////////////////////////////////////////////////////////////////////

//
// Buttons
//

// Button in top toolbar for closing item view
// By default calls closeItem
$.any.View.prototype.refreshCloseItemButton = function (parent,opt)
{
  let tit_str = i18n.button.buttonCancel;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.base_id+"_cancel_new_icon";
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
  btn.off("click").on("click",opt,$.proxy(fun,this));
  if (parent && parent.length)
    parent.prev().prepend(btn);
  return btn;
}; // refreshCloseItemButton

// Add-button in list table header
// By default calls addListEntry
$.any.View.prototype.refreshAddButton = function (parent,opt)
{
  let tit_str = i18n.button.buttonAddToList.replace("%%",opt.type);
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.base_id+"_"+opt.type+"_"+opt.kind+"_"+opt.id_str+"_new_line_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let btn = $("<div id='"+btn_id+"' style='display:inline-block;' class='any-tool-add any-tool-button pointer' title='"+tit_str+"'>"+
              "<i class='fa fa-plus'></i>"+
              btn_str+
              "</div>");
  let fun = this.option("localAddListEntry")
            ? this.option("localAddListEntry")
            : this.addListEntry;
  btn.off("click").on("click", opt, $.proxy(fun,this));
  if (parent && parent.length)
    parent.append(btn);
  return btn;
}; // refreshAddButton

// Select-button in first list table cell
// By default calls _toggleChecked
$.any.View.prototype.refreshSelectButton = function (parent,opt)
{
  let tit_str = i18n.button.buttonSelect;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.base_id+"_"+opt.type+"_"+opt.kind+"_"+opt.id_str+"_select_icon";
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
  btn.off("click").on("click",opt,$.proxy(fun,this));
  return btn;
}; // refreshSelectButton

// Edit-button in first list or item table cell
// By default calls toggleEdit
$.any.View.prototype.refreshEditButton = function (parent,opt)
{
  let tit_str = i18n.button.buttonEdit;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.base_id+"_"+opt.type+"_"+opt.kind+"_"+opt.id_str+"_edit_icon";
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
  opt.edit = !opt.edit;
  let fun = this.option("localEdit")
            ? this.option("localEdit")
            : this.toggleEdit;
  btn.off("click").on("click",opt,$.proxy(fun,this));
  return btn;
}; // refreshEditButton

// Update-button in first list or item table cell
// By default calls dbUpdate
$.any.View.prototype.refreshUpdateButton = function (parent,opt)
{
  let tit_str = i18n.button.buttonUpdate;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.base_id+"_"+opt.type+"_"+opt.kind+"_"+opt.id_str+"_update_icon";
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
  opt.edit = !opt.edit;
  let fun = this.option("localUpdate")
            ? this.option("localUpdate")
            : this.dbUpdate;
  btn.off("click").on("click",opt,$.proxy(fun,this));
  return btn;
}; // refreshUpdateButton

// Remove-button in last list or item table cell
// By default calls dbRemoveDialog
$.any.View.prototype.refreshRemoveButton = function (parent,opt)
{
  let tit_str = i18n.button.buttonRemove;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.base_id+"_"+opt.type+"_"+opt.kind+"_"+opt.id_str+"_remove_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let btn = $("<div id='"+btn_id+"' class='any-remove-icon any-tool-button pointer' title='"+tit_str+"'>"+
              "<i class='fas fa-times'></i>"+
              btn_str+
              "</div>");
  let fun = this.option("localRemove")
            ? this.option("localRemove")
            : this.dbRemoveDialog;
  btn.off("click").on("click",opt,$.proxy(fun,this));
  if (parent && parent.length)
    parent.append(btn);
  if (opt.edit)
    btn.hide();
  return btn;
}; // refreshRemoveButton

// Delete-button in last list or item table cell
// By default calls dbDeleteDialog
$.any.View.prototype.refreshDeleteButton = function (parent,opt)
{
  let tit_str = i18n.button.buttonDelete;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.base_id+"_"+opt.type+"_"+opt.kind+"_"+opt.id_str+"_delete_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let btn = $("<div id='"+btn_id+"' class='any-delete-icon any-tool-button pointer' title='"+tit_str+"'>"+
              "<i class='fas fa-trash-alt'></i>"+
              btn_str+
              "</div>");
  let fun = this.option("localDelete")
            ? this.option("localDelete")
            : this.dbDeleteDialog;
  btn.off("click").on("click",opt,$.proxy(fun,this));
  if (parent && parent.length)
    parent.append(btn);
  if (!opt.edit)
    btn.hide();
  return btn;
}; // refreshDeleteButton

// Cancel-button in last list or item table cell
// By default calls toggleEdit
$.any.View.prototype.refreshCancelButton = function (parent,opt)
{
  let tit_str = i18n.button.buttonCancel;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.base_id+"_"+opt.type+"_"+opt.kind+"_"+opt.id_str+"_cancel_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let btn = $("<div id='"+btn_id+"' class='any-cancel-icon any-tool-button pointer' title='"+tit_str+"'>"+
              "<i class='fas fa-ban'></i>"+
              btn_str+
              "</div>");
  let fun = this.option("localCancel")
            ? this.option("localCancel")
            : this.toggleEdit;
  btn.off("click").on("click",opt,$.proxy(fun,this));
  if (parent && parent.length)
    parent.append(btn);
  if (!opt.edit)
    btn.hide();
  opt.edit = false;
  return btn;
}; // refreshCancelButton

// Button in bottom toolbar for opening a new empty item view
// By default calls showItem
$.any.View.prototype.refreshNewItemButton = function (parent,opt)
{
  let tit_str = this.options.newButtonLabel ? this.options.newButtonLabel : i18n.button.buttonNew+" "+opt.type;
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'> "+/*tit_str+*/"</span>" : "";
  let btn_id  = this.base_id+"_"+opt.type+"_"+opt.kind+"_"+opt.id_str+"_new_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let btn = $("<div id='"+btn_id+"' class='any-new-icon any-icon pointer' title='"+tit_str+"'>"+
              "<i class='fas fa-plus-circle fa-lg'></i>"+
              btn_str+
              "</div>");
  let fun = this.option("localNewItem")
            ? this.option("localNewItem")
            : this.showItem;
  btn.off("click").on("click",opt,$.proxy(fun,this));
  if (parent && parent.length)
    parent.append(btn);
  return btn;
}; // refreshNewItemButton

// Button in bottom toolbar for displaying a menu for adding links
// By default calls showLinkMenu
$.any.View.prototype.refreshAddLinkButton = function (parent,opt)
{
  if (!this.model.plugins || !this.options.linkIcons)
    return;

  let tit_str = i18n.button.buttonAddLink+"...";
  let btn_str = this.options.showButtonLabels ? "<span class='any-button-text'>"+tit_str+"</span>" : "";
  let btn_id  = this.base_id+"_"+opt.type+"_add_icon";
  if ($("#"+btn_id).length)
    $("#"+btn_id).remove();
  let btn     = $("<div id='"+btn_id+"' class='any-tool-addremove any-tool-button pointer' title='"+tit_str+"'>"+
                  "<i class='fa fa-plus'></i>&nbsp;"+i18n.message.addRemove+
                  btn_str+
                  "</div>");
  let fun = this.option("localShowLinkMenu")
            ? this.option("localShowLinkMenu")
            : this.showLinkMenu;
  btn.off("click").on("click", opt, $.proxy(fun,this));
  if (parent && parent.length)
    parent.append(btn);
  if (!opt.edit)
    btn.hide();

  let menu_id = this.base_id+"_"+opt.type+"_"+opt.kind+"_"+opt.id_str+"_link_dropdown";
  opt.element_id = menu_id;
  if ($("#"+menu_id).length)
    $("#"+menu_id).remove();
  let dd_menu = $("<div "+
                  "class='w3-dropdown-content w3-bar-block w3-border any-link-menu' "+
                  "id='"+menu_id+"'>"+
                  "</div>");
  btn.append(dd_menu);
  dd_menu.hide();

  // Clicking off the menu will hide it
  let opt2 = {...opt};
  opt2.edit = false;
  $(document).off("click").on("click", opt2, fun);

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
$.any.View.prototype.refreshLinkButton = function (options,onClickMethod)
{
  if (!this.model)
    throw i18n.error.MODEL_MISSING;
  let sub     = options.type == options.link_type ? "sub"+options.type : options.link_type;
  let tit_str = sub; //i18n.button.buttonAdd+" "+sub;
  let btn_str = tit_str; //this.option("showButtonLabels") ? tit_str : "";
  let btn_id  = this.base_id+"_"+options.type+"_"+options.link_type+"_link_icon";
  let btn = $("<div id='"+btn_id+"' style='display:inline-block;' class='any-tool-button pointer' title='"+tit_str+"'>"+
              "<div style='display:inline-block;width:20px;'><i class='"+options.link_icon+"'></i></div>..."+
              btn_str+
              "</div><br/>");
  let fun = onClickMethod
            ? onClickMethod
            : this.dbSearchLinks;
  btn.unbind("click");
  btn.bind("click", options, $.proxy(fun,this));
  return btn;
}; // refreshLinkButton

// Display or hide the link menu
$.any.View.prototype.showLinkMenu = function (event)
{
  let dd_menu = $("#"+event.data.element_id);
  let elem = document.getElementById(event.data.element_id);
  if (elem) {
    if (elem.className.indexOf("w3-show") == -1 && event.data.edit !== false) { // TODO! w3-show should not be hardcoded
      elem.className += " w3-show";
      dd_menu.show();
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

// Process Esc and Enter keys.
$.any.View.prototype._processKeyup = function (event)
{
  if ((event.type == "keyup"   && event.which != 13) ||
      (event.type == "keydown" && event.which != 27)) // For catching the ESC key on Vivaldi
    return true; // Only process ESC and Enter keys

  if (event.preventDefault)
    event.preventDefault();

  if (event.which == 27) { // esc
    event.data.edit = !event.data.edit;
    this.doToggleEdit(event.data);
  }
  else
  if (event.which == 13) { // enter
    if (event.data) {
      let data = event.data.data;
      let id   = event.data.id;
      let upd_opt = { indata:     data,
                      id:         event.data.id,
                      type:       event.data.type,
                      kind:       event.data.kind,
                      filter:     event.data.filter,
                      id_str:     event.data.id_str,
                      is_new:     data && data[id] ? data[id].is_new : false,
                      isEditable: event.data.isEditable,
                      edit:       event.data.edit,
                      pdata:      event.data.pdata,
                      pid:        event.data.pid,
                    };
      let ev = {};
      ev.data = { ...upd_opt };
      if (this.options.onEnterCallDatabase)
        this.dbUpdate(ev);
      let type   = event.data.type;
      let kind   = event.data.kind;
      let id_str = event.data.id_str;
      if (kind == "list" || kind == "select") {
        if (this.options.onEnterInsertNew) {
          ev.data.pid = ev.data.id;
          ev.data.id  = "new"; // TODO! Use ev.data.is_new = true ?
          if (ev.data.id_str) {
            let n = ev.data.id_str.lastIndexOf("_");
            if (n>-1)
              ev.data.id_str = ev.data.id_str.slice(0,n);
            else
              ev.data.id_str = "";
          }
          this.addListEntry(ev);
        }
        else
        if (this.options.onEnterMoveFocus) {
          // TODO! Enter in a list input field should optionally move to next row and start editing it, unless onEnterInsertNew or onEnterCallDatabase are true
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

$.any.View.prototype.addListEntry = function (event)
{
  let id   = event.data.id;
  let pid  = event.data.pid;
  let type = event.data.type;
  if (event.data.edit && event.data.new_id) {
    this.model.dataDelete({id:event.data.new_id});
    this.refreshData(this.element,this.model.data,pid,type);
  }
  // Get a new id (from database, if we use that) and add a new empty item to the data model.
  event.data.data = this.model.dataSearch({ type: type,
                                            id:   pid,
                                            data: this.model.data,
                                         }); // Find the place to add the new item
  if (event.data.data  || id == "new") {
    if (this.model.mode != "remote") {
      event.data.kind = "list";
      event.data.new_id = this.model.dataSearchNextId(type,event.data.data);
      if (event.data.new_id >= 0) {
        this._addListEntry(event.data);
      }
      else {
        this.model.error = "Next id not found. "; // TODO! i18n
        console.error(this.model.error);
        return false;
      }
    }
    else // remote
      this.model.dbSearchNextId({ type:    type,
                                  id_str:  event.data.id_str,
                                  success: this._addListEntryFromDB,
                                  context: this,
                               });
  }
  else
    console.error("Item "+id+" not found. "); // TODO! i18n
  return true;
}; // addListEntry

$.any.View.prototype._addListEntryFromDB = function (context,serverdata,options)
{
  let self = context;
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
      serverdata.kind = "list";
      serverdata.type = options.type;
      serverdata.new_id = serverdata.id;
      if (typeof serverdata.new_id == "string")
        if (serverdata.new_id.length && serverdata.new_id[0] != "+")
          serverdata.new_id = "+"+serverdata.new_id;
      serverdata.data   = view.model.data;
      serverdata.filter = view.getFilter(serverdata.type,serverdata.kind);
      view._addListEntry(serverdata);
    }
  }
}; // _addListEntryFromDB

$.any.View.prototype._addListEntry = function (opt)
{
  let data     = opt.data;
//let id       = opt.id;
  let pid      = opt.pid;
  let new_id   = opt.new_id;
  let id_str   = opt.id_str;
  let type     = opt.type;
  let kind     = opt.kind;
  let filter   = opt.filter;
//let edit     = opt.edit;

  // TODO! Direct manipulation of data model below:
  if (!data)
    data = this.model.data;
  if (pid && data[pid] && data[pid].data)
    data = data[pid].data;
  if ((new_id || new_id===0) && !data[new_id])  { // New row
    data[new_id] = {};
    data[new_id][kind] = type;
    data[new_id].data = {};
  }
  if (data[new_id]) {
    let id_key = this.model.id_key
                 ? this.model.id_key
                 : type+"_id";
    for (let filter_id in filter) {
      if (filter_id == id_key)
        data[new_id][filter_id] = new_id;
      else
        data[new_id][filter_id] = "";
    }
    data[new_id].type   = type;
    data[new_id].kind   = kind;
    data[new_id].is_new = true;
  }

  this.refreshOne(this.element,data,new_id,type,kind,true,id_str);

}; // _addListEntry

///////////////////////////////////////////////////////////////////////////////

// Default action when clicking on a name link.
$.any.View.prototype.itemLinkClicked = function (event)
{
  return this.showItem(event);
}; // itemLinkClicked

// Open a (possibly new and empty) item view.
$.any.View.prototype.showItem = function (event)
{
  event.data.view = this;
//let data   = event.data.data;
  let id     = event.data.id;
  let type   = event.data.type;
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
      this.model.dbSearchNextId({ type:    type,
                                  is_new:  true,
                                  success: this._foundNextIdFromDB,
                                  context: this,
                               }); // TODO! Asynchronous database call
    }
  }
  else
    return this._doShowItem(event.data);
}; // showItem

$.any.View.prototype._foundNextIdFromDB = function (context,serverdata,options)
{
  let self = context;
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
    self.dbSearchNextIdSuccess(self,serverdata,options);
    if (view) {
      serverdata.view = view;
      view._doShowItem(serverdata);
    }
  }
}; // _foundNextIdFromDB

$.any.View.prototype._doShowItem = function (opt)
{
  let data   = opt.data;
  let id     = opt.id;
  let type   = opt.head ? opt.head : opt.item ? opt.item : opt.list ? opt.list : opt.type ? opt.type : "";
  let kind   = "item";
  let is_new = opt.is_new != undefined ? opt.is_new : false;
  let name_key = this.model.name_key ? this.model.name_key : type+"_name";
  let the_item = null;
  if (!is_new)
    the_item = this.model.dataSearch({ type: type,
                                       id:   id,
                                    });
  else
    the_item = data;
  let the_id    = the_item ? the_item[id] ? id : the_item["+"+id] ? "+"+id : null : null;
  let item_name = null;
  if (the_id)
    item_name = the_item[the_id][name_key];
  else
    item_name = i18n.message.newType.replace("%%",type); // Edit new
  let item = {
    "+0": { // Header
      head: type,
      [name_key]: item_name,
      data: {},
    },
  };
  if (!is_new) {
    // Create a new item filled with data copied from original data structure
    item["+0"].data[the_id] = data && data[the_id] ? $.extend(true, {}, data[the_id]) : null;
    if (item["+0"].data[the_id].head)
      delete item["+0"].data[the_id].head;
    if (item["+0"].data[the_id].list)
      delete item["+0"].data[the_id].list;
  }
  else {
    // Create a new item with empty data for displayable entries
    item["+0"].data[the_id] = {};
    let filter = this.getFilter(type,"item");
    for (let filter_id in filter)
      if (filter[filter_id].DISPLAY)
        item["+0"].data[the_id][filter_id] = "";
  }
  item["+0"].data[the_id].item   = type;
  item["+0"].data[the_id].is_new = is_new;
  let view = this.createView(opt.view,item,the_id,type,kind); // New type to display, create new view
  if (!view || !view.options || !view.options.top_view) {
    console.warn("View missing. "); // Should never happen TODO! i18n
   return false;
  }
  view.options.item_opening = true; // To make top right close icon appear
  let filter = view.getFilter(type,kind);
  if (!filter) {
    this.model.message = i18n.error.FILTER_NOT_FOUND.replace("%%", type+" "+kind+"");
    console.warn(this.model.message);
    this.showMessages();
    return false;
  }
  // Create a new display area and display the item data
  let con_div = $("#"+view.options.top_view.element.attr("id"));
  if (!con_div.length)
    con_div = view.element;
  con_div.empty(); // TODO! This should perhaps be done elsewhere
  view.element  = con_div;
  view.main_div = null; // TODO! Why?
  view.options.data_level = 0;
  view.id_stack     = [...view.root_id_stack];
  if (is_new) {
    view.options.isEditable  = true;
    view.options.isDeletable = false;
    view.options.isRemovable = false;
  }
  if (view.model.mode == "remote" && !is_new) {
    // Remote search, will (normally) call refresh via onModelChange
    let mod_opt = { context:  view.model,
                    id:       the_id,
                    type:     type,
                    head:     true,
                    grouping: "tabs",
                  };
    view.model.dbSearch(mod_opt);
  }
  else {
    // Local refresh
    if (is_new)
      view.refreshLoop(con_div,item,"+0",type,"item");
    else
      view.refreshLoop(con_div,item,the_id,type,"item");
  } // else
  return true;
}; // _doShowItem

$.any.View.prototype.closeItem = function (event)
{
  // TODO! Should check for changed values and give warning before closing
  if (this.options.top_view)
    this.options.top_view.refresh();
}; // closeItem

///////////////////////////////////////////////////////////////////////////////

$.any.View.prototype.toggleEdit = function (event)
{
  if (!event || !event.data)
    return null;
  return this.doToggleEdit(event.data);
}; // toggleEdit

$.any.View.prototype.doToggleEdit = function (opt)
{
  if (!opt)
    return null;
  if (this.current_edit && this.current_edit.edit) {
    opt = this.current_edit;
    opt.edit = false;
  }
  let prefix  = this.base_id+"_"+opt.type+"_"+opt.kind+"_"+opt.id_str;
  let elem_id = opt.kind == "item"
                ? this.base_id+"_"+opt.type+"_item_"+opt.id_str+"_tbody"
                : this.base_id+"_"+opt.type+"_list_"+opt.id_str+"_tr";
  let elem = $("#"+elem_id);
  if (elem.length) {
    if (opt.kind != "item") {
      if (this.options.onEscRemoveEmpty || this.options.onFocusoutRemoveEmpty) {
        // Remove if empty
        let filter_id = this.model && this.model.name_key ? this.model.name_key : opt.type+"_name"; // TODO! Should work for all input fields!
        let input_id  = prefix+"_"+filter_id+" .itemEdit";
        let elem_empty = $("#"+input_id);
        if (this.model && elem_empty.length) {
          if (!elem_empty.val()) {
            this.model.dataDelete({ data: opt.data,
                                    type: opt.type,
                                    id:   opt.id,
                                 });
            elem_empty.parent().parent().remove();
            this.current_edit = null;
          }
        }
      }
      this.refreshData(this.element,opt.data,opt.id,opt.type,opt.kind,opt.edit,opt.id_str,opt.pdata,opt.pid);
    }
    else {
      this.refreshItemTableDataRow(elem,opt.data,opt.id,opt.type,opt.kind,opt.edit,opt.id_str,opt.pdata,opt.pid);
    }
  }
  let edit_icon   = prefix+"_edit .any-edit-icon";
  let update_icon = prefix+"_edit .any-update-icon";
  let add_icon    = prefix+"_add_icon";
  let remove_icon = prefix+"_remove_icon";
  let delete_icon = prefix+"_delete_icon";
  let cancel_icon = prefix+"_cancel_icon";
  if (opt.edit) {
    $("#"+edit_icon).hide();
    $("#"+update_icon).show();
    $("#"+add_icon).show();
    $("#"+remove_icon).hide();
    $("#"+delete_icon).show();
    $("#"+cancel_icon).show();
    this.current_edit = {
      data:       opt.data,
      id:         opt.id,
      type:       opt.type,
      kind:       opt.kind,
      filter:     opt.filter,
      id_str:     opt.id_str,
      is_new:     opt.is_new,
      isEditable: opt.isEditable,
      edit:       true,
      pdata:      opt.pdata,
      pid:        opt.pid,
    };
    let filter_id = this.model && this.model.name_key ? this.model.name_key : opt.type+"_name";
    let nameid = prefix+"_"+filter_id+" .itemEdit";
    let txt = $("#"+nameid);
    if (txt.length) {
      // Bind enter key
      txt.off("keyup").on("keyup",     this.current_edit, $.proxy(this._processKeyup,this));
      txt.off("keydown").on("keydown", this.current_edit, $.proxy(this._processKeyup,this)); // For catching the ESC key on Vivaldi
    }
  }
  else {
    $("#"+edit_icon).show();
    $("#"+update_icon).hide();
    $("#"+add_icon).hide();
    $("#"+remove_icon).show();
    $("#"+delete_icon).hide();
    $("#"+cancel_icon).hide();
    this.current_edit = null;
    this.showMessages("");
  }
  return this;
}; // doToggleEdit

///////////////////////////////////////////////////////////////////////////////

$.any.View.prototype._toggleChecked = function (event)
{
  let opt = event.data;
  let chk_id  = this.base_id+"_"+opt.type+"_"+opt.kind+"_"+opt.id_str+"_select_icon .check";
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

/**
 * @method dbSearchParents
 * @description Search for the list of possible parent items for the item with the given id.
 *              Called when processing plugin filters.
 *              The success metod builds a dropdown menu.
 * @param  type
 * @param  kind
 * @param  id
 * @param  val
 * @param  edit
 * @param  pid
 * @return true on success, false on error.
 */
$.any.View.prototype.dbSearchParents = function (type,kind,id,val,edit,pid)
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
    return this.model.dbSearch(options);
  else {
    options.id = id;
    let item = this.model.dataSearch(options);
    if (item)
      return item[id].parent_name;
    return "";
  }
}; // dbSearchParents

// Create the dropdown menu to select parent from.
$.any.View.prototype.createParentDropdownMenu = function (context,serverdata,options)
{
  let self = context;
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
        let id_str    = view.id_stack.length ? view.id_stack.join("_")+"_"+the_id : "0_"+the_id;
        let data      = serverdata.data;
        let item_id = view.base_id+"_"+options.type+"_"+kind+"_"+id_str+"_parent_id .itemSelect";
        let did_select = "selected='true'";
        $.each(data,function (id,item) {
          if (parseInt(id) != the_id) {
            let sel = parseInt(id) == parseInt(options.parent_id) ? "selected='true'" : "";
            let pname = data[id][type_name];
            $("#"+item_id).append($("<option "+sel+">").attr("value",parseInt(id)).text(pname));
            if (sel != "") {
              $("#"+item_id+"-button .ui-selectmenu-text").text(item[type_name]);
              did_select = "";
            }
          }
        });
        $("#"+item_id).prepend($("<option "+did_select+">").attr("value","null").text("[None]")); // TODO! i18n
      } // if view
    }
  }
}; // createParentDropdownMenu

///////////////////////////////////////////////////////////////////////////////

$.any.View.prototype.dbUpdate = function (event)
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
  let indata = event.data.indata;
  let id     = event.data.id;
  let type   = event.data.type;
  let kind   = event.data.kind;
  let id_str = event.data.id_str;
  let pdata  = event.data.pdata;
  let pid    = event.data.pid;
  let is_new = event.data.is_new;

  this.model.error = "";
  if (!id) // Should never happen
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
      let input_id = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_"+filter_id+" .itemEdit";
      if ($("#"+input_id).length)
        val = $("#"+input_id).val();
      else {
        // Send values marked as dirty to server even if they are not editable
        input_id = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_"+filter_id+"[dirty='true']";
        if ($("#"+input_id).length)
          val = $("#"+input_id).val();
      }
      if (val || val == "") {
        data_values[filter_id] = val;
        if (filter_id == "parent_id") {
          let input_id = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_"+filter_id+" .itemSelect option:selected";
          let pname = $("#"+input_id).text();
          data_values["parent_name"] = pname;
        }
      }
    }
  }
  this.model.dataUpdate({ type:   type,
                          id:     id,
                          indata: data_values,
                       });
  if (data_values["parent_name"])
    delete data_values["parent_name"]; // TODO! Why?
  if (id || id === 0) { // TODO!
    // Update header for item view
    let head_item = this.model.dataSearch({ type: type,
                                            id:   "+0",
                                         });
    if (head_item && head_item["+0"]) {
      head_item["+0"][this.model.name_key] = data_values[this.model.name_key];
      let con_div = this.getOrCreateMainContainer(null,type,kind,id_str);
      this.refreshHeader(con_div,this.model.data,"0",type,"head",false,"0",true); // TODO! Does not work!
    }
    // Make sure the items original model is also updated
    if (this.options.view && this.options.view != this) { // TODO! no view here
      if (!is_new)
        this.options.view.model.dataUpdate({ type:   type,
                                             id:     id,
                                             indata: data_values,
                                          });
      else {
        let dv = {};
        dv[id] = data_values;
        this.options.view.model.dataInsert({ type:   type,
                                             id:     pid,
                                             indata: dv,
                                             new_id: id,
                                          });
        }
    }
  }
  // Update view TODO! Neccessary for mode == "remote"?
  let item = this.model.dataSearch({ type: type,
                                     id:   id,
                                  });
  if (item && item[id])
    delete item[id].is_new; // TODO! Neccessary?
  if (kind == "list" || kind == "select") {
    let tr_id = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_tr";
    let tr    = $("#"+tr_id);
    this.refreshListTableDataRow(tr,indata,id,type,kind,false,id_str,pdata,pid);
  }
  else {
    this.options.isDeletable = this.options.isEditable;
    this.refreshData();
  }

  // Update database
  return this.model.dbUpdate(event.data);
}; // dbUpdate

// Override this in derived classes
$.any.View.prototype.validateUpdate = function (data)
{
  return "";
}; // validateUpdate

///////////////////////////////////////////////////////////////////////////////

/**
 * @method dbSearchLinks
 * @description Search for the list of items to select from.
 *              Called when selecting in the "Add..." menu in bottom toolbar of an item.
 *              The success metod builds a list of selectable items in a dialog.
 * @param  {Object} event
 * @return true on success, false on error.
 */
$.any.View.prototype.dbSearchLinks = function (event)
{
  if (!this.model)
    return false;
  let options = {
   type:        event.data.link_type, // Switch types
   id:          null,
   link_type:   event.data.type,      // Switch types
   simple:      true,
   success:     this.dbUpdateLinkListDialog, // Call the view success handler
   parent_view: this,
   head:        true,
   grouping:    "tabs",
  };
  return this.model.dbSearch(options);
}; // dbSearchLinks

// Create a list of selectable items and display in a modal dialog.
// Note: The 'this' context is here the calling model! Use options.parent_view for view methods!
$.any.View.prototype.dbUpdateLinkListDialog = function (context,serverdata,options)
{
  let self = context;
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
      //let parent_id   = isInt(options.parent_id) ? parseInt(options.parent_id) : "";
      //let id_str      = parent_view.id_stack.length ? parent_view.id_stack.join("_")+"_"+parent_id : "0_"+parent_id;
        let new_base_id = parent_view._createBaseId();
        let ll_id       = new_base_id+"_"+list_type+"_link_list";
        let ll_contents = $("<div id='"+ll_id+"'></div>");
        let select_list_view = parent_view.createView(ll_contents,serverdata.data,null,list_type,"list");
        if (select_list_view) {
          select_list_view.base_id = new_base_id;
          select_list_view.options.showHeader      = false;
          select_list_view.options.showTableHeader = false;
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
          let par_view_id = parent_view.base_id+"_"+self.type+"_head_0_data";
          let dia_id = w3_modaldialog({
                         parentId:    par_view_id,
                         elementId:   "",
                         heading:     "Select "+list_type+"s to add / remove", // TODO! i18n
                         contents:    select_list_view.main_div,
                         width:       "25em", // TODO! css
                         ok:          true,
                         cancel:      true,
                         okFunction:  parent_view.dbUpdateLinkList,
                         context:     parent_view,
                         // Sent to okFunction:
                         type:        self.type,
                         id:          self.id,
                         data:        self.data,
                         link_type:   select_list_view.model.type,
                         select:      select_list_view.model.select,
                         unselect:    select_list_view.model.unselect,
                         name_key:    select_list_view.model.name_key,
                       });
          select_list_view.refresh(ll_contents,serverdata.data,null,list_type,"list",false,"");
        }
      } // if parent_view
    }
  }
  if (options.parent_view) {
    if (this.options.showToolbar) {
      let view = options.parent_view;
      view.options.item_opening = true;
      view.refreshToolbarBottom(view.element,view.model.data,view.model.id,view.model.type,view.model.kind);
    }
  }
  return context;
}; // dbUpdateLinkListDialog

$.any.View.prototype.dbUpdateLinkList = function (opt)
{
  // Close dialog
  w3_modaldialog_close(opt);

  if (!this.model)
    throw i18n.error.MODEL_MISSING;

  // Update database
  let mod_opt = {
    type:      opt.type,
    id:        opt.id,
    data:      opt.data,
    link_type: opt.link_type,
    select:    opt.select,
    unselect:  opt.unselect,
    name_key:  opt.name_key,
    view:      opt.view, // Refresh only this view
    head:      true,
    grouping:  "tabs",
  };
  this.options.item_opening = true; // To make top right close icon appear
  if (!this.model.dbUpdateLinkList(mod_opt))
    return false;

  return true;
}; // dbUpdateLinkList

///////////////////////////////////////////////////////////////////////////////

$.any.View.prototype.dbRemoveDialog = function (event)
{
  if (!this.model)
    throw i18n.error.MODEL_MISSING;
  if (!event || !event.data)
    throw i18n.error.DATA_MISSING;

  let data      = event.data.data;
  let id        = event.data.id;
  let type      = event.data.type;
  let kind      = event.data.kind;
//let id_str    = event.data.id_str;
  let pdata     = event.data.pdata;
  let pid       = event.data.pid;
  let link_id   = pdata && pdata.groupingForId   ? pdata.groupingForId   : pid && pdata[pid] ? pid : null;
  let link_type = pdata && pdata.groupingForType ? pdata.groupingForType : pid && pdata[pid] ? pdata[pid].list : null;
  if (!data || !data[id]) {
    console.warn("Data not found ("+type+" id="+id+"). ");
    return null;
  }
  if (!link_id || !link_type) {
    console.warn("Link id/type missing ("+type+" id="+id+"): "+link_id+"/"+link_type);
    return null;
  }
  if (this.options.confirmRemove) {
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
    let msg = "<div class='any-confirm-remove-dialog' id='"+this.base_id+"_confirm_remove' style='padding:.8em;'>"+
              msgstr+"?"+
              "</div>";
    let parent_id = this.options.top_view.element.attr("id");
    if (!parent_id)
      parent_id = this.options.main_div.attr("id")
    if (!parent_id)
      parent_id = this.current_div_id; // TODO! current_div_id belongs in tabs class!
    w3_modaldialog({parentId:    parent_id,
                    elementId:   "",
                    heading:     kind == "item" ? i18n.button.buttonRemove : i18n.button.buttonRemoveFromList.replace("%%",type),
                    contents:    msg,
                    width:       "25em",
                    ok:          true,
                    cancel:      true,
                    okFunction:  this.dbUpdateLinkList,
                    context:     this,
                    // Sent to okFunction:
                    type:        link_type,
                    id:          link_id,
                    data:        data,
                    link_type:   type,
                    select:      new Set(),
                    unselect:    new Set().add(id),
                  });
  }
  return this;
}; // dbRemoveDialog

///////////////////////////////////////////////////////////////////////////////

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
$.any.View.prototype.dbDeleteDialog = function (event)
{
  if (!this.model)
    throw i18n.error.MODEL_MISSING;
  if (!event || !event.data)
    throw i18n.error.DATA_MISSING;

  let data   = event.data.data;
  let id     = event.data.id;
  let type   = event.data.type;
  let kind   = event.data.kind;
  let id_str = event.data.id_str;
  let item = this.model.dataSearch({ type: type,
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
    let msg = "<div class='any-confirm-delete-dialog' id='"+this.base_id+"_confirm_delete' style='padding:1em;'>"+
              msgstr+
              "</div>";
    let parent_id = this.main_div.attr("id");
    //if (!parent_id)
      //parent_id = this.current_div_id; // TODO! current_div_id belongs in tabs class!
    w3_modaldialog({parentId:   parent_id,
                    elementId:  "",
                    heading:    i18n.button.buttonDelete,
                    contents:   msg,
                    width:      "25em",
                    ok:         true,
                    cancel:     true,
                    okFunction: this.dbDelete,
                    context:    this,
                    // Sent to okFunction dbDelete:
                    data:       data,
                    id:         id,
                    type:       type,
                    kind:       kind,
                    id_str:     id_str,
                  });
  }
  return true;
}; // dbDeleteDialog

$.any.View.prototype.dbDelete = function (opt)
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
    this.model.dbDelete(opt);

  return true;
}; // dbDelete

// Remove a row (and subrows, id any) from a list, or the main container of an item
// Must be called after deleting or removing data.
$.any.View.prototype.removeFromView = function (opt)
{
  let data   = opt.data;
  let id     = opt.id;
  let type   = opt.type;
  let kind   = opt.kind;
  let id_str = opt.id_str;

  if (kind == "list" || kind == "select") {
    let elem_id = this.base_id+"_"+type+"_"+kind+"_"+id_str +"_tr";
    let tr = $("#"+elem_id);
    if (tr.length)
      tr.remove();
    // Remove subrows, if any
    let item = this.model.dataSearch({ data: data,
                                       id:   id,
                                       type: type,
                                    });
    if (!item || !item[id])
      return false;
    if (item[id].data) {
      for (let new_id in item[id].data) {
        if (item[id].data.hasOwnProperty(new_id)) {
          let the_id = Number.isInteger(parseInt(new_id)) ? parseInt(new_id) : new_id;
          let elem_id = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_"+the_id+"_tr";
          let tr      = $("#"+elem_id);
          if (tr.length)
            tr.remove();
        }
      }
    }
  }
  else
  if (kind == "item") {
    let elem_id = this.base_id+"_"+type+"_"+kind+"_"+id_str+"_container";
    let con = $("#"+elem_id);
    if (con.length && con.parent().length && con.parent().parent().length)
      con.parent().parent().remove();
  }
  return this;
}; // removeFromView

})($);

/////////////////////////////////////////////////////////////////////////////
//
// This can be used to instantiate anyView:
//
var anyView = function (options)
{
  if (!options)
    return null;
  return $.any.View(options);
};
/////////////////////////////////////////////////////////////////////////////