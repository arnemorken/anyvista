<!--
 ****************************************************************************************
 *
 * anyList is copyright (C) 2011-2021 Arne D. Morken and Balanse Software.
 *
 * @license AGPLv3.0 for open source use or anyList Commercial License for commercial use.
 * Get licences here: http://balanse.info/anylist/license/ (coming soon).
 * 
 ****************************************************************************************
-->
<?php
//
// User-editable "constants" that define some basic properties of the AnyList API.
//
define("gServer",           "//localhost/");
define("gAnyListFolder",    "Prosjekter/testserver/wp-content/plugins/anylist/");
define("gThirdpartyFolder", "Prosjekter/testserver/javascript/");
define("gDataScript",       "data/GetData.php");  // Relative to gAnyListFolder

//
// Do not edit below unless you really know what you are doing.
//
define("gVersion", "1.0.0");

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
?>
