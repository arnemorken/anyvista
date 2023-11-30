/* jshint sub:true */
/* jshint esversion: 9 */
/* globals $,i18n,anyView */
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
 * <p>anyViewTabs extends anyView into a tab view for the anyVista data model.
 *</p>
 *
 * @constructs anyViewTabs
 * @extends anyView
 */
var anyViewTabsWidget = $.widget("any.anyViewTabs", $.any.anyView, {
  // Default options
  options: {
    grouping: "tabs",
  }, // options

  // Constructor
  _create: function() {
    this._super();
    this.element.addClass("any-datatabs-view");
    this.first_id_base   = this.options.first_id_base   ? this.options.first_id_base : null;
    this.current_id_base = this.options.current_id_base ? this.options.current_id_base : null;
    if (this.grandparent && !this.grandparent.idbase)
      this.grandparent.idbase = this.current_id_base;
    return this;
  }, // constructor

  // Destructor
  _destroy: function() {
    this.first_id_base   = null;
    this.current_id_base = null;
    this.element.removeClass("any-datatabs-view");
    this._super();
  }, // destructor

}); // anyViewTabs widget constructor

/**
 * Get the view options for a new tab view
 *
 * @method anyViewTabs.getCreateViewOptions
 * @return opt
 */
$.any.anyViewTabs.prototype.getCreateViewOptions = function(model,parent,type,mode,id_str,data_level,indent_level,params)
{
  let opt = $.any.anyView.prototype.getCreateViewOptions.call(this,model,parent,type,mode,id_str,data_level,indent_level,params);
  opt.first_id_base   = this.first_id_base;
  opt.current_id_base = this.grandparent ? this.grandparent.current_id_base : this.current_id_base;
  opt.grouping        = this.options.grouping || this.options.grouping === "" ? this.options.grouping : "tabs";
  return opt;
}; // getCreateViewOptions

/**
 * Get the current tab container (div), or create a new one if it does not exist
 *
 * @method anyViewTabs.getOrCreateTabsContainer
 * @return tabs_div
 */
$.any.anyViewTabs.prototype.getOrCreateTabsContainer = function (parent,type,mode,data_level)
{
  if (!parent)
    return null;

  let tabs_id  = this.getIdBase()+"_"+type+"_"+mode+"_"+data_level+"_tabs";
  let tabs_div = $("#"+tabs_id);
  if (!tabs_div.length) {
    let class_id = "any-datatabs-container w3-bar w3-dark-grey";
    let lev_tab  = this.options.indent_level + (mode && mode != "head" ? 1 : 0);
    let pl       = this.options.indent_tables ? lev_tab * this.options.indent_amount : 0;
    let pl_str   = pl > 0 ? "style='margin-left:"+pl+"px;'" : "";
    tabs_div     = $("<div id='"+tabs_id+"' class='"+class_id+"' "+pl_str+"></div>");
    if (mode != "item")
      parent.parent().prepend(tabs_div);
    else
      parent.parent().append(tabs_div);
  }
  return tabs_div;
}; // getOrCreateTabsContainer

$.any.anyViewTabs.prototype.postRefresh = function (params,skipName)
{
  if (Object.size(this.model.data) == 0) {
    let elm = $("#"+this.current_id_base+"_data");
    elm.remove();
    elm = $("#"+this.current_id_base+"_data_tab_btn");
    elm.remove();
    this.current_id_base = this.first_id_base;
    if (this.grandparent && !this.grandparent.idbase)
      this.grandparent.idbase = this.current_id_base;
  }
  this.openTab({ id_base:this.current_id_base });
}; // postRefresh

$.any.anyViewTabs.prototype.refreshHeader = function (params,skipName)
{
  if (!params || !params.data || !this.options || !this.options.showHeader)
    return null;

  if (this.options.grouping == "tabs" && params.data.grouping) {
    // Get the correct filter
    let type = params.type;
    let mode = params.mode;
    if (!this.options.filters) {
      this.model.error = type.capitalize()+" "+mode+" "+i18n.error.FILTERS_MISSING;
      console.error(this.model.error);
      return null;
    }
    let fmode  = this.options.filters[type] && !this.options.filters[type]["head"] ? "list" : mode;
    let filter = this.options.filters[type] &&  this.options.filters[type][fmode]  ? this.options.filters[type][fmode]: null;
    if (!filter) {
      this.model.error = i18n.error.FILTER_NOT_FOUND.replace("%%", type+" "+fmode+"");
      console.error(this.model.error);
      return null;
    }
    let name_key = this.model && this.model.name_key ? this.model.name_key : type+"_name";
    if (filter[name_key] && filter[name_key].DISPLAY) {
      // The name should be placed in the tab button container
      this.refreshTabPanel(params);

      // The rest of the header goes in the header section before the data section
      return $.any.anyView.prototype.refreshHeader.call(this,params,true);
    }
  }
  // Normal header
  return $.any.anyView.prototype.refreshHeader.call(this,params,skipName);
}; // refreshHeader

$.any.anyViewTabs.prototype.refreshTabPanel = function (params)
{
  if (!params || !params.parent || !params.data || !this.options.showHeader)
    return null;

  let parent       = params.parent; // NOTE! Different parent than in anyView.refreshHeader!
  this.grandparent = params.grandparent; // To remember current tab
  let type         = params.type;
  let mode         = params.mode;
  let data         = params.data;
  let id           = params.id;
  let row_id_str   = params.row_id_str;

  // Get or create a container for the header tab buttons
  let par_type = this._findType(params.par_data,params.par_id,type);
  let par_mode = this._findMode(params.par_data,params.par_id,mode);
  let tab_panel = this.getOrCreateTabsContainer(parent,par_type,par_mode,this.data_level);

  // Add a new header tab button in tab panel if it doesnt already exists
  let id_base    = this.getIdBase()+"_"+type+"_"+mode+"_"+row_id_str;
  let tab_btn_id = id_base+"_data_tab_btn";
  let first      = false;
  if (!$("#"+tab_btn_id).length) {
    // Create tab button
    let d = data && data[id] ? data[id] : data && data["+"+id] ? data["+"+id] : null;
    let name_key = this.model && this.model.name_key ? this.model.name_key : type+"_name";
    let tab_str  = d && (d[name_key] || d[name_key] == "")
                   ? d[name_key].capitalize()
                   : (type+"s").capitalize(); // TODO i18n
    let tab_btn = $("<button id='"+tab_btn_id+"' class='anyTabButton w3-bar-item w3-button'>"+tab_str+"</button>");
    tab_panel.append(tab_btn);
    // Bind click on tab
    tab_btn.off("click").on("click",{ id_base: id_base },$.proxy(this.openTab,this));
    first = true;
  }
  // Remember the first tab
  if (this.first_id_base == undefined || this.first_id_base == null)
    this.first_id_base = id_base;
  // Open first active tab (hide others)
  let curr_tab_btn = $("#"+id_base+"_data_tab_btn");
  let elems = curr_tab_btn.siblings().add(curr_tab_btn);
  let cid = elems.first().attr("id");
  if (cid) {
    this.first_id_base = cid.substring(0,cid.indexOf("_data_tab_btn"));
    if (first)
      this.current_id_base = this.first_id_base;
    else
      this.current_id_base = id_base;
    if (this.grandparent && !this.grandparent.idbase)
      this.grandparent.idbase = this.current_id_base;
  }
}; // refreshTabPanel

// Call anyView.refreshData(), then hide/show tabs
$.any.anyViewTabs.prototype.refreshData = function (params)
{
  let table_div = $.any.anyView.prototype.refreshData.call(this,params);
  let id = this.element.attr("id");
  let p1 = $("#"+id).parent();
  if (p1.length) {
    id = p1.attr("id");
    if (id) {
      id = id.substring(0,id.lastIndexOf("_"));
      let elm = $("#"+id+"_data_tab_btn");
      if (elm.length)
        this.current_id_base = id;
    }
  }
  this.openTab({ id_base:this.current_id_base });
  return table_div;
}; // refreshData

$.any.anyViewTabs.prototype.dbUpdateLinkListDialog = function (context,serverdata,options)
{
  $.any.anyView.prototype.dbUpdateLinkListDialog.call(this,context,serverdata,options);
  let list_type = null;
  if (serverdata) {
    if (serverdata.JSON_CODE)
      serverdata = serverdata.JSON_CODE;
    if (serverdata.data) {
      let parent_view = options.parent_view ? options.parent_view : null;
      if (parent_view)
        list_type = options.type;
    }
  }
  if (options.parent_view) {
    if (list_type) {
      let v = options.parent_view._findViewOfType(list_type);
      if (v) {
        let id = v.element.attr("id");
        id = id.substring(0,id.lastIndexOf("_"));
        id = id + "_link-" + list_type;
        v.openTab({id_base:id});
      }
    }
  }
}; // dbUpdateLinkListDialog

// Display a tab
// If called by user clicking a tab: Hide/inactivate currently active tab and show/activate new tab.
// If called by a function: Show/activate currently active tab.
$.any.anyViewTabs.prototype.openTab = function (eventOrData)
{
  let id_base = eventOrData && eventOrData.data
                ? eventOrData.data.id_base
                : eventOrData && eventOrData.id_base
                  ? eventOrData.id_base
                  : this.first_id_base;
  if (!id_base)
    return;
  let curr_tab_btn = $("#"+id_base+"_data_tab_btn");
  // Inactivate/hide previous
  curr_tab_btn.siblings().each(function() {
    $(this).removeClass("w3-blue");
    let id = $(this).attr("id");
    let prev_id_base = id.substring(0,id.indexOf("_data_tab_btn"));
    let prev_tab_header = $("#"+prev_id_base+"_header");
    let prev_tab_data   = $("#"+prev_id_base+"_data");
    prev_tab_header.hide();
    prev_tab_data.hide();
  });
  // Activate/show current
  curr_tab_btn.addClass("w3-blue");
  let curr_tab_header = $("#"+id_base+"_header");
  let curr_tab_data   = $("#"+id_base+"_data");
  curr_tab_header.show();
  curr_tab_data.show();

  if (!this.first_id_base)
    this.first_id_base = id_base;
  this.current_id_base = id_base;
  if (this.grandparent)
    this.grandparent.idbase = this.current_id_base;
  return;
}; // openTab

///////////////////////////////////////////////////////////////////////////////
// This can be used to instantiate anyViewTabs
///////////////////////////////////////////////////////////////////////////////
var anyViewTabs = function (options)
{
  if (!options)
    return null;
  return $.any.anyViewTabs(options);
};

anyViewTabs.prototype = new anyView(null);
anyViewTabs.prototype.constructor = anyViewTabs;
