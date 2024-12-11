/* jshint sub:true */
/* jshint esversion: 9 */
/* globals i18n,any_defs,dbConnection,anyTableFactory,anyModel,test,module,deepEqual,asyncTest,start, */
"use strict";

/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2024 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ****************************************************************************************/

///////////////////////////////////////////////////////
// QUnit tests for Data module
///////////////////////////////////////////////////////

let millisec      = 3500;
let gDbase        = null;
let gTableFactory = null;
let gDBSource     = "local";

function doTest(thing)
{
  if (gDBSource == "local") {
    // Set up test database and call tests in connectSuccess
    gDbase = new dbConnection({
      dbname:    "test_anydbase",
      dbversion: "1",
      dbtype:    "INDEXEDDB", // "LOCALSTORAGE"
      onSuccess: connectSuccess,
      onFail:    connectFail,
    });
    if (gDbase.error) {
      console.error(gDbase.error);
      return;
    }
    gTableFactory = new anyTableFactory(gDbase);
  }
  else { // remote
    testModel();
  }
}

async function connectSuccess(options)
{
  console.log("connectSuccess");

  // Create table classes
  let p = "../data/alasql/types/";
  let ustab = await gTableFactory.createClass("userTable", {type:"user", path:p,header:true});
  let evtab = await gTableFactory.createClass("eventTable",{type:"event",path:p,header:true});

  // Create tables
  await ustab.dbCreate()
  .then( async () => {
    return await evtab.dbCreate();
  })
  .then( async () => {
    return await evtab.createLinkTables();
  });

  // Add some users
  await ustab.dbInsert({ keys: [ustab.idKey,ustab.nameKey,"user_login"], values: [11,"user 1","loginA"] });
  await ustab.dbInsert({ keys: [ustab.idKey,ustab.nameKey,"user_login"], values: [12,"user 2","loginB"] });
  await ustab.dbInsert({ keys: [ustab.idKey,ustab.nameKey,"user_login"], values: [13,"user 3","loginC"] });

  // Add some events
  await evtab.dbInsert({ keys: [evtab.idKey,evtab.nameKey], values: [550,"evt 550"] });
  await evtab.dbInsert({ keys: [evtab.idKey,evtab.nameKey], values: [552,"evt 552"] });
  await evtab.dbInsert({ keys: [evtab.idKey,evtab.nameKey], values: [555,"evt 555"] });

/*
  // Delete users with id 79 and 34, to satisify dbUpdate insert test (see below)
  let tempdm = new anyModel({type:"user",db_search:false,source:gDBSource,db_connection:gDbase});
  let id1 = gDBSource == "remote" ? 79 : "79";
  let id2 = gDBSource == "remote" ? 34 : "34";
  tempdm.dbDelete({sync:true,id:id1});
  tempdm = new anyModel({type:"user",db_search:false,source:gDBSource,db_connection:gDbase});
  tempdm.dbDelete({sync:true,id:id2});
  // Insert user with id 55, to satisfy dbDelete test (see below)
  tempdm.dbUpdate({sync:true,
                   is_new:true,
                   id:55,
                   new_data:{55:{list:"user",user_login:"thelogin",user_pass:"xxxx",user_pass_again:"xxxx",user_name:"thetester"}},
                   });
*/
  // Run the actual tests
  testModel();
}

function connectFail(error)
{
  console.log("connectFail:"+error);
}

///////////////////////////////////////////////////////////////////////////////////////////////////
// Test model
///////////////////////////////////////////////////////////////////////////////////////////////////

function testModel()
{
  ///////////////////////
  // Omitted tests for:
  // - cbSubscribe
  // - cbUnsubscribe
  // - cbReset
  // - cbExecute
  ///////////////////////

  module("Data");

  ///////////////////// constructor and dataInit tests /////////////////////

  test('constructor and dataInit', function() {

    let dm1 = new anyModel({source:gDBSource,db_connection:gDbase});
    deepEqual(dm1.data                       === null &&
              dm1.type                       === "" &&
              dm1.id                         === null &&
              dm1.id_key                     === "" &&
              dm1.name_key                   === "" &&
              dm1.source                     === gDBSource &&
              dm1.db_search                  === false &&
              dm1.db_search_term             === "" &&
              dm1.auto_search                === true &&
              dm1.auto_callback              === false &&
              dm1.permission                 !== undefined &&
              dm1.permission.current_user_id === null &&
              dm1.permission.is_logged_in    === true &&
              dm1.permission.is_admin        === false &&
              dm1.message                    === "" &&
              dm1.error                      === "" &&
              dm1.error_server               === "" &&
              dm1.db_timeout_sec             === 10,
              true, "Constructor sets correct defaults with no options.");

    dm1 = new anyModel({ type: "foo" });
    deepEqual(dm1.type             === "foo" &&
              dm1.id_key           === "foo_id" &&
              dm1.name_key         === "foo_name",
              true, "Constructor sets correct defaults for id_key and name_key when type is given in options.");

    dm1 = new anyModel({
                data:             { val: "dataobj" },
                type:             "fooobj",
                id_key:           "fooobj_id",
                name_key:         "fooobj_name",
                source:           gDBSource,
                db_search:        false,
                db_search_term:   "something",
                auto_search:      true,
                auto_callback:    false,
                message:          "a msg",
                error:            "an err",
                db_timeout_sec:   8,
              });
    deepEqual(dm1.data.val         === "dataobj" &&
              dm1.type             === "fooobj" &&
              dm1.id_key           === "fooobj_id" &&
              dm1.name_key         === "fooobj_name" &&
              dm1.source           === gDBSource &&
              dm1.db_search        === false &&
              dm1.db_search_term   === "something" &&
              dm1.auto_search      === true &&
              dm1.auto_callback    === false &&
              dm1.message          === "a msg" &&
              dm1.error            === (gDBSource == "remote" ? i18n.error.SERVER_ERROR : "an err") &&
              dm1.db_timeout_sec   === 8,
              true, "Constructor sets correct values when options is given.");

    let dm2 = new anyModel(null);
    let opt = { data:             { val: "dataobj" },
                type:             "barobj",
                id_key:           "barobj_id",
                name_key:         "barobj_name",
                source:           gDBSource,
                db_search:        false,
                db_search_term:   "Some thing",
                auto_search:      true,
                auto_callback:    false,
                message:          "The message",
                error:            "The error",
              };
    deepEqual(dm2.dataInit(opt),
              opt, "dataInit #1: return input options");
    let errmsg = dm2.source == "remote" ? i18n.error.SERVER_ERROR : "The error";
    deepEqual(dm2.data.val         === "dataobj" &&
              dm2.type             === "barobj" &&
              dm2.id_key           === "barobj_id" &&
              dm2.name_key         === "barobj_name" &&
              dm2.source           === gDBSource &&
              dm2.db_search        === false &&
              dm2.db_search_term   === "Some thing" &&
              dm2.auto_search      === true &&
              dm2.auto_callback    === false &&
              dm2.message          === "The message" &&
              dm2.error            === errmsg,
              true, "dataInit #2: init ok");
    let mdstr = "more data";
    let data = { data: mdstr };
    deepEqual(dm2.dataInit(data),
              data, "dataInit #3 return input data ok");
    deepEqual(dm2.data === mdstr,
              true,"dataInit #4 data init ok");
  });

  ///////////////////// end constructor and dataInit tests /////////////////////


  ///////////////////// _getDataSourceName test /////////////////////

  test('_getDataSourceName', function() {

    let dm1 = new anyModel({type:"foo",source:gDBSource,db_connection:gDbase});
    let dsn = dm1._getDataSourceName();
    let res = gDBSource == "remote" ? any_defs.dataScript : "";
    deepEqual(dsn === res,
              true, "_getDataSourceName ok");
  });

  ///////////////////// end _getDataSourceName test /////////////////////


  ///////////////////// dataSearch tests /////////////////////

  test('Model.dataSearch on model created with missing mandatory input', 1, function() {

    let dm = new anyModel({source:gDBSource,db_connection:gDbase});
    deepEqual(dm.dataSearch()                               === null &&
              dm.dataSearch({})                             === null &&
              dm.dataSearch({type:"bar",id:null,data:null}) === null &&
              dm.dataSearch({type:"bar",id:null,data:{}})   === null &&
              dm.dataSearch({type:null, id:"99",data:null}) === null &&
              dm.dataSearch({type:null, id:null,data:{}})   === null &&
              dm.dataSearch({type:"bar",id:"99",data:{}})   === null,
              true, "dataSearch with missing mandatory input return null");
  });

  test('Model.dataSearch on model created with conflicting types, id and data with wrong type', 1, function() {

    let dm = new anyModel({type:"foo",data:{99:{list:"bar"}}});
    deepEqual(dm.dataSearch()                   === null &&
              dm.dataSearch({           id:99}) === null &&
              dm.dataSearch({type:null, id:99}) === null &&
              dm.dataSearch({type:"fox",id:99}) === null &&
              dm.dataSearch({type:"foo",id:99}) === null,
              true, "dataSearch on model created with conflicting types return null");
  });

  test('Model.dataSearch for nonexisting id', 1, function() {

    let dm = new anyModel({type:"foo",data:{99:{list:"bar"}}});
    deepEqual(dm.dataSearch({type:"bar",id:100}) === null &&
              dm.dataSearch({type:"foo",id:100}) === null,
              true, "dataSearch for nonexisting id return null");
  });

  test('Model.dataSearch on model created with type, id and data with correct type', 3, function() {

    let dm = new anyModel({type:"foo",data:{99:{list:"foo"}}});
    let res = dm.dataSearch({type:"bar",id:"99"});
    deepEqual(res === null,
              true, "dm.dataSearch('bar','99')) return null");
    res = dm.dataSearch({type:"foo",id:"90"});
    deepEqual(res === null,
              true, "dm.dataSearch('foo','90')) return null");
    res = dm.dataSearch({type:"foo",id:"99"});
    deepEqual(res          !== null &&
              res[99].list === "foo",
              true, "dm.dataSearch('foo','99')) return correct data");
  });

  test('Model.dataSearch on model created with type, id and deep data', 3, function() {

    let dm = new anyModel({type:"foo",data:{99:{list:"bar",data:{11:{myname:"bar11"},
                                                                 12:{myname:"bar12"}}}}});
    let res = dm.dataSearch({id:"11"});
    deepEqual(res === null,
              true, "dm.dataSearch('11')) return null");
    res = dm.dataSearch({type:"foo",id:"99"});
    deepEqual(res === null,
              true, "dm.dataSearch('foo','99')) return null");
    res = dm.dataSearch({type:"bar",id:"11"});
    deepEqual(res          !== null &&
              res[11].myname === "bar11",
              true, "dm.dataSearch('bar','11')) return correct data");
  });

  test('Model.dataSearch on model created with type, id and deep data with deviant name_key', 5, function() {

    let data = {99:{list:"bar",data:{11:{list:"foo",name_key:"foz_name"},
                                     12:{list:"faz",name_key:"foo_name"},
                                     13:{list:"faz",name_key:"faz_name"}}}};
    let dm = new anyModel({type:"foo",data:data});
    let res = dm.dataSearch({id:"11"});
    deepEqual(res          !== null &&
              res[11].list === "foo",
              true, "dm.dataSearch('11')) return data");
    res = dm.dataSearch({id:"12"});
    deepEqual(res === null,
              true, "dm.dataSearch('12')) return null");
    res = dm.dataSearch({type:"foz",id:"11"});
    deepEqual(res === null,
              true, "dm.dataSearch('foz','11')) return null");
    res = dm.dataSearch({type:"faz",id:"12"});
    deepEqual(res          !== null &&
              res[12].list === "faz",
              true, "dm.dataSearch('faz','12')) return data");
    res = dm.dataSearch({id:"11"});
    deepEqual(res          !== null &&
              res[11].list === "foo",
              true, "dm.dataSearch('11')) return data");
  });

  test('Model.dataSearch on model created with type, id and deep data with deviant id_key', 5, function() {

    let data = {99:{list:"bar",data:{11:{list:"foo",id_key:"foz_id"},
                                     12:{list:"faz",id_key:"foo_id"},
                                     13:{list:"faz",id_key:"faz_id"}}}};
    let dm = new anyModel({type:"foo",data:data});
    let res = dm.dataSearch({id:"11"});
    deepEqual(res          !== null &&
              res[11].list === "foo",
              true, "dm.dataSearch('11')) return data");
    res = dm.dataSearch({id:"12"});
    deepEqual(res === null,
              true, "dm.dataSearch('12')) return null");
    res = dm.dataSearch({type:"foz",id:"11"});
    deepEqual(res === null,
              true, "dm.dataSearch('foz','11')) return null");
    res = dm.dataSearch({type:"faz",id:"12"});
    deepEqual(res          !== null &&
              res[12].list === "faz",
              true, "dm.dataSearch('faz','12')) return data");
    res = dm.dataSearch({id:"11"});
    deepEqual(res          !== null &&
              res[11].list === "foo",
              true, "dm.dataSearch('11')) return data");
  });

  test('Model.dataSearch for type only', 1, function() {

    let dm = new anyModel({type:"foo",data:{99:{list:"bar",data:{11:{myname:"bar11"},
                                                                 12:{myname:"bar12"}}}}});
    let res = dm.dataSearch({type:"bar"});
    deepEqual(res            !== null &&
              res[99]         !== null &&
              res[99].data    !== null &&
              res[99].data[11].myname === "bar11" && res[99].data[12].myname === "bar12",
              true, "dm.dataSearch('bar')) return correct type list data");
  });

  test('Model.dataSearch with parent == true', 1, function() {

    let data = {99:{type:"bar",data:{11:{type:"foo",foo_name:"The foo"}}}};
    let dm = new anyModel({data:data});
    let res = dm.dataSearch({type:"foo",id:"11",parent:true});
    deepEqual(res              !== null &&
              res.data         !== null &&
              res.data[11]     !== null &&
              res.data[11].foo_name === "The foo",
              true, "dm.dataSearch('foo','11', true)) return parent data");
  });

  // TODO: dataSearch tests with non-numerical indexes

  ///////////////////// end dataSearch tests /////////////////////


  ///////////////////// dataSearchNextId / dataSearchMaxId tests /////////////////////

  test('dataSearchNextId and dataSearchMaxId', function() {

    var data1 = {
      6: {
        head: "group",
        group_name: "Group 1",
        data: {
          919411: { // event_id
            item: "event",
            event_name: "Event 1",
            data: {
              2: {
                head: "user",
                user_name: "User list",
                data: {
                  693: {
                    user_name: "User 1",
                  },
                  760: { // user_id
                    user_name: "User 2",
                  },
                  829: {
                    user_name: "User 3",
                    event_list: {
                      10: {
                        event_name: "User 3 Event 1",
                      },
                      11: {
                        event_name: "User 3 Event 2",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
    let dm2 = new anyModel({
                    type: "user",
                    data: data1,
                  });
    // dataSearchNextId basically just calls dataSearchMaxId and adds 1.
    deepEqual(dm2.dataSearchNextId(null,"group") === 7,
              true, "dataSearchNextId('group') === 7");
    deepEqual(dm2.dataSearchNextId(null,"event") === 919412,
              true, "dataSearchNextId('event') === 919412");
    deepEqual(dm2.dataSearchNextId() === 830,
              true, "dataSearchNextId() === 830");
    deepEqual(dm2.dataSearchNextId(null,"user") === 830,
              true, "dataSearchNextId('user') === 830");
    deepEqual(dm2.dataSearchNextId(null,"new_type") === -1,
              true, "dataSearchNextId('new_type') === -1");

    // TODO: Tests for non-numerical indexes
  });

  ///////////////////// end dataSearchNextId / dataSearchMaxId tests /////////////////////


  ///////////////////// dataInsert tests /////////////////////

  test('Model.dataInsert', 16, function() {

    let mdata = null;
    let dm    = new anyModel({type:"foo",data:mdata});
    let idata = {14:{list:"barbar",barbar_name:"The barbar"}};
    let res   = dm.dataInsert({new_data: idata,
                               type:     "bar"});
    deepEqual(dm.data[14].barbar_name == "The barbar" &&
              res[14].barbar_name == "The barbar",
              true, "dataInsert with new_id and id both not specified");

    mdata = null;
    dm    = new anyModel({type:"foo",data:mdata});
    idata = {list:"barbar",barbar_name:"The barbar"};
    res   = dm.dataInsert({new_data: idata,
                           new_id:   77,
                           type:     "bar"});
    deepEqual(dm.data[77].barbar_name == "The barbar" &&
              res.barbar_name == "The barbar",
              true, "dataInsert with new_id specified and id not specified");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"foo",data:mdata});
    idata = {14:{list:"barbar",barbar_name:"The barbar"}};
    res   = dm.dataInsert({new_data: idata,
                           id:       99,
                           type:     "bar"});
    deepEqual(dm.data[99].data[14].barbar_name == "The barbar" &&
              res[14].barbar_name == "The barbar",
              true, "dataInsert with new_id not specified and id specified");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"foo",data:mdata});
    idata = {list:"barbar",barbar_name:"The barbar"};
    res   = dm.dataInsert({new_data: idata,
                           new_id:   13,
                           id:       99,
                           type:     "bar"});
    deepEqual(dm.data[99].data[13].barbar_name == "The barbar" &&
              res.barbar_name == "The barbar",
              true, "dataInsert with new_id and id both specified");

    let mdata2 = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                       12:{list:"faz",faz_name:"The faz"}}}};
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"foo",data:mdata});
    idata = {list:"barbar",barbar_name:"The barbar"};
    res   = dm.dataInsert({new_data: idata,
                           new_id:   13,
                           id:       99,
                           type:     null});
    deepEqual(res === null &&
              JSON.stringify(dm.data) === JSON.stringify(mdata2),
              true, "dataInsert with type == null and incorrect in-type (does not insert)");

    mdata = {99:{list:"foo",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"foo",data:mdata});
    idata = {list:"foo",foo_name:"The foo"};
    res   = dm.dataInsert({new_data: idata,
                           new_id:   13,
                           id:       99,
                           type:     null});
    deepEqual(res.foo_name === "The foo" &&
              JSON.stringify(dm.data) !== JSON.stringify(mdata2),
              true, "dataInsert with type == null and correct in-type (does insert)");

    mdata2 = {99:{list:"bar",data:{11:{list:"fii",foo_name:"The foo"},
                                   12:{list:"faz",faz_name:"The faz"}}}};
    mdata = {99:{list:"bar",data:{11:{list:"fii",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"bar",data:mdata});
    idata = {list:"barbar",barbar_name:"The barbar"};
    res   = dm.dataInsert({new_data: idata,
                           new_id:   13,
                           id:       99,
                           type:     "bar"});
    deepEqual(res.barbar_name === "The barbar" &&
              JSON.stringify(dm.data) !== JSON.stringify(mdata2),
              true, "dataInsert with type given and non-matching in-type (does insert)");

    mdata2 = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                   12:{list:"faz",faz_name:"The faz"}}}};
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"bar",data:mdata});
    idata = {list:"foo",foo_name:"The foo"};
    res   = dm.dataInsert({new_data: idata,
                           new_id:   13,
                           id:       99,
                           type:     "bar"});
    deepEqual(res.foo_name === "The foo" &&
              JSON.stringify(dm.data) !== JSON.stringify(mdata2),
              true, "dataInsert with type given and matching in-type (does insert)");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"bar",data:mdata});
    idata = {list:"barbar",barbar_name:"The barbar"};
    res   = dm.dataInsert({new_data: idata,
                           new_id:   13,
                           id:       99,
                           type:     "baz"});
    deepEqual(res === null &&
              JSON.stringify(dm.data) === JSON.stringify(mdata2),
              true, "dataInsert with nonexisting type given");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"bar",data:mdata});
    idata = {list:"bar",bar_name:"The bar"};
    res   = dm.dataInsert({new_data: idata,
                           new_id:   -1,
                           id:       99,
                           type:     "bar"});
    deepEqual(res.bar_name === "The bar" &&
              JSON.stringify(dm.data) !== JSON.stringify(mdata2),
              true, "dataInsert with correct new_data/id/type and new_id == -1");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"bar",data:mdata});
    idata = {14:{list:"foo",foo_name:"The foo"}};
    res   = dm.dataInsert({new_data: idata,
                           type:     "foo"});
    deepEqual(dm.data[14].list === 'foo',
              true, "dataInsert into existing data with new_id and id both not specified");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"bar",data:mdata});
    idata = {14:{list:"foo",foo_name:"The foo"}};
    res   = dm.dataInsert({new_data: idata,
                           id:       99,
                           type:     "bar"});
    deepEqual(dm.data[99].data[14].list === 'foo',
              true, "dataInsert into existing data with new_id not specified and id specified");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"bar",data:mdata});
    idata = {list:"foo",foo_name:"The foo"};
    res   = dm.dataInsert({new_data: idata,
                           new_id:   17,
                           type:     "bar"});
    deepEqual(dm.data[17].list === 'foo',
              true, "dataInsert into existing data with new_id specified and id not specified");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"bar",data:mdata});
    idata = {list:"bar",bar_name:"The bar"};
    res   = dm.dataInsert({new_data: idata,
                           new_id:   -1,
                           id:       99});
    deepEqual(dm.data[99].data[100].list === 'bar',
              true, "dataInsert into existing data with id specified and new_id==-1");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"foo",data:mdata});
    idata = {list:"bar",bar_name:"The bar"};
    res   = dm.dataInsert({new_data: idata,
                           id:       -1,
                           type:     "bar"});
    deepEqual(res === null,
              true, "dataInsert with id negative integer id returns null");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"foo",data:mdata});
    idata = {list:"bar",bar_name:"The bar"};
    res   = dm.dataInsert({new_data: idata,
                           id:       66,
                           type:     "bar"});
    deepEqual(res === null,
              true, "dataInsert with nonexisting id returns null");

    // TODO: Tests for non-numerical indexes

  });
  ///////////////////// end dataInsert tests /////////////////////


  ///////////////////// dataInsertHeader tests /////////////////////

  test('Model.dataInsertHeader', 3, function() {
    let mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                      12:{list:"faz",faz_name:"The faz"}}}};
    let dm    = new anyModel({type:"bar",data:mdata});
    let res   = dm.dataInsertHeader({type:"bar",header:"Head master"});
    deepEqual(dm.data["0"].bar_name == "Head master",
              true, "dataInsertHeader in data structure with same type, containing data: ok");
    dm    = new anyModel({type:"foo",data:mdata});
    res   = dm.dataInsertHeader({type:"bar",header:"Head master"});
    deepEqual(dm.data["0"].bar_name == "Head master",
              true, "dataInsertHeader in data structure with different type, containing data: ok");
    dm    = new anyModel({type:"foo",data:null});
    res   = dm.dataInsertHeader({type:"bar",header:"Head master"});
    res   = dm.dataInsert({new_data: mdata,
                           type:     "bar"});
    deepEqual(dm.data &&
              dm.data["0"].bar_name == "Head master" &&
              dm.data["0"].data != undefined && dm.data["0"].data[99] != undefined,
              true, "dataInsertHeader in data structure not containing data: ok");
  });
  ///////////////////// end dataInsertHeader tests /////////////////////


  ///////////////////// dataUpdate tests /////////////////////

  test('Model.dataUpdate', 6, function() {
    // Normal case
    let mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                      12:{list:"faz",faz_name:"The faz"}}}};
    let dm    = new anyModel({type:"foo",data:mdata});
    let res   = dm.dataUpdate({new_data: {foo_name:"Foz Baz"},
                               id:       "11",
                               type:     "foo"});
    deepEqual(res !== null &&
              dm.data[99].data[11].foo_name === "Foz Baz" &&
              dm.data[99].data[11].dirty !== undefined,
              true, "dataUpdate with type, id and new_data returns correctly updated data and dirty object");

    // Unexisting type
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"foo",data:mdata});
    res   = dm.dataUpdate({new_data: {foo_name:"Foz Baz"},
                           id:       "11",
                           type:     "fiz"});
    deepEqual(res === null &&
              dm.data[99].data[11].foo_name === "The foo" &&
              dm.data[99].data[11].dirty === undefined,
              true, "dataUpdate with illegal type, but legal id and new_data returns null and data is not changed");

    // Missing type
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"biz",data:mdata});
    res   = dm.dataUpdate({new_data: {foo_name:"Foz Baz"},
                           id:       "11"});
    deepEqual(res === null &&
              dm.data[99].data[11].foo_name === "The foo" &&
              dm.data[99].data[11].dirty === undefined,
              true, "dataUpdate with missing type, but legal id and new_data returns null and data is not changed");

    // Missing id
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"biz",data:mdata});
    res   = dm.dataUpdate({new_data: {foo_name:"Foz Baz"},
                           type:     "foo"});
    deepEqual(res === null &&
              dm.data[99].data[11].foo_name === "The foo" &&
              dm.data[99].data[11].dirty === undefined,
              true, "dataUpdate with missing id, but legal type and new_data returns null and data is not changed");

    // Negative id
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"biz",data:mdata});
    res   = dm.dataUpdate({new_data: {foo_name:"Foz Baz"},
                           id:       -1,
                           type:     "foo"});
    deepEqual(res === null &&
              dm.data[99].data[11].foo_name === "The foo" &&
              dm.data[99].data[11].dirty === undefined,
              true, "dataUpdate with negative id, but legal type and new_data returns null and data is not changed");

    // Missing new_data
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm    = new anyModel({type:"biz",data:mdata});
    res   = dm.dataUpdate({id:   "11",
                           type: "foo"});
    deepEqual(res === null &&
              dm.data[99].data[11].foo_name === "The foo" &&
              dm.data[99].data[11].dirty === undefined,
              true, "dataUpdate with missing new_data, but legal type and id returns null and data is not changed");

    // TODO: Tests for non-numerical indexes
  });

  ///////////////////// end dataUpdate tests /////////////////////


  ///////////////////// start dataUpdateLinkList tests /////////////////////

  test('Model.dataUpdateLinkList', 10, function() {
    let dm = new anyModel({type:"user",
                           data:{99:{data:{11:{list:"user",user_name:"The first user"},
                                           12:{list:"user",user_name:"The second user"}}}}});
    let del = new Set(); del.add(11);
    let ins = new Set(); ins.add(14);
    let new_data = {14:{list:"user",user_name:"Added user 14"}};
    let res = dm.dataUpdateLinkList({type:      "user",
                                     id:        99,
                                     link_type: "user",
                                     unselect:  del,
                                     select:    ins,
                                     new_data:  new_data,
                                   });
    console.log(JSON.stringify(dm.data));
    deepEqual(res === true &&
              dm.data[99] !== undefined &&
              dm.data[99].data[11] === undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99].data["link-user"].data[14] !== undefined,
              true, "dataUpdateLinkList - normal case 1. ");

    dm = new anyModel({type:"user",
                       data:{99:{data:{11:{list:"user",user_name:"The first user"},
                                       12:{list:"user",user_name:"The second user"},
                                       13:{list:"event",event_name:"The 13 event"}}}}});
    del = new Set(); del.add(11); del.add(13);
    ins = new Set(); ins.add(14);
    new_data = {14:{list:"event",event_name:"Added event 14"}};
    res = dm.dataUpdateLinkList({type:      "user",
                                 id:        99,
                                 unselect:  del,
                                 select:    ins,
                                 link_type: "event",
                                 new_data:  new_data,
                               });
    console.log(JSON.stringify(dm.data));
    deepEqual(res !== null &&
              dm.data[99] !== undefined &&
              dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99].data[13] === undefined &&
              dm.data[99].data["link-event"].data[14] !== undefined,
              true, "dataUpdateLinkList - normal case 2. ");

    var evus = getPermutations(["user","event"], 4);
    for (let i in evus) {
      console.log("------------ test "+i);
      let arr = evus[i];
      let tdat = arr[0];
      let tnew = arr[1];
      let ttyp = arr[2];
      let tlnk = arr[3];
      let nnew = tnew + "_name";
      let ndat = tdat + "_name";
      let dm = new anyModel({type:tdat,
                             data:{99:{data:{11:{list:tdat,[ndat]:"The first " +tdat},
                                             12:{list:tdat,[ndat]:"The second "+tdat}}}}});
      let del = new Set(); del.add(11);
      let ins = new Set(); ins.add(14);
      let new_data = {14:{list:tnew,[nnew]:"Added "+tnew+" 14"}};
      console.log("model data: " +tdat);
      console.log("new data:   " +tnew);
      console.log("type:       " +ttyp);
      console.log("link_type:  " +tlnk);
      console.log(JSON.stringify(dm.data));
      console.log(JSON.stringify(new_data));
      let res = dm.dataUpdateLinkList({type:      ttyp,
                                       id:        99,
                                       unselect:  del,
                                       select:    ins,
                                       link_type: tlnk,
                                       new_data:  new_data,
                                     });
      console.log(JSON.stringify(dm.data));
      deepEqual(res !== null,
                true, "dataUpdateLinkList - different types ("+i+"). ");
      if (i==7)
        break;
    }
  });

  ///////////////////// end dataUpdateLinkList tests /////////////////////


  ///////////////////// start dataUpdateLink tests /////////////////////
  // TODO
  ///////////////////// end dataUpdateLink tests /////////////////////


  ///////////////////// dataDelete tests /////////////////////

  test('Model.dataDelete', 8, function() {
    // Normal case
    let mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                      12:{list:"faz",faz_name:"The faz"}}}};
    let dm = new anyModel({type:"foo",data:mdata});
    let res = dm.dataDelete({type:"foo",id:"11"});
    deepEqual(res !== null &&
              dm.data[99].data[11] === undefined &&
              dm.data[99].data[12] !== undefined,
              true, "dataDelete with type and id correctly deletes data");

    // Subdata is deleted
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"foo",data:mdata});
    res = dm.dataDelete({type:"bar",id:"99"});
    deepEqual(res !== null &&
              dm.data[99] === undefined,
              true, "dataDelete with type and id correctly deletes data and subdata");

    // Non-existing type
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"foo",data:mdata});
    res = dm.dataDelete({type:"biz",id:"99"});
    deepEqual(res === null &&
              dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined,
              true, "dataDelete with nonexisting type returns null and data is not deleted, 1 of 2");

    // Missing type
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"foo",data:mdata});
    res = dm.dataDelete({id:"99"});
    deepEqual(res === null &&
              dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined,
              true, "dataDelete with missing type returns null and data is not deleted, 1 of 2");

    // Non-existing id
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"foo",data:mdata});
    res = dm.dataDelete({type:"bar",id:"999"});
    deepEqual(res === null &&
              dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined,
              true, "dataDelete with nonexisting id returns null and data is not deleted, 1 of 2");

    // Missing id
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"foo",data:mdata});
    res = dm.dataDelete({type:"bar"});
    deepEqual(res === null &&
              dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined,
              true, "dataDelete with missing id returns null and data is not deleted, 1 of 2");

    // Type and id does not match, 1 of 2
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"foo",data:mdata});
    res = dm.dataDelete({type:"faz",id:"11"});
    deepEqual(res === null &&
              dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined,
              true, "dataDelete with type and id does not match returns null and data is not deleted, 1 of 2");

    // Type and id does not match, 2 of 2
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"foo",data:mdata});
    res = dm.dataDelete({type:"foo",id:"12"});
    deepEqual(res === null &&
              dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined,
              true, "dataDelete with type and id does not match returns null and data is not deleted, 2 of 2");

    // TODO: Tests for non-numerical indexes
  });

  ///////////////////// end dataDelete tests /////////////////////


  ///////////////////// dbSearch tests /////////////////////

  let myid   = "11";
  let idchk  = gDBSource == "local" ? "11" : "+11";
  let uname  = /*"The faz user";*/ "user 1";
  let ulogin = /*"fazuser";     */ "loginA";

  let ntests = gDBSource != "local" ? 4 : 3;
  asyncTest('dbSearch normal case - item, with header', ntests, function() {
    let dm = new anyModel({ type:"user",db_search:false,source:gDBSource,db_connection:gDbase });
    let res = dm.dbSearch({ id:myid,header:true,
                 onSuccess:
                 function(context,serverdata,options)
                 {
                   dm.dbSearchSuccess(context,serverdata,options); // Call default success function to get data
                   deepEqual(dm.error === "",
                             true, "dbSearch({id:"+myid+"}) no error:"+dm.error);
                   deepEqual(dm.data !== null,
                             true, "dbSearch({id:"+myid+"}) returns item data:"+JSON.stringify(dm.data));
                   deepEqual(dm.data &&
                             dm.data[idchk] &&
                             dm.data[idchk].data &&
                             dm.data[idchk].data[idchk] &&
                             parseInt(dm.data[idchk].data[idchk][dm.id_key]) === parseInt(myid) &&
                             (dm.data[idchk].data[idchk][dm.name_key]        === uname ||
                              dm.data[idchk].data[idchk]["user_login"]       === ulogin),
                             true, "dbSearch({id:"+myid+"}) returns expected data");
                   start();
                 },
              });
    if (gDBSource != "local")
      deepEqual(res, true, "dbSearch({id:'"+myid+"'}) returns true");
  });

  asyncTest('dbSearch normal case - item, without header', ntests, function() {
    let dm = new anyModel({ type:"user",db_search:false,source:gDBSource,db_connection:gDbase} );
    let res = dm.dbSearch({ id:myid,
                            onSuccess:
                            function(context,serverdata,options)
                            {
                              setTimeout(function() {
                                dm.dbSearchSuccess(context,serverdata,options); // Call default success function to get data
                                deepEqual(dm.error === "",
                                          true, "dbSearch({id:"+myid+"}) no error:"+dm.error);
                                deepEqual(dm.data !== null,
                                          true, "dbSearch({id:"+myid+"}) returns item data:"+JSON.stringify(dm.data));
                                deepEqual(dm.data &&
                                          dm.data[idchk] &&
                                          dm.data[idchk].data &&
                                          parseInt(dm.data[idchk].data[idchk][dm.id_key]) === parseInt(myid) &&
                                          (dm.data[idchk].data[idchk][dm.name_key]        === uname ||
                                           dm.data[idchk].data[idchk]["user_login"]       === ulogin),
                                          true, "dbSearch({id:"+myid+"}) returns expected data");
                                start();
                              }, millisec);
                            },
                         });
    if (gDBSource != "local")
      deepEqual(res, true, "dbSearch({id:"+myid+"}) returns true");
  });

  asyncTest('dbSearch normal case - list', ntests, function() {
    let dm = new anyModel({ type:"user",db_search:false,source:gDBSource,db_connection:gDbase} );
    let res = dm.dbSearch({ type:"user",
                            onSuccess:
                            function(context,serverdata,options)
                            {
                              setTimeout(function() {
                                dm.dbSearchSuccess(context,serverdata,options); // Call default success function to get data
                                deepEqual(dm.error === "",
                                          true, "dbSearch() no error in success handler:"+dm.error);
                                uname  = "The faz user";
                                let item = dm.dataSearch({type:"user",id:myid});
                                deepEqual(item !== null &&
                                          parseInt(item[idchk][dm.id_key]) === parseInt(myid) &&
                                          (item[idchk][dm.name_key]        === uname ||
                                           item[idchk]["user_login"]       === ulogin),
                                          true, "dbSearch() returns expected data");
                                deepEqual(dm.data  !== null,
                                          true, "dbSearch() returns list data:"+JSON.stringify(dm.data));
                                start();
                              }, millisec);
                            },
                         });
    if (gDBSource != "local")
      deepEqual(res,true, "dbSearch() returns true");
  });

  ntests = gDBSource != "local" ? 3 : 2;
  asyncTest('dbSearch with non-existing model type and id_key', ntests, function() {
    let dm = new anyModel({type:"foobar",id_key:"foobar_name",db_search:false,source:gDBSource,db_connection:gDbase});
    let res = dm.dbSearch({id:"3",
                            onSuccess:
                            function(context,serverdata,options)
                            {
                              setTimeout(function() {
                                dm.dbSearchSuccess(context,serverdata,options); // Call default success function to get data
                                deepEqual(dm.error !== "",
                                          true, "dbSearch({id:'3'}) error:"+dm.error);
                                deepEqual(dm.data  === null,
                                          true, "dbSearch({id:'3'}) returns no data:"+JSON.stringify(dm.data));
                                start();
                              }, millisec);
                            },
                          });
    if (gDBSource != "local")
      deepEqual(res, true, "dbSearch({id:'3'}) returns true");
  });

  asyncTest('dbSearch with existing model type but non-existing id_key', ntests, function() {
    let dm = new anyModel({type:"user",id_key:"foo",db_search:false,source:gDBSource,db_connection:gDbase});
    let res = dm.dbSearch({ id:myid,
                            onSuccess:
                            function(context,serverdata,options)
                            {
                              setTimeout(function() {
                                dm.dbSearchSuccess(context,serverdata,options); // Call default success function to get data
                                deepEqual(dm.error === "",
                                          true, "dbSearch({id:"+myid+"}) no error:"+dm.error);
                                deepEqual(dm.data  !== null,
                                          true, "dbSearch({id:"+myid+"}) returns list data instead of item data:"+JSON.stringify(dm.data));
                                start();
                              }, millisec);
                            },
                         });
    if (gDBSource != "local")
      deepEqual(res, true, "dbSearch({id:"+myid+"}) returns true");
  });

  asyncTest('dbSearch with non-existing model type but existing type in search options', ntests, function() {
    let dm = new anyModel({ type:"foo",db_search:false,source:gDBSource,db_connection:gDbase});
    let res = dm.dbSearch({ type:"user",id:myid,
                            onSuccess:
                            function(context,serverdata,options)
                            {
                              dm.dbSearchSuccess(context,serverdata,options); // Call default success function to get data
                              setTimeout(function() {
                                deepEqual(dm.error === "",
                                          true, "dbSearch({type:'user',id:"+myid+"}) no error:"+dm.error);
                                deepEqual(dm.data  !== null,
                                          true, "dbSearch({type:'user',id:"+myid+"}) returns item data for type given in search options:"+JSON.stringify(dm.data));
                                start();
                              }, millisec);
                            },
                         });
    if (gDBSource != "local")
      deepEqual(res, true, "dbSearch({type:'user',id:"+myid+"}) returns true");
  });

  ntests = gDBSource != "local" ? 4 : 3;
  asyncTest('dbSearch for next id through dbSearch with id==max', ntests, function() {
    let dm = new anyModel({ type:"user",db_search:false,source:gDBSource,db_connection:gDbase});
    let res = dm.dbSearch({ type:"user",id:"max",
                            onSuccess:
                            function(context,serverdata,options)
                            {
                              dm.dbSearchSuccess(context,serverdata,options); // Call default success function to get data
                              setTimeout(function() {
                                deepEqual(dm.error === "",
                                          true, "dbSearch({type:'user',id:'max'}) no error:"+dm.error);
                                deepEqual(dm.data  === null,
                                          true, "dbSearch({type:'user',id:'max'}) returns item data for type given in search options:"+JSON.stringify(dm.data));
                                deepEqual(parseInt(dm.max) > 3, // Assuming that last user id==3 in the db table
                                          true, "dbSearch({type:'user',id:'max'}) id > 3:"+dm.max);
                                start();
                              }, millisec);
                            },
                         });
    if (gDBSource != "local")
      deepEqual(res, true, "dbSearch({type:'user',id:'max'}) returns true");
  });

  asyncTest('dbSearch for next id through dbSearchNextId', ntests, function() {
    let dm = new anyModel({ type:"user",db_search:false,source:gDBSource,db_connection:gDbase});
    let res = dm.dbSearchNextId({ type:"user",id:"max",
                                  onSuccess:
                                  function(context,serverdata,options)
                                  {
                                    dm.dbSearchNextIdSuccess(context,serverdata,options); // Call default success function to get data
                                    setTimeout(function() {
                                      deepEqual(dm.error === "",
                                                true, "dbSearchNextId({type:'user',id:'max'}) no error:"+dm.error);
                                      deepEqual(dm.data  === null,
                                                true, "dbSearchNextId({type:'user',id:'max'}) returns item data for type given in search options:"+JSON.stringify(dm.data));
                                      deepEqual(parseInt(dm.max) > 3, // Assuming that last user id==3 in the db table
                                                true, "dbSearchNextId({type:'user',id:'max'}) id > 3:"+dm.max);
                                      start();
                                    }, millisec);
                                  },
                               });
    if (gDBSource != "local")
      deepEqual(res, true, "dbSearchNextId({type:'user',id:'max'}) returns true");
  });

  ///////////////////// end dbSearch tests /////////////////////


  ///////////////////// dbUpdate tests /////////////////////

  asyncTest("dbUpdate - item: normal case (user "+myid+" must exist in database)", 3, async function() {
    let data = {99:{list:"bar",data:{11:{list:"foo",foz_name:"The foo foz"},
                                     12:{list:"faz",foo_name:"The faz foo"},
                                     [myid]:{list:"user",user_name:"The faz user",
                                         dirty:{list:"user",user_name:"The faz user"}}}}};
    let dm = new anyModel({type:"user",db_search:false,source:gDBSource,db_connection:gDbase,data:data});
    let res = await dm.dbUpdate({ type:"user",id:myid,
                       onSuccess:
                       function(context,serverdata,options)
                       {
                         dm.dbUpdateSuccess(context,serverdata,options); // Call default success function to get data
                         setTimeout(function() {
                           let item = dm.dataSearch({type:"user",id:myid});
                           deepEqual(item[myid].user_name === "The faz user" &&
                                     item[myid].dirty === undefined,
                                     true, "dbUpdate({type:'user',id:"+myid+"}) returns with correct data in memory:"+
                                           item[myid].user_name+","+item[myid].dirty);
                           let dm2 = new anyModel({type:"user",db_search:false,source:gDBSource,db_connection:gDbase,data:null});
                           dm2.dbSearch({type:"user",id:myid});
                           setTimeout(function() {
                             deepEqual(dm2.data && parseInt(dm2.data[idchk].data[idchk].user_id) === parseInt(myid),
                                       true, "dbUpdate({type:'user',id:"+myid+"}) returns with correct data in database");
                             start();
                           }, millisec);
                         }, millisec);
                       },
                    });
    deepEqual(res, true, "dbUpdate({type:'user',id:"+myid+"}) returns true");
  });

  asyncTest('dbUpdate - item: empty input', 1, async function() {
    let data = {99:{list:"bar",data:{11:{list:"foo",foz_name:"The foo foz"},
                                     12:{list:"faz",foo_name:"The faz foo"},
                                     50:{list:"event",event_name:"The faz event",
                                         dirty:{list:"event",event_name:"The faz event"}}}}};
    let dm = new anyModel({type:"event",db_search:false,source:gDBSource,db_connection:gDbase,data:data});
    let res = await dm.dbUpdate({
                       onSuccess:
                       function(context,serverdata,options)
                       {
                         dm.dbUpdateSuccess(context,serverdata,options); // Call default success function to get data
                         let item = dm.dataSearch({type:"event",id:50});
                         deepEqual(item[50].event_name === "The faz event" &&
                                   item[50].dirty !== undefined,
                                   true, "dbUpdate({type:'event',id:50}) with empty input returns returns unchanged memory data:"+
                                         item[50].event_name+","+item[50].dirty);
                         let dm2 = new anyModel({type:"event",db_search:false,source:gDBSource,db_connection:gDbase,data:null});
                         dm2.dbSearch({type:"baz",id:50,
                             onSuccess:
                             function(context,serverdata,options)
                             {
                               dm.dbSearchSuccess(context,serverdata,options); // Call default success function to get data
                               deepEqual(dm2.data=== null,
                                         true, "dbUpdate({type:'event',id:50}) with empty input returns null from dbSearch:"+
                                               dm2.data);
                             },
                         });
                       },
                     });
    setTimeout(function() {
      deepEqual(res, false, "dbUpdate({type:'event',id:50}) with empty input returns false");
      start();
    }, millisec);
  });

  asyncTest('dbUpdate - item: id exists in model, but not in database', 3, async function() {
    let tempdm = new anyModel({type:"event",db_search:false,source:gDBSource,db_connection:gDbase});
    await tempdm.dbDelete({sync:true,id:"666"}); // Make sure item is not in database
    let data = {99:{list:"bar",data:{11:{list:"foo",foz_name:"The foo foz"},
                                     12:{list:"faz",foo_name:"The faz foo"},
                                     666:{list:"event",event_name:"The faz event",
                                         dirty:{list:"event",event_name:"The faz event"}}}}};
    let dm = new anyModel({type:"event",data:data,db_search:false,source:gDBSource,db_connection:gDbase});
    let is_new = true; // Should work with both true and false
    let res = await dm.dbUpdate({ type:"event",id:666,
                                  is_new:is_new, // Must give is_new flag to update dbase when an id is also given
                       onSuccess:
                       async function(context,serverdata,options)
                       {
                         dm.dbUpdateSuccess(context,serverdata,options); // Call default success function to get data
                         let item = dm.dataSearch({type:"event",id:666});
                         let tst = is_new
                                   ? dm.error === "" &&
                                     item[666].event_name === "The faz event" &&
                                     item[666].dirty === undefined
                                   : dm.error !== "" &&
                                     item[666].event_name === "The faz event" &&
                                     item[666].dirty !== undefined
                         deepEqual(tst,
                                   true, "dbUpdate({type:'event',id:666}) returns with correct data in memory:"+
                                         item[666].event_name+","+item[666].dirty+",is_new:"+is_new+", error:"+dm.error);
                         let dm2 = new anyModel({type:"event",db_search:false,source:gDBSource,db_connection:gDbase});
                         await dm2.dbSearch({type:"event",id:666,
                             onSuccess:
                             function(context,serverdata,options)
                             {
                               dm2.dbSearchSuccess(context,serverdata,options); // Call default success function to get data
                               deepEqual(dm2.data != null &&
                                         dm2.data[666] != null &&
                                         dm2.data[666].data != null &&
                                         dm2.data[666].data[666] != null,
                                         true, "dbUpdate({type:'event',id:666}) returns data from database after update");
                               },
                           });
                       },
                     });
    setTimeout(function() {
      deepEqual(res, true, "dbUpdate({type:'event',id:666}) returns true");
      start();
    }, millisec);
  });

  asyncTest('dbUpdate - item with nonexisting id', 3, function() {
    let data = {99:{list:"bar",data:{11:{list:"foo",foz_name:"The foo foz"},
                                     12:{list:"faz",foo_name:"The faz foo"},
                                     50:{list:"event",event_name:"The faz event",
                                         dirty:{list:"event",event_name:"The faz event"}}}}};
    let dm = new anyModel({type:"bar",db_search:false,source:gDBSource,db_connection:gDbase,data:data});
    let res = dm.dbUpdate({ type:"event",id:6346,
                 onSuccess:
                 function(context,serverdata,options)
                 {
                   deepEqual(true,false,"dbUpdate - item with nonexisting id: Test failed, we should not arrive here.");
                 },
              });
    deepEqual(res, false, "dbUpdate({type:'event',id:6346}) item with nonexisting id returns false");
    let item = dm.dataSearch({type:"event",id:6346});
    deepEqual(item===null,true,
              "dbUpdate({type:'event',id:6346}) item with nonexisting id returns returns null from dataSearch");
    let dm2 = new anyModel({type:"event",db_search:false,source:gDBSource,db_connection:gDbase,data:null});
    dm2.dbSearch({type:"event",id:6346,
        onSuccess:
        function(context,serverdata,options)
        {
          deepEqual(dm2.data===null,true,
                    "dbUpdate({type:'event',id:6346}) item with nonexisting id returns null from dbSearch:"+dm2.data);
          start();
        },
    });
  });

  asyncTest('dbUpdate - item with different model.type (user with id 14 must exist in db)', 3, async function() {
    let idchk14 = gDBSource == "local" ? "14" : "+14";
    let tempdm = new anyModel({type:"user",db_search:false,source:gDBSource,db_connection:gDbase});
    await tempdm.dbUpdate({ sync:true,
                            is_new:true,
                            id:14,
                            new_data:{14:{list:"user",user_login:"thelogin",user_pass:"xxxx",user_pass_again:"xxxx",user_name:"thetester"}},
                         });
    let data = {99:{list:"bar",data:{11:{list:"foo",foz_name:"The foo foz"},
                                     12:{list:"faz",foo_name:"The faz foo"},
                                     14:{list:"user",user_name:"The faz user",
                                         dirty:{list:"user",user_name:"The faz user"}}}}};
    let dm = new anyModel({type:"baz",db_search:false,source:gDBSource,db_connection:gDbase,data:data});
    let res = await dm.dbUpdate({ type:"user",id:14,
                       onSuccess:
                       function(context,serverdata,options)
                       {
                         dm.dbUpdateSuccess(context,serverdata,options); // Call default success function to get data
                         setTimeout(async function() {
                           let item = dm.dataSearch({type:"user",id:14});
                           let str = item && item[14] ? item[14].user_name+","+item[14].dirty : null;
                           deepEqual(item && item[14] &&
                                     item[14].user_name === "The faz user" &&
                                     item[14].dirty === undefined,
                                     true, "dbUpdate({type:'user',id:14}) with different model type returns with correct data in memory:"+str);
                           let dm2 = new anyModel({type:"user",db_search:false,source:gDBSource,db_connection:gDbase});
                           await dm2.dbSearch({type:"user",id:14});
                           setTimeout(function() {
                             str = dm2.data ? dm2.data[idchk14].data[idchk14].user_name : null;
                             deepEqual(dm2.data &&
                                       dm2.data[idchk14] &&
                                       dm2.data[idchk14].data[idchk14].user_name === "The faz user",
                                       true, "dbUpdate({type:'user',id:14}) with different model type returns with correct data in database:"+str);
                             start();
                           }, millisec);
                         }, millisec);
                       },
                    });
    deepEqual(res, true, "dbUpdate({type:'user',id:14}) with different model type returns true");
  });

  asyncTest('dbUpdate - item: type does not match model.type', 3, async function() {
    let data = {99:{list:"bar",data:{11:{list:"foo",foz_name:"The foo foz"},
                                     12:{list:"faz",foo_name:"The faz foo"},
                                      2:{list:"baz",user_name:"The faz user",
                                         dirty:{list:"user",user_name:"The faz user"}}}}};
    let dm = new anyModel({type:"user",db_search:false,source:gDBSource,db_connection:gDbase,data:data});
    let res = dm.dbUpdate({ type:"biz",id:2,
                 onSuccess:
                 function(context,serverdata,options)
                 {
                   deepEqual(true,false,"dbUpdate - item: type does not match model.type: Test failed, we should not arrive here.");
                 },
              });
    deepEqual(res, false, "dbUpdate - item: type does not match model.type returns false");
    let item = dm.dataSearch({type:"baz",id:2});
    deepEqual(item[2].user_name === "The faz user" &&
              item[2].dirty !== undefined,
              true, "dbUpdate({type:'baz',id:2}) with input type that does not match model type returns returns unchanged memory data:"+
                    item[2].user_name+","+item[2].dirty);
    let dm2 = new anyModel({type:"biz",db_search:false,source:gDBSource,db_connection:gDbase,data:null});
    dm2.dbSearch({type:"baz",id:2,
        onSuccess:
        function(context,serverdata,options)
        {
          dm.dbSearchSuccess(context,serverdata,options); // Call default success function to get data
          deepEqual(dm2.data=== null, true,
                    "dbUpdate({type:'baz',id:2}) with input type that does not match model type returns null from dbSearch:"+dm2.data);
          start();
        }
    });
  });

  asyncTest('dbUpdate insert data that is in memory. User id 79 must not exist in user table.', 3, async function() {
    let tempdm = new anyModel({type:"user",db_search:false,source:gDBSource,db_connection:gDbase});
    await tempdm.dbDelete({sync:true,id:79});
    let usrname = "user"+Math.floor(Math.random()*100000);
    let data = {77:{list:"user",user_name:"us77"},
                79:{list:"user",user_name:"us79",user_login:usrname,user_pass:"qqq",user_pass_again:"qqq",is_new:true}};
    let dm = new anyModel({type:"user",db_search:false,source:gDBSource,db_connection:gDbase,data:data});
    // insert
    let res = await dm.dbUpdate({ id:79,is_new:true,
                       onSuccess:
                       function(context,serverdata,options)
                       {
                         dm.dbUpdateSuccess(context,serverdata,options); // Call default success function to get data
                         deepEqual(dm.last_insert_id &&
                                   dm.data[dm.last_insert_id].is_new === undefined,
                                   true, "last_insert_id set and is_new mark deleted");
                         deepEqual(dm.message == "User created. " || dm.message == "User created. User logged in. " ||
                                   dm.message == "Insert succeeded. ",
                                   true, "dbUpdate() creates user");
                         start();
                       },
                    }); // insert data
    deepEqual(res, true, "dbUpdate(data) returns true (insert1)");
  });

  asyncTest('dbUpdate insert data that is not in memory', 2, async function() {
    let data22 = {22:{list:"user",user_name:"us22"}};
    let dm = new anyModel({type:"user",db_search:false,source:gDBSource,db_connection:gDbase,data:data22});
    // insert
    let data23 = {23:{list:"user",user_name:"us23",user_pass:"qqq",user_pass_again:"qqq",is_new:true}};
    let res = await dm.dbUpdate({id:23,new_data:data23,is_new:true,
                                  onSuccess:
                                  function(context,serverdata,options)
                                  {
                                    dm.dbUpdateSuccess(context,serverdata,options); // Call default success function to get data
                                    setTimeout(function() {
                                      deepEqual(dm.data[22] !== undefined &&
                                                dm.data[23] === undefined,
                                                true, "dbUpdate() does not insert into memory when data is given as parameter to update only");
                                      start();
                                    }, millisec);
                                  },
                               }); // insert data
    deepEqual(res, true, "dbUpdate(data) returns true (insert2)");
  });

  ///////////////////// end dbUpdate tests /////////////////////

/*
  ///////////////////// dbUpdateLinkList tests /////////////////////
  // TODO

  asyncTest('dbUpdateLinkList add a user-event link (event-user link 20900-23 must exist in event_user table)', 2, async function() {
    let dm = new anyModel({type:"user",id:23,db_search:false,source:gDBSource,db_connection:gDbase,data:null});
    let res = await dm.dbUpdateLinkList({ link_type:"event",select:[98,99,10894],unselect:[20900],
                                          onSuccess:
                                          function(context,serverdata,options)
                                          {
                                            dm.dbUpdateLinkListSuccess(context,serverdata,options); // Call default success function to get data
                                            setTimeout(function() {
                                              deepEqual(dm.data === null && dm.error === "" && dm.message == "User updated. ",
                                                        true, "dbUpdateLinkList ok1");
                                              start();
                                            }, millisec);
                                          },
                                       }); // update link table
    deepEqual(res, true, "dbUpdateLinkList() returns true");
  });

  ///////////////////// end dbUpdateLinkList tests /////////////////////


  ///////////////////// dbUpdateLink tests /////////////////////
  // TODO
  ///////////////////// end dbUpdateLink tests /////////////////////


  ///////////////////// dbDelete tests /////////////////////

  asyncTest('dbDelete: normal case (event with id 9977 must exist in db event table)', 3, function() {

    let tempdm = new anyModel({type:"event",db_search:false,source:gDBSource,db_connection:gDbase});
    tempdm.dbUpdate({sync:true,is_new:true,id:9977,new_data:{9977:{item:"event",event_name:"EVT A"}},
           onSuccess:
           function(context,serverdata,options)
           {
             let dm = new anyModel({type:"event",db_search:false,source:gDBSource,db_connection:gDbase,data:null});
             let res = dm.dbDelete({ type:"event",id:9977,
                          onSuccess:
                          function(context,serverdata,options)
                          {
                            dm.dbDeleteSuccess(context,serverdata,options); // Call default success function to get data
                            deepEqual(dm.data === null,
                                      true, "dbDelete() returns no data from db:"+dm.data);
                            deepEqual(dm.error === "" && dm.message === "Event deleted. ",
                                      true, "no error and message is 'Event deleted. ':"+dm.message);
                            start();
                          },
                       });
             equal(res, true, "dbDelete() returns true");
           },
         });
  });

  asyncTest('dbDelete: deleting non-existing id (user with id 56 must NOT exist in db user table)', 3, async function() {
    let dm = new anyModel({type:"user",db_search:false,source:gDBSource,db_connection:gDbase,data:null});
    let res = await dm.dbDelete({ type:"user",id:56,
                       onSuccess:
                       function(context,serverdata,options)
                       {
                         dm.dbDeleteSuccess(context,serverdata,options); // Call default success function to get data
                         setTimeout(function() {
                           deepEqual(dm.data === null,
                                     true, "dbDelete() returns no data from db:"+dm.data);
                           deepEqual(dm.error === "" && dm.message === "Nothing to delete. ",
                                     true, "no error and message is 'Nothing to delete. ':"+dm.message);
                           start();
                         }, millisec);
                       },
                    });
    deepEqual(res, true, "dbDelete() returns true");
  });

  test('dbDelete: model with no type or id_key', 1, async function() {
    let dm = new anyModel({db_search:false,source:gDBSource,db_connection:gDbase});
    let res = await dm.dbDelete({ onSuccess:
                          function(context,serverdata,options)
                          {
                            dm.dbDeleteSuccess(context,serverdata,options); // Call default success function to get data
                            // TODO!
                          },
                       })
    deepEqual(res, false, "dbDelete() returns false");
  });

  asyncTest('dbDelete: model with type not in database', 3, async function() {
    let dm = new anyModel({type:"foox",db_search:false,source:gDBSource,db_connection:gDbase,data:null});
    let res = await dm.dbDelete({ id:99,
                                  onSuccess:
                                  function(context,serverdata,options)
                                  {
                                    dm.dbDeleteSuccess(context,serverdata,options); // Call default success function to get data
                                    setTimeout(function() {
                                      deepEqual(dm.data === null,
                                                true, "dbDelete() returns no data from db:"+dm.data);
                                      deepEqual(dm.error !== "",
                                                true, "error is not blank:"+dm.error);
                                      start();
                                    }, millisec);
                                  },
                               });
    deepEqual(res, true, "dbDelete() returns true");
  });

  asyncTest('dbDelete: model with existing type, calling delete with existing id but non-existing type', 3, async function() {
    let dm = new anyModel({type:"user",db_search:false,source:gDBSource,db_connection:gDbase,data:null});
    let res = await dm.dbDelete({ type:"foox",id:50,
                                  onSuccess:
                                  function(context,serverdata,options)
                                  {
                                    dm.dbDeleteSuccess(context,serverdata,options); // Call default success function to get data
                                    setTimeout(function() {
                                      deepEqual(dm.data === null,
                                                true, "dbDelete() returns no data from db:"+dm.data);
                                      deepEqual(dm.error !== "",
                                                true, "error is not blank:"+dm.error);
                                      start();
                                    }, millisec);
                                  },
                               }); // user 50 must exist in db user table
    deepEqual(res, true, "dbDelete() returns true");
  });

  asyncTest('dbDelete: model type in data structure, but not in database', 3, async function() {
    let data = {99:{list:"bar",data:{11:{list:"foox",foz_name:"The foox foz"},
                                     12:{list:"faz",foo_name:"The faz foo"},
                                     66:{list:"user",user_name:"The faz user"}}}};
    let dm = new anyModel({type:"foox",db_search:false,source:gDBSource,db_connection:gDbase,data:data});
    let res = await dm.dbDelete({ id:66,
                                  onSuccess:
                                  function(context,serverdata,options)
                                  {
                                    dm.dbDeleteSuccess(context,serverdata,options); // Call default success function to get data
                                    setTimeout(function() {
                                      deepEqual(dm.data[99].data[66] !== undefined,
                                                true, "dbDelete() does not delete local data when data not in database");
                                      deepEqual(dm.error !== "",
                                                true, "error is not blank:"+dm.error);
                                      start();
                                    }, millisec);
                                  },
                               });
    deepEqual(res, true, "dbDelete() returns true");
  });

  asyncTest('dbDelete: model type in data structure and in database (user with id 67 must exist in user table)', 3, async function() {
    let data = {99:{list:"bar",data:{11:{list:"foo",foz_name:"The foo foz"},
                                     12:{list:"faz",foo_name:"The faz foo"},
                                     67:{list:"user",user_name:"delme"}}}};
    let dm = new anyModel({type:"user",db_search:false,source:gDBSource,db_connection:gDbase,data:data});
    let res = await dm.dbDelete({ type:"user",id:67,
                                  onSuccess:
                                  function(context,serverdata,options)
                                  {
                                    dm.dbDeleteSuccess(context,serverdata,options); // Call default success function to get data
                                    setTimeout(function() {
                                      deepEqual(dm.data[99].data[67] !== undefined,
                                                true, "dbDelete() does not delete local data when deleting data in database");
                                      deepEqual(dm.error === "" || dm.error === "Nothing to delete. ",
                                                true, "no error or message is 'Nothing to delete. ':"+dm.error);
                                      start();
                                    }, millisec);
                                  },
                               });
    deepEqual(res, true, "dbDelete() returns true");
  });

  // insert, update, search and delete tests
  asyncTest('dbUpdate and dbDelete: Insert, update, search, view and delete user. User id 34 must not exist in user table. ', 15, async function() {
    let data33 = {33:{list:"user",user_name:"us33",user_login:"us33",user_pass:"qqq",user_pass_again:"qqq"}};
    let dm = new anyModel({type:"user",db_search:false,source:gDBSource,db_connection:gDbase,data:data33});
    // insert
    let data34 = {34:{list:"user",user_name:"us34",user_login:"us34",user_pass:"qqq",user_pass_again:"qqq",is_new:true}};
    let res = await dm.dbUpdate({ id:34,new_data:data34,is_new:true,
      onSuccess:
      async function(context,serverdata,options)
      {
        dm.dbUpdateSuccess(context,serverdata,options); // Call default success function to get data
        let new_id = dm.last_insert_id;
        deepEqual(dm.data[34] === undefined, true, "dbUpdate(data) does not insert into memory when data is given as parameter to update only");
        deepEqual(dm.error === "", true, "no error:"+dm.error);
        deepEqual(new_id  != null && new_id != undefined,true, "new_id has a value:"+new_id);
        deepEqual(dm.data != null && dm.data!= undefined,true, "data has a value:"+JSON.stringify(dm.data));
        // update
        dm.data = null;
        dm.dataInsert({type:"user",id:null,new_data:data34});
        deepEqual(dm.data[34] !== null, true, "inserted data with id 34:"+JSON.stringify(dm.data));
        let data = {[new_id]:{list:"user",user_name:"us1_changed",user_pass:"qqq",user_pass_again:"qqq",
                              dirty:{user_name:"us1_changed",user_pass:"qqq",user_pass_again:"qqq"}}};
        let res = await dm.dbUpdate({ id:new_id,new_data:data,
          onSuccess:
          async function(context,serverdata,options)
          {
            dm.dbUpdateSuccess(context,serverdata,options); // Call default success function to get data
            deepEqual(dm.error === "",  true, "no error:"+dm.error);
            deepEqual(dm.data != null && dm.data!= undefined, true, "data has a value:"+JSON.stringify(dm.data));
            // search
            let res = await dm.dbSearch({ id:new_id,
              onSuccess:
              async function(context,serverdata,options)
              {
                dm.dbSearchSuccess(context,serverdata,options); // Call default success function to get data
                deepEqual(dm.data !== null,true, "dbSearch('"+new_id+"') returns item data:"+JSON.stringify(dm.data));
                deepEqual(dm.error === "", true, "no error:"+dm.error);
                // delete
                dm.data = null;
                let res = await dm.dbDelete({ id:new_id,
                  onSuccess:
                  async function(context,serverdata,options)
                  {
                    dm.dbDeleteSuccess(context,serverdata,options); // Call default success function to get data
                                    setTimeout(function() {
                    deepEqual(dm.data === null,true, "dbDelete("+new_id+") returns no data:"+dm.data);
                    deepEqual(dm.error === "", true, "dbDelete returns no error:"+dm.error);
                    // do a manual check that user is deleted from database
                                      start();
                                    }, millisec);
                  },
                });
                deepEqual(res, true, "dbDelete("+new_id+") returns true");
              },
            });
            deepEqual(res, true, "dbSearch('"+new_id+"') returns true when valid id");
          },
        });
        deepEqual(res, true, "dbUpdate("+new_id+",data) returns true (update)");
      },
    }); // await dm.dbUpdate (insert data)
    deepEqual(res, true, "dbUpdate(data) returns true (insert)");
  });

  ///////////////////// end dbDelete tests /////////////////////
*/
} // testModel

//
// Helper functions
//
function getPermutations(list, maxLen)
{
  // Copy initial values as arrays
  var perm = list.map(function(val) {
      return [val];
  });
  // Our permutation generator
  var generate = function(perm, maxLen, currLen) {
      // Reached desired length
      if (currLen === maxLen) {
          return perm;
      }
      // For each existing permutation
      for (var i = 0, len = perm.length; i < len; i++) {
          var currPerm = perm.shift();
          // Create new permutation
          for (var k = 0; k < list.length; k++) {
              perm.push(currPerm.concat(list[k]));
          }
      }
      // Recurse
      return generate(perm, maxLen, currLen + 1);
  };
  // Start with size 1 because of initial values
  return generate(perm, maxLen, 1);
}
