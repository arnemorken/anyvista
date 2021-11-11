<?php
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
define("gServer",           "//localhost/");
define("gHomeFolder",       "Prosjekter/testserver/wp-content/plugins/anylist/");
define("gThirdpartyFolder", "Prosjekter/testserver/javascript/");
define("gSkin",             "default");

//
// Do not edit below unless you really know what you are doing.
//

// Version number
define("gVersion", "0.1.0");

// Data source
define("gDataScript",       "data/anyGetData.php"); // Relative to gHomeFolder

// Paths
define("gHomePath",   $_SERVER['DOCUMENT_ROOT']."/".gHomeFolder);
define("gAnyListURL", gServer . gHomeFolder);

define("gDataSource", $_SERVER['DOCUMENT_ROOT'] . "/" . gHomeFolder . "/" . gDataScript);

//
// Thirdparty stuff
//

// jQuery / jQueryUI
define("gjQueryURL",        gServer            . gThirdpartyFolder . "jquery/");
define("gjQuery_js",        gjQueryURL         . "jquery-3.6.0.min.js");
define("gjQueryWidgetURL",  gServer            . gThirdpartyFolder . "jquery/");
define("gjQueryWidget_js",  gjQueryWidgetURL   . "jquery-widget-1.12.1.min.js");

// W3CSS
define("gW3CSSURL",         gServer            . gThirdpartyFolder . "w3css/");
define("gW3CSS_css",        gW3CSSURL          . "w3.css");

// Font Awesome
define("gFontAwesomeURL",   gServer            . gThirdpartyFolder . "fontawesome/");
define("gFontAwesome_css",  gFontAwesomeURL    . "fa.min.css");

// Wordpress stuff
define("gWordpressURL",     gServer            . "Prosjekter/testserver/");
//define("WP_PLUGIN",""); // Comment out if using the server API, but not as a Wordpress plugin
define("gWProot", dirname(dirname(dirname(dirname(dirname(__FILE__)))))); // Path to wp-load.php
define("gWPLoad", gWProot . "/wp-load.php"); // Wordpress functions
?>
