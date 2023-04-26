/* jshint sub:true */
/* jshint esversion: 9 */
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
anyTableFactory.prototype.createClass = function(className,parameters)
{
  if (!className) {
    this.error = "Class name missing. ";
    console.error(this.error);
    return null;
  }
  var head = document.getElementsByTagName('head')[0];
  var js   = document.createElement("script");
  var path = "types/" + className + ".js";
  if (!isScriptLoaded(path)) {
    //console.log("loading "+path);
    js.src = path;
  }
  try {
    head.appendChild(js);
    let table_class = new window[className](this.connection,parameters);
    table_class.className = className;
    return table_class;
  }
  catch (err) {
    this.error = "Could not initialise "+className+":"+err;
    console.error(this.error);
    return null;
  }
}; // createClass

function isScriptLoaded(src)
{
  return Boolean(document.querySelector('script[src="' + src + '"]'));
}
