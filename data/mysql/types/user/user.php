<?php
/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2024 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ****************************************************************************************/
/*
 * Include this file in user defined type classes that are using the anyVista user type with a server backend
 */
  require_once dirname(__FILE__)."/../../anyDefs.php";
  require_once dirname(__FILE__)."/../client.php";
  require_once dirname(__FILE__)."/../document/client.php";
  require_once dirname(__FILE__)."/../event/client.php";
  require_once dirname(__FILE__)."/../group/client.php";
  require_once dirname(__FILE__)."/../user/client.php";
  require_once gDataSource;
  Parameters::set("type","user");
  Parameters::set("from","0");
  Parameters::set("num","20");
  $the_data = anyGetData();
  $gViewArea = "any_content";
?>
<div id="<?php print $gViewArea;?>"/>

<script>
var view_area     = "<?php print $gViewArea;?>";
var data_id       = "<?php echo htmlspecialchars(Parameters::get('user_id'));?>";
var serverdata    = <?php echo $the_data;?>;
if (serverdata && serverdata.JSON_CODE)
  serverdata = serverdata.JSON_CODE;
var is_admin      = serverdata.permission && serverdata.permission.is_admin;
var is_logged_in  = serverdata.permission && serverdata.permission.is_logged_in && parseInt(serverdata.permission.current_user_id) > 0;
var is_new        = (data_id == "new" || parseInt(data_id) == -1) && (!is_logged_in || is_admin);
var is_me         = serverdata.permission && parseInt(serverdata.permission.current_user_id) == parseInt(data_id);
var model_options = { source:       "remote",
                      data:         serverdata ? serverdata.data       : null,
                      id:           data_id,
                      message:      serverdata ? serverdata.message    : null,
                      error_server: serverdata ? serverdata.error      : null,
                      permission:   serverdata ? serverdata.permission : null,
                      link_types:   serverdata ? serverdata.link_types : null,
                    };
var model         = new groupModel(model_options); // Groups of users
var view_options  = { id:          view_area,
                      model:       model,
                      isEditable:  is_admin || is_new || is_me,
                      isDeletable: is_admin || is_new || is_me,
                      isRemovable: is_admin,
                      edit:        is_new,
                    };
var view          = new userViewTabs(view_options);
view.refresh();
</script>
