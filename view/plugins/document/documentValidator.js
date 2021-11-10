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
  if (!opt.id && opt.id != 0)
    err += "Id missing. ";
  let elem_id_base = view.getBaseId()+"_"+opt.type+"_"+opt.kind+"_"+opt.id_str;
  let nameid1 = elem_id_base+"_document_name .itemEdit";
  let nameid2 = elem_id_base+"_document_name .itemUnedit";
  if (($("#"+nameid1).length != 0 && !$("#"+nameid1).val()) &&
      ($("#"+nameid2).length != 0 && !$("#"+nameid2).val()))
      err += "Document name missing. ";
  return err;
}; // validateUpdate
