/* jshint esversion: 9 */
"use strict";
/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2023 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ****************************************************************************************/
/**
 * __group filter class.__
 *
 * @class groupFilter
 * @constructor
 */
var groupFilter = function (options)
{
  this.filters = {
    group: {
      item: {
        group_id:          { HEADER:"Group id",    DISPLAY:0, TYPE:"label" },
        group_name:        { HEADER:"Group name",  DISPLAY:1, TYPE:"link" },
        group_type:        { HEADER:"Group type",  DISPLAY:1, TYPE:"select", SELECT: {"group":"Group","user":"User","event":"Event","document":"Document"} },
        group_description: { HEADER:"Description", DISPLAY:1, TYPE:"textarea" },
        parent_id:         { HEADER:"Parent group",DISPLAY:1, TYPE:"select", SELECT: "dbSearchParents" },
        group_sort_order:  { HEADER:"Sort order",  DISPLAY:1, TYPE:"text" },
      //group_status:      { HEADER:"Status",      DISPLAY:1, TYPE:"select", /*SELECT: status*/ },
        group_privacy:     { HEADER:"Privacy",     DISPLAY:1, TYPE:"select", SELECT: {"0":"Public","1":"Private"} },
        membership:        { HEADER:"Membership",  DISPLAY:1, TYPE:"label" }, // TEST
      },
      list: {
        group_id:          { HEADER:"Group id",    DISPLAY:0, TYPE:"label" },
        group_name:        { HEADER:"Group name",  DISPLAY:1, TYPE:"link" },
        group_type:        { HEADER:"Group type",  DISPLAY:1, TYPE:"select", SELECT: {"group":"Group","user":"User","event":"Event","document":"Document"} },
        group_description: { HEADER:"Description", DISPLAY:1, TYPE:"text" },
        parent_id:         { HEADER:"Parent group",DISPLAY:0, TYPE:"select", SELECT: "dbSearchParents" },
        group_sort_order:  { HEADER:"Sort order",  DISPLAY:1, TYPE:"text" },
      //group_status:      { HEADER:"Status",      DISPLAY:1, TYPE:"select", /*SELECT: status*/ },
        group_privacy:     { HEADER:"Privacy",     DISPLAY:1, TYPE:"select", SELECT: {"0":"Public","1":"Private"} },
        membership:        { HEADER:"Membership",  DISPLAY:1, TYPE:"label" }, // TEST
      },
      head: {
        group_name:        { HEADER:"Group name",  DISPLAY:1, TYPE:"link" },
        group_description: { HEADER:"Description", DISPLAY:1, TYPE:"text" },
      },
      select: {
        group_name:        { HEADER:"Group name",  DISPLAY:1, TYPE:"link" },
      },
    },
  };
}; // constructor
