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
 * __user model class.__
 *
 * @class userModel
 * @constructor
 */
var userModel = function (options)
{
  this.type     = "user";
  this.id_key   = "user_id";
  this.name_key = "user_name";
  anyModel.call(this,options);
};

userModel.prototype = new anyModel(null);
userModel.prototype.constructor = userModel;

// Example method
userModel.prototype.dataSetAttended = function (type,kind,id,val)
{
  let item = (id || id === 0) ? this.dataSearch({type:type,id:id}) : null;
  if (!item)
    return false;

  return true;
}; // dataSetAttended
