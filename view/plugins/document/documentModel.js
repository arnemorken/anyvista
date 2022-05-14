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
 * __document model class.__
 *
 * @class documentModel
 * @constructor
 */
var documentModel = function (options)
{
  this.type     = "document";
  this.id_key   = "document_id";
  this.name_key = "document_name";
  anyModel.call(this,options);
};

documentModel.prototype = new anyModel(null);
documentModel.prototype.constructor = documentModel;

documentModel.prototype.dataInit = function (options)
{
  anyModel.prototype.dataInit.call(this,options);

  let item = (this.id || this.id === 0) ? this.dataSearch({type:"document",id:this.id}) : null;
  if (item && item["document_header_image"])
    this.headerImage = item["document_header_image"];
  return this;
};
/*
documentModel.prototype.dbDelete = function (options)
{
  // Remove from database (shouldnt be necessary - the dbDeleteSuccess method should do both things)
  options.success = this.dbDeleteSuccess;
  options.context = this;
  return anyModel.prototype.dbDelete.call(this,options);
};

documentModel.prototype.dbDeleteSuccess = function (jqXHR,options)
{
  if (!options.filename) {
    let err = "File name missing. ";
    console.log(err);
    this.message = err;
    return false;
  }
  // Remove from disk
  let param_str = "?echo=y&type=document&cmd=del&del=ulf&ulf="+options.filename;
  let url  = any_defs.dataScript + param_str;
  let self = this;
  let req  = jQuery.getJSON(url,jQuery.proxy(this.dbDeleteSuccess,this,options));
  req.fail(function(jqXHR) { self.fileDeleteFailed(options.filename,jqXHR,self); });
};

documentModel.prototype.fileDeleteFailed = function (fname,jqXHR,context)
{
  let err = "Couldn't delete '"+fname+"' from disk. ";
  console.log(err);
  this.message = err;
  this.cbExecute();
};
*/