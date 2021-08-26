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
 *
 * __anyList filter class.__
 * Minimal fallback filter that just displays the name key variable.
 *
 * @class anyFilter
 * @constructor
 */
var anyFilter = function (options)
{
  let name_key = options.type + "_name";
  this.filters = {
    [options.type]: {
      item: {
        [name_key]: { HEADER:options.type+" name", DISPLAY:1, HTML_TYPE:"link" },
      },
      list: {
        [name_key]: { HEADER:options.type+" name", DISPLAY:1, HTML_TYPE:"link" },
      },
      head: {
        [name_key]: { HEADER:options.type,         DISPLAY:1, HTML_TYPE:"label" },
      },
    },
  };
}; // constructor
