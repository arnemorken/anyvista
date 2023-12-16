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
// Autocomplete
//
function w3_autocomplete(fieldOrFieldId,type,id,arr,onSelect,context)
{
  var inp = typeof fieldOrFieldId == "string" ? document.getElementById(fieldOrFieldId) : fieldOrFieldId;
  if (!inp) {
    console.error("autocomplete: input field missing");
    return;
  }
  if (!inp.id)
    inp.id = inp.parentElement.id+"_autoinput";
  // the autocomplete function takes two arguments,
  // the text field element and an array of possible
  // autocompleted values
  let currentFocus = -1;
  // execute a function when someone writes in the text field
  inp.addEventListener("input", function(e) {
      closeAllLists(); // close any already open lists of autocompleted values
      var a, b, i, val = this.value;
      if (!val || val.length < 3)
        return false;
      a = document.createElement("div"); // create a div element that will contain the items (values)
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      this.parentNode.appendChild(a); // append the div element as a child of the autocomplete container
      for (i = 0; i < arr.length; i++) {
        // check if the item contains the text field value
        if (arr[i].label && arr[i].label.toLowerCase().indexOf(val.toLowerCase()) !== -1) {
          b = document.createElement("div"); // create a div element for each matching element
          b.innerHTML =  "<strong>" + arr[i].label.substr(0, val.length) + "</strong>"; // make matching letter bold
          b.innerHTML += arr[i].label.substr(val.length);
          b.innerHTML += "<input type='hidden' id='"+arr[i].value+"' value='" + arr[i].label + "'>"; // input field that will hold the current array items value
          // execute a function when someone clicks on the item value (div element)
          b.addEventListener("click",
            function(e) {
              let inp_tags = this.getElementsByTagName("input");
              var name = inp_tags[0].value; // insert the value for the autocomplete text field
              var sel_id = inp_tags[0].id;
              inp.value = name;
              closeAllLists(); // close the list of autocompleted values, (or any other open lists of autocompleted values
              var pid = typeof fieldOrFieldId == "string" ? fieldOrFieldId : fieldOrFieldId.id;
              onSelect.call(context,type,sel_id,name,pid);
            }
          );
          a.appendChild(b);
        }
      }
  });
  // execute a function presses a key on the keyboard
  inp.addEventListener("keydown", function(e) {
      var x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) { // Arrow down
        currentFocus++; // increase the currentFocus variable
        addActive(x);   // make the current item more visible
      }
      else
      if (e.keyCode == 38) { // Arrow up
        currentFocus--; // decrease the currentFocus variable
        addActive(x);   // make the current item more visible
      }
      else
      if (e.keyCode == 13) { // Enter
        e.preventDefault(); // prevent the form from being submitted
        if (currentFocus > -1) {
          if (x)
            x[currentFocus].click(); // simulate a click on the "active" item
        }
        currentFocus = -1; // reset focus
      }
  });
  // a function to classify an item as "active"
  function addActive(x) {
    if (!x) return false;
    removeActive(x); // remove the "active" class on all items
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    x[currentFocus].classList.add("autocomplete-active"); // add class
  }
  // a function to remove the "active" class from all autocomplete items
  function removeActive(x) {
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  // close all autocomplete lists in the document, except the one passed as an argument
  function closeAllLists(elmnt) {
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
      x[i].parentNode.removeChild(x[i]);
    }
  }
}
// close autocomplete lists when someone clicks in the document
document.addEventListener("click",
  function (e) {
    closeAllLists(e.target);
  });
}

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

  let dia_id = elementId && elementId != "" ? parentId+"_"+elementId+"_moddia" : parentId+"_moddia";
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
  let str = "<div id='"+dia_id+"' class='w3-modal' style='z-index:9999;padding-bottom:1em;'>"+
            "<div class='w3-modal-content' style='width:"+width+";border:1px solid #555;overflow-x:auto;'>"+
            // Header
            "<header class='w3-container'>"+
            "<div class='w3-modaldialog-header' style='font-weight:bold;background:#eeeeee;padding-left:0.4em;padding-top:.5em;'>"+heading+"&nbsp;"+
            "<span onclick='w3_modaldialog_close(\""+parentId+"\",\""+elementId+"\")' class='w3-button w3-display-topright'>&times;</span>"+
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
  $("#"+dia_id+"_ok_btn").on      ("click",context,$.proxy(okFunction,    context,options));
  if (options.cancelFunction)
    $("#"+dia_id+"_cancel_btn").on("click",context,$.proxy(cancelFunction,context,options));
  else
    $("#"+dia_id+"_cancel_btn").on("click",context,$.proxy(cancelFunction,context,parentId,elementId));
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
function w3_modaldialog_close(parentId,elementId)
{
  if (!parentId)
    return;
  let dia_id = elementId && elementId != "" ? parentId+"_"+elementId+"_moddia" : parentId+"_moddia";
  $("#"+dia_id).remove();
  $(".fa-spin").hide(); // TODO! Temp. solution
} // w3_modaldialog_close

function w3_modaldialog_resize(options)
{
  let parentId  = options.parentId,
      elementId = options.elementId;
  let dia_id = elementId && elementId != "" ? parentId+"_"+elementId+"_moddia" : parentId+"_moddia";
  if (options.width)
    $("#"+dia_id).css("width", options.width);
  if (options.height)
    $("#"+dia_id).css("height",options.height);
} // w3_modaldialog_resize
