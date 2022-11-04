/* jshint sub:true */
/* jshint esversion: 6 */
/* globals $,i18n,anyView */
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
    this.active_tab_panel   = null;
    this.active_tab_area_id = null;
    this.active_tab_btn_id  = null;
    this.element.addClass("any-datatabs-view");
  },

  _destroy: function() {
    this.element.removeClass("any-datatabs-view");
    this.active_tab_panel   = null;
    this.active_tab_area_id = null;
    this.active_tab_btn_id  = null;
    this._super();
  }
}); // ViewTabs widget constructor

$.any.anyViewTabs.prototype.refreshData = function (params)
{
  let table = $.any.anyView.prototype.refreshData.call(this,params);
  if (params && params.data && params.data_div) {
    if (this.options.grouping == "tabs" && params.data.grouping == "tabs")
      params.data_div.hide();
  }
  this.openTab();
  return table;
}; // refreshData

//
// Get the current tab container (div), or create a new one if it does not exist
//
$.any.anyViewTabs.prototype.getOrCreateTabsContainer = function (parent,type,kind,tabs_id_str)
{
  if (!parent)
    return null;

  let tabs_id  = this.getIdBase()+"_"+type+"_"+kind+"_"+tabs_id_str+"_tabs";
  let tabs_div = $("#"+tabs_id);
  if (!tabs_div.length) {
    let class_id = "any-datatabs-container w3-bar w3-dark-grey";
    let lev_tab  = this.options.indent_level + (kind && kind != "head" ? 1 : 0);
    let pl       = this.options.indent_tables ? lev_tab * this.options.indent_amount : 0;
    let pl_str   = pl > 0 ? "style='margin-left:"+pl+"px;'" : "";
    tabs_div     = $("<div id='"+tabs_id+"' class='"+class_id+"' "+pl_str+"></div>");
    parent.append(tabs_div);
  }
  return tabs_div;
}; // getOrCreateTabsContainer

$.any.anyViewTabs.prototype.refreshHeader = function (params)
{
  if (!params || !this.options.showHeader)
    return null;

  let parent     = params.parent;
  let type       = params.type;
  let kind       = params.kind;
  let data       = params.data;
  let id         = params.id;
  let con_id_str = params.con_id_str;

  if (!parent || !data)
    return null;

  let skip_hdr = false;
  if (this.options.grouping == "tabs" && data.grouping == "tabs" && con_id_str) {
    // Get the correct filter
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
      // We found a name to use as tab button, so skip it as an ordinary header
      skip_hdr = true;
      // Create header as a tab button
      con_id_str += ""; // Make sure its a string
      let n = con_id_str ? con_id_str.lastIndexOf("_") : -1;
      let tabs_id_str = (n>-1) ? con_id_str.slice(0,n) : "top"; // con_id_str of level above
      if (kind == "list" || kind == "select")
        con_id_str = tabs_id_str;
      // Get or create a container for the tab buttons
      let ptype = this._findType(params.pdata,params.pid,type);
      let pkind = this._findKind(params.pdata,params.pid,type);
      this.active_tab_panel = this.getOrCreateTabsContainer(parent,ptype,pkind,tabs_id_str);
      // Add a new tab button in tab panel if it doesnt already exists
      let tab_btn_id  = this.getIdBase()+"_"+type+"_"+kind+"_"+con_id_str+"_data_tab_btn";
      let tab_area_id = this.getIdBase()+"_"+type+"_"+kind+"_"+con_id_str+"_data";
      if (!$("#"+tab_btn_id).length) {
        let tab_str = data && data[id] && (data[id][name_key] || data[id][name_key] == "")
                      ? data[id][name_key]
                      : "Other "+type+"s"; // TODO i18n
        let tab_btn = $("<button class='anyTabButton w3-bar-item w3-button' id='"+tab_btn_id+"'>"+tab_str+"</button>");
        this.active_tab_panel.append(tab_btn);
        // Bind click on tab
        let opt = {
          tab_panel:   this.active_tab_panel,
          tab_btn_id:  tab_btn_id,  // Id of button that was clicked
          tab_area_id: tab_area_id, // Id of area to be shown
        };
        tab_btn.off("click").on("click",opt,$.proxy(this.openTab,this));
      }
      // Remember which tab is the first
      let num_tab = this.active_tab_panel.children().length;
      if (num_tab == 1) {
        this.active_tab_btn_id  = tab_btn_id;  // Remember first tab button
        this.active_tab_area_id = tab_area_id; // Remember first tab area
        this.openTab();
      }
      else
        $("#"+tab_area_id).hide();
    }
  }
  if (!skip_hdr) // TODO: Should just skip the *name*, not the rest of the header?
    return $.any.anyView.prototype.refreshHeader.call(this,params);
  return null;
}; // refreshHeader

// Display a tab
// If called by user clicking a tab: Hide/inactivate currently active tab and show/activate new tab.
// If called by a function: Show/activate currently active tab.
$.any.anyViewTabs.prototype.openTab = function (event)
{
  if (event && event.data && event.data.tab_area_id && event.data.tab_btn_id) {
    /*
    let ch_len = $("#"+this.active_tab_area_id).closest($("#"+event.data.tab_area_id)).length;
    if (event.data.tab_btn_id == this.active_tab_btn_id || ch_len)
      return;
    */
    // Remove attrs identifying old active btn/tab/panel only if new tab is a sibling
    if ($("#"+this.active_tab_btn_id).siblings().is($("#"+event.data.tab_btn_id))) {
      if (this.active_tab_panel)
        this.active_tab_panel.removeAttr("active_tab");
      $("#"+this.active_tab_btn_id ).removeAttr("active_tab");
      $("#"+this.active_tab_area_id).removeAttr("active_tab");
    }
    // Inactivate and hide old active tab and hide old active button panel (in case we clicked on a tab in another panel)
    if (this.active_tab_panel)
      this.active_tab_panel.hide();
    $("#"+this.active_tab_btn_id).removeClass("w3-blue");
    $("#"+this.active_tab_area_id).hide();
    // Remember new active tab/panel selected by user if no children are active
    let active_child = $("#"+event.data.tab_area_id).find("[active_tab]");
    if (!active_child.length) {
      this.active_tab_panel   = event.data.tab_panel;
      this.active_tab_btn_id  = event.data.tab_btn_id;
      this.active_tab_area_id = event.data.tab_area_id;
    }
    else {
      this.active_tab_panel   = $("#"+event.data.tab_area_id).find("[active_tab].any-datatabs-container");
      this.active_tab_btn_id  = $("#"+event.data.tab_area_id).find("[active_tab].anyTabButton").attr("id");
      this.active_tab_area_id = $("#"+event.data.tab_area_id).find("[active_tab].any-datatabs-view").attr("id");
    }
    // Hide siblings of new active tab
    $("#"+this.active_tab_area_id).siblings(".any-data-view").hide();
  }
  if (!this.active_tab_panel || !this.active_tab_area_id || !this.active_tab_btn_id)
    return false;
  // Show new active button panel and its ancestors (including siblings of ancestors)
  $("#"+this.active_tab_btn_id).addClass("w3-blue");
  $("#"+this.active_tab_btn_id).attr("active_tab",true);
  this.active_tab_panel.show();
  this.active_tab_panel.attr("active_tab",true);
  this.active_tab_panel.parents(".any-datatabs-container").show();
  this.active_tab_panel.parents().siblings(".any-datatabs-container").show();//???
  // Show new active tab
  $("#"+this.active_tab_area_id).attr("active_tab",true);
  $("#"+this.active_tab_area_id).parents().show();
  $("#"+this.active_tab_area_id).show();
  $("#"+this.active_tab_area_id).find("[active_tab]").show();
  return true;
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