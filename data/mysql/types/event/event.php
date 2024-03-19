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
 * Include this file in user defined type classes that are using the anyVista event type with a server backend
 */
  require_once dirname(__FILE__)."/../../anyDefs.php";
  require_once dirname(__FILE__)."/../client.php";
  require_once dirname(__FILE__)."/../document/client.php";
  require_once dirname(__FILE__)."/../group/client.php";
  require_once dirname(__FILE__)."/../user/client.php";
  require_once dirname(__FILE__)."/../event/client.php";
  require_once gDataSource;
  Parameters::set("type", "event");
  Parameters::set("from", "0");
  Parameters::set("num",  "20");
  Parameters::set("order","event_date_start");
  Parameters::set("dir",  "DESC");
  $the_data = anyGetData();
  $gViewArea = "any_content";
?>
<div id="<?php print $gViewArea;?>"/>

<script>
var view_area     = "<?php print $gViewArea;?>";
var data_id       = "<?php echo Parameters::get("event_id");?>";
var grouping      = "<?php echo Parameters::get("grouping");?>";
var date_start    = "<?php echo Parameters::get('event_date_start'); ?>";
var date_end      = "<?php echo Parameters::get('event_date_end'); ?>";
var serverdata    = <?php echo $the_data;?>;
if (serverdata && serverdata.JSON_CODE)
  serverdata = serverdata.JSON_CODE;
var is_admin      = serverdata.permission && serverdata.permission.is_admin;
var is_logged_in  = serverdata.permission && serverdata.permission.is_logged_in && parseInt(serverdata.permission.current_user_id) > 0;
var is_new        = (data_id == "new" || parseInt(data_id) == -1) && (!is_logged_in || is_admin);
var is_me         = serverdata.permission && parseInt(serverdata.permission.current_user_id) == parseInt(data_id);
var model_options = { source:       "remote",
                      data:         serverdata ? serverdata.data       : null,
                      message:      serverdata ? serverdata.message    : null,
                      error_server: serverdata ? serverdata.error      : null,
                      permission:   serverdata ? serverdata.permission : null,
                      types:        serverdata ? serverdata.types      : null,
                    };
var model         = new groupModel(model_options); // Groups of events
var view_options  = { id:               view_area,
                      model:            model,
                      showSearcher:     20,
                      isEditable:       true,
                      isDeletable:      true,
                      isRemovable:      true,
                      sortBy:           "event_date_start",
                      sortDirection:    "DESC",
                      edit:             is_new,
                      grouping:         (!grouping || grouping == "false") && grouping != "" ? false : "tabs",
                      event_date_start: date_start,
                      event_date_end:   date_end,
                    };
var view          = new eventViewTabs(view_options);
view.refresh();
</script>
