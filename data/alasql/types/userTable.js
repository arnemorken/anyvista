var userTable = function (connection,parameters)
{
  anyTable.call(this,connection,parameters);

  this.className          = "userTable";
  this.type               = "user";
  this.idKey              = "user_id";
  this.nameKey            = "user_name";
  this.tableName          = "any_user";
  this.tableNameGroupLink = "any_user_group";

  this.tableFields = [
    "user_id",
    "user_name",
    "user_description",
  ];
  this.tableFieldsLeftJoin = {
    group: ["group_id","user_joined_date","user_role"],
    event: ["user_result","user_feedback","user_attended"],
  };
  this.linkTypes = {
    group:     { className: "groupTable",     tableName: "any_group",    linkTableName: "any_group_user" },
    event:     { className: "eventTable",     tableName: "any_event",    linkTableName: "any_event_user" },
    document:  { className: "documentTable",  tableName: "any_document", linkTableName: "any_document_user" },
  };
  this.sqlCreate = "\
    CREATE TABLE IF NOT EXISTS "+this.tableName+" (\
      user_id          INT PRIMARY KEY AUTOINCREMENT,\
      user_name        STRING,\
      user_description BLOB,\
      parent_id        INT,\
      UNIQUE (user_id));\
    ";
  this.sqlCreateLinks = "\
    CREATE TABLE IF NOT EXISTS any_event_user (\
      event_id         INT PRIMARY KEY,\
      user_id          INT PRIMARY KEY,\
      user_result      INT,\
      user_attended    INT,\
      UNIQUE (event_id,user_id));\
    ";
}; // constructor

userTable.prototype = new anyTable(null);
userTable.prototype.constructor = userTable;
