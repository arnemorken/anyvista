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
//
// Static class with methods for extracting key/value pairs from
// $_GET, $_POST and/or a string, and putting them into an array.
//
require_once "functions.php";

class Parameters
{
  private static $mDebug  = false;
  public  static $isInit  = false;
  private static $mStrarr = null;

  // Constructor
  public function __construct($parStr=null)
  {
    self::$isInit = true;
    Parameters::initFromPOST();
    Parameters::initFromGET();
    Parameters::initFromParStr($parStr);
  }

  public static function getStrArr() { return self::$mStrarr; }

  //
  // Returns:
  // - Value of key, if key is set and has a value
  // - Empty string, if key is set but is blank or null
  // - null, if key is not set
  //
  public static function get($key)
  {
    if (self::$mStrarr != null && array_key_exists($key,self::$mStrarr) && $key != null && $key != "") {
      $keytype = gettype($key);
      if ($keytype == "string") {
        if (isset(self::$mStrarr[$key]) && self::$mStrarr[$key] != null)
          return self::$mStrarr[$key]; // Array key set, and has a value
        return ""; // Array key set, but has no value
      }
    }
    return null; // Array key not set
  } // get

  public static function set($key,$val) { self::$mStrarr[$key]  = $val; }
  public static function deset($key)    { unset(self::$mStrarr[$key]); }

  public static function doReset()
  {
    if (self::$mStrarr != null)
      foreach (self::$mStrarr as $key => $val)
        unset(self::$mStrarr[$key]);
  } // doReset

  private static function initFromPOST()
  {
    if (self::$mDebug)
      error_log("#POST:".count($_POST));
    foreach($_POST as $key=>$val)
      self::$mStrarr[$key] = is_string($val) ? ltrim($val) : $val;
    if (self::$mDebug)
      self::debugLog($_POST);
  } // initFromPOST

  private static function initFromGET()
  {
    if (self::$mDebug)
      error_log("#GET:".count($_GET));
    foreach($_GET as $key=>$val)
      self::$mStrarr[$key] = is_string($val) ? ltrim($val) : $val;
    if (self::$mDebug)
      self::debugLog($_GET);
  } // initFromGET

  public static function initFromParStr($parStr)
  {
    if ($parStr != null)
      $parArr = explode("&",$parStr);
    else
      $parArr = array();
    if (self::$mDebug)
      error_log( "#parArr:".count($parArr));
    foreach($parArr as $key=>$val) {
      $pa  = explode("=",$val);
      $key = $pa[0];
      $val = $pa[1];
      if (isset($key) && $key != null && $key != "" &&
          isset($val) && $val != null && $val != "")
        self::$mStrarr[$key] = $val;
    }
    if (self::$mDebug)
      self::debugLog($parStr);
  } // initFromParStr()

  public static function debugLog($initStr)
  {
    if ($initStr != null)
    foreach($initStr as $key => $val) {
      if (is_array($initStr[$key]))
        error_log($key."=".var_export($initStr[$key],true));
      else
        error_log($key."=".$initStr[$key]);
    }
    if (isset($_FILES["URL_file"]))
      error_log("filename:".$_FILES["URL_file"]);
  } //debugLog

} // class Parameters

//
// Initialize the static class
//
if (!Parameters::$isInit)
  new Parameters();
?>
