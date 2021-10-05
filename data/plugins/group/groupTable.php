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
require_once "anyTable.php";
/**
 * __Class for interacting with an anyList group database table.__
 * Inherits from `anyTable`, which manages the basic database operations.
 * This class (along with the `userTable` class) is mandatory for the anyList server backend.
 *
 * @class groupTable
 * @constructor
 * @param {dbConnection} connection Info about the database connection.
 * @example
 *      new groupTable($dbconn);
 */
class groupTable extends anyTable
{
  protected $mTableDefs = [
    "tableName"          => "any_group",
    "tableNameMeta"      => "any_groupmeta",
    "tableNameGroupLink" => "any_group",
    "tableNameUserLink"  => "any_group_user",
    "type"               => "group",
    "idKey"              => "group_id",
    "idKeyTable"         => "group_id",
    "idKeyMetaTable"     => "group_id",
    "nameKey"            => "group_name",
    "orderBy"            => "group_type",
    "metaId"             => "meta_id",
    "fields" => [
      "group_type",
      "group_id",
      "group_name",
      "group_description",
      "parent_id",
      "parent_name",
      "group_sort_order",
      "group_status",
      "group_privacy",
      "group_header_image",
    ],
    "fieldsMeta" => [
    ],
    "fieldsGroup" => [
    ],
    "fieldsLeftJoin" => [
      "group" => [
      ],
      "user" => [
        "user_id",
        "user_joined_date",
        "user_role",
      ],
    ],
    "filters" => [
      "list" => [
        "group_type"        => 1,
        "group_id"          => 1,
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
        "group_type"        => 1,
        "group_id"          => 1,
        "group_name"        => 1,
        "group_description" => 1,
        "parent_id"         => 1,
        "parent_name"       => 1,
        "group_sort_order"  => 1,
        "group_status"      => 1,
        "group_privacy"     => 1,
        "membership"        => 1,
      ],
    ],
    "plugins" => ["group","user"],
  ];

  protected $mJoinedAlreadyMsg = "The user is already a member of this group. ",
            $mJoinedSuccessMsg = "Joined group. ",
            $mLeftAlreadyMsg   = "The user is not a member of this group. ",
            $mLeftSuccessMsg   = "Left group. ";

  // Constructor
  public function __construct($connection)
  {
    parent::__construct($connection,$this->mTableDefs);
  }

  /////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// Filter /////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  protected function initFilters($filters)
  {
    $parents = $this->prepareParents("group","group_id","group_name");
    $status  = $this->prepareSetting("GROUP_STATUS");
    $privacy = $this->prepareSetting("GROUP_PRIVACY");
  } // initFilters

  public function hasParentId()
  {
    return true;
  } // hasParentId

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////// Database query fragments ////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  protected function findListOrderBy($sort="ASC")
  {
    return "ORDER BY ".$this->getTableName().".group_sort_order,".
                       $this->getTableName().".group_type,".
                       $this->getTableName().".group_id ".$sort.",".
                       $this->getTableName().".parent_id ".$sort.",".
                       $this->getTableName().".".$this->mNameKey." ".$sort;
  } // findListOrderBy

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Validate ////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  protected function dbValidateInsert()
  {
    $err = "";
    $name = Parameters::get($this->mNameKey);
    if (!$name)
      $err .= "Group name missing. ";
    $groupType = Parameters::get("group_type");
    if (!$groupType)
      $err .= "Group type missing. ";
    if (strtolower($name) == "admin" || strtolower($name) == "administrator")
      $err .= $name."' is a reserved name. ";
    else {
      if (!$this->dbSearchItem($this->mData,$this->mNameKey,$name)) // TODO! Allow for several groups with same name?
        return $err;
      if ($this->mData != null)
        $err .= "Group '".$name."' already exists. ";
    }
    if ($err != "")
      $this->setError($err);
    return $err;
  } // dbValidateInsert

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Search //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  protected function dbSearchItem(&$data,$key,$val,$skipLists=false)
  {
    if ($val == "nogroup") {
      $group_type = Parameters::get("group_type");
      $this->mData = array();
      $this->mData["group"]["nogroup"]["group_type"] = $group_type;
      $this->mData["group"]["nogroup"]["group_id"]   = "nogroup";
      $this->mData["group"]["nogroup"]["group_name"] = "Default ".$group_type." group";
      $this->mGroupId = $group_type;
      return $this->dbSearchItemLists($data);
    }
    else
      return parent::dbSearchItem($data,$key,$val);
  } // dbSearchItem

  // Return a tree structure of all groups of a given type
  protected function dbSearchGroupNames($type=null)
  {
    $stmt = "SELECT ".$this->getTableName().".group_id,".
                      $this->getTableName().".group_type,".
                      $this->getTableName().".group_name,".
                      $this->getTableName().".group_description,".
                      $this->getTableName().".parent_id, ".
                      $this->getTableName().".group_sort_order ".
            "FROM ".$this->getTableName()." ";
    if ($type && $type != "group")
      $stmt .= "WHERE group_type='".$type."' ";
    $stmt .= "ORDER BY group_sort_order,group_id,group_type";
    //error_log("dbSearchGroupNames:".$stmt);
    if (!$this->tableExists($this->getTableName()) || !$this->query($stmt))
      error_log("Warning: No group tree. "); // No group tree
    $data = array();
    while (($nextrow = $this->getNext(true)) != null) {
      $idx = "+".$nextrow[$this->mIdKeyTable];
      if ($this->mTableFields) {
        for ($t=0; $t<count($this->mTableFields); $t++) {
          $item_id_table = $this->mTableFields[$t];
          $this->getCellData($item_id_table,$nextrow,$data,$idx,"group",null,"list",false); // TODO: Searching for "simple" list does not work here
        }
      }
      $data["group"][$idx]["head"] = "group";
    }
    // Get group tree and append data to it
    $num = 0;
    $data_tree = array();
    $data_tree["group"] = array();
    $data_tree["group"] = $this->buildDataTree($data["group"],null,false,$num);
    //vlog("dbSearchGroupTree,data_tree:",$data_tree);

    // Add the default "nogroup" group
    if ($type) {
      $data_tree["group"]["nogroup"]["group_type"] = $type;
      $data_tree["group"]["nogroup"]["group_id"]   = "nogroup";
      $data_tree["group"]["nogroup"]["group_name"] = $this->findDefaultHeader($type);
      $data_tree["group"]["nogroup"]["head"]       = "group";
    }
    //error_log("dbSearchGroupNames,data_tree:".var_export($data_tree,true));
    $this->tdata = $data_tree;

    return $data;
  } // dbSearchGroupNames

} // class groupTable
?>
