<?php
/********************************************************************************************
 *                                                                                          *
 * anyVista is copyright (C) 2011-2023 Arne D. Morken and Balanse Software.                 *
 *                                                                                          *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use. *
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).                  *
 *                                                                                          *
 ********************************************************************************************/

require_once "permission.php";
require_once "anyTableFactory.php";

/**
 * Class for interacting with an anyVista MySql database table.
 *
 * Inherits from `dbTable`, which manages the database connection.
 * Contains methods for doing search, insert, update and delete on a database table.
 * Supports user defined table format, as well as data in (Wordpress) meta tables.
 * The table format must be described in a table class that inherits from `anyTable` -
 * see `types/user/userTable.php` and `types/group/groupTable.php` for examples.
 *
 * ### Data structure:
 *
 * Data read from tables are transferred to the client in the following JSON format:
 *
 *     {
 *       'head': '[type]',                                // Optional.
 *       'data': {                                        // Optional.
 *         'grouping': 'true',                            // Optional.
 *         '+[id]': {                                     // Optional.
 *           'head' | 'item' | 'list': '[type]',          // Mandatory.
 *           '[type]_name':            '[value]',         // Mandatory.
 *           '[type]_id':              '[value]',         // Mandatory if 'list' or 'item'.
 *           'group_type':             '[group_type]',    // Optional. Only valid if [type] == 'group'.
 *           'group_sort_order':       '[integer]',       // Optional. Only valid if [type] == 'group'.
 *           '[key]':       '[value]',                    // Optional. One or more key / value pairs.
 *           ...
 *           'data': {                                    // Optional.
 *             'grouping': 'true',                        // Optional.
 *             '+[id]': {                                 // Optional.
 *               'head' | 'item' | 'list': '[type]',      // Mandatory.
 *               '[type]_name': '[value]',                // Mandatory.
 *               '[type]_id':              '[value]',     // Mandatory if 'list' or 'item'.
 *               'group_type':             '[group_type]',// Optional. Only valid if [type] == 'group'.
 *               'group_sort_order':       '[integer]',   // Optional. Only valid if [type] == 'group'.
 *               'parent_id':              '[id]',        // Optional. The id of the level above, if of the same type.
 *               '[key]':                  '[value]',     // Optional. One or more key / value pairs.
 *               ...
 *             },
 *             ...
 *           }, // data
 *         }
 *         ...
 *       } // data
 *       'types': {                          // Optional
 *         [integer]: '[type name]',         // Optional. One or more type names.
 *         ...
 *       },
 *       'permission': {                     // Mandatory
 *         'current_user_id': '[id]',        // Mandatory
 *         'is_logged_in':    true | false,  // Mandatory
 *         'is_admin':        true | false,  // Mandatory
 *       },
 *       'message': '[string]',              // Optional
 *       'error':   '[string]',              // Optional
 *     }
 *
 * NOTE! When transferring the data structure from a server to the Javascript client the indices of the object will
 * automatically be converted to integers even if they are specified as strings on the server (PHP) side. I.e. "38"
 * will be converted to 38. Then the items in the data structured will be ordered numerically on the client (Javascript)
 * side, which may not be the desired behaviour. In order to avoid this, numeric indices are prefixed with a "+",and the
 * code on the client side then can maintain the ordering of the items.
 *
 * __Example:__ Coming soon.
 *
 * ### Server filters:
 *
 * Each type of data must have a corresponding filter which specifies whether each key of the type
 * should be included in database operations. The keys (e.g. "event_status") should be the same as
 * those in the corresponding filter, though not every name in the filter has to be present as a key.
 * Also keys that are not described in the filter will be ignored. The filters are not part of the
 * data structure sent to the client, which uses its own filters for display. The server filters have
 * the following format:
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

  protected
  /** @var array Contains data for a list or an item. See "Data structure" above. */
            $mData              = null,
  /** @var string The type of the table data (e.g. `user`). */
            $mType              = null,
  /** @var string|int Null if list, non-null if item */
            $mId                = null,
            $mIdKey             = null,
            $mIdKeyTable        = null,
            $mIdKeyMetaTable    = null,
            $mNameKey           = null,
            $mMetaId            = null,
            $mLinkType          = null,  // Used by items that have associated lists // TODO! Send as parameter to methods
            $mLinkId            = null,  // Used by items that have associated lists // TODO! Send as parameter to methods
            $mGrouping          = true,  // Group results by default
            $mSimpleList        = false, // In a "simple" list search we get only the id, name and parent_id
            $mFilters           = null,
            $mLinking           = null,
            $mMaxId             = -1,
            $mNumResults        = 0,
            $mPermission        = null,
            $mOrderBy           = null,
            $mOrderDir          = "ASC",
            $mSortFunction      = null;

  protected $mInsertSuccessMsg  = "",
            $mUpdateSuccessMsg  = "",
            $mDeleteSuccessMsg  = "",
            $mItemUnexists      = " not found. ",
            $mInsertNothingToDo = "Nothing to insert",
            $mUpdateNothingToDo = "Nothing to update",
            $mDeleteNothingToDo = "Nothing to delete";

  private   $mNumRowsChanged    = 0,
            $mLastNumRows       = 0,   // Used to break (theoretical) infinite recursion
            $mPageSize          = 30,  // Number of items returned per page
            $mRecMax            = 100, // Used to avoid infinite recursion
            $mRecDepth          = 0;   // Recursion depth

/**
  * Constructor
  *
  * @param Array $connection Info about the database connection. See `db/dbConnection`.
  * @param Array $defsOrType An array containing the following entries:
  *                          - tableName:          Name of the main table, e.g. "any_event".
  *                          - tableNameMeta:      Name of the meta table, e.g. "any_eventmeta".
  *                          - tableNameGroupLink: Name of the group link table for this table type, e.g. "any_event_group".
  *                          - tableNameUserLink:  Name of the user link table for this table type, e.g. "any_event_user".
  *                          - type:               Type of the table, e.g. "event".
  *                          - idKey:              The id key used by the client, e.g. "event_id" or "user_id".
  *                          - idKeyTable:         The id key used in the table, e.g. "event_id" or "ID".
  *                          - idKeyMetaTable:     The id key used in the meta table, "event_id" or "user_id".
  *                          - nameKey:            The name key used by the client and in the table, e.g. "event_name" or "login_name".
  *                          - orderBy:            The field to sort by. e.g. "event_date_start".
  *                          - orderDir:           The direction of the sort, "ASC" or "DESC".
  *                          - metaId:             The name of the id field in the meta table, e.g. "meta_id" or "umeta_id".
  *                          - fields:             An array containing the field names of the table.
  *                          - fieldsMeta:         An array containing the name of the meta keys of the meta table.
  *                          - fieldsGroup:        An array containing the field names of the group table.
  *                          - fieldsLeftJoin:     An array containing the field names of the user link table.
  *                          - filters:            Filters.
  *                          - types:              An array containing the names of the anyVista types this table can interact with.
  *
  * #### Example
  *```
  *      $conn = new dbConnection();
  *      $userTable = new anyTable($conn,"user");
  *```
  */
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
    // Initiate the database connection
    parent::__construct($connection);
    if (!$this->getConnection()) {
      $this->setError("No connection to database. ");
      return;
    }
    // Initialize properties
    if (!$this->initProperties($defsOrType))
      return;

    // Filters should be defined in the options parameter, but may also
    // be specified / manipulated in the initFilters method.
    $this->initFilters($this->mFilters);

    return;
  } // constructor

  //
  // Set variables from table definitions or type.
  // Setting variables from type can be used in simple situations where
  // the type doesnt need to supply its own mTableDefs object.
  //
  private function initProperties($defsOrType)
  {
    $this->mError   = "";
    $this->mMessage = "";

    $fields = Parameters::get("fields");

    if (gettype($defsOrType) == "array") {
      // Table defs given, check if it is valid
      if (!$this->validateTableDefs($defsOrType))
        return false;

      if ($defsOrType["type"])
        $type = $defsOrType["type"];
      else
        $type = Parameters::get("type");
      if (!$type)
        if ($fields && $fields[0])
          $type = $fields[0];
        else
          $type = null;
      $this->mType = $type;

      // Set variables from table defs
      $this->mTableName           = $defsOrType["tableName"];
      $this->mTableNameMeta       = $defsOrType["tableNameMeta"];
      $this->mTableNameGroupLink  = $defsOrType["tableNameGroupLink"];
      $this->mTableNameUserLink   = $defsOrType["tableNameUserLink"];
      $this->mIdKey               = $defsOrType["idKey"]
                                    ? $defsOrType["idKey"]
                                    : ( Parameters::get($type."_id")
                                        ? Parameters::get($type."_id")
                                        : ( $fields && $fields[0]
                                            ? $fields[0]
                                            : $type."_id"
                                          )
                                      );
      $this->mIdKeyTable          = $defsOrType["idKeyTable"]
                                    ? $defsOrType["idKeyTable"]
                                    : $this->mIdKey;
      $this->mIdKeyMetaTable      = $defsOrType["idKeyMetaTable"];
      $this->mNameKey             = $defsOrType["nameKey"];
      $this->mOrderBy             = isset($defsOrType["orderBy"])  ? $defsOrType["orderBy"]  : null;
      $this->mOrderDir            = isset($defsOrType["orderDir"]) ? $defsOrType["orderDir"] : "ASC";
      $this->mMetaId              = $defsOrType["metaId"];
      // Set table fields, meta table fields and user link table fields
      $this->mTableFields         = $fields
                                    ? $fields
                                    : $defsOrType["fields"];
      $this->mTableFieldsMeta     = $defsOrType["fieldsMeta"];
      $this->mTableFieldsGroup    = $defsOrType["fieldsGroup"];
      $this->mTableFieldsLeftJoin = $defsOrType["fieldsLeftJoin"];
      // Set table filters
      if (isset($defsOrType["filters"]))
        $this->mFilters = $defsOrType["filters"];
      // Set types this class may interact
      if (isset($defsOrType["types"]))
        $this->mLinking = $defsOrType["types"];
    }
    else
    if (!$defsOrType || gettype($defsOrType) == "string") {
      if ($defsOrType)
        $type = $defsOrType;
      else
        $type = Parameters::get("type");
      if (!$type)
        if ($fields && $fields[0])
          $type = $fields[0];
        else
          $type = null;
      $this->mType = $type;

      // Set minimal working values
      $this->mTableName          = "any_".$this->mType;
      $this->mTableNameMeta      = null; // No meta table for auto-generated type/table
      // Group table link
      $ltn = ["group",$this->mType];
      sort($ltn);
      $ltn = "any_".implode("_",$ltn);
      $this->mTableNameGroupLink = $ltn;
      $ltn = ["user",$this->mType];
      sort($ltn);
      $ltn = "any_".implode("_",$ltn);
      $this->mTableNameUserLink  = $ltn;
      $this->mIdKey              = Parameters::get($type."_id")
                                   ? Parameters::get($type."_id")
                                   : ( $fields && $fields[0]
                                       ? $fields[0]
                                       : $type."_id"
                                     );
      $this->mIdKeyTable         = $this->mIdKey;
      $this->mIdKeyMetaTable     = null; // No meta table for auto-generated type/table
      $this->mNameKey            = $this->mType."_name";
      $this->mOrderBy            = $this->mIdKeyTable;
      $this->mMetaId             = null; // No meta table for auto-generated type/table

      // Set default table fields
      $this->mTableFields = $fields
                            ? $fields
                            : [ $this->mIdKey,
                                $this->mNameKey,
                              ];
      // Set default table meta fields
      $this->mTableFieldsMeta = null;

      // Set default table filters
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

    if (!isset($this->mType)) // Option type overrides parameter type
      $this->mType = ltrim(Parameters::get("type"));
    if (!isset($this->mType))
      return "Table type missing. "; // Cannot continue without a type

    // Set some common properties if not already set
    if (!isset($this->mOrderBy))
      $this->mOrderBy = $this->mIdKeyTable;
    if (!isset($this->mMetaId))
      $this->mMetaId = null;
    if (!isset($this->mInsertSuccessMsg))
      $this->mInsertSuccessMsg = ucfirst($this->mType)." created. ";
    if (!isset($this->mUpdateSuccessMsg))
      $this->mUpdateSuccessMsg = ucfirst($this->mType)." updated. ";
    if (!isset($this->mDeleteSuccessMsg))
      $this->mDeleteSuccessMsg = ucfirst($this->mType)." deleted. ";

    if (!isset($this->mId) || $this->mId == "")
      $this->mId = ltrim(Parameters::get($this->mIdKey));

    // Make sure some vital fields exist
    if (!in_array($this->mOrderBy,$this->mTableFields))
      $this->mOrderBy = $this->mTableFields[0];
    if (!in_array($this->mIdKeyTable,$this->mTableFields))
      $this->mIdKeyTable = $this->mTableFields[0];

    $str = Parameters::get("types");
    if ($str)
      $this->mLinking = explode(',', $str);
    if (!isset($this->mLinking))
      $this->mLinking = array();
    if (!in_array($this->mType,$this->mLinking))
      array_unshift($this->mLinking,$this->mType); // Add the current type as a "link" in order to work with sub-items

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
  //if (!isset($tableDefs["tableNameMeta"]))
  //  $err .= "Meta table name missing. ";
    if (!isset($tableDefs["idKey"]))
      $err .= "Id key missing. ";
    if (!isset($tableDefs["idKeyTable"]))
      $err .= "Table id key missing. ";
  //if (!isset($tableDefs["idKeyMetaTable"]))
  //  $err .= "Meta table id key missing. ";
    if (!isset($tableDefs["nameKey"]))
      $err .= "Name key missing. ";
    if ($err !== "") {
      $this->mError = $tableDefs["type"]." ".$err;
      return false;
    }
    return true;
  } // validateTableDefs

  /**
   * initFilters
   *
   * Extra initialization of filters, override this in deriving classes if needed
   */
  protected function initFilters($filters)
  {
  } // initFilters

  private function initFiltersFromParam()
  {
    $fields = Parameters::get("fields");
    if ($fields) {
      $this->mFilters = array();
      foreach ($fields as $name => $val) {
        $this->mFilters["list"][$val] = "1";
        $this->mFilters["item"][$val] = "1";
      }
    }
  } // initFiltersFromParam

  private function initFieldsFromParam()
  {
    $fields = Parameters::get("fields");
    if ($fields) {
      $this->mTableFields = $fields;
    }
  } // initFieldsFromParam

  /////////////////////////
  //////// getters ////////
  /////////////////////////

  /**
   * Returns the table's name.
   */
  public function getTableName()  { return $this->mTableName; }

  /**
   * Returns the meta table's name.
   */
  public function getTableNameMeta()  { return $this->mTableNameMeta; }

  /**
   * Returns the data.
   */
  public function getData()       { return $this->mData; }
  /**
   * Returns the type of the table data.
   */
  public function getType()       { return $this->mType; }
  /**
   * Returns the id of the table data, if an item. If a list, the result is undefined.
   */
  public function getId()         { return $this->mId; }

  /**
   * Returns the id key of the table data.
   */
  public function getIdKey()      { return $this->mIdKey; }

  /**
   * Returns the name name of the table data.
   */
  public function getNameKey()    { return $this->mNameKey; }

  /**
   * Returns the permission object.
   */
  public function getPermission() { return $this->mPermission; }

  /**
   * Override and return true in table classes which have parent_id.
   */
  public function hasParentId()
  {
    return false;
  } // hasParentId

  /////////////////////////
  //////// finders ////////
  /////////////////////////

  protected function findDefaultHeader($type,$skipOther=false)
  {
    $other = $skipOther ? "" : "Other "; // TODO: i18n
    return $other.$type."s";             // TODO: i18n
  } // findDefaultHeader

  protected function findDefaultListHeader($type)
  {
    return ucfirst($type)." list"; // TODO: i18n
  } // findDefaultListHeader

  protected function findDefaultItemHeader($type,$inData)
  {
    if (!$inData)
      return ucfirst($type);
    $ix = isset($inData["+".$this->mId])
          ? "+".$this->mId
          : $this->mId;
    $hdr = "";
    if (isset($inData[$ix][$this->mNameKey]))
      $hdr = $inData[$ix][$this->mNameKey];
    else
    if (isset($this->mLinkId))
      $this->setError($this->mNameKey." missing"); // TODO: i18n
    return $hdr;
  } // findDefaultItemHeader

  protected function findDefaultItemListHeader($type,$data=null,$skipOther=false)
  {
    return $this->findDefaultHeader($type,$skipOther);
  } // findDefaultItemListHeader

  protected function findDefaultNogroupHeader($type,$skipOther=false)
  {
    return $this->findDefaultHeader($type,$skipOther);
  } // findDefaultNogroupHeader

  protected function findMetaTableId($type)
  {
    $str = $type."_id";
    return $str;
  } // findMetaTableId

  protected function findMetaTableName($linkType)
  {
    if ($linkType == "user")
      $str = ANY_DB_USERMETA_TABLE;
    else
      $str = "any_".$linkType."meta";
    return $str;
  } // findMetaTableName

  protected function findLinkTableId($type)
  {
    $str = $type."_id";
    return $str;
  } // findLinkTableId

  protected function findLinkTableName($type)
  {
    if ($type === null || $type === "")
      return null;
    if ($type == $this->mType)
      return $this->mTableName;
    $ltn = [$type,$this->mType];
    sort($ltn);
    $ltn = "any_".implode("_",$ltn);
    return $ltn;
  } // findLinkTableName

  protected function findTypeTableId($type)
  {
    if ($type == "user")
      $str = ANY_DB_USER_ID;
    else
      $str = $type."_id";
    return $str;
  } // findTypeTableId

  protected function findTypeTableName($type)
  {
    if ($type == "user")
      $str = ANY_DB_USER_TABLE;
    else
      $str = "any_".$type;
    return $str;
  } // findTypeTableName

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Searches ////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Search database for an item, a list, a max id or a list of parents.
   *
   * If this->mId == "max", search for max id.
   * If this->mId == "par", search for parent list.
   * If this->mId has another non-null value, search for the item with the given id.
   * Otherwise, search for a list.
   *
   * @return array|null Data array, or null on error or no data
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

    $this->initFieldsFromParam();
    $this->initFiltersFromParam();

    if ($this->mId == "max")
      $ok = $this->dbSearchMaxId();
    else
    if ($this->mId == "par")
      $ok = $this->dbSearchParents();
    else
    if ($this->mId || $this->mId === 0)
      $ok = $this->dbSearchItem($this->mData,$this->mIdKeyTable,$this->mId);
    else {
      $g = Parameters::get("grouping");
      $s = Parameters::get("simple");
      $this->mGrouping   = $g !== false && $g !== "false" && $g !== "0";
      $this->mSimpleList = $s === true  || $s === "true"  || $s === "1";
      $this->mLinkType   = null;
      $this->mLinkId     = null;
      $ok = $this->dbSearchList($this->mData);
    }
    if (!$ok)
      return null;
    if ($this->mId == "max" || $this->mId == "par")
      return ($this->mData); // dbSearchMaxId() and dbSearchParents() do not need to call prepareData()
    return $this->prepareData($this->mData);
  } // dbSearch

  protected function dbValidateSearch()
  {
    $err = "";
    if (!$this->mType)
      $err .= "Type missing. ";
    return $err;
  } // dbValidateSearch

  ////////////////////////////// Misc. searches //////////////////////////////

  //
  // Find max id for a table. Will only work for tables with AUTO_INCREMENT rows.
  //
  protected function dbSearchMaxId()
  {
    $this->mError    = "";
    $this->mData     = null;
    $this->mGrouping = false;

  //$stmt = "SELECT MAX(".$this->mIdKeyTable.") FROM ".$this->mTableName;
    $stmt = "SELECT AUTO_INCREMENT FROM information_schema.tables ".
            "WHERE table_name = '".$this->mTableName."' ".
            "AND table_schema = DATABASE( )";
    //elog("dbSearchMaxId query:".$stmt);
    if (!$this->query($stmt))
      return false;
    $nextrow = $this->getNext(true);
    $this->mMaxId = $nextrow !== null && isset($nextrow["AUTO_INCREMENT"])
                    ? $nextrow["AUTO_INCREMENT"]
                    : -1;
    //elog("dbSearchMaxId,mMaxId:".$this->mMaxId);
    if ($this->mMaxId == -1)
      $this->setError("Max id not found, AUTO_INCREMENT missing from table? ");
    $this->mData = [];
    $this->mData["id"] = $this->mMaxId;
    return $this->mData;
  } // dbSearchMaxId

  //
  // Find all items of a certain type and return simple list of id/name pairs.
  //
  protected function dbSearchParents()
  {
    $this->mError      = "";
    $this->mData       = null;
    $this->mGrouping   = true;
    $this->mSimpleList = true;
    $this->mLinkType   = null;
    $this->mLinkId     = null;
    if (!$this->dbSearchList($this->mData))
      return null;

    // TODO! Untested code below.
    /*
    $lf   = $this->mLinkType;
    $lfid = $this->mLinkId;
    $this->mLinkType = null;
    $this->mLinkId   = null;
    $this->mSimpleList = false;
    $this->dbSearchList($items);
    $this->mLinkType = $lf;
    $this->mLinkId   = $lfid;
    //elog("dbSearchParents,items:".var_export($items,true));
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
    $this->mData = $sel_arr;
    */

    return $this->mData;
  } // dbSearchParents

  //////////////////////////////// Item search ////////////////////////////////

  //
  // Search database for an item, including meta data and linked lists.
  //
  // Returns true on success, false on error.
  //
  protected function dbSearchItem(&$data,$key,$val,$skipLinks=false,$includeUser=true)
  {
    if ($key === null || $key == "" || $val === null || $val == "") {
      $this->setError("Missing key ($key) or value ($val). ");
      return false;
    }
    // Build and execute the query
    $stmt = $this->dbPrepareSearchItemStmt($key,$val,$includeUser);
    //elog("dbSearchItem:".$stmt);
    if (!$stmt || !$this->query($stmt))
      return false; // An error occured

    // Get the data
    if ($this->getRowData($data,"item")) {
      $this->dbSearchMeta($data,"item"); // Search and get the meta data
      if (!$skipLinks)
        $this->dbSearchItemLists($data); // Get lists associated with the item
      $data["+".$this->mId]["item"] = $this->mType;
      $data["id"] = $this->mId;

    }
    return !$this->isError();
  } // dbSearchItem

  protected function dbPrepareSearchItemStmt($key,$val,$includeUser=true)
  {
    // Get query fragments
    $this->mError = "";
    $includeUser  = $includeUser &&
                    $this->mType != "user" &&
                    isset($this->mTableFieldsLeftJoin) &&
                    isset($this->mTableFieldsLeftJoin["user"]) &&
                    $this->tableExists($this->mTableNameUserLink);
    $select       = $this->findItemSelect($includeUser);
    $left_join    = $this->findItemLeftJoin($includeUser);
    $where        = $this->findItemWhere($key,$val);
    $stmt = $select.
            "FROM ".$this->mTableName." ".
            $left_join.
            $where;
    return $stmt;
  } // dbPrepareSearchItemStmt

  protected function findItemSelect($includeUser)
  {
    // Select from own table
    $si = "SELECT DISTINCT ".$this->mTableName.".* ";

    // Select from left joined user table (if this is not a user table)
    if ($includeUser)
      foreach ($this->mTableFieldsLeftJoin["user"] as $field)
        $si .= ", ".$this->mTableNameUserLink.".".$field;
    // Get parent name
    if ($this->hasParentId())
      $si .= ", temp.".$this->mNameKey." AS parent_name";
    $si .= " ";
    return $si;
  } // findItemSelect

  protected function findItemLeftJoin($includeUser)
  {
    $lj = "";
    // Left join user table (if this is not a user table)
    if ($includeUser) {
      $lj .= "LEFT JOIN ".$this->mTableNameUserLink." ".
             "ON "       .$this->mTableNameUserLink.".".$this->mIdKeyTable."='".$this->mId."' ";
      $cur_uid = $this->mPermission["current_user_id"];
      if ($cur_uid || $cur_uid === 0)
        $lj .= "AND ".$this->mTableNameUserLink.".user_id='".$cur_uid."' ";
    }
    // Get parent name
    if ($this->hasParentId())
      $lj .= "LEFT JOIN ".$this->mTableName." temp ".
             "ON "       .$this->mTableName.".parent_id=temp.".$this->mIdKey." ";
    return $lj;
  } // findItemLeftJoin

  protected function findItemWhere($key,$val)
  {
    $where = "WHERE ".$this->mTableName.".".$key."='".utf8_encode($val)."' ";
    return $where;
  } // findItemWhere

  //
  // Search for lists associated with the item
  //
  protected function dbSearchItemLists(&$data)
  {
    // If no link types found, return with no error
    if (!isset($this->mLinking))
      return true;
    // Must have an id
    if (!isset($this->mId) || $this->mId == "") {
      $err = "Id missing while searching for linked lists. "; // TODO! i18n
      $this->setError($err);
      return false;
    }
    // Get group data to a "flat" list
    $group_id    = Parameters::get("group_id");
    $group_table = anyTableFactory::createClass("group",$this);
    $group_table->mGrouping = false;

    // Search through all registered link types/tables
    $idx = "+".$this->mId;
    foreach ($this->mLinking as $i => $link_type) {
      $table = anyTableFactory::createClass($link_type,$this);
      if ($table) {
        $link_table = $this->findLinkTableName($link_type);
        if ($table->mType != $this->mType || $this->hasParentId()) {
          if ($this->tableExists($link_table)) {
            $g = Parameters::get("grouping");
            $s = Parameters::get("simple");
            $table->mGrouping   = $g !== false && $g !== "false" && $g !== "0";
            $table->mSimpleList = $s === true  || $s === "true"  || $s === "1";
            $table->mLinkType   = $this->mType;
            $table->mLinkId     = $this->mId;
            $table_data         = null;
            $group_table->dbSearchGroupInfo($table->mType,$group_id);
            if (!$table->dbSearchList($table_data,$group_table))
              $this->mError .= $table->getError();
            if ($table_data) {
              $link_idx = "link-".$link_type;
              $name_key = $table->getNameKey();
              $data[$idx]["data"]["grouping"] = $table->mGrouping;
              $data[$idx]["data"][$link_idx]["grouping"] = $table->mGrouping;
              $data[$idx]["data"][$link_idx]["head"]     = $link_type;
              $data[$idx]["data"][$link_idx]["data"]     = $table_data;
              if ($name_key)
                $data[$idx]["data"][$link_idx][$name_key] = $this->findDefaultItemListHeader($link_type,$table_data,true);
            }
          }
        }
      }
    } // foreach
    return true;
  } // dbSearchItemLists

  //////////////////////////////// List search ////////////////////////////////

  //
  // Search database for a list, including meta data
  // Since a 'LIMIT' operator might apply, we need to search for results for
  // each group separately rather then using a LEFT JOIN on the group table.
  // However, if "group_id" is specified, we need only search in that group.
  //
  // Returns true on success, false on error
  //
  protected function dbSearchList(&$data,$group_table=null)
  {
    $group_id = Parameters::get("group_id");
    if ($group_table != null)
      $group_data = $group_table->mData;
    else
    if ($this->mType != "group") {
      // Get group data to a "flat" list
      $my_grouping = $this->mGrouping;
      $group_table = anyTableFactory::createClass("group",$this);
      $group_table->mGrouping = false;
      $group_data  = $group_table->dbSearchGroupInfo($this->mType,$group_id);
      //vlog("dbSearchList,group_data($this->mType,$group_id):",$group_data);
      if ((empty($group_data) || !isset($group_data["group"])) && $group_table)
        $this->setError($group_table->mError);
      if ($this->mType == "group")
        $this->mGrouping = $my_grouping;
    }
    $order = Parameters::get("order");
    if ($order) {
      $this->mOrderBy = ltrim($order);
      if (Parameters::get("dir"))
        $this->mOrderDir = ltrim(Parameters::get("dir"));
    }
    $limit = !$this->mSimpleList ? $this->findLimit() : ""; // Use same limit for all groups
    $this->mNumResults = 0; // Init total number of results
    // Build and execute the query
    if ($group_id && $this->mType != "group") {
      // Query data from the given group (or "nogroup")
      $success = $this->dbExecListStmt($data,$group_id,$limit);
    }
    else
    if (!$this->mGrouping || $this->mType == "group") {
      // Query all data, non-grouped
      $success = $this->dbExecListStmt($data,null,$limit);
    }
    else {
      // Query grouped data
      $success = false;
      $has_nogroup = false;
      if ($group_data && isset($group_data["group"])) {
        foreach ($group_data["group"] as $gid => $group) {
          if ($group["group_type"] == $this->mType) {
            if ($this->tableExists($this->mTableNameGroupLink))
              $success = $this->dbExecListStmt($data,$gid,$limit) || $success;
            if ($gid == "nogroup")
              $has_nogroup = true;
          }
        }
      }
      // Build and execute the query for ungrouped data
      if ($has_nogroup)
        $success = $this->dbExecListStmt($data,"nogroup",$limit) || $success;
    }
    if ($success) {
      // Search and get the meta data
      if (!$this->mSimpleList)
        $this->dbSearchMeta($data,"list");

      // Sort the list
      if ($this->mSortFunction)
        call_user_func($this->mSortFunction);

      // Group the data and build the data tree
      if (!$group_table) {
        $group_table = $this;
        $group_data  = $this->mData;
      }
      if ($this->mType != "group")
        $group_table->mGrouping = true;
      $group_data["group"] = $group_table->buildDataTree($group_data["group"]);
      $this->buildGroupTreeAndAttach($data,$group_data);
    }
    return !$this->isError();
  } // dbSearchList

  protected function dbExecListStmt(&$data,$gid=null,$limit="")
  {
    // Build and execute the query for a group
    if ($gid == "nogroup")
      $gid = null;
    $partial_stmt = $this->dbPrepareSearchListStmt($gid);
    $stmt = $partial_stmt.$limit;
    //elog("dbExecListStmt1:".$stmt);
    if (!$stmt || !$this->query($stmt) || $this->isError())
      return false; // Something went wrong

    // Get the data
    $success = $this->getRowData($data,"list");

    if ($limit != "") {
      // Count how many rows would have been returned without LIMIT
      $part_stmt = $this->dbPrepareSearchListStmt($gid);
      $count_stmt = "SELECT count(*) AS num_results FROM (".
                    $part_stmt.
                    ") AS dummy";
      //elog("dbExecListStmt2:".$count_stmt);
      if (!$this->query($count_stmt))
        return false; // An error occured
      $row = $this->getNext(true);
      if ($row && isset($row["num_results"]) && $row["num_results"] != "0") {
        if (!$gid) {
          if (!$this->mGrouping || $this->mSimpleList)
            $gr_idx = $this->mType;
          else
          $gr_idx = "nogroup";
        }
        else
        if (isInteger($gid))
          $gr_idx = intval($gid);
        else
          $gr_idx = $gid;
        $data[$gr_idx]["grouping_num_results"] = $row["num_results"];
        $this->mNumResults += $row["num_results"];
        //elog("num_res:".$this->mNumResults);
      }
    } // if
    return $success;
  } // dbExecListStmt

  protected function dbPrepareSearchListStmt($gid=null)
  {
    // Get query fragments
    $select    = $this->findListSelect($gid);
    $left_join = $this->findListLeftJoin($gid);
    $where     = $this->findListWhere($gid);
    $order_by  = $this->findListOrderBy();

    // Build the query
    $stmt = $select.
            "FROM ".$this->mTableName." ".
            $left_join.
            $where.
            $order_by;
    return $stmt;
  } // dbPrepareSearchListStmt

  protected function findListSelect($gid)
  {
    // Select from own table
    $sl = "SELECT DISTINCT ".$this->mTableName.".* ";

    // Always select from group table, except if has parent_id while being a list-for list
    if ($gid /*&& isset($this->mTableFieldsGroup) &&
        !($this->hasParentId() && (isset($this->mLinkType) || (isset($this->mId) && $this->mId != "")))*/) {
      if ($this->mType != "group" &&
          $this->tableExists($this->mTableNameGroup)) {
        foreach ($this->mTableFieldsGroup as $field)
          $sl .= ", ".$this->mTableNameGroup.".".$field;
      }
    }
    // Select from link table
    if (isset($this->mLinkId) && $this->mLinkId != "" && isset($this->mLinkType)) {
      if ($this->mLinkType != "group" &&
          isset($this->mTableFieldsLeftJoin) && isset($this->mTableFieldsLeftJoin[$this->mLinkType])) {
        $linktable = $this->findLinkTableName($this->mLinkType);
        if ($this->tableExists($linktable)) {
          foreach ($this->mTableFieldsLeftJoin[$this->mLinkType] as $field)
            $sl .= ", ".$linktable.".".$field;
        }
      }
      if ($this->hasParentId())
        $sl .= ", temp.".$this->mNameKey." AS parent_name";
    }
    $sl .= " ";
    return $sl;
  } // findListSelect

  protected function findListLeftJoin($gid)
  {
    $cur_uid = $this->mPermission["current_user_id"];
    $lj = "";
    // Always left join group table, except if has parent_id while being a list-for list
    if ($this->mType != "group")
      $lj .= $this->findListLeftJoinOne($cur_uid,"group",$gid);

    // Left join link  table
    if (isset($this->mLinkId) && $this->mLinkId != "" && isset($this->mLinkType)) {
      if ($this->mLinkType != "group" &&
          isset($this->mTableFieldsLeftJoin) && isset($this->mTableFieldsLeftJoin[$this->mLinkType])) {
        $lj .= $this->findListLeftJoinOne($cur_uid,$this->mLinkType,$gid);
      }
    }
    if ($this->hasParentId())
      $lj .= "LEFT JOIN ".$this->mTableName." temp ON ".$this->mTableName.".parent_id=temp.".$this->mIdKey." ";
    return $lj;
  } // findListLeftJoin

  protected function findListLeftJoinOne($cur_uid,$link_type,$gid)
  {
    $linktable     = $this->findLinkTableName($link_type);
    $typetable     = $this->findTypeTableName($link_type);
    $metatable     = $this->findMetaTableName($link_type);

    $linktable_id  = $this->findLinkTableId($link_type);
    $typetable_id  = $this->findTypeTableId($link_type);
    $metatable_id  = $this->findMetaTableId($link_type);

    $has_linktable = $this->tableExists($linktable);
    $has_typetable = $this->tableExists($typetable);
    $has_metatable = $this->tableExists($metatable);

    $lj = "";
    if ($has_linktable) {
      $lj .= "LEFT JOIN ".$linktable.  " ON CAST(".$linktable.".".$this->mIdKey.  " AS INT)=CAST(".$this->mTableName.".".$this->mIdKeyTable." AS INT) ";
      if (!isset($this->mLinkType) && $link_type == "user" && $cur_uid)
        $lj .= "AND CAST(".$linktable.".".$linktable_id." AS INT)=CAST(".$cur_uid." AS INT) "; // Only return results for current user
      if ($has_typetable) {
        if ($link_type != "group") {
          $lj .= "LEFT JOIN ".$typetable." ON CAST(".$linktable.".".$linktable_id." AS INT)=CAST(".$typetable.".".$typetable_id." AS INT) ";
          if ($has_metatable)
            $lj .= "LEFT JOIN ".$metatable.  " ON CAST(".$metatable.".".$metatable_id." AS INT)=CAST(".$typetable.".".$typetable_id." AS INT) ";
        }
      }
    }
    if ($has_typetable && $link_type == "group" && $gid) {
      $db_gid = is_numeric($gid) ? "CAST(".$gid." AS INT)" : "'".$gid."'";
      $lj .= "LEFT JOIN ".$typetable." ON CAST(".$typetable.".".$typetable_id." AS INT)=".$db_gid." ";
      $lj .= "AND ".$this->mTableNameGroup.".group_type='".$this->mType."' ";
      if ($has_metatable) {
        $lj .= "LEFT JOIN ".$metatable.  " ON CAST(".$metatable.".".$metatable_id." AS INT)=".$db_gid." ";
        $lj .= "AND ".$this->mTableNameGroup.".group_type='".$this->mType."' ";
      }
    }
    return $lj;
  } // findListLeftJoinOne

  protected function findListWhere($gid)
  {
    $has_group_linktable = $this->tableExists($this->mTableNameGroupLink);
    $skipOwnType = $this->mLinkType == $this->mType;
    $where = null;
    $link_table = $this->findLinkTableName($this->mLinkType);
    if (!$skipOwnType &&
        isset($this->mLinkType) &&
        isset($this->mLinkId)   && $this->mLinkId != "nogroup" &&
        $this->tableExists($link_table)) {
      $where_id = $link_table.".".$this->mLinkType."_id='".$this->mLinkId."' "; // TODO! semi-hardcoded id of link table
      $where = "WHERE ".$where_id;
    }
    // If has parent_id while being a list-for list
    if ($this->hasParentId() && (isset($this->mLinkType) || (isset($this->mId) && $this->mId != ""))) {
      if (isset($this->mId) && $this->mId != "" && is_numeric($this->mId) &&
          (!isset($this->mLinkType) || (isset($this->mLinkType) && $this->mLinkType == $this->mType))) {
        $gstr = $this->mTableName.".".$this->mIdKeyTable." IN ( ".
                "SELECT ".$this->mTableName.".".$this->mIdKeyTable." ".
                "FROM (SELECT @pv := '$this->mId') ".
                "INITIALISATION WHERE find_in_set(".$this->mTableName.".parent_id, @pv) > 0 ".
                "AND   @pv := concat(@pv, ',', ".$this->mTableName.".".$this->mIdKeyTable.") ".
                ") ";
        if ($where === null)
          $where  = "WHERE (".$gstr.") ";
        else
          $where .= " OR (".$gstr.") ";
        if (isset($gid) && $has_group_linktable)
          $where .= "AND ".$this->mTableNameGroupLink.".group_id=CAST(".$gid." AS INT) ";
      }
    }
    if ($skipOwnType &&
        $this->mId != "nogroup") {
      $skip_str = $this->mTableName.".".$this->mIdKeyTable." != '".$this->mId."'";
      if ($where === null)
        $where  = "WHERE (".$skip_str.") ";
      else
        $where .= " AND (".$skip_str.") ";
    }
    $search_term = Parameters::get("term");
    if ($search_term) {
      $term_str = $this->mTableName.".".$this->mNameKey." LIKE '%".$search_term."%'";
      if ($where === null)
        $where  = "WHERE (".$term_str.") ";
      else
        $where .= " AND (".$term_str.") ";
    }
    if ($gid) {
      $group_type = Parameters::get("group_type");
      if ($group_type) {
        $gt_str = $this->mTableNameGroup.".group_type='".$group_type."' ";
        if ($where === null)
          $where  = " WHERE ".$gt_str;
        else
          $where .= " AND ".$gt_str;
      }
      if (!isset($this->mLinkType)) {
        if ($has_group_linktable) {
          $db_gid = is_numeric($gid) ? "CAST(".$gid." AS INT)" : "'".$gid."'";
          $lf_str = $this->mTableNameGroup.".group_id=".$db_gid." ";
          if ($where === null)
            $where  = " WHERE ".$lf_str;
          else
            $where .= " AND ".$lf_str;
          $where .= "AND ".$this->mTableNameGroupLink.".group_id=CAST(".$gid." AS INT) ";
        }
        else {
          if ($this->mMessage == "")
            $this->mMessage .= "No link table for '$this->mType' group. ";
        }
      }
    }
    else {
      if ($this->mGrouping && $this->mType != "group" && $has_group_linktable &&
          !($this->hasParentId() && (isset($this->mLinkType) || (isset($this->mId) && $this->mId != "")))) {
        $n_str = $this->mTableNameGroupLink.".group_id is null ";
        if ($where === null)
          $where  = " WHERE ".$n_str;
        else
          $where .= " AND ".$n_str;
      }
    }
    return $where;
  } // findListWhere

  protected function findListOrderBy()
  {
    if (!isset($this->mOrderBy))
      return "";
    $dir = $this->mOrderDir ? $this->mOrderDir : "";
    if (!in_array($this->mOrderBy,$this->mTableFields))
      $this->mOrderBy = $this->mTableFields[0];
    $ob = "ORDER BY ".$this->mTableName.".".$this->mOrderBy." ".$dir." ";
    return $ob;
  } // findListOrderBy

  protected function findLimit()
  {
    $num = Parameters::get("num");
    if (!$num)
      return "";
    $lim = "LIMIT ".$num." ";
    $from = Parameters::get("from");
    if ($from)
      $lim .= "OFFSET ".$from." ";
    return $lim;
  } // findLimit

  protected function setSortFunction($sortFunc)
  {
    $this->mSortFunction = $sortFunc;
  } // setSortFunction

  //////////////////////////////// Metadata search ////////////////////////////////

  // Get the meta data
  protected function dbSearchMeta(&$data,$kind)
  {
    if (!$this->tableExists($this->mTableNameMeta)) {
      $this->mMessage .= "No meta table for '$this->mType' type. ";
      return false;
    }

    $meta_id = Parameters::get($this->mIdKeyMetaTable);
    $is_list = (!isset($this->mId) || $this->mId == "");
    $where   = $meta_id !== null && $meta_id !== "" && !$is_list
              ? "WHERE ".$this->mTableNameMeta.".".$this->mIdKeyMetaTable."='".$meta_id."' "
              : "";
    /* TODO! Untested (left join with link table)
    $left_join  = null;
    $link_table = $this->findLinkTableName($this->mLinkType);
    if (isset($this->mLinkType) && isset($this->mLinkId) && $link_table !== null) {
      if ($this->mLinkType != $this->mType && $this->mLinkType != "group") {
        $left_join = "LEFT JOIN ".$link_table." ON ".$link_table.".".$this->mLinkType."_id='".$this->mLinkId."' ";
        $where_id = $this->mTableNameMeta.".".$this->mIdKeyMetaTable."=".$link_table.".".$this->mIdKeyMetaTable." ";
        if ($where === null)
          $where  = "WHERE ".$where_id;
        else
          $where .= " AND " .$where_id;
      }
    }
    */
    $has_grp_lnk     = isset($this->mTableNameGroupLink) &&
                             $this->tableExists($this->mTableNameGroupLink);
    $group_id_sel    = $has_grp_lnk && $is_list || isset($this->mLinkType) ? ",".$this->mTableNameGroupLink.".group_id " : " ";
    $group_type_sel  = /*$has_grp_lnk && $this->mType == "group" ? ",any_group.group_type" :*/ " ";
    $group_left_join = $has_grp_lnk ? "LEFT JOIN ".$this->mTableNameGroupLink." ".
                                      "ON ".$this->mTableNameMeta.".".$this->mIdKeyMetaTable."=".$this->mTableNameGroupLink.".".$this->mIdKeyMetaTable." "
                                    : "";
    $stmt = "SELECT ".$this->mTableNameMeta.".* ".
            $group_type_sel.
            $group_id_sel.
            "FROM ".$this->mTableNameMeta." ".
            $group_left_join.
            //$left_join.
            $where;
    //elog("dbSearchMeta:".$stmt);
    if (!$this->query($stmt))
      return false;

    // Get the data
    return $this->getRowMetaData($data,$kind);
  } // dbSearchMeta

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Data retrieval //////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  //
  // Get the data from query result to array
  //
  protected function getRowData(&$data,$kind)
  {
    $this->mLastNumRows = 0; // Used to break (theoretical) infinite recursion
    $filter = $kind == "list"
              ? $this->mFilters["list"]
              : $this->mFilters["item"];
    //elog("getRowData,filter:".var_export($filter,true));
    if (!$data)
      $data = array();
    $has_meta_table  = $this->tableExists($this->mTableNameMeta);
    while (($nextrow = $this->getNext(true)) !== null) {
      //elog("getRowData,nextrow:".var_export($nextrow,true));
      ++$this->mLastNumRows;
      $gid  = isset($nextrow["group_id"])
              ? $nextrow["group_id"]
              : "nogroup";
      $gidx = $this->mGrouping && $this->mType != "group"
              ? $gid
              : $this->mType;
      $idx = isset($nextrow[$this->mIdKeyTable])
             ? $nextrow[$this->mIdKeyTable]
             : null;
      if (!$idx && $idx !== 0)
        continue;

      // Force idx to be a string in order to maintain ordering when sending JSON data to a json client
      $idx = isInteger($idx) ? "+".$idx : $idx;

      if ($kind == "list" || $kind == "head")
        $data[$gidx][$idx][$kind] = $this->mType; // TODO! Shouldnt it be data[gidx]["data"][idx] ?
      else // kind == "item"
        $data[$idx][$kind] = $this->mType;

      // Main table
      if (isset($this->mTableFields)) {
        for ($t=0; $t<count($this->mTableFields); $t++) {
          $field = $this->mTableFields[$t];
          if (!$this->mSimpleList || $field == $this->mIdKeyTable || $field == $this->mNameKey || $field == "parent_id")
            $this->getCellData($field,$nextrow,$data,$idx,$gidx,$filter,$kind);
        } // for
      }

      // Meta table
      if (isset($this->mTableFieldsMeta) && $has_meta_table) {
        for ($t=0; $t<count($this->mTableFieldsMeta); $t++) {
          $field = $this->mTableFieldsMeta[$t];
          if (!$this->mSimpleList || $field == $this->mIdKey || $field == $this->mNameKey || $field == "parent_id")
            $this->getCellData($field,$nextrow,$data,$idx,$gidx,$filter,$kind);
        } // for
      }

      // Link tables for item
      if (isset($this->mLinking)) {
        foreach ($this->mLinking as $i => $link_type) {
          if (isset($this->mTableFieldsLeftJoin[$link_type])) {
            for ($t=0; $t<count($this->mTableFieldsLeftJoin[$link_type]); $t++) {
              $field = $this->mTableFieldsLeftJoin[$link_type][$t];
              if (!$this->mSimpleList || $field == $this->mIdKey || $field == $this->mNameKey || $field == "parent_id")
                $this->getCellData($field,$nextrow,$data,$idx,$gidx,$filter,$kind);
            } // for
          }
        } // foreach
      }
    } // while
    //elog("getRowData1 ($this->mType),data:".var_export($data,true));

    if ($data === null || empty($data))
      return false;
    return true;
  } // getRowData

  protected function getCellData($tablefield,$nextrow,&$data,$idx,$gidx,$filter,$kind)
  {
    if ($nextrow != null) {
      if ($tablefield == $this->mIdKeyTable)
        $field = $this->mIdKey; // Map id name (e.g. "user_id" and not "ID")
      else
        $field = $tablefield;
      if (isset($nextrow[$tablefield])) {
        if ($tablefield == "user_pass") // TODO! "user_pass" is Wordpress specific
          $val = ""; // Never send password to client
        else
        if (($filter === null || (isset($filter[$field]) && $filter[$field] == 1)))
          $val = htmlentities((string)$nextrow[$tablefield],ENT_QUOTES,'utf-8',FALSE);
        else
          $val = null;
        if ($val != null && $val != "") {
          if ($kind == "list" || $kind == "head")
            $data[$gidx][$idx][$field] = $val;
          else
            $data[$idx][$field] = $val;
          //elog("getCellData:$gidx,$idx,$tablefield,$field:".$val);
        }
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
        $type_id = $this->mIdKey; // TODO! Use $this->mIdKeyTable?
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
  protected function getRowMetaData(&$data,$kind)
  {
    if (!$this->tableExists($this->mTableNameMeta))
      return false;
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
              : (!$this->mGrouping
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
  // Build the data group tree for all groups for a list search.
  //
  protected function buildGroupTreeAndAttach(&$data,$group_data)
  {
    if (!$data)
      return;
    $this->mRecDepth = 0;

    // Make sure parent/child items are present in all groups where parent exists
    //vlog("buildGroupTreeAndAttach,data before copying parent/child:",$data);
    foreach ($data as $gidx => $grp) {
      foreach ($grp as $idx => $item) {
        if (isset($item["parent_id"])) {
          $pid = $item["parent_id"];
          foreach ($data as $gidx2 => &$grp2) {
            $item_parent = isset($grp2[$pid])
                           ? $grp2[$pid]
                           : ( isset($grp2["+".$pid])
                               ? $grp2["+".$pid]
                               : null );
            if ($item_parent && $gidx2 != $gidx) {
              //elog("found child $idx in group $gidx with parent $pid...");
              if (!isset($grp2[$idx]) && !isset($grp2["+".$idx]))
                $grp2[$idx] = $item;  // Copy child to other group
              if (!isset($grp[$pid]) && !isset($grp["+".$pid])) {
                $name = $item[$this->mNameKey];
                $err = "Warning: Item $idx ($name) does not have parent in same group. ";
                $this->setMessage($err);
                error_log($err);
              }
            }
          }
        }
      }
    }

    // Build data tree
    //vlog("buildGroupTreeAndAttach,group_data:",$group_data);
    //vlog("buildGroupTreeAndAttach,data before building tree:",$data);
    $data_tree = array();
    $data_tree["grouping"] = $this->mGrouping;
    foreach ($data as $gidx => $grp) {
      $ngidx = isset($this->mLinkId)
               ? $this->mType
               : ( isInteger($gidx)
                   ? "+".$gidx
                   : $gidx );
      $data_tree[$ngidx] = array();
      if ($this->mGrouping && !empty($data[$gidx])) { // Add a head data layer
        $data_tree[$ngidx]["head"] = "group";
        if (!isset($this->mId) || $this->mId == "") {
          $data_tree[$ngidx]["group_type"] = $this->mType;
          $data_tree[$ngidx]["group_id"]   = $ngidx;
          $gname = isset($group_data) && isset($group_data["group"][$ngidx])
                   ? $group_data["group"][$ngidx]["group_name"]
                   : ucfirst($data_tree[$ngidx]["group_type"])." groups";
          if ($this->mType != "group") {
            if (!$gname)
              $gname = $this->findDefaultHeader($this->mType);
          }
          else {
            if (!$gname)
              if ($gidx != "group")
                $gname = ucfirst($data_tree[$ngidx]["group_type"])." groups"; // TODO i18n
              else
                $gname = "Other groups"; // TODO i18n
          }
          $data_tree[$ngidx]["group_name"] = $gname;
        }
        else {
          $idx = isset($data[$gidx][$this->mId]) ? $this->mId : "+".$this->mId;
          if (isset($data[$gidx][$idx]))
            $data_tree[$ngidx][$this->mNameKey] = $data[$gidx][$idx][$this->mNameKey];
        }
      } // if mGrouping
      $num = 0; // Used by page links
      $data_tree[$ngidx]["data"] = $this->buildDataTree($data[$gidx],null,false,$num);
      // Preserve "grouping_num_results" value
      if (isset($data[$gidx]["grouping_num_results"]))
        $data_tree[$ngidx]["data"]["grouping_num_results"] = $data[$gidx]["grouping_num_results"];
      if ($data_tree[$ngidx]["data"] === null)
        unset($data_tree[$ngidx]["data"]);
    } // foreach
    //vlog("buildGroupTreeAndAttach,data_tree1:",$data_tree);
    //
    // If grouping is specified, build group tree and stick data tree to it
    //
    if ($this->mGrouping && !$this->mSimpleList &&
        (!isset($this->mId) || $this->mId == "") &&
        !isset($this->mLinkId)) {
      $this->dbAttachToGroups($group_data["group"],$data_tree);
      $group_data["group"]["grouping"] = true;
      //vlog("buildGroupTreeAndAttach,tdata:",$group_data);
      $data = $group_data["group"];
    }
    else {
      //if ($this->mGrouping && $this->mType != "group")
      //  $gr_idx = "nogroup";
      //else
      //  $gr_idx = $this->mType;
      if (isset($this->mLinkId))
        $data = isset($data_tree[$this->mType]) && isset($data_tree[$this->mType]["data"])
                ? $data_tree[$this->mType]["data"]
                : $data_tree;
      else
        $data = $data_tree;
    }
    //vlog("buildGroupTreeAndAttach,data after building tree:",$data);
  } // buildGroupTreeAndAttach

  // Overridden in group table
  protected function dbSearchGroupInfo($type=null,$group_id=null)
  {
    // Get group tree and append data to it
    $num = 0;
    $data_tree = array();
    $data_tree["group"] = array();
    $data_tree["group"] = $this->buildDataTree($data_tree["group"],null,false,$num);
    //vlog("dbSearchGroupInfo,data_tree:",$data_tree);

    // Add the default "nogroup" group
    if ($type && $type != "") {
      $data_tree["group"]["nogroup"]["group_type"] = $type;
      $data_tree["group"]["nogroup"]["group_id"]   = "nogroup";
      $data_tree["group"]["nogroup"]["group_name"] = $this->findDefaultNogroupHeader($type);
      $data_tree["group"]["nogroup"]["head"]       = "group";
    }
    //vlog("dbSearchGroupInfo,data_tree:",$data_tree);
    $this->tdata = $data_tree;
    return $data_tree;
  } // dbSearchGroupInfo

  protected function buildDataTree(&$flatdata,$parentId=null,$getPageLinks=false,&$num=null)
  {
    if (!$num)
      $num = 0;
    ++$this->mRecDepth;
    if ($this->mRecDepth > $this->mLastNumRows + $this->mRecMax) {
      error_log("buildDataTree: Too much recursion ($this->mRecDepth)");
      return null;
    }
    if (!$flatdata)
      return null;
    $retval  = array();
    $id_name = $this->mIdKey; // TODO! Use $this->mIdKeyTable?
    foreach ($flatdata as $idx => &$subdata) {
      $has_grouping_data = (strpos($idx,"grouping") === 0);
      if (!$has_grouping_data) {
        $parent_not_in_group = isset($subdata["parent_id"]) && $subdata["parent_id"] != "" &&
                               !isset($flatdata[$subdata["parent_id"]]) && !isset($flatdata["+".$subdata["parent_id"]]);
        $pid = null;
        if ($parent_not_in_group) {
          $pid = $subdata["parent_id"];
          unset($subdata["parent_id"]);
        }
        if (is_array($subdata)) {
          if (!isset($subdata["parent_id"]))
            $subdata["parent_id"] = NULL;
          if ($subdata["parent_id"] == $parentId) {
            if ($getPageLinks && $subdata["parent_id"] === null)
              $num++; // "Top-level" item, so we count it
            if (!$getPageLinks || ($num > $flatdata["page_links"]["from"] && $num <= $flatdata["page_links"]["to"])) {
              if (isset($subdata[$id_name]) && $subdata[$id_name] != "")
                $children = $this->buildDataTree($flatdata,$subdata[$id_name],$getPageLinks,$num);
              else
                $children = null;
              if ($this->mRecDepth > $this->mLastNumRows + $this->mRecMax)
                break; // Break recursion
              if ($children)
                $subdata["data"] = $children;
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
        } // if is_array
      } // if has_grouping_data
    } // foreach
    return $retval;
  } // buildDataTree

  private function dbAttachToGroups(&$group_tree,$data_tree)
  {
    //vlog("dbAttachToGroups,group_tree:",$group_tree);
    //vlog("dbAttachToGroups,data_tree:", $data_tree);
    if ($group_tree !== null) {
      foreach ($group_tree as $gid => $group) { // Iterate over group ids
        if (isset($group_tree[$gid]["data"]) && $group_tree[$gid]["data"] !== null)
          $this->dbAttachToGroups($group_tree[$gid]["data"],$data_tree); // Recursive call
        if (isset($data_tree[$gid]) && $data_tree[$gid] != "")
          $idx = $gid;
        else
        if (isset($data_tree["+".$gid]) && $data_tree["+".$gid] != "")
          $idx = "+".$gid;
        else
          $idx = null;
        if (isset($idx) && $data_tree[$idx] !== null) {
          if (isset($data_tree[$idx]["data"]) && $data_tree[$idx]["data"] != "") {
            $group_tree[$gid]["head"] = "group";
            if (array_key_exists("data",$group_tree[$gid]) && !isset($group_tree[$gid]["data"]) && $group_tree[$gid]["data"] != "")
              $group_tree[$gid]["data"] = array();
            foreach ($data_tree[$idx]["data"] as $id => $obj)
              $group_tree[$gid]["data"][$id] = $data_tree[$idx]["data"][$id];
          }
        }
      } // foreach
    } // if
  } // dbAttachToGroups

  /**
   * Prepare data related to a list or a single item.  Adds a default top header.
   *
   * The data must have been returned by `{{#crossLink "anyTable/dbSearch:method"}}{{/crossLink}}`.
   * See the `{{#crossLink "anyTable"}}{{/crossLink}}` constructor for a description of the data format.
   * This method is normally not called by derived classes, but may be overridden by classes that want
   * to return data in a non-standard format.
   *
   * @param inData
   *
   * @return array|null Data array, or null on error or no data
   *
   * #### Example
   *```
   *      $data = $myTable->prepareData($inData);
   *```
   */
  public function prepareData(&$inData)
  {
    //vlog("inData before prepare:",$inData);
    // Make room for a top level header
    $data = array("data" => array("+0" => null));

    // Find and set the header
    $hdr = $this->findHeader($inData);
    if (isset($hdr) && $hdr != "") {
      $data["data"]["+0"]["head"] = "group";
      $data["data"]["+0"]["group_name"] = $hdr;
    }

    // Set data
    $data["data"]["+0"]["data"] = $inData;

    // Set link types
    $data["types"] = $this->mLinking;

    //vlog("data after prepare:",$data);
    return $data;
  } // prepareData

  protected function findHeader($inData)
  {
    $hdr = "";
    $h = Parameters::get("header");
    if ($h && $h !== true && $h !== "true" && $h !== false && $h !== "false")
      $hdr = $h; // Use the header provided in the in-parameter
    else
    if (!isset($this->mId) || $this->mId == "") {
      if ($h === true || $h === "true")
        $hdr = $this->findDefaultListHeader($this->mType);
    }
    else {
      if ($h !== false && $h !== "false")
        $hdr = $this->findDefaultItemHeader($this->mType,$inData);
    }
    return $hdr;
  } // findHeader

  public function prepareParents($type,$itemIdKey,$itemNameKey)
  {
    // TODO! Untested. See also searchParents()
    return null;
    $lf   = $this->mLinkType;
    $lfid = $this->mLinkId;
    $this->mLinkType = null;
    $this->mLinkId   = null;
    $this->mSimpleList = false;
    $this->dbSearchList($items);
    $this->mLinkType = $lf;
    $this->mLinkId   = $lfid;
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
   * Insert data in table.
   * Also sets mId and mData["id"] if a the new id was auto-created by the database.
   *
   * @return Boolean true on success, false on error
   */
  public function dbInsert()
  {
    if (!$this->dbValidateInsert())
      return null;

    $this->mId             = -1;
    $this->mData           = null;
    $this->mNumRowsChanged = 0;

    $this->initFieldsFromParam();

    // Insert in normal table
    $stmt = $this->dbPrepareInsertStmt();
    //elog("dbInsert stmt:".$stmt);
    if (!$stmt || !$this->query($stmt))
      return null;

    // mNumRowsChanged == 1 if the insert succeeded
    $this->mNumRowsChanged = $this->getNumRowsChanged();
    if ($this->mNumRowsChanged == 0) {
      $this->setMessage($this->mInsertNothingToDo);
      return null;
    }
    // An id will have been auto-created if the insert succeeded
    $this->mId = $this->getLastInsertID($this->mTableName); // TODO! Is it correct to assign to mId here?
    $this->mData["id"] = $this->mId;           // TODO! Neccessary?
    Parameters::set($this->mIdKey,$this->mId); // TODO! Neccessary?

    // Insert in meta table
    $this->dbMetaInsertOrUpdate($this->mId);

    // Insert in group table, if group id is given and we have a group table
    // TODO! Untested
    if (isset($this->mTableNameGroupLink) &&
        $this->tableExists($this->mTableNameGroupLink)) {
      $gid = Parameters::get("group_id");
      if ($gid && $gid != ""  && $gid != "nogroup" && $this->mType != "group") {
        $stmt = "INSERT INTO ".$this->mTableNameGroupLink." (group_id,".$this->mType."_id) ".
                "VALUES ('".$gid."','".$this->mId."')";
        //error_log("stmt:".$stmt);
        if (!$this->query($stmt))
          return null;
      }
    }
    // Insert in link table, if link id is given
    // TODO! Not implemented yet

    // Set result message
    $this->setMessage($this->mInsertSuccessMsg);

    // Call success handler
    if (method_exists($this,"dbInsertSuccess"))
      $this->dbInsertSuccess();

    return $this->mData;
  } // dbInsert

  protected function dbValidateInsert()
  {
    $this->mError = "";
    // Validate here, set $this->mError
    if ($this->mError != "")
      return false;
    return true;
  } // dbValidateInsert

  protected function dbPrepareInsertStmt()
  {
    // TODO! Check for all fields empty
    $unique_table_fields = array_unique($this->mTableFields);
    $stmt = "INSERT IGNORE INTO ".$this->mTableName." (";
    $auto_id = Parameters::get("auto_id");
    $n = 0;
    foreach ($unique_table_fields as $key) {
      if ($key != $this->mIdKeyTable || !$auto_id || $auto_id =="0" || $auto_id=="false") { // Do not update the id key field, unless told to do so
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
      if ($key != $this->mIdKeyTable || !$auto_id || $auto_id =="0" || $auto_id=="false") { // Do not update the id key field, unless told to do so
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
   * Update data
   *
   * @return array|null Data array, or null on error or no data
   */
  public function dbUpdate()
  {
    if (!isset($this->mId) || $this->mId == "")
      return $this->dbInsert(); // No id, assume it is a new item

    // We have an id, so we are updating an existing item or a link to one.
    $upd_what = Parameters::get("upd");
    if (!$upd_what) {
      if (!$this->dbValidateUpdate())
        return null;
      // Initialize
      $this->mData           = null;
      $this->mNumRowsChanged = 0;
      $this->initFieldsFromParam();

      // Update normal table
      $stmt = $this->dbPrepareUpdateStmt();
      //elog("dbUpdate:".$stmt);
      if ($stmt) { // May be null if we only update meta fields
        if (!$this->query($stmt))
          return null;
      }
      if ($this->isError())
        return null;
      $this->mNumRowsChanged = $this->getNumRowsChanged();

      // Update meta table
      $this->dbMetaInsertOrUpdate($this->mId);

      // Set result message
      if ($this->mNumRowsChanged > 0)
        $this->setMessage($this->mUpdateSuccessMsg);
      else
        $this->setMessage($this->mUpdateNothingToDo);
    }
    else
    if ($upd_what == "link") {
      return $this->dbAddRemoveLink();
    }
    else {
      $this->setError("Illegal parameter value: $upd_what. ");
      return null;
    }
    // Call success handler
    if (method_exists($this,"dbUpdateSuccess"))
      $this->dbUpdateSuccess();

    return $this->mData;
  } // dbUpdate

  protected function dbValidateUpdate()
  {
    $this->mError = "";
    // Validate here, set $this->mError
    if ($this->mError != "")
      return false;
    return true;
  } // dbValidateUpdate

  protected function dbPrepareUpdateStmt()
  {
    if (!$this->dbItemExists()) {
      $this->setError($this->mType.$this->mItemUnexists." ($this->mId). ");
      return null;
    }
    $unique_table_fields = array_unique($this->mTableFields);
    $stmt = "UPDATE ".$this->mTableName." SET ";
    $auto_id = Parameters::get("auto_id");
    $n = 0;
    $to_set = "";
    foreach ($unique_table_fields as $key) {
      if ($key != $this->mIdKeyTable || !$auto_id || $auto_id =="0" || $auto_id=="false") { // Do not update the id key field, unless told to do so
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
    $stmt = "SELECT * FROM ".$this->mTableName." WHERE ".$this->mIdKeyTable."=".$this->mId;
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
    if (!isset($this->mTableFieldsMeta) ||
        !$this->tableExists($this->mTableNameMeta))
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
    // TODO! Move to "user" type class
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

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////// Insert or update link ///////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  public function dbAddRemoveLink()
  {
    if (!$this->dbValidateUpdate())
      return null;
    // Initialize
    $this->mData           = null;
    $this->mNumRowsChanged = 0;
    $this->initFieldsFromParam();

    $link_type = Parameters::get("link_type");
    if (!$link_type) {
      $this->setError("Link type missing. "); // TODO! i18n
      return null;
    }
    $id_key      = $this->mIdKey;    // TODO! Use $this->mIdKeyTable?
    $id_key_link = $link_type."_id"; // TODO! Not general enough
    $id          = Parameters::get($id_key); // TODO! Use $this->mId?
    if (!isset($id) || $id == "") {
      $this->setError($this->mType." id missing. "); // TODO! i18n
      return null;
    }
    $updlist = explode(",",Parameters::get("add"));
    $dellist = explode(",",Parameters::get("rem"));

    if ($link_type != $this->mType) {
      $link_table = $this->findLinkTableName($link_type);
      if (!$link_table) {
        $this->setMessage("Link table not found. ",true); // TODO! i18n
        return null;
      }
      // Link with different type (sublist of item)
      if ($dellist !== null) {
        // Remove elements from the item's list
        foreach ($dellist as $delval) {
          if ($delval) {
            if (!$this->dbTableHasLink($link_table,$id_key_link,$delval,$id_key,$id)) {
              $this->setMessage("Link not found. ",true); // TODO! i18n
              return array();
            }
            $stmt = "DELETE FROM ".$link_table." ".
                    "WHERE ".$id_key_link."='".intval($delval)."' AND ".$id_key."='".intval($id)."'";
            //elog("dbAddRemoveLink(1):".$stmt);
            if (!$this->query($stmt))
              return null;
          }
        }
      }
      if ($updlist !== null) {
        // Add elements to the item's list (delete, then insert to avoid error if element already exists in list)
        foreach ($updlist as $insval) {
          if ($insval) {
            if ($this->dbTableHasLink($link_table,$id_key_link,$insval,$id_key,$id)) {
              $this->setMessage("Link already exists. ",true); // TODO! i18n
              return array();
            }
            // Delete old list so as to avoid error message when inserting (insert-or-update)
            $stmt = "DELETE FROM ".$link_table." ".
                    "WHERE ".$id_key_link."='".intval($insval)."' AND ".$id_key."='".intval($id)."'";
            //elog("dbAddRemoveLink(2):".$stmt);
            if (!$this->query($stmt))
              return null;
            $stmt = "INSERT INTO ".$link_table." (".
                    $id_key_link.",".$id_key.
                    ") VALUES (".
                    intval($insval).",".intval($id).
                    ")";
            //elog("dbAddRemoveLink(3):".$stmt);
            if (!$this->query($stmt))
              return null;
          }
        }
      }
    }
    else {
      // Link with same type (sub-element with parent id)
      if ($this->hasParentId()) {
        if ($dellist !== null) {
          // Remove parent for elements in dellist
          foreach ($dellist as $delval) {
            if ($delval) {
              $stmt = "UPDATE ".$this->mTableName." ".
                      "SET parent_id=NULL ".
                      "WHERE ".$id_key."='".intval($delval)."'";
              //elog("dbAddRemoveLink(4):".$stmt);
              if (!$this->query($stmt))
                return null;
            }
          }
        }
        if ($updlist !== null) {
          // Set parent for elements in updlist
          foreach ($updlist as $updval) {
            if ($updval && intval($id) != intval($updval)) {
              $stmt = "UPDATE ".$this->mTableName." ".
                      "SET parent_id='".intval($id)."' ".
                      "WHERE ".$id_key."='".intval($updval)."'";
              //elog("dbAddRemoveLink(5):".$stmt);
              if (!$this->query($stmt))
                return null;
            }
          }
        }
      }
    }
    $this->setMessage($this->mUpdateSuccessMsg);
    return $this->dbSearch(); // Return the complete data set to client
  } // dbAddRemoveLink

  // Check if a link exists in a link table
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
   * Deletes an item of given type with given id from a database table. TODO! Delete a list of items.
   *
   * @return array|null Data array, or null on error or no data
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
      $stmt = "DELETE FROM ".$this->mTableName." WHERE ".$this->mIdKeyTable."='".$this->mId."'";
      //elog("dbDelete(1):".$stmt);
      if (!$this->query($stmt))
        return null;
      if ($this->getNumRowsChanged() > 0)
        $this->setMessage($this->mDeleteSuccessMsg);
      else
        $this->setMessage($this->mDeleteNothingToDo);

      // Delete from meta table
      if ($this->mIdKeyMetaTable &&
          $this->tableExists($this->mTableNameMeta)) {
        $stmt = "DELETE FROM ".$this->mTableNameMeta." WHERE ".$this->mIdKeyMetaTable."='".$this->mId."'";
        //elog("dbDelete:".$stmt);
        if (!$this->query($stmt))
          return null;
      }
      // Update parent_id of children
      if ($this->hasParentId()) {
        $stmt = "UPDATE ".$this->mTableName." SET parent_id=NULL WHERE parent_id='".$this->mId."'";
        //elog("dbDelete(2):".$stmt);
        if (!$this->query($stmt))
          return null;
      }
      // Delete all links for an item with given id from associated tables (to avoid orphaned links)
      if (isset($this->mLinking)) {
        foreach ($this->mLinking as $idx => $link_type) {
          if ($this->mType !== $link_type &&
              isset($this->mId) && $this->mId !== "" && !is_numeric($this->mId)) {
            $link_table = $this->findLinkTableName($link_type);
            $stmt = "DELETE FROM ".$link_table." WHERE ".$this->getIdKey()."='".$this->mId."'";
            //elog("dbDelete(3):".$stmt);
            if (!$this->query($stmt))
              return false;
          }
        }
      }
      $this->mId = null;
    }
    return $this->mData;
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

} // class anyTable
?>
