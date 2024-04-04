var groupTable = function (connection,parameters)
{
  anyTable.call(this,connection,parameters);

  this.className          = "groupTable";
  this.type               = "group";
  this.idKey              = "group_id";
  this.nameKey            = "group_name";
  this.tableName          = "any_group";


  this.linking = { "event":    [ "any_event_group",    "eventTable" ],
                   "document": [ "any_document_group", "documentTable" ],
                   "user":     [ "any_group_user",     "userTable" ],
                 };
  this.tableFields = [
    "group_id",
    "group_type",
    "group_name",
    "group_description",
    "group_sort_order",
    "parent_id",
  ];
  this.sqlCreate = "\
    CREATE TABLE IF NOT EXISTS any_group (\
      group_id          varchar(16) PRIMARY KEY AUTOINCREMENT,\
      group_name        varchar(60),\
      group_description varchar(200),\
      parent_id         integer,\
      group_type        varchar(20),\
      group_sort_order  integer,\
      group_status      varchar(16),\
      group_privacy     varchar(11),\
      domain_id         integer,\
      header_image      varchar(64),\
      group_payment     varchar(10),\
      UNIQUE(group_id));\
    ";
}; // constructor

groupTable.prototype = new anyTable();
groupTable.prototype.constructor = groupTable;
