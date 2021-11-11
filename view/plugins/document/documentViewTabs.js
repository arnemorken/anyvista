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
 * __document tabs view class.__
 *
 * @class documentViewTabs
 * @constructor
 */
(function($) {

$.widget("any.documentViewTabs", $.any.View, {
  // Default options
  options: {
    filters: null, // If not set by the calling method, it will be set to default values
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
    this.element.addClass("documentViewTabs");

    if (!this.options.filters) {
      let f = new documentFilter(this.options);
      this.options.filters = f.filters;
    }
    this.validator = new documentValidator();
  },

  _destroy: function() {
    this.options = null;
    this.element.removeClass("documentViewTabs");
    this._super();
  }
});

$.any.documentViewTabs.prototype.validateUpdate = function (options)
{
  if (!this.validator)
    return null;
  return this.validator.validateUpdate(options,this);
}; // validateUpdate

})($);

var documentViewTabs = function (options)
{
  if (!options)
    return null;
  return $.any.documentViewTabs(options);
};

documentViewTabs.prototype = new anyView(null);
documentViewTabs.prototype.constructor = documentViewTabs;
