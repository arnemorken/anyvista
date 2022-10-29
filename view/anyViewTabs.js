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
    this.tabs                = null;
    this.active_tab_area     = null;
    this.active_button       = null;
    this.active_button_panel = null;
    this.element.addClass("any-datatabs-view");
  },

  _destroy: function() {
    this.element.removeClass("any-datatabs-view");
    this.active_button_panel = null;
    this.active_button       = null;
    this.active_tab_area     = null;
    this.tabs                = null;
    this._super();
  }
}); // ViewTabs widget constructor

$.any.anyViewTabs.prototype.refresh = function (params)
{
  let parent = $.any.anyView.prototype.refresh.call(this,params);
  if (params) {
    let tab_id = this.getIdBase()+"_"+params.type+"_"+params.kind+"_"+params.con_id_str+"_data";
    if (tab_id == this.active_tab_area || $("#"+this.active_tab_area).parents("#"+tab_id).length)
      this.openTab();
    else
    if (this.active_tab_area)
      $("#"+tab_id).hide();
  }
  return parent;
}; // refresh

//
// Get the current tabs button container (div), or create a new one if it does not exist
//
$.any.anyViewTabs.prototype.getOrCreateTabsContainer = function (parent,type,kind,tabs_id_str)
{
  if (!parent)
    return null;
  let tabs_id  = this.getIdBase()+"_"+type+"_"+kind+"_"+tabs_id_str+"_tabs";
  let tabs_div = $("#"+tabs_id);
  if (!tabs_div.length) {
    let class_id = "any-datatabs-container w3-bar w3-dark-grey";
    let lev_tab = this.options.indent_level + (kind && kind != "head" ? 1 : 0);
    let pl      = this.options.indent_tables ? lev_tab * this.options.indent_amount : 0;
    let pl_str  = pl > 0 ? "style='margin-left:"+pl+"px;'" : "";
    tabs_div    = $("<div id='"+tabs_id+"' class='"+class_id+"' "+pl_str+"></div>");
    parent.append(tabs_div);
  }
  return tabs_div;
}; // getOrCreateTabsContainer

$.any.anyViewTabs.prototype.refreshHeader = function (params)
{
  let parent     = params.parent;
  let type       = params.type;
  let kind       = params.kind;
  let data       = params.data;
  let id         = params.id;
  let con_id_str = params.con_id_str;
  let pid        = params.pid;

  if (!parent || !data || !this.options.showHeader)
    return null;

  let skip = false;
  if (this.options.grouping == "tabs" && data.grouping == "tabs" && con_id_str) {
    con_id_str += ""; // Make sure its a string
    let n = con_id_str ? con_id_str.lastIndexOf("_") : -1;
    let tabs_id_str = (n>-1) ? con_id_str.slice(0,n) : "top"; // con_id_str of level above
    if (kind == "list" || kind == "select")
      con_id_str = tabs_id_str;
    // Get or create a container for the tab buttons
    let ptype          = this._findType(params.pdata,pid,type);
    let pkind          = this._findKind(params.pdata,pid,type);
    let tab_button_div = this.getOrCreateTabsContainer(parent,ptype,pkind,tabs_id_str);
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
      skip = true;
      // Create header as a tab button
      let btn_id = this.getIdBase()+"_"+type+"_"+kind+"_"+con_id_str+"_data_tab_btn";
      if (!$("#"+btn_id).length) {
        let tab_str  = data && data[id] && (data[id][name_key] || data[id][name_key] == "")
                       ? data[id][name_key]
                       : "Other "+type+"s"; // TODO i18n
        let tab_btn = $("<button class='anyTabButton w3-bar-item w3-button' id='"+btn_id+"'>"+tab_str+"</button>");
        if (tab_button_div) {
          tab_button_div.append(tab_btn);
          // Bind click on tab
          let tab_id = this.getIdBase()+"_"+type+"_"+kind+"_"+con_id_str+"_data";
          let click_opt = params;
          click_opt.tab_button_id = btn_id; // Id of button that was clicked
          click_opt.tab_area_id   = tab_id; // Id of area to be shown
          click_opt.tab_btn_panel = tab_button_div;
          tab_btn.off("click");
          tab_btn.on("click",click_opt,$.proxy(this.openTab,this));
          $("#"+tab_id).hide();
          // Remember which tab is the first
          let ntab = tab_button_div.children().length;
          if (ntab<2) {
            this.active_tab_area     = tab_id; // Set active to first tab
            this.active_button       = btn_id; // Set active to first tab
            this.active_button_panel = tab_button_div; // Set active button panel
          }
        }
      }
    }
  }
  if (!skip) // TODO: Should just skip the *name*, not the rest of the header?
    return $.any.anyView.prototype.refreshHeader.call(this,params);
  return null;
}; // refreshHeader

// Display a tab
// If called by user pressing a tab: Hide / inactivate current tab and display new one.
// If called by a function: Display currently active tab.
$.any.anyViewTabs.prototype.openTab = function (event)
{
  if (event && event.data && event.data.tab_area_id && event.data.tab_button_id) {
    let ch_len = $("#"+this.active_tab_area).closest($("#"+event.data.tab_area_id)).length;
    if (event.data.tab_button_id == this.active_button || ch_len)
      return;
    // Remove attrs identifying old active btn/tab/panel only if new tab is a sibling
    if ($("#"+this.active_button).siblings().is($("#"+event.data.tab_button_id))) {
      $("#"+this.active_button ).removeAttr("active_tab");
      $("#"+this.active_tab_area).removeAttr("active_tab");
      if (this.active_button_panel)
        this.active_button_panel.removeAttr("active_tab");
    }
    // Inactivate and hide old active tab and hide old active button panel (in case we clicked on a tab in another panel)
    $("#"+this.active_button).removeClass("w3-blue");
    $("#"+this.active_tab_area).hide();
    if (this.active_button_panel)
      this.active_button_panel.hide();
    // Remember new active tab/panel selected by user if no children are active
    let active_child = $("#"+event.data.tab_area_id).find("[active_tab]");
    if (!active_child.length) {
      this.active_button       = event.data.tab_button_id;
      this.active_tab_area     = event.data.tab_area_id;
      this.active_button_panel = event.data.tab_btn_panel;
    }
    else {
      this.active_button       = $("#"+event.data.tab_area_id).find("[active_tab].anyTabButton").attr("id");
      this.active_tab_area     = $("#"+event.data.tab_area_id).find("[active_tab].any-datatabs-view").attr("id");
      this.active_button_panel = $("#"+event.data.tab_area_id).find("[active_tab].any-datatabs-container");
    }
    // Hide siblings of new active tab
    $("#"+this.active_tab_area).siblings(".any-datatabs-view").hide();
  }
  if (!this.active_tab_area || !this.active_button || !this.active_button_panel)
    return false;
  // Show new active button panel and its ancestors (including siblings of ancestors)
  $("#"+this.active_button).addClass("w3-blue");
  $("#"+this.active_button).attr("active_tab",true);
  this.active_button_panel.show();
  this.active_button_panel.attr("active_tab",true);
  this.active_button_panel.parents(".any-datatabs-container").show();
  this.active_button_panel.parents().siblings(".any-datatabs-container").show();//???
  // Show new active tab
  $("#"+this.active_tab_area).attr("active_tab",true);
  $("#"+this.active_tab_area).parents().show();
  $("#"+this.active_tab_area).show();
  $("#"+this.active_tab_area).find("[active_tab]").show();
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