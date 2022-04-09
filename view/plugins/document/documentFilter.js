"use strict";
/****************************************************************************************
 *
 * anyList is copyright (C) 2011-2022 Arne D. Morken and Balanse Software.
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
        document_id:          { HEADER:"Document id",     DISPLAY:0, HTML_TYPE:"label" },
        document_upload:      { HEADER:"Upload file",     DISPLAY:1, HTML_TYPE:"upload" },
        document_name:        { HEADER:"File name",       DISPLAY:1, HTML_TYPE:"link", EDITABLE:0 },
        document_filename:    { HEADER:"View file",       DISPLAY:1, HTML_TYPE:"fileview" },
        document_description: { HEADER:"Description",     DISPLAY:1, HTML_TYPE:"text" },
        document_status:      { HEADER:"Status",          DISPLAY:1, HTML_TYPE:"label",  /*OBJ_SELECT:status*/ },
        document_privacy:     { HEADER:"Privacy",         DISPLAY:1, HTML_TYPE:"select", /*OBJ_SELECT:privacy*/ },
        date_access:          { HEADER:"Accessible from", DISPLAY:1, HTML_TYPE:"date" },
        parent_id:            { HEADER:"Parent group",    DISPLAY:0, HTML_TYPE:"select", /*OBJ_SELECT:parents*/ },
        user_role:            { HEADER:"Your&nbsp;role",  DISPLAY:1, HTML_TYPE:"label" },
      },
      list: {
        document_id:          { HEADER:"Document id",     DISPLAY:0, HTML_TYPE:"label" },
        document_upload:      { HEADER:"",                DISPLAY:1, HTML_TYPE:"upload" },
        document_name:        { HEADER:"File name",       DISPLAY:1, HTML_TYPE:"link", EDITABLE:0 },
        document_filename:    { HEADER:"",                DISPLAY:1, HTML_TYPE:"fileview" },
        document_description: { HEADER:"Description",     DISPLAY:1, HTML_TYPE:"text" },
        document_status:      { HEADER:"Status",          DISPLAY:1, HTML_TYPE:"label",  /*OBJ_SELECT:status*/ },
        document_privacy:     { HEADER:"Privacy",         DISPLAY:1, HTML_TYPE:"select", /*OBJ_SELECT:privacy*/ },
        date_access:          { HEADER:"Accessible from", DISPLAY:1, HTML_TYPE:"date" },
        parent_id:            { HEADER:"Parent group",    DISPLAY:0, HTML_TYPE:"select", /*OBJ_SELECT:parents*/ },
        user_role:            { HEADER:"Your&nbsp;role",  DISPLAY:1, HTML_TYPE:"label" },
      },
      head: {
        document_name:        { HEADER:"Documents", DISPLAY:1, HTML_TYPE:"label" },
      },
      select: {
        document_id:          { HEADER:"Document id", DISPLAY:0, HTML_TYPE:"label" },
        document_name:        { HEADER:"Filename",    DISPLAY:1, HTML_TYPE:"link" },
        document_filename:    { HEADER:"View",        DISPLAY:1, HTML_TYPE:"file" },
      },
    },
  };
}; // constructor
