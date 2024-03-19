/* jshint esversion: 9 */
"use strict";
/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2024 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ***************************************************************************************/
/**
 * anyFilter is a minimal fallback filter that just displays the name key variable.
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
        [name_key]: { HEADER:options.type+" name", DISPLAY:1, TYPE:"link" },
      },
      list: {
        [name_key]: { HEADER:options.type+" name", DISPLAY:1, TYPE:"link" },
      },
      head: {
        [name_key]: { HEADER:options.type,         DISPLAY:1, TYPE:"label" },
      },
    },
  };
}; // constructor
