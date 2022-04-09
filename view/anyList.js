/**
 * <h1>anyList user's guide</h1>
 <p>
 The anyList jQuery API manages data in a flexible hierarchical tree structure, organized as lists and/or
 individual items, to be viewed and edited in a web page, used in an Android app or any other place where
 Javascript may be executed. The data may come from any source, i.e. an SQL database, another process, an
 inline script, etc., as long as it is on the proper JSON format as described below. anyList may be used as a PHP
 framework for interacting with database tables through a web-based user interface, this means that anyList can work
 as a Wordpress plugin. The data can be viewed and manipulated as any combination of lists and items, where a
 list may correspond to a database table and an item to a record in the table and there are only a few preconditions
 on the format of the data tables, which may contain any number of columns of many different types. However, it is
 not necessary to use a database backend, anyList may be used directly in Javascript code to display and edit data.
 More uses for anyList can probably be conceived of.
 </p>
 <p>
 The anyList API is plugin-based and some plugins are included, specifically `user`, `group`, `event` and
 `document`, all described below. More plugins are under development. Plugins may be linked, e.g. users
 may attend events, groups may have a number of documents, events may publish notes, and so on. When anyList
 is used with Wordpress, these plugins can offer useful functionality otherwise provided by several separate
 Wordpress plugins.
 </p>
 <p>
 Below we describe the anyList client API, the server API for using anyList with a database in a PHP environment,
 how to write anyList plugins and how to use anyList with Wordpress.
 </p>
 *
 * __TABLE OF CONTENTS__
 *
 * &nbsp;<a href="#client_api">Client API</a><br/>
 * &nbsp;&nbsp;&nbsp;<a href="#client_api_anyList_classes">- Basic classes</a><br/>
 * &nbsp;&nbsp;&nbsp;<a href="#client_api_data_format">- Data format</a><br/>
 * &nbsp;&nbsp;&nbsp;<a href="#client_api_data_filter">- Data filter</a><br/>
 * &nbsp;&nbsp;&nbsp;<a href="#client_api_css_formatting">- CSS formatting</a><br/>
 * <br/>
 * &nbsp;<a href="#server_api">Server API</a><br/>
 * &nbsp;&nbsp;&nbsp;<a href="#server_api_anyList_classes">- Basic classes</a><br/>
 * &nbsp;&nbsp;&nbsp;<a href="#server_api_data_format">- Data format</a><br/>
 * &nbsp;&nbsp;&nbsp;<a href="#server_api_data_filter">- Data filter</a><br/>
 * &nbsp;&nbsp;&nbsp;<a href="#server_api_anyDefs">- Configuration files</a><br/>
 * <br/>
 * &nbsp;<a href="#api_plugin_classes">anyList plugins</a><br/>
 * <br/>
 * &nbsp;<a href="#wordpress_anyList">anyList and Wordpress</a><br/>
 * <br/>
 * &nbsp;<a href="#full_examples">Examples</a><br/>
 *
 * <hr/>
 *
 * <a name="client_api"></a>
 * <h2>Client API (jQuery)</h2>
 *
 * The client API is written in Javascript and uses the jQuery library. It is easily integrated into web
 * pages for displaying and modifying information (for example from database tables) by including the
 * following in your index.html (replace `anylist.1.0.0` with your actual version of anyList):
 *
 *      <script src="anyDefs.js"></script>
 *      <script src="anylist.1.0.0.min.js"></script>
 *      <link  href="anylist.1.0.0.min.css" rel="stylesheet"/>
 *
 * Note: The first line (including the <b>anyDefs.js</b> configuration file) is only neccessary when using
 * anyList with a server backend.
 * See <a href="#server_api_anyDefs">configuration files</a> and the <a href="#server_api">server API</a>
 * documentation below for more info on this.
 *
 * <hr style="color:#eee;"/>
 *
 * <a name="client_api_anyList_classes"></a>
 * <h3>Basic classes</h3>
 *
 * anyList currently contains three basic classes: `anyModel`, `anyView` and `anyViewTabs`.
 *
 * Plugins, such as `event` or `user`, inherits from `anyModel` and either `anyView` or `anyViewTabs`.
 *
 * __<a href="../classes/anyModel.html">`anyModel`</a>__: Keeps data in a tree structure in memory and optionally
 * synchronizes it with a database.
 *
 * __<a href="../classes/anyView.html">`anyView`</a>__: Contains methods to display and optionally edit the data
 * structure contained in `anyModel`.
 *
 * __<a href="../classes/anyViewTabs.html">`anyViewTabs`</a>__: Groups a data view using tabs. Inherits from `anyView`.
 *
 * <hr style="color:#eee;"/>
 *
 * <a name="client_api_data_format"></a>
 * <h3>Data format</h3>
 *
 * The data of <a href="../classes/anyModel.html">`anyModel`</a> is stored in a tree structure with
 * associated methods for searching, inserting, updating and deleting items or lists in memory, as well as
 * methods for synchronizing the data structure with database tables. Methods whose name begins with `data`
 * work on the in-memory data tree, methods whose name begins with `db` communicate with the database.
 * Objects from the database are filtered before operated upon, i.e. only explicitely specified columns of a
 * table are being selected, inserted, updated or deleted. (The same goes for determining which values are
 * returned from the database to the client script. See the  <a href="#server_api">server API</a> documentation
 * for the format of database tables and server filters.) Note that the database doesn't have to be server based;
 * a Javascript-only database such as AlaSQL could also be used. Client filters that determine which data are
 * displayed and how, are described below.
 *
 * An `anyModel` object can hold item and/or list data. The data structure, a JSON object internally kept
 * in the `this.data` variable of `anyModel`, is the same for both items and lists and is organized into
 * hierarchical groups (even for a single item) for each data type (where a type can be for example `"user"`,
 * `"event"`, `"group"`, `"document"` etc.).
 *
 * Below is a description of the data structure with which `anyModel` can be initialized. Items in square
 * brackets are not verbatim. The data structure is a collection of objects where each object may have these
 * entries:
 *
 * - An `id`, which is the object's unique identifier. It is mandatory, meaning that it must be specified even
 *   if the data structure displays a list only (in that case, use any id, e.g. "0"). `id` can be an integer or
 *   a string, however, if it is a string the methods for finding the maximum or next available id will not work.
 *   If used with a database backend, it corresponds to an individual row in a database table.
 *
 * - A entry specifiying a "kind/type" combination, where "kind" may be one of `head`, `list` or `item` and "type"
 *   is a user-specified type, for example "group", "event", "user" or "document". "kind" is used to indicate how the
 *   data of type "type" should be displayed.
 *   If this entry is not specified, the last preceding entry in the data structure is assumed.
 *   If there is no preceding entry, `list` is the default value assumed for "kind" and the current model's type is
 *   the default value for assumed for "type" and if the model has no type, "type" will be set to the empty string.
 *   If used with a database backend, "type" corresponds to a specific database table / plugin.<br/>
 *   *Example: `list:"event"`.
 *
 * - An `edit` entry, specifying that this part of the data structure should be editable in a view even though the
 *   `isEditable` variable of the view is set to false.<br/>
 *   TODO! Not tested yet.<br/>
 *   *Example: `edit:"true"`.
 *
 * - An `add` entry, specifying that a button for adding a new item of given type should be displayed for entering
 *   new data at this part of the data structure.<br/>
 *   TODO! Not implemented yet.<br/>
 *   *Example: `add:"user"`.
 *
 * - A `skip` entry, an array specifying columns that should not be displayed for this object.<br/>
 *   TODO! Not implemented yet.<br/>
 *   *Example: `skip:["event_organizer","event_start_date"]`.
 *
 * - A `page_links` object, specifying pagination for a list, containing:
 *   - from, the start number in the list,
 *   - to, the end number in the list,
 *   - num, the number of list rows to display.
 *
 *   <br/>TODO! Not implemented yet.<br/>
 *   *Example: `page_links:{from:11,to:20,num:10}`.
 *
 * - A number of key / value pairs, that are the actual data that are to be displayed.<br/>
 *   *Example: `event_name:"Tour de France"`.
 *
 * - A `data` object, which is a collection of objects as described (see description and example below), may
 *   also contain further `data` objects (subdata), making up a tree structure.
 *
 * A formal description of a data object:
 *
 *        [data_object] = {
 *          grouping:          [grouping_type], // Optional. Default: undefined.
 *          grouping_for_id:   [id],            // Optional. Default: undefined.
 *          grouping_for_type: [type],          // Optional. Default: undefined.
 *          grouping_for_name: [string],        // Optional. Default: undefined.
 *          head | item | list: "[type]",       // Optional, is overridden by a head|item|list specification on level below.
 *          [id]: {                             // Mandatory.
 *            head | item | list: "[type]",     // Optional, overrides a head|item|list specification on level above.
 *            edit: true | false,               // Optional. Default: false.
 *            add:  "[type]"                    // Optional. Default: undefined
 *            page_links: {                     // Optional
 *              from: [start_item_no],          // Mandatory in `page_links`.
 *              to:   [end_item_no],            // Mandatory in `page_links`.
 *              num:  [number_of_items],        // Mandatory in `page_links`.
 *            },
 *            [type]_name: "[string]",          // Optional, but mandatory if any key / value pairs are given.
 *            [key]: "[value]",                 // Optional. One or more key / value pairs.
 *            [key]: "[value]",
 *            [key]: "[value]",
 *            ...
 *            data: [data_object],            // Optional. Subdata.
 *          },
 *          ...
 *        };
 *
 *
 * The minimal possible data structure for an __item__ on the client side may look like this:
 *
 *     let my_data = {
 *       0: {
 *         item: "foo",
 *         foo_name: "Hello world",
 *       },
 *     };
 *
 * The minimal possible data structure for a __list__ on the client side may look like this:
 *
 *     let my_data = {
 *       0: {
 *         list: "foo",
 *         data: {
 *           1: {
 *             foo_name: "Hello world",
 *           },
 *           2: {
 *             foo_name: "Hello again world",
 *           },
 *         },
 *       },
 *     };
 *
 * Data in a list of a given type may be grouped. A sample data structure for a grouped list may look like this
 * (a full version is found in the `examples` folder of the source code as `list_events_groups0a.html`):
 *
 *      let my_data = {
 *        seminar: { // NOTE: Non-numerical id
 *          head: "group",
 *          group_name: "Seminars",
 *          data: {
 *            10: {
 *              list: "event",
 *              event_name: "Keynote lecture",
 *              event_lecturer: "Isaac Newton",
 *              event_arranger: "John",
 *            },
 *            11: {
 *              event_name: "Lecture number two",
 *              event_lecturer: "Albert Einstein",
 *              event_arranger: "John",
 *            },
 *            18: {
 *              event_name: "Evening lecture",
 *              event_lecturer: "TBA",
 *              event_arranger: "Janne",
 *           },
 *          },
 *        },
 *        organization: { // NOTE: Non-numerical id
 *          head: "group",
 *          group_name: "Organization",
 *          data: {
 *            17: {
 *              list: "org_event",
 *              event_name: "Organizing stuff",
 *              event_responsible: "Janne",
 *            },
 *            20: {
 *              event_name: "Order pizza",
 *              event_responsible: "Lisa",
 *            },
 *            23: {
 *              event_name: "Clean up",
 *              event_responsible: "Larry",
 *            },
 *          },
 *        },
 *      };
 *
 * When displayed, the above data structure would look like something this (depending on CSS and data filters,
 * see below for more info on this):<br/>
 * <img src="../../../doc/img/list_events_groups0a.png"/>
 *
 * Items and lists may be freely mixed. For example, the above data structure with the first event displayed
 * as an item and the rest as a list, would look like this (a full version is found in the examples folder of
 * the source code as list_events_groups0b.html):
 *
 *      let my_data = {
 *        seminar: { // NOTE: Non-numerical id
 *          head: "group",
 *          group_name: "Seminars",
 *          data: {
 *            10: {
 *              item: "event",
 *              event_name: "Keynote lecture",
 *              event_lecturer: "Isaac Newton",
 *              event_arranger: "John",
 *            },
 *            11: {
 *              list: "event",
 *              event_name: "Lecture number two",
 *              event_lecturer: "Albert Einstein",
 *              event_arranger: "John",
 *            },
 *            18: {
 *              event_name: "Evening lecture",
 *              event_lecturer: "TBA",
 *              event_arranger: "Janne",
 *            },
 *          },
 *        },
 *        organization: { // NOTE: Non-numerical id
 *          head: "group",
 *          group_name: "Organization",
 *          data: {
 *            17: {
 *              list: "org_event",
 *              event_name: "Organizing stuff",
 *              event_responsible: "Janne",
 *            },
 *            20: {
 *              event_name: "Order pizza",
 *              event_responsible: "Lisa",
 *            },
 *            22: {
 *              event_name: "Clean up",
 *              event_responsible: "Larry",
 *            },
 *          },
 *        },
 *      };
 *
 * When displayed, the above data structure would look like something this (depending on CSS and data filters,
 * see below for more info on this):<br/>
 * <img src="../../../doc/img/list_events_groups0b.png"/>
 *
 * <hr style="color:#eee;"/>
 *
 * <a name="client_api_data_filter"></a>
 * <h2>__Data filter__</h2>
 *
 * The data filter on the client determines which data in the `data` stucture will be displayed, and how. (On
 * the server, the filter determines which data will be operated upon and returned to the client - see the
 * <a href="#server_api">server API</a> for detailed information on the server filters).
 *
 * The filter object contains key / value pairs. The key is the name of a field to display (e.g. `event_name`) and
 * if used with a database, must be the same as the corresponding entry in the server filter. The value is an object
 * describing the field and must as a minimum have `HEADER`, `DISPLAY` and `HTML_TYPE` keys:
 *
 *      { [column name]:{HEADER:"[name]", DISPLAY:[0|false|1|true], HTML_TYPE:"[type]", [OBJ_something]: [something]}, ... }
 *
 * Here [column name] is the name of the table column (which may correspond to column in a database table),
 * e.g. `event_name`. Entries from "OBJ_something" onwards are optional.
 *
 * `HEADER`: The label of the field (e.g. `HEADER:"Event id"`).<br/>
 * `DISPLAY`: Whether the field should be displayed or not (0 or false = hide, 1 or true = display).<br/>
 * `HTML_TYPE`: The html type of the field (e.g. `"textarea"`). Possible values are listed below (for some types,
 * additional keys are needed):
 *
 * <ul>
 * <li>"html":      A verbatim html string.</li>
 * <li>"textarea":  A (potentially editable) text area.</li>
 * <li>"text":      A (potentially editable) text.</li>
 * <li>"password":  A (potentially editable) password field.</li>
 * <li>"link":      A clickable (and potentially editable) text.</li>
 * <li>"mailto":    A clickable (and potentially editable) mail address (starting with `mailto:`)</li>
 * <li>"email":     Alias for `mailto`</li>
 * <li>"number":    A number (allows only digits and .)</li>
 * <li>"label":     A non-editable and non-clickable label.</li>
 * <li>"date":      A (potentially editable) date selector.</li>
 * <li>"function":  The name of a method in the View class receiving the parameters `type`, `kind`, `id` and `data`
 *                  and returning html code.</li>
 * <li>"image":     An image. Must have an `OBJ_IMAGE` entry in the filter describing the relative path to the
 *                  image <i>or</i> an `OBJ_FUNCTION` entry describing a method in the View class returning a
 *                  html img tag (see "function" above).<br/>
 *                  Example: `OBJ_IMAGE:"img/shadow1.jpg"`<br/>
 *                  Example: `OBJ_IMAGE:"getImage"`.</li>
 * <li>"select":    A select element. Must have an `OBJ_SELECT` entry in the filter describing entries for a html
 *                  dropdown select box <i>or</i> an `OBJ_FUNCTION` entry describing a method in the View class
 *                  returning an appropriate select object (see "function" above).<br/>
 *                  Example: `OBJ_SELECT:{0:"Not started",1:"In progress",2:"Overdue",3:"Completed",4:"Cancelled"}`<br/>
 *                  Example: `OBJ_SELECT:"getStatus"`.</li>
 * <li>"radio":     A radio element. TODO: Not tested.</li>
 * <li>"check":     A check element. TODO: Not tested.</li>
 * <li>"file":      A file selector. TODO: Not tested.</li>
 * <li>"tokenlist": A list of tokens/tags. TODO: Not implemented.</li>
 * </ul>
 *
 * Example of a simple filter object:
 *
 *      let my_filters = {
 *        foo: {
 *          list: {
 *            foo_id:   {HEADER:"Foo id",   DISPLAY:0, HTML_TYPE:"label"},
 *            foo_name: {HEADER:"Foo name", DISPLAY:1, HTML_TYPE:"text"},
 *          }
 *        }
 *      };
 *
 * Example of a more complex filter object:
 *
 *      let my_filter1 = {
 *        foo: {
 *          item: {
 *            foo_id:     { HEADER:"Foo id",     DISPLAY:0, HTML_TYPE:"label" },
 *            foo_name:   { HEADER:"Foo name",   DISPLAY:1, HTML_TYPE:"text" },
 *            foo_image1: { HEADER:"Foo image1", DISPLAY:1, HTML_TYPE:"function",OBJ_FUNCTION:"getImage" },
 *            foo_image2: { HEADER:"Foo image2", DISPLAY:1, HTML_TYPE:"image",   OBJ_FUNCTION:"getImage" },
 *            foo_image3: { HEADER:"Foo image3", DISPLAY:1, HTML_TYPE:"image",   OBJ_IMAGE:   "img/shadow1.jpg" },
 *            foo_desc:   { HEADER:"Description",DISPLAY:1, HTML_TYPE:"textarea" },
 *            foo_perm:   { HEADER:"Permission", DISPLAY:1, HTML_TYPE:"select",  OBJ_SELECT:   {0:"Public",1:"Private",2:"Group"} },
 *            foo_place:  { HEADER:"Place",      DISPLAY:1, HTML_TYPE:"select",  OBJ_SELECT:   "getPlaces" },
 *            foo_status: { HEADER:"Status",     DISPLAY:1, HTML_TYPE:"select",  OBJ_FUNCTION: "getStatus" },
 *          },
 *          list: {
 *            foo_id:     { HEADER:"Foo id",     DISPLAY:0, HTML_TYPE:"label" },
 *            foo_name:   { HEADER:"Foo name",   DISPLAY:1, HTML_TYPE:"text" },
 *          }
 *        },
 *      };
 *
 * If no filter is provided, the system will use a simple default filter that displays the item's name only.
 *
 * <hr style="color:#eee;"/>
 *
 * <a name="client_api_css_formatting"></a>
 * <h2>__CSS formatting__</h2>
 *
 * Coming soon.
 *
 * <hr/>
 *
 * <a name="server_api"></a>
 * <h2>Server API (PHP)</h2>
 *
 * The server API implements a simplified abstraction of a general database table as well as some specific table
 * classes corresponding to types (plugins) in the client API. Currently the following plugins are implemented:
 * `user`, `event`, `document` and `group`. The anyList server API is developed for and tested in the Apache/MySQL
 * (and Wordpress) environment but should also work in other settings.
 *
 * The file <b>`data/anyDefs.php`</b> should be edited to match the `anyDefs.js` file of the client.
 * See <a href="#server_api_anyDefs">configuration files</a> below for more info on this.
 *
 * <hr style="color:#eee;"/>
 *
 * <a name="server_api_anyList_classes"></a>
 * <h3>Basic classes</h3>
 *
 * The general database abstraction is implemented through:
 * - an interface to the <a href="https://www.php.net/manual/en/intro.pdo.php" target="_blank">PDO (PHP Data Objects)
 *   <img style="width:10px;height:10px" src="../../../doc/img/external_link.png"/></a> extension to PHP. This interface
 *   is found under `data/db/`. The user should edit the <b>`data/db/dbDefs.php`</b> file and set the host name, database
 *   name and database user/password, but would normally not bother with the other  files in the `data/db/` folder,
 * - the class <a href="../../data/out/classes/anyTable.html">`anyTable`</a> contains the abstract database table
 *   interface and has methods that call the actual database operations such as  search, insert, update, delete, etc.
 *   Plugins may extend this class and provide the methods `createFilters()`, `getSelectItem()`, `getLeftJoinItem()`,
 *   `getSelectList()`, `getLeftJoinList()` and `getOrderByList`. More info on these methods can be found in the
 *   documentation for the `anyTable` class,
 * - a helper class <a href="../../data/classes/anyTableFactory.html">`anyTableFactory`</a> in `data/anyTableFactory.php`.
 *
 * <hr style="color:#eee;"/>
 *
 * <a name="server_api_data_format"></a>
 * <h3>Data format</h3>
 *
 * On the server side, data from the database are handled by the (abstract) `anyTable` class.
 * Each class that derives from `anyTable` corresponds to a type/plugin/database table.
 * A `anyTable` may set an id in which case it contains data for a single item. If id is not set, `anyTable` is
 * assumed to contain data for a list. Note that an item may contain lists as subdata.
 * `anyTable` uses an id key and a name key which must correspond to the `id_key` and `name_key` in the `anyModel`
 * class on the client side. These values must be set by the plugin classes deriving from `anyTable` (see
 * <a href="#api_plugin_classes">anyList plugins</a> below).
 *
 * Data returned from the server is formatted by the `anyTable` class into a hierarchical tree structure
 * that can be displayed by the `anyView` class on the client. This structure is exactly the same
 * as for the client <a href="#client_api_data_format">described above</a> (except that it is encoded
 * in PHP of course).
 *
 * <div style="border:1px solid #888; padding:5px;padding-bottom:0px;">
 * <b>A NOTE ON INDEXES:</b>
 *
 * When using Ajax to transfer a JSON data object from a PHP server to a Javascript client, the indexes of the data
 * object will automatically be converted to integers even if they are specified as strings on the server (PHP) side
 * (i.e. the string "38" on the server side will be converted to the integer 38 on the client side). When received on
 * the client (Javascript) side, the items in the data structure will therefore be ordered numerically. This may not
 * be the desired behaviour (we may want to preserve the ordering from the server). In order to get around this problem,
 * numeric indexes  are prefixed with a "+" on the server side so that the code on the client side will interpret
 * them as strings. The ordering of the items can then be maintained as intended by the server (the client code is
 * able to account for data indexed both as data[38] and data["+38"]).
 * </div>
 *
 * The minimal possible data structure for an __item__ on the server side may look like this:
 *
 *      $data = array (
 *        '+0' =>
 *        array (
 *          'item' => 'foo',
 *          'foo_name' => 'Hello world',
 *        ),
 *      );
 *
 * The minimal possible data structure for a __list__ on the server side may look like this:
 *
 *      $data = array (
 *        '+0' =>
 *        array (
 *          'list' => 'foo',
 *          'data' =>
 *          array (
 *            '+1' =>
 *            array (
 *              'foo_name' => 'Hello world',
 *            ),
 *            '+2' =>
 *            array (
 *              'foo_name' => 'Hello again world',
 *            ),
 *          ),
 *        ),
 *      );
 *
 * It should be noted that while they are valid data structures, the above examples are actually slight
 * simplifications: The server will always put the data into <i>groups</i>, even if it's just a single
 * item. This is done in order to be able to directly display grouped data with the view classes on the
 * client side. It is not something most users will need to think about, unless they are writing new
 * plugins or extending anyList itself.
 *
 * <div style="border:1px solid #888; padding:5px;padding-bottom:0px;">
 * <b>A NOTE ON DATA INSULATION:</b>
 *
 * The `anyGetData.php` script, which is the "gateway" to accessing the server, encapsulates the entire data
 * structure in an object indexed by `JSON_CODE`. This is done in order to insulate the data from error
 * messages that may be generated by the http server. On the client, the db* result methods "unwraps" the
 * data structure before it is processed further. If supplying your own success methods, this unwrapping
 * should be done explicitely, like this:
 * <pre>
 *   let serverdata = jqXHR;
 *   if (serverdata.JSON_CODE)
 *     serverdata = serverdata.JSON_CODE;
 *   ...
 * </pre>
 * </div>
 *
 * <hr style="color:#eee;"/>
 *
 * <a name="server_api_data_filter"></a>
 * <h3>Data filter</h3>
 *
 * The filters on the server side are used to indicate
 *
 *   - which data should be included in database operations `SEARCH`, `INSERT`, `UPDATE` and `DELETE`,
 *   - which data should be transferred to the client.
 *
 * Filters are defined for each plugin/type in the plugin's table file (e.g. `eventTable.php`).
 * There is one filter for items and one for lists and they are defined in the `createFilters()`
 * method.
 *
 * Example:
 *
      $this->mFilters["list"] = array(
        "event_id"          => 1,
        "event_name"        => 1,
        "event_place"       => 1,
        "event_date_start"  => 1,
        "event_date_end"    => 0,
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

 *
 * <hr style="color:#eee;"/>
 *
 * <a name="server_api_anyDefs"></a>
 * <h3>Configuration files</h3>
 *
 * When anyList is used in a server environment, the client and server must know how to communicate with each other.
 * This is done by setting certain values in the <b>`anyDefs.js`</b> and <b>`anyDefs.php`</b> configuration files.
 * Some of these values could and should be set by the user. Do this by editing the files, not programmatically.
 *
 * Common values for the two files are:
 *
 * `gServer`:
 * The host on which the server is run.
 *
 * `gHomeFolder`:
 * The anyList root directory. If anyList is run as a Wordpress plugin, `gHomeFolder` should be something like
 * `my_wp_installation/wp-content/plugins/anyList/`.
 *
 * `gThirdpartyJS`:
 * The location of the third party Javascript code.
 *
 * `gDataScript`:
 * The location of a script, relative to `gHomeFolder`, that delivers data on the correct JSON format. Default
 * value is `data/anyGetData.php`, which is the default script that gets data from the PHP backend. It is used by
 * the db* methods of `anyModel` and only when the `this.mode` variable is set to `remote`, otherwise the
 * setting is ignored. If a script is not specified in `gDataScript`, the data must be delivered to anyList by some
 * other method. Refer to the included examples.
 *
 * `gUploadFolder`:
 * The location of an upload folder, relative to gHomeFolder. Used by the `document` plugin.
 *
 * `gSkin`:
 * The skin (CSS) to use. Skins are found in the `view/skin/` folder.
 *
 * <h4>anyDefs.js</h4>
 *
 * anyDefs.js is located in the anyList `view` directory and must be included by Javascript code that wants
 * to interact with the database server backend.
 *
 * Sample listing of the `anyDefs.js` file:
 *
 *      let gServer       = "//localhost/";
 *      let gHomeFolder   = "projects/anyList/testserver/wp-content/plugins/anyList/";
 *      let gThirdpartyJS = "projects/anyList/thirdparty/javascript/";
 *      let gDataScript   = "data/anyGetData.php"; // Relative to gHomeFolder
 *      let gUploadFolder = "upload/";             // Relative to gHomeFolder
 *      let gSkin         = "default";
 *
 *      // Do not edit below unless you really know what you are doing.
 *
 *      let gVersion = "1.0.0";
 *
 *      let anyDefs = {
 *        dataScript:   gServer + gHomeFolder + gDataScript,                            // URL of data source script
 *        uploadURL:    gServer + gHomeFolder + gUploadFolder,                          // URL of upload folder
 *        uploadScript: gServer + gThirdpartyPHP + "ajaxfileupload/ajaxfileupload.php", // URL of upload script
 *      };
 *
 * <h4>anyDefs.php</h4>
 *
 * anyDefs.php is located in the anyList `data` directory and must be included by PHP code that wants
 * to interact with anyList clients.
 *
 * Sample listing of the `anyDefs.php` file:
 *
 *      <?php
 *      define("gServer",       "//localhost/");
 *      define("gHomeFolder",   "projects/anyList/testserver/wp-content/plugins/anyList/");
 *      define("gThirdpartyJS", "projects/anyList/thirdparty/");
 *      define("gDataScript",   "data/anyGetData.php"); // Relative to gHomeFolder
 *      define("gUploadFolder", "wordpress/upload/");   // Relative to gHomeFolder
 *      define("gSkin",         "default");
 *
 *      // Do not edit below unless you really know what you are doing.
 *
 *      define("gVersion", "1.0.0");
 *
 *      define("gHomePath",   $_SERVER['DOCUMENT_ROOT']."/".gHomeFolder);
 *      define("gAnyListURL", gServer.gHomeFolder);
 *
 *      define("gDataSource", $_SERVER['DOCUMENT_ROOT']."/".gHomeFolder.gDataScript);
 *      define("gUploadPath", $_SERVER['DOCUMENT_ROOT']."/".gHomeFolder.gUploadFolder);
 *
 *      define("gjQueryURL",        gServer.gThirdpartyJS."jquery/");
 *      define("gjQueryWidgetURL",  gServer.gThirdpartyJS."jquery/");
 *      define("gW3CSSURL",         gServer.gThirdpartyJS."w3css/");
 *      define("gFontAwesomeURL",   gServer.gThirdpartyJS."fontawesome/");
 *      define("gajaxFileUploadURL",gServer.gThirdpartyPHP."ajaxfileupload/");
 *
 *      define("WP_PLUGIN",""); // Comment out if using the server API, but not as a Wordpress plugin
 *      define("gWProot", dirname(dirname(dirname(dirname(dirname(__FILE__)))))); // Path to wp-load.php
 *      define("gWPLoad", gWProot."/wp-load.php"); // Wordpress functions
 *      ?>
 *
 * <h4>dbDefs.php</h4>
 *
 * Finally, there is the <b>dbDefs.php</b> file, located under `data/db/`, that defines the connection to the
 * database. The user should edit this file and set the host name, database name and database user/password.
 *
 * Sample listing of the `dbDefs.php` file:
 *
 *      <?php
 *      define('ANY_DB_HOST','127.0.0.1'); // Database server
 *      define('ANY_DB_USER','root');      // Database user
 *      define('ANY_DB_PASS','');          // Database password
 *      define('ANY_DB_NAME','any-testserver'); // Database name
 *
 *      define('ANY_DB_TYPE',   'mysql');  // Database type
 *      define('ANY_DB_CHARSET','UTF8');   // Database charset
 *
 *      define('ANY_USER',    'wp_users');    // Name of user table
 *      define('ANY_USERMETA','wp_usermeta'); // Name of user meta table
 *      ?>
 *
 * <hr/>
 *
 * <a name="api_plugin_classes"></a>
 * <h3>Plugins</h3>
 *
 * Each plugin on the client side corresponds to a plugin on the server side (e.g. "event", "user",
 * "document", "group", etc.). A plugin also corresponds to a `type` in the data model and a table
 * in the database.
 *
 * Below we will use the "task" plugin a an example. Follow the naming convention outlined.
 * To keep things simple, the code below does not actually contain any useful methods, just the
 * scaffolding for setting up the plugin.
 *
 * <h4>Writing new plugins</h4>
 *
 * **A) Client side code**
 *
 * It should be noted that it is not absolutely neccessary to create a client side plugin in order to
 * interact with a server side plugin - the default `anyModel` and `anyView` (or `anyViewTabs`)
 * classes might be used. If a client side plugin <i>is</i> created, it should inherit from `anyModel`
 * and `anyView` (or `anyViewTabs`) and should set the `type` (and optionally the `id_key` and
 * `name_key`) variable(s).
 *
 * 1) Create the folder "task" under view/plugins/ and create empty model, view, filter and validator files:
 *
 *        task/taskModel.js
 *        task/taskView.js
 *        task/taskFilter.js
 *        task/taskValidator.js
 *
 * 2) Create the folder "skin/default" under task/ and create an empty css file:
 *
 *        task/skin/default/task.css
 *
 * 3) Create the task model class in `taskModel.js`:
 *
          var taskModel = function (options)
          {
            this.type     = "task";
            this.id_key   = "task_id";
            this.name_key = "task_name";
            anyModel.call(this,options);
          };
          taskModel.prototype = new anyModel(null);
          taskModel.prototype.constructor = taskModel;
 *
 * 4) Create the task view class in `taskView.js`:
 *
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
 *
 * `5) Create the task filter class in `taskFilter.js:
 *
          var taskFilter = function (options)
          {
            this.filters = {
              task: {
                item: {
                  task_id:          { HEADER:"Task id",      DISPLAY:0, HTML_TYPE:"label"},
                  task_owner:       { HEADER:"Owner:",       DISPLAY:1, HTML_TYPE:"link"},
                  task_name:        { HEADER:"Task name:",   DISPLAY:1, HTML_TYPE:"link"},
                  task_description: { HEADER:"Description:", DISPLAY:1, HTML_TYPE:"textarea"},
                  task_date_start:  { HEADER:"Start date:",  DISPLAY:1, HTML_TYPE:"date"},
                  task_date_end:    { HEADER:"End date:",    DISPLAY:1, HTML_TYPE:"date"},
                  task_status:      { HEADER:"Status:",      DISPLAY:1, HTML_TYPE:"select", OBJ_SELECT:{0:"Not started",1:"In progress",2:"Completed"}},
                },
                list: {
                  task_id:          { HEADER:"Task id",      DISPLAY:0, HTML_TYPE:"label"},
                  task_owner:       { HEADER:"Owner",        DISPLAY:1, HTML_TYPE:"link"},
                  task_name:        { HEADER:"Task name",    DISPLAY:1, HTML_TYPE:"link"},
                  task_date_start:  { HEADER:"Start date",   DISPLAY:1, HTML_TYPE:"date"},
                  task_status:      { HEADER:"Status",       DISPLAY:1, HTML_TYPE:"select", OBJ_SELECT:{0:"Not started",1:"In progress",2:"Completed"}},
                },
                head: {
                  task_id:          { HEADER:"Task id",      DISPLAY:0, HTML_TYPE:"label"},
                  task_name:        { HEADER:"Task name",    DISPLAY:1, HTML_TYPE:"link"},
                },
                select: {
                  task_id:          { HEADER:"Task id",      DISPLAY:0, HTML_TYPE:"label"},
                  task_name:        { HEADER:"Task name",    DISPLAY:1, HTML_TYPE:"label"},
                },
              },
            };
          };
 *
 * 6) Create the task validator class in `taskValidator.js`:
 *
          var taskValidator = function ()
          {
          }

          taskValidator.prototype.validateUpdate = function (opt,view)
          {
            let err = "";
            if (!opt.id && opt.id != 0)
              err += "Task id missing. ";
            let elem_id_base = view.getIdBase()+"_"+opt.type+"_"+opt.kind+"_"+opt.id_str;
            let nameid1 = elem_id_base+"_task_name .itemEdit";
            let nameid2 = elem_id_base+"_task_name .itemUnedit";
            if (($("#"+nameid1).length != 0 && !$("#"+nameid1).val()) &&
                ($("#"+nameid2).length != 0 && !$("#"+nameid2).val()))
                err += "Task name missing. ";
            return err;
          };
 *
 * 7) Create the CSS code in `task.css`:
 *
          .task_name {
            font-family:  Arial, Helvetica, sans-serif;
            color:        blue;
          }
 *
 * **B) Server side code**
 *
 * It should be noted that this step is only neccessary if you want to use the server side database connection.
 *
 * On the server side a plugin corresponds to a table (and optionally a meta table) and inherits from `anyTable`.
 * Each plugin table class defines the following:
 * - a number of defining characteristica of the plugin table and meta table,
 * - the plugin's specific table (and optionally meta table) fields,
 * - the plugin's filter that describes which fields are used in database operations and transferred to and from
 *   the client,
 * - how the plugin interacts with other plugins (link table fields).
 *
 * A server side plugin should have three files placed in a folder below the `plugins` folder, in this case `client.php`,
 * `task.php` and `taskTable.php`.
 *
 * 1) Create the folder "task" under data/plugins/.
 *
 * 2) Create empty files for the database table file (`taskTable.php`), the file for accessing the
 *    task server directly (`task.php`) and the file for interacting with other plugins (`client.php`):
 *
 *      task/taskTable.php
 *      task/task.php
 *      task/client.php
 *
 * 3) Create the task database table class in `taskTable.php`:
 *
        <?php
          require_once "anyTable.php";
          class taskTable extends anyTable
          {
            protected $mTableDefs = [
              "tableName"          => "any_task",
              "tableNameMeta"      => "any_taskmeta",
              "tableNameGroupLink" => "any_task_group",
              "tableNameUserLink"  => "any_task_user",
              "type"               => "task",
              "idKey"              => "task_id",
              "idKeyTable"         => "task_id",
              "idKeyMetaTable"     => "task_id",
              "nameKey"            => "task_name",
              "orderBy"            => "task_date_start",
              "metaId"             => "meta_id",
              "fields" => [
                "task_id",
                "task_name",
                "task_description",
                "task_owner",
                "task_date_start",
                "task_date_end",
                "task_status",
              ],
              "fieldsMeta" => [
              ],
              "fieldsGroup" => [
                "group_type",
                "group_id",
                "group_name",
                "group_description",
                "group_sort_order",
                "group_status",
                "group_privacy",
              ],
              "fieldsLeftJoin" => [
                "group" => [
                  "group_id",
                ],
                "user" => [
                  "user_id",
                  ],
                "document" => [
                  "document_id",
                  ],
              ],
              "filters" => [
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
              ],
              "plugins" => ["task","group","user","document"],
            ];

            protected $mInsertSuccessMsg = "Task created. ",
                      $mUpdateSuccessMsg = "Task updated. ",
                      $mDeleteSuccessMsg = "Task deleted. ";

            public function __construct($connection)
            {
              parent::__construct($connection,$this->mTableDefs);
            }

            protected function initFilters($filters)
            {
              if (!$this->mFilters)
                return false;
              return true;
            }

            protected function findListWhere($skipOwnId=false)
            {
              $where = parent::findListWhere($skipOwnId);
              return $where;
            }

            protected function dbUpdateItem()
            {
              if (!anyTable::dbUpdateItem())
                return false;
              return true;
            }

            protected function dbUpdateExtra()
            {
            }
          }
        ?>
 *
 * 4) Create the file for accessing the task server directly (`task.php`):
 *
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
        var model = new taskModel({ data:        serverdata ? serverdata.data : null,
                                     permission: serverdata ? serverdata.permission : null,
                                     plugins:    serverdata ? serverdata.plugins : null,
                                     mode:       "remote",
                                  });
        var data_id = "<?php echo Parameters::get("task_id");?>";
        var is_new  = (data_id == "new" || parseInt(data_id) == -1);

        var view = new taskView({ id:          "<?php print $gViewArea;?>",
                                  model:       model,
                                  isEditable:  true,
                                  isDeletable: true,
                                  edit:        is_new,
                               });
        view.refresh({parent:null,data:null,id:null,type:"task"});
        </script>
 *
 * 5) Create the file for letting other plugins interact with the task plugin (`client.php`):
 *
        <link  href="<?php print gAnyListURL;?>view/plugins/task/skin/<?php print gSkin;?>/task.css" rel="stylesheet"/>
        <script src="<?php print gAnyListURL;?>view/plugins/task/taskModel.js"></script>
        <script src="<?php print gAnyListURL;?>view/plugins/task/taskFilter.js"></script>
        <script src="<?php print gAnyListURL;?>view/plugins/task/taskView.js"></script>
        <script src="<?php print gAnyListURL;?>view/plugins/task/taskValidator.js"></script>
 *
 * 6) Create the database table (MariaDB) with this SQL code:
 *
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
 *
 * **C) Wordpress integration**
 *
 * Edit the file wordpress/index.php and insert the following row in the "tooltab" table:
 *
        <td class="tooltd"
            onclick="javascript:loadPage('<?php print $gAdmViewArea;?>',
                                         '<?php print gAnyListURL;?>data/plugins/task/task.php?head=true&grouping=tabs',
                                         '<?php print $gAdmURL;?>');"
            title="Tasks">
          <i class="fas fa-file-alt fa-2x"></i><br/>Tasks
        </td>
 *
 * **D) Using the plugin**
 *
 * The plugin can now be accessed, either through the Wordpress integration described above, by accessing the
 * `task.php` file directly or by using the plugin in your own files.
 *
 * 1) Accessing the plugin through Wordpress: Pressing the "Task" icon should bring up a list containing the one task
 *    that was inserted by the by the SQL script above.
 *
 * 2) Accessing the plugin with the `task.php` file by entering the following URL in a browser:
 *
 *
 *
 * <h4>Included pre-defined plugins</h4>
 *
 * A number of useful plugins are included with anyList. They may be modified to suit the user's need.
 * Currently, anyList includes the following plugins:
 *
 * - <b>Group</b>: Grouping of other types/plugins.
 *
 * - <b>User</b>: Interacts with a user table on the database server. In a Wordpress environment, this
 *   means the `wp_users` table. It does not have methods for handling login, as this is done better
 *   and more securely by other Wordpress plugins.
 *
 * - <b>Document</b>: Handles collections of documents, images, etc.
 *
 * - <b>Event</b>: Contains methods for handling events for users.
 *
 * <hr/>
 *
 * <a name="wordpress_anyList"></a>
 * <h3>anyList and Wordpress</h3>
 *
 * More info coming soon.
 *
 * <hr/>
 *
 * <a name="full_examples"></a>
 * <h3>__Examples__</h3>
 *
 * Learning by example is an excellent way to master new programming libraries and concepts.
 * Below you will find a  number of examples ranging from the simple "hello world" to writing
 * complex anyList plugins in a client-server environment.
 *
 * 1) <a href="http://localhost/prosjekter/anyList/testserver/wp-content/plugins/anyList/examples/1_hello_world/">Hello world</a>
 *
 * 2)
 *
 * A collection of complete examples can be found <a>here</a> (coming soon).
 *
 * @module anyList
 * @main anyList
 */
