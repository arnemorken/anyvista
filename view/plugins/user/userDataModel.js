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
 * __user model class.__
 *
 * @class userDataModel
 * @constructor
 */
var userDataModel = function (options)
{
  this.type     = "user";
  this.id_key   = "user_id";
  this.name_key = "user_name";
  anyDataModel.call(this,options);
};

userDataModel.prototype = new anyDataModel(null);
userDataModel.prototype.constructor = userDataModel;

// Example method
userDataModel.prototype.dataSetAttended = function (type,kind,id,val)
{
  let item = (id || id === 0) ? this.dataSearch({type:type,id:id}) : null;
  if (!item)
    return false;

  return true;
}; // dataSetAttended
