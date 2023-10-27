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
 * __user validator class.__
 *
 * @class userValidator
 * @constructor
 */
var userValidator = function ()
{
};

userValidator.prototype.validateUpdate = function (opt,view)
{
  let err = "";
  if (!opt.id && opt.id != 0)
    err += "Id missing. ";

  let elem_id_base = view.getIdBase()+"_"+opt.type+"_"+opt.mode+"_"+opt.id_str;

  let login_nameid = elem_id_base+"_user_login .itemEdit";
  let email_nameid = elem_id_base+"_user_email .itemEdit";
  let login_val    = $("#"+login_nameid).val();
  let email_val    = $("#"+email_nameid).val();
  let no_login     = !$("#"+login_nameid).length || !login_val;
  let no_email     = !$("#"+email_nameid).length || !email_val;
  let item = view.model.dataSearch({type:opt.type,id:opt.id,data:opt.data});
  if (!item || !item[opt.id])
    return false; // Should never happen
  let is_new = item[opt.id].is_new || (!opt.id && opt.id !== 0) || parseInt(opt.id) == -1

  // Validate display name
  let nameid0 = elem_id_base+"_display_name .itemEdit";
  let v0 = jQuery("#"+nameid0).val();
  if (jQuery("#"+nameid0).length != 0 && !v0)
      err += "Display name missing. ";

  // Validate login/email
  if (view.options.emailAsLogin) { // Email must be present, and user_login field is illegal
    if (!no_login)
      err += "Email should be used for login, not login name. ";
    if (no_email)
      err += "Email address missing. ";
    else {
      if (!emailIsValid(email_val))
        err += "Invalid email address. ";
    }
  }
  else { // user_login field must be present
    if (is_new) { // insert
      if (no_login)
        err += "Login name missing. ";
      if (!view.options.emailOptional && no_email) // user_login field required
        err += "Email address missing. ";
    }
    else { // update
      if (!no_login) {
        let user = view.model.dataSearch({type:"user",id:opt.id});
        if (!user || !user[opt.id])
          err += "No data. ";
        else {
            if (user[opt.id]["user_login"] !== login_val)
              err += "Cannot change user login name. ";
            $("#"+login_nameid).val(user[opt.id]["user_login"]);
            //$("#"+login_nameid).prop("readonly",true);
        }
      }
    }
  }

  // Validate gender
  let nameid1 = elem_id_base+"_gender .itemEdit";
  if (jQuery("#"+nameid1).length != 0 && !jQuery("#"+nameid1).val())
      err += "Gender missing. ";

  // Validate date of birth
  let nameid2 = elem_id_base+"_date_birth .itemEdit";
  if (jQuery("#"+nameid2).length != 0 && !jQuery("#"+nameid2).val())
      err += "Birth date missing. ";

  // Validate password
  if (is_new) { // New user must have password
    let user_passid  = elem_id_base+"_user_pass .itemEdit";
    let password     = $("#"+user_passid).val();
    if (!password) {
      err += "Password missing. ";
    }
    else {
      let pass_againid = elem_id_base+"_user_pass_again .itemEdit";
      let pass_again   = $("#"+pass_againid).val();
      if (!pass_again)
        err += "Confirm password. ";
      else
      if (password != pass_again)
        err += "Passwords do not match. ";
    }
  }
  else { // If a password is specified, it must be confirmed
    let user_passid = elem_id_base+"_user_pass .itemEdit";
    let password    = $("#"+user_passid).val();
    if (password) {
      let pass_againid = elem_id_base+"_user_pass_again .itemEdit";
      let pass_again   = $("#"+pass_againid).val();
      if (!pass_again)
        err += "Confirm password. ";
      else
      if (password != pass_again)
        err += "Passwords do not match. ";
    }
  }
  return err;
};
