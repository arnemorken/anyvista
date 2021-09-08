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
//
// User-editable "constants" that define some basic properties of the AnyList server API.
//
let gServer           = "//localhost/";
let gAnyListFolder    = "Prosjekter/testserver/wp-content/plugins/anylist/";
let gThirdpartyFolder = "Prosjekter/testserver/javascript/";
let gDataScript       = "data/anyGetData.php"; // Relative to gAnyListFolder

//
// Do not edit below unless you really know what you are doing
//
let gVersion = "1.0.0";

let any_defs = {
  dataScript:   gServer + gAnyListFolder + gDataScript,                            // URL of the data source script
};
