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

let isInt       = function (obj) { return !isNaN(obj) && parseInt(Number(obj)) == obj && !isNaN(parseInt(obj,10)); };
