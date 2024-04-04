<?php
/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2024 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ****************************************************************************************/
require_once "anyTable.php";
/**
 * __Class for interacting with an anyVista group database table.__
 * Inherits from `anyTable`, which manages the basic database operations.
 * This class is mandatory for the anyVista server backend.
 *
 * See `anyTable` for a description of the data structure the class uses.
 *
 * @class groupTable
 * @constructor
 * @param {dbConnection} connection Info about the database connection.
 * @example
 *      new groupTable($dbconn);
 */
class groupTable extends anyTable
{
  protected $mType           = "group",
            $mIdKey          = "group_id",
            $mIdKeyTable     = "group_id",
            $mIdKeyMetaTable = "group_id",
            $mNameKey        = "group_name",
            $mOrderBy        = "group_type";

  protected $mTableName          = "any_group",
            $mTableNameMeta      = "any_groupmeta",
            $mTableNameGroupLink = "any_group",
            $mTableNameUserLink  = "any_group_user";

  protected $mTableFields = [
      "group_id",
      "group_type",
      "group_name",
      "group_description",
      "group_sort_order",
      "group_status",
      "group_privacy",
      "group_header_image",
      "parent_id",
    ];

  protected $mTableFieldsMeta = [
    ];

  protected $mTableFieldsLeftJoin = [
      "user" => [
        "user_id",
        "user_joined_date",
        "user_role",
      ],
      "event" => [
        "event_id",
      ],
    ];

  protected $mLinkTypes = ["document","event","user"];

  protected $mFilters = [
      "list" => [
        "group_id"          => 1,
        "group_type"        => 1,
        "group_name"        => 1,
        "group_description" => 1,
        "parent_id"         => 1,
        "parent_name"       => 1,
        "group_sort_order"  => 1,
        "group_status"      => 1,
        "group_privacy"     => 1,
        "membership"        => 1,
      ],
      "item" => [
        "group_id"          => 1,
        "group_type"        => 1,
        "group_name"        => 1,
        "group_description" => 1,
        "parent_id"         => 1,
        "parent_name"       => 1,
        "group_sort_order"  => 1,
        "group_status"      => 1,
        "group_privacy"     => 1,
        "membership"        => 1,
      ],
    ];

  protected $mInsertSuccessMsg  = "Group created. ",
            $mUpdateSuccessMsg  = "Group updated. ",
            $mDeleteSuccessMsg  = "Group deleted. ";

  protected $mJoinedAlreadyMsg = "The user is already a member of this group. ",
            $mJoinedSuccessMsg = "Joined group. ",
            $mLeftAlreadyMsg   = "The user is not a member of this group. ",
            $mLeftSuccessMsg   = "Left group. ";

  // Constructor
  public function __construct($connection)
  {
    parent::__construct($connection);
  }

  public function hasParentId()
  {
    return true;
  } // hasParentId

  /////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// Filter /////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  protected function initFilters($filters)
  {
    $parents = $this->prepareParents("group","group_id","group_name");
    $status  = $this->prepareSetting("GROUP_STATUS");
    $privacy = $this->prepareSetting("GROUP_PRIVACY");
  } // initFilters

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////// Database query fragments ////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  protected function findListOrderBy()
  {
    return "ORDER BY ".$this->getTableName().".group_sort_order,".
                       $this->getTableName().".group_type,".
                       $this->getTableName().".group_id,".
                       $this->getTableName().".parent_id,".
                       $this->getTableName().".".$this->mNameKey." ASC ";
  } // findListOrderBy

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Validate ////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  protected function dbValidateInsert()
  {
    $this->mError = "";
    $name = Parameters::get($this->mNameKey);
    if (!$name)
      $this->mError .= "Group name missing. ";
    $groupType = Parameters::get("group_type");
    if (!$groupType)
      $this->mError .= "Group type missing. ";
    if (strtolower($name) == "admin" || strtolower($name) == "administrator")
      $this->mError .= $name."' is a reserved name. ";
    else {
      if (!$this->dbSearchItemByKey("group",$this->mNameKey,$name)) // TODO! Allow for several groups with same name?
        return false;
      if ($this->mData != null)
        $this->mError .= "Group '".$name."' already exists. ";
    }
    if ($this->mError != "")
      return false;
    return true;
  } // dbValidateInsert

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Search //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // Return info of one or all groups of a given type
  protected function dbSearchGroupInfo($type=null,$grouping=true,$group_id=null)
  {
    $tableName = $this->getTableName();
    if (!$this->tableExists($tableName))
      return null;

    $data = array();
    if ($group_id == "nogroup") { // No need to search if we dont want a group!
      $data["nogroup"] = $this->mData;
      return null;
    }
    $stmt = "SELECT ".$tableName.".group_id,".
                      $tableName.".group_type,".
                      $tableName.".group_name,".
                      $tableName.".group_description,".
                      $tableName.".group_sort_order,".
                      $tableName.".parent_id ".
            "FROM ".$tableName." ";
    $where = "";
    if ($type && $type != "group")
      $where = "WHERE group_type='".$type."' ";
    if ($group_id) {
      $db_gid = is_numeric($group_id) ? "CAST(".$group_id." AS INT)" : "'".$group_id."'";
      if ($where == "")
        $where  = "WHERE group_id=".$db_gid." ";
      else
        $where .= "AND group_id=".$db_gid." ";
    } // if group_id
    $stmt .= $where."ORDER BY group_sort_order,group_id,group_type";
    //error_log("dbSearchGroupInfo:".$stmt);
    if (!$this->query($stmt))
      error_log("Warning: No group tree. ");
    $this->getRowData($this->mData,"list");

    if ($grouping)
      $data = $this->buildDataTree($this->mData["nogroup"]); // Get group tree and append data to it
    else
      $data = $this->mData;
    //vlog("dbSearchGroupInfo,d1:",$data);

    // Add the default "nogroup" group
    if (!$group_id && $group_id !== 0)
      $group_id = Parameters::get("group_id");
    if (((!$group_id && $group_id !== 0) || $group_id == "nogroup") && $type) {
      if (!isset($data["nogroup"]))
        $data["nogroup"] = array();
      $data["nogroup"]["group_name"] = $this->findDefaultHeader($type);
      $data["nogroup"]["group_id"]   = "nogroup";
      $data["nogroup"]["group_type"] = $type;
      $data["nogroup"]["head"]       = "group";
    }
    //error_log("dbSearchGroupInfo,d2:".var_export($data,true));
    if (!$group_id && $group_id !== 0)
      $this->mData = $data;
    else
    if (isset($data) && count($data) > 0)
      $this->mData = $data;
    else
      error_log("Warning: No group data. ");
    return $data;
  } // dbSearchGroupInfo

} // class groupTable
?>