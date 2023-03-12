var anyGroup = function (connection)
{
  this.tableName = "any_group";
  this.className = "anyGroup";
  anyTable.call(this,connection,this.tableName,"group","group_id","group_name");

  this.linking = { "event":    [ "any_event_group",    "anyEvent" ],
                   "document": [ "any_document_group", "anyDocument" ],
                   "user":     [ "any_group_user",     "anyUser" ],
                 };
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

anyGroup.prototype = new anyTable(null);
anyGroup.prototype.constructor = anyGroup;
