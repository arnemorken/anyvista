<?php
  require_once dirname(__FILE__)."/../../anyDefs.php";
  require_once gDataSource;
  Parameters::set("type","group");
  $the_data = anyGetData();
?>

<div id="any_content"/>

<script>
var serverdata = <?php echo $the_data;?>;
if (serverdata && serverdata.JSON_CODE)
  serverdata = serverdata.JSON_CODE;
var model = new groupDataModel({ data:       serverdata ? serverdata.data : null,
                                 permission: serverdata ? serverdata.permission : null,
                                 plugins:    serverdata ? serverdata.plugins : null,
                                 mode:       "remote",
                              });
var data_id      = "<?php echo Parameters::get("group_id");?>";
var is_admin     = model.permission && model.permission.is_admin;
var is_logged_in = model.permission && model.permission.is_logged_in && parseInt(model.permission.current_user_id) > 0;
var is_new       = (data_id == "new" || parseInt(data_id) == -1);

var view = new groupDataViewTabs({ id:          "any_content",
                                   model:       model,
                                   isEditable:  true, //is_admin || is_new,
                                   isDeletable: true, //is_admin || is_new,
                                   isRemovable: false,
                                   edit:        is_new,
                                });
view.refresh(null,null,null,"group");
</script>
