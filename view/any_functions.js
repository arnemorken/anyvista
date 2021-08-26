"use strict";

Object.size = function (obj)
{
  let objsize = 0;
  for (let key in obj)
    if (obj.hasOwnProperty(key))
      objsize++;
  return objsize;
};

let isInt       = function (obj) { return !isNaN(obj) && parseInt(Number(obj)) == obj && !isNaN(parseInt(obj,10)); };
