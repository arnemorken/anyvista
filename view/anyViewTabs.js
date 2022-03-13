/* jshint sub:true */
/* jshint esversion: 6 */
/* globals $,i18n */
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
    this.element.addClass("any-datatabs-view");
    this.tabs_list      = {};
    this.first_div_id   = null;
    this.current_div_id = null;
    this._super();
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

$.any.anyViewTabs.prototype.refresh = function (parent,data,id,type,kind,edit,pdata,pid)
{
  this.tabs_list = {};
  $.any.anyView.prototype.refresh.call(this,parent,data,id,type,kind,edit,pdata,pid);
}; // refresh

$.any.anyViewTabs.prototype.refreshLoop = function (params)
{
  $.any.anyView.prototype.refreshLoop.call(this,params);
  if (this.current_div_id) {
    let ev = {};
    ev.data = {};
    ev.data.div_id = this.current_div_id;
    this.openTab(ev);
  }
}; // refreshLoop

$.any.anyViewTabs.prototype.refreshHeader = function (parent,data,id,type,kind,edit,id_str,doNotEmpty)
{
  if (!parent || !data || !this.options.showHeader)
    return null;

  let skip = false;
  if (this.options.grouping == "tabs" && data.grouping == "tabs") {
    id_str += ""; // Make sure its a string
    let n = id_str ? id_str.lastIndexOf("_") : -1;
    let tabs_id_str = (n>-1) ? id_str.slice(0,n) : ""; // id_str of level above
    if (kind == "list" || kind == "select")
      id_str = tabs_id_str;

    // Get or create a tabs button container
    let tabs_id = this.getBaseId()+"_"+type+"_"+kind+"_"+tabs_id_str+"_tabs";
    if (!this.tabs_list[tabs_id_str]) {
      this.tabs_list[tabs_id_str] = $("#"+tabs_id);
      if (this.tabs_list[tabs_id_str].length)
        this.tabs_list[tabs_id_str].remove();
      let lev_tab = this.options.indent_level + (kind && kind != "head" ? 1 : 0);
      let pl      = this.options.indent_tables ? lev_tab * this.options.indent_amount : 0;
      let pl_str  = pl > 0 ? "style='margin-left:"+pl+"px;'" : "";
      this.tabs_list[tabs_id_str] = $("<div id='"+tabs_id+"' class='any-tabs-container w3-bar w3-dark-grey' "+pl_str+"></div>");
      parent.prepend(this.tabs_list[tabs_id_str]);
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
      let btn_id = this.getBaseId()+"_"+type+"_"+kind+"_"+id_str+"_data_tab_btn";
      if (!$("#"+btn_id).length) {
        let tab_str  = data && data[id] && (data[id][name_key] || data[id][name_key] == "")
                       ? data[id][name_key]
                       : "Other "+type; // TODO i18n
        let tab_btn = $("<button class='anyTabButton w3-bar-item w3-button' id='"+btn_id+"'>"+tab_str+"</button>");
        if (this.tabs_list[tabs_id_str]) {
          this.tabs_list[tabs_id_str].append(tab_btn);
          // Bind click on tab
          let div_id = this.getBaseId()+"_"+type+"_"+kind+"_"+id_str+"_data";
          let click_opt = { div_id: div_id };
          tab_btn.off("click");
          tab_btn.on("click",click_opt,$.proxy(this.clickOpenTab,this));
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
    return $.any.anyView.prototype.refreshHeader.call(this,parent,data,id,type,kind,edit,id_str,doNotEmpty);
  return null;
}; // refreshHeader

$.any.anyViewTabs.prototype.refreshData = function (parent,data,id,type,kind,edit,id_str,pdata,pid)
{
  let data_div = $.any.anyView.prototype.refreshData.call(this,parent,data,id,type,kind,edit,id_str,pdata,pid);
  if (kind == "head" || (data && data.grouping)) {
    let div_id   = data_div.attr('id');
    let ev = {};
    ev.data = {};
    ev.data.div_id = div_id;
    this.openTab(ev);
    if (this.first_div_id) {
      ev.data.div_id = this.first_div_id;
      this.openTab(ev);
    }
  }
  return data_div;
}; // refreshData

$.any.anyViewTabs.prototype.clickOpenTab = function (event)
{
  this.current_div_id = event.data.div_id;
  this.openTab(event);
}; // clickOpenTab

$.any.anyViewTabs.prototype.openTab = function (event)
{
  if (!event)
    return false;
  $(".anyTabButton").removeClass("w3-blue");
  let btn = $("#"+event.data.div_id+"_tab_btn");
  btn.addClass("w3-blue");
  let tab_area = $("#"+event.data.div_id);
  tab_area.parent().parent().find(".any-head-data").hide();
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