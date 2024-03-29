/* jshint esversion: 9 */
/* globals $,anyViewTabs,userFilter,userValidator, */
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
 * __user tabs view class.__
 *
 * @class userViewTabs
 * @constructor
 */
(function($) {

$.widget("any.userViewTabs", $.any.anyViewTabs, {
  // Default options
  options: {
    grouping:  "tabs",
    filters:   null, // Must be set by the calling method or will be set to default values in the constructor
    linkIcons: {
      "event":    "fa fa-calendar",
      "document": "fa fa-book",
      "group":    "fa fa-users",
    },
  },

  // "Constructor"
  _create: function() {
    this._super();
    this.element.addClass("userViewTabs");

    let f = new userFilter(this.options);
    this.options.filters = f.filters;

    //this.validator = new userValidator();

    // New item
    if (parseInt(this.options.is_new)) {
      let ev = {};
      ev.data = { data: null,
                  id:   null,
                  type: "user",
                  mode: "item",
                };
      this.showItem(ev);
    }
  },

  _destroy: function() {
    this.element.removeClass("userViewTabs");
    this.options = null;
    this._super();
  }
});

$.any.userViewTabs.prototype.validateUpdate = function (options)
{
  if (!this.validator)
    return null;
  return this.validator.validateUpdate(options,this);
}; // validateUpdate

})($);

var userViewTabs = function (options)
{
  if (!options)
    return null;
  return $.any.userViewTabs(options);
};

userViewTabs.prototype = new anyViewTabs(null);
userViewTabs.prototype.constructor = userViewTabs;
