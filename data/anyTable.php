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
if (defined("WP_PLUGIN")) {
  define('DB_USER_TABLE',    'wp_users');     // Name of user table
  define('DB_USERMETA_TABLE','wp_usermeta');  // Name of user meta table
  require_once "wordpress/wpPermission.php";
}
else {
  define('DB_USER_TABLE',    'any_user');     // Name of user table
  define('DB_USERMETA_TABLE','any_usermeta'); // Name of user meta table
}
require_once "permission.php";
require_once "anyTableFactory.php";
/**
 * __Class for interacting with an anyList database table.__
 * Inherits from `dbTable`, which manages the database connection.
 * Contains methods for doing search, insert, update and delete on a database table.
 * Supports user defined table format, as well as data in (Wordpress) meta tables.
 * The table format must be described in a table class that inherits from this class.
 * See `userTable.php` and `groupTable.php` for examples.
 *
 * Data structure:
 *
 * Data read from tables are transferred to the client in the following JSON format:
 *
 *        {
 *          'id':   '[id]',         // Optional. Has a value if searching for an item, null otherwise.
 *          'head': '[type]',       // Optional, but mandatory if 'data' and 'plugins' are specified.
 *          'data': {               // Optional, but mandatory if 'head' and 'plugins' are specified.
 *            '+[id]': {            // Optional
 *              'head':        '[type]',    // Mandatory
 *              '[type]_name': '[value]',   // Optional, but mandatory if any key / value pairs are given.
 *              '[key]':       '[value]',   // Optional. One or more key / value pairs.
 *              ...
 *              'data': {    // Optional
 *                '+[id]': { // Optional
 *                  'head' | 'item' | 'list': '[type]',         // Mandatory.
 *                  'parent_id':              '[id]',           // Optional. Contains the id of the level above, if of the same type.
 *                  'group_type':             '[group_type]',   // Optional. Only valid if [type] == 'group'.
 *                  'group_sort_order':       '[integer]',      // Optional. Only valid if [type] == 'group'.
 *                  '[key]':                  '[value]',        // Optional. One or more key / value pairs.
 *                  ...
 *                },
 *                ...
 *                'grouping':        'tabs',    // Optional
 *                'groupingFor':     '[type]',  // Optional, but mandatory if both 'grouping' and 'id' is specified.
 *                'groupingForId':   '[id]',    // Optional, but mandatory if both 'grouping' and 'id' is specified.
 *                'groupingForName': '[value]', // Optional, but mandatory if both 'grouping' and 'id' is specified.
 *              },
 *            }
 *            ...
 *          }
 *          'plugins': {                        // Optional
 *            [integer]: '[plugin name]',       // Optional. One or more plugin names.
 *            ...
 *          },
 *          'permission': {                     // Mandatory
 *            'current_user_id': '[id]',        // Mandatory
 *            'is_logged_in':    true | false,  // Mandatory
 *            'is_admin':        true | false,  // Mandatory
 *          },
 *          'message': '[string]',              // Optional
 *          'error':   '[string]',              // Optional
 *        }
 *
 * NOTE! When transferring the data structure from a server to the Javascript client the indices of the object will
 * automatically be converted to integers even if they are specified as strings on the server (PHP) side. I.e. "38"
 * will be converted to 38. Then the items in the data structured will be ordered numerically on the client (Javascript)
 * side, which may not be the desired behaviour. In order to avoid this, numeric indices are prefixed with a "+",and the
 * code on the client side then can maintain the ordering of the items.
 *
 * Server filters:
 *
 * Each type of data (i.e. each plugin) must have a corresponding filter which specifies whether each key of
 * the type should be included in database operations. The keys (e.g. "event_status") should be the same as
 * those in the corresponding filter, though not every name in the filter has to be present as a key. Also,
 * keys that are not described in the filter will be ignored. The filters are not part of the data structure
 * sent to the client, which uses its own filters for display. The server filters have the following format:
 *
 *      [key]: 1 | 0
 *
 * __Example:__ An event filter, where the fields "event_status" and "user_result" will be ignored:
 *
 *     {
 *       "event_id"         : 1,
 *       "event_name"       : 1,
 *       "event_date_start" : 1,
 *       "event_date_end"   : 1,
 *       "event_place"      : 1,
 *       "event_price"      : 1,
 *       "event_status"     : 0,
 *       "user_attended"    : 1,
 *       "user_result"      : 0,
 *     }
 *
 * @class anyTable
 * @constructor
 * @param {Array} options An array containing the following entries:
 *                        - "connection": Info about the database connection
 *                        - "tableDefs": An array containing the following entries:
 *                          - "tableName":          Name of the main table, e.g. "any_event".
 *                          - "tableNameMeta":      Name of the meta table, e.g. "any_eventmeta".
 *                          - "tableNameGroupLink": Name of the group link table for this table type, e.g. "any_event_group".
 *                          - "tableNameUserLink":  Name of the user link table for this table type, e.g. "any_event_user".
 *                          - "type":               Type of the table, e.g. "event".
 *                          - "idKey":              The id key used by the client, e.g. "event_id" or "user_id".
 *                          - "idKeyTable":         The id key used in the table, e.g. "event_id" or "ID".
 *                          - "idKeyMetaTable":     The id key used in the meta table, "event_id" or "user_id".
 *                          - "nameKey":            The name key used by the client and in the table, e.g. "event_name" or "login_name".
 *                          - "orderBy":            The field to sort by. e.g. "event_date_start".
 *                          - "metaId":             The name of the id foeld in the meta table, e.g. "meta_id" or "umeta_id".
 *                          - "fields":             An array containing the field names of the table.
 *                          - "fieldsMeta":         An array containing the name of the meta keys of the meta table.
 *                          - "fieldsGroup":        An array containing the field names of the group table.
 *                          - "fieldsLeftJoin":     An array containing the field names of the user link table.
 *                          - "filters":            Filters.
 *                          - "plugins":            An array containing the names of the plugins this table can interact with.
 * @example
 *      new anyTable($options);
 */
class anyTable extends dbTable
{
  protected $mTableDefs = null;

  protected $mTableName          = null,
            $mTableNameMeta      = null,
            $mTableNameGroupLink = null,
            $mTableNameUserLink  = null,
            $mTableNameGroup     = "any_group",
            $mTableNameUser      = DB_USER_TABLE;

  protected $mTableFields         = null,
            $mTableFieldsMeta     = null,
            $mTableFieldsGroup    = null,
            $mTableFieldsLeftJoin = null;

  protected $mType              = null,
            $mIdKey             = null,
            $mIdKeyTable        = null,
            $mIdKeyMetaTable    = null,
            $mNameKey           = null,
            $mId                = null, // Non-null if item, null if list
            $mMetaId            = null,
            $mListFor           = null, // Used by items that have associated lists
            $mListForId         = null, // Used by items that have associated lists
            $mData              = null, // List or item data
            $mFilters           = null,
            $mPermission        = null,
            $mOrderBy           = null,
            $sortFunction       = null;

  protected $mInsertSuccessMsg  = "",
            $mUpdateSuccessMsg  = "",
            $mDeleteSuccessMsg  = "",
            $mItemUnexists      = " not found. ",
            $mInsertNothingToDo = "Nothing to insert",
            $mUpdateNothingToDo = "Nothing to update",
            $mDeleteNothingToDo = "Nothing to delete";

  private   $mSumNumRowsChanged = 0,
            $mLastNumRows       = 0,
            $mPageSize          = 30,  // Number of items returned per page
            $mRecMax            = 100, // Used to avoid infinite recursion
            $mRecDepth          = 0;   // Recursion depth

  //
  // Constructor
  //
  public function __construct($connection,$defsOrType)
  {
    // Initialize permissions
    $wp   = defined("WP_PLUGIN") ? new wpPermission() : null;
    $perm = new Permission($wp);
    $this->mPermission = [
      "current_user_id" => $perm->getCurrentUserId(),
      "is_logged_in"    => $perm->isLoggedIn(),
      "is_admin"        => $perm->isAdmin(),
    ];
    $must_login  = Parameters::get("must_login") == "true";
    $is_new_user = $this->mType == "user" && (!$perm->isLoggedIn() || $perm->isAdmin());
    if ($must_login && !$perm->isLoggedIn() && !$is_new_user) {
      $this->setError("Login required. ");
      return;
    }
    // Set up the database connection
    parent::__construct($connection);
    if (!$this->getConnection()) {
      $this->setError("No connection to database. ");
      return;
    }
    // Initialize properties
    if (!$defsOrType) {
      $this->setError("Table definitions or type missing. ");
      return;
    }
    if (!$this->initProperties($defsOrType))
      return;

    // Filters should be defined in the options parameter, but may also
    // be specified / manipulated in the initFilters method.
    $this->initFilters($this->mFilters);

  } // constructor

  //
  // Set variables from table definitions or type.
  // Setting variables from type can be used in simple situations where
  // the plugin doesnt need to supply its own mTableDefs object.
  //
  private function initProperties($defsOrType)
  {
    $this->mError = "";
    if (!$defsOrType || (gettype($defsOrType) != "array" && gettype($defsOrType) != "string")) {
      $this->mError = "Unknown or missing parameter to initProperties. ";
      return false;
    }
    if (gettype($defsOrType) == "array") {
      // Table defs given, check if it is valid
      if (!$this->validateTableDefs($defsOrType))
        return false;
      // Set variables from table defs
      $this->mType               = $defsOrType["type"];
      $this->mTableName          = $defsOrType["tableName"];
      $this->mTableNameMeta      = $defsOrType["tableNameMeta"];
      $this->mTableNameGroupLink = $defsOrType["tableNameGroupLink"];
      $this->mTableNameUserLink  = $defsOrType["tableNameUserLink"];
      $this->mIdKey              = $defsOrType["idKey"];
      $this->mIdKeyTable         = $defsOrType["idKeyTable"];
      $this->mIdKeyMetaTable     = $defsOrType["idKeyMetaTable"];
      $this->mNameKey            = $defsOrType["nameKey"];
      $this->mOrderBy            = $defsOrType["orderBy"];
      $this->mMetaId             = $defsOrType["metaId"];

      // Set table fields, meta table fields and user link table fields
      $this->mTableFields         = $defsOrType["fields"];
      $this->mTableFieldsMeta     = $defsOrType["fieldsMeta"];
      $this->mTableFieldsGroup    = $defsOrType["fieldsGroup"];
      $this->mTableFieldsLeftJoin = $defsOrType["fieldsLeftJoin"];

      // Set table filters
      if (isset($defsOrType["filters"]))
        $this->mFilters = $defsOrType["filters"];

      // Set plugins
      if (isset($defsOrType["plugins"]))
        $this->mPlugins= $defsOrType["plugins"];
    }
    else
    if (gettype($defsOrType) == "string") {
      // Set minimal working values ("defsOrType" should be type)
      $this->mType               = $defsOrType;
      $this->mTableName          = "any_".$this->mType;
      $this->mTableNameMeta      = "any_".$this->mType."meta";
      $ltn = ["group",$this->mType];
      sort($ltn);
      $ltn = "any_".implode("_",$ltn);
      $this->mTableNameGroupLink = $ltn;
      $ltn = ["user",$this->mType];
      sort($ltn);
      $ltn = "any_".implode("_",$ltn);
      $this->mTableNameUserLink  = $ltn;
      $this->mIdKey              = $this->mType."_id";
      $this->mIdKeyTable         = $this->mType."_id";
      $this->mIdKeyMetaTable     = $this->mType."_id";
      $this->mNameKey            = $this->mType."_name";
      $this->mOrderBy            = $this->mIdKeyTable;
      $this->mMetaId = "meta_id";
      // Set table fields
      $this->mTableFields = [
        $this->mIdKey,
        $this->mNameKey,
      ];
      // Set table meta fields
      $this->mTableFieldsMeta = null;
      // Set table filters
      $this->mFilters = [
        "list" => [
          $this->mIdKey   => 1,
          $this->mNameKey => 1,
        ],
        "item" => [
          $this->mIdKey   => 1,
          $this->mNameKey => 1,
        ],
      ];
    }
    // Set some common properties if not already set
    if (!isset($this->mOrderBy))
      $this->mOrderBy = $this->mIdKeyTable;
    if (!isset($this->mMetaId))
      $this->mMetaId = "meta_id";
    if (!isset($this->mInsertSuccessMsg))
      $this->mInsertSuccessMsg = ucfirst($this->mType)." created. ";
    if (!isset($this->mUpdateSuccessMsg))
      $this->mUpdateSuccessMsg = ucfirst($this->mType)." updated. ";
    if (!isset($this->mDeleteSuccessMsg))
      $this->mDeleteSuccessMsg = ucfirst($this->mType)." deleted. ";

    if (!isset($this->mType)) // Option type overrides parameter type
      $this->mType = ltrim(Parameters::get("type"));
    if (!isset($this->mType))
      return "Table type missing. "; // We must have a type
    if (!isset($this->mId) || $this->mId == "")
      $this->mId        = ltrim(Parameters::get($this->mIdKey));

    $str = Parameters::get("plugins");
    if ($str)
      $this->mPlugins = explode(',', $str);
    if (!isset($this->mPlugins))
      $this->mPlugins = null;

    return true;
  } // initProperties

  private function validateTableDefs($tableDefs)
  {
    if (!$tableDefs) {
      $this->mError = "Table definitions missing. ";
      return false;
    }
    $err = "";
    if (!isset($tableDefs["type"]))
      $err .= "Type missing. ";
    if (!isset($tableDefs["tableName"]))
      $err .= "Table name missing. ";
    if (!isset($tableDefs["tableNameMeta"]))
      $err .= "Meta table name missing. ";
    if (!isset($tableDefs["idKey"]))
      $err .= "Id key missing. ";
    if (!isset($tableDefs["idKeyTable"]))
      $err .= "Table id key missing. ";
    if (!isset($tableDefs["idKeyMetaTable"]))
      $err .= "Meta table id key missing. ";
    if (!isset($tableDefs["nameKey"]))
      $err .= "Name key missing. ";
    if ($err !== "") {
      $this->mError = $tableDefs["type"]." ".$err;
      return false;
    }
    return true;
  } // validateTableDefs

  /**
   * @method initFilters
   * @description Extra initialization of filters, override this in deriving classes if needed
   */
  protected function initFilters($filters)
  {
  } // initFilters
} // class anyTable
?>
