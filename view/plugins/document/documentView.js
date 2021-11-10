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
 * __document view class.__
 *
 * @class documentView
 * @constructor
 */
(function($) {

$.widget("any.documentView", $.any.View, {
  // Default options
  options: {
    filters: null, // If not set by the calling method, it will be set to default values
    linkIcons: {
      "user":     "fa fa-user",
      "document": "fa fa-book",
      "group":    "fa fa-users",
    },
  },

  // "Constructor"
  _create: function() {
    this._super();
    this.element.addClass("documentView");

    if (!this.options.filters) {
      let f = new documentFilter(this.options);
      this.options.filters = f.filters;
    }
    this.validator = new documentValidator();
  },

  _destroy: function() {
    this.options = null;
    this.element.removeClass("documentView");
    this._super();
  }
});

$.any.documentView.prototype.validateUpdate = function (options)
{
  if (!this.validator)
    return null;
  return this.validator.validateUpdate(options,this);
}; // validateUpdate

})($);

var documentView = function (options)
{
  if (!options)
    return null;
  return $.any.documentView(options);
};

documentView.prototype = new anyView(null);
documentView.prototype.constructor = documentView;
