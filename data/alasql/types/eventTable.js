var eventTable = function (connection,parameters)
{
  this.tableName = "any_event";
  this.className = "eventTable";
  anyTable.call(this,connection,parameters,this.tableName,"event",null,"event_id","event_name");

  this.linking = { "group":    [ "any_event_group",    "groupTable" ],
                   "user":     [ "any_event_user",     "userTable" ],
                   "document": [ "any_document_event", "documentTable" ],
                 };
  this.fields = [
    "event_id",
    "event_name",
    "event_description",
  ];
  this.sqlCreate = "\
    CREATE TABLE IF NOT EXISTS any_event (\
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
} // hasParentId
