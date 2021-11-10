"use strict";
/****************************************************************************************
 *
 * anyList is copyright (C) 2011-2021 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyList Commercial License for commercial use.
 * Get licences here: http://balanse.info/anylist/license/ (coming soon).
 *
 ****************************************************************************************/
/**
 * __document model class.__
 *
 * @class documentDataModel
 * @constructor
 */
var documentDataModel = function (options)
{
  this.type     = "document";
  this.id_key   = "document_id";
  this.name_key = "document_name";
  anyDataModel.call(this,options);
};

documentDataModel.prototype = new anyDataModel(null);
documentDataModel.prototype.constructor = documentDataModel;
