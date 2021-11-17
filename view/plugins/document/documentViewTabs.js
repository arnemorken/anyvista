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
 * __document tabs view class.__
 *
 * @class documentViewTabs
 * @constructor
 */
(function($) {

$.widget("any.documentViewTabs", $.any.View, {
  // Default options
  options: {
    filters: null, // If not set by the calling method, it will be set to default values
    linkIcons: {
      "event":    "fa fa-calendar",
      "user":     "fa fa-user",
      "document": "fa fa-book",
      "group":    "fa fa-users",
    },
  },

  // "Constructor"
  _create: function() {
    this._super();
    this.element.addClass("documentViewTabs");

    if (!this.options.filters) {
      let f = new documentFilter(this.options);
      this.options.filters = f.filters;
    }
    this.validator = new documentValidator();
  },

  _destroy: function() {
    this.options = null;
    this.element.removeClass("documentViewTabs");
    this._super();
  }
});

$.any.documentViewTabs.prototype.validateUpdate = function (options)
{
  if (!this.validator)
    return null;
  return this.validator.validateUpdate(options,this);
}; // validateUpdate

$.any.documentViewTabs.prototype.dbUpdate = function (event)
{
  let opt = event.data;
  let errstr = this.validateUpdate(opt);
  if (errstr) {
    this.model.error = errstr;
    console.log(this.model.error);
    this.showMessages(this.model);
    return false;
  }
  let file        = window.any_current_file;
  let d           = new Date();
  let thedate     = d.getFullYear()+"-"+d.getMonth()+""+d.getDate()+"_"+d.getHours()+"-"+d.getMinutes()+"-"+d.getSeconds();
  let rnd         = Math.floor(Math.random() * 1000000);
  let ext         = file.name.split('.').pop();
  let uid         = this.model && this.model.permission ? this.model.permission.current_user_id : "u";
  if (uid<0) uid  = "u";
  let local_fname = uid+"_"+thedate+"_"+rnd+"."+ext;
  doUploadFile(any_defs.uploadScript,
               file,
               uid,
               local_fname);
  window.any_current_file = null;

  this.model.dataUpdate({ id:     event.data.id,
                          data:   event.data.data,
                          type:   event.data.type,
                          indata: { document_filename: local_fname },
                        });
  return $.any.View.prototype.dbUpdate.call(this,event);
}; // dbUpdate

$.any.documentViewTabs.prototype.dbDeleteDialog = function (event)
{
  let opt = event.data;
  if (opt.data && opt.id && opt.data[opt.id] && opt.data[opt.id].is_new)
    return $.any.View.prototype.dbDeleteDialog.call(this,event);

  this.model.message = this.validateUpdate(opt);
  if (this.model.message) {
    console.log(this.model.message);
    this.showMessages(this.model);
    return false;
  }

  let it_id_base = this.getBaseId()+"_"+opt.type+"_"+opt.kind+"_"+opt.id_str;
  let docname_el = $("#"+it_id_base+"_document_name .itemText");
  let docname    = docname_el.text();
  let fname_el   = $("#"+it_id_base+"_document_filename .itemText");
  let fname      = fname_el.val();
  this.model.message = "";
  if (!docname)
    this.model.message += "Missing document name. ";
  if (!fname)
    this.model.message += "Missing file name. ";
  if (this.model.message) {
    console.log(this.model.message);
    this.showMessages(this.model);
  }
  if (!docname)
    return false;
  event.data.message = i18n.message.deleteByName.replace("%%", docname);
  let res = $.any.View.prototype.dbDeleteDialog.call(this,event);
  return res;
}; // dbDeleteDialog

})($);

var documentViewTabs = function (options)
{
  if (!options)
    return null;
  return $.any.documentViewTabs(options);
};

documentViewTabs.prototype = new anyView(null);
documentViewTabs.prototype.constructor = documentViewTabs;
