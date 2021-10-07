"use strict";
/**
 ****************************************************************************************
 *
 * anyList is copyright (C) 2011-2021 Arne D. Morken and Balanse Software.
 *
 * @license AGPLv3.0 for open source use or anyList Commercial License for commercial use.
 * Get licences here: http://balanse.info/anylist/license/ (coming soon).
 *
 ****************************************************************************************
 */
/**
 * __user tabs view class.__
 *
 * @class userDataViewTabs
 * @constructor
 */
(function($) {

$.widget("any.userDataViewTabs", $.any.DataView/*Tabs*/, {
  // Default options
  options: {
    filters: null, // Must be set by the calling method or will be set to default values in the constructor
    linkIcons: {

      "group":    "fa fa-users",
    },
  },

  // "Constructor"
  _create: function() {
    this.element.addClass("userDataViewTabs");
    this._super();

    if (!this.options.filters) {
      let f = new userFilter(this.options);
      this.options.filters = f.filters;
    }

    //this.validator = new userValidator();

    // New item
    if (parseInt(this.options.is_new)) {
      let ev = {};
      ev.data = { data: null,
                  id:   null,
                  type: "user",
                  kind: "item",
                };
      this.showItem(ev);
    }
  },

  _destroy: function() {
    this.element.removeClass("userDataViewTabs");
    this.options = null;
    this._super();
  }
});

$.any.userDataViewTabs.prototype.validateUpdate = function (options)
{
  if (this.validator)
    return this.validator.validateUpdate(options,this);
}; // validateUpdate

})($);

var userDataViewTabs = function (options)
{
  if (!options)
    return null;
  return $.any.userDataViewTabs(options);
};

userDataViewTabs.prototype = new anyDataView/*Tabs*/(null);
userDataViewTabs.prototype.constructor = userDataViewTabs;
