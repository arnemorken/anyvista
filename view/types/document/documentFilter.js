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
        document_id:          { HEADER:"Document id",     DISPLAY:0, TYPE:"label" },
        document_upload:      { HEADER:"Upload file",     DISPLAY:1, TYPE:"upload" },
        document_name:        { HEADER:"File name",       DISPLAY:1, TYPE:"link", EDITABLE:0 },
        document_filename:    { HEADER:"View file",       DISPLAY:1, TYPE:"fileview" },
        document_description: { HEADER:"Description",     DISPLAY:1, TYPE:"text" },
        document_status:      { HEADER:"Status",          DISPLAY:1, TYPE:"label",  /*SELECT:status*/ },
        document_privacy:     { HEADER:"Privacy",         DISPLAY:1, TYPE:"select", /*SELECT:privacy*/ },
        date_access:          { HEADER:"Accessible from", DISPLAY:1, TYPE:"date" },
        parent_id:            { HEADER:"Parent group",    DISPLAY:0, TYPE:"select", /*SELECT:parents*/ },
        user_role:            { HEADER:"Your&nbsp;role",  DISPLAY:1, TYPE:"label" },
      },
      list: {
        document_id:          { HEADER:"Document id",     DISPLAY:0, TYPE:"label" },
        document_upload:      { HEADER:"",                DISPLAY:1, TYPE:"upload" },
        document_name:        { HEADER:"File name",       DISPLAY:1, TYPE:"link", EDITABLE:0 },
        document_filename:    { HEADER:"",                DISPLAY:1, TYPE:"fileview" },
        document_description: { HEADER:"Description",     DISPLAY:1, TYPE:"text" },
        document_status:      { HEADER:"Status",          DISPLAY:1, TYPE:"label",  /*SELECT:status*/ },
        document_privacy:     { HEADER:"Privacy",         DISPLAY:1, TYPE:"select", /*SELECT:privacy*/ },
        date_access:          { HEADER:"Accessible from", DISPLAY:1, TYPE:"date" },
        parent_id:            { HEADER:"Parent group",    DISPLAY:0, TYPE:"select", /*SELECT:parents*/ },
        user_role:            { HEADER:"Your&nbsp;role",  DISPLAY:1, TYPE:"label" },
      },
      head: {
        document_name:        { HEADER:"Documents", DISPLAY:1, TYPE:"label" },
      },
      select: {
        document_id:          { HEADER:"Document id", DISPLAY:0, TYPE:"label" },
        document_name:        { HEADER:"Filename",    DISPLAY:1, TYPE:"link" },
        document_filename:    { HEADER:"View",        DISPLAY:1, TYPE:"file" },
      },
    },
  };
}; // constructor
