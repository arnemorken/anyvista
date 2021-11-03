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
 * __Class for interacting with an anyList user database table.__
 * Inherits from `anyTable`, which manages the basic database operations.
 * This class (along with the `groupTable` class) is mandatory for the anyList server backend.
 * The class supports login/user authentication through the Wordpress user login API, but will
 * also work as a normal anyList plugin table with or without Wordpress.
 *
 * See `anyTable` for a description of the data structure the class uses.
 *
 * @class userTable
 * @constructor
 * @param {dbConnection} connection Info about the database connection.
 * @example
 *      new userTable($dbconn);
 */
class userTable extends anyTable
{
  protected $mTableDefs = [
    "tableName"          => ANY_DB_USER_TABLE,
    "tableNameMeta"      => ANY_DB_USERMETA_TABLE,
    "tableNameGroupLink" => "any_group_user",
    "tableNameUserLink"  => ANY_DB_USER_TABLE,
    "type"               => "user",
    "idKey"              => "user_id",
    "idKeyTable"         => ANY_DB_USER_ID,
    "idKeyMetaTable"     => "user_id",
    "nameKey"            => ANY_DB_USER_NAME,
    "orderBy"            => ANY_DB_USER_NAME,
    "metaId"             => ANY_DB_USER_META_ID,
    "fields" => [
      ANY_DB_USER_ID,
      ANY_DB_USER_NAME,
      ANY_DB_USER_LOGIN,
      "user_pass",
      "user_nicename",
      "user_email",
      "user_url",
      "user_status",
      "user_registered",
      "user_activation_key",
    ],
    "fieldsMeta" => [
      "user_id",
      "user_name",
      "display_name",
      "first_name",
      "last_name",
      "user_telephone",
      "user_gender",
      "user_date_birth",
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
        "user_joined_date",
        "user_role",
      ],
    ],
    "filters" => [
      "list" => [
        "user_id"          => 1,
        "group_id"         => 1,
        ANY_DB_USER_NAME   => 1,
        ANY_DB_USER_LOGIN  => 1,
        "display_name"     => 1,
        "first_name"       => 1,
        "last_name"        => 1,
        "user_email"       => 1,
        "user_telephone"   => 1,
        "user_url"         => 1,
        "user_gender"      => 1,
        "user_date_birth"  => 1,
        "user_discount"    => 0,
        "pay_total"        => 0,
        "user_paid"        => 0,
        "pay_balance"      => 0,
        "parent_id"        => 1,
        "user_joined_date" => 1,
        "user_result"      => 1,
        "user_feedback"    => 1,
        "user_attended"    => 1,
        "user_role"        => 1,
      ],
      "item" => [
        "user_id"          => 1,
        "group_id"         => 1,
        ANY_DB_USER_NAME   => 1,
        ANY_DB_USER_LOGIN  => 1,
        "display_name"     => 1,
        "first_name"       => 1,
        "last_name"        => 1,
        "user_email"       => 1,
        "user_telephone"   => 1,
        "user_url"         => 1,
        "user_gender"      => 1,
        "user_date_birth"  => 1,
        "_HIDEBEGIN_"      => 0,
        "user_pass"        => 0,
        "user_pass_again"  => 0,
        "_HIDEEND_"        => 0,
        "user_discount"    => 0,
        "pay_total"        => 0,
        "user_paid"        => 0,
        "pay_balance"      => 0,
        "description"      => 1,
        "user_registered"  => 0,
        "user_joined_date" => 1,
        "user_status"      => 1,
        "user_privacy"     => 1,
        "parent_id"        => 0,
        "user_attended"    => 1,
        "user_role"        => 1,
      ],
    ],
    "plugins" => ["group","user"],
  ];

  protected $mInsertSuccessMsg  = "User created. ",
            $mUpdateSuccessMsg  = "User updated. ",
            $mDeleteSuccessMsg  = "User deleted. ";

  private $emailAsLogin          = false,
          $emailOptional         = true,
          $can_change_user_login = true;

  private $mUpdatePasswordChanged = "Password changed";

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
    $has_perm = is_object($this->mPermission) && $this->mPermission;
    $user_id         = Parameters::get("user_id");
    $current_user_id = $has_perm ? $this->mPermission->current_user_id : null;
    $is_admin        = $has_perm ? $this->mPermission->is_admin : false;
    $is_me           = $user_id && $user_id > 0 && $current_user_id == $user_id;
    $parents         = $this->prepareParents("user","user_id",ANY_DB_USER_LOGIN);
    $status          = $this->prepareSetting("USER_STATUS");
    $privacy         = $this->prepareSetting("USER_PRIVACY");
    $discounts       = $this->prepareSetting("DISCOUNTS");

    $this->mFilters["list"]["_HIDEBEGIN_"]     = $is_me || $is_admin ? 1 : 0;
    $this->mFilters["list"]["user_pass"]       = $is_me || $is_admin ? 1 : 0;
    $this->mFilters["list"]["user_pass_again"] = $is_me || $is_admin ? 1 : 0;
    $this->mFilters["list"]["_HIDEEND_"]       = $is_me || $is_admin ? 1 : 0;
  } // initFilters

  public static function prepareGender()
  {
    return array("F" => "F", "M" => "M");
  } // prepareGender

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Validate ////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  protected function dbValidateInsert($validatePassword=true)
  {
    $err = "";
    $has_perm = is_object($this->mPermission) && $this->mPermission;
    if ($has_perm && $this->mPermission->is_logged_in && !$this->mPermission->is_admin)
      $err .= "You do not have permission to create users. ";
    $err .= $this->dbValidateInsertUpdate($validatePassword);
    if ($err != "")
      $this->setError($err);
    return $err;
  } // dbValidateInsert

  protected function dbValidateUpdate($validatePassword=true)
  {
    $err = "";
    $has_perm = is_object($this->mPermission) && $this->mPermission;
    if ($has_perm && $this->mPermission->is_logged_in && !$this->mPermission->is_admin)
      if ($this->mPermission->current_user_id != Parameters::get($this->mIdKey))
        $err .= "You do not have permission to edit this user. ";
    $err .= $this->dbValidateInsertUpdate($validatePassword);
    if ($err != "")
      $this->setError($err);
    return $err;
  } // dbValidateUpdate

  protected function dbValidateInsertUpdate($validatePassword=true)
  {
    $err       = "";
    $cmd       = ltrim(Parameters::get("cmd"));
    $login_val = Parameters::get(ANY_DB_USER_LOGIN);
    $email_val = Parameters::get("user_email");
    if ($this->emailAsLogin) { // Email must be present, and user login field is illegal
      if ($login_val)
        $err .= "Email should be used for login. ";
      if ($cmd == "ins" && !$email_val)
        $err .= "Email address missing. ";
      if ($err === "") {
        $login_val = $email_val;
        Parameters::set(ANY_DB_USER_LOGIN,$email_val);
      }
    }
    else { // user login field must be present for new users
      if ($cmd == "ins") {
        if (!$login_val)
          $err .= "Login name missing. ";
        else
        if (strtolower($login_val) == "adm" ||
            strtolower($login_val) == "admin" ||
            strtolower($login_val) == "administrator")
          $err .= $login_val." is a reserved name. ";
        if (!$this->emailOptional) // user login field required
          if (!$email_val)
            $err .= "Email address missing. ";
      }
      else { // upd
        if ($login_val && !$this->can_change_user_login)
          Parameters::deset(ANY_DB_USER_LOGIN); // Changing user login is not allowed
      }
    }
    if ($cmd == "ins" && $validatePassword && $login_val) {
      if (!$this->dbSearchUserByLogin($login_val))
        $err .= "Login name '".$login_val."' is already in use. ";
      $password = Parameters::get("user_pass");
      if (!$password)
        $err .= "Password missing. ";
      else {
        $pass_again = Parameters::get("user_pass_again");
        if (!$pass_again)
          $err .= "Confirm password. ";
        else
        if ($password != $pass_again)
          $err .= "Passwords do not match. ";
      }
    }
    return $err;
  } // dbValidateInsertUpdate

  protected function dbValidateDeletePermission()
  {
    $err = "";
    // Check if trying to delete admin user
    $name = Parameters::get($this->mNameKey);
    if ($name == "adm" || $name == "admin" || $name == "administrator")
      $err = "Cannot delete administrator user $name. ";
    return $err;
  } // dbValidateDeletePermission

  /////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// Search /////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  private function dbSearchUserByLogin($userLogin)
  {
    $id_name = $this->emailAsLogin ? "user_email" : ANY_DB_USER_LOGIN;
    $res = $this->dbSearchItem($this->mData,$id_name,$userLogin,true);
    return !empty($res);
  } // dbSearchUserByLogin

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Update //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  protected function dbUpdateItem()
  {
    if (!anyTable::dbUpdateItem())
      return false;
    // Update event_user table
    if (isset($this->mTableFieldsLeftJoin["user"])) {
      $stmt_par = null;
      for ($t=0; $t<count($this->mTableFieldsLeftJoin["user"]); $t++) {
        $str  = $this->mTableFieldsLeftJoin["user"][$t];
        $str_val  = (Parameters::get($str));
        $stmt_par.= Parameters::get($str) != null ? $str."='".$str_val."'," : "";
      }
      if ($stmt_par != null) {
        $stmt  = "UPDATE any_event_user SET ";
        $stmt .= $stmt_par;
        $stmt[strlen($stmt)-1] = " "; // Replace last "," with " "
        $stmt.= "WHERE user_id='".$this->mId."' ";
        //error_log("userTable dbUpdateItem:".$stmt);
        if (!$this->query($stmt))
          return false;
        if ($this->pw_change) {
          $this->setMessage($this->mUpdatePasswordChanged);
          $this->pw_change = false;
        }
      }
    }
    return true;
  } // dbUpdateItem

  protected function dbPrepareUpdateStmtKeyVal($key,$val)
  {
    if ($key == "user_pass") {
      if ($val && defined("WP_PLUGIN")) {
        wp_set_password($val,$this->mId);
        $has_perm = is_object($this->mPermission) && $this->mPermission;
        if ($has_perm && !$this->mPermission->is_admin)
          wp_set_auth_cookie($this->mId); // Stay logged in
        $this->pw_change = true;
      }
    }
    else
    if ($key == ANY_DB_USER_LOGIN) {
      if (!$val) // Cannot have blank login_name
        return "";
    }
    return parent::dbPrepareUpdateStmtKeyVal($key,$val);
  } // dbPrepareUpdateStmtKeyVal

  protected function dbUpdateExtra()
  {
    $upd_what = Parameters::get("upd");
    if ($upd_what == "att") {
      $ev_tab = anyTableFactory::create("event",$this);
      if ($ev_tab != null)
        return $ev_tab->dbSetAttended(Parameters::get("event_id"),Parameters::get("user_id"));
      return false;
    }
    //error_log("dbUpdateExtra: Unknown value for 'upd':".$upd_what);
    return false;
  } // dbUpdateExtra

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Insert //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  protected function dbInsertItem()
  {
    if ($this->dbValidateInsert() != "")
      return null;

    if (!Parameters::get(ANY_DB_USER_LOGIN))
      Parameters::set(ANY_DB_USER_LOGIN,Parameters::get("user_email"));
    if (defined("WP_PLUGIN")) {
      // Running in Wordpress, let WP handle user creation
      $userdata = array(
        ANY_DB_USER_LOGIN =>  Parameters::get(ANY_DB_USER_LOGIN),
        'user_pass'       =>  Parameters::get('user_pass'),
        'user_nicename'   =>  Parameters::get('user_nicename'),
        'user_email'      =>  Parameters::get('user_email'),
        'user_url'        =>  Parameters::get('user_url'),
        ANY_DB_USER_NAME  =>  Parameters::get(ANY_DB_USER_NAME),
      );
      $user_id = wp_insert_user($userdata);
      if (is_wp_error($user_id)) {
        $err = $user_id->get_error_message();
        $this->setError($err);
        $user_id = null;
      }
      else {
        $this->mMessage = $this->mInsertSuccessMsg;
        $has_perm = is_object($this->mPermission) && $this->mPermission;
        if ($has_perm && !$this->mPermission->is_admin) { // Dont login as the new user if we are admin
          if (!$this->dbLoginUser())
            $this->mMessage .= "Couldn't log in. ";
        }
      }
    }
    else {
      $user_id = null;
      error_log("Non-Wordpress user handling not implemented, using standard dbInsertItem method. ");
      $res = parent::dbInsertItem();
      $this->mMessage = $this->mInsertSuccessMsg;
      return $res;
    }
    //error_log($this->getError().":".var_export($user_id,true));
    return $user_id;
  } // dbInsertItem

  protected function dbLoginUser()
  {
    if (defined("WP_PLUGIN")) {
      // Log in a WordPress user
      $this->setError("");
      $creds = array();
      $creds[ANY_DB_USER_LOGIN] = Parameters::get(ANY_DB_USER_LOGIN);
      $creds['user_password']   = Parameters::get("user_pass");
      $creds['remember']        = true;
      //error_log("Logging in as ".$creds[ANY_DB_USER_LOGIN]);
      $user = wp_signon($creds, false);
      if (is_wp_error($user)) {
        $this->setError($user->get_error_message());
        //error_log($user->get_error_message());
        return false;
      }
      $this->mMessage .= "User logged in. ";
      //error_log($this->mMessage);
    }
    return true;
  } // dbLoginUser

} // class userTable
?>
