var userTable = function (connection)
{
  this.tableName = "any_user";
  this.className = "userTable";
  anyTable.call(this,connection,this.tableName,"user",null,"user_id","user_name");

  this.linking = { "group":    [ "any_group_user",    "groupTable" ],
                   "event":    [ "any_event_user",    "eventTable" ],
                   "document": [ "any_document_user", "documentTable" ],
                 };
  this.sqlCreate = "\
    CREATE TABLE IF NOT EXISTS any_user (\
      user_id          INT PRIMARY KEY AUTOINCREMENT,\
      user_name        STRING,\
      user_description BLOB,\
      parent_id        INT,\
      UNIQUE (user_id));\
    CREATE TABLE IF NOT EXISTS any_event_user (\
      event_id          INT PRIMARY KEY,\
      user_id           INT PRIMARY KEY,\
      UNIQUE (event_id,user_id));\
    ";
}; // constructor

userTable.prototype = new anyTable(null);
userTable.prototype.constructor = userTable;