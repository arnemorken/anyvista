/* jshint sub:true */
/* jshint esversion: 9 */
"use strict";

var anyTableFactory = function (connection)
{
  this.connection = connection;
}; // constructor

//
// Create a new table class, optionally also create the associated database table
//
anyTableFactory.prototype.create = function(className)
{
  if (!className) {
    this.error = "Class name missing. ";
    console.error(this.error);
    return false;
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
    let table_class = new window[className](this.connection);
    table_class.className = className;
    return table_class;
  }
  catch (err) {
    this.error = "Could not initialise "+className+":"+err;
    console.error(this.error);
    return false;
  }
}; // create

function isScriptLoaded(src)
{
  return Boolean(document.querySelector('script[src="' + src + '"]'));
}
