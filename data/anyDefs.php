<?php
/**
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
// User-editable "constants" that define some basic properties of the AnyList API.
//
define("gServer",           "//localhost/");
define("gAnyListFolder",    "Prosjekter/testserver/wp-content/plugins/anylist/");
define("gThirdpartyFolder", "Prosjekter/testserver/javascript/");
define("gSkin",             "default");

//
// Do not edit below unless you really know what you are doing.
//

// Version number
define("gVersion", "0.1.0");

// Data source
define("gDataScript",       "data/anyGetData.php"); // Relative to gAnyListFolder

// Paths
define("gHomePath",   $_SERVER['DOCUMENT_ROOT']."/".gAnyListFolder);
define("gAnyListURL", gServer . gAnyListFolder);

define("gDataSource", $_SERVER['DOCUMENT_ROOT'] . "/" . gAnyListFolder . "/" . gDataScript);

//
// Thirdparty stuff
//

// jQuery / jQueryUI
define("gjQueryURL",        gServer            . gThirdpartyFolder . "jquery/");
define("gjQuery_js",        gjQueryURL         . "jquery-3.6.0.min.js");
define("gjQueryWidgetURL",  gServer            . gThirdpartyFolder . "jquery/");
define("gjQueryWidget_js",  gjQueryWidgetURL   . "jquery-widget-1.12.1.min.js");

// Font Awesome
define("gFontAwesomeURL",   gServer            . gThirdpartyFolder . "fontawesome/");
define("gFontAwesome_css",  gFontAwesomeURL    . "fa.min.css");
?>
