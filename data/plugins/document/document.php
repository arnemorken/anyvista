<?php
/****************************************************************************************
 *
 * anyList is copyright (C) 2011-2021 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyList Commercial License for commercial use.
 * Get licences here: http://balanse.info/anylist/license/ (coming soon).
 *
 ****************************************************************************************/
/*
 * Include this file in plugins that are using the anyList document plugin with a server backend
 */
  require_once dirname(__FILE__)."/../../anyDefs.php";
  require_once dirname(__FILE__)."/../client.php";
  require_once dirname(__FILE__)."/../document/client.php";
  require_once dirname(__FILE__)."/../event/client.php";
  require_once dirname(__FILE__)."/../group/client.php";
  require_once dirname(__FILE__)."/../user/client.php";
  require_once gDataSource;
  $gViewArea = "any_content";
  Parameters::set("type","document");
  Parameters::set("from","0");
  Parameters::set("num","20");
  $the_data = anyGetData();
?>
<div id="<?php print $gViewArea;?>"/>

<script>
var serverdata = <?php echo $the_data;?>;
if (serverdata && serverdata.JSON_CODE)
  serverdata = serverdata.JSON_CODE;
var model = new documentModel({ mode:         "remote",
                                data:         serverdata ? serverdata.data : null,
                                message:      serverdata ? serverdata.message: null,
                                error_server: serverdata ? serverdata.error: null,
                                permission:   serverdata ? serverdata.permission : null,
                                plugins:      serverdata ? serverdata.plugins : null,
                             });
var data_id      = "<?php echo Parameters::get("document_id");?>";
var is_admin     = model.permission && model.permission.is_admin;
var is_logged_in = model.permission && model.permission.is_logged_in && parseInt(model.permission.current_user_id) > 0;
var is_new       = (data_id == "new" || parseInt(data_id) == -1);

var hide_result  = !is_logged_in || "<?php echo Parameters::get("hide_result_column");?>";

var view = new documentViewTabs({ id:            "<?php print $gViewArea;?>",
                                  model:         model,
                                  isEditable:    true,
                                  isDeletable:   true, //is_admin || is_new,
                                  isRemovable:   false,
                                  edit:          is_new,
                                  showButtonAdd: false,
                                  hide_result:   hide_result,
                               });
view.refresh();
</script>
