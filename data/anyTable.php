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
 *                'groupingForType': '[type]',  // Optional, but mandatory if both 'grouping' and 'id' is specified.
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
  protected $mTableDefs = null; // Must be provided by deriving class

  protected $mTableName          = null,
            $mTableNameMeta      = null,
            $mTableNameGroupLink = null,
            $mTableNameUserLink  = null,
            $mTableNameGroup     = "any_group",
            $mTableNameUser      = ANY_DB_USER_TABLE;

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
            $mListForType       = null, // Used by items that have associated lists
            $mListForId         = null, // Used by items that have associated lists
            $mData              = null, // List or item data
            $mFilters           = null,
            $mPermission        = null,
            $mOrderBy           = null,
            $mSortFunction      = null;

  protected $mInsertSuccessMsg  = "",
            $mUpdateSuccessMsg  = "",
            $mDeleteSuccessMsg  = "",
            $mItemUnexists      = " not found. ",
            $mInsertNothingToDo = "Nothing to insert",
            $mUpdateNothingToDo = "Nothing to update",
            $mDeleteNothingToDo = "Nothing to delete";

  private   $mNumRowsChanged    = 0,
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

  /////////////////////////
  //////// getters ////////
  /////////////////////////

  /**
   * @method getTableName
   * @description Returns the table's name.
   */
  public function getTableName()  { return $this->mTableName; }

  /**
   * @method getTableNameMeta
   * @description Returns the meta table's name.
   */
  public function getTableNameMeta()  { return $this->mTableNameMeta; }

  /**
   * @method getType
   * @description Returns the type of the table data.
   */
  public function getType()       { return $this->mType; }

  /**
   * @method getIdKey
   * @description Returns the id key of the table data.
   */
  public function getIdKey()      { return $this->mIdKey; }

  /**
   * @method getNameKey
   * @description Returns the name name of the table data.
   */
  public function getNameKey()    { return $this->mNameKey; }

  /**
   * @method getId
   * @description Returns the id of the table data, if an item. If a list, the result is undefined.
   */
  public function getId()         { return $this->mId; }

  /**
   * @method getData
   * @description Returns the data.
   */
  public function getData()       { return $this->mData; }

  /**
   * @method getPermission
   * @description Returns the permission object.
   */
  public function getPermission() { return $this->mPermission; }

  /**
   * @method hasParentId
   * @description Override and return true in table classes which have parent_id.
   */
  public function hasParentId()
  {
    return false;
  } // hasParentId

  /////////////////////////
  //////// finders ////////
  /////////////////////////

  protected function findDefaultListHeader($type)
  {
    return ucfirst($type." list"); // TODO: i18n
  } // findDefaultListHeader

  protected function findDefaultItemHeader($type)
  {
    return ucfirst($type);
  } // findDefaultItemHeader

  protected function findDefaultHeader($type,$data=null,$skipOther=false)
  {
    $other = $skipOther ? "" : "Other "; // TODO: i18n
    return $other.$type."s";             // TODO: i18n
  } // findDefaultHeader

  protected function findMetaTableName($pluginType)
  {
    if ($pluginType == "user")
      $str = ANY_DB_USERMETA_TABLE;
    else
      $str = "any_".$pluginType."meta";
    return $str;
  } // findMetaTableName

  protected function findLinkTableId($pluginType)
  {
    $str = $pluginType."_id";
    return $str;
  } // findLinkTableId

  protected function findLinkTableName($pluginType)
  {
    if ($pluginType === null || $pluginType === "")
      return null;
    if ($pluginType == $this->mType)
      return $this->mTableName;
    $ltn = [$pluginType,$this->mType];
    sort($ltn);
    $ltn = "any_".implode("_",$ltn);
    return $ltn;
  } // findLinkTableName

  protected function findPluginTableId($pluginType)
  {
    if ($pluginType == "user")
      $str = ANY_DB_USER_ID;
    else
      $str = $pluginType."_id";
    return $str;
  } // findPluginTableId

  protected function findPluginTableName($pluginType)
  {
    if ($pluginType == "user")
      $str = ANY_DB_USER_TABLE;
    else
      $str = "any_".$pluginType;
    return $str;
  } // findPluginTableName

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Searches ////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @method dbSearch
   * @description Search database for an item or a list
   * @return Data array, or null on error or no data
   * @example
   */
  public function dbSearch()
  {
    $err = $this->dbValidateSearch();
    if ($err != "") {
      $this->setError($err);
      return null;
    }
    $this->mError = "";
    $this->mData = null;
    if ($this->mId == "max")
      $res = $this->dbSearchMaxId();
    else
    if ($this->mId == "par")
      $res = $this->dbSearchParents();
    else
    if ($this->mId)
      $res = $this->dbSearchItem($this->mData,$this->mIdKeyTable,$this->mId);
    else {
      $this->mListForType = null;
      $this->mListForId   = null;
      $res = $this->dbSearchList($this->mData);
    }
    if (!$res)
      return null;
    return $this->prepareData($this->mData);
  } // dbSearch

  protected function dbValidateSearch()
  {
    $err = "";
    if (!$this->mType)
      $err .= "Type missing. ";
    return $err;
  } // dbValidateSearch

  //
  // Find max id for a table
  //
  protected function dbSearchMaxId()
  {
    $table = $this->getTableName();
  //$id    = $this->mIdKeyTable;
  //$stmt  = "SELECT MAX(".$id.") FROM ".$table;
    $stmt  = "SELECT AUTO_INCREMENT FROM information_schema.tables ".
              "WHERE table_name = '".$table."' ".
              "AND table_schema = DATABASE( )";
    //elog("dbSearchMaxId query:".$stmt);
    if (!$this->query($stmt))
      return false;
    $nextrow = $this->getNext(true);
    $this->mMaxId = $nextrow !== null
                    ? $nextrow["AUTO_INCREMENT"]
                    : -1;
    //elog("dbSearchMaxId,mMaxId:".$this->mMaxId);
    return $this->prepareData($this->mData);
  } // dbSearchMaxId

  //
  // Find all items of a certain type and return simple list of id/name pairs
  //
  protected function dbSearchParents()
  {
    $this->mData = null;
    if (!$this->dbSearchList($this->mData,true,true,true)) // Search to a flat list
      return null;
    return $this->prepareData($this->mData);
  } // dbSearchParents

  //////////////////////////////// Item search ////////////////////////////////

  //
  // Search database for an item, including meta data
  // Returns true on success, false on error
  //
  protected function dbSearchItem(&$data,$key,$val,$skipLists=false)
  {
    if ($key === null || $val === null) {
      $this->setError("Missing key ($key) or value ($val)");
      return false;
    }
    // Build and execute the full statement
    $stmt = $this->dbPrepareSearchItemStmt($key,$val);
    //elog("dbSearchItem:".$stmt);
    if (!$stmt || !$this->query($stmt))
      return false; // An error occured

    // Get the data
    $success = $this->getRowData($data,"item",false,false);

    if ($success) {
      // Search and get the meta data
      $this->dbSearchMeta($data,"item",false);

      // Get associated lists, unless they should be skipped
      if (!$skipLists)
        $this->dbSearchItemLists($data);

      // Build the data tree
      $this->buildGroupTreeAndAttach($data,"item");
    }

    return !$this->isError();
  } // dbSearchItem

  protected function dbPrepareSearchItemStmt($key,$val)
  {
    // Get query fragments
    $this->mError = "";
    $select    = $this->findItemSelect();
    $left_join = $this->findItemLeftJoin();
    $where     = $this->findItemWhere($key,$val);

    if ($this->mError != "") {
      error_log($this->mError);
      return false;
    }
    $stmt = $select.
            "FROM ".$this->getTableName()." ".
            $left_join.
            $where;
    return $stmt;
  } // dbPrepareSearchItemStmt

  protected function findItemSelect()
  {
    // Select from own table
    $si = "SELECT DISTINCT ".$this->getTableName().".* ";

    // Select from left joined user table (if this is not a user table)
    if ($this->mType != "user" &&
        isset($this->mTableFieldsLeftJoin) && isset($this->mTableFieldsLeftJoin["user"]) && $this->tableExists($this->mTableNameUserLink)) {
      foreach ($this->mTableFieldsLeftJoin["user"] as $field)
        $si .= ", ".$this->mTableNameUserLink.".".$field;
      if ($this->hasParentId())
        $si .= ",";
    }
    if ($this->hasParentId())
      $si .= " temp.".$this->mNameKey." AS parent_name";
    $si .= " ";
    return $si;
  } // findItemSelect

  protected function findItemLeftJoin()
  {
    $cur_uid = $this->mPermission["current_user_id"];
    // Left join user table (if this is not a user table)
    $lj = "";
    if ($this->mType != "user" &&
        isset($this->mTableFieldsLeftJoin) && isset($this->mTableFieldsLeftJoin["user"]) && $this->tableExists($this->mTableNameUserLink)) {
      $lj .= "LEFT JOIN ".$this->mTableNameUserLink." ON ".$this->mTableNameUserLink.".".$this->mIdKeyTable."='".$this->mId."' ";
      if ($cur_uid)
        $lj .= "AND ".$this->mTableNameUserLink.".user_id='".$cur_uid."' ";
    }
    if ($this->hasParentId())
      $lj .= "LEFT JOIN ".$this->mTableName." temp ON ".$this->mTableName.".parent_id=temp.".$this->mIdKey." ";
    return $lj;
  } // findItemLeftJoin

  protected function findItemWhere($key,$val)
  {
    $where = "WHERE ".$this->getTableName().".".$key."='".utf8_encode($val)."' ";
    return $where;
  } // findItemWhere

  //
  // Search for lists associated with the item
  //
  protected function dbSearchItemLists(&$data)
  {
    if (!isset($this->mPlugins))
      return true; // No plugins found, return with no error

    $err = $this->dbValidateItemListSearch();
    if ($err != "") {
      $this->setError($err);
      return false;
    }
    // Prepare the data structure
    $idx = "+".$this->mId;
    // Loop through all registered plugins (link tables)
    foreach ($this->mPlugins as $i => $plugin) {
      $table = anyTableFactory::create($plugin,$this);
      if ($table) {
        $table->mListForType = $this->mType;
        $table->mListForId   = $this->mId;
        $table->mListForName = isset($data[$idx]) && isset($data[$idx][$this->mNameKey]) ? $data[$idx][$this->mNameKey] : "";
        $table_data = null;
        $skipOwnId = $plugin == $this->mType;
        if (!$table->dbSearchList($table_data,$skipOwnId,true,false)) // TODO! Searching for "simple" list does not work here
          $this->mError .= $table->getError();
        // We found some data, insert it in the data structure
        if ($table_data) {
          if (!isset($data[$idx]))
            $data[$idx] = array();
          if (!isset($data[$idx]["data"]))
            $data[$idx]["data"] = array();
          $data[$idx]["data"]['grouping']        = "tabs";
          $data[$idx]["data"]['groupingForType'] = $table->mListForType;
          $data[$idx]["data"]['groupingForId']   = $table->mListForId;
          $data[$idx]["data"]['groupingForName'] = $table->mListForName;
          $data[$idx]["data"]["plugin-".$plugin] = array();
          $data[$idx]["data"]["plugin-".$plugin]["head"] = $plugin;
          $data[$idx]["data"]["plugin-".$plugin][$table->getNameKey()] = $this->findDefaultHeader($plugin,$data[$idx]["data"]["plugin-".$plugin],true);
          if (isset($table_data[$plugin]))
            $data[$idx]["data"]["plugin-".$plugin]["data"] = $table_data[$plugin]["data"];
          else
          if ($plugin == $this->mType)
            $data[$idx]["data"]["plugin-".$plugin]["data"] = $table_data;
          else
            $data[$idx]["data"]["plugin-".$plugin]["data"] = "empty"; // So that the view can create an empty container
        }
      }
    } // foreach
    return true;
  } // dbSearchItemLists

  protected function dbValidateItemListSearch()
  {
    $err = "";
    if (!$this->mType)
      $err .= "Type missing. ";
    if (!isset($this->mId) || $this->mId == "")
      $err .= "Id missing. ";
    if (!isset($this->mPlugins) || !in_array($this->mType,$this->mPlugins))
      $err .= "Unregistered plugin: $this->mType. ";
    return $err;
  } // dbValidateItemListSearch

  //////////////////////////////// List search ////////////////////////////////

  //
  // Search database for a list, including meta data
  // Returns true on success, false on error
  //
  protected function dbSearchList(&$data,$skipOwnId=false,$flat=false,$simple=false)
  {
    if ($this->mType == "user" && $this->mListForType == "user")
      return true; // We do not have subusers (user table does not have parent_id field) TODO! Neccessary?

    // Build and execute the full statement
    $stmt = $this->dbPrepareSearchListStmt($skipOwnId);
    //elog("dbSearchList:".$stmt);
    if (!$stmt || !$this->query($stmt))
      return false; // An error occured

    // Get the data
    if (!$simple)
      if (Parameters::get("lt") == "simple")
         $simple = true;
    $success = $this->getRowData($data,"list",$flat,$simple);

    if ($success) {
      // Search and get the meta data
      if (!$simple)
        $this->dbSearchMeta($data,"list",$flat);

      // Sort the list
      if ($this->mSortFunction !== null)
        call_user_func($this->mSortFunction);

      // Build the data tree unless its a 'simple' list
      if (!$simple)
        $this->buildGroupTreeAndAttach($data,"list");
    }

    return !$this->isError();
  } // dbSearchList

  protected function dbPrepareSearchListStmt($skipOwnId=false)
  {
    // Get query fragments
    $this->mError = "";
    $select    = $this->findListSelect();
    $left_join = $this->findListLeftJoin();
    $where     = $this->findListWhere($skipOwnId);
    $order_by  = $this->findListOrderBy();

    if ($this->mError != "") {
      error_log($this->mError);
      return null;
    }
    // Build the full statement
    $stmt = $select.
            "FROM ".$this->getTableName()." ".
            $left_join.
            $where.
            $order_by;
    return $stmt;
  } // dbPrepareSearchListStmt

  protected function findListSelect()
  {
    // Select from own table
    $sl = "SELECT DISTINCT ".$this->getTableName().".* ";

    // Always select from group table
    if (isset($this->mTableFieldsGroup)) {
      if ("group" != $this->mType) {
        $linktable = $this->findLinkTableName("group");
        if ($this->tableExists($this->mTableNameGroup) &&
            $this->tableExists($linktable)) {
          foreach ($this->mTableFieldsGroup as $field)
            $sl .= ", ".$this->mTableNameGroup.".".$field;
        }
      }
    }
    // Select from other tables (link tables)
    if (isset($this->mPlugins)) {
      foreach($this->mPlugins as $i => $plugin) {
        if ($plugin != "group" && $plugin != $this->mType) {
          if ((isset($this->mListForType) || $plugin == "user")) {
            if (isset($this->mTableFieldsLeftJoin) && isset($this->mTableFieldsLeftJoin[$plugin])) {
              $linktable = $this->findLinkTableName($plugin);
              if ($this->tableExists($linktable)) {
                foreach ($this->mTableFieldsLeftJoin[$plugin] as $field)
                  $sl .= ", ".$linktable.".".$field;
              }
            }
          }
        }
      }
      if ($this->hasParentId())
        $sl .= ",";
      if ($this->hasParentId())
        $sl .= " temp.".$this->mNameKey." AS parent_name";
    }
    $sl .= " ";
    return $sl;
  } // findListSelect

  protected function findListLeftJoin()
  {
    $cur_uid = $this->mPermission["current_user_id"];
    $lj = "";
    // Always left join group table
    if ("group" != $this->mType)
      $lj .= $this->findListLeftJoinOne($cur_uid,"group");

    // Left join other tables (link tables)
    if (isset($this->mPlugins)) {
      foreach($this->mPlugins as $i => $plugin) {
        if ($plugin != "group" && $plugin != $this->mType) {
          if (isset($this->mListForType) || $plugin == "user") {
            $lj .= $this->findListLeftJoinOne($cur_uid,$plugin);
          }
        }
      }
    }
    if ($this->hasParentId())
      $lj .= "LEFT JOIN ".$this->mTableName." temp ON ".$this->mTableName.".parent_id=temp.".$this->mIdKey." ";
    return $lj;
  } // findListLeftJoin

  protected function findListLeftJoinOne($cur_uid,$plugin)
  {
    $lj = "";
    $linktable      = $this->findLinkTableName($plugin);
    $plugintable    = $this->findPluginTableName($plugin);
    $metatable      = $this->findMetaTableName($plugin);
    $linktable_id   = $this->findLinkTableId($plugin);
    $plugintable_id = $this->findPluginTableId($plugin);
    $metatable_id   = $plugin."_id";
    if ($this->tableExists($linktable)) {
      $lj .= "LEFT JOIN ".$linktable.  " ON CAST(".$linktable.".".$this->mIdKey.  " AS INT)=CAST(".$this->getTableName().".".$this->mIdKeyTable." AS INT) ";
      if (!isset($this->mListForType) && $plugin == "user" && $cur_uid)
        $lj .= "AND CAST(".$linktable.".".$linktable_id." AS INT)=CAST(".$cur_uid." AS INT) "; // Only return results for current user
      if ($this->tableExists($plugintable)) {
        $lj .= "LEFT JOIN ".$plugintable." ON CAST(".$linktable.".".$linktable_id." AS INT)=CAST(".$plugintable.         ".".$plugintable_id.  " AS INT) ";
        if ($this->tableExists($metatable))
          $lj .= "LEFT JOIN ".$metatable.  " ON CAST(".$metatable.".".$metatable_id." AS INT)=CAST(".$plugintable.         ".".$plugintable_id.  " AS INT) ";
      }
    }
    else
      $this->mMessage .= "Table '$linktable' does not exist.";
    return $lj;
  } // findListLeftJoinOne

  protected function findListWhere($skipOwnId=false)
  {
    $where = null;
    $link_table = $this->findLinkTableName($this->mListForType);
    if (isset($this->mListForType) && isset($this->mListForId) && $link_table !== null && !$skipOwnId) {
      $where_id = $link_table.".".$this->mListForType."_id='".$this->mListForId."' ";
      $where = "WHERE ".$where_id;
    }
    if ($this->hasParentId() &&
        (isset($this->mListForType) || (isset($this->mId) && $this->mId != ""))) {
      if (isset($this->mId) && $this->mId != "" && is_numeric($this->mId) &&
          (!isset($this->mListForType) || (isset($this->mListForType) && $this->mListForType == $this->mType))) {
        $gstr = $this->getTableName().".".$this->mIdKeyTable." IN ( ".
                "SELECT ".$this->getTableName().".".$this->mIdKeyTable." ".
                "FROM (SELECT @pv := '$this->mId') ".
                "INITIALISATION WHERE find_in_set(".$this->getTableName().".parent_id, @pv) > 0 ".
                "AND   @pv := concat(@pv, ',', ".$this->getTableName().".".$this->mIdKeyTable.") ".
                ") ";
        if ($where === null)
          $where  = "WHERE (".$gstr.") ";
        else
          $where .= " OR (".$gstr.") ";
      }
    }
    if ($skipOwnId) {
      $skip_str = $this->getTableName().".".$this->mIdKeyTable." != '".$this->mId."'";
      if ($where === null)
        $where  = "WHERE (".$skip_str.") ";
      else
        $where .= " AND (".$skip_str.") ";
    }
    return $where;
  } // findListWhere

  protected function findListOrderBy($sort="ASC")
  {
    if (!isset($this->mOrderBy))
      return "";
    $ob = "ORDER BY ".$this->getTableName().".".$this->mOrderBy." ".$sort;
    return $ob;
  } // findListOrderBy

  protected function setSortFunction($sortFunc)
  {
    $this->mSortFunction = $sortFunc;
  } // setSortFunction

  //
  // Search database for a list of the items with ids as given in the ids array, including meta data.
  // Returns true on success, false on error.
  // TODO! Should LEFT JOIN link tables.
  //
  protected function dbSearchListFromIds(&$data,$ids,$skipOwnId=false,$flat=false,$simple=false)
  {
    $sl = "SELECT DISTINCT ".$this->getTableName().".* ".
          "FROM ".$this->getTableName()." ".
          "WHERE ".$this->mIdKeyTable." IN (".implode(',',$ids).")";
    //elog("dbSearchListFromIds:".$sl);
    if (!$this->query($sl))
      return false; // An error occured

    $success = $this->getRowData($data,"list");

    if ($success) {
      // Get the meta data
      if (!$simple)
        $this->dbSearchMeta($data,"list",true); // TODO! WHERE wp_usermeta.user_id IN ({ids})

      $this->buildGroupTreeAndAttach($data,"list");
    }

    return !$this->isError();
  } // dbSearchListFromIds

  //////////////////////////////// Metadata search ////////////////////////////////

  // Get the meta data
  protected function dbSearchMeta(&$data,$kind,$flat)
  {
    $hasMetaTable = $this->tableExists($this->mTableNameMeta);
    if (!$hasMetaTable || $this->mTableNameMeta === null) {
      $this->mMessage = "No meta table. ";
      return false;
    }

    $meta_id = Parameters::get($this->mIdKeyMetaTable);
    $is_list = (!isset($this->mId) || $this->mId == "");
    $where   = $meta_id !== null && $meta_id !== "" && !$is_list
              ? "WHERE ".$this->mTableNameMeta.".".$this->mIdKeyMetaTable."='".$meta_id."' "
              : "";
    /* TODO! Untested (left join with link table)
    $left_join  = null;
    $link_table = $this->findLinkTableName($this->mListForType);
    if (isset($this->mListForType) && isset($this->mListForId) && $link_table !== null) {
      if ($this->mListForType != $this->mType && $this->mListForType != "group") {
        $left_join = "LEFT JOIN ".$link_table." ON ".$link_table.".".$this->mListForType."_id='".$this->mListForId."' ";
        $where_id = $this->mTableNameMeta.".".$this->mIdKeyMetaTable."=".$link_table.".".$this->mIdKeyMetaTable." ";
        if ($where === null)
          $where  = "WHERE ".$where_id;
        else
          $where .= " AND " .$where_id;
      }
    }
    */
    if ($this->tableExists($this->mTableNameGroupLink)) {
      $group_id_sel   = $is_list || isset($this->mListForType) ? ",".$this->mTableNameGroupLink.".group_id " : " ";
      $group_type_sel = /*$this->mType == "group" ? ",any_group.group_type" :*/ "";
      $stmt = "SELECT ".$this->mTableNameMeta.".* ".
              $group_type_sel.
              $group_id_sel.
              "FROM ".$this->mTableNameMeta." ".
              "LEFT JOIN ".$this->mTableNameGroupLink." ".
              "ON ".$this->mTableNameMeta.".".$this->mIdKeyMetaTable."=".$this->mTableNameGroupLink.".".$this->mIdKeyMetaTable." ".
              //$left_join.
              $where;
      //elog("dbSearchMeta:".$stmt);
      if (!$this->query($stmt))
        return false;
    }
    // Get the data
    return $this->getRowMetaData($data,$kind,$flat);
  } // dbSearchMeta

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Data retrieval //////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  //
  // Get the data from query result to array
  //
  protected function getRowData(&$data,$kind,$flat=false,$simple=false)
  {
    $filter = $kind == "list"
              ? $this->mFilters["list"]
              : $this->mFilters["item"];
    //elog("getRowData,filter:".var_export($filter,true));
    $cur_user_id = $this->mPermission["current_user_id"];
    $this->mLastNumRows = 0;
    $data = array();
    while (($nextrow = $this->getNext(true)) !== null) {
      //elog("getRowData,nextrow:".var_export($nextrow,true));
      ++$this->mLastNumRows;
      $gidx = $this->mType == "group" || $flat
              ? $flat
                ? $this->mType
                : $nextrow["group_type"]
              : (isset($nextrow["group_id"])
                 ? $nextrow["group_id"]
                 : "nogroup");
      if ($gidx === null)
        $gidx = "nogroup";
      $idx = isset($nextrow[$this->mIdKeyTable])
             ? $nextrow[$this->mIdKeyTable]
             : null;
      if ($idx) {
        // Force idx to be a string in order to keep ordering when sending JSON data to a json client
        $idx  = "+".$idx;
        if ($kind == "list") {
          if (!$simple)
            $data[$gidx][$idx][$kind] = $this->mType;
          else
            $data[$idx][$kind] = $this->mType;
        }
        else // kind == "item"
          $data[$idx][$kind] = $this->mType;
        // Main table
        if (isset($this->mTableFields)) {
          for ($t=0; $t<count($this->mTableFields); $t++) {
            $item_id_table = $this->mTableFields[$t];
            if (!$simple || $item_id_table == $this->mIdKeyTable || $item_id_table == $this->mNameKey)
              $this->getCellData($item_id_table,$nextrow,$data,$idx,$gidx,$filter,$kind,$simple);
          } // for
        }
        // Meta table
        if (isset($this->mTableFieldsMeta)) {
          for ($t=0; $t<count($this->mTableFieldsMeta); $t++) {
            $item_id_table = $this->mTableFieldsMeta[$t];
            if (!$simple || $item_id_table == $this->mIdKey || $item_id_table == $this->mNameKey)
              $this->getCellData($item_id_table,$nextrow,$data,$idx,$gidx,$filter,$kind,$simple);
          } // for
        }
        // Link tables for item
        if (isset($this->mPlugins)) {
          foreach ($this->mPlugins as $i => $plugin) {
            if (isset($this->mTableFieldsLeftJoin[$plugin])) {
              for ($t=0; $t<count($this->mTableFieldsLeftJoin[$plugin]); $t++) {
                $item_id_table = $this->mTableFieldsLeftJoin[$plugin][$t];
                if (!$simple || $item_id_table == $this->mIdKey || $item_id_table == $this->mNameKey)
                  $this->getCellData($item_id_table,$nextrow,$data,$idx,$gidx,$filter,$kind,$simple);
              } // for
            }
          } // foreach
        }
      } // if
    } // while
    //elog("getRowData1 ($this->mType),data:".var_export($data,true));

    if ($kind == "list" && $this->mType != "group" && !$flat) {
      // Check and fix conflicts in parent_id / group_id in lists
      // TODO! Check for circular parent-child relationship.
      // TODO! Make this work for groups also.
      $iter = 0;
      $maxiter = 20;
      $lastsn = -1;
      $sn     = $this->fixConflicts($data);
      while ($sn != $lastsn && $iter < $maxiter) {
        $lastsn = $sn;
        $sn = $this->fixConflicts($data,1);
        ++$iter;
      }
    }
    //elog("getRowData2 ($this->mType),data:".var_export($data,true));

    if ($data === null || empty($data))
      return false;
    return true;
  } // getRowData

  protected function getCellData($item_id_table,$nextrow,&$data,$idx,$gidx,$filter,$kind,$simple)
  {
    if (isset($nextrow[$item_id_table])) {
      $item_id = $item_id_table;
      if ($item_id == $this->mIdKeyTable)
        $item_id = $this->mIdKey; // Map id name (e.g. "user_id" and not "ID")
      if ($item_id == "user_pass") // TODO! "user_pass" is Wordpress specific
        $val = ""; // Never send password to client
      else
      if ($filter === null || (isset($filter[$item_id]) && $filter[$item_id] == 1))
        $val = htmlentities((string)$nextrow[$item_id_table],ENT_QUOTES,'utf-8',FALSE);
      else
        $val = null;
      if ($val != null && $val != "") {
        if ($kind == "list") {
          if (!$simple)
            $data[$gidx][$idx][$item_id] = $val;
          else
            $data[$idx][$item_id] = $val;
        }
        else
          $data[$idx][$item_id] = $val;
        //elog("getCellData:".$gidx.",".$idx.",".$item_id.":".$val);
      }
    }
  } // getCellData

  private function fixConflicts(&$data)
  {
    if (!$data)
      return -1;
    foreach ($data as $gidx => $grp) {
      foreach ($data[$gidx] as $idx => $item) {
        $pid = isset($data[$gidx][$idx]["parent_id"]) ? $data[$gidx][$idx]["parent_id"] : null;
        if ($pid) {
          if (!isset($data[$gidx]["+".$pid])) {
            //vlog("illegal gid:",$data[$gidx][$idx]);
            $item_name  = $this->mNameKey;
            $gid_of_pid = $this->findGroupIdOfParent($data,$pid);
            $warning  = "Warning: '$item[$item_name]' in group $gidx ";
            if ($gid_of_pid) {
              $warning .= "has its' parent in group $gid_of_pid. ";
              $warning .= "Temporarily relocating $this->mType to parent's group. ";
              $warning .= "Consider moving '$item[$item_name]' to group $gid_of_pid or give it another parent.";
              $data[$gid_of_pid][$idx] = $data[$gidx][$idx];
              if ($gidx != $gid_of_pid)
                unset($data[$gidx][$idx]);
            }
            else {
              $warning .= "has a non-existing parent ($pid). ";
              $warning .= "Temporarily removing $this->mType's parent. ";
              $warning .= "Consider giving $this->mType ".intval($idx)." another parent. ";
              unset($data[$gidx][$idx]["parent_id"]);
              //$gid_of_pid = "nogroup";
              //$data[$gid_of_pid][$idx] = $data[$gidx][$idx];
            }
            error_log($warning);
            $this->setMessage($warning);
          }
        }
      }
    }
    if ($data && isset($data["nogroup"]))
      return count($data["nogroup"]);
    else
      return 0;
  } // fixConflicts

  private function findGroupIdOfParent($data,$pid)
  {
    foreach ($data as $gidx => $grp) {
      foreach ($data[$gidx] as $idx => $item) {
        $type_id = $this->mType."_id";
        if (isset($data[$gidx][$idx][$type_id]) &&
            intval($data[$gidx][$idx][$type_id]) == intval($pid)) {
          if (isset($data[$gidx][$idx]["group_id"])) {
            return $data[$gidx][$idx]["group_id"];
          }
          return $gidx;
        }
      }
    }
    return null;
  } // findGroupIdOfParent

  //
  // Get the meta data from table row(s) to array
  //
  protected function getRowMetaData(&$data,$kind,$flat=false)
  {
    $filter = $kind == "list" ? $this->mFilters["list"] : $this->mFilters["item"];
    while (($nextrow = $this->getNext(true)) !== null) {
      //elog("getRowMetaData,nextrow:".var_export($nextrow,true));
      if (!$this->mIdKeyMetaTable || !isset($nextrow[$this->mIdKeyMetaTable]))
        continue;
      $idx = $nextrow[$this->mIdKeyMetaTable];
      if (!$idx)
        continue;
      // Force idx to be a string in order to keep ordering when sending JSON data to an application/json client
      if ($this->mType != "group")
        $idx  = "+".$idx;
      $gidx = $this->mType == "group"
              ? "group"
              : ($flat
                 ? $this->mType
                 : (isset($nextrow["group_id"])
                   ? $nextrow["group_id"]
                   : null)); // From left join with any_group table
      if ($gidx === null)
        $gidx = "nogroup";
      if (!isset($data[$gidx]))
        $gidx = "nogroup";
      if ($data && isset($data[$gidx]) && isset($data[$gidx][$idx]) && isset($data[$gidx][$idx]["list"]))
        $the_data = $data[$gidx];
      else
      if ($data && isset($data[$idx]) && isset($data[$idx]["item"]))
        $the_data = $data;
      //elog($gidx.",".$idx.",".$this->mIdKey.",data[$gidx][$idx]:".var_export($the_data[$idx],true));
      if (isset($the_data[$idx]) &&
          isset($the_data[$idx][$this->mIdKey])) {
        $meta_key   = isset($nextrow["meta_key"])   ? $nextrow["meta_key"]   : null;
        $meta_value = isset($nextrow["meta_value"]) ? $nextrow["meta_value"] : null;
        //elog($meta_key."(".$filter[$meta_key].")=".$meta_value.":");
        if ($filter === null || (isset($filter[$meta_key]) && $filter[$meta_key] == 1)) {
          if ($meta_key !== null && $meta_key !== "" && $meta_value !== null && $meta_value !== "") {
            $the_data[$idx][$meta_key] = $meta_value;
          if ($data && isset($data[$gidx]) && isset($data[$gidx][$idx]) && isset($data[$gidx][$idx]["list"]))
            $data[$gidx] = $the_data;
          else
          if ($data && isset($data[$idx]) && isset($data[$idx]["item"]))
            $data = $the_data;
          }
        }
      }
    }
    $this->purgeNull($data);
    //elog("(meta)data:".var_export($data,true));
    return true;
  } // getRowMetaData

  //
  // Build the group tree. List data are grouped, item data are not.
  //
  protected function buildGroupTreeAndAttach(&$data,$kind)
  {
    if (!$data)
      return;

    //vlog("buildGroupTreeAndAttach,data before building tree:",$data);
    $is_list = (!isset($this->mId) || $this->mId == "");
    /* TODO! Page links not implemented yet
    //
    // Initialize page links
    //
    if ($is_list) {
      $from = Parameters::get("from") !== null && Parameters::get("from") !== "" ? Parameters::get("from") : 0;
      $to   = Parameters::get("to")   !== null && Parameters::get("to")   !== "" ? Parameters::get("to")   : $this->mPageSize;
      foreach ($data as $gidx => $grp) {
        $data[$gidx]["page_links"]["from"] = $from;
        $data[$gidx]["page_links"]["to"]   = $to;
        $data[$gidx]["page_links"]["num"]  = 0;
      }
    }
    */
    //
    // Get the group names
    //
    $group_table = anyTableFactory::create("group",$this);
    $gdata = $group_table
             ? $group_table->dbSearchGroupNames($this->mType)
             : null;
    //vlog("buildGroupTreeAndAttach,gdata:",$gdata);
    if ((empty($gdata) || !isset($gdata["group"])) && $group_table)
      $this->setMessage($group_table->mError);
    //
    // Build data tree for all groups
    //
    $this->mRecDepth = 0;
    if ($kind == "item") {
      if ($data)
        $data["+".$this->mId][$kind] = $this->mType;
      $data_tree = $data;
    }
    else {
      //
      // Build data tree
      //
      $data_tree = array();
      foreach ($data as $gidx => $grp) {
        if (!empty($data[$gidx])) {
          $num = 0;
          $ngidx = is_int($gidx) ? "+".$gidx : $gidx;
          $data_tree[$ngidx] = array();
          $k = isset($this->mId) && $this->mId != ""
               ? "item"
               : (isset($data_tree[$ngidx]["list"]) && $data_tree[$ngidx]["list"] != "group"
                  ? "list"
                  : "head");
          $data_tree[$ngidx][$k] = isset($this->mId) && $this->mId != "" ? $this->mType : "group";
          if (!isset($this->mId) || $this->mId == "") {
            $gname = isset($gdata) && isset($gdata["group"][$gidx])
                     ? $gdata["group"][$gidx]["group_name"]
                     : ucfirst($gidx)." groups";
            if ($this->mType != "group") {
              if (!$gname)
                $gname = "Other ".$this->mType."s"; // TODO i18n
            }
            else {
              if (!$gname)
                if ($gidx != "group")
                  $gname = ucfirst($gidx)." groups"; // TODO i18n
                else
                  $gname = "Other groups"; // TODO i18n
            }
            if ($this->mType != "group")
              $data_tree[$ngidx]["group_type"] = $this->mType;
            else
              $data_tree[$ngidx]["group_type"] = $gidx;
            $data_tree['grouping'] = "tabs"; // TODO! Should be able to set this via Parameter
            $data_tree[$ngidx]["group_name"] = $gname;
            $data_tree[$ngidx]["group_id"] = $ngidx;
          }
          else {
            $idx = isset($data[$gidx][$this->mId]) ? $this->mId : "+".$this->mId;
            $data_tree[$ngidx][$this->mNameKey] = $data[$gidx][$idx][$this->mNameKey];
          }
          $data_tree[$ngidx]["data"] = $this->buildDataTree($data[$gidx],null,false,$num);
          if ($data_tree[$ngidx]["data"] === null)
            unset($data_tree[$ngidx]);
          /* TODO! Page links not implemented yet
          $data_tree[$ngidx]["page_links"]["from"] = $data[$gidx]["page_links"]["from"];
          $data_tree[$ngidx]["page_links"]["to"]   = $data[$gidx]["page_links"]["to"];
          $data_tree[$ngidx]["page_links"]["num"]  = $num-1;
          */
        }
      }
    }
    //vlog("buildGroupTreeAndAttach,data_tree1:",$data_tree);
    //if ($err)
    //  $this->setMessage("Warning: ".$err);
    //
    // Build group tree and stick data tree to it
    //
    if ($this->mType != "group") {
      if ((!isset($this->mId) || $this->mId == "") && !isset($this->mListForId) && $group_table) {
        $this->dbAttachToGroups($group_table->tdata["group"],$data_tree);
        $group_table->tdata["group"]['grouping'] = "tabs";
        //vlog("buildGroupTreeAndAttach,tdata:",$group_table->tdata);
        $data = $group_table->tdata["group"];
      }
      else
        $data = $data_tree;
      //vlog("buildGroupTreeAndAttach,data1:",$data);
    }
    else {
      if ($is_list && $data_tree) {
        if ($is_list && !isset($this->mListForType)) { // Add the "other" category
          if (isset($data_tree["group"]) && $data_tree["group"] !== null) {
            foreach ($data_tree["group"] as $gidx => &$group) {
              if (isset($data_tree["group"][$gidx]["group"])) {
                $grp = array_values($data_tree["group"][$gidx]["group"])[0];
                $data_tree["group"][$gidx]["group"]["nogroup"] = array();
                $data_tree["group"][$gidx]["group"]["nogroup"]["group_type"] = $grp["group_type"];
                $data_tree["group"][$gidx]["group"]["nogroup"]["group_id"]   = "nogroup";
                $data_tree["group"][$gidx]["group"]["nogroup"]["group_name"] = "Default ".$grp["group_type"]." group";
              }
            }
          }
        }
      }
      $data = $data_tree;
    }
    //vlog("buildGroupTreeAndAttach,data2:",$data);
  } // buildGroupTreeAndAttach

  // Overridden in group table
  protected function dbSearchGroupNames($type=null)
  {
    // Get group tree and append data to it
    $num = 0;
    $data_tree = array();
    $data_tree["group"] = array();
    $data_tree["group"] = $this->buildDataTree($data_tree["group"],null,false,$num);
    //vlog("dbSearchGroupNames,data_tree:",$data_tree);

    // Add the default "nogroup" group
    if ($type && $type != "") {
      $data_tree["group"]["nogroup"]["group_type"] = $type;
      $data_tree["group"]["nogroup"]["group_id"]   = "nogroup";
      $data_tree["group"]["nogroup"]["group_name"] = $this->findDefaultHeader($type);
      $data_tree["group"]["nogroup"]["head"]       = "group";
    }
    //vlog("dbSearchGroupNames,data_tree:",$data_tree);
    $this->tdata = $data_tree;
    return $data_tree;
  } // dbSearchGroupNames

  protected function buildDataTree(&$flatdata,$parentId,$getPageLinks,&$num)
  {
    ++$this->mRecDepth;
    if ($this->mRecDepth > $this->mLastNumRows + $this->mRecMax) {
      error_log("buildDataTree: Too much recursion ($this->mRecDepth)");
      return null;
    }
    if (!$flatdata)
      return null;
    $retval = array();
    $type_list = $this->mType;
    $id_name   = $this->mType."_id";
    foreach ($flatdata as $idx => &$subdata) {
      if ($idx != "page_links") {
        $parent_not_in_group = isset($subdata["parent_id"]) &&
                               $subdata["parent_id"] != "" &&
                               !isset($flatdata[$subdata["parent_id"]]) &&
                               !isset($flatdata["+".$subdata["parent_id"]]);
        $pid = null;
        if ($parent_not_in_group) {
          $pid = $subdata["parent_id"];
          unset($subdata["parent_id"]);
        }
        if (!isset($subdata["parent_id"]))
          $subdata["parent_id"] = NULL;
        if ($subdata["parent_id"] == $parentId) {
          if ($getPageLinks && $subdata["parent_id"] === null) {
            $num++; // "Top-level" item, so we count it
          }
          if (!$getPageLinks || ($num > $flatdata["page_links"]["from"] && $num <= $flatdata["page_links"]["to"])) {
            if (isset($subdata[$id_name]) && $subdata[$id_name] != "")
              $children = $this->buildDataTree($flatdata,$subdata[$id_name],$getPageLinks,$num);
            else
              $children = null;
            if ($this->mRecDepth > $this->mLastNumRows + $this->mRecMax)
              break; // Break recursion
            if ($children) {
              $subdata["data"] = $children;
            }
            if ($parent_not_in_group)
              $subdata["parent_id"] = $pid;
            $retval[$idx] = $subdata;
            unset($subdata);
          } // if getPageLinks
        } // if subdata
        else {
          if ($pid != null)
            $subdata["parent_id"] = $pid;
        }
      } // if page_links
    } // foreach
    return $retval;
  } // buildDataTree

  private function dbAttachToGroups(&$group_tree,$data_tree)
  {
    //vlog("dbAttachToGroups,group_tree:",$group_tree);
    //vlog("dbAttachToGroups,data_tree:", $data_tree);
    if ($group_tree !== null) {
      foreach ($group_tree as $gid => $group) { // Iterate over group ids
        if (isset($group_tree[$gid]["group_type"]) && $group_tree[$gid]["group_type"] == $this->mType) {
          if (isset($group_tree[$gid]["data"]) && $group_tree[$gid]["data"] !== null)
            $this->dbAttachToGroups($group_tree[$gid]["data"],$data_tree);
          if (isset($data_tree[$gid]) && $data_tree[$gid] != "")
            $idx = $gid;
          else
          if (isset($data_tree["+".$gid]) && $data_tree["+".$gid] != "")
            $idx = "+".$gid;
          if (isset($idx) && $data_tree[$idx] !== null) {
            if (isset($data_tree[$idx]["data"]) && $data_tree[$idx]["data"] != "") {
              $group_tree[$gid]["head"] = "group";
              if (array_key_exists("data",$group_tree[$gid]) && !isset($group_tree[$gid]["data"]) && $group_tree[$gid]["data"] != "")
                $group_tree[$gid]["data"] = array();
              foreach ($data_tree[$idx]["data"] as $id => $obj)
                $group_tree[$gid]["data"][$id] = $data_tree[$idx]["data"][$id];
            }
            /* TODO! Page links not implemented yet
            if (isset($data_tree[$idx]["page_links"]) && $data_tree[$idx]["page_links"] != "") {
              $group_tree[$gid]["page_links"]["from"] = $data_tree[$idx]["page_links"]["from"];
              $group_tree[$gid]["page_links"]["to"]   = $data_tree[$idx]["page_links"]["to"];
              $group_tree[$gid]["page_links"]["num"]  = $data_tree[$idx]["page_links"]["num"];
              unset($data_tree[$idx]["page_links"]);
            }
            */
          }
        } // if group_tree
        else
          ;//unset($group_tree[$gid]);
      } // foreach
    } // if
  } // dbAttachToGroups

  /**
   * @method prepareData
   * @description Get all data related to a list or a single item. The data must have been returned by
   *              `{{#crossLink "anyTable/dbSearch:method"}}{{/crossLink}}`. See the `{{#crossLink "anyTable"}}{{/crossLink}}`
   *              constructor for a description of the data format. This method is normally not called by derived
   *              classes, but may be overridden by classes that want to return data in a non-standard format.
   * @return Data array.
   * @example
   *      $data = $myTable->prepareData();
   */
  public function prepareData(&$inData)
  {
    //vlog("inData before prepare:",$inData);
    $data = array();
    $this->prepareTypeKindId($data);
    if (!$inData)
      return $data;
    $data["data"]["+0"]["head"] = $this->mType;
    if ($inData) {
      if (!isset($this->mId) || $this->mId == "") {
        $data["data"]["+0"][$this->mNameKey] = $this->findDefaultListHeader($this->mType);
        $data["data"]["+0"]["data"]          = $inData;
      }
      else {
        if (isset($inData["+".$this->mId][$this->mNameKey]))
          $data["data"]["+0"][$this->mNameKey] = $inData["+".$this->mId][$this->mNameKey]; // findDefaultItemHeader
        else {
          $data["data"]["+0"][$this->mNameKey] = "";
          if (isset($this->mListForId))
            $this->setError($this->mNameKey." missing"); // TODO: i18n
        }
        $data["data"]["+0"]["data"]["+".$this->mId]["item"] = $this->mType;
        $data["data"]["+0"]["data"] = $inData;
      }
    }
    $data["plugins"] = $this->mPlugins;
    //vlog("data after prepare:",$data);
    return $data;
  } // prepareData

  public function prepareTypeKindId(&$data)
  {
    if (!$data)
      $data = array();
    if (isset($this->mId) && $this->mId != "") {
      $data["id"] = $this->mId != "max"
                    ? $this->mId
                    : $this->mMaxId;
      $k = "item";
    }
    else {
      $data["id"] = null;
      $k = "head";
    }
    if (isset($this->mType) && $this->mType != "")
      $data[$k] = $this->mType;
    else
      $data[$k] = null;
    return $data;
  } // prepareTypeKindId

  public function prepareParents($type,$itemIdKey,$itemNameKey)
  {
    // TODO! Untested
    return null;
    $lf   = $this->mListForType;
    $lfid = $this->mListForId;
    $this->mListForType = null;
    $this->mListForId   = null;
    $this->dbSearchList($items,false,true); // Search to a flat list
    $this->mListForType = $lf;
    $this->mListForId   = $lfid;
    //elog("prepareParents,items:".var_export($items,true));
    $sel_arr = array();
    if ($items != null) {
      $item_id       = Parameters::get($itemIdKey);
      $item_id_key   = $itemIdKey;
      $item_name_key = $itemNameKey;
      $i = 0;
      $children = array();
      if ($item_id_key != null)
      foreach ($items as $gid => $group) {
        if ($group != null)
        foreach ($group as $id => $item) {
          if (isset($item[$item_id_key])) {
            $sel_arr[$item[$item_id_key]] = $item[$item_name_key];
            if (isset($item["parent_id"]) && $item["parent_id"] != "") {
              // Check that (grand)child is not available as parent
              if ($item["parent_id"] == $item_id || in_array($item_id,$children)) {
                $children[$i++] = $item_id;
                unset($sel_arr[$item[$item_id_key]]);
              }
            }
          }
        }
      }
    }
    //elog(var_export($sel_arr,true));
    return $sel_arr;
  } // prepareParents

  public function prepareSetting($settingName)
  {
    // TODO! Not implemented yet
    return null;
  } // prepareSetting

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Insert //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @method dbInsert
   * @description
   * @return data structure on success, null on failure.
   * @example
   */
  public function dbInsert()
  {
    $err = $this->dbValidateInsert();
    if ($err != "") {
      $this->setError($err);
      return null;
    }
    $this->mError = "";
    $this->mData = null;
    $this->mNumRowsChanged = 0;

    $res = $this->dbInsertItem();
    if (!$res)
      return null;

    if (method_exists($this,"dbInsertExtra"))
      $res2 = $this->dbInsertExtra();

    $data = array();
    return $this->prepareTypeKindId($data);
  } // dbInsert

  protected function dbValidateInsert()
  {
    $err = "";
    return $err;
  } // dbValidateInsert

  protected function dbInsertItem()
  {
    $this->mNumRowsChanged = 0;
    // Insert in normal table
    $stmt = $this->dbPrepareInsertStmt();
    //elog("dbInsertItem:".$stmt);
    if (!$stmt || !$this->query($stmt))
      return null;
    $this->mNumRowsChanged += $this->getNumRowsChanged();

    // Get the id that was auto-created
    $this->mId = $this->getLastInsertID($this->getTableName());
    Parameters::set($this->mIdKey,$this->mId);

    // Insert in meta table
    $this->dbMetaInsertOrUpdate($this->mId);

    // Insert in group table, if group id is given and we have a group table
    // TODO! Untested
    if (isset($this->mTableNameGroupLink)) {
      $gid = Parameters::get("group_id");
      if ($gid && $gid != ""  && $gid != "nogroup" && $this->mType != "group") {
        $stmt = "INSERT INTO ".$this->mTableNameGroupLink." (group_id,".$this->mType."_id) ".
                "VALUES ('".$gid."','".$this->mId."')";
        //error_log("stmt:".$stmt);
        if (!$this->query($stmt))
          return null;
      }
    }

    // Insert in association table, if association id is given
    // TODO! Missing code

    // Set result message and return
    if ($this->mNumRowsChanged > 0)
      $this->setMessage($this->mInsertSuccessMsg);
    else
      $this->setMessage($this->mInsertNothingToDo);

    $data = array();
    return $this->prepareTypeKindId($data);
  } // dbInsertItem

  protected function dbPrepareInsertStmt()
  {
    // TODO Check for all fields empty
    $unique_table_fields = array_unique($this->mTableFields);
    $stmt = "INSERT INTO ".$this->getTableName()." (";
    $n = 0;
    foreach ($unique_table_fields as $key) {
      if ($key != $this->mIdKeyTable) { // Do not update the id key field
        $val = Parameters::get($key);
        //elog("dbPrepareInsertStmt,".$key.":".$val);
        if ($val && $val != "") { // Only allow values that are set (or blank)
          $stmt.= $key .",";
          ++$n;
        }
      }
    }
    $stmt[strlen($stmt)-1] = " "; // Replace last "," with " "
    $stmt.= ") VALUES (";
    foreach ($unique_table_fields as $key) {
      if ($key != $this->mIdKeyTable) { // Do not update the id key ield
        $val = Parameters::get($key);
        if ($val && $val != "") { // Only allow values that are set (or blank)
          $val = htmlentities((string)$val,ENT_QUOTES,'utf-8',FALSE);
          $stmt .= "'".$val."',";
        }
      }
    }
    $stmt[strlen($stmt)-1] = " "; // Replace last "," with " "
    $stmt.= ")";
    //elog("dbPrepareInsertStmt:".$stmt);
    if ($n == 0) {
      $this->setMessage($this->mInsertNothingToDo);
      return null;
    }
    return $stmt;
  } // dbPrepareInsertStmt

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Update //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @method dbUpdate
   * @description
   * @return data structure on success, null on failure.
   * @example
   */
  public function dbUpdate()
  {
    $err = $this->dbValidateUpdate();
    if ($err != "") {
      $this->setError($err);
      return null;
    }
    $this->mError = "";
    $this->mData = null;
    $this->mNumRowsChanged = 0;

    if (!isset($this->mId) || $this->mId == "") {
      // No id, assume it is a new item
      return $this->dbInsert();
    }
    // We have an id, so we are updating an existing item or a link to one.
    $upd_what = Parameters::get("upd");
    if (!$upd_what) {
      $res = $this->dbUpdateItem();
      if (!$res)
        return null;
    }
    else
    if ($upd_what == "link") {
      if (!$this->dbUpdateLink())
        return null;
      return $this->dbSearch(); // Return the complete data set to client
    }
    else {
      $this->setError("Illegal parameter value: $upd_what. ");
      return null;
    }

    if (method_exists($this,"dbUpdateExtra"))
      $res2 = $this->dbUpdateExtra();

    $data = array();
    return $this->prepareTypeKindId($data);
  } // dbUpdate

  protected function dbValidateUpdate()
  {
    $err = "";
    return $err;
  } // dbValidateUpdate

  protected function dbUpdateItem()
  {
    if (!isset($this->mId) || $this->mId == "")
      return null;
    $this->mNumRowsChanged = 0;
    // Update normal table
    $stmt = $this->dbPrepareUpdateStmt();
    //elog("dbUpdateItem:".$stmt);
    if ($stmt) // May be null if we only update meta fields
      if (!$this->query($stmt))
        return null;
    $this->mNumRowsChanged += $this->getNumRowsChanged();

    // Update meta table
    $this->dbMetaInsertOrUpdate($this->mId);

    // Set result message and return
    if ($this->mNumRowsChanged > 0)
      $this->setMessage($this->mUpdateSuccessMsg);
    else
      $this->setMessage($this->mUpdateNothingToDo);

    $data = array();
    return $this->prepareTypeKindId($data);
  } // dbUpdateItem

  protected function dbPrepareUpdateStmt()
  {
    if (!$this->dbItemExists()) {
      $this->setError($this->mType.$this->mItemUnexists." ($this->mId). ");
      return null;
    }
    $unique_table_fields = array_unique($this->mTableFields);
    $stmt = "UPDATE ".$this->getTableName()." SET ";
    $n = 0;
    $to_set = "";
    foreach ($unique_table_fields as $key) {
      if ($key != $this->mIdKeyTable) { // Do not update the id key field
        $val = Parameters::get($key);
        //elog("dbPrepareUpdateStmt,".$key.":".$val);
        if ($val || $val === "") { // Only allow values that are set (or blank)
          $val = htmlentities((string)$val,ENT_QUOTES,'utf-8',FALSE);
          $to_set .= $this->dbPrepareUpdateStmtKeyVal($key,$val);
          ++$n;
        }
      }
    }
    if ($to_set == "")
      return null;
    $to_set[strlen($to_set)-1] = " "; // Replace last "," with " "
    $stmt.= $to_set." WHERE ".$this->mIdKeyTable."='".$this->mId."' ";
    //elog("dbPrepareUpdateStmt,stmt:".$stmt);
    if ($n == 0) {
      $this->setMessage($this->mUpdateNothingToDo);
      return null;
    }
    return $stmt;
  } // dbPrepareUpdateStmt

  protected function dbPrepareUpdateStmtKeyVal($key,$val)
  {
    if (!isset($val) || $val === null || $val === "")
      return $key."=NULL,";
    return $key."='".$val."',";
  } // dbPrepareUpdateStmtKeyVal

  // Check if item exists
  protected function dbItemExists()
  {
    $stmt = "SELECT * FROM ".$this->getTableName()." WHERE ".$this->mIdKeyTable."=".$this->mId;
    //elog("dbItemExists,stmt:".$stmt);
    if (!$this->query($stmt))
      return false;
    if ($this->getNext(true) === null)
      return false;
    return true;
  } // dbItemExists

  /////////////////////////////////////////////////////////////////////////////
  //////////////////////// Insert or update meta table ////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  protected function dbMetaInsertOrUpdate($id)
  {
    if (!isset($this->mTableFieldsMeta))
      return true;
    $is_err = false;
    // Insert any_ Parameters
    $strarr = Parameters::getStrArr();
    foreach ($strarr as $key => $val) {
      if (in_array($key,$this->mTableFieldsMeta)) {
        //elog($key."=".$val);
        if ($val !== null && $val !== "") {
          $is_err |= $this->dbMetaInsertOrUpdateSingle($id,$key,$val);
        }
      }
    }
    // Insert WP Parameters
    if (defined("WP_PLUGIN") && $this->mType == "user") {
      $first_name  = Parameters::get("first_name");
      $last_name   = Parameters::get("last_name");
      $description = Parameters::get("description");
      if ($first_name || $first_name === "")
        $this->dbMetaInsertOrUpdateSingle($id,"first_name", $first_name);
      if ($last_name || $last_name === "")
        $this->dbMetaInsertOrUpdateSingle($id,"last_name", $last_name);
      if ($description || $description === "")
        $this->dbMetaInsertOrUpdateSingle($id,"description", $description);
    }
    return $is_err;
  } // dbMetaInsertOrUpdate

  protected function dbMetaInsertOrUpdateSingle($id,$key,$val)
  {
    if ($id === null || $id == "" || $key === null || $key == "")
      return false;
    if ($key == ANY_DB_USER_LOGIN && ($val === null || $val == ""))
      return false; // Cannot have blank login_name

    // Check if item exists
    $stmt = "SELECT * FROM ".$this->mTableNameMeta." WHERE ".$this->mIdKeyMetaTable."=".$id." AND meta_key='".$key."' ";
    //elog("dbMetaInsertOrUpdateSingle:".$stmt);
    if (!$this->query($stmt))
      return false;
    $nextrow = $this->getNext(true);
    if ($nextrow === null)
      // Insert
      $stmt = "INSERT INTO ".$this->mTableNameMeta." ".
              "(".$this->mIdKeyMetaTable.",meta_key,meta_value) VALUES (".
              $id.",'".$key."','".$val."'".
              ")";
    else {
      // Update
      $meta_id = $nextrow[$this->mMetaId];
      if ($meta_id === null || $meta_id == "")
        return false;
      $stmt = "UPDATE ".$this->mTableNameMeta." SET ".
              "".$this->mIdKeyMetaTable."='".$id."',".
              "meta_key='"  .$key."',".
              "meta_value='".$val."' ".
              "WHERE ".$this->mMetaId."='".$meta_id."' ";
    }
    //elog("dbMetaInsertOrUpdateSingle:".$stmt);
    if (!$this->query($stmt))
      return false;
    $this->mNumRowsChanged += $this->getNumRowsChanged();
    return true;
  } // dbMetaInsertOrUpdateSingle

  ///////////////////////////////////////////////////////////////////////
  //////////////////////// Insert or update link ////////////////////////
  ///////////////////////////////////////////////////////////////////////

  private function dbUpdateLink()
  {
    $link_type = Parameters::get("link_type");
    if (!$link_type) {
      $this->setError("No link type. ");
      return false;
    }
    $this->mNumRowsChanged = 0;
    $id_key       = $this->mType."_id";
    $id_key_link  = $link_type."_id";
    $id           = Parameters::get($id_key);
    $id_link      = Parameters::get($id_key_link);
    $list_table   = $this->findLinkTableName($link_type);
    $updlist      = explode(",",Parameters::get("add"));
    $dellist      = explode(",",Parameters::get("del"));

    if ($list_table !== null && $list_table !== "" && $link_type != $this->mType) {
      if ($dellist !== null) {
        foreach ($dellist as $delval) {
          if ($delval) {
            $stmt = "DELETE FROM ".$list_table." WHERE ".$id_key_link."='".intval($delval)."' AND ".$id_key."='".intval($id)."'";
            //elog("dbUpdateLink(1):".$stmt);
            if (!$this->query($stmt))
              return false;
          }
        }
      }
      if ($updlist !== null) {
        foreach ($updlist as $insval) {
          if ($insval) {
            // Delete old list so as to avoid error message when inserting (insert-or-update)
            $stmt = "DELETE FROM ".$list_table." WHERE ".$id_key_link."='".intval($insval)."' AND ".$id_key."='".intval($id)."'";
            //elog("dbUpdateLink(2):".$stmt);
            if (!$this->query($stmt))
              return false;
            $stmt = "INSERT INTO ".$list_table." (".$id_key_link.",".$id_key.") VALUES (".intval($insval).",".intval($id).")";
            //elog("dbUpdateLink(3):".$stmt);
            if (!$this->query($stmt))
              return false;
          }
        }
      }
    }
    else { // Subitem with parent of same type
      if ($this->hasParentId()) {
        if ($dellist !== null) {
          foreach ($dellist as $delval) {
            if ($delval && $gid != $id) {
              $stmt = "UPDATE ".$this->getTableName()." SET parent_id=null WHERE ".$id_key."='".intval($delval)."'";
              //elog("dbUpdateLink(4):".$stmt);
              if (!$this->query($stmt))
                return false;
            }
          }
        }
        if ($updlist !== null) {
          foreach ($updlist as $updval) {
            if ($updval && $gid != $id && intval($id) != intval($updval)) {
              $stmt = "UPDATE ".$this->getTableName()." SET parent_id='".intval($id)."' WHERE ".$id_key."='".intval($updval)."'";
              //elog("dbUpdateLink(5):".$stmt);
              if (!$this->query($stmt))
                return false;
            }
          }
        }
      }
    }
    $this->setMessage($this->mUpdateSuccessMsg);
    return true;
  } // dbUpdateLink

  // TODO! Neccessary? Can we use dbUpdateLink instead?
  public function dbAddLink()
  {
    if (!isset($this->mId) || $this->mId == "") {
      $this->setError($this->mType." id missing. ");
      return null;
    }
    $add = Parameters::get("add");
    if (!$add){
      $this->setError("Don't know what to add. ");
      return null;
    }
    $add_id = Parameters::get($add."_id"); // TODO! id
    if (!$add_id){
      $this->setError($add." id missing. ");
      return null;
    }
    // Check if already assigned
    $link_table = $this->findLinkTableName($add);
    if ($link_table === null) {
      $this->setError("Association table not found");
      return null;
    }
    $add_id_key = $add."_id";
    if ($this->dbTableHasLink($link_table, $add_id_key, $add_id, $this->mIdKey, $this->mId)) {
      $this->setMessage($this->mJoinedAlreadyMsg,true);
      return array();
    }
    // Not assigned, we can insert
    if (isset($this->mTableFieldsLeftJoin["user"])) {
      $stmt = "INSERT INTO ".$this->mTableNameUserLink." (";
      for ($t=0; $t<count($this->mTableFieldsLeftJoin["user"]); $t++) {
        $str  = $this->mTableFieldsLeftJoin["user"][$t];
        $stmt.= Parameters::get($str) && Parameters::get($str) != "" ? $str."," : "";
      }
      $stmt[strlen($stmt)-1] = " "; // Replace last "," with " "
      $stmt.= ") VALUES (";
      for ($t=0; $t<count($this->mTableFieldsLeftJoin["user"]); $t++) {
        $str  = $this->mTableFieldsLeftJoin["user"][$t];
        $stmt.= Parameters::get($str) && Parameters::get($str) != "" ? "'".Parameters::get($str)."'," : "";
      }
      $stmt[strlen($stmt)-1] = " "; // Replace last "," with " "
      $stmt .= ")";
      //elog("dbAddLink:".$stmt);
      if (!$this->query($stmt))
        return null;

      $this->setMessage($this->mJoinedSuccessMsg);
    }
    $data = array();
    return $this->prepareTypeKindId($data);
  } // dbAddLink

  // TODO! Neccessary? Can we use dbUpdateLink instead?
  public function dbRemoveLink()
  {
    if (!isset($this->mId) || $this->mId == "") {
      $this->setError($this->mType." id missing. ");
      return null;
    }
    $rem = Parameters::get("rem");
    if (!$rem){
      $this->setError("Don't know what to remove. ");
      return null;
    }
    $rem_id = Parameters::get($rem."_id"); // TODO! id
    if (!$rem_id){
      $this->setError($rem." id missing. ");
      return null;
    }
    // Check if already assigned
    $link_table = $this->findLinkTableName($rem);
    if ($link_table === null) {
      $this->setMessage("Association table not found",true);
      return null;
    }
    $rem_id_key = $rem."_id"; // TODO! id
    if (!$this->dbTableHasLink($link_table, $rem_id_key, $rem_id, $this->mIdKey, $this->mId)) {
      $this->setMessage($this->mLeftAlreadyMsg);
      return array();
    }
    // Assigned, we can delete
    $stmt = "DELETE FROM ".$link_table." ".
            "WHERE ".$rem_id_key."='".$rem_id."' AND ".$this->mIdKey."='".$this->mId."'";
   //elog("dbRemoveLink:".$stmt);
    if (!$this->query($stmt))
      return null;

    $this->setMessage($this->mLeftSuccessMsg);

    $data = array();
    return $this->prepareTypeKindId($data);
  } // dbRemoveLink

  protected function dbTableHasLink($tableName,$idName1,$id1,$idName2,$id2)
  {
    $stmt = "SELECT count(*) AS num_rows FROM ".$tableName." ".
            "WHERE ".$idName1."='".$id1."' AND ".$idName2."='".$id2."'";
    //elog("dbTableHasLink:".$stmt);
    if (!$this->query($stmt))
      return false;
    $row = $this->getNext(true);
    return ($row !== null && $row["num_rows"] > 0);
  } // dbTableHasLink

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Delete //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @method dbDelete
   * @description Deletes an item of given type with given id from a database table
   *              TODO! Delete a list of items.
   * @return data structure on success, null on failure.
   * @example
   */
  public function dbDelete()
  {
    $this->mError = "";
    $this->mData  = null;

    // Delete item(s) from table or file from disk
    $del_what = Parameters::get("del");
    if ($del_what == "ulf") { // Delete file from upload folder
      $fname = Parameters::get("ulf");
      if ($fname)
        unlink(gUploadPath.$fname);
      else {
        $this->setError("Filename missing for delete. ");
        return null;
      }
    }
    else { // Delete from dbase
      $err = $this->dbValidateDelete();
      if ($err != "") {
        $this->setError($err);
        return null;
      }
      $stmt = "DELETE FROM ".$this->getTableName()." WHERE ".$this->mIdKeyTable."='".$this->mId."'";
      //elog("dbDelete:".$stmt);
      if (!$this->query($stmt))
        return null;
      if ($this->getNumRowsChanged() > 0)
        $this->setMessage($this->mDeleteSuccessMsg);
      else
        $this->setMessage($this->mDeleteNothingToDo);

      // Delete from meta table
      $stmt = "DELETE FROM ".$this->mTableNameMeta." WHERE ".$this->mIdKeyMetaTable."='".$this->mId."'";
      //elog("dbDelete:".$stmt);
      if (!$this->query($stmt))
        return null;

      // Update parent_id of children
      if ($this->hasParentId()) {
        $stmt = "UPDATE ".$this->getTableName()." SET parent_id=NULL WHERE parent_id='".$this->mId."'";
        //elog("dbDelete:".$stmt);
        if (!$this->query($stmt))
          return null;
      }
      // Delete from associated tables
      if (isset($this->mPlugins)) {
        foreach ($this->mPlugins as $idx => $plugin) {
          $table = anyTableFactory::create($plugin,$this);
          if ($this->mType !== $plugin) {
            $this->dbDeleteAssoc($table);
          }
        }
      }
      $this->mId = null;
    }
    $data = array();
    return $this->prepareTypeKindId($data);
  } // dbDelete

  protected function dbValidateDelete()
  {
    $err = "";
    if (!isset($this->mId) || $this->mId == "" || !is_numeric($this->mId))
      $err .= $this->mType." id missing. ";
    if (method_exists($this,"dbValidateDeletePermission"))
      $err .= $this->dbValidateDeletePermission();
    return $err;
  } // dbValidateDelete

  public function dbDeleteAssoc($table)
  {
    if (!$table) {
      $this->mError = "System error: No table. ";
      return false;
    }
    if (!isset($this->mId) || $this->mId == "" || !is_numeric($this->mId)) {
      $this->mError = $this->mType." id missing. ";
      return false;
    }
    $type = $table->getType();
    $table_name = $this->findLinkTableName($type);
    $stmt = "DELETE FROM ".$table_name." WHERE ".$this->getIdKey()."='".$this->mId."'";
    //elog("dbDeleteAssoc:".$stmt);
    if (!$this->query($stmt))
      return false;

    return true;
  } // dbDeleteAssoc

} // class anyTable
?>
