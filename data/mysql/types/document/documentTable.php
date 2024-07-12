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
 * __Class for interacting with an anyVista document database table.__
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
  protected $mType           = "document",
            $mIdKey          = "document_id",
            $mIdKeyTable     = "document_id",
            $mIdKeyMetaTable = "document_id",
            $mNameKey        = "document_name",
            $mOrderBy        = "document_registered";

  protected $mTableName          = "any_document",
            $mTableNameMeta      = "any_documentmeta",
            $mTableNameGroupLink = "any_document_group",
            $mTableNameUserLink  = "any_document_user";

  protected $mTableFields = [
      "document_id",
      "document_name",
      "document_filename",
      "document_description",
      "document_registered",
      "document_status",
      "document_privacy",
      "parent_id",
    ];

  protected $mTableFieldsMeta = [
    ];

  protected $mTableFieldsLeftJoin = [
      "group" => [
        "group_id",
      ],
      "user" => [
        "user_id",
        "user_role",
      ],
      "event" => [
      ],
    ];

  protected $mLinkTypes = ["group","user","event"];

  protected $mFilters = [
      "list" => [
        "document_id"          => 1,
        "document_name"        => 1,
        "document_filename"    => 1,
        "document_description" => 1,
        "document_registered"  => 1,
        "document_status"      => 1,
        "document_privacy"     => 1,
        "parent_id"            => 1,
        "parent_name"          => 1,
      ],
      "item" => [
        "document_id"          => 1,
        "document_name"        => 1,
        "document_filename"    => 1,
        "document_description" => 1,
        "document_registered"  => 1,
        "document_status"      => 1,
        "document_privacy"     => 1,
        "parent_id"            => 1,
        "parent_name"          => 1,
      ],
    ];

  protected $mInsertSuccessMsg = "Document created. ",
            $mUpdateSuccessMsg = "Document updated. ",
            $mDeleteSuccessMsg = "Document deleted. ";

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
    if (!$this->mFilters)
      return false;
    return true;
  } // initFilters

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////// Database query fragments ////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  protected function findListWhere($groupType=null,$groupId=null,$linkType=null,$linkId=null,$grouping=true,$linktable_name="",$has_linktable=false,$searchTerm="")
  {
    $where = parent::findListWhere($groupType,$groupId,$linkType,$linkId,$grouping,$linktable_name,$has_linktable,$searchTerm);
    return $where;
  } // findListWhere

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Update //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  protected function dbUpdateExtra()
  {
  } // dbUpdateExtra

} // class documentTable
?>
