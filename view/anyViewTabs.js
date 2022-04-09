/* jshint sub:true */
/* jshint esversion: 6 */
/* globals $,i18n,anyView */
"use strict";
/****************************************************************************************
 *
 * anyList is copyright (C) 2011-2022 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyList Commercial License for commercial use.
 * Get licences here: http://balanse.info/anylist/license/ (coming soon).
 *
 ***************************************************************************************/
/**
 * __Tab view for the anyList data model.__
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
    this.tabs_list      = {};
    this.first_div_id   = null;
    this.current_div_id = null;
    this._super();
    this.element.addClass("any-datatabs-view");
  },

  _destroy: function() {
    this.element.removeClass("any-datatabs-view");
    this.tabs_list = null;
    this._super();
  }
}); // ViewTabs widget constructor

$.any.anyViewTabs.prototype.createView = function (params)
{
  let view = $.any.anyView.prototype.createView.call(this,params);
  if (view) {
    view.tabs_list      = this.tabs_list;
    view.first_div_id   = this.first_div_id;
    view.current_div_id = this.current_div_id;
  }
  return view;
}; // createView

$.any.anyViewTabs.prototype.refresh = function (params)
{
  $.any.anyView.prototype.refresh.call(this,params);
  if (this.current_div_id) {
    let ev = {};
    ev.data = {};
    ev.data.div_id = this.current_div_id;
    this.openTab(ev);
  }
}; // refresh

$.any.anyViewTabs.prototype.refreshHeader = function (params)
{
  let parent     = params.parent;
  let data       = params.data;
  let id         = params.id;
  let type       = params.type;
  let kind       = params.kind;
  let con_id_str = params.con_id_str;
  let prev_type  = params.ptype;
  let prev_kind  = params.pkind;

  if (!parent || !data || !this.options.showHeader)
    return null;

  let skip = false;
  if (this.options.grouping == "tabs" && data.grouping == "tabs") {
    con_id_str += ""; // Make sure its a string
    let n = con_id_str ? con_id_str.lastIndexOf("_") : -1;
    let tabs_id_str = (n>-1) ? con_id_str.slice(0,n) : ""; // con_id_str of level above
    if (kind == "list" || kind == "select")
      con_id_str = tabs_id_str;
    // Get or create a tabs button container
    let tabs_id = this.getIdBase()+"_"+prev_type+"_"+prev_kind+"_"+tabs_id_str+"_tabs";
    if (!this.tabs_list[tabs_id_str]) {
      this.tabs_list[tabs_id_str] = $("#"+tabs_id);
      if (this.tabs_list[tabs_id_str].length)
        this.tabs_list[tabs_id_str].remove();
      let lev_tab = this.options.indent_level + (kind && kind != "head" ? 1 : 0);
      let pl      = this.options.indent_tables ? lev_tab * this.options.indent_amount : 0;
      let pl_str  = pl > 0 ? "style='margin-left:"+pl+"px;'" : "";
      this.tabs_list[tabs_id_str] = $("<div id='"+tabs_id+"' class='any-tabs-container w3-bar w3-dark-grey' "+pl_str+"></div>");
      parent.append(this.tabs_list[tabs_id_str]);
    }
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
      // Create tab button
      let btn_id = this.getIdBase()+"_"+type+"_"+kind+"_"+con_id_str+"_data_tab_btn";
      if (!$("#"+btn_id).length) {
        let tab_str  = data && data[id] && (data[id][name_key] || data[id][name_key] == "")
                       ? data[id][name_key]
                       : "Other "+type; // TODO i18n
        let tab_btn = $("<button class='anyTabButton w3-bar-item w3-button' id='"+btn_id+"'>"+tab_str+"</button>");
        if (this.tabs_list[tabs_id_str]) {
          this.tabs_list[tabs_id_str].append(tab_btn);
          // Bind click on tab
          let div_id = this.getIdBase()+"_"+type+"_"+kind+"_"+con_id_str+"_data";
          let click_opt = { div_id: div_id };
          tab_btn.off("click");
          tab_btn.on("click",click_opt,$.proxy(this.openTab,this));
          $("#"+div_id).hide();
          // Remember which tab should get focus
          let ntab = this.tabs_list[tabs_id_str].children().length;
          if (ntab<2)
            this.first_div_id = div_id;
        }
      }
    }
  }
  if (!skip) // TODO: Should just skip the name, not the rest of the header
    return $.any.anyView.prototype.refreshHeader.call(this,params);
  return null;
}; // refreshHeader

$.any.anyViewTabs.prototype.refreshData = function (params)
{
  let data_div = $.any.anyView.prototype.refreshData.call(this,params);
  if (params.pkind == "head") {
    let div_id   = data_div.attr('id');
    let ev = {};
    ev.data = {};
    if (this.first_div_id)
      ev.data.div_id = this.first_div_id;
    else
      ev.data.div_id = div_id;
    this.openTab(ev);
  }
  return data_div;
}; // refreshData

$.any.anyViewTabs.prototype.openTab = function (event)
{
  if (!event || !event.data || event.data.div_id == this.current_div_id)
    return false;
  this.current_div_id = event.data.div_id;
  $(".anyTabButton").removeClass("w3-blue");
  let btn = $("#"+event.data.div_id+"_tab_btn");
  btn.addClass("w3-blue");
  let tab_area = $("#"+event.data.div_id);
  tab_area.parent().find(".any-head-data").hide();
  tab_area.show();
  tab_area.children().show();
  return true;
}; // openTab
/*
$.any.anyViewTabs.prototype.getWidgetName = function()
{
  let d = this.element.data();
  let k = Object.keys(d);
  if (k.length)
    return k[0];
  return "";
}; // getWidgetName
*/
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

/////////////////////////////////////////////////////////////////////////////
//@ sourceURL=anyViewTabs.js