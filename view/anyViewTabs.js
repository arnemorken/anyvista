/* jshint sub:true */
/* jshint esversion: 6 */
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
 * __Tab view for the anyVista data model.__
 *
 * @class anyViewTabs
 * @extends anyView
 * @constructor
 */
(function($) {

$.widget("any.anyViewTabs", $.any.anyView, {
  // Default options
  options: {
    grouping: "tabs",
  },

  // "Constructor"
  _create: function() {
    this._super();
    this.element.addClass("any-datatabs-view");
    this.first_id_base   = this.options.first_id_base   ? this.options.first_id_base : null;
    this.current_id_base = this.options.current_id_base ? this.options.current_id_base : null;
  },

  _destroy: function() {
    this.first_id_base   = null;
    this.current_id_base = null;
    this.element.removeClass("any-datatabs-view");
    this._super();
  }
}); // ViewTabs widget constructor

$.any.anyViewTabs.prototype.getCreateViewOptions = function(model,parent,kind,data_level,indent_level,params)
{
  let opt = $.any.anyView.prototype.getCreateViewOptions.call(this,model,parent,kind,data_level,indent_level,params);
  opt.first_id_base   = this.first_id_base;
  opt.current_id_base = this.current_id_base;
  opt.grouping        = "tabs";
  return opt;
}; // getCreateViewOptions

//
// Get the current tab container (div), or create a new one if it does not exist
//
$.any.anyViewTabs.prototype.getOrCreateTabsContainer = function (parent,type,kind,data_level)
{
  if (!parent)
    return null;

  let tabs_id  = this.getIdBase()+"_"+type+"_"+kind+"_"+data_level+"_tabs";
  let tabs_div = $("#"+tabs_id);
  if (!tabs_div.length) {
    let class_id = "any-datatabs-container w3-bar w3-dark-grey";
    let lev_tab  = this.options.indent_level + (kind && kind != "head" ? 1 : 0);
    let pl       = this.options.indent_tables ? lev_tab * this.options.indent_amount : 0;
    let pl_str   = pl > 0 ? "style='margin-left:"+pl+"px;'" : "";
    tabs_div     = $("<div id='"+tabs_id+"' class='"+class_id+"' "+pl_str+"></div>");
    if (kind != "item")
      parent.parent().prepend(tabs_div);
    else
      parent.parent().append(tabs_div);
  }
  return tabs_div;
}; // getOrCreateTabsContainer

$.any.anyViewTabs.prototype.refreshHeader = function (params,skipName)
{
  if (!params || !params.data || !this.options.showHeader)
    return null;

  if (this.options.grouping == "tabs" && params.data.grouping) {
    // Get the correct filter
    let type = params.type;
    let kind = params.kind;
    if (!this.options.filters) {
      this.model.error = type.capitalize()+" "+kind+" "+i18n.error.FILTERS_MISSING;
      console.error(this.model.error);
      return null;
    }
    let fkind  = this.options.filters[type] && !this.options.filters[type]["head"] ? "list" : kind;
    let filter = this.options.filters[type] &&  this.options.filters[type][fkind]  ? this.options.filters[type][fkind]: null;
    if (!filter) {
      this.model.error = i18n.error.FILTER_NOT_FOUND.replace("%%", type+" "+fkind+"");
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

  let parent     = params.parent; // NOTE! Different parent than in anyView.refreshHeader!
  let type       = params.type;
  let kind       = params.kind;
  let data       = params.data;
  let id         = params.id;
  let row_id_str = params.row_id_str;

  // Get or create a container for the header tab buttons
  let ptype = this._findType(params.pdata,params.pid,type);
  let pkind = this._findKind(params.pdata,params.pid,kind);
  let tab_panel = this.getOrCreateTabsContainer(parent,ptype,pkind,this.data_level);

  // Add a new header tab button in tab panel if it doesnt already exists
  let id_base = this.getIdBase()+"_"+type+"_"+kind+"_"+row_id_str;
  let tab_btn_id    = id_base+"_data_tab_btn";
  let tab_header_id = id_base+"_header";
  let tab_data_id   = id_base+"_data";
  let first = false;
  if (!$("#"+tab_btn_id).length) {
    // Create tab button
    let d = data && data[id] ? data[id] : data && data["+"+id] ? data["+"+id] : null;
    let name_key = this.model && this.model.name_key ? this.model.name_key : type+"_name";
    let tab_str  = d && (d[name_key] || d[name_key] == "")
                   ? d[name_key]
                   : "Other "+type+"s"; // TODO i18n
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
  }
}; // refreshTabPanel

// Call anyView.refreshData(), then hide/show tabs
$.any.anyViewTabs.prototype.refreshData = function (params)
{
  let table_div = $.any.anyView.prototype.refreshData.call(this,params);
  this.openTab({ id_base:this.current_id_base });
  return table_div;
}; // refreshData

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

  if (this.first_id_base == undefined || this.first_id_base == null)
    this.first_id_base = id_base;
  this.current_id_base = id_base;
  return;
}; // openTab

})($);

/////////////////////////////////////////////////////////////////////////////
//
// This can be used to instantiate anyViewTabs:
//
var anyViewTabs = function (options)
{
  if (!options)
    return null;
  return $.any.anyViewTabs(options);
};

anyViewTabs.prototype = new anyView(null);
anyViewTabs.prototype.constructor = anyViewTabs;
//@ sourceURL=anyViewTabs.js