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
 */
/**
 * __user filter class.__
 *
 * @class userFilter
 * @constructor
 */
var userFilter = function (options)
{
/*
  let data = null;
  let id   = null;
  if (options.model) {
    id = options.model.id; // TODO
    if (id)
      data = options.model.dataSearch({id:id});
  }
  let link_type = null;
  let link_id   = null;
  if (data && data[id]) {
    link_type = data[id].link_type;
    link_id   = data[id].link_id;
  }
*/
  this.filters = {
    user: {
      item: {
        user_id:         { HEADER:"User id",          DISPLAY:0, HTML_TYPE:"label"},
        user_login:      { HEADER:"User login:",      DISPLAY:1, HTML_TYPE:"link"},
        display_name:    { HEADER:"Disp name:",       DISPLAY:1, HTML_TYPE:"link"},
        user_name:       { HEADER:"User name:",       DISPLAY:1, HTML_TYPE:"link"},
        first_name:      { HEADER:"First name:",      DISPLAY:1, HTML_TYPE:"text"},
        last_name:       { HEADER:"Last name:",       DISPLAY:1, HTML_TYPE:"text"},
        user_date_birth: { HEADER:"Birth date",       DISPLAY:1, HTML_TYPE:"date" },
        user_telephone:  { HEADER:"Telephone",        DISPLAY:1, HTML_TYPE:"text" },
        user_email:      { HEADER:"Email:",           DISPLAY:1, HTML_TYPE:"email"},
        user_url:        { HEADER:"Web:",             DISPLAY:1, HTML_TYPE:"text"},
        user_desc:       { HEADER:"Description",      DISPLAY:0, HTML_TYPE:"textarea"},
        user_registered: { HEADER:"Registrert:",      DISPLAY:1, HTML_TYPE:"date"},
        user_attended:   { HEADER:"Att.",             DISPLAY:1, HTML_TYPE:"check",    OBJ_FUNCTION:"dataSetAttended" },
        user_role:       { HEADER:"Role",             DISPLAY:1, HTML_TYPE:"label" },
        _HIDEBEGIN_:     { HEADER:"[Change password]",DISPLAY:1,
                           HEADER2:"[Hide password]",            HTML_TYPE:"password_panel" },
        user_pass:       { HEADER:"Password",         DISPLAY:1, HTML_TYPE:"password" },
        user_pass_again: { HEADER:"Password again",   DISPLAY:1, HTML_TYPE:"password" },
        _HIDEEND_:       { HEADER:"",                 DISPLAY:1, HTML_TYPE:"password_panel" },
      },
      list: {
        user_id:         { HEADER:"User id",          DISPLAY:0, HTML_TYPE:"label" },
        user_login:      { HEADER:"User login",       DISPLAY:1, HTML_TYPE:"link"},
        display_name:    { HEADER:"Disp name:",       DISPLAY:1, HTML_TYPE:"link"},
        user_name:       { HEADER:"User name",        DISPLAY:1, HTML_TYPE:"link"},
        first_name:      { HEADER:"First name",       DISPLAY:1, HTML_TYPE:"text"},
        last_name:       { HEADER:"Last name",        DISPLAY:0, HTML_TYPE:"text"},
        user_date_birth: { HEADER:"Birth date",       DISPLAY:0, HTML_TYPE:"date" },
        user_telephone:  { HEADER:"Telephone",        DISPLAY:1, HTML_TYPE:"text" },
        user_email:      { HEADER:"Email",            DISPLAY:1, HTML_TYPE:"email"},
        user_result:     { HEADER:"Result",           DISPLAY:1, HTML_TYPE:"function", OBJ_FUNCTION:"displayUserResult" },
        user_attended:   { HEADER:"Att.",             DISPLAY:1, HTML_TYPE:"check",    OBJ_FUNCTION:"dataSetAttended" },
        user_role:       { HEADER:"Role",             DISPLAY:1 /*!link_type*/ /* TODO */, HTML_TYPE:"label" },
      },
      head: {
        user_name:       { HEADER:"User name",        DISPLAY:1, HTML_TYPE:"label" },
        display_name:    { HEADER:"Disp name",        DISPLAY:1, HTML_TYPE:"link"},
      },
      select: {
        user_id:         { HEADER:"User id",          DISPLAY:0, HTML_TYPE:"label" },
        user_name:       { HEADER:"User name",        DISPLAY:1, HTML_TYPE:"link"},
        first_name:      { HEADER:"First name",       DISPLAY:0, HTML_TYPE:"text"},
        last_name:       { HEADER:"Last name",        DISPLAY:0, HTML_TYPE:"text"},
      },
    },
  };
}; // constructor
