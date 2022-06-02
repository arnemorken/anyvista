"use strict";
/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2022 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ****************************************************************************************/
/**
 * __user filter class.__
 *
 * @class userFilter
 * @constructor
 */
var userFilter = function (options)
{
  let model      = options ? options.model    : null;
  let permission = model   ? model.permission : null;
  let data_id    = model   ? model.id         : null;

  this.is_logged_in = permission && parseInt(permission.current_user_id) > 0;
  this.is_new       = (data_id == "new" || parseInt(data_id) == -1);
  this.is_admin     = permission && permission.is_admin;
  this.is_me        = permission && parseInt(permission.current_user_id) == parseInt(data_id);

  this.filters = {
    user: {
      item: {
        user_id:         { HEADER:"User id",          DISPLAY:0, TYPE:"label"},
        user_login:      { HEADER:"User login:",      DISPLAY:1, TYPE:"link"},
        display_name:    { HEADER:"Disp name:",       DISPLAY:1, TYPE:"link"},
        user_name:       { HEADER:"User name:",       DISPLAY:1, TYPE:"link"},
        first_name:      { HEADER:"First name:",      DISPLAY:1, TYPE:"text"},
        last_name:       { HEADER:"Last name:",       DISPLAY:1, TYPE:"text"},
        user_date_birth: { HEADER:"Birth date",       DISPLAY:1, TYPE:"date" },
        user_telephone:  { HEADER:"Telephone",        DISPLAY:1, TYPE:"text" },
        user_email:      { HEADER:"Email:",           DISPLAY:1, TYPE:"email"},
        user_url:        { HEADER:"Web:",             DISPLAY:1, TYPE:"text"},
        user_desc:       { HEADER:"Description",      DISPLAY:0, TYPE:"textarea"},
        user_registered: { HEADER:"Registrert:",      DISPLAY:1, TYPE:"date"},
        user_attended:   { HEADER:"Att.",             DISPLAY:1, TYPE:"check",    FUNCTION:"dataSetAttended" },
        user_role:       { HEADER:"Role",             DISPLAY:1, TYPE:"label" },
        _HIDEBEGIN_:     { HEADER:"[Change password]",DISPLAY:1,
                           HEADER2:"[Hide password]",            TYPE:"password_panel" },
        user_pass:       { HEADER:"Password",         DISPLAY:1, TYPE:"password" },
        user_pass_again: { HEADER:"Password again",   DISPLAY:1, TYPE:"password" },
        _HIDEEND_:       { HEADER:"",                 DISPLAY:1, TYPE:"password_panel" },
      },
      list: {
        user_id:         { HEADER:"User id",          DISPLAY:0, TYPE:"label" },
        user_login:      { HEADER:"User login",       DISPLAY:1, TYPE:"link"},
        display_name:    { HEADER:"Disp name",        DISPLAY:1, TYPE:"link"},
        user_name:       { HEADER:"User name",        DISPLAY:1, TYPE:"link"},
        first_name:      { HEADER:"First name",       DISPLAY:1, TYPE:"text"},
        last_name:       { HEADER:"Last name",        DISPLAY:0, TYPE:"text"},
        user_date_birth: { HEADER:"Birth date",       DISPLAY:0, TYPE:"date" },
        user_telephone:  { HEADER:"Telephone",        DISPLAY:1, TYPE:"text" },
        user_email:      { HEADER:"Email",            DISPLAY:1, TYPE:"email"},
        user_result:     { HEADER:"Result",           DISPLAY:1, TYPE:"function", FUNCTION:"displayUserResult" },
        user_attended:   { HEADER:"Att.",             DISPLAY:1, TYPE:"check",    FUNCTION:"dataSetAttended" },
        user_role:       { HEADER:"Role",             DISPLAY:1 /*!link_type*/ /* TODO */, TYPE:"label" },
      },
      head: {
        user_name:       { HEADER:"User name",        DISPLAY:1, TYPE:"label" },
        display_name:    { HEADER:"Disp name",        DISPLAY:1, TYPE:"link"},
      },
      select: {
        user_id:         { HEADER:"User id",          DISPLAY:0, TYPE:"label" },
        user_name:       { HEADER:"User name",        DISPLAY:1, TYPE:"link"},
        first_name:      { HEADER:"First name",       DISPLAY:0, TYPE:"text"},
        last_name:       { HEADER:"Last name",        DISPLAY:0, TYPE:"text"},
      },
    },
  };
}; // constructor
