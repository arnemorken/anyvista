<?php
/****************************************************************************************
 *
 * anyList is copyright (C) 2011-2021 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyList Commercial License for commercial use.
 * Get licences here: http://balanse.info/anylist/license/ (coming soon).
 *
 ****************************************************************************************/
require_once "anyTable.php";
/**
 * __Class for interacting with an anyList document database table.__
 * Inherits from `anyTable`, which manages the basic database operations.
 *
 * See `anyTable` for a description of the data structure the class uses.
 *
 * @class documentTable
 * @constructor
 * @param {dbConnection} connection Info about the database connection.
 * @example
 *      new documentTable($dbconn);
 */
class documentTable extends anyTable
{
  protected $mTableDefs = [
    "tableName"          => "any_document",
    "tableNameMeta"      => "any_documentmeta",
    "tableNameGroupLink" => "any_document_group",
    "tableNameUserLink"  => "any_document_user",
    "type"               => "document",
    "idKey"              => "document_id",
    "idKeyTable"         => "document_id",
    "idKeyMetaTable"     => "document_id",
    "nameKey"            => "document_name",
    "orderBy"            => "document_registered",
    "metaId"             => "meta_id",
    "fields" => [
      "document_id",
      "document_name",
      "document_description",
      "document_registered",
      "parent_id",
      "parent_name",
    ],
    "fieldsMeta" => [
    ],
    "fieldsGroup" => [
      "group_type",
      "group_id",
      "group_name",
      "group_description",
      "group_sort_order",
      "group_status",
      "group_privacy",
    ],
    "fieldsLeftJoin" => [
      "group" => [
        "group_id",
      ],
      "user" => [
        "user_id",
      ],
    ],
    "filters" => [
      "list" => [
        "document_id"          => 1,
        "document_name"        => 1,
        "document_description" => 1,
        "document_registered"  => 1,
        "parent_id"            => 1,
        "parent_name"          => 1,
      ],
      "item" => [
        "document_id"          => 1,
        "document_name"        => 1,
        "document_description" => 1,
        "document_registered"  => 1,
        "parent_id"            => 1,
        "parent_name"          => 1,
      ],
    ],
    "plugins" => ["document","group","user"],
  ];

  protected $mInsertSuccessMsg = "Document created. ",
            $mUpdateSuccessMsg = "Document updated. ",
            $mDeleteSuccessMsg = "Document deleted. ";

  // Constructor
  public function __construct($connection)
  {
    parent::__construct($connection,$this->mTableDefs);
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
    if (!$this->mFilters)
      return false;
    return true;
  } // initFilters

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////// Database query fragments ////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  protected function findListWhere($skipOwnId=false)
  {
    $where = parent::findListWhere($skipOwnId);
    return $where;
  } // findListWhere

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Update //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  protected function dbUpdateItem()
  {
    if (!anyTable::dbUpdateItem())
      return false;
    return true;
  } // dbUpdateItem

  protected function dbUpdateExtra()
  {
  } // dbUpdateExtra

} // class documentTable
?>