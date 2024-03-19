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
 * Include this file in user defined type classes that are using the anyVista document type with a server backend
 */
  require_once dirname(__FILE__)."/../../anyDefs.php";
  require_once dirname(__FILE__)."/../client.php";
  require_once dirname(__FILE__)."/../document/client.php";
  require_once dirname(__FILE__)."/../event/client.php";
  require_once dirname(__FILE__)."/../group/client.php";
  require_once dirname(__FILE__)."/../user/client.php";
  require_once gDataSource;
  Parameters::set("type","document");
  Parameters::set("from","0");
  Parameters::set("num","20");
  $the_data = anyGetData();
  $gViewArea = "any_content";
?>
<div id="<?php print $gViewArea;?>"/>

<script>
var view_area     = "<?php print $gViewArea;?>";
var data_id       = "<?php echo Parameters::get("document_id");?>";
var serverdata    = <?php echo $the_data;?>;
if (serverdata && serverdata.JSON_CODE)
  serverdata = serverdata.JSON_CODE;
var is_admin      = serverdata.permission && serverdata.permission.is_admin;
var is_logged_in  = serverdata.permission && serverdata.permission.is_logged_in && parseInt(serverdata.permission.current_user_id) > 0;
var is_new        = (data_id == "new" || parseInt(data_id) == -1);
var hide_result   = !is_logged_in || "<?php echo Parameters::get("hide_result_column");?>";
var model_options = { source:       "remote",
                      data:         serverdata ? serverdata.data       : null,
                      message:      serverdata ? serverdata.message    : null,
                      error_server: serverdata ? serverdata.error      : null,
                      permission:   serverdata ? serverdata.permission : null,
                      types:        serverdata ? serverdata.types      : null,
                    };
var model         = new groupModel(model_options); // Groups of documents
var view_options  = { id:            view_area,
                      model:         model,
                      isEditable:    true,
                      isDeletable:   true, //is_admin || is_new,
                      isRemovable:   false,
                      showButtonAdd: false,
                      edit:          is_new,
                      hide_result:   hide_result,
                    };
var view          = new documentViewTabs(view_options);
view.refresh();
</script>
