var anyUser = function (connection)
{
  this.tablename = "any_user";
  this.classname = "anyUser";
  anyTable.call(this,connection,this.tablename,"user","user_id","user_name");

  this.linking = { "group":    [ "any_group_user",    "anyGroup" ],
                   "event":    [ "any_event_user",    "anyEvent" ],
                   "document": [ "any_document_user", "anyDocument" ],
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

anyUser.prototype = new anyTable(null);
anyUser.prototype.constructor = anyUser;
