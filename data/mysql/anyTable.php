<?php
/********************************************************************************************
 *                                                                                          *
 * anyVista is copyright (C) 2011-2024 Arne D. Morken and Balanse Software.                 *
 *                                                                                          *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use. *
 * Get licences here: http://balanse.info/anyvista/license/                                 *
 *                                                                                          *
 ********************************************************************************************/

require_once "permission.php";
require_once "anyTableFactory.php";

/**
 * Class for interacting with an anyVista MySql database table.
 *
 * Inherits from `dbTable`, which manages the database connection.
 * Contains methods for doing search, insert, update and delete on a MySQL database table.
 * Supports user defined table format, as well as data in (Wordpress) meta tables.
 * The table format must be described in a table class that inherits from `anyTable`.
 * See `types/user/userTable.php` and `types/group/groupTable.php` for examples.
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
 *       'link_types': {                    // Optional
 *         [integer]: '[type name]',        // Optional. One or more type names.
 *         ...
 *       },
 *       'permission': {                    // Mandatory
 *         'current_user_id': '[id]',       // Mandatory
 *         'is_logged_in':    true | false, // Mandatory
 *         'is_admin':        true | false, // Mandatory
 *       },
 *       'message': '[string]',             // Optional
 *       'error':   '[string]',             // Optional
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
  protected
  /**
  * @var string The type of the table data (e.g. "event").
  */
  $mType = null,

  /**
  * @var string The id key used by the client, e.g. "event_id" or "user_id".
  */
  $mIdKey = null,

  /**
  * @var string The id key used in the table, e.g. "event_id" or "ID".
  */
  $mIdKeyTable = null,

  /**
  * @var string The id key used in the meta table, "event_id" or "user_id".
  */
  $mIdKeyMetaTable = null,

  /**
  * @var string The name key used by the client and in the table, e.g. "event_name" or "login_name".
  */
  $mNameKey = null,

  /**
  * @var string The name of the id field in the meta table, e.g. "meta_id" or "umeta_id".
  */
  $mMetaId = "meta_id",

  /**
  * @var string The field to sort by. e.g. "event_date_start".
  */
  $mOrderBy = null,

  /**
  * @var string The direction of the sort, "ASC" or "DESC".
  */
  $mOrderDir = "DESC",

  /**
  * @var string Name of the main table, e.g. "any_event".
  */
  $mTableName = null,

  /**
  * @var string Name of the meta table, e.g. "any_eventmeta".
  */
  $mTableNameMeta = null,

  /**
  * @var string Name of the group table, e.g. "any_group".
  */
  $mTableNameGroup = "any_group", // TODO!

  /**
  * @var string Name of the user table, e.g. "any_user".
  */
  $mTableNameUser = ANY_DB_USER_TABLE,

  /**
  * @var string Name of the group link table for this table type, e.g. "any_event_group".
  */
  $mTableNameGroupLink = null,

  /**
  * @var string Name of the user link table for this table type, e.g. "any_event_user".
  */
  $mTableNameUserLink = null,

  /**
  * @var array The field names of the table.
  *            Must be set by deriving class.
  */
  $mTableFields = null,

  /**
  * @var array The name of the meta keys of the meta table.
  *            May be set by deriving class.
  */
  $mTableFieldsMeta = null,

  /**
  * @var array The field names to left join with (for each type).
  *            Should be set by deriving class.
  */
  $mTableFieldsLeftJoin = null,

  /**
  * @var array
  */
  $mLinkTypes = null,

  /**
  * @var array Contains data for a list or an item. See "Data structure" above.
  */
  $mData = null,

  /**
  * @var string|int The id is null if operating on a list, non-null if item.
  */
  $mId = null,

  /**
  * @var string|int The value of max id after a search for it.
  */
  $mMaxId = -1,

  /**
  * @var int Number of rows returned by search.
  */
  $mNumResults = 0,

  /**
  * @var string Prefix of tables.
  */
  $mTablePrefix  = "any_", // TODO! Give as param!

  $mFilters      = null,
  $mPermission   = null,
  $mSortFunction = null;

  // TODO! i18n
  protected $mInsertSuccessMsg  = "",
            $mUpdateSuccessMsg  = "",
            $mDeleteSuccessMsg  = "",
            $mItemUnexists      = " not found. ",
            $mInsertNothingToDo = "Nothing to insert. ",
            $mUpdateNothingToDo = "Nothing to update. ",
            $mDeleteNothingToDo = "Nothing to delete. ";

  private   $mLastNumRows  = 0,    // Used to break (theoretical) infinite recursion
            $mRecurseMax   = 100,  // Used to avoid infinite recursion
            $mRecurseDepth = 0,    // Recursion depth
            $mPageSize     = 30,   // Default number of items returned per page
            $mGroupTable   = null; // Set by dbSearchItemLists, dbSearchList and dbUpdateLinkList

/**
  * Constructor
  *
  * @param dbConnection $connection  Info about the database connection. See `db/dbConnection`.
  * @param array|string $paramOrType An parameter object OR optional type overriding the one set by deriving class.
  *
  * #### Example
  *```
  *      $conn = new dbConnection();
  *      $userTable = new anyTable($conn,"user");
  *```
  */
  public function __construct($connection,$paramOrType=null)
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
    if (!$this->initProperties($paramOrType))
      return;

    // Filters should be defined by the derived class, but may also
    // be specified / manipulated in the initFilters method.
    $this->initFilters($this->mFilters);

    return;
  } // constructor

  //
  // Set properties from table definitions or type.
  // Setting properties from type can be used in simple situations where
  // the type class doesnt need to supply its own table definitions.
  //
  private function initProperties($paramOrType)
  {
    $this->mError   = "";
    $this->mMessage = "";
    //
    // Determine type (mandatory)
    //
    if (gettype($paramOrType) == "string")
      $this->mType = $paramOrType;
    else
    if (gettype($paramOrType) == "array")
      $this->mType = $paramOrType["type"];
   if (!$this->mType)
      $this->mType = ltrim(Parameters::get("type"));
    if (!$this->mType) {
      $this->mError .= "anyTable: Type missing. ";
      return false;
    }
    //
    // Some properties that may be set from global parameters.
    // Properties given as global parameter override fields in class.
    //
    $par_id = ltrim(Parameters::get($this->mIdKey));
    if ($par_id)
      $this->mId = $par_id;

    $par_table_fields = Parameters::get("tableFields");
    if ($par_table_fields)
      $this->mTableFields = $par_table_fields;

    $par_table_fields_meta = Parameters::get("tableFieldsMeta");
    if ($par_table_fields_meta)
      $this->mTableFieldsMeta = $par_table_fields_meta;

    $par_table_fields_left_join = Parameters::get("tableFieldsLeftJoin");
    if ($par_table_fields_left_join)
      $this->mTableFieldsLeftJoin = $par_table_fields_left_join;

    $par_link_types = Parameters::get("link_types"); // Types this class may interact with
    if ($par_link_types)
      $this->mLinkTypes = explode(',', $par_link_types);
    //
    // Override class properties from properties in paramOrType (if it is an array)
    //
    if (gettype($paramOrType) == "array") {
      if ($paramOrType["idKey"])               $this->mIdKey               = $paramOrType["idKey"];
      if ($paramOrType["idKeyTable"])          $this->mIdKeyTable          = $paramOrType["idKeyTable"];
      if ($paramOrType["idKeyMetaTable"])      $this->mIdKeyMetaTable      = $paramOrType["idKeyMetaTable"];
      if ($paramOrType["nameKey"])             $this->mNameKey             = $paramOrType["nameKey"];
      if ($paramOrType["metaId"])              $this->mMetaId              = $paramOrType["metaId"];
      if ($paramOrType["orderBy"])             $this->mOrderBy             = $paramOrType["orderBy"];
      if ($paramOrType["orderDir"])            $this->mOrderDir            = $paramOrType["orderDir"];
      if ($paramOrType["tableName"])           $this->mTableName           = $paramOrType["tableName"];
      if ($paramOrType["tableNameMeta"])       $this->mTableNameMeta       = $paramOrType["tableNameMeta"];
      if ($paramOrType["tableNameGroup"])      $this->mTableNameGroup      = $paramOrType["tableNameGroup"];
      if ($paramOrType["tableNameUser"])       $this->mTableNameUser       = $paramOrType["tableNameUser"];
      if ($paramOrType["tableNameGroupLink"])  $this->mTableNameGroupLink  = $paramOrType["tableNameGroupLink"];
      if ($paramOrType["tableNameUserLink"])   $this->mTableNameUserLink   = $paramOrType["tableNameUserLink"];
      if (!$par_table_fields &&
        $paramOrType["tableFields"])         $this->mTableFields         = $paramOrType["tableFields"];
      if (!$par_table_fields_meta &&
        $paramOrType["tableFieldsMeta"])     $this->mTableFieldsMeta     = $paramOrType["tableFieldsMeta"];
      if (!$par_table_fields_left_join &&
        $paramOrType["tableFieldsLeftJoin"]) $this->mTableFieldsLeftJoin = $paramOrType["tableFieldsLeftJoin"];
      if (!$par_link_types &&
        $paramOrType["linkTypes"])           $this->mLinkTypes           = $paramOrType["linkTypes"];
    }
    //
    // Set defaults if not set yet
    //
    if (!$this->mIdKey)             $this->mIdKey          = $this->mType."_id";
    if (!$this->mIdKeyTable)        $this->mIdKeyTable     = $this->mIdKey;
    if (!$this->mIdKeyMetaTable)    $this->mIdKeyMetaTable = $this->mIdKey;
    if (!$this->mNameKey)           $this->mNameKey        = $this->mType."_name";
    if (!$this->mMetaId)            $this->mMetaId         = "meta_id";
    if (!$this->mOrderBy)           $this->mOrderBy        = $this->mNameKey;
    if (!$this->mOrderDir)          $this->mOrderDir       = "DESC";
    if (!$this->mTableName)    {
      $this->mTableName = $this->mTablePrefix.$this->mType;
      // No meta table for default (i.e. auto-generated) table
      $this->mIdKeyMetaTable  = null;
      $this->mMetaId          = null;
      $this->mTableNameMeta   = null;
      $this->mTableFieldsMeta = null;
    }
    if (!$this->mTableNameGroup)
      $this->mTableNameGroup = $this->mTablePrefix."group";
    if (!$this->mTableNameUser)
      $this->mTableNameUser = $this->mTablePrefix."user";
    if (!$this->mTableNameGroupLink) {
      $ltn = ["group",$this->mType];
      sort($ltn);
      $this->mTableNameGroupLink = $this->mTablePrefix.implode("_",$ltn);
    }
    if (!$this->mTableNameUserLink) {
      $ltn = ["user",$this->mType];
      sort($ltn);
      $this->mTableNameUserLink = $this->mTablePrefix.implode("_",$ltn);
    }
    if (!$this->mTableFields) { // Set default minimal table fields
      $this->mTableFields = [ $this->mIdKey,
                              $this->mNameKey,
                            ];
    }
    if (!$this->mTableFieldsLeftJoin) { // Set default left join to group_id
      $this->mTableFieldsLeftJoin = [
        "group" => [ "group_id" ]
      ];
    }
    if (!$this->mLinkTypes)
      $this->mLinkTypes = ["group"];
    if (!in_array($this->mType,$this->mLinkTypes))
      array_unshift($this->mLinkTypes,$this->mType); // Add the current type as a "link" in order to work with sub-items

    // Default table filters
    if (!$this->mFilters) {
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

    if (!isset($this->mInsertSuccessMsg))
      $this->mInsertSuccessMsg = ucfirst($this->mType)." created. ";
    if (!isset($this->mUpdateSuccessMsg))
      $this->mUpdateSuccessMsg = ucfirst($this->mType)." updated. ";
    if (!isset($this->mDeleteSuccessMsg))
      $this->mDeleteSuccessMsg = ucfirst($this->mType)." deleted. ";

    // Make sure some vital fields exist
    if (!in_array($this->mOrderBy,$this->mTableFields))
      $this->mOrderBy = $this->mTableFields[0];
    if (!in_array($this->mIdKeyTable,$this->mTableFields))
      $this->mIdKeyTable = $this->mTableFields[0];

    return true;
  } // initProperties

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
    $tableFields = Parameters::get("tableFields");
    if ($tableFields) {
      $this->mFilters = array();
      foreach ($tableFields as $name => $val) {
        $this->mFilters["list"][$val] = "1";
        $this->mFilters["item"][$val] = "1";
      }
    }
  } // initFiltersFromParam

  private function initFieldsFromParam()
  {
    $tableFields = Parameters::get("tableFields");
    if ($tableFields) {
      $this->mTableFields = $tableFields;
    }
  } // initFieldsFromParam

  /**
   * Override and return true in table classes which have parent_id.
   */
  public function hasParentId()
  {
    return false;
  } // hasParentId

  /////////////////////////
  //////// getters ////////
  /////////////////////////

  /**
   * Returns the table's name.
   */
  public function getTableName()     { return $this->mTableName; }

  /**
   * Returns the meta table's name.
   */
  public function getTableNameMeta() { return $this->mTableNameMeta; }

  /**
   * Returns the data.
   */
  public function getData()          { return $this->mData; }

  /**
   * Returns the type of the table data.
   */
  public function getType()          { return $this->mType; }

  /**
   * Returns the id of the table data, if an item. If a list, the result is undefined.
   */
  public function getId()            { return $this->mId; }

  /**
   * Returns the id key of the table data.
   */
  public function getIdKey()         { return $this->mIdKey; }

  /**
   * Returns the name name of the table data.
   */
  public function getNameKey()       { return $this->mNameKey; }

  /**
   * Returns the permission object.
   */
  public function getPermission()    { return $this->mPermission; }

  /////////////////////////
  //////// finders ////////
  /////////////////////////

  protected function findHeader($type,$inData)
  {
    $hdr = "";
    $h = Parameters::get("header");
    if ($h && $h !== true && $h !== "true" && $h !== false && $h !== "false")
      $hdr = $h; // Use the header provided in the in-parameter
    else
    if (!isset($this->mId) || $this->mId == "") {
      if ($h === true || $h === "true")
        $hdr = $this->findDefaultListHeader($type);
    }
    else {
      if ($h !== false && $h !== "false")
        $hdr = $this->findDefaultItemHeader($type,$inData);
    }
    return $hdr;
  } // findHeader

  protected function findDefaultHeader($type,$skipOther=false)
  {
    $other = $skipOther ? "" : "Other "; // TODO! i18n
    return $other.$type."s";
  } // findDefaultHeader

  protected function findDefaultListHeader($type)
  {
    return ucfirst($type)." list"; // TODO! i18n
  } // findDefaultListHeader

  protected function findDefaultItemHeader($type,$inData)
  {
    if (!$inData || (!$this->mId && $this->mId !== 0))
      return ucfirst($type);
    $ix = isset($inData["+".$this->mId])
          ? "+".$this->mId
          : $this->mId;
    $hdr = "";
    if (isset($inData[$ix]) && isset($inData[$ix][$this->mNameKey]))
      $hdr = $inData[$ix][$this->mNameKey];
    else
      $this->setError($this->mNameKey." missing"); // TODO! i18n
    return $hdr;
  } // findDefaultItemHeader

  protected function findDefaultItemListHeader($type,$skipOther=false)
  {
    return $this->findDefaultHeader($type,$skipOther);
  } // findDefaultItemListHeader

  protected function findDefaultNogroupHeader($type,$skipOther=false)
  {
    return $this->findDefaultHeader($type,$skipOther);
  } // findDefaultNogroupHeader

  protected function findMetaTableName($linkType)
  {
    return $this->mTablePrefix.$linkType."meta";
  } // findMetaTableName

  protected function findMetaTableId($type)
  {
    return $type."_id";
  } // findMetaTableId

  protected function findLinkTableName($linkType)
  {
    if ($linkType === null || $linkType === "")
      return null;
    if ($linkType == $this->mType)
      return $this->mTableName;
    $ltn = [$linkType,$this->mType];
    sort($ltn);
    $ltn = $this->mTablePrefix.implode("_",$ltn);
    return $ltn;
  } // findLinkTableName

  protected function findLinkTableId($linkType)
  {
    $str = $linkType."_id";
    return $str;
  } // findLinkTableId

  protected function findTypeTableName($type)
  {
    return $this->mTablePrefix.$type;
  } // findTypeTableName

  protected function findTypeTableId($type)
  {
    return $type."_id";
  } // findTypeTableId

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
    $type = Parameters::get("type"); if (!$type) $type = $this->mType;
    $id   = Parameters::get("id");   if (!$id)   $id   = $this->mId;
    if (!$type) {
      $this->mError = "dbSearch: type missing. ";
      return null;
    }
    $this->mType  = $type;
    $this->mId    = $id;
    $this->mData  = null;
    $this->mError = "";
    $this->mNumResults = 0;
    
    $this->initFieldsFromParam();
    $this->initFiltersFromParam();

    if ($id == "max")
      $ok = $this->dbSearchMaxId();
    else
    if ($id == "par")
      $ok = $this->dbSearchParents();
    else
    if ($id || $id === 0)
      $ok = $this->dbSearchItem($id);
    else
      $ok = $this->dbSearchList();

    if (!$ok)
      return null;

    if ($this->mNumResults)
      return $this->prepareData();
    return ($this->mData);
  } // dbSearch

  //////////////////////////////// Item search ////////////////////////////////

  //
  // Search database for an item, including meta data and linked lists.
  //
  protected function dbSearchItem($id,$skipLinks=false,$includeUser=true)
  {
    return $this->dbSearchItemByKey($this->mIdKeyTable,$id,$skipLinks,$includeUser);
  } // dbSearchItem

  protected function dbSearchItemByKey($key,$val,$skipLinks=false,$includeUser=true)
  {
    $grouping = Parameters::get("grouping");
    $grouping = $grouping !== false && $grouping !== "false" && $grouping !== "0";

    if ($key === null || $key == "" || $val === null || $val == "") {
      $this->setError("Missing key or value. "); // TODO! i18n
      return false;
    }
    $this->mNumResults = 0;
    // Build and execute the query
    $stmt = $this->dbPrepareSearchItemStmt($key,$val,$includeUser);
    //elog("dbSearchItemByKey:".$stmt);
    if (!$this->query($stmt))
      return false; // An error occured
    // Get the data
    if ($this->getRowData($this->mData,"item")) {
      $this->dbSearchMeta("item"); // Get meta data for the item
      if (!$skipLinks)
        $this->dbSearchItemLists($grouping); // Get lists associated with the item
      $this->mNumResults = 1;
    }
    return !$this->isError();
  } // dbSearchItemByKey

  // Get query fragments and build the query
  protected function dbPrepareSearchItemStmt($key,$val,$includeUser=true)
  {
    // Get query fragments
    $includeUser  = $includeUser && $this->mType != "user" &&
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
    if ($includeUser && isset($this->mTableFieldsLeftJoin["user"]))
      foreach ($this->mTableFieldsLeftJoin["user"] as $field)
        if (isset($field))
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
    $where = "WHERE ".$this->mTableName.".".$key."='".utf8_encode($val)."' "; // TODO! utf8_encode is deprecated
    return $where;
  } // findItemWhere

  //
  // Search for lists associated with the item
  //
  protected function dbSearchItemLists($grouping)
  {
    // If no link types found, return with no error
    if (!isset($this->mLinkTypes))
      return true;
    // Must have an id
    if (!isset($this->mId) || $this->mId == "") {
      $this->setError("No id while searching for linked lists. "); // TODO! i18n
      return false;
    }
    // Search through all registered link types/tables
    if (isset($this->mLinkTypes)) {
      foreach ($this->mLinkTypes as $i => $link_type)
        $this->dbSearchItemListOfType($link_type,$grouping);
    }
    return true;
  } // dbSearchItemLists

  protected function dbSearchItemListOfType($linkType,$grouping)
  {
    $link_tablename = $this->findLinkTableName($linkType);
    if ($this->tableExists($link_tablename)) {
      $table = anyTableFactory::createClass($linkType,$this);
      //elog("created class ".$linkType);
      if ($table && ($table->mType != $this->mType || $this->hasParentId())) {
        if (!$table->dbSearchList($this->mType,$this->mId))
          $this->mError .= $table->getError();
        if ($table->mData) {
          $gidx  = "nogroup";
          $idx   = "+".$this->mId;
          $lidx  = "link-".$linkType;
          $tgidx = $idx;
          if ($table->mType == "group" || (($this->mId || $this->mId === 0) && $this->mType != "group"))
            $tgidx = $gidx; 
          if (!isset($this->mData[$gidx][$idx]["data"]))        $this->mData[$gidx][$idx]["data"]        = array();
          if (!isset($this->mData[$gidx][$idx]["data"][$lidx])) $this->mData[$gidx][$idx]["data"][$lidx] = array();
          $this->mData[$gidx][$idx]["data"]["grouping"]        = $grouping;
          $this->mData[$gidx][$idx]["data"][$lidx]["grouping"] = $grouping;
          $this->mData[$gidx][$idx]["data"][$lidx]["head"]     = $linkType;
          $this->mData[$gidx][$idx]["data"][$lidx]["data"]     = $table->mData[$tgidx]["data"];
          if ($table->mNameKey)
            $this->mData[$gidx][$idx]["data"][$lidx][$table->mNameKey] = $this->findDefaultItemListHeader($linkType);
          //console.log("item list ".$linkType.":"); console.log($this->mData);
        }
      } // if
    }
    return !$this->isError();
} // dbSearchItemListOfType

  //////////////////////////////// List search ////////////////////////////////

  //
  // Search database for a list, including meta data
  // Returns true on success, false on error
  //
  protected function dbSearchList($linkType=null,$linkId=null)
  {
    if (!$this->mType) {
      $this->mError = "dbSearchList: No type. ";
      elog($this->mError);
      return false;
    }
    $groupId  = Parameters::get("group_id"); // If "groupId" is specified, we need only search in that group.
    $grouping = Parameters::get("grouping");
    $grouping = $grouping !== false && $grouping !== "false" && $grouping !== "0";
    $simple   = Parameters::get("simple"); // In a "simple" list search we get only the id, name and parent_id
    $simple   = $simple === true || $simple === "true" || $simple   === "1";

    // Get group data
    $group_data = null;
    if ($grouping) {
      if ($this->mGroupTable != null)
        $group_data = $this->mGroupTable->mData; // We already have group data
      else
      if ($this->mType != "group") { // Read from group table
        // Get a "flat" group list, make it into a tree below
        $this->mGroupTable = anyTableFactory::createClass("group",$this);
        Parameters::set("grouping",false);
        $group_data = $this->mGroupTable->dbSearchGroupInfo($this->mType,$groupId);
        Parameters::set("grouping",true);        
        if ((empty($group_data)))
          $this->setError($this->mGroupTable->mError);
      }
    }

    // Build and execute the query
    $limit = !$simple ? $this->findLimit() : ""; // Use same limit for all groups
    $success = false;
    $this->mNumResults = 0; // Init total number of results
    if (($groupId || $groupId === 0) && $this->mType != "group") {
      // Query data from the given group
      $success = $this->dbExecListStmt($groupId,$this->mType,$linkType,$linkId,$grouping,$simple,$limit);
    }
    else
    if (!$grouping || !$limit || $this->mType == "group") {
      // Query data from all groups
      $success = $this->dbExecListStmt(null,$this->mType,$linkType,$linkId,$grouping,$simple,$limit);
    }
    else {
      // Query data from one group at the time
      // Since a 'LIMIT' operator applies, we need to search for results for
      // each group separately rather then using a LEFT JOIN on the group table.
      $has_nogroup = false;
      if (isset($group_data) &&
          $this->tableExists($this->mTableNameGroupLink)) {
        foreach ($group_data as $gid => $group) {
          if (isset($group) && isset($group["group_type"]) && $group["group_type"] == $this->mType) {
            $success = $this->dbExecListStmt($gid,$this->mType,$linkType,$linkId,$grouping,$simple,$limit) || $success;
            if ($gid == "nogroup")
              $has_nogroup = true;
          }
        } // foreach
      } // if tableExists
      // Build and execute the query for ungrouped data (if not queried already)
      if (!$has_nogroup)
        $success = $this->dbExecListStmt("nogroup",$this->mType,$linkType,$linkId,$grouping,$simple,$limit) || $success;

      // Get grouped data that may have illegal group type (i.e. not same as list type).
      // Ideally this should not happen, but if it does, such data will not show up unless we do this.
      if (isset($group_data) && $linkId == "") {
        //$success = $this->dbExecListStmt(-1,$this->mType,$linkType,$linkId,$grouping,$simple,$limit) || $success; // -1 signifies this special query
        $linktable    = $this->findLinkTableName("group");
        if ($this->tableExists($linktable)) {
          $linktable_id = $this->findLinkTableId("group");
          $stmt =  "SELECT DISTINCT ".$this->mTableName.".*  ".
                   "FROM ".$this->mTableName." ".
                   "LEFT JOIN ".$linktable." ON CAST(".$linktable.".".$this->mIdKey." AS INT)=CAST(".$this->mTableName.".".$this->mIdKeyTable." AS INT) ".
                   "WHERE (";
          $part_stmt = "";
          foreach ($group_data as $gid => $group) {
            if ($gid != "nogroup") {
              $db_gid = is_numeric($gid) ? "CAST(".$gid." AS INT)" : "'".$gid."'";
              $part_stmt .= $linktable.".".$linktable_id." != ".$db_gid." AND ";
            }
          }
          $part_stmt  = rtrim($part_stmt,"AND ");
          if ($part_stmt != "") {
            $part_stmt .= ") ";
            $stmt .= $part_stmt."ORDER BY ". $this->mTableName.".".$this->mIdKeyTable." ";
            //elog("dbSearchList:".$stmt);
            if (!(!$stmt || $stmt == "" || !$this->query($stmt) || $this->isError())) {
              // Get the data
              $xdata = null;
              $ok = $this->getRowData($xdata,"list",$grouping,$simple);
              if ($ok) {
                if (isset($xdata) && isset($xdata["nogroup"])) {
                  $this->mData["unknown"] = null;
                  $i = 0;
                  foreach ($xdata["nogroup"] as $key => $val) {
                    $this->mData["unknown"][$key] = $val;
                    ++$i;
                  }
                  $this->mData["unknown"]["grouping_num_results"] = $i;
                }
                $x=0;
              }
            }
          }
        }
      }
    } // else

    if (!$success)
      return !$this->isError();

    // Search and get the meta data
    if (!$simple)
      $this->dbSearchMeta("list",$linkType,$linkId);

    // Sort the list
    if ($this->mSortFunction)
      call_user_func($this->mSortFunction);

    // Group the data and build the data tree
    if (!$this->mGroupTable) 
      $this->mGroupTable = $this;
    if (!$group_data)
      if ($this->mType = "group")
      $group_data = $this->mData;
      else
        $group_data = array();
    if ($grouping || $this->mType == "group") {
      $group_data = $this->mGroupTable->buildDataTree($group_data);
      $this->buildGroupTreeAndAttach($group_data,$this->mType,$linkId,$grouping);
    }
    //vlog("dbSearchList, tree list data:",$this->mData);

    return !$this->isError();
  } // dbSearchList

  protected function dbExecListStmt($gid=null,$type=null,$linkType=null,$linkId=null,$grouping=true,$simple=false,$limit="")
  {
    // Build and execute the query for a group
    $partial_stmt = $this->dbPrepareSearchListStmt($gid,$type,$linkType,$linkId,$grouping);
    $stmt = $partial_stmt.$limit;
    //elog("dbExecListStmt1:".$stmt);
    if (!$this->query($stmt) || $this->isError())
      return false; // Something went wrong
    // Get the data
    $success = $this->getRowData($this->mData,"list",$grouping,$simple);
    $gr_idx = isInteger($gid) ? intval($gid) : $gid;
    if ((!$gr_idx && $gr_idx != 0) || $gr_idx == "")
      $gr_idx = "nogroup";
      if ($limit != "") {
      // Count how many rows would have been returned without LIMIT
      $part_stmt = $this->dbPrepareSearchListStmt($gid,$type,$linkType,$linkId,$grouping);
      $count_stmt = "SELECT count(*) AS num_results FROM (".
                    $part_stmt.
                    ") AS dummy";
      //elog("dbExecListStmt2:".$count_stmt);
      if (!$this->query($count_stmt))
        return false; // An error occured
      $row = $this->getNext(true);
      if ($row && isset($row["num_results"]) && $row["num_results"] != "0") {
        $this->mData[$gr_idx]["grouping_num_results"] = $row["num_results"];
        $this->mNumResults .= $row["num_results"];
      }
    } // if
    else {
      // Report back number of elements in groups
      if (array_key_exists($gr_idx,$this->mData)) {
        $n = sizeof($this->mData[$gr_idx]);
        $this->mData[$gr_idx]["grouping_num_results"] = $n;
        $this->mNumResults .= $n;
      }
    }
    return $success;
  } // dbExecListStmt

  // Get query fragments and build the query
  protected function dbPrepareSearchListStmt($gid=null,$type=null,$linkType=null,$linkId=null,$grouping=true)
  {
    $group_type  = Parameters::get("group_type");
    $search_term = Parameters::get("term");
    $select      = $this->findListSelect  ($gid,$type,$linkType,$linkId,$grouping);
    $left_join   = $this->findListLeftJoin($gid,$type,$linkType,$linkId,$grouping);
    $where       = $this->findListWhere   ($gid,$type,$linkType,$linkId,$grouping,$group_type,$search_term);
    $order_by    = $this->findListOrderBy ();

    $stmt = $select.
            "FROM ".$this->mTableName." ".
            $left_join.
            $where.
            $order_by;
    return $stmt;
  } // dbPrepareSearchListStmt

  protected function findListSelect($gid,$type=null,$linkType=null,$linkId=null,$grouping=true)
  {
    // Select from own table
    $sl = "SELECT DISTINCT ".$this->mTableName.".* ";

    // Select from link table
    if (isset($linkId) && $linkId != "" && isset($linkType) && $linkType != "group" &&
        isset($this->mTableFieldsLeftJoin) && isset($this->mTableFieldsLeftJoin[$linkType])) {
      $ltn = $this->findLinkTableName($linkType);
      if ($this->tableExists($ltn)) {
        foreach ($this->mTableFieldsLeftJoin[$linkType] as $field) {
          if (isset($field))
            $sl .= ", ".$ltn.".".$field;
        }
        if ($this->hasParentId())
          $sl .= ", temp.".$this->mNameKey." AS parent_name";
      }
    }
    // Select from group table
    if ($grouping && $type != "group" && $gid != "nogroup" && ($gid || $gid === 0) && 
        isset($this->mGroupTable) && isset($this->mGroupTable->mTableFields)) {
      foreach ($this->mGroupTable->mTableFields as $field) { // TODO! Is it neccessary to select all fields when this.type != group?
        if (isset($field) && $field != "parent_id") // To avoid conflict with the current tables parent_id
          $sl .= ", ".$this->mTableNameGroup.".".$field;
      }
    }
    // Select from meta table
    $mt = $this->findMetaTableName($linkType);
    if ($this->tableExists($mt))
      $sl .= ", ".$mt.".".$this->mMetaId.", ".$mt.".meta_value, ".$mt.".meta_key ";
    $sl .= " ";
    return $sl;
  } // findListSelect

  protected function findListLeftJoin($gid,$type=null,$linkType=null,$linkId=null,$grouping=true)
  {
    $cur_uid = $this->mPermission["current_user_id"];
    $lj = "";
    // Left join link table
    if (isset($linkId) && $linkId != "" && isset($linkType) && $linkType != "group" && $linkType != $type)
      $lj .= $this->findListLeftJoinOne($cur_uid,$gid,$type,$linkType,$linkId,$grouping);

    // Get parent name
    if ($this->hasParentId())
      $lj .= "LEFT JOIN ".$this->mTableName." temp ON ".$this->mTableName.".parent_id=temp.".$this->mIdKey." ";

    // Left join group table
    if ($grouping && $type != "group" && $gid != "nogroup" && ($gid || $gid === 0) && 
        isset($this->mGroupTable))
      $lj .= $this->findListLeftJoinOne($cur_uid,$gid,$type,"group",$linkId,$grouping);
      
    // Left join meta table
    $mt = $this->findMetaTableName($linkType);
    if ($this->tableExists($mt)) {
      $mt_id = $this->findMetaTableId($linkType);
      $lj .= "LEFT JOIN ".$mt." ON CAST(".$mt.".".$mt_id." AS INT)=CAST(".$this->mTableName.".".$this->mIdKeyTable." AS INT) ";
    }
    return $lj;
  } // findListLeftJoin

  protected function findListLeftJoinOne($cur_uid,$gid,$type=null,$linkType=null,$linkId=null,$grouping=true)
  {
    $typetable     = $this->findTypeTableName($linkType);
    $typetable_id  = $this->findTypeTableId($linkType);
    $has_typetable = $this->tableExists($typetable);

    $lj = "";
    $ltn = $this->findLinkTableName($linkType);
    $linktable_id = $this->findLinkTableId($linkType);
    if ($this->tableExists($ltn)) {
      $lj .= "LEFT JOIN ".$ltn." ON CAST(".$ltn.".".$this->mIdKey." AS INT)=CAST(".$this->mTableName.".".$this->mIdKeyTable." AS INT) ";
      if ($this->hasParentId() && $linkId == null)
        $lj .= "OR ".$ltn.".".$this->mIdKeyTable."=temp.".$this->mIdKeyTable." ";
      if (!isset($linkType) && $linkType == "user" && $cur_uid)
        $lj .= "AND CAST(".$ltn.".".$linktable_id." AS INT)=CAST(".$cur_uid." AS INT) "; // Only return results for current user
      if ($has_typetable) {
        if ($linkType != "group")
          $lj .= "LEFT JOIN ".$typetable." ON CAST(".$ltn.".".$linktable_id." AS INT)=CAST(".$typetable.".".$typetable_id." AS INT) ";
      }
    }
    if ($has_typetable && $linkType == "group" && ($gid || $gid === 0)) {
      $db_gid = !$gid && $gid !== 0
                ? "CAST(".$ltn.".".$linktable_id." AS INT)" // No gid specified
                : (is_numeric($gid) ? "CAST(".$gid." AS INT)" : "'".$gid."'"); // Only left join with specified group
      $lj .= "LEFT JOIN ".$typetable." ON CAST(".$typetable.".".$typetable_id." AS INT)=".$db_gid." ";
      $lj .= "AND ".$this->mTableNameGroup.".group_type='".$type."' ";
    }
    return $lj;
  } // findListLeftJoinOne

  protected function findListWhere($gid,$type=null,$linkType=null,$linkId=null,$grouping=true,$groupType=null,$searchTerm="")
  {
    $where = null;

    if (isset($linkType) && $linkType != $type && ($linkId || $linkId === 0) && $linkId != "nogroup") {
      $ltn = $this->findLinkTableName($linkType);
      if ($this->tableExists($ltn)) {
        $db_lid = $linkType == "group" ? "'".$linkId."'" : $linkId;
        $where_id = $ltn.".".$linkType."_id=".$db_lid." "; // TODO! semi-hardcoded name of link table id
        $where .= "WHERE ".$where_id;
      }
    }
    $has_group_linktable = $this->tableExists($this->mTableNameGroupLink);
    // If has parent_id while being a list-for list
    if ($this->hasParentId() && (isset($linkType) || (isset($this->mId) && $this->mId != ""))) {
      if (isset($this->mId) && $this->mId != "" && is_numeric($this->mId) && (!isset($linkType) || (isset($linkType) && $linkType == $type))) {
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
        if ($grouping && ($gid || $gid === 0) && $has_group_linktable) {
          $db_gid = is_numeric($gid) ? "CAST(".$gid." AS INT)" : "'".$gid."'";
          $where .= "AND ".$this->mTableNameGroupLink.".group_id=".$db_gid." ";
        }
      }
    }
    if ($linkType == $type && $this->mId != "nogroup") {
      $db_id = $this->mType == "group" ? "'".$this->mId."'" : $this->mId;
      $skip_str = $this->mTableName.".".$this->mIdKeyTable." != ".$db_id."";
      if ($where === null)
        $where  = "WHERE (".$skip_str.") ";
      else
        $where .= " AND (".$skip_str.") ";
    }
    if ($grouping) {
      if ($gid != "nogroup" && ($gid || $gid === 0)) {
        if ($groupType) {
          $gt_str = $this->mTableNameGroup.".group_type='".$groupType."' ";
          if ($where === null)
            $where  = " WHERE ".$gt_str;
          else
            $where .= " AND ".$gt_str;
        }
        if (!isset($linkType)) {
          if ($has_group_linktable) {
            $db_gid = is_numeric($gid) ? "CAST(".$gid." AS INT)" : "'".$gid."'";
            $lf_str = $this->mTableNameGroup.".group_id=".$db_gid." ";
            if ($where === null)
              $where  = " WHERE ".$lf_str;
            else
              $where .= " AND ".$lf_str;
            $where .= "AND ".$this->mTableNameGroupLink.".group_id=".$db_gid." ";
          }
        }
      }
    } // if grouping
    if ($searchTerm) {
      $term_str = $this->mTableName.".".$this->mNameKey." LIKE '%".$searchTerm."%'";
      if ($where === null)
        $where  = "WHERE (".$term_str.") ";
      else
        $where .= " AND (".$term_str.") ";
    }
    return $where;
  } // findListWhere

  protected function findListOrderBy()
  {
    $order = Parameters::get("order");
    $dir   = Parameters::get("dir");
    if ($order)
      $this->mOrderBy  = ltrim($order);
    if ($dir)
      $this->mOrderDir = ltrim($dir);
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
    $num  = Parameters::get("num");
    $from = Parameters::get("from");
    if (!$num || $num == "")
      return "";
    $lim = "LIMIT ".$num." ";
    $from = $from;
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
  protected function dbSearchMeta($mode,$linkType=null,$linkId=null,$grouping=true)
  {
    if (!$this->tableExists($this->mTableNameMeta)) {
      //$this->mMessage .= "No meta table for '$this->mType' type. ";
      return false;
    }
    $meta_id = Parameters::get($this->mIdKeyMetaTable);
    $is_list = (!isset($this->mId) || $this->mId == "");
    $where   = $meta_id !== null && $meta_id !== "" && !$is_list
               ? "WHERE ".$this->mTableNameMeta.".".$this->mIdKeyMetaTable."='".$meta_id."' "
               : "";
    /* TODO! Untested (left join with link table)
    $left_join = null;
    if (isset($linkType) && $linkType != $this->mType && $linkType != "group" && isset($linkId)) {
      $link_tablename = $this->findLinkTableName($linkType);
      if ($link_tablename !== null) {
        $left_join = "LEFT JOIN ".$link_tablename." ON ".$link_tablename.".".$linkType."_id='".$linkId."' ";
        $where_id = $this->mTableNameMeta.".".$this->mIdKeyMetaTable."=".$link_tablename.".".$this->mIdKeyMetaTable." ";
        if ($where === null)
          $where  = "WHERE ".$where_id;
        else
          $where .= " AND " .$where_id;
      }
    }
    */
    $has_grp_lnk     = $this->tableExists($this->mTableNameGroupLink);
    $group_id_sel    = $has_grp_lnk && $is_list /*|| isset($linkType)*/ ? ",".$this->mTableNameGroupLink.".group_id " : " ";
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
    return $this->getRowMetaData($this->mData,$mode,$grouping);
  } // dbSearchMeta

  ////////////////////////////// Misc. searches //////////////////////////////

  //
  // Find max id for a table. Will only work for tables with AUTO_INCREMENT rows.
  //
  protected function dbSearchMaxId()
  {
    $this->mError = "";
    $this->mData  = null;

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
    Parameters::set("simple",true);
    Parameters::set("grouping",true);
    if (!$this->dbSearchList())
      return null;

    // TODO! Untested code below.
    /*
    $this->dbSearchList();
    //elog("dbSearchParents,items:".var_export($this->mData,true));
    $sel_arr = array();
    if ($this->mData != null) {
      $item_id       = Parameters::get($itemIdKey);
      $item_id_key   = $itemIdKey;
      $item_name_key = $itemNameKey;
      $i = 0;
      $children = array();
      if ($item_id_key != null)
      foreach ($this->mData as $gid => $group) {
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

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Data retrieval //////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  //
  // Get the data from query result (rows) to data array. If data is to be grouped, the first index
  // is the group_id, otherwise it is "nogroup". The second index is the id of the data element, as
  // specified by this.idKey. If the data element does not contain an id or has an illegal id, it is
  // silently ignored.
  //
  protected function getRowData(&$data,$mode,$grouping=true,$simple=false)
  {
    $this->mLastNumRows = 0; // Used to break (theoretical) infinite recursion
    $filter = $mode == "list"
              ? $this->mFilters["list"]
              : $this->mFilters["item"];
    if (!$data)
      $data = array();
    $has_meta_table  = $this->tableExists($this->mTableNameMeta);
    while (($nextrow = $this->getNext(true)) !== null) {
      //elog("getRowData,nextrow:".var_export($nextrow,true));
      ++$this->mLastNumRows;
      $gidx = $grouping && $this->mType != "group" && isset($nextrow["group_id"])
              ? $nextrow["group_id"]
              : "nogroup";
      $idx  = isset($nextrow[$this->mIdKeyTable])
              ? $nextrow[$this->mIdKeyTable]
              : null;
      if (!$idx && $idx !== 0)
        continue; // Ignore element without id

      // Force idx to be a string in order to maintain ordering when sending JSON data to a json client
      $idx = isInteger($idx) ? "+".$idx : $idx;

      if (!isset($data[$gidx]))       $data[$gidx]       = array();
      if (!isset($data[$gidx][$idx])) $data[$gidx][$idx] = array();

      $data[$gidx][$idx][$mode] = $this->mType;

      // Main table
      if (isset($this->mTableFields)) {
        for ($t=0; $t<count($this->mTableFields); $t++) {
          $tablefield = $this->mTableFields[$t];
          if (!$simple || $tablefield == $this->mIdKeyTable || $tablefield == $this->mNameKey || $tablefield == "parent_id")
            $this->getCellData($tablefield,$nextrow,$data,$gidx,$idx,$filter,$mode);
        } // for
      }

      // Meta table
      if (isset($this->mTableFieldsMeta) && $has_meta_table) {
        for ($t=0; $t<count($this->mTableFieldsMeta); $t++) {
          $tablefield = $this->mTableFieldsMeta[$t];
          if (!$simple || $tablefield == $this->mIdKey || $tablefield == $this->mNameKey || $tablefield == "parent_id")
            $this->getCellData($tablefield,$nextrow,$data,$gidx,$idx,$filter,$mode);
        } // for
      }

      // Link tables for item
      if (isset($this->mLinkTypes)) {
        foreach ($this->mLinkTypes as $i => $link_type) {
          if (isset($link_type) && isset($this->mTableFieldsLeftJoin[$link_type])) {
            for ($t=0; $t<count($this->mTableFieldsLeftJoin[$link_type]); $t++) {
              $tablefield = $this->mTableFieldsLeftJoin[$link_type][$t];
              if (!$simple || $tablefield == $this->mIdKey || $tablefield == $this->mNameKey || $tablefield == "parent_id")
                $this->getCellData($tablefield,$nextrow,$data,$gidx,$idx,$filter,$mode);
            } // for
          } // if
        } // foreach
      } // if
    } // while
    //elog("getRowData1 ($this->mType),data:".var_export($data,true));

    if ($data === null || empty($data))
      return false;
    return true;
  } // getRowData

  protected function getCellData($tablefield,$nextrow,&$data,$gidx,$idx,$filter,$mode)
  {
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
      if ($val != null && $val != "")
        $data[$gidx][$idx][$field] = $val;
      //elog("getCellData:$gidx,$idx,$tablefield,$field:".$val);
    }
  } // getCellData

  //
  // Get the meta data from table row(s) to array
  //
  protected function getRowMetaData(&$data,$mode,$grouping=true)
  {
    if (!$this->mIdKeyMetaTable || !$this->tableExists($this->mTableNameMeta))
      return false;
    $filter = $mode == "list" 
              ? $this->mFilters["list"] 
              : $this->mFilters["item"];
    if (!$data)
      $data = array();
    while (($nextrow = $this->getNext(true)) !== null) {
      //elog("getRowMetaData,nextrow:".var_export($nextrow,true));
      if (!isset($nextrow[$this->mIdKeyMetaTable]))
        continue;
      $gidx = $grouping && $this->mType != "group" && isset($nextrow["group_id"])
              ? $nextrow["group_id"]
              : "nogroup";
      $idx  = isset($nextrow[$this->mIdKeyMetaTable])
              ? $nextrow[$this->mIdKeyMetaTable]
              : null;
      if (!$idx || $idx == "")
        continue; // Ignore element without id
        
      // Force idx to be a string in order to maintain ordering when sending JSON data to a json client
      $idx = isInteger($idx) ? "+".$idx : $idx;

      if (!isset($data[$gidx]))       $data[$gidx]       = array();
      if (!isset($data[$gidx][$idx])) $data[$gidx][$idx] = array();

      $data[$gidx][$idx][$mode] = $this->mType;

      //elog($gidx.",".$idx.",".$this->mIdKey.",data[$gidx][$idx]:".var_export($the_data[$idx],true));
      if (isset($data[$gidx][$idx]) && isset($data[$gidx][$idx][$this->mIdKey])) {
        $meta_key   = isset($nextrow["meta_key"])   ? $nextrow["meta_key"]   : null;
        $meta_value = isset($nextrow["meta_value"]) ? $nextrow["meta_value"] : null;
        //elog($meta_key."(".$filter[$meta_key].")=".$meta_value.":");
        if ($filter === null || (isset($filter[$meta_key]) && $filter[$meta_key] == 1) &&
            $meta_key !== null && $meta_key !== "" && $meta_value !== null && $meta_value !== "")
          $data[$gidx][$idx][$meta_key] = $meta_value;
      }
    }
    $this->purgeNull($data); // dbTable method
    //elog("(meta)data:".var_export($data,true));
    return true;
  } // getRowMetaData

  //
  // Build the data group tree for all groups for a list search.
  //
  protected function buildGroupTreeAndAttach($group_data,$type,$linkId=null,$grouping=true)
  {
    if (!$this->mData || empty($this->mData))
      return;
    $this->mRecurseDepth = 0;

    // Make sure parent/child items are present in all groups where parent exists
    //vlog("buildGroupTreeAndAttach,data before copying parent/child:",$this->mData);
    foreach ($this->mData as $gidx => $grp) {
      if (isset($grp)) {
        foreach ($grp as $idx => $item) {
          if (isset($item["parent_id"])) {
            $pid = $item["parent_id"];
            foreach ($this->mData as $gidx2 => &$grp2) {
              if (isset($grp2)) {
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
                    $err = "Warning: The parent of '$name' ($idx) also belongs to a different group. "; // TODO i18n
                    $this->setMessage($err);
                    error_log($err);
                  }
                }
              }
            } // foreach
          }
        } // foreach
      } // if grp
    } // foreach

    // Build data tree
    //vlog("buildGroupTreeAndAttach,group_data:",               $group_data);
    //vlog("buildGroupTreeAndAttach,data before building tree:",$this->mData);
    $data_tree = array();
    $data_tree["grouping"] = $grouping;
    foreach ($this->mData as $gidx => $grp) {
      if (isset($grp)) {
        $ngidx = isInteger($gidx) ? "+".$gidx : $gidx;
        if (!isset($data_tree[$ngidx])) $data_tree[$ngidx] = array();
        if ($grouping && !empty($this->mData[$gidx])) { // Add a head data layer
          $data_tree[$ngidx]["head"] = "group";
          if (!$linkId) {
            $data_tree[$ngidx]["group_type"] = $this->mType;
            $data_tree[$ngidx]["group_id"]   = $ngidx;
            $gname = isset($group_data) && isset($group_data[$ngidx]) && isset($group_data[$ngidx]["group_name"])
                     ? $group_data[$ngidx]["group_name"]
                     : ucfirst($data_tree[$ngidx]["group_type"])." groups"; // TODO i18n
            if ($type != "group") {
              if (!$gname || $gname == "")
                $gname = $this->findDefaultHeader($type);
            }
            else {
              if (!$gname || $gname == "")
                if ($gidx != "group")
                  $gname = ucfirst($data_tree[$ngidx]["group_type"])." groups"; // TODO i18n
                else
                  $gname = "Other groups"; // TODO i18n
            }
            $data_tree[$ngidx]["group_name"] = $gname;
          }
          else {
            $idx = isset($this->mData[$gidx]) && isset($this->mData[$gidx][$this->mId]) ? $this->mId : "+".$this->mId;
            if (isset($this->mData[$gidx]) && isset($this->mData[$gidx][$idx]))
              $data_tree[$ngidx][$this->mNameKey] = $this->mData[$gidx][$idx][$this->mNameKey];
          }
        } // if grouping
        if (!isset($data_tree[$ngidx]["data"])) { // TODO! This may not be the correct solution
          $data_tree[$ngidx]["data"] = $this->buildDataTree($this->mData[$gidx],null);
          if (isset($data_tree[$ngidx]["data"]) && isset($data_tree[$ngidx]["data"]["data"]))
            $data_tree[$ngidx]["data"] = $data_tree[$ngidx]["data"]["data"]; // TODO! Not the correct solution!
        }
        // Preserve "grouping_num_results" value
        if (isset($this->mData[$gidx]) && isset($this->mData[$gidx]["grouping_num_results"]))
          $data_tree[$ngidx]["data"]["grouping_num_results"] = $this->mData[$gidx]["grouping_num_results"];
        if ($data_tree[$ngidx]["data"] === null)
          unset($data_tree[$ngidx]["data"]);
      }
    } // foreach
    //vlog("buildGroupTreeAndAttach,data_tree1:",$data_tree);
    //
    // If grouping is specified, build group tree and stick data tree to it
    //
    if ($grouping && (!isset($this->mId) || $this->mId == "") && !isset($linkId)) {
      if (!isset($data_tree["unknown"]))
        $data_tree["unknown"] = null;
      if ($data_tree["unknown"]) {
        $group_data["unknown"] = null;
        $group_data["unknown"]["group_id"]   = "unknown";
        $group_data["unknown"]["group_name"] = "Unknown"; // TODO! i18n
        $group_data["unknown"]["group_description"] = ucfirst($type)."s belonging to non-".$type." group&nbsp;&nbsp;".
                                                      '<i style="color:red" class="fa fad fa-exclamation-triangle"></i>'; // TODO! i18n and CSS
      }
      if (!isset($group_data))
        $group_data = array();
      $this->dbAttachToGroups($group_data,$data_tree,$type);
      $group_data["grouping"] = true;
      //vlog("buildGroupTreeAndAttach,group_data:",$group_data);
      $this->mData = $group_data;
    }
    else {
      if (isset($linkId))
        $this->mData = isset($data_tree[$type]) && isset($data_tree[$type]["data"])
                       ? $data_tree[$type]["data"]
                       : $data_tree;
      else
        $this->mData = $data_tree;
    }
    //vlog("buildGroupTreeAndAttach,data after building tree:",$this->mData);
  } // buildGroupTreeAndAttach

  // Overridden in group table
  protected function dbSearchGroupInfo($type=null,$group_id=null)
  {
    // Get group tree and append data to it
    $data = array();
    $data = $this->buildDataTree($this->mData["nogroup"]);
    //vlog("dbSearchGroupInfo,data:",$data);

    // Add the default "nogroup" group
    if ($type && $type != "") {
      $data["nogroup"]               = array();
      $data["nogroup"]["group_type"] = $type;
      $data["nogroup"]["group_id"]   = "nogroup";
      $data["nogroup"]["group_name"] = $this->findDefaultNogroupHeader($type);
      $data["nogroup"]["head"]       = "group";
    }
    //vlog("dbSearchGroupInfo,data:",$data);
    return $data;
  } // dbSearchGroupInfo

  // Build data tree from parent-child relations
  protected function buildDataTree(&$flatdata,$parentId=null)
  {
    ++$this->mRecurseDepth;
    if ($this->mRecurseDepth > $this->mLastNumRows + $this->mRecurseMax) {
      error_log("buildDataTree: Too much recursion ($this->mRecurseDepth)");
      return null;
    }
    if (!$flatdata)
      return null;
    $retval  = array();
    $id_name = $this->mIdKey; // TODO! Use $this->mIdKeyTable?
    foreach ($flatdata as $idx => &$subdata) {
      if (isset($subdata) && strpos($idx,"grouping") !== 0) {
        $parent_not_in_group = isset($subdata["parent_id"]) && $subdata["parent_id"] != "" &&
                               !isset($flatdata[$subdata["parent_id"]]) && !isset($flatdata["+".$subdata["parent_id"]]);
        $pid = null;
        if ($parent_not_in_group) {
          $pid = $subdata["parent_id"];
          unset($subdata["parent_id"]);
        }
        if (is_array($subdata)) {
          if (!isset($subdata["parent_id"]))
            $subdata["parent_id"] = null;
          if ($subdata["parent_id"] == $parentId) {
            $children = null;
            if (isset($subdata[$id_name]) && $subdata[$id_name] != "")
              $children = $this->buildDataTree($flatdata,$subdata[$id_name]);
            if ($this->mRecurseDepth > $this->mLastNumRows + $this->mRecurseMax)
              break; // Break recursion
            if ($children)
              $subdata["data"] = $children;
            if ($parent_not_in_group && ($pid || $pid === 0))
              $subdata["parent_id"] = $pid;
            $retval[$idx] = $subdata;
            unset($subdata);
          } // if subdata
          else {
            if ($pid != null)
              $subdata["parent_id"] = $pid;
          }
        } // if is_array
      } // if isset
    } // foreach
    return $retval;
  } // buildDataTree

  private function dbAttachToGroups(&$group_tree,$data_tree,$type)
  {
    //vlog("dbAttachToGroups,group_tree:",$group_tree);
    //vlog("dbAttachToGroups,data_tree:", $data_tree);
    if (isset($group_tree)) {
      foreach ($group_tree as $gid => &$group) { // Iterate over group ids
        if (isset($group))
          if (isset($group["data"])) // TODO! Is this correct?
            $this->dbAttachToGroups($group["data"],$data_tree,$type); // Recursive call
        if (isset($group["data"])) { // TODO! Is this correct?
          $group["head"] = "group";
          if ($type != "group") {
            if ($group["list"]) unset($group["list"]);
            if ($group["item"]) unset($group["item"]);
          }
        }
        $idx = null;
        if (isset($data_tree[$gid]))
          $idx = $gid;
        else
        if (isset($data_tree["+".$gid]))
          $idx = "+".$gid;
        if (isset($idx) && $data_tree[$idx] !== null) {
          if (isset($data_tree[$idx]["data"])) {
            $group["head"] = "group";
            if ($type != "group") {
              if (isset($group["list"])) unset($group["list"]);
              if (isset($group["item"])) unset($group["item"]);
            }
            if (array_key_exists("data",$group) && !isset($group["data"])) 
              $group["data"] = array(); // TODO! Is this correct?
            foreach ($data_tree[$idx]["data"] as $id => $obj)
              $group["data"][$id] = $data_tree[$idx]["data"][$id];
          }
        }
      } // foreach
    } // if
  } // dbAttachToGroups

  /**
   * Prepare data related to a list or a single item.  Adds a default top header.
   *
   * @param object inData
   *
   * @return array|null Data array, or null on error or no data
   *
   * #### Example
   *```
   *      $data = $myTable->prepareData();
   *```
   */
  public function prepareData()
  {
    //vlog("data before prepare:",$this->mData);
    // Make room for a top level header
    $topidx = "+0";
    if (($this->mId || $this->mId === 0) && $this->mId != "")
      $topidx = "+".$this->mId;
    $data = array("data" => array($topidx => array()));

    if ($this->mId || $this->mId === 0)
      $this->mData = $this->mData["nogroup"];

    // Set header and "head"
    $hdr = $this->findHeader($this->mType,$this->mData);
    if (isset($hdr) && $hdr != "") {
      $data["data"][$topidx]["head"] = $this->mType;
      $data["data"][$topidx][$this->mNameKey] = $hdr;
    }

    // Set data
    $data["data"][$topidx]["data"] = $this->mData;

    // Set link types
    $data["link_types"] = $this->mLinkTypes;

    $this->mData = $data;
    //vlog("data after prepare:",$this->mData);
    return $this->mData;
  } // prepareData

  public function prepareParents($type,$itemIdKey,$itemNameKey)
  {
    // TODO! Untested. See also searchParents()
    return null;
    $this->dbSearchList();
    //elog("prepareParents,items:".var_export($this->mData,true));
    $sel_arr = array();
    if ($this->mData != null) {
      $item_id       = Parameters::get($itemIdKey);
      $item_id_key   = $itemIdKey;
      $item_name_key = $itemNameKey;
      $i = 0;
      $children = array();
      if ($item_id_key != null)
      foreach ($this->mData as $gid => $group) {
        if (isset($group)) {
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
          } // foreach
        }
      } // foreach
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
   * @return array|null Data object on success, null on error
   */
  public function dbInsert()
  {
    $this->mError = "";
    if (!$this->dbValidateInsert())
      return null;

    $this->mId   = -1;
    $this->mData = null;

    $this->initFieldsFromParam();

    // Insert in normal table
    $stmt = $this->dbPrepareInsertStmt();
    //elog("dbInsert stmt:".$stmt);
    if (!$stmt || $stmt == "" || !$this->query($stmt))
      return null;

    // Number of rows changed == 1 if the insert succeeded
    if ($this->getNumRowsChanged() == 0) {
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
    $gid = Parameters::get("group_id");
    if (($gid || $gid==0)&& $gid != "" && $gid != "nogroup" && $this->mType != "group") {
      if ($this->tableExists($this->mTableNameGroupLink)) {
        $stmt = "INSERT INTO ".$this->mTableNameGroupLink." (group_id,".$this->mType."_id) ".
                "VALUES ('".$gid."','".$this->mId."')";
        //error_log("stmt:".$stmt);
        if (!$this->query($stmt))
          return null;
      }
    }
    // Insert in link table, if link id is given
    $link_id = Parameters::get("link_id");
    if (($link_id || $link_id==0) && $link_id != "") {
        Parameters::set("add",$link_id);
        $this->dbUpdateLinkList();
    }
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
   * Update data, either an existing item or a link to one.
   *
   * @return array|null Data array, or null on error or no data
   */
  public function dbUpdate()
  {
    if (!$this->dbValidateUpdate())
      return null;

    if (!isset($this->mId) || $this->mId == "")
      return $this->dbInsert(); // No id, assume it is a new item

    if (Parameters::get("add") || Parameters::get("rem"))
      return $this->dbUpdateLinkList();

    if (Parameters::get("cha")) // TODO! Not tested
      return $this->dbUpdateLink();

    // Initialize
    $this->mData = null;
    $this->initFieldsFromParam();

    // Update normal table
    $stmt = $this->dbPrepareUpdateStmt();
    //elog("dbUpdate:".$stmt);
    if ($stmt) { // May be null if we only update meta fields (or link fields for item lists)
      if (!$this->query($stmt))
        return null;
    }
    if ($this->isError())
      return null;

    // Update meta table
    $this->dbMetaInsertOrUpdate($this->mId);

    // Update link table(s) if any of the link fields (left join fields) are changed
    if (Parameters::get("link_type") && Parameters::get("link_id"))
      $this->dbUpdateLink();

    // Set result message
    if ($this->getNumRowsChanged() > 0)
      $this->setMessage($this->mUpdateSuccessMsg);
    else
      $this->setMessage($this->mUpdateNothingToDo);

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
    if ($nextrow === null) {
      // Insert
      $stmt = "INSERT INTO ".$this->mTableNameMeta." ".
              "(".$this->mIdKeyMetaTable.",meta_key,meta_value) VALUES (".
              $id.",'".$key."','".$val."'".
              ")";
    }
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
    return true;
  } // dbMetaInsertOrUpdateSingle

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////// Insert or update link ///////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // Add or remove a link
  public function dbUpdateLinkList()
  {
    $this->mError = "";
    if (!$this->dbValidateUpdate())
      return null;
    // Initialize
    $this->mData = null;
    $this->initFieldsFromParam(); // TODO! Neccessary?

    $link_type = Parameters::get("link_type");
    if (!$link_type || $link_type == "") {
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
    $inslist = explode(",",Parameters::get("add"));
    $dellist = explode(",",Parameters::get("rem"));

    if ($link_type != $this->mType) {
      // Link with different type (sublist of item)
      $link_tablename = $this->findLinkTableName($link_type);
      if (!$link_tablename || $link_tablename == "") {
        $this->setMessage("Link table not found. ",true); // TODO! i18n
        return null;
      }
      if ($dellist !== null) {
        // Remove elements from the item's list
        foreach ($dellist as $delval) {
          if ($delval) {
            if (!$this->dbTableHasLink($link_tablename,$id_key_link,$delval,$id_key,$id))
              $this->setMessage("Link not found. ",true); // TODO! i18n
            else {
              // Link exists, we can delete it
              $stmt = "DELETE FROM ".$link_tablename." ".
                      "WHERE ".
                      $id_key_link."='".intval($delval)."' ".
                      "AND ".
                      $id_key.     "='".intval($id)."'";
              //elog("dbUpdateLinkList(1):".$stmt);
              if (!$this->query($stmt))
                return null; // TODO! Give warning and continue instead?
            }
          }
        } // foreach
      }
      if ($inslist !== null) {
        // Add elements to the item's list
        foreach ($inslist as $insval) {
          if ($insval) {
            // Dont add if element already exists in list
            if ($this->dbTableHasLink($link_tablename,$id_key_link,$insval,$id_key,$id))
              $this->setMessage("Link already exists. ",true); // TODO! i18n
            else {
              // Link does not exist, we can add it
              $stmt = "INSERT INTO ".$link_tablename." (".
                      $id_key_link.",".$id_key.
                      ") VALUES (".
                      intval($insval).",".intval($id).
                      ")";
              //elog("dbUpdateLinkList(3):".$stmt);
              if (!$this->query($stmt))
                return null; // TODO! Give warning and continue instead?
            }
          }
        } // foreach
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
              //elog("dbUpdateLinkList(4):".$stmt);
              if (!$this->query($stmt))
                return null;
            }
          } // foreach
        }
        if ($inslist !== null) {
          // Set parent for elements in inslist
          foreach ($inslist as $updval) {
            if ($updval && intval($id) != intval($updval)) {
              $stmt = "UPDATE ".$this->mTableName." ".
                      "SET parent_id='".intval($updval)."' ".
                      "WHERE ".$id_key."='".intval($id)."'";
              //elog("dbUpdateLinkList(5):".$stmt);
              if (!$this->query($stmt))
                return null;
            }
          } // foreach
        }
      }
    }
    $this->setMessage($this->mUpdateSuccessMsg);

    // Get the (updated) list for the item
    $grouping = Parameters::get("grouping");
    $grouping = $grouping !== false && $grouping !== "false" && $grouping !== "0";
    $ok = $this->dbSearchItemListOfType($link_type,$grouping);

    if (!$ok)
      return null;
    $this->mData = array();
    if ($this->mData)
      $this->mData = $this->mData["+".$id];
    return $this->mData; //$this->prepareData();
  } // dbUpdateLinkList

  // Update the fields of a link. The link must exist in the link table.
  public function dbUpdateLink()
  {
    $link_type = Parameters::get("link_type");
    if (!$link_type || $link_type == "") {
      $this->setError("Link type missing. "); // TODO! i18n
      return null;
    }
    $id_key = $this->mIdKey; // TODO! Use $this->mIdKeyTable?
    $id     = Parameters::get($id_key); // TODO! Use $this->mId?
    if (!isset($id) || $id == "") {
      $this->setError($this->mType." id missing. "); // TODO! i18n
      return null;
    }
    $link_id = Parameters::get("link_id");
    if (!$link_id || $link_id == "") {
      $this->setError($link_type." id missing. "); // TODO! i18n
      return null;
    }
    // Check if exists
    $link_tablename = $this->findLinkTableName($link_type);
    if ($link_tablename === null) {
      $this->setError("Link table $link_tablename not found");
      return null;
    }
    $id_key_link = $link_type."_id"; // TODO! Not general enough
    if (!$this->dbTableHasLink($link_tablename,$id_key_link,$link_id,$this->mIdKey,$this->mId)) {
      $this->setMessage("Link not found in $link_tablename",true); // TODO! i18n
      return null;
    }
    // Link found, we can update it
    if (isset($this->mTableFieldsLeftJoin[$link_type])) {
      $val_found = false;
      $stmt = "UPDATE ".$link_tablename." SET ";
      for ($t=0; $t<count($this->mTableFieldsLeftJoin[$link_type]); $t++) {
        $str = $this->mTableFieldsLeftJoin[$link_type][$t];
        $val = Parameters::get($str);
        if (($val || $val=="0") && $val != "") {
          $stmt .=  $str."='".$val."',";
          $val_found = true;
        }
      }
      if (!$val_found)
        return null;
      $stmt[strlen($stmt)-1] = " "; // Replace last "," with " "
      $stmt .= "WHERE ".$id_key."=".$id;
      //elog("dbUpdateLink:".$stmt);
      if (!$this->query($stmt))
        return null;
    }
    return $this->mData;
  } // dbUpdateLink

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
   * Deletes an item of given type with given id from a database table or a file from disk.
   * TODO! Delete a list of items.
   *
   * @return array|null Data array, or null on error or no data
   */
  public function dbDelete()
  {
    // Delete item(s) from table or file from disk
    if (Parameters::get("del") == "ulf") {
      // Delete file from disk (upload folder)
      $fname = Parameters::get("ulf");
      if (!$fname) {
        $this->setError("Filename missing for delete. ");
        return null;
      }
      unlink(gUploadPath.$fname);
      return $this->mData;
    }
    // Delete item(s) from table
    if (!$this->dbValidateDelete())
      return null;
    if (!$this->tableExists($this->mTableName)) {
      $this->setError("Table $this->mTableName does not exist. ");
      return null;
    }
    $this->mData = null; // TODO! Why?
    $stmt = "DELETE FROM ".$this->mTableName." WHERE ".$this->mIdKeyTable."='".$this->mId."'";
    //elog("dbDelete(1):".$stmt);
    if (!$this->query($stmt))
      return null;
    if ($this->getNumRowsChanged() > 0)
      $this->setMessage($this->mDeleteSuccessMsg); // numRowsChanged >= 1 if the delete succeeded
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
    if (isset($this->mLinkTypes)) {
      foreach ($this->mLinkTypes as $idx => $link_type) {
        if ($this->mType !== $link_type) {
          $link_tablename = $this->findLinkTableName($link_type);
          if ($this->tableExists($link_tablename)) {
            $stmt = "DELETE FROM ".$link_tablename." WHERE ".$this->getIdKey()."='".$this->mId."'";
            //elog("dbDelete(3):".$stmt);
            if (!$this->query($stmt))
              return null;
          }
          //else
          //  elog("dbDelete: Link table $link_tablename does not exist. ");
        }
      }
    }
    $this->mId = null;
    return $this->mData;
  } // dbDelete

  protected function dbValidateDelete()
  {
    $this->mError = "";
    if (!isset($this->mTableName))
      $this->mError .= "Table name missing. "; // TODO! i18n
    if (!isset($this->mIdKeyTable))
      $this->mError .= "Id key missing. "; // TODO! i18n
    if (!isset($this->mId) || $this->mId == "" || !is_numeric($this->mId))
      $this->mError .= $this->mType." id missing or not an integer. "; // TODO! i18n

    if (method_exists($this,"dbValidateDeletePermission"))
      $this->dbValidateDeletePermission(); // Sets mError

    if ($this->mError != "")
      return false;
    return true;
  } // dbValidateDelete

  //
  // Unused methods:
  //

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

} // class anyTable
?>
