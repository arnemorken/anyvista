"use strict";
/****************************************************************************************
 *
 * anyList is copyright (C) 2011-2021 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyList Commercial License for commercial use.
 * Get licences here: http://balanse.info/anylist/license/ (coming soon).
 *
 ***************************************************************************************/
Object.size = function (obj)
{
  let objsize = 0;
  for (let key in obj)
    if (obj.hasOwnProperty(key))
      objsize++;
  return objsize;
};

// Filter input by regex, can be used to allow only numeric input values
(function($) {
  $.fn.inputFilter = function(inputFilter) {
    return this.on("input keydown keyup mousedown mouseup select contextmenu drop", function() {
      if (inputFilter(this.value)) {
        this.oldValue = this.value;
        this.oldSelectionStart = this.selectionStart;
        this.oldSelectionEnd = this.selectionEnd;
      } else if (this.hasOwnProperty("oldValue")) {
        this.value = this.oldValue;
        this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
      } else {
        this.value = "";
      }
    });
  };
}($));

var isInt = function (obj)
{
  return !isNaN(obj) && parseInt(Number(obj)) == obj && !isNaN(parseInt(obj,10));
};

String.prototype.capitalize = function ()
{
  return this.charAt(0).toUpperCase() + this.slice(1);
};

var isFunction = function (functionToCheck)
{
  if (functionToCheck === undefined)
    return false;
  if (typeof functionToCheck == "function")
    return true;
  let getType = {};
  return getType.toString.call(functionToCheck) === "[object Function]";
};

var doUploadFile = function (url,file,uid,local_fname)
{
  var form_data = new FormData();
  form_data.append("file", file);
  form_data.append("uid",  uid);
  form_data.append("fname",local_fname);
  var request = new XMLHttpRequest();
  request.open("POST", url);
  request.send(form_data);
  return true; // TODO! Check return value from server!
}; // doUploadFile

//
// Simple modal dialog
//
function w3_modaldialog(options)
{
  if (!options) {
    console.log("w3_modaldialog: options missing."); // TODO! i18n
    return;
  }
  let parentId       = options.parentId,
      elementId      = options.elementId,
      heading        = options.heading,
      contents       = options.contents,
      width          = options.width,
      ok             = options.ok,
      cancel         = options.cancel,
      okFunction     = options.okFunction,
      cancelFunction = options.cancelFunction,
      context        = options.context;
  if (!okFunction)
    okFunction = w3_modaldialog_close;
  if (!cancelFunction)
    cancelFunction = w3_modaldialog_close;

  let dia_id = "moddia_"+parentId+"_"+elementId;
  $("#"+dia_id).remove();
  let ok_btn_str    = ok     ? "<button id='"+dia_id+"_ok_btn'     type='button' class='w3-button' style='border:1px solid #aaa;'>Ok</button>" : "";
  let can_btn_str   = cancel ? "<button id='"+dia_id+"_cancel_btn' type='button' class='w3-button' style='border:1px solid #aaa;'>Cancel</button>" : "";
  let btn_panel_str = "<div class='w3-container w3-border-top w3-padding-small w3-light-grey'>"+
                      "&nbsp;"+
                      ok_btn_str+
                      "&nbsp;"+
                      can_btn_str+
                      "</div>";
  let con = (typeof contents == "string") ? contents : "<div id='"+parentId+"_dialog' style='padding-top:.7em;padding-bottom:.7em;border-top:1px solid #aaa;border-bottom:1px solid #aaa;'></div>";
  let str = "<div class='w3-modal' style='z-index:9999;padding-bottom:1em;' id='"+dia_id+"'>"+
            "<div class='w3-modal-content' style='width:"+width+";border:1px solid #555;overflow-x:auto;'>"+
            // Header
            "<header class='w3-container'>"+
            "<div class='w3-modaldialog-header' style='font-weight:bold;background:#eeeeee;padding-top:.5em;'>"+heading+"&nbsp;"+
            "<span onclick='$(\"#"+dia_id+"\").remove()' class='w3-button w3-display-topright'>&times;</span>"+
            "</div>"+
            "</header>"+
            // Contents
            con+
            // Buttons
            btn_panel_str+
            "</div>"+
            "</div>";
  let p = $("#"+parentId);
  p.append(str);
  $("#"+dia_id+"_ok_btn").on    ("click",context,$.proxy(okFunction,    context,options));
  $("#"+dia_id+"_cancel_btn").on("click",context,$.proxy(cancelFunction,context,options));
  $("#"+dia_id+"").css("display","block");
  // If contents is not a string, asssume it is a jQuery object and append it to the div created above
  if (typeof contents != "string") {
    let dia_con = $("#"+parentId+"_dialog");
    if (dia_con.length) {
      dia_con.append(contents);
      dia_con.css("display","block");
    }
  }
  return dia_id;
} // w3_modaldialog

// default cancel function
function w3_modaldialog_close(options)
{
  if (!options)
    return;
  let parentId  = options.parentId,
      elementId = options.elementId;
  let dia_id = "moddia_"+parentId+"_"+elementId;
  $("#"+dia_id).remove();
} // w3_modaldialog_close
