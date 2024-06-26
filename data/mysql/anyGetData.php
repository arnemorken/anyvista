<?php
/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2024 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ****************************************************************************************/
//
// Gets data from an anyVista database server and returns it in a JSON object.
//
require_once dirname(__FILE__)."/parameters.php";
require_once dirname(__FILE__)."/anyTableFactory.php";

function anyGetData($doEcho=false)
{
/*
Parameters::set("header","true");
Parameters::set("grouping","true");
Parameters::set("type","event");
Parameters::set("from","0");
Parameters::set("num","20");
Parameters::set("order","event_date_start");
Parameters::set("dir","DESC");
*/
/*
Parameters::set("echo","y");
Parameters::set("type","event");
Parameters::set("event_id","21150");
Parameters::set("header","true");
*/
/*
Parameters::set("grouping","false");
Parameters::set("from","0");
Parameters::set("num","20");
Parameters::set("tableFields",array (
  0 => 'r_id',
  1 => 'rank',
  2 => 'rider_name',
  3 => 'rider_no',
  4 => 'times',
  5 => 'gap',
  6 => 'team',
  7 => 'year',
  8 => 'distance',
  9 => 'num_stages',
  10 => 'total_sec',
  11 => 'gap_sec',
  12 => 'result_type',
));
*/
  $type = ltrim(Parameters::get("type"));
  $cmd  = ltrim(Parameters::get("cmd"));

  // Uncomment the next line to log data received from the client
  //Parameters::debugLog(Parameters::getStrArr());

  $table = null;
  $data  = null;

  if ($cmd != "perm" && $type != null && $type != "") {
    try {
      $table = anyTableFactory::createClass($type,null);
      if ($table != null) {
        //$start = microtime(true);
        switch ($cmd) {
          case "cre": $table->dbCreate($type,Parameters::get("table"),Parameters::get("unique")); break;
          case "ins": $data = $table->dbInsert(); break;
          case "upd": $data = $table->dbUpdate(); break;
          case "del": $data = $table->dbDelete(); break;
          default:    $data = $table->dbSearch(); break;
        }
        //$time_elapsed_secs = microtime(true) - $start;
        //error_log("anyGetData: time_elapsed_secs: $time_elapsed_secs");
        $data["permission"] = $table->getPermission();
        $data["message"]    = $table->getMessage();
        $data["error"]      = $table->getError();
      }
      else { // No table
        $data["data"]    = null;
        $data["message"] = "";
        $data["error"]   = anyTableFactory::getError();
      }
    }
    catch (Error $e) {
      $err = "Server exception: ".$e->getMessage();
      if ($data && (is_array($data) || is_object($data)))
        $data["error"] = $err;
      error_log($err);
    }
  }

  // Uncomment to log the data sent to the client (before encoding):
  //error_log("anyGetData data:\n".var_export($data,true));

  // Encapsulate the json string to make it possible to separate it from server errors
  $json_string = "{\"JSON_CODE\":".
                 json_encode($data).
                 "}";
  if ($doEcho)
    echo $json_string;
  //else
  //  echo "{}"; // Must echo valid JSON data

  return $json_string;
}

//
// Get the data
//
anyGetData(Parameters::get("echo") == "y");
?>
