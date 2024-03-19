var eventTable = function (connection,parameters)
{
  anyTable.call(this,connection,parameters);

  this.className          = "eventTable";
  this.type               = "event";
  this.idKey              = "event_id";
  this.nameKey            = "event_name";
  this.tableName          = "any_event";
  this.tableNameGroupLink = "any_event_group";

  this.tableFields = [
    "event_id",
    "event_name",
    "event_description",
  ];
  this.tableFieldsLeftJoin = {
    group: ["group_id"],
    user:  ["user_result","user_feedback","user_attended"],
  };
  this.linkTypes = {
    group:    [ "any_event_group",    "groupTable" ],
    user:     [ "any_event_user",     "userTable" ],
    document: [ "any_document_event", "documentTable" ],
  };
  this.sqlCreate = "\
    CREATE TABLE IF NOT EXISTS "+this.tableName+" (\
      event_id          INT PRIMARY KEY AUTOINCREMENT,\
      event_name        STRING,\
      event_description BLOB,\
      parent_id         INT,\
      UNIQUE (event_id));\
    ";
  this.sqlCreateLinks = "\
    CREATE TABLE IF NOT EXISTS any_event_user (\
      event_id          INT PRIMARY KEY AUTOINCREMENT,\
      user_id           INT PRIMARY KEY AUTOINCREMENT,\
      user_result       INT,\
      user_attended     INT,\
      UNIQUE (event_id,user_id));\
    ";
}; // constructor

eventTable.prototype = new anyTable(null);
eventTable.prototype.constructor = eventTable;

eventTable.prototype.createLinkTables = function()
{
  return this.query(this.sqlCreateLinks,true,true);
}; // createLinkTables

eventTable.prototype.hasParentId = function()
{
  return true;
}; // hasParentId
