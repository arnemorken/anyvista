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
 * __group tabs view class.__
 *
 * @class groupDataViewTabs
 * @constructor
 */
(function($) {

$.widget("any.groupDataViewTabs", $.any.DataView/*Tabs*/, {
  // Default options
  options: {
    filters: null, // Must be set by the calling method or will be set to default values in the constructor
    linkIcons: {
      "user":     "fa fa-user",
      "group":    "fa fa-users",
    },
  },

  // "Constructor"
  _create: function() {
    this.element.addClass("groupDataViewTabs");
    this._super();

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
                  kind: "item",
                };
      this.showItem(ev);
    }
  },

  _destroy: function() {
    this.element.removeClass("groupDataViewTabs");
    this.options = null;
    this._super();
  }
});

$.any.groupDataViewTabs.prototype.validateUpdate = function (options)
{
  if (this.validator)
    return this.validator.validateUpdate(options,this);
}; // validateUpdate

})($);

var groupDataViewTabs = function (options)
{
  if (!options)
    return null;
  return $.any.groupDataViewTabs(options);
};

groupDataViewTabs.prototype = new anyDataView/*Tabs*/(null);
groupDataViewTabs.prototype.constructor = groupDataViewTabs;
