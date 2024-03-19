/* jshint esversion: 9 */
/* globals $,anyViewTabs,groupFilter,groupValidator, */
"use strict";
/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2024 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ****************************************************************************************/
/**
 * __group tabs view class.__
 *
 * @class groupViewTabs
 * @constructor
 */
(function($) {

$.widget("any.groupViewTabs", $.any.anyViewTabs, {
  // Default options
  options: {
    grouping:  "tabs",
    filters:   null, // Must be set by the calling method or will be set to default values in the constructor
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
    this.element.addClass("groupViewTabs");

    if (!this.options.filters) {
      let f = new groupFilter(this.options);
      this.options.filters = f.filters;
    }

    //this.validator = new groupValidator();

    // New item
    if (parseInt(this.options.is_new)) {
      let ev = {};
      ev.data = { data: null,
                  id:   null,
                  type: "group",
                  mode: "item",
                };
      this.showItem(ev);
    }
  },

  _destroy: function() {
    this.element.removeClass("groupViewTabs");
    this.options = null;
    this._super();
  }
});

$.any.groupViewTabs.prototype.validateUpdate = function (options)
{
  if (!this.validator)
    return null;
  return this.validator.validateUpdate(options,this);
}; // validateUpdate

})($);

var groupViewTabs = function (options)
{
  if (!options)
    return null;
  return $.any.groupViewTabs(options);
};

groupViewTabs.prototype = new anyViewTabs(null);
groupViewTabs.prototype.constructor = groupViewTabs;
