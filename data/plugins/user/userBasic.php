<?php
  require_once dirname(__FILE__)."/../../anyDefs.php";
  require_once gDataSource;
  Parameters::set("type","user");
  $the_data = anyGetData();
?>
<style>
#any_content {
  width:        800px;
  border-top:   1px solid #333;
}
</style>
<div id="any_content"/>

<script>
var serverdata = <?php echo $the_data;?>;
if (serverdata && serverdata.JSON_CODE)
  serverdata = serverdata.JSON_CODE;
var model = new userDataModel({ data:       serverdata ? serverdata.data : null,
                                permission: serverdata ? serverdata.permission : null,
                                plugins:    serverdata ? serverdata.plugins : null,
                                mode:       "remote",
                             });
var data_id      = "<?php echo Parameters::get("user_id");?>";
var is_admin     = model.permission && model.permission.is_admin;
var is_logged_in = model.permission && model.permission.is_logged_in && parseInt(model.permission.current_user_id) > 0;
var is_new       = (data_id == "new" || parseInt(data_id) == -1) && (!is_logged_in || is_admin);
var is_me        = model.permission && parseInt(model.permission.current_user_id) == parseInt(data_id);
var view = new userDataViewTabs({ id:          "any_content",
                                  model:       model,
                                  isEditable:  true, //is_admin || is_new || is_me,
                                  isDeletable: true, //is_admin || is_new || is_me,
                                  isRemovable: false,
                                  edit:        is_new,
                                  dispEmail:   is_admin || is_me || is_new,
                               });
view.refresh(null,null,null,"user");
</script>
