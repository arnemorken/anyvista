<?php
/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2024 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ****************************************************************************************/
/**
 * __Static class for creating an anyVista table.__
 *
 * @class anyTableFactory
 */
require_once dirname(__FILE__)."/anyDefs.php";
require_once dirname(__FILE__)."/db/dbTable.php";

class anyTableFactory
{
  protected static $mDBConn = null;
  private   static $mError  = "";
  private   static $mTables = array();

  public static function getError()  { return self::$mError; }
  public static function getTables() { return self::$mTables; }

  /**
   * Creates a table class of type `type`, or returns it if it already exists.
   * Does not create the actual database table.
   *
   * @param string   type      The table type.
   * @param anyTable hostTable An optional "host table".
   *
   * @return object|null Data object, or null on error or no data
   *
   * #### Example
   *    $myTable = anyTableFactory::createClass("user")
   */
  public static function createClass($type,$hostTable=null)
  {
    self::$mError = "";
    if ($type == null || $type == "") {
      self::$mError = "anyTableFactory: type missing. ";
      error_log(self::$mError);
      return null;
    }
    self::$mDBConn = new dbConnection(); // Connect to database
    if (self::$mDBConn->mError != "" && self::$mDBConn->mError != null) {
      self::$mError = self::$mDBConn->mError;
      return null;
    }
    $class_name = $type."Table";
    if (!array_key_exists($type,self::$mTables)) {
      $file_name  = "types/".$type."/".$class_name.".php";
      chdir(dirname(__FILE__)); // Make sure we are in the right place to include type files
      if (!file_exists($file_name)) {
        self::$mError = "anyTableFactory: Table file '$file_name' not found, using default table file 'anyTable.php'. ";
        error_log(self::$mError);
        require_once "anyTable.php";
      }
      else {
        require_once $file_name;
      }
    }
    if (!class_exists($class_name)) {
      self::$mError = "anyTableFactory: Class '$class_name' not found, using default table class 'anyTable'. ";
      error_log(self::$mError);
      $class_name = "anyTable";
      self::$mTables[$type] = new $class_name(self::$mDBConn,$type);
    }
    else
      self::$mTables[$type] = new $class_name(self::$mDBConn);
    if (self::$mTables[$type] == null) {
      self::$mError = "Unknown table: ".$type;
      error_log(self::$mError);
    }
    else {
      if (self::$mTables[$type]->isError())
        return null;
      if ($hostTable == null)
        self::$mTables[$type]->setHostTable(self::$mTables[$type]);
      else
        self::$mTables[$type]->setHostTable($hostTable);
    }
    return self::$mTables[$type];
  } // createClass

} // class anyTableFactory
?>
