<?php
function elog($msg=null)
{
  error_log($msg);
}
function vlog($msg=null,$logVar=null)
{
  error_log($msg.var_export($logVar,true));
}
?>