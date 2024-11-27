<?php
/********************************************************************************************
 *                                                                                          *
 * anyVista is copyright (C) 2011-2024 Arne D. Morken and Balanse Software.                 *
 *                                                                                          *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use. *
 * Get licences here: http://balanse.info/anyvista/license/                                 *
 *                                                                                          *
 ********************************************************************************************/

/**
 * Class for interacting with an anyVista MySql database table.
 *
 * Inherits from `dbTable`, which manages the database connection.
 * Contains methods for doing search, insert, update and delete on a MySQL database table.
 * Supports user defined table format, as well as data in (Wordpress) meta tables.
 * The table format must be described in a table class that inherits from `anyTable`.
 * See `types/user/userTable.php` and `types/group/groupTable.php` for examples.
 *
 */
require_once "permission.php";
require_once "anyTableFactory.php";

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
  * Whether a header should be generated, or the header to return.
  *
  * @var string
  */
  $mHeader = false,

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
  * @var string
  */
  $mPath = "",

  /**
  * @var array Contains data for a list or an item. See "Data structure" above.
  */
  $mData = null,

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
  protected $mInsertSuccessMsg  = "Insert succeeded. ",
            $mUpdateSuccessMsg  = "",
            $mDeleteSuccessMsg  = "%% deleted",
            $mItemExists        = "Item already exist. ",
            $mItemUnexists      = "Item does not exist. ",
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
  * @param dbConnection $connection    Info about the database connection. See `db/dbConnection`.
  * @param {Object|string} paramOrType A parameter object OR a type overriding the one set by deriving class.
  *                                    If an object, paramOrType may contain the following properties:
  *
  * @param {String}     parameters.type       Type of the table, e.g. "event".
  * @param {String}     parameters.idKey      The id key used in the table, e.g. "event_id".
  * @param {String}     parameters.nameKey    The name key used in the table, e.g. "event_name".
  * @param {String}     parameters.tableName  Name of the main table, e.g. "any_event". Mandatory.
  * @param {String}     parameters.orderBy    The field to sort by. e.g. "event_date_start".
  * @param {String}     parameters.orderDir   The direction of the sort, "ASC" or "DESC".
  * ... TODO!
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
    if ($this->mIdKey == "user_id") {
      $par_id = ltrim(Parameters::get("user_id"));
      if ($par_id)
        $this->mUserId = $par_id;
    }
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
    //if ($paramOrType["header"])              $this->mHeader              = $paramOrType["header"];
      if ($paramOrType["tableName"])           $this->mTableName           = $paramOrType["tableName"];
      if ($paramOrType["tableNameMeta"])       $this->mTableNameMeta       = $paramOrType["tableNameMeta"];
      if ($paramOrType["tableNameGroup"])      $this->mTableNameGroup      = $paramOrType["tableNameGroup"];
      if ($paramOrType["tableNameGroupLink"])  $this->mTableNameGroupLink  = $paramOrType["tableNameGroupLink"];
      if ($paramOrType["tableNameUser"])       $this->mTableNameUser       = $paramOrType["tableNameUser"];
      if ($paramOrType["tableNameUserLink"])   $this->mTableNameUserLink   = $paramOrType["tableNameUserLink"];
      if (!$par_table_fields &&
          $paramOrType["tableFields"])         $this->mTableFields         = $paramOrType["tableFields"];
      if (!$par_table_fields_meta &&
          $paramOrType["tableFieldsMeta"])     $this->mTableFieldsMeta     = $paramOrType["tableFieldsMeta"];
      if (!$par_table_fields_left_join &&
          $paramOrType["tableFieldsLeftJoin"]) $this->mTableFieldsLeftJoin = $paramOrType["tableFieldsLeftJoin"];
      if (!$par_link_types &&
          $paramOrType["linkTypes"])           $this->mLinkTypes           = $paramOrType["linkTypes"];
    //if ($paramOrType["path"])                $this->mPath                = $paramOrType["path"];
    }
    //
    // Set defaults if not set yet
    //
    if (!$this->mIdKey)          $this->mIdKey          = $this->mType."_id";
    if (!$this->mIdKeyTable)     $this->mIdKeyTable     = $this->mIdKey;
    if (!$this->mIdKeyMetaTable) $this->mIdKeyMetaTable = $this->mIdKey;
    if (!$this->mNameKey)        $this->mNameKey        = $this->mType."_name";
    if (!$this->mMetaId)         $this->mMetaId         = "meta_id";
    if (!$this->mOrderBy)        $this->mOrderBy        = $this->mNameKey;
    if (!$this->mOrderDir)       $this->mOrderDir       = "DESC";
  //if (!$this->mHeader)         $this->mHeader         = false;
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
    if (!$this->mTableNameGroupLink && $this->mType != "group") {
      $ltn = ["group",$this->mType];
      sort($ltn);
      $this->mTableNameGroupLink = $this->mTablePrefix.implode("_",$ltn);
    }
    if (!$this->mTableNameUser)
      $this->mTableNameUser = $this->mTablePrefix."user";
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

    // Check whether columns with same name exists in both main and meta table, and if so, write a warning
    if ($this->mTableFields && $this->mTableFieldsMeta) {
      $res = array_intersect($this->mTableFields,$this->mTableFieldsMeta);
      if (count($res)) {
        if (($key = array_search($this->mIdKey,$res)) !== false)
          unset($res[$key]);
        $elm = implode(',',$res);
        $str = "Warning: Some elements exists in both main and meta tables; this may give unexpected results: ".$elm;
        error_log($str);
        $this->mMessage .= $str;
      }
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

  // Set mTableFields from parameters
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

  protected function findHeader($type,$inData,$id)
  {
    $hdr = "";
    $h = Parameters::get("header");
    if ($h && $h !== true && $h !== "true" && $h !== false && $h !== "false")
      $hdr = $h; // Use the header provided in the in-parameter
    else
    if (!isset($id) || $id == "") {
      if ($h === true || $h === "true")
        $hdr = $this->findDefaultListHeader($type);
    }
    else {
      if ($h !== false && $h !== "false")
        $hdr = $this->findDefaultItemHeader($type,$inData,$id);
    }
    return $hdr;
  } // findHeader

  protected function findDefaultHeader($type,$skipOther=false)
  {
    $other = $skipOther ? "" : "Other "; // TODO! i18n
    return $other.$type."s";             // TODO! i18n
  } // findDefaultHeader

  protected function findDefaultListHeader($type)
  {
    return ucfirst($type)." list"; // TODO! i18n
  } // findDefaultListHeader

  protected function findDefaultItemHeader($type,$inData,$id)
  {
    if (!isset($inData) || (!$id && $id !== 0))
      return ucfirst($type);
    $hdr = "";
    if (isset($inData["nogroup"]) && isset($inData["nogroup"]["data"])) {
      $ix = isset($inData["nogroup"]["data"]["+".$id])
            ? "+".$id
            : $id;
      if (isset($inData["nogroup"]["data"][$ix][$this->mNameKey]))
        $hdr = $inData["nogroup"]["data"][$ix][$this->mNameKey];
    }
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
    //if (type == "group")
    //  return $this->mTableNameGroup; // TODO! Why is this commented out?
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
   * If id == "max", search for max id.
   * If id == "par", search for parent list.
   * If id has another non-null value, search for the item with the given id.
   * Otherwise, search for a list of the given type.
   *
   * @return array|null Data array, or null on error or no data
   */
  public function dbSearch($id=null)
  {
    try {
      $ok = $this->_dbSearch($id);
      if (!$ok || (isset($this->mError) && $this->mError != ""))
        throw new Exception($this->mError);
      if ($this->mMaxId >= 0)
        return $this->mData;
      return $this->prepareData(Parameters::get($this->mIdKey));
    }
    catch (Exception $e) {
      $this->mError = $e->getMessage();
      error_log($this->mError);
      return null;
    }
  } // dbSearch

  // Internal method called by dbSearch(), do not call directly.
  private function _dbSearch($id=null)
  {
    if (Parameters::get("type"))
    $this->mType = Parameters::get("type");

    $id = $this->_initSearch($id);
    if ($id == -1)
      return null;

    if ($id == "max")
      return $this->dbSearchMaxId();
    else
    if ($id == "par")
      return $this->dbSearchParents();
    else
    if ($id || $id === 0)
      return $this->dbSearchItem($id);
    else
      return $this->dbSearchList();
  } // _dbSearch

  private function _initSearch($id=null)
  {
    $type = Parameters::get("type") ? Parameters::get("type") : $this->mType;
    if (!$type) {
      $this->mError = "_initSearch: type missing. ";
      elog($this->mError);
      return -1;
    }
    $this->mData  = null;
    $this->mError = "";
    $this->mNumResults = 0;

    $this->initFieldsFromParam();
    $this->initFiltersFromParam();

    $id = $id || $id === 0 ? $id : Parameters::get($this->mIdKey);
    return $id;
  } // _initSearch

  //////////////////////////////// Item search ////////////////////////////////

  //
  // Search database for an item, including meta data and linked lists.
  // Return data structure on success, null on error.
  //
  protected function dbSearchItem($id=null,$skipLinks=false,$includeUser=true)
  {
    $id = $this->_initSearch();
    if ($id == -1)
      return null;

    return $this->dbSearchItemByKey($id,$this->mIdKeyTable,$id,$skipLinks,$includeUser);
  } // dbSearchItem

  protected function dbSearchItemByKey($id,$key,$val,$skipLinks=false,$includeUser=true)
  {
    if ($key === null || $key == "" || $val === null || $val == "") {
      $this->setError("Missing key or value. "); // TODO! i18n
      return null;
    }
    $groupId  = Parameters::get("group_id"); // If "groupId" is specified, search only in that group.
    $grouping = Parameters::get("grouping"); // Grouping of the lists of the item
    $grouping = $grouping !== false && $grouping !== "false" && $grouping !== "0";

    $this->mNumResults = 0;
    // Build and execute the query
    $stmt = $this->dbPrepareSearchItemStmt($key,$val,$includeUser);
    //elog("dbSearchItemByKey:".$stmt);
    if (!$this->query($stmt))
      return null; // An error occured
    // Get the data
    if ($this->getRowData($this->mData,"item",false,$grouping)) {
      $this->dbSearchMeta("item",$id); // Get meta data for the item
      if (isset($this->mData) && $this->mData["nogroup"]) {
        // Organize group at top
        $idx = array_key_first($this->mData);
        $this->mData[$idx]["data"] = $this->mData[$idx];
        unset($this->mData[$idx]["+".$id]);
      }
      if (!$skipLinks)
        $this->dbSearchItemLists($id,$grouping,$groupId); // Get lists associated with the item
      $this->mNumResults = 1;
    }
    return $this->mData;
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
        if (isset($field) && $field != "")
          $si .= ", ".$this->mTableNameUserLink.".".$field;

    // Get parent name
    if ($this->hasParentId())
      $si .= ", tmp.".$this->mNameKey." AS parent_name";

    $si .= " ";
    return $si;
  } // findItemSelect

  protected function findItemLeftJoin($includeUser)
  {
    $lj = "";
    // Left join user table (if this is not a user table)
    if ($includeUser) {
      $user_id = ltrim(Parameters::get($this->mIdKey));
      $lj .= "LEFT JOIN ".$this->mTableNameUserLink." ".
             "ON "       .$this->mTableNameUserLink.".".$this->mIdKeyTable."='".$user_id."' ";
      $cur_uid = $this->mPermission["current_user_id"];
      if ($cur_uid || $cur_uid === 0)
        $lj .= "AND ".$this->mTableNameUserLink.".user_id='".$cur_uid."' ";
    }

    // Get parent name
    if ($this->hasParentId())
      $lj .= "LEFT JOIN ".$this->mTableName." tmp ".
             "ON "       .$this->mTableName.".parent_id=tmp.".$this->mIdKey." ";
    return $lj;
  } // findItemLeftJoin

  protected function findItemWhere($key,$val)
  {
    $where = "WHERE ".$this->mTableName.".".$key."='".mb_convert_encoding($val,"UTF-8","ISO-8859-1")."' ";
    return $where;
  } // findItemWhere

  //
  // Search for lists associated with the item
  //
  protected function dbSearchItemLists($id=null,$grouping=false,$groupId=null)
  {
    // If no link types found, return immediately
    if (!isset($this->mLinkTypes))
      return null;
    // Must have an id
    if (!isset($id) || $id == "") {
      $this->setError("No id while searching for linked lists. "); // TODO! i18n
      return null;
    }
    // Search through all registered link types/tables
    foreach ($this->mLinkTypes as $link_type)
      $this->dbSearchItemListOfType($id,$link_type,$grouping,$groupId);

    return $this->mData;
  } // dbSearchItemLists

  protected function dbSearchItemListOfType($id,$linkType,$grouping=false,$groupId=null)
  {
    $link_tablename = $this->findLinkTableName($linkType);
    if ($this->tableExists($link_tablename)) {
      $table = anyTableFactory::createClass($linkType,$this);
      //elog("created class ".$linkType);
      if ($table && ($table->mType != $this->mType || $this->hasParentId())) {
        $grouping = false; // Do not group
        if ($table->dbSearchList($id,$this->mType,$groupId,null,$grouping) == null)
          $this->mError .= $table->getError();
        if (!$table->mData)
          return null;
        $gidx  = isset($this->mData) ? array_key_first($this->mData) : "nogroup";
        $idx   = "+".$id;
        $lidx  = "link-".$linkType;
        $tgidx = $idx;
        if ($table->mType == "group" || (isset($id) && $id !== "" && $this->mType != "group"))
          $tgidx = $gidx;
        if (!isset($this->mData))                                     $this->mData                                     = array();
        if (!isset($this->mData[$gidx]))                              $this->mData[$gidx]                              = array();
        if (!isset($this->mData[$gidx]["data"]))                      $this->mData[$gidx]["data"]                      = array();
        if (!isset($this->mData[$gidx]["data"][$idx]))                $this->mData[$gidx]["data"][$idx]                = array();
        if (!isset($this->mData[$gidx]["data"][$idx]["data"]))        $this->mData[$gidx]["data"][$idx]["data"]        = array();
        if (!isset($this->mData[$gidx]["data"][$idx]["data"][$lidx])) $this->mData[$gidx]["data"][$idx]["data"][$lidx] = array();
        $this->mData[$gidx]["data"][$idx]["data"]["grouping"]        = true;  // Group different link types by default.
        $this->mData[$gidx]["data"][$idx]["data"][$lidx]["grouping"] = false; // The lists themselves are not grouped. TODO! Is this neccessary?
        $this->mData[$gidx]["data"][$idx]["data"][$lidx]["head"]     = $linkType;
        $this->mData[$gidx]["data"][$idx]["data"][$lidx]["data"]     = $table->mData;
        if ($table->mNameKey)
          $this->mData[$gidx]["data"][$idx]["data"][$lidx][$table->mNameKey] = $this->findDefaultItemListHeader($linkType);
        //console.log("item list ".$linkType.":"); console.log($this->mData);
        return $this->mData;
      } // if
    }
    return $this->mData;
} // dbSearchItemListOfType

  //////////////////////////////// List search ////////////////////////////////

  //
  // Search database for a list, including meta data.
  // Return data structure on success, null on error.
  //
  protected function dbSearchList($linkId=null,$linkType=null,$groupId=null,$groupType=null,$grouping=null,$simple=null)
  {
    if ($this->_initSearch() == -1)
      return null;

    if (!isset($groupId) || $groupId == "")
      $groupId = Parameters::get("group_id"); // If "groupId" is specified, we need only search in that group.
    if (!isset($groupType) || $groupType == "")
      $groupType = Parameters::get("group_type"); // If "groupType" is specified, search only for groups of that type
    if ($grouping === null)
      $grouping = Parameters::get("grouping");
    $grouping = $this->mType == "group"
                ? false
                : $grouping && $grouping !== "false" && $grouping !== "0";
    if ($simple === null)
      $simple = Parameters::get("simple"); // In a "simple" list search we get only the id, name and parent_id
    $simple = $simple === true || $simple === "true" || $simple   === "1";

    // Get group data, unless we are searching in a specific group
    $group_data = null;
    if ($grouping) {
      if (isset($this->mGroupTable))
        $group_data = $this->mGroupTable->mData; // We already have group data
      else
      if ($this->mType != "group" && $groupId != "nogroup") { // Read from group table
        // Get a "flat" group list, make it into a tree below
        $this->mGroupTable = anyTableFactory::createClass("group",$this);
        $group_data = isset($this->mGroupTable)
                      ? $this->mGroupTable->dbSearchGroupInfo($this->mType,$groupId,$this->mType == "group")
                      : null;
        if (!isset($group_data))
          $this->setError($this->mGroupTable->mError);
        else
        if ($this->mType != "group")
          $group_data = $group_data["nogroup"];
      }
    }

    // Build and execute the query
    $limit = !$simple ? $this->findLimit() : ""; // Use same limit for all groups
    $success = false;
    $this->mNumResults = 0; // Init total number of results

    // If a group id is given, query data from the given group only
    if ($groupId || $groupId === 0) {
      $success = $this->dbExecListStmt($groupType,$groupId,$linkType,$linkId,$grouping,$simple,$limit);
    }
    else
    // If a 'LIMIT' operator applies, we need to search for results for each group separately
    if ($limit) {
      // Build and execute the query for ungrouped data
      $success = $this->dbExecListStmt($groupType,"nogroup",$linkType,$linkId,$grouping,$simple,$limit) || $success;

      // Build and execute the query for grouped data
      if (isset($group_data)) {
        if ($this->tableExists($this->mTableNameGroupLink)) {
          foreach ($group_data as $gid => $group) {
            if ($gid != "nogroup" && isset($group) && isset($group["group_type"]) && ($group["group_type"] == $this->mType || $group["group_type"] == "group")) {
              $success = $this->dbExecListStmt($groupType,$gid,$linkType,$linkId,$grouping,$simple,$limit) || $success;
            }
          } // foreach
        } // if tableExists

        // Get grouped data that may have illegal group type (i.e. not same as list type).
        // Ideally this should not happen, but if it does, such data will not show up unless we do this.
        if ($linkId == "" && isset($this->mGroupTable) && isset($this->mGroupTable->mGroupIds)) {
          $linktable = $this->findLinkTableName("group");
          if ($this->tableExists($linktable)) {
            $linktable_id = $this->findLinkTableId("group");
            $stmt =  "SELECT DISTINCT ".$this->mTableName.".*  ".
                     "FROM ".$this->mTableName." ".
                     "LEFT JOIN ".$linktable." ON CAST(".$linktable.".".$this->mIdKey." AS INT)=CAST(".$this->mTableName.".".$this->mIdKeyTable." AS INT) ".
                     "WHERE (";
            $part_stmt = "";
            foreach ($this->mGroupTable->mGroupIds as $gid) {
              if ($gid != "nogroup") {
                $db_gid = is_numeric($gid) ? "CAST(".$gid." AS INT)" : "'".$gid."'";
                $part_stmt .= $linktable.".".$linktable_id." != ".$db_gid." AND ";
              }
            }
            $part_stmt = rtrim($part_stmt,"AND ");
            if ($part_stmt != "") {
              $part_stmt .= ") ";
              $stmt .= $part_stmt."ORDER BY ". $this->mTableName.".".$this->mIdKeyTable." ";
              //elog("dbSearchList:".$stmt);
              if (!(!$stmt || $stmt == "" || !$this->query($stmt) || $this->isError())) {
                // Get the data
                $xdata = null;
                $ok = $this->getRowData($xdata,"list",$simple);
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
      } // if group_data
    } // if limit
    // Query data from all groups
    else {
      $success = $this->dbExecListStmt($groupType,null,$linkType,$linkId,$grouping,$simple,$limit);
    }

    if (!$success)
      return null;

    // Search and get the meta data
    if (!$simple)
      $this->dbSearchMeta("list",null,$linkType,$linkId);

    // Sort the list
    if ($this->mSortFunction)
      call_user_func($this->mSortFunction);

    // Get the grouped group tree
    if (!$this->mGroupTable)
      $this->mGroupTable = $this;
    if ($this->mType != "group") // TODO! Should not be neccessary, we already have the group data
      $group_data = isset($this->mGroupTable)
                    ? $this->mGroupTable->dbSearchGroupInfo($this->mType,$groupId,true)
                    : null;

    // Group the data and build the data tree
    if (!$group_data)
      if ($this->mType == "group")
        $group_data = $this->mData;
      else
        $group_data = array();
    if ($grouping || $this->mType == "group") {
      if ($this->mType == "group")
        $group_data = $this->mGroupTable->buildDataTree($group_data["nogroup"]);
      else
        $group_data = $this->mGroupTable->buildDataTree($group_data);
      $this->buildGroupTreeAndAttach($group_data,$linkId,$grouping);
    }
    else
    if (!$grouping) {
      $gtype = null;
      if ($this->mHostTable &&
          isset($this->mHostTable->mData) &&
          isset($this->mHostTable->mData["nogroup"]) &&
          isset($this->mHostTable->mData["nogroup"]["data"]) &&
          isset($this->mHostTable->mData["nogroup"]["data"]["+".$linkId]) &&
          isset($this->mHostTable->mData["nogroup"]["data"]["+".$linkId]["group_type"]))
        $gtype = $this->mHostTable->mData["nogroup"]["data"]["+".$linkId]["group_type"];
      if (isset($gtype) && $gtype != "" && $gtype != $this->mType) {
        // We have an item in an illegal group. Ignore it, but log a warning.
        $this->mData = null;
        $gn = $this->mHostTable->mData["nogroup"]["data"]["+".$linkId]["group_name"];
        $err = "Warning: One or more items of type ".$this->mType." is in ".$gtype." group '".$gn."' with id ".$linkId; // TODO i18n
        $this->setMessage($err);
        error_log($err);
      }
      else
      if ($linkType != "group") {
        if (isset($this->mData) && isset($this->mData["nogroup"]))
          $this->mData = $this->mData["nogroup"];
      }
      else {
        if (isset($this->mData) && isset($this->mData[$linkId]))
          $this->mData = $this->mData[$linkId];
      }
    }
    //vlog("dbSearchList, tree list data:",$this->mData);

    return $this->mData;
  } // dbSearchList

  private function dbExecListStmt($groupType=null,$groupId=null,$linkType=null,$linkId=null,$grouping=true,$simple=false,$limit="")
  {
    // Build and execute the query for a group
    $partial_stmt = $this->dbPrepareSearchListStmt($groupType,$groupId,$linkType,$linkId,$grouping,$limit);
    $stmt = $partial_stmt.$limit;
    //elog("dbExecListStmt1:".$stmt);
    if (!$this->query($stmt))
      return false; // Something went wrong
    // Get the data
    $success = $this->getRowData($this->mData,"list",$simple,$grouping);
    $group_idx = isInteger($groupId) ? intval($groupId) : $groupId;
    if ((!$group_idx && $group_idx !== 0) || $group_idx == "")
      $group_idx = "nogroup";
    if ($limit != "") {
      // Count how many rows would have been returned without LIMIT
      $part_stmt = $this->dbPrepareSearchListStmt(null,$groupId,$linkType,$linkId,$grouping,$limit);
      $count_stmt = "SELECT count(*) AS num_results FROM (".
                    $part_stmt.
                    ") AS dummy";
      //elog("dbExecListStmt2:".$count_stmt);
      if (!$this->query($count_stmt))
        return false; // An error occured
      $row = $this->getNext(true);
      if ($row && isset($row["num_results"]) && $row["num_results"] != "" && $row["num_results"] != "0") {
        $this->mData[$group_idx]["grouping_num_results"] = intval($row["num_results"]);
        $this->mNumResults += intval($row["num_results"]);
      }
    } // if
    else {
      // Report back number of elements in groups
      if ($this->mData && array_key_exists($group_idx,$this->mData)) {
        $n = sizeof($this->mData[$group_idx]);
        $this->mData[$group_idx]["grouping_num_results"] = $n;
        $this->mNumResults += $n;
      }
    }
    return $success;
  } // dbExecListStmt

  // Get query fragments and build the query
  protected function dbPrepareSearchListStmt($groupType=null,$groupId=null,$linkType=null,$linkId=null,$grouping=true,$limit="",$search_term="")
  {
    if (!$groupType)
      $groupType    = Parameters::get("group_type");
    if (!$search_term || $search_term == "")
      $search_term  = Parameters::get("term");
    $linktable_name = $this->findLinkTableName($linkType);
    $has_linktable  = $this->tableExists($linktable_name);
    $select         = $this->findListSelect  ($groupId,$linkType,$linkId,$grouping,$linktable_name,$has_linktable);
    $left_join      = $this->findListLeftJoin($groupId,$linkType,$linkId,$grouping,$linktable_name,$has_linktable);
    $where          = $this->findListWhere   ($groupType,$groupId,$linkType,$linkId,$grouping,$linktable_name,$has_linktable,$search_term);
    $order_by       = $this->findListOrderBy ();

    $stmt = $select.
            "FROM ".$this->mTableName." ".
            $left_join.
            $where.
            $order_by;
    return $stmt;
  } // dbPrepareSearchListStmt

  protected function findListSelect($groupId,$linkType=null,$linkId=null,$grouping=true,$linktable_name="",$has_linktable=false)
  {
    // Select from own table
    $sl = "SELECT DISTINCT ".$this->mTableName.".* ";

    // Select from link table
    if (($linkId || $linkId === 0) && isset($linkType) && $linkType != "" &&
        isset($this->mTableFieldsLeftJoin) && isset($this->mTableFieldsLeftJoin[$linkType])) {
      $linktable_name = $this->findLinkTableName($linkType);
      if ($has_linktable) {
        foreach ($this->mTableFieldsLeftJoin[$linkType] as $field) {
          if (isset($field) && $field != "")
            $sl .= ", ".$linktable_name.".".$field;
        }
        if ($this->hasParentId())
          $sl .= ", tmp.".$this->mNameKey." AS parent_name ";
      }
    }
    // Select from group table
    $linktable_name_grp = $this->findLinkTableName("group");
    $has_linktable_grp  = $this->tableExists($linktable_name_grp);
    if ($grouping && $this->mType != "group" && $groupId != "nogroup" &&
        $has_linktable_grp && isset($this->mGroupTable) && isset($this->mGroupTable->mTableFields)) {
      $has_grouptable = $this->tableExists($this->mTableNameGroup);
      if ($has_grouptable) {
        foreach ($this->mGroupTable->mTableFields as $field) { // TODO! Is it neccessary to select all fields when this.type != group?
          if (isset($field) && $field != "" && $field != "parent_id") // To avoid conflict with the current tables parent_id
            $sl .= ", ".$this->mTableNameGroup.".".$field;
        }
      }
    }
    $sl .= " ";
    return $sl;
  } // findListSelect

  protected function findListLeftJoin($groupId,$linkType=null,$linkId=null,$grouping=true,$linktable_name="",$has_linktable=false)
  {
    $cur_uid = $this->mPermission["current_user_id"];
    $lj = "";

    // Left join own table to get parent name
    if ($this->hasParentId())
      $lj .= "LEFT JOIN ".$this->mTableName." tmp ON ".$this->mTableName.".parent_id=tmp.".$this->mIdKey." ";

    // Left join link table
    if (($linkId || $linkId === 0) && isset($linkType) && $linkType != "" && $linkType != $this->mType)
      $lj .= $this->findListLeftJoinOne($cur_uid,$groupId,$linkType,$linkId,$grouping,$linktable_name,$has_linktable);

    // Left join group table
    if ($grouping && $this->mType != "group" && isset($this->mGroupTable)) {
      $linktable_name_grp = $this->findLinkTableName("group");
      $has_linktable_grp  = $this->tableExists($linktable_name_grp);
      $lj .= $this->findListLeftJoinOne($cur_uid,$groupId,"group",$linkId,$grouping,$linktable_name_grp,$has_linktable_grp);
    }
    return $lj;
  } // findListLeftJoin

  protected function findListLeftJoinOne($cur_uid,$groupId,$linkType=null,$linkId=null,$grouping=true,$linktable_name="",$has_linktable=false)
  {
    $typetable_name = $this->findTypeTableName($linkType);
    $typetable_id   = $this->findTypeTableId($linkType);
    $has_typetable  = $this->tableExists($typetable_name);
    $linktable_id   = $this->findLinkTableId($linkType);

    $lj = "";
    if ($has_linktable) {
      $lj .= "LEFT JOIN ".$linktable_name." ON CAST(".$linktable_name.".".$this->mIdKey." AS INT)=CAST(".$this->mTableName.".".$this->mIdKeyTable." AS INT) ";

      // Also left join on parent id:
      if ($this->hasParentId() && $linkId == null)
        $lj .= "OR ".$linktable_name.".".$this->mIdKeyTable."=tmp.".$this->mIdKeyTable." ";

      // Only return results for current user:
      if (!isset($linkType) || $linkType == "user" && $cur_uid)
        $lj .= "AND CAST(".$linktable_name.".".$linktable_id." AS INT)=CAST(".$cur_uid." AS INT) ";

      if ($has_typetable) {
        if ($linkType != "group")
          $lj .= "LEFT JOIN ".$typetable_name." ON CAST(".$linktable_name.".".$linktable_id." AS INT)=CAST(".$typetable_name.".".$typetable_id." AS INT) ";
      }
    }
    $db_gid = !$groupId && $groupId !== 0 // No gid specified
              ? ($has_linktable
                 ? "CAST(".$linktable_name.".".$linktable_id." AS INT) "
                 : null
                )
              : (is_numeric($groupId) // Only left join with specified group
                ? "CAST(".$groupId." AS INT) "
                : "'".$groupId."' "
                );
    $has_grouptable = $this->tableExists($this->mTableNameGroup) && isset($this->mGroupTable);
    if ($db_gid && $has_grouptable && $has_typetable && $typetable_name == $this->mTableNameGroup && $this->mType != "group") {
      $lj .= "LEFT JOIN ".$typetable_name." ON CAST(".$typetable_name.".".$typetable_id." AS INT)=".$db_gid." ";
      $lj .= "AND ".$this->mTableNameGroup.".group_type='".$this->mType."' ";
    }
    return $lj;
  } // findListLeftJoinOne

  protected function findListWhere($groupType=null,$groupId=null,$linkType=null,$linkId=null,$grouping=true,$linktable_name="",$has_linktable=false,$searchTerm="")
  {
    $where = "";

    // Match with linktable
    if (isset($linkType) && $linkType != "" && $linkType != $this->mType && ($linkId || $linkId === 0) && $linkId != "nogroup") {
      if ($has_linktable) {
        $db_lid = $linkType == "group" ? "'".$linkId."'" : intval($linkId);
        $where_id = $linktable_name.".".$linkType."_id=".$db_lid." "; // TODO! semi-hardcoded name of link table id
        $where .= "WHERE ".$where_id;
      }
    }

    $has_grouptable      = $this->tableExists($this->mTableNameGroup) && isset($this->mGroupTable);
    $has_group_linktable = $this->tableExists($this->mTableNameGroupLink);

    // If has parent_id while being a list-for list
    if ($this->hasParentId() && (isset($linkType) && $linkType != "" || (($linkId && $linkId !== 0)))) {
      if (($linkId && $linkId !== 0) && is_numeric($linkId) && (!isset($linkType) || $linkType == "" || $linkType == $this->mType)) {
        $gstr = $this->mTableName.".".$this->mIdKeyTable." IN ( ".
                "SELECT ".$this->mTableName.".".$this->mIdKeyTable." ".
                "FROM (SELECT @pv := '".$linkId."') ".
                "INITIALISATION WHERE find_in_set(".$this->mTableName.".parent_id, @pv) > 0 ".
                "AND   @pv := concat(@pv, ',', "   .$this->mTableName.".".$this->mIdKeyTable.") ".
                ") ";
        if ($where === "")
          $where  = "WHERE (".$gstr.") ";
        else
          $where .= " OR (".$gstr.") ";
        if ($grouping && ($groupId || $groupId === 0) && $has_group_linktable) {
          $db_gid = is_numeric($groupId) ? "CAST(".$groupId." AS INT)" : "'".$groupId."'";
          $where .= "AND ".$this->mTableNameGroupLink.".group_id=".$db_gid." ";
        }
      }
    }

    // TODO! What's this for?
    if ($linkType == $this->mType && $linkId != "nogroup") {
      $db_id = $this->mType == "group" ? "'".$linkId."'" : $linkId;
      $skip_str = $this->mTableName.".".$this->mIdKeyTable." != ".$db_id."";
      if ($where === "")
        $where  = "WHERE (".$skip_str.") ";
      else
        $where .= " AND (".$skip_str.") ";
    }

    // Match with group table
    if ($grouping) {
      if ($groupId == "nogroup" && $has_group_linktable) {
        // Search items not belonging to any group
        $ng_str = $this->mTableNameGroupLink.".".$this->mIdKey." IS NULL ";
        if ($where === "")
          $where  = " WHERE ".$ng_str;
        else
          $where .= " AND ".$ng_str;
      }
      else
      if ($this->mType != "group" && ($groupId || $groupId === 0) && $has_grouptable && isset($this->mGroupTable)) {
        // Search items belonging to a group
        if ($groupType) {
          $gt_str = $this->mTableNameGroup.".group_type='".$groupType."' ";
          if ($where === "")
            $where  = " WHERE ".$gt_str;
          else
            $where .= " AND ".$gt_str;
        }
        if ($has_group_linktable && !isset($linkType) && $linkType !== "") {
          $db_gid = is_numeric($groupId) ? "CAST(".$groupId." AS INT)" : "'".$groupId."'";
          $lf_str = $this->mTableNameGroup.".group_id=".$db_gid." ";
          if ($where === "")
            $where  = " WHERE ".$lf_str;
          else
            $where .= " AND ".$lf_str;
          $where .= "AND ".$this->mTableNameGroupLink.".group_id=".$db_gid." ";
        }
      }
    } // if grouping
    else
    if ($this->mType == "group" && $groupType) {
      $gt_str = $this->mTableNameGroup.".group_type='".$groupType."' ";
      if ($where === "")
        $where  = " WHERE ".$gt_str;
      else
        $where .= " AND ".$gt_str;
    }

    // Match search term
    if ($searchTerm) {
      $term_str = $this->mTableName.".".$this->mNameKey." LIKE '%".$searchTerm."%' ";
      if ($where === "")
        $where  = "WHERE (".$term_str.") ";
      else
        $where .= " AND (".$term_str.") ";
    }
    return $where;
  } // findListWhere

  protected function findListOrderBy()
  {
    $orderBy = ltrim(Parameters::get("order"));
    if (!$orderBy)
      $orderBy = $this->mOrderBy;
    if (!in_array($orderBy,$this->mTableFields))
      $orderBy = $this->mTableFields[0];
    if (!$orderBy)
      return "";
    $dir = ltrim(Parameters::get("dir"));
    if (!$dir)
      $dir = $this->mOrderDir;
    $ob = "ORDER BY ".$this->mTableName.".".$orderBy." ".$dir." ";
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
  protected function dbSearchMeta($mode,$id=null,$linkType=null,$linkId=null,$grouping=true)
  {
    if (!$this->tableExists($this->mTableNameMeta)) {
      //$this->mMessage .= "No meta table for '$this->mType' type. ";
      return null;
    }
    $link_tablename = $this->findLinkTableName($linkType);
    $meta_id = Parameters::get($this->mIdKeyMetaTable);
    $is_list = (!isset($id) || $id == "");
    $link_id_name = isset($this->mHostTable) ? $this->mHostTable->mIdKey : null;
    $where   = $is_list && isset($link_tablename) && $link_tablename != "" && isset($link_id_name) && $link_id_name != ""
               ? "WHERE ".$link_tablename.".".$link_id_name."='".$linkId."' "
               : "";
    $has_grp_lnk     = $this->tableExists($this->mTableNameGroupLink);
    $group_select    = $has_grp_lnk ? ",".$this->mTableNameGroupLink.".group_id " : "";
    $group_left_join = $has_grp_lnk ? "LEFT JOIN ".$this->mTableNameGroupLink." ".
                                      "ON ".$this->mTableNameGroupLink.".".$this->mIdKeyMetaTable."=".$this->mTableNameMeta.".".$this->mIdKeyMetaTable." "
                                    : "";
    $left_join = $link_tablename !== null && $link_tablename != $this->mTableNameGroupLink
                 ? "LEFT JOIN ".$link_tablename." ".
                   "ON ".$link_tablename.".".$this->mIdKeyMetaTable."=".$this->mTableNameMeta.".".$this->mIdKeyMetaTable." "
                 : "";
    $stmt = "SELECT DISTINCT ".$this->mTableNameMeta.".* ".
            $group_select.
            "FROM ".$this->mTableNameMeta." ".
            $group_left_join.
            $left_join.
            $where;
    //elog("dbSearchMeta:".$stmt);
    if (!$this->query($stmt))
      return null;

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
    $this->mMaxId = -1;

  //$stmt = "SELECT MAX(".$this->mIdKeyTable.") FROM ".$this->mTableName;
    $stmt = "SELECT AUTO_INCREMENT FROM information_schema.tables ".
            "WHERE table_name = '".$this->mTableName."' ".
            "AND table_schema = DATABASE( )";
    if (!$this->query($stmt))
      return null;
    $nextrow = $this->getNext(true);
    $this->mMaxId = $nextrow && isset($nextrow["AUTO_INCREMENT"]) && $nextrow["AUTO_INCREMENT"] != ""
                    ? $nextrow["AUTO_INCREMENT"]
                    : -1;
    //elog("dbSearchMaxId,mMaxId:".$this->mMaxId);
    if ($this->mMaxId == -1)
      $this->setError("Max id not found, AUTO_INCREMENT missing from table? "); // TODO! i18n
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
    if ($this->dbSearchList() == null)
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
      foreach ($this->mData as $groupId => $group) {
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

  protected function dbSearchNameExists()
  {
    // TODO! Not implemented
  } // dbSearchNameExists
/*
  protected function dbSearchIdExists()
  {
    // TODO! Not implemented
  } // dbSearchIdExists
*/
  // Check if item exists
  protected function dbItemExists($id)
  {
    $stmt = "SELECT * FROM " . $this->mTableName . " WHERE " . $this->mIdKeyTable . "=" . $id;
    //elog("dbItemExists,stmt:".$stmt);
    if (!$this->query($stmt))
      return false;
    return ($this->getNext(true) !== null);
  } // dbItemExists


  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Data retrieval //////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  //
  // Get the data from query result (rows) to data array. If data is to be grouped, the first index
  // is the group_id, otherwise it is "nogroup". The second index is the id of the data element, as
  // specified by this.idKey. If the data element does not contain an id or has an illegal id, it is
  // silently ignored.
  //
  protected function getRowData(&$data,$mode,$simple=false,$grouping=true)
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
      $gidx = $grouping && !$simple && $this->mType != "group" && isset($nextrow["group_id"]) && $nextrow["group_id"] != ""
              ? $nextrow["group_id"]
              : "nogroup";
      $idx  = isset($nextrow[$this->mIdKeyTable]) && $nextrow[$this->mIdKeyTable] != ""
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
        foreach ($this->mLinkTypes as $link_type) {
          if (isset($link_type) && $link_type != "" && isset($this->mTableFieldsLeftJoin[$link_type])) {
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
    if (isset($nextrow[$tablefield]) && $nextrow[$tablefield] != "") {
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
      if (!isset($nextrow[$this->mIdKeyMetaTable]) || $nextrow[$this->mIdKeyMetaTable] == "")
        continue;
      $gidx = $grouping && $this->mType != "group" && isset($nextrow["group_id"]) && $nextrow["group_id"] != ""
              ? $nextrow["group_id"]
              : "nogroup";
      $idx  = isset($nextrow[$this->mIdKeyMetaTable]) && $nextrow[$this->mIdKeyMetaTable] != ""
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
  protected function buildGroupTreeAndAttach($group_data,$linkId=null,$grouping=true)
  {
    if (!$this->mData || empty($this->mData))
      return;
    $this->mRecurseDepth = 0;

    // Make sure parent/child items are present in all groups where parent exists
    //vlog("buildGroupTreeAndAttach,data before copying parent/child:",$this->mData);
    foreach ($this->mData as $gidx => $grp) {
      if (isset($grp)) {
        foreach ($grp as $idx => $item) {
          if (isset($item) && isset($item["parent_id"]) && $item["parent_id"] != "") {
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
              } // if grp2
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
      if (isset($grp) && strpos($gidx,"grouping") !== 0) {
        $ngidx = isInteger($gidx) ? "+".$gidx : $gidx;
        if (!isset($data_tree[$ngidx]))
          $data_tree[$ngidx] = array();
        if (($grouping || $this->mType == "group") && $this->mHostTable == null && isset($this->mData[$gidx])) { // Add a head data layer
          $data_tree[$ngidx]["head"]       = "group";
          $data_tree[$ngidx]["group_type"] = $this->mType;
          $data_tree[$ngidx]["group_id"]   = $ngidx;
          $gname = null;
          if ($linkId || $linkId === 0) {
            $gname = isset($group_data) && isset($group_data[$ngidx]) && isset($group_data[$ngidx]["group_name"])
                     ? $group_data[$ngidx]["group_name"]
                     : ucfirst($data_tree[$ngidx]["group_type"])." groups"; // TODO i18n
            if (!isset($gname) || $gname == "")
              $gname = $this->findDefaultHeader($this->mType);
          } // if linkId
          else {
            $idx = isset($this->mData[$gidx]["data"]) && isset($this->mData[$gidx]["data"][$linkId])
                   ? $linkId
                   : "+".$linkId;
            if (isset($this->mData[$gidx]["data"]) && isset($this->mData[$gidx]["data"][$idx]))
              $gname = $this->mData[$gidx]["data"][$idx][$this->mNameKey];
          }
          $data_tree[$ngidx]["group_name"] = isset($gname)
                                             ? $gname
                                             : ($this->mType != "group"
                                               ? "Unknown group" // TODO! i18n
                                               : null);
        } // if grouping
        if (!isset($data_tree[$ngidx]["data"]))
          $data_tree[$ngidx]["data"] = $this->buildDataTree($this->mData[$gidx],null);

        // Preserve "grouping_num_results" value
        if (isset($this->mData[$gidx]) && isset($this->mData[$gidx]["grouping_num_results"]) && $this->mData[$gidx]["grouping_num_results"] != "")
          $data_tree[$ngidx]["data"]["grouping_num_results"] = $this->mData[$gidx]["grouping_num_results"];
        if ($data_tree[$ngidx]["data"] === null)
          unset($data_tree[$ngidx]["data"]);
      }
    } // foreach
    //vlog("buildGroupTreeAndAttach,data_tree1:",$data_tree);
    //
    // If grouping is specified, build group tree and stick data tree to it
    //
    if ($grouping && (!$linkId && $linkId !== 0 || $linkId == "")) {
      if (!isset($data_tree["unknown"]))
        $data_tree["unknown"] = null;
      if (isset($data_tree["unknown"])) {
        $group_data["unknown"] = null;
        $group_data["unknown"]["group_id"]   = "unknown";
        $group_data["unknown"]["group_name"] = "Unknown"; // TODO! i18n
        $group_data["unknown"]["group_description"] = ucfirst($this->mType)."s belonging to non-".$this->mType." group&nbsp;&nbsp;".
                                                      '<i style="color:red" class="fa fad fa-exclamation-triangle"></i>'; // TODO! i18n and CSS
      }
      if (!isset($group_data))
        $group_data = array();
      $this->dbAttachToGroups($group_data,$data_tree,$this->mType);
      $group_data["grouping"] = true;
      //vlog("buildGroupTreeAndAttach,group_data:",$group_data);
      if (count($group_data) > 1)
        $this->mData = $group_data;
      else {
        $this->mData = $data_tree;
        if ($this->mData["unknown"] == null)
          unset($this->mData["unknown"]);
      }
    }
    else {
      if ($linkId || $linkId === 0)
        $this->mData = isset($data_tree[$this->mType]) && isset($data_tree[$this->mType]["data"])
                       ? $data_tree[$this->mType]["data"]
                       : $data_tree;
      else
        $this->mData = $data_tree;
    }
    //vlog("buildGroupTreeAndAttach,data after building tree:",$this->mData);
  } // buildGroupTreeAndAttach

  // Overridden in group table
  protected function dbSearchGroupInfo($type=null,$group_id=null,$grouping=true)
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
      if (isset($subdata) && is_array($subdata) && strpos($idx,"grouping") !== 0) {
        $parent_not_in_group = isset($subdata["parent_id"]) && $subdata["parent_id"] != "" &&
                               !isset($flatdata[$subdata["parent_id"]]) && !isset($flatdata["+".$subdata["parent_id"]]);
        $pid = null;
        if ($parent_not_in_group) {
          $pid = $subdata["parent_id"];
          unset($subdata["parent_id"]);
        }
        if (!isset($subdata["parent_id"]) || $subdata["parent_id"] == "")
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
        if (isset($group)) {
          if (isset($group["data"]))
            $this->dbAttachToGroups($group["data"],$data_tree,$type); // Recursive call
          if ($type != "group" || isset($group["data"])) {
            $group["head"] = "group";
            if ($type != "group") {
              if (isset($group["list"])) unset($group["list"]);
              if (isset($group["item"])) unset($group["item"]);
            }
          }
          $idx = null;
          if (isset($data_tree[$gid]))
            $idx = $gid;
          else
          if (isset($data_tree["+".$gid]))
            $idx = "+".$gid;
          if (isset($idx)) {
              $group["head"] = "group";
              if ($type != "group") {
                if (isset($group["list"])) unset($group["list"]);
                if (isset($group["item"])) unset($group["item"]);
              }
              if (array_key_exists("data",$group) && !isset($group["data"]))
                $group["data"] = array();
              if (isset($data_tree[$idx])) {
                foreach ($data_tree[$idx]["data"] as $id => $obj)
                  $group["data"][$id] = $data_tree[$idx]["data"][$id];
              }
          } // if idx
        } // if group
      } // foreach
    } // if
  } // dbAttachToGroups

  /**
   * Prepare data related to a list or a single item.  Adds a default top header.
   */
  public function prepareData($id=null)
  {
    //vlog("data before prepare:",$this->mData);
    // Make room for a top level header
    $topidx = "+0";
    if (($id || $id === 0) && $id != "")
      $topidx = "+".$id;
    $data = array("data" => array($topidx => array()));

    // Set header and "head"
    $hdr = $this->findHeader($this->mType,$this->mData,$id);
    if (isset($hdr) && $hdr != "") {
      $data["data"][$topidx]["head"] = $this->mType;
      $data["data"][$topidx][$this->mNameKey] = $hdr;
    }

    // Set data
    if (isset($this->mData)) {
      if (($id || $id === 0) && $id != "") {
        $gidx = array_key_first($this->mData);
        $data["data"][$topidx]["data"] = $this->mData[$gidx]["data"];
      }
      else
        $data["data"][$topidx]["data"] = $this->mData;
    }
    else
        $data["data"][$topidx]["data"] = null;

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
   * Also sets last_insert_id if a the new id was auto-created by the database.
   *
   * @return array|null Data object on success, null on error
   */
  public function dbInsert()
  {
    // Initialize
    $this->initFieldsFromParam();
    if (!isset($this->mTableFields))
      return null;

    // Validate
    if (!$this->dbValidateInsert())
      return null;

    // Insert in normal table
    $stmt = $this->dbPrepareInsertStmt();
    if (!$stmt)
      return null;
    if (!$this->query($stmt))
      return null;
    // Number of rows changed == 1 if the insert succeeded
    if ($this->getNumRowsChanged() === 0) {
      $this->setMessage($this->mInsertNothingToDo);
      return $this->mData;
    }
    // An id will have been auto-created if the insert succeeded
    $this->last_insert_id = $this->getLastInsertID($this->mTableName);

    // Insert in meta table
    $this->dbMetaInsertOrUpdate($this->last_insert_id);

    // Insert in group table
    $group_id = Parameters::get("group_id");
    if (($group_id || $group_id === 0) && $group_id != "" && $group_id != "nogroup" && $this->mType != "group") {
      if ($this->tableExists($this->mTableNameGroupLink)) {
        $stmt = "INSERT INTO " . $this->mTableNameGroupLink . " (group_id," . $this->mType . "_id) " .
                "VALUES ('" . $group_id . "','" . $this->last_insert_id . "')";
        //error_log("stmt:".$stmt);
        if (!$this->query($stmt)) {
          $this->setError("Error while inserting into group table. "); // TODO i18n
          error_log($his->mError);
          return $this->mData;
        }
      }
    }
    // Insert in link table
    $link_id = Parameters::get("link_id");
    if (($link_id || $link_id === 0) && $link_id != "") {
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

    if ($this->mError != "")
      return false;
    return true;
  } // dbValidateInsert

  protected function dbPrepareInsertStmt()
  {
    $stmt = "INSERT IGNORE INTO " . $this->mTableName . " (";
    $unique_table_fields = array_unique($this->mTableFields);
    $auto_id = Parameters::get("auto_id");
    $at_least_one = false;
    $has_id       = $auto_id || $auto_id === 0 && $auto_id != "false";
    if ($has_id) {
      $stmt .= $this->mIdKey . ",";
      $at_least_one = true;
    }
    foreach ($unique_table_fields as $key) {
      if ($key == $this->mIdKeyTable && $has_id || $key == "is_new") // Do not update the id key field, unless told to do so
        continue;
      $val = Parameters::get($key);
      $val = htmlentities((string)$val,ENT_QUOTES,'utf-8',FALSE);
      if ($val || $val === 0 || $val === "") { // Only allow values that are set (or blank)
        $stmt .= $key . ",";
        $at_least_one = true;
      }
      if ($has_id && $key == $this->mIdKeyTable) {
        // Check if item with this id already exists
        $res = $this->dbItemExists($val);
        if ($res) {
          $this->mError = $this->mType+" "+$auto_id+": "+$this->mItemExists;
          return null;
        }
      }
    } // foreach
    if (!$at_least_one) {
      $this->setMessage($this->mInsertNothingToDo);
      return null;
    }
    $stmt[strlen($stmt)-1] = " "; // Replace last "," with " "
    $stmt .= ") VALUES (";
    if ($has_id)
      $stmt .= $auto_id . ",";
    foreach ($unique_table_fields as $key) {
      if ($key == $this->mIdKeyTable && $has_id || $key == "is_new") // Do not update the id key field, unless told to do so
        continue;
      $val = Parameters::get($key);
      $val = htmlentities((string)$val,ENT_QUOTES,'utf-8',FALSE);
      if ($val || $val === 0 || $val === "") { // Only allow values that are set (or blank)
        $val = htmlentities((string)$val,ENT_QUOTES,'utf-8',FALSE);
        $stmt .= "'" . $val . "',";
      }
    }
    $stmt[strlen($stmt)-1] = " "; // Replace last "," with " "
    $stmt .= ")";
    $stmt = trim(preg_replace("/\s+/", " ", $stmt)); // Remove all newlines
    //elog("dbPrepareInsertStmt:".$stmt);
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
    // Initialize
    $this->initFieldsFromParam();
    if (!isset($this->mTableFields))
      return null;

    // Validate
    if (!$this->dbValidateUpdate())
      return null;

    $id = ltrim(Parameters::get($this->mIdKey));

    // If no id, assume it is a new item
    if ((!$id && $id !== 0) || $id == "")
      return $this->dbInsert();

    // Add or remove to/from list
    if (Parameters::get("add") || Parameters::get("rem"))
      return $this->dbUpdateLinkList();

    // Change a link TODO! Not tested
    if (Parameters::get("cha"))
      return $this->dbUpdateLink();

    // Update normal table
    $stmt = $this->dbPrepareUpdateStmt($id);
    if ($this->isError())
      return null;
    if ($stmt) { // May be null if we only update meta fields or link fields for item lists
      if (!$this->query($stmt))
        return null;
    }
    $nrc = $this->getNumRowsChanged();

    // Update meta table
    $this->dbMetaInsertOrUpdate($id);

    // Update link table(s) if any of the link fields (left join fields) are changed
    $link_id = Parameters::get("link_id");
    if (Parameters::get("link_type") && ($link_id || $link_id === 0))
      $this->dbUpdateLink();

    // Set result message
    if ($nrc === 0) {
      $this->setMessage($this->mUpdateNothingToDo);
      return $this->mData;
    }
    $this->setMessage($this->mUpdateSuccessMsg);

    // Call success handler
    if (method_exists($this,"dbUpdateSuccess"))
      $this->dbUpdateSuccess();

    return $this->mData;
  } // dbUpdate

  protected function dbValidateUpdate($id=null)
  {
    $this->mError = "";

    if ($this->mError != "")
      return false;
    return true;
  } // dbValidateUpdate

  protected function dbPrepareUpdateStmt($id)
  {
    if (!$this->dbItemExists($id)) {
      $this->mError = $this->mType+" "+$id+": "+$this->mItemUnexists;
      return null;
    }
    $stmt = "UPDATE " . $this->mTableName . " SET ";
    $unique_table_fields = array_unique($this->mTableFields);
    $at_least_one = false;
    $to_set = "";
    foreach ($unique_table_fields as $key) {
      if ($key == $this->mIdKeyTable || $key == "is_new") // Do not update the id key field, unless told to do so
        continue;
      $val = Parameters::get($key);
      if ($val !== null)
        $val = htmlentities((string)$val,ENT_QUOTES,'utf-8',FALSE);
      if ($val || $val === 0 || $val === "0" || $val === "") { // Only allow values that are set (or blank)
        $to_set .= $this->dbPrepareUpdateStmtKeyVal($key,$val);
        $at_least_one = true;
      }
    }
    if ($to_set == "")
      return null;
    $idval = $this->mType == "group" ? $id : intval($id);
    $to_set[strlen($to_set)-1] = " "; // Replace last "," with " "
    $stmt .= $to_set . " WHERE " . $this->mIdKeyTable . "='" . $idval . "' ";
    $stmt = trim(preg_replace("/\s+/", " ", $stmt)); // Remove all newlines
    if (!$at_least_one) {
      $this->setMessage($this->mUpdateNothingToDo);
      return null;
    }
    //elog("dbPrepareUpdateStmt:".$stmt);
    return $stmt;
  } // dbPrepareUpdateStmt

  protected function dbPrepareUpdateStmtKeyVal($key,$val)
  {
    if (!$val && $val !== 0 && $val != "0")
      return $key . "=NULL,";
    return $key . "='" . $val . "',";
  } // dbPrepareUpdateStmtKeyVal

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


  /**
   * Add or remove a link
   *
   * link_type:
   * id:
   * add:
   * rem:
   *
   * @return
   */
  public function dbUpdateLinkList()
  {
    // Validate
    if (!$this->dbValidateUpdateLinkList())
      return null;

    $link_type   = Parameters::get("link_type");
    $id_key_link = $link_type."_id"; // TODO! Not general enough
    $id          = Parameters::get($this->mIdKey);
    $inslist     = explode(",",Parameters::get("add"));
    $dellist     = explode(",",Parameters::get("rem"));

    if ($link_type != $this->mType) {
      // Link with different type (sublist of item)
      $link_tablename = $this->findLinkTableName($link_type);
      if (!$link_tablename || $link_tablename == "") {
        $this->setError("Link table not found. ",true); // TODO! i18n
        return null;
      }
      if ($dellist) {
        // Remove elements from the item's list
        foreach ($dellist as $delval) {
          if ($delval) {
            $stmt = "DELETE FROM " . $link_tablename . " " .
                    "WHERE " .
                    $id_key_link   . "='" . $delval . "' " .
                    "AND " .
                    $this->mIdKey  . "='" . $id . "'";
            //elog("dbUpdateLinkList(1):".$stmt);
            if (!$this->query($stmt))
              return null; // TODO! Give warning and continue instead?
          }
        } // foreach
      }
      if ($inslist) {
        // Add elements to the item's list
        foreach ($inslist as $insval) {
          if ($insval) {
            // Check if element already exists in list
            if (!$this->dbTableHasLink($link_tablename,$id_key_link,$insval,$this->mIdKey,$id)) {
              // Link does not exist, we can add it
              $stmt = "INSERT INTO " . $link_tablename . " (" .
                      $id_key_link . "," . $this->mIdKey .
                      ") VALUES (" .
                      $insval . "," . $id .
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
        if ($dellist) {
          // Remove parent for elements in dellist
          foreach ($dellist as $delval) {
            if ($delval) {
              $stmt = "UPDATE " . $this->mTableName . " " .
                      "SET parent_id=NULL " .
                      "WHERE " . $this->mIdKey . "='" . $delval . "'";
              //elog("dbUpdateLinkList(4):".$stmt);
              if (!$this->query($stmt))
                return null;
            }
          } // foreach
        }
        if ($inslist !== null) {
          // Set parent for elements in inslist
          foreach ($inslist as $updval) {
            if ($updval && $updval != $id) {
              $stmt = "UPDATE " . $this->mTableName . " " .
                      "SET parent_id='" . $updval . "' " .
                      "WHERE " . $this->mIdKey . "='" . $id . "'";
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
    $this->dbSearchItemListOfType($id,$link_type);

    if ($this->isError())
      return null;

    if (isset($this->mData)) {
      $this->mData["data"] = $this->mData;
      $this->mData["nogroup"] = null;
    }
    return $this->mData;
  } // dbUpdateLinkList

  protected function dbValidateUpdateLinkList()
  {
    $this->mError = "";

    $link_type = Parameters::get("link_type");
    if (!$link_type || $link_type == "")
      $this->mError .= "Link type missing. "; // TODO! i18n
    $id = Parameters::get($this->mIdKey);
    if ((!$id && $id !== 0) || $id == "")
      $this->mError .= $this->mType." id missing. "; // TODO! i18n

    if ($this->mError != "")
      return false;
    return true;
  } // dbValidateUpdateLinkList

  /**
   * Update the fields of a link. The link must exist in the link table.
   *
   * link_type:
   * idKey:
   * id:
   * link_id:
   *
   * @return
   */
  public function dbUpdateLink()
  {
    // Validate
    if (!$this->dbValidateUpdateLink())
      return null;

    // Link found, we can update it
    $id_key         = $this->mIdKey;
    $id             = Parameters::get($id_key);
    $link_type      = Parameters::get("link_type");
    $link_id        = Parameters::get("link_id");
    $link_tablename = $this->findLinkTableName($link_type);
    if (isset($this->mTableFieldsLeftJoin) && isset($this->mTableFieldsLeftJoin[$link_type])) {
      $val_found = false;
      $stmt = "UPDATE " . $link_tablename . " SET ";
      for ($t=0; $t<count($this->mTableFieldsLeftJoin[$link_type]); $t++) {
        $str = $this->mTableFieldsLeftJoin[$link_type][$t];
        $val = Parameters::get($str);
        if (($val || $val=="0") && $val != "") {
          $stmt .=  $str . "='" . $val . "',";
          $val_found = true;
        }
      }
      if (!$val_found)
        return null;
      $stmt[strlen($stmt)-1] = " "; // Replace last "," with " "
      $stmt .= "WHERE " . $id_key . "=".$id;
      //elog("dbUpdateLink:".$stmt);
      if (!$this->query($stmt))
        return null;
    }
    return $this->mData;
  } // dbUpdateLink

  protected function dbValidateUpdateLink()
  {
    $this->mError = "";

    $id = Parameters::get($this->mIdKey);
    if ((!$id && $id !== 0) || $id == "")
      $this->mError .= $this->mType." id missing. "; // TODO! i18n
    $link_type = Parameters::get("link_type");
    if (!$link_type || $link_type == "")
      $this->mError .= "Link type missing. "; // TODO! i18n
    $link_id = Parameters::get("link_id");
    if ((!$link_id || $link_id == "") || $link_id =="")
      $this->mError .= $link_type . " id missing. "; // TODO! i18n
    if ($link_type) {
      // Check if exists
      $link_tablename = $this->findLinkTableName($link_type);
      if (!$link_tablename)
        $this->mError .= "Link table $link_tablename not found";
      $id_key_link = $link_type."_id"; // TODO! Not general enough
      if (!$this->dbTableHasLink($link_tablename,$id_key_link,$link_id,$this->mIdKey,$id))
        $this->setMessage("Link not found in $link_tablename",true); // TODO! i18n
    }
    if ($this->mError != "")
      return false;
    return true;
  } // dbValidateUpdateLink

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
    // Validate
    if (!$this->dbValidateDelete())
      return null;

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
    $id = ltrim(Parameters::get($this->mIdKeyTable));
    if (!$this->tableExists($this->mTableName)) {
      $this->setError("Table $this->mTableName does not exist. ");
      return null;
    }
    $stmt = "DELETE FROM ".$this->mTableName." WHERE ".$this->mIdKeyTable."='".$id."'";
    //elog("dbDelete(1):".$stmt);
    if (!$this->query($stmt))
      return null;
    if ($this->getNumRowsChanged() > 0) {
      $msg = str_replace("%%",$this->mType,$this->mDeleteSuccessMsg);
      $this->setMessage($msg); // numRowsChanged >= 1 if the delete succeeded
    }
    else
      $this->setMessage($this->mDeleteNothingToDo);

    // Delete from meta table
    if ($this->mIdKeyMetaTable &&
        $this->tableExists($this->mTableNameMeta)) {
      $stmt = "DELETE FROM ".$this->mTableNameMeta." WHERE ".$this->mIdKeyMetaTable."='".$id."'";
      //elog("dbDelete:".$stmt);
      if (!$this->query($stmt))
        return null;
    }
    // Update parent_id of children
    if ($this->hasParentId()) {
      $stmt = "UPDATE ".$this->mTableName." SET parent_id=NULL WHERE parent_id='".$id."'";
      //elog("dbDelete(2):".$stmt);
      if (!$this->query($stmt))
        return null;
    }
    // Delete all links for an item with given id from associated tables (to avoid orphaned links)
    if (isset($this->mLinkTypes)) {
      foreach ($this->mLinkTypes as $link_type) {
        if ($this->mType !== $link_type) {
          $link_tablename = $this->findLinkTableName($link_type);
          if ($this->tableExists($link_tablename)) {
            $stmt = "DELETE FROM ".$link_tablename." WHERE ".$this->mIdKey."='".$id."'";
            //elog("dbDelete(3):".$stmt);
            if (!$this->query($stmt))
              $this->mError .= "Delete from ".$link_tablename." failed. ";
          }
        }
      }
    }
    if ($this->mType == "user") // TODO! This does not belong here!
      $this->mUserId = null;

    if (isset($this->mError))
      return null;
    return $this->mData;
  } // dbDelete

  protected function dbValidateDelete()
  {
    $this->mError = "";

    if (!isset($this->mTableName) || $this->mTableName == "")
      $this->mError .= "Table name missing. "; // TODO! i18n
    if (!isset($this->mIdKeyTable) || $this->mIdKeyTable == "")
      $this->mError .= "Id key missing. "; // TODO! i18n
    $id = ltrim(Parameters::get($this->mIdKeyTable));
    if ((!$id && $id !== 0) || $id == "")
      $this->mError .= $this->mType." id missing. "; // TODO! i18n

    if (method_exists($this,"dbValidateDeletePermission"))
      $this->dbValidateDeletePermission(); // Sets mError

    if ($this->mError != "")
      return false;
    return true;
  } // dbValidateDelete

} // class anyTable
?>
