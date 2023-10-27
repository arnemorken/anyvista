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
 * __event validator class.__
 *
 * @class eventValidator
 * @constructor
 */
var eventValidator = function ()
{
};

eventValidator.prototype.validateUpdate = function (opt,view)
{
  let err = "";
  if (!opt.id && opt.id !== null)
    err += "Id missing. ";

  let elem_id_base = view.getIdBase()+"_"+opt.type+"_"+opt.mode+"_"+opt.id_str;

  let nameid1 = elem_id_base+"_event_name .itemEdit";
  let nameid2 = elem_id_base+"_event_name .itemUnedit";
  if ((jQuery("#"+nameid1).length != 0 && !jQuery("#"+nameid1).val()) &&
      (jQuery("#"+nameid2).length != 0 && !jQuery("#"+nameid2).val()))
      err += "Event name missing. ";

  let date_start_id = elem_id_base+"event_date_start .itemEdit";
  if (jQuery("#"+date_start_id).length > 0 && jQuery("#"+date_start_id).val()) {
    let dstr = jQuery("#"+date_start_id).val();
    if (!isLegalDate(dstr))
      err += "Illegal start date. ";
  }
  let date_end_id = elem_id_base+"event_date_end .itemEdit";
  if (jQuery("#"+date_end_id).length > 0 && jQuery("#"+date_end_id).val()) {
    let dstr = jQuery("#"+date_end_id).val();
    if (!isLegalDate(dstr))
      err += "Illegal end date. ";
  }
  let date_join_id = elem_id_base+"event_date_join .itemEdit";
  if (jQuery("#"+date_join_id).length > 0 && jQuery("#"+date_join_id).val()) {
    let dstr = jQuery("#"+date_join_id).val();
    if (!isLegalDate(dstr))
      err += "Illegal join date. ";
  }
  let date_pay_id = elem_id_base+"event_date_pay .itemEdit";
  if (jQuery("#"+date_pay_id).length > 0 && jQuery("#"+date_pay_id).val()) {
    let dstr = jQuery("#"+date_pay_id).val();
    if (!isLegalDate(dstr))
      err += "Illegal pay date. ";
  }
  return err;
};
