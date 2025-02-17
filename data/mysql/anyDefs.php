<?php
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
define("gServer",           "//localhost/");
define("gHomeFolder",       "Prosjekter/testserver/wp-content/plugins/anyvista/");
define("gThirdpartyFolder", "Prosjekter/thirdparty/");
define("gSkin",             "default");

//////////////////////////////////////////////////////////////////
// Do not edit below unless you really know what you are doing. //
//////////////////////////////////////////////////////////////////

// Version number
define("gVersion", "0.1.0.beta");

// Paths
$docroot = $_SERVER['DOCUMENT_ROOT'];
define("gHomePath",     $docroot . "/" . gHomeFolder);
define("gAnyvistaURL",  gServer . gHomeFolder);

// Data source
define("gDataScript",   "data/mysql/anyGetData.php"); // Relative to gHomeFolder
define("gDataSource",   $docroot . "/" . gHomeFolder . "/" . gDataScript);

// File upload
define("gUploadFolder", "upload/"); // Relative to gHomeFolder
define("gUploadPath",   $docroot . "/" . gHomeFolder . "/" . gUploadFolder);

//
// Thirdparty stuff
//

// anyPaginator
define("gAnyPaginatorURL",  gServer          . gThirdpartyFolder . "anypaginator/");
define("gAnyPaginator_css", gAnyPaginatorURL . "anypaginator-1.1.0.min.css");
define("gAnyPaginator_js",  gAnyPaginatorURL . "anypaginator-1.1.0.min.js");

// jQuery / jQuery widget factory
define("gjQueryURL",        gServer          . gThirdpartyFolder . "jquery/");
define("gjQuery_js",        gjQueryURL       . "jquery-3.7.1.min.js");
define("gjQueryWidgetURL",  gServer          . gThirdpartyFolder . "jquery/");
define("gjQueryWidget_js",  gjQueryWidgetURL . "jquery-widget-1.12.1.min.js");

// W3CSS
define("gW3CSSURL",         gServer          . gThirdpartyFolder . "w3css/");
define("gW3CSS_css",        gW3CSSURL        . "w3.css");

// Font Awesome
define("gFontAwesomeURL",   gServer          . gThirdpartyFolder . "fontawesome/css/");
define("gFontAwesome_css",  gFontAwesomeURL  . "fontawesome.css");

// TinyMCE
define("gTinyMCEURL",       gServer          . gThirdpartyFolder . "tinymce/");
define("gTinyMCE_js",       gTinyMCEURL      . "tinymce.min.js");

// AlaSQL
define("gAlaSQLURL",        gServer          . gThirdpartyFolder . "alasql/");
define("gAlaSQL_js",        gAlaSQLURL       . "alasql.min.js");

//
// Wordpress stuff
//
define("WP_PLUGIN",""); // Comment out if using the server API, but not as a Wordpress plugin
if (defined("WP_PLUGIN")) {
  define("gWordpressURL", gServer . "Prosjekter/testserver/");
  define("gWProot", dirname(dirname(dirname(dirname(dirname(dirname(__FILE__))))))); // Path to wp-load.php
  define("gWPLoad", gWProot . "/wp-load.php"); // Wordpress functions
  // The names of user tables and columns depend on whether we run against a Wordpress database or not
  define('ANY_DB_USER_TABLE',    'wp_users');     // Name of user table
  define('ANY_DB_USERMETA_TABLE','wp_usermeta');  // Name of user meta table
  define('ANY_DB_USER_ID',       'ID');           // Name of id key in user table
  define('ANY_DB_USER_NAME',     'display_name'); // Name of name key in user table
  define('ANY_DB_USER_META_ID',  'umeta_id');     // Name of id key in user meta table
  define('ANY_DB_USER_LOGIN',    'user_login');   // Name of user login in user table
  require_once "wordpress/wpPermission.php";
}
else {
  define('ANY_DB_USER_TABLE',    'any_user');     // Name of user table
  define('ANY_DB_USERMETA_TABLE','any_usermeta'); // Name of user meta table
  define('ANY_DB_USER_ID',       'user_id');      // Name of id key in user table
  define('ANY_DB_USER_NAME',     'user_name');    // Name of name key in user table
  define('ANY_DB_USER_META_ID',  'meta_id');      // Name of id key in user meta table
  define('ANY_DB_USER_LOGIN',    'user_login');   // Name of user login in user table
}
?>
