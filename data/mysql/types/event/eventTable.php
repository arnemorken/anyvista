<?php
/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2023 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ****************************************************************************************/
require_once "anyTable.php";
/**
 * __Class for interacting with an anyVista event database table.__
 * Inherits from `anyTable`, which manages the basic database operations.
 *
 * See `anyTable` for a description of the data structure the class uses.
 *
 * @class eventTable
 * @constructor
 * @param {dbConnection} connection Info about the database connection.
 * @example
 *      new eventTable($dbconn);
 */
class eventTable extends anyTable
{
  protected $mTableDefs = [
    "tableName"          => "any_event",
    "tableNameMeta"      => "any_eventmeta",
    "tableNameGroupLink" => "any_event_group",
    "tableNameUserLink"  => "any_event_user",
    "type"               => "event",
    "idKey"              => "event_id",
    "idKeyTable"         => "event_id",
    "idKeyMetaTable"     => "event_id",
    "nameKey"            => "event_name",
    "orderBy"            => "event_date_start",
    "metaId"             => "meta_id",
    "fields" => [
      "event_id",
      "event_name",
      "event_description",
      "event_place",
      "event_date_start",
      "event_date_end",
      "event_date_join",
      "event_date_pay",
      "event_price",
      "event_status",
      "event_url",
      "event_privacy",
      "event_ingress",
      "event_max_users",
      "event_arranger_id",
      "event_instructor_id",
      "parent_id",
      "event_header_image",
    ],
    "fieldsMeta" => [
      "pay_total",
      "pay_balance",
      "user_discount",
      "salary_model",
      "salary_number",
      "salary_minimum",
      "other_expenses",
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
        "main_event",
      ],
      "user" => [
        "user_id",
        //"user_discount",
        //"user_paid",
        //"user_paid_date",
        //"user_joined_date",
        "user_result",
        "user_feedback",
        "user_attended",
      ],
      "document" => [
        "document_id",
        "document_status",
      ],
    ],
    "filters" => [
      "list" => [
        "event_id"            => 1,
        "event_name"          => 1,
        "event_place"         => 1,
        "event_date_start"    => 1,
        "event_date_end"      => 1,
        "event_date_join"     => 1,
        "event_date_pay"      => 0,
        "event_price"         => 1,
        "event_status"        => 1,
        "event_url"           => 1,
        "event_privacy"       => 1,
        "document_status"     => 1,
        "pay_total"           => 0,
        "user_paid"           => 0,
        "pay_balance"         => 0,
        "parent_id"           => 1,
        "parent_name"         => 1,
        "user_result"         => 1,
        "user_feedback"       => 1,
        "other_expenses"      => 1,
        "salary_number"       => 1,
        "user_attended"       => 1,
        "event_ingress"       => 1,
      ],
      "item" => [
        "event_id"            => 1,
        "event_name"          => 1,
        "event_place"         => 1,
        "event_date_start"    => 1,
        "event_date_end"      => 1,
        "event_date_join"     => 1,
        "event_date_pay"      => 0,
        "event_price"         => 1,
        "event_status"        => 1,
        "event_url"           => 1,
        "event_privacy"       => 1,
        "event_ingress"       => 1,
        "document_status"     => 1,
        "event_description"   => 1,
        "event_max_users"     => 1,
        "parent_id"           => 1,
        "parent_name"         => 1,
        "event_arranger_id"   => 1,
        "event_instructor_id" => 1,
        "event_header_image"  => 1,
        "user_result"         => 1,
        "user_feedback"       => 1,
        "other_expenses"      => 1,
        "salary_number"       => 1,
        "user_attended"       => 1,
      ],
    ],
    "types" => ["document","group","user"],
  ];

  protected $mInsertSuccessMsg  = "Event created. ",
            $mUpdateSuccessMsg  = "Event updated. ",
            $mDeleteSuccessMsg  = "Event deleted. ";

  protected $mJoinedAlreadyMsg = "The user is already registered for this event. ",
            $mJoinedSuccessMsg = "Registration complete. ",
            $mLeftAlreadyMsg   = "The user is not registered for this event. ",
            $mLeftSuccessMsg   = "Registration cancelled. ";

  protected $mResult    = null;
  private   $mFirstDate = "1900-01-01";
  private   $mLastDate  = "2099-12-31";

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
    if (!$this->mFilters)
      return false;
    $has_perm = is_object($this->mPermission) && $this->mPermission;
    $user_id         = Parameters::get("user_id");
    $current_user_id = $has_perm ? $this->mPermission->current_user_id : null;
    $is_admin        = $has_perm ? $this->mPermission->is_admin : false;
    $is_me           = $user_id && $user_id > 0 && $current_user_id == $user_id;
    $parents         = $this->prepareParents("event","event_id","event_name");
    $status          = $this->prepareSetting("EVENT_STATUS");
    $privacy         = $this->prepareSetting("EVENT_PRIVACY");
    $places          = $this->prepareSetting("EVENT_PLACES");
    $arrangers       = $this->prepareSetting("ARRANGERS");
    $instructors     = $this->prepareSetting("INSTRUCTORS");

    $this->mFilters["list"]["user_attended"] = 1; //$is_me ? 1 : 0;
    $this->mFilters["item"]["user_attended"] = 1; //$is_me ? 1 : 0;
    return true;
  } // initFilters

  protected function prepareSalaryModel()
  {
    return array("select" => "[Select]", // TODO
                 1 => "Fixed amount",
                 2 => "% of income",
                 3 => "Other"
           );
  } // prepareSalaryModel

  public function hasParentId()
  {
    return true;
  } // hasParentId

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////// Database query fragments ////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  protected function findListWhere($gid)
  {
    $where = parent::findListWhere($gid);
    $w = "";
    $event_date_start = Parameters::get("event_date_start");
    $event_date_end   = Parameters::get("event_date_end");
    if ($event_date_start && $event_date_end) {
      if ($event_date_start == "current")
        $w = $this->getTableName().".event_date_start <= '".     $event_date_end.  "' AND ".$this->getTableName().".event_date_end >= '".$event_date_end."' ";
      else
        $w = $this->getTableName().".event_date_start BETWEEN '".$event_date_start."' AND '".$event_date_end."' ";
    }
    else
    if ($event_date_start && !$event_date_end)
      $w = $this->getTableName().".event_date_start BETWEEN '".$event_date_start."' AND '".$this->mLastDate."' ";
    else
    if (!$event_date_start && $event_date_end)
      $w = $this->getTableName().".event_date_end BETWEEN '".$this->mFirstDate."' AND '".$event_date_end."' ";
    if ($w) {
      if ($where == null)
        $where  = "WHERE ".$w;
      else
        $where .= " AND  ".$w;
    }
    return $where;
  } // findListWhere

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Update //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
/*
  // Update event_user table
  protected function dbUpdateAssociation()
  {
    // Update event_user table
    if (isset($this->mTableFieldsLeftJoin["user"])) {
      $stmt_par = null;
      for ($t=0; $t<count($this->mTableFieldsLeftJoin["user"]); $t++) {
        $str  = $this->mTableFieldsLeftJoin["user"][$t];
        $str_val  = (Parameters::get($str));
        $stmt_par.= Parameters::get($str) != null ? $str."='".$str_val."'," : "";
      }
      if ($stmt_par != null) {
        $stmt  = "UPDATE ".$this->mTableNameUserLink." SET ";
        $stmt .= $stmt_par;
        $stmt[strlen($stmt)-1] = " "; // Replace last "," with " "
        $stmt.= "WHERE ".$this->mIdKeyTable."='".$this->mId."' ";
        //error_log("eventTable dbUpdateAssociation:".$stmt);
        if (!$this->query($stmt))
          return false;
      }
    }
    return true;
  } // dbUpdateAssociation
*/
  protected function dbUpdateExtra()
  {
    $upd_what = Parameters::get("upd");
    if ($upd_what == "att")
      return $this->dbSetAttended(Parameters::get("event_id"),Parameters::get("user_id"));
    //error_log("Unknown value for 'upd':".$upd_what);
    $this->dbUpdateResult();
    return false;
  } // dbUpdateExtra

  protected function dbUpdateResult()
  // Set the user_result field of any_event_user
  {
    $eventId = Parameters::get($this->mIdKey);
    if (!$eventId) {
      $this->setError("Event id missing. ");
      return false;
    }
    $userId = Parameters::get("user_id");
    if (!$userId) {
      $this->setError("User id missing. ");
      return false;
    }

    $stmt = "UPDATE ".$this->mTableNameUserLink." SET ".
            "user_result='".$this->mResult."', ".
            "user_attended='1' ".
            "WHERE user_id='".$userId."' AND event_id='".$eventId."'";
    //error_log("dbUpdateResult:".$stmt);
    if (!$this->query($stmt)) {
      error_log("upd err");
      return false;
    }
    $msg = "Update success. ";
    //error_log($msg);
    $this->setMessage($msg);

    return true;
  } // dbUpdateResult

  // Set whether a user attended an event
  // Must be public, as it is used by userTable
  public function dbSetAttended($eventId,$userId)
  {
    if (!$eventId) {
      $this->setError("Event id missing. ");
      return false;
    }
    if (!$userId) {
      $this->setError("User id missing. ");
      return false;
    }
    $att = Parameters::get("att");
    if (!$att) {
      $this->setError("att parameter missing. ");
      return false;
    }
    // Check if item exists
    $stmt = "SELECT * FROM ".$this->mTableNameUserLink." WHERE user_id='".$userId."' AND event_id='".$eventId."'";
    //error_log("dbSetAttended(1):".$stmt);
    if (!$this->query($stmt))
      return false;
    $nextrow = $this->getNext(true);
    if ($nextrow === null) {
      // Item des not exist, insert it
      $stmt = "INSERT INTO ".$this->mTableNameUserLink." (".
              "user_id,event_id,user_attended".
              ") VALUES (".
              $userId.",".$eventId.",".$att.
              ")";
      //error_log("dbSetAttended(2):".$stmt);
      if (!$this->query($stmt))
        return false;
    }
    else {
      // Item exists, we can update it
      $stmt = "UPDATE ".$this->mTableNameUserLink." SET user_attended='".$att."' ".
              "WHERE user_id='".$userId."' AND event_id='".$eventId."'";
      //error_log("dbSetAttended(3):".$stmt);
      if (!$this->query($stmt))
        return false;
    }
    return true;
  } // dbSetAttended

} // class eventTable
?>
