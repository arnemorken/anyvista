<?php
require_once dirname(__FILE__)."/../../anyDefs.php";

define("ERR_RIDER_NAME",  "Rider names do not match. ");
define("ERR_BORN_DATE",   "Rider birth dates do not match. ");
define("ERR_BRAKE_TYPE",  "Brakes do not match. ");
define("ERR_COURSE_NAME", "Course names do not match. ");
define("ERR_TERRAIN",     "Terrain names do not match. ");
define("ERR_DATE",        "Illegal ride date. ");
define("ERR_DISTANCE",    "Distances do not match. ");
define("ERR_NOT_FINISHED","Stage was not completed. ");

// imf
define("LAP_DATA",              110);
define("NOTES",                 120);
define("RIDER_INFORMATION",     210);
define("GENERAL_INFO_VR",      4010);
define("COURSE_DATA",          4020);
define("RIDE_INFORMATION",     4030);
define("RIDE_DATA",            4040);
// caf
define("UNKNOWN_RLV",           130);
define("GENERAL_INFORMATION",  1010);
define("PROGRAM",              1020);
define("RIDE_INFORMATION_CAF", 3010);
define("RIDE_DATA_CAF",        3020);
define("RLV_MC_INFORMATION",   6010);
define("RLV_ITEMMULTISECT",    6020);
// rlv
define("RLV_VIDEO_INFO",       2010);
define("RLV_FRAMEDIST_MAPPING",2020);
define("RLV_INFOBOX_INFO",     2030);
define("COURSE_INFORMATION",   2040);

class TacxReader
{
  private $mBrakeType   = 0;    // Trainer
  private $mRiderName   = null;
  private $mBornDate    = null;
  private $mCourseName  = null;
  private $mTerrain     = null; // imf only
  private $mDistance    = 0;
  private $mDate        = null;
  private $mNotFinished = true;
  private $mDuration    = 0;    // The final result

  public function getResult() { return $this->mDuration; }

  private $mDebug = false;
  private $fileName = null;
  private $HEADER_SIZE    = 8;
  private $INFOBLOCK_SIZE = 12;
  private $format = array(
          "HEADER"                => "sFileFingerprint/sFileVersion/iBlockCount/",
          "INFOBLOCK"             => "sBlockFingerprint/sBlockVersion/iRecordCount/iRecordSize/",
          // imf
          "GENERAL_INFO_VR"       => "iCheckSum/a34CourseName/a34Terrain/fRecordInterval/dCourseDistance/dRunTime/iCoolDownCount/iRunFlags/iBrakeType/",
          "COURSE_DATA"           => "fX/fY/fZ/fAlpha/fBeta/fGamma/CHeartRate/cCadence/sPowerX10/sSpeedX10/fTerrainAngle/fForkAngle/",
          "RIDE_INFORMATION"      => "a34CourseName/a34Terrain/sYear/sMonth/sDayOfWeek/sDayOfMonth/sHour/sMinute/sSecond/sMillisecond/fRecordInterval/dDistance/dDuration/iCoolDownCount/iNotFinished/CHRMin/CHRMax/a42Feeling/a22Temperature/sVendorID/sProductID/x104/", // Skip the rest of the data
          "RIDER_INFORMATION"     => "a34Team/a34RiderName/fWeight/cGender/fHeight/iBirthYear/cBirthMonth/cBirthDay/CHRMax/CHRRest/CHRAThreshold/CHRZone1/CHRZone2/CHRZone3/CHRZone4/CHRZone5/a522Email/a66Country/a522Remarks/",
          "LAP_DATA"              => "cLapTime/",
          "NOTES"                 => "cCharacter/",
          "RIDE_DATA"             => "fX/fY/fZ/fAlpha/fBeta/fGamma/CHR/cCadence/sPowerX10/sSpeedX10/fTerrainAngle/fForkAngle/",
          // caf
          "UNKNOWN_RLV"           => "x8/",
          "GENERAL_INFORMATION"   => "iCheckSum/a34CourseName/iWattSlopePulse/iTimeDist/dTotalTimeDist/dEnergyCons/fAltitudeStart/iBrakeCategory/",
          "PROGRAM"               => "fDurationDistance/fPulseSlopeWatts/fRollingFriction/",
          "RIDE_INFORMATION_CAF"  => "sYear/sMonth/sDayOfWeek/sDayOfMonth/sHour/sMinute/sSecond/sMillisecond/fRecordInterval/dDistance/dDuration/iCoolDownCount/iNotFinished/CHRMin/CHRMax/a42Feeling/a22Temperature/sVendorID/sBrakeType/x90", // Skip the rest of the data
          "RIDE_DATA_CAF"         => "fDistance/CHR/cCadence/sPowerX10/sSpeedX10/",
          "RLV_MC_INFORMATION"    => "x604/",
          "RLV_ITEMMULTISECT"     => "x650",
          // rlv
          "RLV_VIDEO_INFO"        => "a522VideoFileName/fFrameRate/fOrgRunWeight/iFrameOffset/",
          "RLV_FRAMEDIST_MAPPING" => "iFrameNumber/fDistancePerFrame/",
          "RLV_INFOBOX_INFO"      => "iFrame/fCmd/",
          "COURSE_INFORMATION"    => "fStart/fEnd/",
          );
  private $HEADER = null;
  // imf
  private $GENERAL_INFO_VR       = Array();
  private $COURSE_DATA           = Array();
  private $RIDE_INFORMATION      = Array();
  private $RIDER_INFORMATION     = Array();
  private $LAP_DATA              = Array();
  private $NOTES                 = Array();
  private $RIDE_DATA             = Array();
  // caf
  private $UNKNOWN_RLV           = Array();
  private $GENERAL_INFORMATION   = Array();
  private $PROGRAM               = Array();
  private $RIDE_INFORMATION_CAF  = Array();
  private $RIDE_DATA_CAF         = Array();
  private $RLV_MC_INFORMATION    = Array();
  private $RLV_ITEMMULTISECT     = Array();
  // rlv
  private $RLV_VIDEO_INFO        = Array();
  private $RLV_FRAMEDIST_MAPPING = Array();
  private $RLV_INFOBOX_INFO      = Array();
  private $COURSE_INFORMATION    = Array();

  public function parseFile($fileType,$path,$fname)
  {
    // Read and process file
    $cwd = getcwd();
    chdir($path);
    //error_log("filename:".$path.$fname);
    if (!file_exists($path.$fname)) {
      error_log($path.$fname." does not exist");
      chdir($cwd);
      return false;
    }
    $this->mFileName = $path.$fname;
    $handle = fopen($this->mFileName, "rb");
    if (!$handle) {
      error_log($this->mFileName.": fopen failed");
      chdir($cwd);
      return false;
    }
    //error_log("Parsing $this->mFileName");
    list($this->HEADER,$blockCount) = $this->readBlock($handle,"HEADER",$this->HEADER_SIZE);
    if ($this->mDebug) error_log("HEADER ($blockCount):".var_export($this->HEADER,true));
    if ($blockCount > 300) {
      chdir($cwd);
      return false;
    }
    for ($i=0; $i<=$blockCount-1; $i++) {
      list($infoblock,$recordCount,$recordSize) = $this->readBlock($handle,"INFOBLOCK",$this->INFOBLOCK_SIZE);
      if ($this->mDebug) error_log("INFOBLOCK ($recordCount,$recordSize):".var_export($infoblock,true));
      switch ($infoblock["BlockFingerprint"]) {
        // imf
        case GENERAL_INFO_VR:
          if ($this->mDebug) error_log("GENERAL_INFO_VR ($recordCount,$recordSize):");
          for ($j=0; $j<$recordCount; $j++) {
            list($this->GENERAL_INFO_VR[$j])    = $this->readBlock($handle,"GENERAL_INFO_VR",$recordSize);
            if ($this->mDebug) error_log($j.":".var_export($this->GENERAL_INFO_VR[$j],true));
          }
          break;
        case COURSE_DATA:
          if ($this->mDebug) error_log("COURSE_DATA ($recordCount,$recordSize):");
          for ($j=0; $j<$recordCount; $j++) {
            list($this->COURSE_DATA[$j])        = $this->readBlock($handle,"COURSE_DATA",$recordSize);
            if ($this->mDebug) error_log($j.":".var_export($this->COURSE_DATA[$j],true));
          }
          break;
        case RIDE_INFORMATION:
          if ($this->mDebug) error_log("RIDE_INFORMATION ($recordCount,$recordSize):");
          for ($j=0; $j<$recordCount; $j++) {
            list($this->RIDE_INFORMATION[$j])   = $this->readBlock($handle,"RIDE_INFORMATION",$recordSize);
            if ($this->mDebug) error_log($j.":". var_export($this->RIDE_INFORMATION[$j],true));
          }
          break;
        case RIDER_INFORMATION:
          if ($this->mDebug) error_log("RIDER_INFORMATION ($recordCount,$recordSize):");
          for ($j=0; $j<$recordCount; $j++) {
            list($this->RIDER_INFORMATION[$j])  = $this->readBlock($handle,"RIDER_INFORMATION",$recordSize);
            if ($this->mDebug) error_log($j.":". var_export($this->RIDER_INFORMATION[$j],true));
          }
          break;
        case NOTES:
          if ($this->mDebug) error_log("NOTES ($recordCount,$recordSize):");
          for ($j=0; $j<$recordCount; $j++) {
            list($this->NOTES[$j])              = $this->readBlock($handle,"NOTES",$recordSize);
            if ($this->mDebug) error_log($j.":". var_export($this->NOTES[$j],true));
          }
          break;
        case LAP_DATA:
          if ($this->mDebug) error_log("LAP_DATA ($recordCount,$recordSize):");
          for ($j=0; $j<$recordCount; $j++) {
            list($this->LAP_DATA[$j])           = $this->readBlock($handle,"LAP_DATA",$recordSize);
            if ($this->mDebug) error_log($j.":". var_export($this->LAP_DATA[$j],true));
          }
          break;
        case RIDE_DATA:
          if ($this->mDebug) error_log("RIDE_DATA ($recordCount,$recordSize):");
          for ($j=0; $j<$recordCount; $j++) {
            list($this->RIDE_DATA[$j])          = $this->readBlock($handle,"RIDE_DATA",$recordSize);
            if ($this->mDebug) error_log($j.":".var_export($this->RIDE_DATA[$j],true));
          }
          break;
        // caf
        case UNKNOWN_RLV:
          if ($this->mDebug) error_log("UNKNOWN_RLV ($recordCount,$recordSize):");
          for ($j=0; $j<$recordCount; $j++) {
            list($this->UNKNOWN_RLV[$j])   = $this->readBlock($handle,"UNKNOWN_RLV",$recordSize);
            if ($this->mDebug) error_log($j.":". var_export($this->UNKNOWN_RLV[$j],true));
          }
          break;
        case GENERAL_INFORMATION:
          if ($this->mDebug) error_log("GENERAL_INFORMATION ($recordCount,$recordSize):");
          for ($j=0; $j<$recordCount; $j++) {
            list($this->GENERAL_INFORMATION[$j])   = $this->readBlock($handle,"GENERAL_INFORMATION",$recordSize);
            if ($this->mDebug) error_log($j.":". var_export($this->GENERAL_INFORMATION[$j],true));
          }
          break;
        case PROGRAM:
          if ($this->mDebug) error_log("PROGRAM ($recordCount,$recordSize):");
          for ($j=0; $j<$recordCount; $j++) {
            list($this->PROGRAM[$j])   = $this->readBlock($handle,"PROGRAM",$recordSize);
            if ($this->mDebug) error_log($j.":". var_export($this->PROGRAM[$j],true));
          }
          break;
        case RIDE_INFORMATION_CAF:
          if ($this->mDebug) error_log("RIDE_INFORMATION_CAF ($recordCount,$recordSize):");
          for ($j=0; $j<$recordCount; $j++) {
            list($this->RIDE_INFORMATION_CAF[$j])   = $this->readBlock($handle,"RIDE_INFORMATION_CAF",$recordSize);
            if ($this->mDebug) error_log($j.":". var_export($this->RIDE_INFORMATION_CAF[$j],true));
          }
          break;
        case RIDE_DATA_CAF:
          if ($this->mDebug) error_log("RIDE_DATA_CAF ($recordCount,$recordSize):");
          for ($j=0; $j<$recordCount; $j++) {
            list($this->RIDE_DATA_CAF[$j])   = $this->readBlock($handle,"RIDE_DATA_CAF",$recordSize);
            if ($this->mDebug) error_log($j.":". var_export($this->RIDE_DATA_CAF[$j],true));
          }
          break;
        case RLV_MC_INFORMATION:
          if ($this->mDebug) error_log("RLV_MC_INFORMATION ($recordCount,$recordSize):");
          for ($j=0; $j<$recordCount; $j++) {
            list($this->RLV_MC_INFORMATION[$j])   = $this->readBlock($handle,"RLV_MC_INFORMATION",$recordSize);
            if ($this->mDebug) error_log($j.":". var_export($this->RLV_MC_INFORMATION[$j],true));
          }
          break;
        case RLV_ITEMMULTISECT:
          if ($this->mDebug) error_log("RLV_ITEMMULTISECT ($recordCount,$recordSize):");
          for ($j=0; $j<$recordCount; $j++) {
            list($this->RLV_ITEMMULTISECT[$j])   = $this->readBlock($handle,"RLV_ITEMMULTISECT",$recordSize);
            if ($this->mDebug) error_log($j.":". var_export($this->RLV_ITEMMULTISECT[$j],true));
          }
          break;
        // rlv
        case RLV_VIDEO_INFO:
          if ($this->mDebug) error_log("RLV_VIDEO_INFO ($recordCount,$recordSize):");
          for ($j=0; $j<$recordCount; $j++) {
            list($this->RLV_VIDEO_INFO[$j])    = $this->readBlock($handle,"RLV_VIDEO_INFO",$recordSize);
            if ($this->mDebug) error_log($j.":".var_export($this->RLV_VIDEO_INFO[$j],true));
          }
          break;
        case RLV_FRAMEDIST_MAPPING:
          if ($this->mDebug) error_log("RLV_FRAMEDIST_MAPPING ($recordCount,$recordSize):");
          for ($j=0; $j<$recordCount; $j++) {
            list($this->RLV_FRAMEDIST_MAPPING[$j])        = $this->readBlock($handle,"RLV_FRAMEDIST_MAPPING",$recordSize);
            if ($this->mDebug) error_log($j.":".var_export($this->RLV_FRAMEDIST_MAPPING[$j],true));
          }
          break;
        case RLV_INFOBOX_INFO:
          if ($this->mDebug) error_log("RLV_INFOBOX_INFO ($recordCount,$recordSize):");
          for ($j=0; $j<$recordCount; $j++) {
            list($this->RLV_INFOBOX_INFO[$j])   = $this->readBlock($handle,"RLV_INFOBOX_INFO",$recordSize);
            if ($this->mDebug) error_log($j.":". var_export($this->RLV_INFOBOX_INFO[$j],true));
          }
          break;
        case COURSE_INFORMATION:
          if ($this->mDebug) error_log("COURSE_INFORMATION ($recordCount,$recordSize):");
          for ($j=0; $j<$recordCount; $j++) {
            list($this->COURSE_INFORMATION[$j])   = $this->readBlock($handle,"COURSE_INFORMATION",$recordSize);
            if ($this->mDebug) error_log($j.":". var_export($this->COURSE_INFORMATION[$j],true));
          }
          break;
      }
    }
    fclose($handle);
    $this->extractInfo($fileType);
    chdir($cwd);
    return true;
  } // parseFile

  private function readBlock($handle,$blockName,$recordSize=1)
  {
    if ($recordSize <= 0)
      return array(null,0,0);
    $contents = fread($handle, $recordSize);
    $file_data[$blockName] = unpack($this->format[$blockName],$contents);
    $recordCount = 0;
    $recordSize  = 0;
    if ($blockName == "HEADER")
      $recordCount = $file_data[$blockName]["BlockCount"];
    else
    if (isset($file_data[$blockName]["RecordCount"]) && isset($file_data[$blockName]["RecordSize"])) {
      $recordCount = $file_data[$blockName]["RecordCount"];
      $recordSize  = $file_data[$blockName]["RecordSize"];
    }
    return array($file_data[$blockName],$recordCount,$recordSize);
  } // readBlock

  private function extractInfo($fileType)
  {
    // Extract essential information
    if ($fileType == "imf") {
      // imf
      $this->mBrakeType  = str_replace("\0", "", $this->GENERAL_INFO_VR[0]["BrakeType"]);
      $this->mRiderName  = str_replace("\0", "", trim($this->RIDER_INFORMATION[0]["RiderName"]));
      $yyyy = str_replace("\0", "", $this->RIDER_INFORMATION[0]["BirthYear"]);
      $mm   = str_replace("\0", "", $this->RIDER_INFORMATION[0]["BirthMonth"]); if ((int)$mm<10) $mm = "0".$mm;
      $dd   = str_replace("\0", "", $this->RIDER_INFORMATION[0]["BirthDay"]);   if ((int)$dd<10) $dd = "0".$dd;
      $this->mBornDate   = $yyyy."-".$mm."-".$dd;
      $this->mCourseName = str_replace("\0", "", trim($this->GENERAL_INFO_VR[0]["CourseName"]));
      $this->mTerrain    = str_replace("\0", "", trim($this->GENERAL_INFO_VR[0]["Terrain"]));
      $this->mDistance   = str_replace("\0", "", trim($this->RIDE_INFORMATION[0]["Distance"]));
      if (array_key_exists("Year",$this->RIDE_INFORMATION[0]) && array_key_exists("Month",$this->RIDE_INFORMATION[0]) && array_key_exists("DayOfMonth",$this->RIDE_INFORMATION[0])) {
        $yyyy = str_replace("\0", "", trim($this->RIDE_INFORMATION[0]["Year"]));
        $mm   = str_replace("\0", "", trim($this->RIDE_INFORMATION[0]["Month"]));       if ((int)$mm<10) $mm = "0".$mm;
        $dd   = str_replace("\0", "", trim($this->RIDE_INFORMATION[0]["DayOfMonth"]));  if ((int)$dd<10) $dd = "0".$dd;
        $this->mDate = $yyyy."-".$mm."-".$dd;
      }
      else
        $this->mDate = "0000-01-01";
      $this->mNotFinished = $this->RIDE_INFORMATION[0]["NotFinished"];
      $this->mDuration    = $this->RIDE_INFORMATION[0]["Duration"];
    }
    else
    if ($fileType == "caf") {
      // caf
      $this->mBrakeType  = str_replace("\0", "", $this->RIDE_INFORMATION_CAF[0]["BrakeType"]);
      $this->mRiderName  = str_replace("\0", "", trim($this->RIDER_INFORMATION[0]["RiderName"]));
      $yyyy = str_replace("\0", "", $this->RIDER_INFORMATION[0]["BirthYear"]);
      $mm   = str_replace("\0", "", $this->RIDER_INFORMATION[0]["BirthMonth"]); if ((int)$mm<10) $mm = "0".$mm;
      $dd   = str_replace("\0", "", $this->RIDER_INFORMATION[0]["BirthDay"]);   if ((int)$dd<10) $dd = "0".$dd;
      $this->mBornDate   = $yyyy."-".$mm."-".$dd;
      $this->mCourseName = str_replace("\0", "", trim($this->GENERAL_INFORMATION[0]["CourseName"]));
      $this->mDistance   = str_replace("\0", "", trim($this->RIDE_INFORMATION_CAF[0]["Distance"]));
      if (array_key_exists("Year",$this->RIDE_INFORMATION_CAF[0]) && array_key_exists("Month",$this->RIDE_INFORMATION_CAF[0]) && array_key_exists("DayOfMonth",$this->RIDE_INFORMATION_CAF[0])) {
        $yyyy = str_replace("\0", "", trim($this->RIDE_INFORMATION_CAF[0]["Year"]));
        $mm   = str_replace("\0", "", trim($this->RIDE_INFORMATION_CAF[0]["Month"]));       if ((int)$mm<10) $mm = "0".$mm;
        $dd   = str_replace("\0", "", trim($this->RIDE_INFORMATION_CAF[0]["DayOfMonth"]));  if ((int)$dd<10) $dd = "0".$dd;
        $this->mDate = $yyyy."-".$mm."-".$dd;
      }
      else
        $this->mDate = "0000-01-01";
      $this->mNotFinished = $this->RIDE_INFORMATION_CAF[0]["NotFinished"];
      $this->mDuration    = $this->RIDE_INFORMATION_CAF[0]["Duration"];
    }
    else
    if ($fileType == "rlv") {
      // Not implemented
    }
  }

  //
  // Validation methods
  //

  private function validateBrakeType($trainers)
  {
    for ($t=0; $t<count($trainers); $t++)
      if ($trainers[$t] == $this->mBrakeType)
        return null;
    return ERR_BRAKE_TYPE." (".$this->mBrakeType.") ";
  }

  private function validateRiderName($riderName)
  {
    $n1 = trim($riderName);
    $n2 = trim($this->mRiderName);
    if ($n1 != $n2) {
      return ERR_RIDER_NAME."(".$n1."/".utf8_encode($n2).") ";
    }
    return null;
  }

  private function validateRiderBorn($riderBirth)
  {
    if ($riderBirth != $this->mBornDate)
      return ERR_BORN_DATE." (".$riderBirth."/".$this->mBornDate.") ";
    return null;
  }

  private function validateCourseName($stageCourse)
  {
    //$fn_det = explode("_",$this->mFileName);
    //$cname  = trim($fn_det[0]);
    if ($stageCourse != $this->mCourseName/* || $cname != $this->mCourseName*/)
      return ERR_COURSE_NAME." (".$stageCourse."/".$this->mCourseName.") ";
    return null;
  }

  private function validateTerrain($stageTerrain) // imf only
  {
    if ($stageTerrain != $this->mTerrain)
      return ERR_TERRAIN." (".$stageTerrain."/".$this->mTerrain.") ";
    return null;
  }

  private function validateDate($stageStartDate,$stageEndDate)
  {
    $sd = explode(" ",$stageStartDate);
    $ed = explode(" ",$stageEndDate);
    $sd = trim($sd[0]);
    $ed = trim($ed[0]);
    if ($this->mDate < $sd || $this->mDate > $ed)
      return ERR_DATE." (".$sd."-".$ed."/".$this->mDate.") ";
    return null;
  }

  private function validateDistance($stageDistance)
  {
    if ((int)$stageDistance < (int)($this->mDistance - 10) ||
        (int)$stageDistance > (int)($this->mDistance + 10))
      return ERR_DISTANCE." (".(int)$stageDistance."/".(int)$this->mDistance.") ";
    return null;
  }

  private function validateFinished()
  {
    if ($this->mNotFinished != 0)
      return ERR_NOT_FINISHED;
    return null;
  }

  public function validateData($fileType,$trainers,$user_name,$birth,$stage_name,$stage_terrain,$stage_distance,$start,$end)
  {
    $err = null;
    $err .= $this->validateBrakeType($trainers);      // GENERAL_INFO_VR. Validate against rider profile
    $err .= $this->validateRiderName($user_name);     // RIDER_INFORMATION. Validate against file name and stage profile
    $err .= $this->validateRiderBorn($birth);         // RIDER_INFORMATION. Validate against rider profile
    $err .= $this->validateCourseName($stage_name);   // GENERAL_INFO_VR and RIDE_INFORMATION. Validate against file name and stage profile
    if ($fileType == "imf")
      $err .= $this->validateTerrain($stage_terrain); // GENERAL_INFO_VR and RIDE_INFORMATION. Validate against stage profile
    $err .= $this->validateDate($start,$end);         // RIDE_INFORMATION. Should be within interval in stage profile
    $err .= $this->validateDistance($stage_distance); // RIDE_INFORMATION. Validate against stage profile
    $err .= $this->validateFinished();   // RIDE_INFORMATION. Only finished rides are valid
    ///error_log("err:".$err);
    return $err; // Error message or null if no errors
  } // validateData

} // class TacxReader
?>
