"use strict";
/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2024 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ****************************************************************************************/
//
// User-editable "constants" that define some basic properties of the anyVista API.
//
var gSource        = "remote";
var gServer        = "//localhost/";
var gHomeFolder    = "Prosjekter/testserver/wp-content/plugins/anyvista/";
var gThirdpartyPHP = "Prosjekter/testserver/php/";
var gSkin          = "default";

//////////////////////////////////////////////////////////////////
// Do not edit below unless you really know what you are doing. //
//////////////////////////////////////////////////////////////////

var gVersion = "0.1.0.beta";

var gDataScript   = "data/mysql/anyGetData.php"; // Relative to gHomeFolder
var gUploadScript = "ajaxfileupload.php";        // Relative to gThirdpartyPHP
var gUploadFolder = "upload/";                   // Relative to gHomeFolder

var any_defs = {
  dataScript:   gServer + gHomeFolder + gDataScript,      // URL of the data source script
  uploadScript: gServer + gThirdpartyPHP + gUploadScript, // URL of the upload script
  uploadURL:    gServer + gHomeFolder + gUploadFolder,    // URL of the upload folder
  uploadFolder: gUploadFolder,                            // Name of the upload folder
};