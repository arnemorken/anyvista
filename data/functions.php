<?php
function elog($msg=null)
{
  error_log($msg);
}
function vlog($msg=null,$logVar)
{
  error_log($msg.var_export($logVar,true));
}

?>