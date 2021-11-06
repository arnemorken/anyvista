<?php
  header('Access-Control-Allow-Origin: *');
  $fname = $_GET["f"];
  echo $fname;
  ob_clean();
  flush();
  readfile($fname);
  exit;
?>