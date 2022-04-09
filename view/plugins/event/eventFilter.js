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
 * __event filter class.__
 *
 * @class eventFilter
 * @constructor
 */
var eventFilter = function (options)
{
  let model         = options ? options.model    : null;
  let data_id       = model   ? model.id         : null;
  let permission    = model   ? model.permission : null;
  this.is_logged_in = permission && parseInt(permission.current_user_id) > 0;
  this.is_new       = (data_id == "new" || parseInt(data_id) == -1);
  this.is_admin     = permission && permission.is_admin;
  let disp_result   = this.is_logged_in ? 1 : 0;
  this.filters = {
    event: {
      item: {
        event_id:            { HEADER:"Event id",           DISPLAY:0,       HTML_TYPE:"label_nolink" },
        group_id:            { HEADER:"Group",              DISPLAY:0,       HTML_TYPE:"label" },
        event_name:          { HEADER:"Event&nbsp;name",    DISPLAY:1,       HTML_TYPE:"link" },
        event_ingress:       { HEADER:"",                   DISPLAY:0,       HTML_TYPE:"textarea" },
      //event_place:         { HEADER:"Place",              DISPLAY:1,       HTML_TYPE:"select", OBJ_FUNCTION: "getPlaces" },
        event_date_start:    { HEADER:"Start&nbsp;date",    DISPLAY:1,       HTML_TYPE:"date" },
        event_date_end:      { HEADER:"End date",           DISPLAY:1,       HTML_TYPE:"date" },
        event_status:        { HEADER:"Status",             DISPLAY:1,       HTML_TYPE:"select", OBJ_SELECT: {"0":"Not started","1":"Ongoing","2":"Completed"} },
        event_description:   { HEADER:"Description",        DISPLAY:1,       HTML_TYPE:"textarea" },
        event_url:           { HEADER:"Website",            DISPLAY:1,       HTML_TYPE:"text",   EDITABLE:0 },
      //event_privacy:       { HEADER:"Privacy",            DISPLAY:1,       HTML_TYPE:"select", OBJ_SELECT: {"0":"Public","1":"Private","2":"Group"} },
        parent_id:           { HEADER:"Parent event",       DISPLAY:1,       HTML_TYPE:"select", OBJ_SELECT: "dbSearchParents" },
        event_max_users:     { HEADER:"Max. # participants",DISPLAY:1,       HTML_TYPE:"number" },
      //event_arranger_id:   { HEADER:"Arranger",           DISPLAY:1,       HTML_TYPE:"select", OBJ_FUNCTION: "getArrangers" },
      //event_instructor_id: { HEADER:"Instructor",         DISPLAY:1,       HTML_TYPE:"select", OBJ_FUNCTION: "getInstructors" },
        event_date_join:     { HEADER:"Signup date",        DISPLAY:1,       HTML_TYPE:"date" },
        event_date_pay:      { HEADER:"Payment date",       DISPLAY:1,       HTML_TYPE:"date" },
        event_price:         { HEADER:"Price",              DISPLAY:1,       HTML_TYPE:"number" },
        other_expenses:      { HEADER:"Other&nbsp;expenses",DISPLAY:1,       HTML_TYPE:"number" },
        user_attended:       { HEADER:"Attended",           DISPLAY:1,       HTML_TYPE:"check" },
        document_status:     { HEADER:"Doc&nbsp;status",    DISPLAY:1,       HTML_TYPE:"label" },
      },
      list: {
        event_id:            { HEADER:"Event id",           DISPLAY:0,       HTML_TYPE:"label" },
        group_id:            { HEADER:"Group",              DISPLAY:0,       HTML_TYPE:"label" },
        event_name:          { HEADER:"Event&nbsp;name",    DISPLAY:1,       HTML_TYPE:"link" },
        user_feedback:       { HEADER:"Upload",             DISPLAY:1,       HTML_TYPE:"upload" },
        event_place:         { HEADER:"Place",              DISPLAY:1,       HTML_TYPE:"select",   OBJ_SELECT: "getPlaces" },
        event_date_start:    { HEADER:"Start&nbsp;date",    DISPLAY:1,       HTML_TYPE:"date" },
        event_date_end:      { HEADER:"End date",           DISPLAY:0,       HTML_TYPE:"date" },
      //event_date_join:     { HEADER:"Signup date",        DISPLAY:isAdmin, HTML_TYPE:"date" },
      //event_date_pay:      { HEADER:"Payment date",       DISPLAY:isAdmin, HTML_TYPE:"date" },
      //event_price:         { HEADER:"Price",              DISPLAY:1,       HTML_TYPE:"number" },
        event_status:        { HEADER:"Status",             DISPLAY:1,       HTML_TYPE:"select",   OBJ_SELECT: {"0":"Not started","1":"Ongoing","2":"Completed"} },
        event_url:           { HEADER:"Website",            DISPLAY:0,       HTML_TYPE:"text",     EDITABLE:1 },
      //event_privacy:       { HEADER:"Privacy",            DISPLAY:1,       HTML_TYPE:"select",   OBJ_SELECT: {"0":"Public","1":"Private","2":"Group"} },
      //pay_total:           { HEADER:"User's price",       DISPLAY:isUser,  HTML_TYPE:"label" },
      //user_paid:           { HEADER:"Paid",               DISPLAY:isUser,  HTML_TYPE:"number" },
      //pay_balance:         { HEADER:"Balance",            DISPLAY:isUser,  HTML_TYPE:"label" },
        user_result:         { HEADER:"Resultat",           DISPLAY:disp_result, HTML_TYPE:"function", OBJ_FUNCTION: "displayUserResult" },
      //parent_id:           { HEADER:"Parent event",       DISPLAY:1,       HTML_TYPE:"select",   OBJ_SELECT: "dbSearchParents" },
      //other_expenses:      { HEADER:"Other&nbsp;expenses",DISPLAY:1,       HTML_TYPE:"number" },
        user_attended:       { HEADER:"Att.",               DISPLAY:1,       HTML_TYPE:"check" },
        document_status:     { HEADER:"Doc&nbsp;status",    DISPLAY:1,       HTML_TYPE:"label" },
      },
      head: {
        event_name:          { HEADER:"Events",             DISPLAY:1,       HTML_TYPE:"label" },
      },
      select: {
        event_id:            { HEADER:"Event id",           DISPLAY:0,       HTML_TYPE:"label" },
        event_name:          { HEADER:"Event&nbsp;name",    DISPLAY:1,       HTML_TYPE:"link" },
      }
    },
  };
}; // constructor
