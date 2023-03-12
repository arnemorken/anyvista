var anyEvent = function (connection)
{
  this.tableName = "any_event";
  this.className = "anyEvent";
  anyTable.call(this,connection,this.tableName,"event","event_id","event_name");

  this.linking = { "group":    [ "any_event_group",    "anyGroup" ],
                   "user":     [ "any_event_user",     "anyUser" ],
                   "document": [ "any_document_event", "anyDocument" ],
                 };
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
  this.sqlInsertEventUser = "\
    INSERT INTO any_event_user (event_id,user_id) VALUES (\
      11,\
      99);\
    ";
}; // constructor

anyEvent.prototype = new anyTable(null);
anyEvent.prototype.constructor = anyEvent;

anyEvent.prototype.createLinkTables = function()
{
  return this.query(this.sqlCreateLinks,true,true);
}; // createLinkTables

anyEvent.prototype.insertLinkTables = function()
{
  return this.query(this.sqlInsertEventUser,true,true);
}; // insertLinkTables
