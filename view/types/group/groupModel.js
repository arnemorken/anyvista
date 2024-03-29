/* jshint esversion: 9 */
/* globals anyModel, */
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
 * __group model class.__
 *
 * @class groupModel
 * @constructor
 */
var groupModel = function (options)
{
  this.type     = "group";
  this.id_key   = "group_id";
  this.name_key = "group_name";
  anyModel.call(this,options);
};

groupModel.prototype = new anyModel(null);
groupModel.prototype.constructor = groupModel;
