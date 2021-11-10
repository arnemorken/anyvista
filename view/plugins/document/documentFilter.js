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
 * __document filter class.__
 *
 * @class documentFilter
 * @constructor
 */
var documentFilter = function (options)
{
  this.filters = {
    document: {
      item: {
        document_id:          { HEADER:"Document id",    DISPLAY:0, HTML_TYPE:"label"},
        document_name:        { HEADER:"Document name:", DISPLAY:1, HTML_TYPE:"link"},
        document_description: { HEADER:"Description:",   DISPLAY:1, HTML_TYPE:"label"},
        document_owner:       { HEADER:"Owner:",         DISPLAY:1, HTML_TYPE:"link"},
      },
      list: {
        document_id:          { HEADER:"Document id",    DISPLAY:0, HTML_TYPE:"label"},
        document_name:        { HEADER:"Document name",  DISPLAY:1, HTML_TYPE:"link"},
        document_owner:       { HEADER:"Owner",          DISPLAY:1, HTML_TYPE:"link"},
      },
      head: {
        document_id:         { HEADER:"Document id",     DISPLAY:0, HTML_TYPE:"label"},
        document_name:       { HEADER:"Document name",   DISPLAY:1, HTML_TYPE:"link"},
      },
      select: {
        document_id:         { HEADER:"Document id",     DISPLAY:0, HTML_TYPE:"label"},
        document_name:       { HEADER:"Document name",   DISPLAY:1, HTML_TYPE:"label"},
      },
    },
  };
}; // constructor
