"use strict";
/****************************************************************************************
 *
 * anyList is copyright (C) 2011-2021 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyList Commercial License for commercial use.
 * Get licences here: http://balanse.info/anylist/license/ (coming soon).
 *
 ****************************************************************************************/
//
// User-editable "constants" that define some basic properties of the server API.
//
var gServer           = "//localhost/";
var gHomeFolder       = "Prosjekter/testserver/wp-content/plugins/anylist/";
var gThirdpartyFolder = "Prosjekter/testserver/javascript/";
var gDataScript       = "data/anyGetData.php"; // Relative to gHomeFolder
var gSkin             = "default";

//
// Do not edit below unless you really know what you are doing
//
var gVersion = "1.0.0";

var any_defs = {
  dataScript:   gServer + gHomeFolder + gDataScript,                               // URL of the data source script
};
