/* jshint sub:true */
/* jshint esversion: 9 */
/* globals gServer,gHomeFolder, */
"use strict";

/********************************************************************************************
 *                                                                                          *
 * anyVista is copyright (C) 2011-2024 Arne D. Morken and Balanse Software.                 *
 *                                                                                          *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use. *
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).                  *
 *                                                                                          *
 ********************************************************************************************/

var anyTableFactory = function (connection)
{
  this.connection = connection;
}; // constructor

//
// Creates a table class of type `type`.
// Does not create the actual database table.
//
anyTableFactory.prototype.createClass = function(className,parameters)
{
  this.error = "";
  if (!className) {
    this.error = "Class name missing. "; // TODO! i18n
    console.error(this.error);
    return null;
  }
  return this._createClass(className,parameters);
}; // createClass

anyTableFactory.prototype._createClass = function(className,parameters)
{
  try {
    let head = document.getElementsByTagName("head")[0];
    let js   = document.createElement("script");
    let path = parameters.path
               ? parameters.path
               : gServer+gHomeFolder+"data/alasql/types/";
    let fullpath = path + className + ".js";
    js.async = false;
    js.src   = fullpath;
    let self = this;
    if (!isScriptLoaded(js.src)) {
      //console.log("loading "+js.src);
      head.appendChild(js);
      return new Promise( function(resolve) {
        js.addEventListener("load", function() {
          let table_class = new window[className](self.connection,parameters);
          table_class.className = className;
          return resolve(table_class);
        });
        js.onerror = function(e){
          let errstr = "Could not find "+fullpath;
          console.error(errstr);
          self.error = errstr;
          return resolve({error: errstr});
        };
      });
    }
    else {
      //console.log(js.src+" already loaded");
      let table_class = new window[className](self.connection,parameters);
      table_class.className = className;
      return table_class;
    }
  }
  catch (err) {
    console.log(err);
  }
}; // _createClass

function isScriptLoaded(fname)
{
  let is_loaded = false;
  if (fname) {
    $('script').filter(function () {
      let scr = $(this).attr('src');
      if (scr) {
        let filename = fname.replace(/^.*[\\/]/, '');
        let scriptname = scr.replace(/^.*[\\/]/, '');
        is_loaded = is_loaded || (scriptname == filename);
      }
    });
  }
  return is_loaded;
}
