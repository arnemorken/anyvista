/* jshint esversion: 9 */
/* globals $, */
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
 * __document validator class.__
 *
 * @class documentValidator
 * @constructor
 */
var documentValidator = function ()
{
};

documentValidator.prototype.validateUpdate = function (opt,view)
{
  let err = "";

  let elem_id_base = view.getIdBase()+"_"+opt.type+"_"+opt.mode+"_"+opt.id_str;

  let nameid = elem_id_base+"_document_name";
  if ($("#"+nameid).length == 0 || !$("#"+nameid).text())
    err += "Document name missing. ";

  return err;
}; // validateUpdate
