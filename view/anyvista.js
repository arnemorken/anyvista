/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2024 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ***************************************************************************************/

/**
  <h1>anyVista user's guide</h1>
  anyVista is a Javascript/jQuery library that can view, manage and persist data as lists and/or
  individual items.
  <p>
  The data is organized in a flexible hierarchical tree structure, which may be viewed and edited in
  a web page, used in a mobile app or indeed any other place where Javascript may be executed.
  </p>
  <p>
  If desired, one may use only the data-manipulation part of anyVista as a front-end to persistent
  data tables in a server (MySQL) or client (AlaSQL) based database. The data may actually come from
  any source, i.e. an SQL database, another process, an inline script, etc., as long as it is on the
  proper JSON format as described below.
  </p>
  <p>
  The view part of anyVista can display and manipulate any combination of lists and items. A list
  may or may not correspond to a database table and an item to a record in the table. There are only
  a few preconditions on the format of the data tables, which may contain any number of columns of
  many different types. However, it is not necessary to use a database backend, anyVista may be used
  directly in Javascript code to display and edit data. More uses for anyVista can probably be
  conceived of - please <a href="mailto:software@balanse.info?subject=anyVista">let us know</a>!
  <p/>
  <p>
  The anyVista API allows for user-defined types and some types are included, specifically `user`,
  `group`, `event` and `document`, all described below. Types may be "linked", e.g. users may
  attend events, groups may have a number of documents, events may publish notes, and so on. An
  anyVista Wordpress plugin is provided, so these types can offer useful functionality otherwise
  provided by several separate Wordpress plugins.
  </p>
  <p>
  Below we describe:<br/>
  - the client model/view API,<br/>
  - the client database API for using anyVista with an AlaSQL database in a browser or mobile app,<br/>
  - the server database API for using anyVista with a MySQL database in a PHP environment,<br/>
  - how to write user defined anyVista types, and<br/>
  - how to use anyVista with Wordpress.
  </p>

  __TABLE OF CONTENTS__

  <a href="#client_mv_api">Client Model/View API</a><br/>
  <a href="#client_mv_api_anyVista_classes">- Classes</a><br/>
  <a href="#client_mv_api_data_format">- Data format</a><br/>
  <a href="#client_mv_api_view_filter">- View filter</a><br/>
  <a href="#client_mv_api_css_formatting">- CSS formatting</a><br/>

  <a href="#client_db_api">Client database API (AlaSQL)</a><br/>
  <a href="#client_db_api_anyVista_classes">- Classes</a><br/>
  <a href="#client_db_api_data_format">- Data format</a><br/>
  <a href="#client_db_api_data_filter">- Data filters</a><br/>
  <a href="#client_db_api_anyDefs">- Configuration files</a><br/>

  <a href="#server_db_api">Server database API (MySQL)</a><br/>
  <a href="#server_db_api_anyVista_classes">- Classes</a><br/>
  <a href="#server_db_api_data_format">- Data format</a><br/>
  <a href="#server_db_api_data_filter">- Data filters</a><br/>
  <a href="#server_db_api_anyDefs">- Configuration files</a><br/>

  <a href="#api_type_classes">User defined types</a><br/>

  <a href="#wordpress_anyVista">anyVista and Wordpress</a><br/>

  <a href="#full_examples">Examples</a><br/>

  <hr/>

  <a name="client_mv_api"></a>
  <h2>Client Model/View API (Javascript/jQuery)</h2>

  The client Model/View API is written in Javascript and uses the jQuery library. It is easily integrated into
  web pages for displaying and modifying information (for example from database tables) by including the
  following in your index.html (replace `anyvista.1.0.0` with your actual version of anyVista):

        <script src="anyDefs.js"></script>
        <script src="anyvista.1.0.0.min.js"></script>
        <link  href="anyvista.1.0.0.min.css" rel="stylesheet"/>

  Note: The first line (including the <b>anyDefs.js</b> configuration file) is only neccessary
  when using anyVista with a database backend. See the documentation on the client and server
  database configuration below for more info on this.

  <hr style="color:#eee;"/>

  <a name="client_mv_api_anyVista_classes"></a>
  <h3>Basic classes</h3>

  anyVista currently contains three basic classes: `anyModel`, `anyView` and `anyViewTabs`.

  Type classes, such as `anyEvent` or `anyUser`, inherits from `anyModel` and either `anyView` or `anyViewTabs`.

  __<a href="../classes/anyModel.html">`anyModel`</a>__: Keeps data in a tree structure in memory and optionally
  synchronizes it with a database.

  __<a href="../classes/anyView.html">`anyView`</a>__: Contains methods to display and optionally edit the data
  structure contained in `anyModel`.

  __<a href="../classes/anyViewTabs.html">`anyViewTabs`</a>__: Groups a data view using tabs. Inherits from `anyView`.

  <hr style="color:#eee;"/>

  <a name="client_mv_api_data_format"></a>
  <h3>Data format</h3>

  The data of <a href="anyModel.html">`anyModel`</a> is stored in a tree structure with
  associated methods for searching, inserting, updating and deleting items or lists in memory, as well as
  methods for synchronizing the data structure with database tables. Methods whose name begins with `data`
  work on the in-memory data tree, methods whose name begins with `db` communicate with the database.

  Objects from the database are filtered before operated upon, i.e. only explicitely specified columns of a
  table are being used in database operations. The same goes for determining which values are returned from
  the database to the client script. anyVista has support for both a server based (MySQL) and a client based
  (AlaSQL) database. The filters that determine which data are displayed and how, are described below.

  An `anyModel` object can hold <b>item</b> and/or <b>list</b> data. The data structure, an object
  kept internally in the `this.data` variable, is the same for both items and lists and is
  organized into hierarchical groups for each data type (even if it's only a single item), where
  a type can be for example `"user"`, `"event"`, `"group"`, `"document"` etc.

  The data structure is a collection of objects where each object may have these entries:

  - An <b>id</b>, which is the object's unique identifier. It is mandatory. The id can be an
    integer  or a string, however, if it is a string the methods for finding the maximum or next
    available id will not work. If used with a database backend, it corresponds to an individual
    row in a database table.

  - A entry specifiying a type/mode combination, where <b>mode</b> may be one of `"head"`, `"list"`
    or `"item"` and <b>type</b> is a user-specified type, for example `"group"`, `"event"`, `"user"`
    or `"document"`. mode is used to indicate how the data of a given type should be displayed.
    If this entry is not specified, the last preceding entry in the data structure is assumed.
    If there is no preceding entry, `"list"` is the default value assumed for mode and the
    current model's type is the default value assumed for type, and if the model has no type,
    type will be set to the empty string. If used with a database backend, type corresponds
    to a specific database table.<br/>
    Example: `list:"event"`.

  - An `edit` entry, specifying that this part of the data structure should be editable in a view
    even though the `isEditable` variable of the view is set to false.<br/>
    <b>TODO! Not tested yet!</b><br/>
    Example: `edit:"true"`.

  - An `add` entry, specifying that a button for adding a new item of given type should be
    displayed for entering new data at this part of the data structure.<br/>
    <b>TODO! Not implemented yet.</b><br/>
    Example: `add:"user"`.

  - A `skip` entry, an array specifying columns that should not be displayed for this object.<br/>
    <b>TODO! Not implemented yet.</b><br/>
    Example: `skip:["event_organizer","event_start_date"]`.

  - A number of key / value pairs, that are the actual data that are to be displayed.<br/>
    Example: `event_name:"Tour de France"`.

  - A data object may also contain further data objects (subdata), making up a tree structure.

  See the examples below.

  A formal description of a data object (items in square brackets are not verbatim):

          [data_object] = {
            head | item | list: "[type]",   // Optional, may be overridden by a specification on level below.
            [id]: {                         // Mandatory.
              head | item | list: "[type]", // Optional, overrides a specification on level above.
              edit: true | false,           // Optional. Default: false.
              add:  "[type]"                // Optional. Default: undefined
              [type]_name: "[string]",      // Mandatory if any key / value pairs are given.
              [key]: "[value]",             // Optional. One or more key / value pairs.
              [key]: "[value]",
              [key]: "[value]",
              ...
              data: [data_object],          // Optional. Subdata.
            },
            [id]: {
              ...
            },
            ...
          };

  The minimal possible data structure for an __item__ on the client side may look like this (Javascript):

       let my_data = {
         0: {
           item: "foo",
           foo_name: "Hello world",
         },
       };

  The minimal possible data structure for a __list__ on the client side may look like this (Javascript):

       let my_data = {
         0: {
           list: "foo",
           data: {
             1: {
               foo_name: "Hello world",
             },
             2: {
               foo_name: "Hello again world",
             },
           },
         },
       };

  Data in a list of a given type may be grouped. A sample data structure for a grouped list may look like this
  (a full version is found in the `examples` folder of the source code as `list_events_groups0a.html`):

        let my_data = {
          seminar: { // NOTE: Non-numerical id
            head: "group",
            group_name: "Seminars",
            data: {
              10: {
                list: "event",
                event_name: "Keynote lecture",
                event_lecturer: "Isaac Newton",
                event_arranger: "John",
              },
              11: {
                event_name: "Lecture number two",
                event_lecturer: "Albert Einstein",
                event_arranger: "John",
              },
              18: {
                event_name: "Evening lecture",
                event_lecturer: "TBA",
                event_arranger: "Janne",
             },
            },
          },
          organization: { // NOTE: Non-numerical id
            head: "group",
            group_name: "Organization",
            data: {
              17: {
                list: "org_event",
                event_name: "Organizing stuff",
                event_responsible: "Janne",
              },
              20: {
                event_name: "Order pizza",
                event_responsible: "Lisa",
              },
              23: {
                event_name: "Clean up",
                event_responsible: "Larry",
              },
            },
          },
        };

  When displayed, the above data structure would look like something this (depending on data filters and CSS,
  see below for more info on this):<br/>
  <img src="../../doc/img/list_events_groups0a.png"/>

  Items and lists may be freely mixed. For example, changing the above data structure so that the first event
  is displayed as an item and the rest as a list, would look like this (a full version is found in the examples
  folder of the source code as list_events_groups0b.html):

        let my_data = {
          seminar: { // NOTE: Non-numerical id
            head: "group",
            group_name: "Seminars",
            data: {
              10: {
                item: "event",
                event_name: "Keynote lecture",
                event_lecturer: "Isaac Newton",
                event_arranger: "John",
              },
              11: {
                list: "event",
                event_name: "Lecture number two",
                event_lecturer: "Albert Einstein",
                event_arranger: "John",
              },
              18: {
                event_name: "Evening lecture",
                event_lecturer: "TBA",
                event_arranger: "Janne",
              },
            },
          },
          organization: { // NOTE: Non-numerical id
            head: "group",
            group_name: "Organization",
            data: {
              17: {
                list: "org_event",
                event_name: "Organizing stuff",
                event_responsible: "Janne",
              },
              20: {
                event_name: "Order pizza",
                event_responsible: "Lisa",
              },
              22: {
                event_name: "Clean up",
                event_responsible: "Larry",
              },
            },
          },
        };

  When displayed, the above data structure would look like something this (depending on CSS and data
  filters, see below for more info on this):<br/>
  <img src="../../doc/img/list_events_groups0b.png"/>

  <hr style="color:#eee;"/>

  <a name="client_mv_api_view_filter"></a>
  <h3>View filter</h3>

  The view filter determines the mode of data in the `data` stucture, whether the data will be
  displayed, and how.

  The filter object contains key / value pairs:
  <li>The <b>key</b> is the name of a field to display (e.g. `event_name`).  If used with a database it
  must be the same as the corresponding entry in the database filter.
  </li>
  <li>The <b>value</b> is an object describing the field and must as a minimum have `HEADER`, `DISPLAY`
  and `TYPE` keys
  </li>

  Formally:

        [column name]: { HEADER:"[name]", DISPLAY:[0|false|1|true], TYPE:"[type]", ... }

  Here [column name] is the name of the table column (which may correspond to column in a database table),
  e.g. `event_name`. Entries after "TYPE" are optional.

  `HEADER`: The label of the field (e.g. `HEADER:"Event name"`).<br/>
  `DISPLAY`: Whether the field should be displayed or not (0 or false = hide, 1 or true = display).<br/>
  `TYPE`: The html type of the field (e.g. `"textarea"`). Possible values are listed here (for some types,
  additional keys are needed):

  <ul>
  <li>"html":      A verbatim html string.</li>
  <li>"textarea":  A (potentially editable) text area.</li>
  <li>"text":      A (potentially editable) text.</li>
  <li>"password":  A (potentially editable) password field.</li>
  <li>"link":      A clickable (and potentially editable) text.</li>
  <li>"mailto":    A clickable (and potentially editable) mail address (starting with `mailto:`)</li>
  <li>"email":     Alias for `mailto`</li>
  <li>"number":    A number (allows only digits and .)</li>
  <li>"label":     A non-editable and non-clickable label.</li>
  <li>"date":      A (potentially editable) date selector.</li>
  <li>"function":  The name of a method in the View class receiving the parameters `type`, `mode`, `id`
                   and `data`, and returning html code to be displayed.</li>
  <li>"image":     An image. Must have an `IMAGE` entry in the filter describing the relative path to the
                   image <i>or</i> a `FUNCTION` entry naming a method in the View class returning a
                   html img tag (see "function" above).<br/>
                   Example: `IMAGE:"img/shadow1.jpg"`<br/>
                   Example: `IMAGE:"getImage"`.</li>
  <li>"select":    A select element. Must have an `SELECT` entry in the filter describing entries for a html
                   dropdown select box <i>or</i> a `FUNCTION` entry naming a method in the View class
                   returning an appropriate select object (see "function" above).<br/>
                   Example: `SELECT:{0:"Not started",1:"In progress",2:"Overdue",3:"Completed",4:"Cancelled"}`<br/>
                   Example: `SELECT:"getStatus"`.</li>
  <li>"radio":     A radio element. <b>TODO: Not tested.</b></li>
  <li>"check":     A check element. <b>TODO: Not tested.</b></li>
  <li>"file":      A file selector. <b>TODO: Not tested.</b></li>
  <li>"tokenlist": A list of tokens/tags. <b>TODO: Not implemented.</b></li>
  </ul>

  Example of a simple filter object:

        let my_filters = {
          foo: {
            list: {
              foo_id:   {HEADER:"Foo id",   DISPLAY:0, TYPE:"label"},
              foo_name: {HEADER:"Foo name", DISPLAY:1, TYPE:"text"},
            }
          }
        };

  Example of a more complex filter object:

        let my_filter1 = {
          foo: {
            item: {
              foo_id:     { HEADER:"Foo id",     DISPLAY:0, TYPE:"label" },
              foo_name:   { HEADER:"Foo name",   DISPLAY:1, TYPE:"text" },
              foo_image1: { HEADER:"Foo image1", DISPLAY:1, TYPE:"function",FUNCTION:"getImage" },
              foo_image2: { HEADER:"Foo image2", DISPLAY:1, TYPE:"image",   FUNCTION:"getImage" },
              foo_image3: { HEADER:"Foo image3", DISPLAY:1, TYPE:"image",   IMAGE:   "img/shadow1.jpg" },
              foo_desc:   { HEADER:"Description",DISPLAY:1, TYPE:"textarea" },
              foo_perm:   { HEADER:"Permission", DISPLAY:1, TYPE:"select",  SELECT:   {0:"Public",1:"Private",2:"Group"} },
              foo_place:  { HEADER:"Place",      DISPLAY:1, TYPE:"select",  SELECT:   "getPlaces" },
              foo_status: { HEADER:"Status",     DISPLAY:1, TYPE:"select",  FUNCTION: "getStatus" },
            },
            list: {
              foo_id:     { HEADER:"Foo id",     DISPLAY:0, TYPE:"label" },
              foo_name:   { HEADER:"Foo name",   DISPLAY:1, TYPE:"text" },
            }
          },
       };

  If no filter is provided, the system will use a simple default filter that displays the item's name only.

   An example utilizing all the different html types of a filter is found in the `examples` folder of the
  source code as `all_html_types.html`. <b>TODO!</b>

  <hr style="color:#eee;"/>

  <a name="client_mv_api_css_formatting"></a>
  <h3>CSS formatting</h3>

  Coming soon.

  <hr/>

  <a name="client_db_api"></a>
  <h2>AlaSQL client database API (Javascript)</h2>

  Coming soon.

  <a name="client_db_api_anyVista_classes"></a>
  <h3>Basic classes</h3>

  <a name="client_db_api_data_format"></a>
  <h3>Data format</h3>

  <a name="client_db_api_data_filter"></a>
  <h3>Data filters</h3>

  <a name="client_db_api_anyDefs"></a>
  <h3>Configuration files</h3>

  <hr/>

  <a name="server_db_api"></a>
  <h2>MySql server database API (PHP)</h2>

  The server database API implements a simplified abstraction of a general database table as well
  as some specific table classes corresponding to types in the client Model/View API. Currently
  the following types are implemented: `user`, `event`, `document` and `group`. The user can
  define other types as needed. The anyVista server database API is developed for and tested in
  the Apache/MySQL (and Wordpress) environment but could easily be adapted to other scenarios.

  Note! The configuration file <b>`data/mysql/mysql/anyDefs.php`</b> should be edited to match the
  <b>`anyDefs.js`</b> file on the client side. See <a href="#server_db_api_anyDefs">configuration
  files</a> below for more info on this.

  <hr style="color:#eee;"/>

  <a name="server_db_api_anyVista_classes"></a>
  <h3>Basic classes</h3>

  The general database abstraction is implemented through:

  - An interface to the
    <a href="https://www.php.net/manual/en/intro.pdo.php" target="_blank">PDO (PHP Data Objects)
    <img style="width:10px;height:10px" src="../../doc/img/external_link.png"/></a> extension to
    PHP. This interface is found under `data/mysql/db/`. The user should edit the
    <b>`data/mysql/db/dbDefs.php`</b> file and set the host name, database name and database
    user/password, but would normally not bother with the other  files in the `data/mysql/db/`
    folder.

  - The class <a href="anyTable.html">`anyTable`</a> contains the
    abstract database table interface and has methods that call the actual database operations
    such as  search, insert, update, delete, etc. User defined type classes extend this class and
    may provide the methods `createFilters()`, `getSelectItem()`, `getLeftJoinItem()`,
    `getSelectList()`, `getLeftJoinList()` and `getOrderByList()` if neccessary. More info on
    these methods can be found in the documentation for the `anyTable` class.

  - A helper class <a href="anyTableFactory.html">`anyTableFactory`</a>
    in `data/mysql/anyTableFactory.php`.

  <br/>

  <hr style="color:#eee;"/>

  <a name="server_db_api_data_format"></a>
  <h3>Data format</h3>

  On the server side, data from the database is handled by the `anyTable` abstract class.
  Some important points to note:

  - Each class that derive from `anyTable` corresponds to a type and a database table.

  - `anyTable` may set an id, in which case it it assumed to contain data for a single item.
    If id is not set, `anyTable` is assumed to contain data for a list. Note that an item may
    contain lists as subdata.

  - `anyTable` uses an id key and a name key which must correspond to the `id_key` and `name_key`
    in the `anyModel` class on the client side. These values must be set by the type classes
    deriving from `anyTable` (see <a href="#api_type_classes">User defined types</a> below).

  Data is organized by the `anyTable` class into a hierarchical tree structure that can be used
  by the `anyModel` and `anyView` classes on the client. This structure is exactly the same as
  for the client <a href="#client_mv_api_data_format">described above</a> (except that it is
  encoded in PHP of course).

  Data read from tables are transferred from the server to the client in the following JSON format:

      {
        'head': '[type]',                                // Optional.
        'data': {                                        // Optional.
          'grouping': 'true',                            // Optional.
          '+[id]': {                                     // Optional.
            'head' | 'item' | 'list': '[type]',          // Mandatory.
            '[type]_name':            '[value]',         // Mandatory.
            '[type]_id':              '[value]',         // Mandatory if 'list' or 'item'.
            'group_type':             '[group_type]',    // Optional. Only valid if [type] == 'group'.
            'group_sort_order':       '[integer]',       // Optional. Only valid if [type] == 'group'.
            '[key]':       '[value]',                    // Optional. One or more key / value pairs.
            ...
            'data': {                                    // Optional.
              'grouping': 'true',                        // Optional.
              '+[id]': {                                 // Optional.
                'head' | 'item' | 'list': '[type]',      // Mandatory.
                '[type]_name': '[value]',                // Mandatory.
                '[type]_id':              '[value]',     // Mandatory if 'list' or 'item'.
                'group_type':             '[group_type]',// Optional. Only valid if [type] == 'group'.
                'group_sort_order':       '[integer]',   // Optional. Only valid if [type] == 'group'.
                'parent_id':              '[id]',        // Optional. The id of the level above, if of the same type.
                '[key]':                  '[value]',     // Optional. One or more key / value pairs.
                ...
              },
              ...
            }, // data
          }
          ...
        } // data
        'link_types': {                    // Optional
          [integer]: '[type name]',        // Optional. One or more type names.
          ...
        },
        'permission': {                    // Mandatory
          'current_user_id': '[id]',       // Mandatory
          'is_logged_in':    true | false, // Mandatory
          'is_admin':        true | false, // Mandatory
        },
        'message': '[string]',             // Optional
        'error':   '[string]',             // Optional
      }

  <div style="border:1px solid #888; padding:5px;padding-bottom:0px;">
  <b>A NOTE ON INDEXES:</b>

  When using Ajax to transfer the data structure (a JSON data object) from a PHP server to the Javascript client,
  the indices of the object will automatically be converted to integers even if they are specified as strings on
  the server (PHP) side. I.e. "38"  on the server side will be converted to integer 38 on the client side.
  When received on the client (Javascript) side, the items in the data structured will therefore be ordered numerically.
  This may not be the desired behaviour (we may want to preserve the ordering from the server). In order to get around
  this problem, numeric indexes are prefixed with a "+" on the server side so that the code on the client side will
  interpret them as strings. The clienyt code can then maintain the ordering of the items as intended by the server
  (the client code is able to handle data indexed both as data[38], data["38"] and data["+38"]).
  </div>

  The minimal possible data structure for an __item__ on the server side may look like this:

        $data = array (
          '+0' =>
          array (
            'item' => 'foo',
            'foo_name' => 'Hello world',
          ),
        );

  The minimal possible data structure for a __list__ on the server side may look like this:

        $data = array (
          '+0' =>
          array (
            'list' => 'foo',
            'data' =>
            array (
              '+1' =>
              array (
                'foo_name' => 'Hello world',
              ),
              '+2' =>
              array (
                'foo_name' => 'Hello again world',
              ),
            ),
          ),
        );

  It should be noted that while they are valid data structures, the above examples are actually slight
  simplifications: The server will always put the data into <i>groups</i>, even if it's just a single
  item. This is done in order to be able to directly display grouped data with the view classes on the
  client side. It is not something most users will need to think about, unless they are writing new
  server side type classes interacting with database tables.

  <div style="border:1px solid #888; padding:5px;padding-bottom:0px;">
  <b>A NOTE ON DATA INSULATION:</b>

  The `anyGetData.php` script, which is the "gateway" to accessing the PHP server, encapsulates the entire
  data structure in an object indexed by `JSON_CODE`. This is done in order to insulate the data from error
  messages that may be generated by the http server. On the client, the db* success methods "unwraps" the
  data structure before it is processed further. If supplying your own success methods, this unwrapping
  should be done explicitely, like this:

        myDbSearchSuccess = function (context,serverdata,options)
        {
          if (serverdata.JSON_CODE)
            serverdata = serverdata.JSON_CODE;
         // Access serverdata here
         ...

  </div>

  <hr style="color:#eee;"/>

  <a name="server_db_api_data_filter"></a>
  <h3>Data filters</h3>

  Each type of data must have a corresponding filter which specifies which data should be included in database
  operations `SEARCH`, `INSERT`, `UPDATE` and `DELETE`, i.e.  which keys of the type should be included in database
  operations. The keys (e.g. "event_status") should be the same as those in the corresponding filter, though not
  every name in the filter has to be present  as a key. Only the data specified in the filter are transferred to
  the client.

  Keys that are not described in the filter will be ignored. The filters are not part of the data structure sent to
  the client, which uses its own filters for display.

  The server filters have the following format:

       [key]: 1 | 0

  Filters are defined for each anyVista type in the type's table file (e.g. `eventTable.php`). There is one filter
  for items and one for lists and they are defined in the `createFilters()` method.

  Example: List and item filters for type "event", where the fields "event_date_end" and "user_result" will be
  ignored for lists and event_status will be ignored for items:

      $this->mFilters["list"] = array(
        "event_id"          => 1,
        "event_name"        => 1,
        "event_place"       => 1,
        "event_date_start"  => 1,
        "event_date_end"    => 0,
        "user_result"       => 0,
      };
      $this->mFilters["item"] = array(
        "event_id"          => 1,
        "event_name"        => 1,
        "event_place"       => 1,
        "event_date_start"  => 1,
        "event_date_end"    => 1,
        "event_status"      => 0,
        "event_price"       => 1,
      };

  <hr style="color:#eee;"/>

  <a name="server_db_api_anyDefs"></a>
  <h3>Configuration files</h3>

  When anyVista is used in a server environment, the client and server must know how to
  communicate with each other. This is done by setting certain values in the <b>`anyDefs.js`</b>,
  <b>`anyDefs.php`</b> and <b>`dbDefs.php`</b> configuration files. Some of these values could and
  should be set by  the user. Do this by editing the files, not programmatically.

  <h4>dbDefs.php</h4>

  This file, located under `data/mysql/db/`, defines the connection to the database. The user
  should edit this file and set the host name, database name and database user/password.

  Sample listing of the `dbDefs.php` file:

        <?php
        define('ANY_DB_HOST','127.0.0.1');      // Database server
        define('ANY_DB_NAME','any-testserver'); // Database name
        define('ANY_DB_USER','root');           // Database user
        define('ANY_DB_PASS','');               // Database password

        define('ANY_DB_TYPE',   'mysql');  // Database type
        define('ANY_DB_CHARSET','UTF8');   // Database charset
        ?>

  <h4>anyDefs.js</h4>

  Located in the anyVista `view` directory. Must be included by Javascript code that wants to
  interact with the database server backend.

  Sample listing of the `anyDefs.js` file:

        var gSource        = "remote";
        var gServer        = "//localhost/";
        var gHomeFolder    = "projects/testserver/wp-content/plugins/anyvista/";
        var gThirdpartyPHP = "projects/testserver/php/";
        var gSkin          = "default";

        // Do not edit below unless you really know what you are doing.

        var gVersion = "1.0.0";

        var gDataScript   = "data/mysql/anyGetData.php"; // Relative to gHomeFolder
        var gUploadScript = "ajaxfileupload.php";        // Relative to gThirdpartyPHP
        var gUploadFolder = "upload/";                   // Relative to gHomeFolder

        var any_defs = {
          dataScript:   gServer + gHomeFolder + gDataScript,      // URL of the data source script
          uploadScript: gServer + gThirdpartyPHP + gUploadScript, // URL of the upload script
          uploadURL:    gServer + gHomeFolder + gUploadFolder,    // URL of the upload folder
          uploadFolder: gUploadFolder,                            // Name of the upload folder
        };

  <h4>anyDefs.php</h4>

  Located in the anyVista `data` directory. Must be included by PHP code that wants to interact
  with anyVista clients.

  Sample listing of the `anyDefs.php` file:

        <?php
        define("gServer",       "//localhost/");
        define("gHomeFolder",   "projects/anyvista/testserver/wp-content/plugins/anyvista/");
        define("gThirdpartyJS", "projects/anyvista/thirdparty/javascript/");
        define("gSkin",         "default");

        // Do not edit below unless you really know what you are doing.

        define("gVersion", "1.0.0");

        define("gHomePath",     $_SERVER['DOCUMENT_ROOT'] . "/" . gHomeFolder);
        define("gAnyvistaURL",  gServer.gHomeFolder);

        define("gDataScript",   "data/mysql/anyGetData.php"); // Relative to gHomeFolder
        define("gDataSource",   $_SERVER['DOCUMENT_ROOT'] . "/" . gHomeFolder.gDataScript);

        define("gUploadFolder", "upload/");                   // Relative to gHomeFolder
        define("gUploadPath",   $_SERVER['DOCUMENT_ROOT'] . "/" . gHomeFolder.gUploadFolder);

        define("gAnyPaginatorURL",  gServer          . gThirdpartyJS . "anyPaginator/");
        define("gAnyPaginator_css", gAnyPaginatorURL . "anypaginator-1.1.0.min.css");
        define("gAnyPaginator_js",  gAnyPaginatorURL . "anypaginator-1.1.0.min.js");

        define("gjQueryURL",        gServer          . gThirdpartyJS . "jquery/");
        define("gjQuery_js",        gjQueryURL       . "jquery-3.7.1.min.js");
        define("gjQueryWidgetURL",  gServer          . gThirdpartyJS . "jquery/");
        define("gjQueryWidget_js",  gjQueryWidgetURL . "jquery-widget-1.12.1.min.js");

        define("gW3CSSURL",         gServer          . gThirdpartyJS . "w3css/");
        define("gW3CSS_css",        gW3CSSURL        . "w3.css");

        define("gFontAwesomeURL",   gServer          . gThirdpartyJS . "fontawesome/css/");
        define("gFontAwesome_css",  gFontAwesomeURL  . "fontawesome.css");

        define("gTinyMCEURL",       gServer          . gThirdpartyJS . "tinymce/js/tinymce/");
*       define("gTinyMCE_js",       gTinyMCEURL      . "tinymce.min.js");

        define("WP_PLUGIN",""); // Comment out if using the server API, but not as a Wordpress plugin
        define("gWordpressURL",     gServer          . "Prosjekter/testserver/");
        define("gWProot", dirname(dirname(dirname(dirname(dirname(__FILE__)))))); // Path to wp-load.php
        define("gWPLoad", gWProot . "/wp-load.php"); // Wordpress functions

        define('ANY_DB_USER_TABLE',    'wp_users');     // Name of user table
        define('ANY_DB_USERMETA_TABLE','wp_usermeta');  // Name of user meta table
        define('ANY_DB_USER_ID',       'ID');           // Name of id key in user table
        define('ANY_DB_USER_NAME',     'display_name'); // Name of name key in user table
        define('ANY_DB_USER_META_ID',  'umeta_id');     // Name of id key in user meta table
        define('ANY_DB_USER_LOGIN',    'user_login');   // Name of user login in user table
        require_once "wordpress/wpPermission.php";
        ?>

  <h4>Common values for the anyDefs.js and anyDefs.php files</h4>

  `gServer`:
  The host on which the server is run.

  `gHomeFolder`:
  The anyVista root directory. If anyVista is run as a Wordpress plugin, `gHomeFolder` should be
  something like `my_wp_installation/wp-content/plugins/anyvista/`.

  `gDataScript`:
  The location of a script, relative to `gHomeFolder`, that delivers data on the correct JSON
  format. Default value is `data/mysql/anyGetData.php`, which is the default script that gets data
  from the PHP backend. It is used by the db* methods of the `anyModel` client side class when the
  `this.source` variable is set to `remote`. If a script is not specified in `gDataScript`, the data
  must be delivered to anyVista by some other method. Refer to the included examples.

  `gUploadFolder`:
  The location of an upload folder, relative to gHomeFolder. Used by the `document` type.

  `gSkin`:
  The skin (CSS) to use. Skins are found in the `view/skin/` folder.

  <hr/>

  <a name="api_type_classes"></a>
  <h2>User defined types</h2>

  Each anyVista type on the client side corresponds to a type on the server side (e.g. "event",
  "user", "document", "group", etc.). A type also corresponds to `type` in the data model and a
  table in the database.

  Below we will use the "task" type a an example. Follow the naming convention outlined.
  To keep things simple, the code below does not actually contain any useful methods, just the
  scaffolding for setting up the type.

  <h4>Writing new types</h4>

  *A) Client side code

  It should be noted that it is not absolutely neccessary to create a client side type in order to
  interact with a server side type - the default `anyModel` and `anyView` (or `anyViewTabs`)
  classes might be used. A client side type should be created if the user wants to do some special
  processing of the data or modify the view in some way. In this case, it should inherit from
  `anyModel` and `anyView` (or `anyViewTabs`) and should set the `type` (and optionally the
  `id_key` and `name_key`) variable(s).

  1) Create the folder "task" under view/types/ and create empty model, view, filter and validator files:

         task/taskModel.js
         task/taskView.js
         task/taskFilter.js
         task/taskValidator.js

  2) Create the folder "skin/default" under task/ and create an empty css file:

          task/skin/default/task.css

  3) Create the task model class in `taskModel.js`:

          var taskModel = function (options)
          {
            this.type     = "task";
            this.id_key   = "task_id";
            this.name_key = "task_name";
            anyModel.call(this,options);
          };
          taskModel.prototype = new anyModel(null);
          taskModel.prototype.constructor = taskModel;

  4) Create the task view class in `taskView.js`:

          (function($) {
            $.widget("any.taskView", $.any.anyView, {
              options: {
                filters: null,
                linkIcons: {
                  "document": "fa fa-book",
                  "user":     "fa fa-user",
                  "group":    "fa fa-users",
                },
              },
              _create: function() {
                this._super();
                this.element.addClass("taskView");
                if (!this.options.filters) {
                  let f = new taskFilter(this.options);
                  this.options.filters = f.filters;
                }
                this.validator = new taskValidator();
              },
              _destroy: function() {
                this.options = null;
                this.element.removeClass("taskView");
                this._super();
              }
            });

            $.any.taskView.prototype.validateUpdate = function (options)
            {
              if (!this.validator)
                return null;
              return this.validator.validateUpdate(options,this);
            };
          })($);

          var taskView = function (options)
          {
            if (!options)
              return null;
            return $.any.taskView(options);
          };

          taskView.prototype = new anyView(null);
          taskView.prototype.constructor = taskView;

  5) Create the task filter class in `taskFilter.js`:

          var taskFilter = function (options)
          {
            this.filters = {
              task: {
                item: {
                  task_id:          { HEADER:"Task id",      DISPLAY:0, TYPE:"label"},
                  task_owner:       { HEADER:"Owner:",       DISPLAY:1, TYPE:"link"},
                  task_name:        { HEADER:"Task name:",   DISPLAY:1, TYPE:"link"},
                  task_description: { HEADER:"Description:", DISPLAY:1, TYPE:"textarea"},
                  task_date_start:  { HEADER:"Start date:",  DISPLAY:1, TYPE:"date"},
                  task_date_end:    { HEADER:"End date:",    DISPLAY:1, TYPE:"date"},
                  task_status:      { HEADER:"Status:",      DISPLAY:1, TYPE:"select", SELECT:{0:"Not started",1:"In progress",2:"Completed"}},
                },
                list: {
                  task_id:          { HEADER:"Task id",      DISPLAY:0, TYPE:"label"},
                  task_owner:       { HEADER:"Owner",        DISPLAY:1, TYPE:"link"},
                  task_name:        { HEADER:"Task name",    DISPLAY:1, TYPE:"link"},
                  task_date_start:  { HEADER:"Start date",   DISPLAY:1, TYPE:"date"},
                  task_status:      { HEADER:"Status",       DISPLAY:1, TYPE:"select", SELECT:{0:"Not started",1:"In progress",2:"Completed"}},
                },
                head: {
                  task_id:          { HEADER:"Task id",      DISPLAY:0, TYPE:"label"},
                  task_name:        { HEADER:"Task name",    DISPLAY:1, TYPE:"link"},
                },
                select: {
                  task_id:          { HEADER:"Task id",      DISPLAY:0, TYPE:"label"},
                  task_name:        { HEADER:"Task name",    DISPLAY:1, TYPE:"label"},
                },
              },
            };
          };

  6) Create the task validator class in `taskValidator.js`:

          var taskValidator = function ()
          {
          }

          taskValidator.prototype.validateUpdate = function (opt,view)
          {
            let err = "";
            if (!opt.id && opt.id !== 0)
              err += "Task id missing. ";
            let elem_id_base = view.getIdBase()+"_"+opt.type+"_"+opt.mode+"_"+opt.id_str;
            let nameid1 = elem_id_base+"_task_name .itemEdit";
            let nameid2 = elem_id_base+"_task_name .itemUnedit";
            if (($("#"+nameid1).length !== 0 && !$("#"+nameid1).val()) &&
                ($("#"+nameid2).length !== 0 && !$("#"+nameid2).val()))
                err += "Task name missing. ";
            return err;
          };

  7) Create the CSS code in `task.css`:

          .task_name {
            font-family:  Arial, Helvetica, sans-serif;
            color:        blue;
          }

  *B) Server side code

  It should be noted that this step is only neccessary if you want to use the server side database connection.

  On the server side a type corresponds to a table (and optionally a meta table) and inherits from `anyTable`.
  Each type table class defines the following:

  - a number of defining characteristica of the table and meta table,
  - the type's specific table (and optionally meta table) fields,
  - the type's filter that describes which fields are used in database operations and transferred to and from
    the client,
  - how the type class interacts with other type classes (link table fields).

  A server side type should have three files placed in a folder below the `types` folder, in this case `client.php`,
  `task.php` and `taskTable.php`.

  1) Create the folder "task" under data/mysql/types/.

  2) Create empty files for the database table file (`taskTable.php`), the file for accessing the
     task server directly (`task.php`) and the file for interacting with other type classes (`client.php`):

          task/taskTable.php
          task/task.php
          task/client.php

  3) Create the task database table class in `taskTable.php`:

        <?php
          require_once "anyTable.php";
          class taskTable extends anyTable
          {
            protected $mType           = "task",
                      $mIdKey          = "task_id",
                      $mIdKeyTable     = "task_id",
                      $mIdKeyMetaTable = "task_id",
                      $mNameKey        = "task_name";

            protected $mTableName          = "any_task",
                      $mTableNameMeta      = "any_taskmeta",
                      $mTableNameGroupLink = "any_group_task",
                      $mTableNameUserLink  = "any_task_user";

            protected $mLinkTypes = ["group","user"];

            protected $mFilters = [
                "list" => [
                  "task_id"          => 1,
                  "task_name"        => 1,
                  "task_description" => 1,
                  "task_owner"       => 1,
                  "task_date_start"  => 1,
                  "task_date_end"    => 1,
                  "task_status"      => 1,
                ],
                "item" => [
                  "task_id"          => 1,
                  "task_name"        => 1,
                  "task_description" => 1,
                  "task_owner"       => 1,
                  "task_date_start"  => 1,
                  "task_date_end"    => 1,
                  "task_status"      => 1,
                ],
              ];

            protected $mInsertSuccessMsg = "Task created. ",
                      $mUpdateSuccessMsg = "Task updated. ",
                      $mDeleteSuccessMsg = "Task deleted. ";

            public function __construct($connection)
            {
              parent::__construct($connection);
            }

            protected function initFilters($filters)
            {
              if (!$this->mFilters)
                return false;
              return true;
            }

            protected function findListWhere($groupType=null,$groupId=null,$linkType=null,$linkId=null,$grouping=true,$linktable_name="",$has_linktable=false,$searchTerm="")
            {
              $where = parent::findListWhere($groupType,$groupId,$linkType,$linkId,$grouping,$linktable_name,$has_linktable,$searchTerm);
              return $where;
            }

            protected function dbUpdateExtra()
            {
            }
          }
        ?>

  4) Create the file for accessing the task server directly (`task.php`):

        <?php
          require_once dirname(__FILE__)."/../../anyDefs.php";
          require_once dirname(__FILE__)."/../client.php";
          require_once dirname(__FILE__)."/../task/client.php";
          require_once dirname(__FILE__)."/../group/client.php";
          require_once dirname(__FILE__)."/../user/client.php";
          require_once dirname(__FILE__)."/../document/client.php";
          require_once gDataSource;
          $gViewArea = "any_content";
          Parameters::set("type","task");
          $the_data = anyGetData();
        ?>
        <div id="<?php print $gViewArea;?>"/>

        <script>
        var serverdata = <?php echo $the_data;?>;
        if (serverdata && serverdata.JSON_CODE)
          serverdata = serverdata.JSON_CODE;
        var model = new taskModel({ data:       serverdata ? serverdata.data : null,
                                    permission: serverdata ? serverdata.permission : null,
                                    source:     "remote",
                                 });
        var data_id = "<?php echo Parameters::get("task_id");?>";
        var is_new  = (data_id == "new" || parseInt(data_id) == -1);

        var view = new taskView({ id:          "<?php print $gViewArea;?>",
                                  model:       model,
                                  isEditable:  true,
                                  isDeletable: true,
                                  edit:        is_new,
                               });
        view.refresh({parent:null,data:null,type:"task"});
        </script>

  5) Create the file for letting other types interact with the task type (`client.php`):

        <link  href="<?php print gAnyvistaURL;?>view/types/task/skin/<?php print gSkin;?>/task.css" rel="stylesheet"/>
        <script src="<?php print gAnyvistaURL;?>view/types/task/taskModel.js"></script>
        <script src="<?php print gAnyvistaURL;?>view/types/task/taskFilter.js"></script>
        <script src="<?php print gAnyvistaURL;?>view/types/task/taskView.js"></script>
        <script src="<?php print gAnyvistaURL;?>view/types/task/taskValidator.js"></script>

  6) Create the database table (MySQL) with this SQL code:

        CREATE TABLE `any_task` (
          `task_id` bigint(20) NOT NULL AUTO_INCREMENT,
          `task_name` varchar(100) CHARACTER SET utf8 DEFAULT '',
          `task_description` varchar(250) CHARACTER SET utf8 DEFAULT '',
          `task_owner` varchar(30) CHARACTER SET utf8 DEFAULT '',
          `task_date_start` datetime DEFAULT NULL,
          `task_date_end` datetime DEFAULT NULL,
          `task_status` int(20) DEFAULT 0,
          PRIMARY KEY (`task_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
        INSERT INTO `any_task` VALUES ('1', 'Test task', 'The first task is simple', 'Mr. Man', null, null, '0');

  *C) Wordpress integration

  Edit the file wordpress/index.php and insert the following row in the "tooltab" table:

        <td class="tooltd"
            onclick="javascript:loadPage('<?php print $gAdmViewArea;?>',
                                         '<?php print gAnyvistaURL;?>data/mysql/types/task/task.php?header=true&grouping=true',
                                         '<?php print $gAdmURL;?>');"
            title="Tasks">
          <i class="fas fa-file-alt fa-2x"></i><br/>Tasks
        </td>

  *D) Using the user defined type

  The type can now be accessed, either through the Wordpress integration described above, by accessing the
  `task.php` file directly or by using the type in your own files.

  1) Accessing the type through Wordpress: Pressing the "Task" icon should bring up a list containing the one task
     that was inserted by the by the SQL script above.

  2) Accessing the type with the `task.php` file by entering the following URL in a browser:



  <h4>Included pre-defined types</h4>

  A number of useful types are included with anyVista. They may be modified to suit the user's need.
  Currently, anyVista includes the following types:

  - <b>Group</b>: Grouping of other types.

  - <b>User</b>: Interacts with a user table on the database server. In a Wordpress environment, this
    means the `wp_users` table. It does not have methods for handling login, as this is done better
    and more securely by other Wordpress plugins.

  - <b>Document</b>: Handles collections of documents, images, etc.

  - <b>Event</b>: Contains methods for handling events for users.

  <hr/>

  <a name="wordpress_anyVista"></a>
  <h2>anyVista and Wordpress</h2>

  More info coming soon.

  <hr/>

  <a name="full_examples"></a>
  <h2>Examples</h2>

  Learning by example is an excellent way to master new programming libraries and concepts.
  Below you will find a  number of examples ranging from the simple "hello world" to writing
  complex anyVista types in a client-server environment.

  1) <a href="http://localhost/prosjekter/anyvista/testserver/wp-content/plugins/anyvista/examples/1_hello_world/">Hello world</a>

  2)

  A collection of complete examples can be found <a>here</a> (coming soon).

  @module anyVista
  @main anyVista
*/
