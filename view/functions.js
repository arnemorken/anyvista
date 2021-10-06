"use strict";
/*
 ****************************************************************************************
 *
 * anyList is copyright (C) 2011-2021 Arne D. Morken and Balanse Software.
 *
 * @license AGPLv3.0 for open source use or anyList Commercial License for commercial use.
 * Get licences here: http://balanse.info/anylist/license/ (coming soon).
 *
 ****************************************************************************************
 */
Object.size = function (obj)
{
  let objsize = 0;
  for (let key in obj)
    if (obj.hasOwnProperty(key))
      objsize++;
  return objsize;
};

let isInt = function (obj)
{
  return !isNaN(obj) && parseInt(Number(obj)) == obj && !isNaN(parseInt(obj,10));
};

String.prototype.capitalize = function ()
{
  return this.charAt(0).toUpperCase() + this.slice(1);
};

let isFunction = function (functionToCheck)
{
  if (functionToCheck === undefined)
    return false;
  if (typeof functionToCheck == "function")
    return true;
  let getType = {};
  return getType.toString.call(functionToCheck) === "[object Function]";
};
