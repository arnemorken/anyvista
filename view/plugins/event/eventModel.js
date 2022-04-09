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
 * __event model class.__
 *
 * @class eventModel
 * @constructor
 */
var eventModel = function (options)
{
  this.type     = "event";
  this.id_key   = "event_id";
  this.name_key = "event_name";
  anyModel.call(this,options);
};

eventModel.prototype = new anyModel(null);
eventModel.prototype.constructor = eventModel;

eventModel.prototype.dataInit = function (options)
{
  anyModel.prototype.dataInit.call(this,options);

  let item = (this.id || this.id === 0) ? this.dataSearch({type:"event",id:this.id}) : null;
  if (item && item["event_header_image"])
    this.headerImage = item["event_header_image"];
  return this;
};

eventModel.prototype.dbSetAttended = function (options)
{
  if (!options)
    return false;
  if (!isInt(options.id))
    return false;

  if (!isInt(options.link_id)) {
    let is_me    = this.permission && this.type == "user" && this.id == this.permission.current_user_id;
    let is_admin = this.permission && this.permission.is_admin;
    if (is_me || is_admin)
      options.link_id = this.permission.current_user_id;
  }
  let user_attended = (options.user_attended==0 ? 1 : 0);
  let item = this.dataSearch({type:"event",id:options.id});
  if (item)
    item["user_attended"] = user_attended;
  let param_str = "?echo=y&type="+this.type;
  param_str += "&cmd=upd"+
               "&upd=att"+
               "&att="     +user_attended+
               "&event_id="+options.id+
               "&user_id=" +options.link_id;
  let lf_str = "";
  if (options.link_type && options.link_id) {
    lf_str = "&link_type="+options.link_type+
             "&link_id="  +options.link_id;
  }
  param_str += lf_str;
  if (this.mode == "remote") { // Remote server call
    let self = this;
    let url = any_defs.dataScript + param_str;
    jQuery.getJSON(url)
    .done(function(jqXHR) { return self.dbSetAttendedSuccess(jqXHR,options); });
  }
  else {
    // TODO
    console.log("No local data source was found. ");
    this.cbExecute();
  }
  return true;
}; // dbSetAttended

eventModel.prototype.dbSetAttendedSuccess = function (jqXHR,options)
{
  let context = options.context ? options.context : this;
  if (jqXHR) {
    // Remove encapsulation, if it exists
    let serverdata = jqXHR;
    if (serverdata.JSON_CODE)
      serverdata = serverdata.JSON_CODE;
    context.message = serverdata.message;
    context.error   = serverdata.error;
  }
  if (context.cbExecute)
    context.cbExecute();
  return true;
}; // dbSetAttendedSuccess

eventModel.prototype.dbSearchGetURL = function (options)
{
  let url_str = anyModel.prototype.dbSearchGetURL.call(this,options);
  url_str += this.event_date_start ? "&event_date_start="+this.event_date_start : "";
  url_str += this.event_date_end   ? "&event_date_end="  +this.event_date_end   : "";
  return url_str;
}; // dbSearchGetURL

eventModel.prototype.dbUpdateGetURL = function (options)
{
  let url_str = anyModel.prototype.dbUpdateGetURL.call(this,options);
  url_str += "&user_id="+this.permission.current_user_id;
  return url_str;
}; // dbUpdateGetURL

/**
 * @method dataSearchUserLink
 * @description Search the item model for a user with the given id and return true if "user_attended" is set.
 * @param {integer} user_id
 * @return true if checked, false otherwise
 */
eventModel.prototype.dataSearchUserLink = function (user_id)
{
  if (!user_id)
    return null;
  let item = this.dataSearch({type:"user",id:user_id});
  if (!item || (!item[user_id] && !item["+"+user_id]))
    return null;
  return item[user_id].user_attended;
}; // dataSearchUserLink
