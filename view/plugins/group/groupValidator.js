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
 * __group validator class.__
 *
 * @class groupValidator
 * @constructor
 */
var groupValidator = function ()
{
};

groupValidator.prototype.validateUpdate = function (opt,view)
{
  let err = "";
  if (!opt.id && opt.id !== 0)
    err += "Id missing. ";

  let elem_id_base = view.getIdBase()+"_"+opt.type+"_"+opt.kind+"_"+opt.id_str;

  let nameid1 = elem_id_base+"_group_name .itemEdit";
  let nameid2 = elem_id_base+"_group_name .itemUnedit";
  if ((jQuery("#"+nameid1).length != 0 && !jQuery("#"+nameid1).val()) &&
      (jQuery("#"+nameid2).length != 0 && !jQuery("#"+nameid2).val()))
      err += "Group name missing. ";

  let typeid1 = elem_id_base+"_group_type .itemEdit";
  let typeid2 = elem_id_base+"_group_type .itemUnedit";
  if ((jQuery("#"+typeid1).length != 0 && !jQuery("#"+typeid1).val()) &&
      (jQuery("#"+typeid2).length != 0 && !jQuery("#"+typeid2).val()))
      err += "Group type missing. ";

  return err;
};
