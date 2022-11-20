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
 * __document tabs view class.__
 *
 * @class documentViewTabs
 * @constructor
 */
(function($) {

$.widget("any.documentViewTabs", $.any.anyViewTabs, {
  // Default options
  options: {
    grouping:  "tabs",
    filters:   null, // If not set by the calling method, it will be set to default values
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

$.any.documentViewTabs.prototype._uploadClicked = function (event)
{
  let fname = $.any.anyView.prototype._uploadClicked.call(this,event);
  if (fname) {
    // Update the document_name and document_filename entries in model data
    this.model.dataUpdate({ id:     event.data.id,
                            data:   event.data.data,
                            type:   event.data.type,
                            indata: { document_name:     fname,
                                      document_filename: "", // Filename not yet determined
                                    },
                         });

    // Empty and disable the view button / input field until the file is actually uploaded
    let elem_id = this.id_base+"_"+event.data.type+"_"+event.data.kind+"_"+event.data.id_str+"_document_filename";
    if ($("#"+elem_id).length) {
      let str_deactivated = "File is not yet uploaded"; // TODO i18n
      $("#"+elem_id).find("a").attr("href","");
      $("#"+elem_id+" .itemText").text(fname);
      $("#"+elem_id+" .itemText").val(fname);
      $("#"+elem_id+" .fa-file").addClass("fa-disabled"); // Disable the view icon
      $("#"+elem_id+" .fa-file").prop("title", str_deactivated);
    }
    // Change the name link
    elem_id = this.id_base+"_"+event.data.type+"_"+event.data.kind+"_"+event.data.id_str+"_document_name";
    if ($("#"+elem_id+" .itemText").length) {
      $("#"+elem_id+" .itemText").text(fname);
      $("#"+elem_id+" .itemText").val(fname);
    }
  }
  return fname;
}; // _uploadClicked

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
  let local_fname = null;
  let file = window.any_current_file;
  if (!file) {
    this.model.message = "No file selected. ";
  }
  else {
    let d       = new Date();
    let thedate = d.getFullYear()+"-"+d.getMonth()+""+d.getDate()+"_"+d.getHours()+"-"+d.getMinutes()+"-"+d.getSeconds();
    let rnd     = Math.floor(Math.random() * 1000000);
    let ext     = file.name.split('.').pop();
    let uid     = this.model && this.model.permission ? this.model.permission.current_user_id : "u";
    if (uid<0)
      uid = "u";
    local_fname = uid+"_"+thedate+"_"+rnd+"."+ext;
    doUploadFile(any_defs.uploadScript,
                 file,
                 uid,
                 local_fname);
    window.any_current_file = null;
  }
  let e = this.model.error;
  let m = this.model.message;
  this.model.dataUpdate({ id:     event.data.id,
                          data:   event.data.data,
                          type:   event.data.type,
                          indata: { document_upload:   local_fname,
                                    document_filename: local_fname,
                                  },
                       });
  let res = $.any.anyView.prototype.dbUpdate.call(this,event);
  if (!res) {
    this.model.error   = e + this.model.error;
    this.model.message = m + this.model.message;
    if (this.model.error)   console.log(this.model.error);
    if (this.model.message) console.log(this.model.message);
  }
  this.showMessages(this.model);
  return res;
}; // dbUpdate

$.any.documentViewTabs.prototype.dbDeleteDialog = function (event)
{
  let opt = event.data;
  if (opt.data && opt.id && opt.data[opt.id] && opt.data[opt.id].is_new)
    return $.any.anyView.prototype.dbDeleteDialog.call(this,event);

  this.model.message = this.validateUpdate(opt);
  if (this.model.message) {
    console.log(this.model.message);
    this.showMessages(this.model);
    return false;
  }

  let it_id_base = this.getIdBase()+"_"+opt.type+"_"+opt.kind+"_"+opt.id_str;
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
  let res = $.any.anyView.prototype.dbDeleteDialog.call(this,event);
  return res;
}; // dbDeleteDialog

})($);

var documentViewTabs = function (options)
{
  if (!options)
    return null;
  return $.any.documentViewTabs(options);
};

documentViewTabs.prototype = new anyViewTabs(null);
documentViewTabs.prototype.constructor = documentViewTabs;
