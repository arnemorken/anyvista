"use strict";
/****************************************************************************************
 *
 * anyList is copyright (C) 2011-2021 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyList Commercial License for commercial use.
 * Get licences here: http://balanse.info/anylist/license/ (coming soon).
 *
 ****************************************************************************************/
/**
 * __event tabs view class.__
 *
 * @class eventViewTabs
 * @constructor
 */
(function($) {

$.widget("any.eventViewTabs", $.any.ViewTabs, {
  // Default options
  options: {
    mustEnroll:  true,
    mustLogin:   false,
    disp_result: true,
    filters:     null, // Must be set by the calling method or will be set to default values in the constructor
    linkIcons: {
      "event":    "fa fa-calendar",
      "user":     "fa fa-user",
      "document": "fa fa-book",
      "group":    "fa fa-users",
    },
  },

  // "Constructor"
  _create: function() {
    this._super();
    this.element.addClass("eventViewTabs");

    if (!this.options.filters) {
      let f = new eventFilter(this.options);
      this.options.filters = f.filters;
    }
    if (this.options.filters.event && this.options.filters.event.list && this.options.filters.event.user_result)
      this.options.filters.event.list.user_result.DISPLAY = !this.options.hide_result;

    this.validator = new eventValidator();

    this.upload_possible = [];

    // New item
    if (parseInt(this.options.is_new)) {
      let ev = {};
      ev.data = { data: null,
                  id:   null,
                  type: "event",
                  kind: "item",
                };
      this.showItem(ev);
    }
  },

  _destroy: function() {
    this.element.removeClass("eventViewTabs");
    this.options = null;
    this._super();
  }
});

$.any.eventViewTabs.prototype.validateUpdate = function (options)
{
  if (this.validator)
    return this.validator.validateUpdate(options,this);
}; // validateUpdate

// TODO!
$.any.eventViewTabs.prototype.createExtra = function ()
{
  let is_admin = this.model.permission && this.model.permission.is_admin;
  if (!this.option("isEditable") || !is_admin)
    return null;

  return this;
}; // createExtra
/*
$.any.eventViewTabs.prototype.bindCell = function (options,view)
{
  // Set attended
  let it_id = this.getBaseId()+"_"+options.type+"_"+options.kind+"_"+options.id_str+"_user_attended"
  let btn = $("#"+it_id);
  if (btn.length) {
    btn.off("click");
    btn.on("click",options,$.proxy(view.dbSetAttended,view));
  }
  // Check if date is passed
  let sdate = Date.parse(options.event_date_end);
  let today = Date.now();
  if (sdate < today) {
    let it_id = this.getBaseId()+"_"+options.type+"_"+options.kind+"_"+options.id_str+"_removeItem_icon"
    let btn = $("#"+it_id);
    if (btn.length)
      btn.hide();
  }
  return true;
}; // bindCell
*/

$.any.eventViewTabs.prototype.getPlaces = function (type,kind,id,val,edit)
{
  let obj = {"": "[Velg sted]", "0":"Oslo", "1":"Bergen", "2":"Bergsdalen"}; // TODO: Get this from database event settings
  if (edit)
    return obj;
  return obj[val];
};

$.any.eventViewTabs.prototype.getArrangers = function (type,kind,id,val,edit)
{
  let obj = {"0":"UCI", "1":"NCF"}; // TODO: Get this from database event settings
  if (edit)
    return obj;
  return obj[val];
};

$.any.eventViewTabs.prototype.getInstructors = function (type,kind,id,val,edit)
{
  let obj = {"0":"John", "1":"Jane"}; // TODO: Get this from database event settings
  if (edit)
    return obj;
  return obj[val];
};

$.any.eventViewTabs.prototype.dbSetAttended = function (event)
{
  return this.model.dbSetAttended(event.data);
};
})($);

var eventViewTabs = function (options)
{
  if (!options)
    return null;
  return $.any.eventViewTabs(options);
};

eventViewTabs.prototype = new anyViewTabs(null);
eventViewTabs.prototype.constructor = eventViewTabs;
