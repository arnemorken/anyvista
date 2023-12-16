/* jshint sub:true */
/* jshint esversion: 9 */
/* globals gServer,gHomeFolder, */
"use strict";

var anyTableFactory = function (connection)
{
  this.connection = connection;
}; // constructor

//
// Creates a table class of type `type`.
// Does not create the actual database table.
// TODO! What if class already exists (script is loaded)?
//
anyTableFactory.prototype.createClass = async function(className,parameters,callback)
{
  this.error = "";
  if (!className) {
    this.error = "Class name missing. "; // TODO! i18n
    console.error(this.error);
    return null;
  }
  let res = await this._createClass(className,parameters,callback);
  return res;
}; // createClass

anyTableFactory.prototype._createClass = function(className,parameters,callback)
{
  try {
  var head = document.getElementsByTagName("head")[0];
  var js   = document.createElement("script");
  var path = gServer+gHomeFolder+"data/alasql/types/" + className + ".js";
  //console.log("loading "+path);
  let self = this;
  js.async = false;
  js.src   = path;
  let res = new Promise( function(resolve) {
    js.addEventListener("load", function() {
      //console.log("creating class "+className);
      let table_class = new window[className](self.connection,parameters);
      table_class.className = className;
      //if (callback)
      //  callback(table_class);
      return resolve(table_class);
    });
    js.onerror = function(e){
      let errstr = "Could not find "+path;
      //console.error(errstr);
      self.error = errstr;
      return resolve({error: errstr});
    };
    head.appendChild(js);
  });
  return res;
  }
  catch (err) {
    console.log(err);
  }
}; // _createClass

function isScriptLoaded(src)
{
  return Boolean(document.querySelector('script[src="' + src + '"]'));
}
