<?php
/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2022 Arne D. Morken and Balanse Software.
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
  $type = ltrim(Parameters::get("type"));
  $cmd  = ltrim(Parameters::get("cmd"));

  // Uncomment to log the data received from the client to the error log:
  //Parameters::debugLog(Parameters::getStrArr());

  $table = null;
  $data  = null;

  if ($cmd != "perm" && $type != null && $type != "") {
    $table = anyTableFactory::create($type,null);
    if ($table != null) {
      switch ($cmd) {
        case "cre": $data = $table->dbCreate();     break;
        case "ins": $data = $table->dbInsert();     break;
        case "upd": $data = $table->dbUpdate();     break;
        case "add": $data = $table->dbAddLink();    break;
        case "rem": $data = $table->dbRemoveLink(); break;
        case "del": $data = $table->dbDelete();     break;
        default:    $data = $table->dbSearch();     break;
      }
      if ($table->isError() || $table->mErrorListLeftJoin ||
          Parameters::get("search") === "no" || Parameters::get("search") === "false" ||
          Parameters::get($table->getIdKey()) === "") {
        $data = $table->getData();
        if ($data !== null && !empty($data))
          $data = $table->prepareData($data);
      }
      $data["permission"] = $table->getPermission();
      $data["message"]    = $table->getMessage();
      $data["error"]      = $table->getError();
      if ($table->mErrorListLeftJoin)
        $data["error"] .= $table->mErrorListLeftJoin;
    }
    else { // No table
      $data["data"]    = null;
      $data["message"] = "";
      $data["error"]   = anyTableFactory::getError();
    }
  }

  // Uncomment to log the data sent to the client (before encoding):
  //error_log("anyGetData data:\n".var_export($data,true));

  // Encapsulate the json string to make it possible to separate it from server errors
  $json_string = "{\"JSON_CODE\":".
                 json_encode($data).
                 "}";
  //error_log("anyGetData json data:\n".var_export(json_encode($data),true));

  //header('Access-Control-Allow-Origin: *');
  //header("Content-Type: application/json");
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
