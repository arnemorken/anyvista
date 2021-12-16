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
// User-editable "constants" that define some basic properties of the anyList API.
//
var gServer        = "//localhost/";
var gHomeFolder    = "Prosjekter/testserver/wp-content/plugins/anylist/";
var gThirdpartyPHP = "Prosjekter/testserver/php/";
var gDataScript    = "data/anyGetData.php"; // Relative to gHomeFolder
var gUploadScript  = "ajaxfileupload.php";  // Relative to gThirdpartyPHP
var gUploadFolder  = "upload/";
var gSkin          = "default";

//////////////////////////////////////////////////////////////////
// Do not edit below unless you really know what you are doing. //
//////////////////////////////////////////////////////////////////

var gVersion = "0.0.3.alpha";

var any_defs = {
  dataScript:   gServer + gHomeFolder + gDataScript,      // URL of the data source script
  uploadScript: gServer + gThirdpartyPHP + gUploadScript, // URL of the upload script
  uploadURL:    gServer + gHomeFolder + gUploadFolder,    // URL of the upload folder
  uploadFolder: gUploadFolder,                            // Name of the upload folder
};