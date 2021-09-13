"use strict";
/*
 ****************************************************************************************
 *
 * anyList is copyright (C) 2011-2021 Arne D. Morken and Balanse Software.
 *
 * @license AGPLv3.0 for open source use or anyList Commercial License for commercial use.
 * Get licences here: http://balanse.info/anylist/license/ (coming soon).
 *
 ****************************************************************************************
 */
///////////////////////////////////////////////////////
// QUnit tests for Data module
///////////////////////////////////////////////////////

let millisec = 3500;

function doTest(thing)
{
  switch (thing) {
    case "Model":    testModel(); break;
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
// Data
///////////////////////////////////////////////////////////////////////////////////////////////////

function testModel()
{
  module("Data");

  ///////////////////////
  // Omitted tests for:
  // - cbSubscribe
  // - cbUnsubscribe
  // - cbResetListeners
  // - cbExecute
  ///////////////////////

  ///////////////////// constructor and dataInit tests /////////////////////

  test('constructor and dataInit', function() {

    let dm1 = new anyDataModel();
    deepEqual(dm1.type                       === "" &&
              dm1.id_key                     === "" &&
              dm1.name_key                   === "" &&
              dm1.data                       === null &&
              dm1.plugins                    === null &&
              dm1.select   && dm1.select.size   === 0 &&
              dm1.unselect && dm1.unselect.size === 0 &&
              dm1.mode                       === "local" &&
              dm1.search                     === false &&
              dm1.search_term                === "" &&
              dm1.auto_search_init           === true &&
              dm1.auto_callback              === false &&
              dm1.permission.current_user_id === null &&
              dm1.permission.is_logged_in    === true &&
              dm1.permission.is_admin        === false &&
              dm1.message                    === "" &&
              dm1.error                      === "" &&
              dm1.page_links                 === null,
              true, "Constructor sets correct defaults with no options.");

    dm1 = new anyDataModel({ type: "foo" });
    deepEqual(dm1.type             === "foo" &&
              dm1.id_key           === "foo_id" &&
              dm1.name_key         === "foo_name",
              true, "Constructor sets correct defaults for id_key and name_key when type is given in options.");
    dm1 = new anyDataModel({
                type:             "fooobj",
                id_key:           "fooobj_id",
                name_key:         "fooobj_name",
                data:             { val: "dataobj" },
                mode:             "local",
                search:           false,
                search_term:      "something",
                auto_search_init: true,
                auto_callback:    false,
                message:          "",
                error:            "",
              });
    deepEqual(dm1.type             === "fooobj" &&
              dm1.id_key           === "fooobj_id" &&
              dm1.name_key         === "fooobj_name" &&
              dm1.data.val         === "dataobj" &&
              dm1.mode             === "local" &&
              dm1.search           === false &&
              dm1.search_term      === "something" &&
              dm1.auto_search_init === true &&
              dm1.auto_callback    === false &&
              dm1.message          === "" &&
              dm1.error            === "",
              true, "Constructor sets correct defaults when options is given.");

    let dm2 = new anyDataModel(null);
    let opt = { type:             "barobj",
                id_key:           "barobj_id",
                name_key:         "barobj_name",
                data:             { val: "dataobj" },
                mode:             "local",
                search:           false,
                search_term:      "Some thing",
                auto_search_init: true,
                auto_callback:    false,
                message:          "The message",
                error:            "The error",
              };
    deepEqual(dm2.dataInit(opt),
              opt, "dataInit #1: return input options");
    deepEqual(dm2.type             === "barobj" &&
              dm2.id_key           === "barobj_id" &&
              dm2.name_key         === "barobj_name" &&
              dm2.data.val         === "dataobj" &&
              dm2.mode             === "local" &&
              dm2.search           === false &&
              dm2.search_term      === "Some thing" &&
              dm2.auto_search_init === true &&
              dm2.auto_callback    === false &&
              dm2.message          === "The message" &&
              dm2.error            === "The error",
              true, "dataInit #2: init ok");
    let data = { data: "more data",
               };
    deepEqual(dm2.dataInit(data),
              data, "dataInit #3 return input data ok");
    deepEqual(dm2.data === "more data",
              true,"dataInit #4 data init ok");
  });

  ///////////////////// end constructor and dataInit tests /////////////////////

  ///////////////////// _getDataSourceName test /////////////////////

  test('_getDataSourceName', function() {

    let dm1 = new anyDataModel({type:"foo",mode:"remote"});
    deepEqual(dm1._getDataSourceName() === any_defs.dataScript,
              true, "_getDataSourceName ok");
  });

  ///////////////////// end _getDataSourceName test /////////////////////

  ///////////////////// dataSearchNextId / dataSearchMaxId tests /////////////////////

  test('dataSearchNextId and dataSearchMaxId', function() {

    let dm1 = new anyDataModel({type:"foo",mode:"remote"});
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
    let dm2 = new anyDataModel({
                    type: "user",
                    data: data1,
                  });
    // dataSearchNextId basically just calls dataSearchMaxId and adds 1.
    deepEqual(dm2.dataSearchNextId("group") === 7,
              true, "dataSearchNextId('group') === 7");
    deepEqual(dm2.dataSearchNextId("event") === 919412,
              true, "dataSearchNextId('event') === 919412");
    deepEqual(dm2.dataSearchNextId() === 830,
              true, "dataSearchNextId() === 830");
    deepEqual(dm2.dataSearchNextId("user") === 830,
              true, "dataSearchNextId('user') === 830");
    deepEqual(dm2.dataSearchNextId("new_type") === -1,
              true, "dataSearchNextId('new_type') === -1");

    // TODO: Tests for non-numerical indexes
  });

  ///////////////////// end dataSearchNextId / dataSearchMaxId tests /////////////////////

  ///////////////////// dataSearch tests /////////////////////

  test('DataModel.dataSearch on model created with missing type, id and data', 1, function() {

    let dm = new anyDataModel();
    deepEqual(dm.dataSearch()                === null &&
              dm.dataSearch(null)            === null &&
              dm.dataSearch({})              === null &&
              dm.dataSearch({type:"bar",id:null,data:null}) === null &&
              dm.dataSearch({type:null,id:"99",data:null})  === null &&
              dm.dataSearch({type:null,id:null,data:{}})    === null &&
              dm.dataSearch({type:"bar",id:"99",data:{}})   === null,
              true, "dataSearch(), "+
                    "dm.dataSearch(null,null,null), "+
                    "dm.dataSearch('bar',null,null), "+
                    "dm.dataSearch(null,'99',null), "+
                    "dm.dataSearch(null,null,{}), "+
                    "dm.dataSearch('bar','99',{}) "+
                    "all return null");
  });

  test('DataModel.dataSearch on model created with type, id and data with conflicting type', 1, function() {

    let dm = new anyDataModel({type:"foo",data:{99:{list:"bar"}}});
    deepEqual(dm.dataSearch()                === null &&
              dm.dataSearch({type:null,id:null,data:null})  === null &&
              dm.dataSearch({type:"foo",id:null,data:null}) === null &&
              dm.dataSearch({type:null,id:"99",data:null})  === null &&
              dm.dataSearch({type:null,id:null,data:{}})    === null,
              true, "dataSearch(), "+
                    "dm.dataSearch(null,null,null), "+
                    "dm.dataSearch('bar',null,null), "+
                    "dm.dataSearch(null,'99',null), "+
                    "dm.dataSearch(null,null,{}), "+
                    "dm.dataSearch('bar','99',{}) "+
                    "all return null");
  });

  test('DataModel.dataSearch on model created with type, id and data with correct type', 3, function() {

    let dm = new anyDataModel({type:"foo",data:{99:{list:"foo"}}});
    let res = dm.dataSearch({type:"bar",id:"99"});
    deepEqual(res === null,
              true, "dm.dataSearch('bar','99')) return null");
    res = dm.dataSearch({type:"foo",id:"90"});
    deepEqual(res === null,
              true, "dm.dataSearch('foo','90')) return null");
    res = dm.dataSearch({type:"foo",id:"99"});
    deepEqual(res     !== null &&
              res[99] != undefined,
              true, "dm.dataSearch('foo','99')) return data");
  });

  test('DataModel.dataSearch on model created with type, id and deep data', 3, function() {

    let dm = new anyDataModel({type:"foo",data:{99:{list:"bar",data:{11:{list:"foo"}}}}});
    let res = dm.dataSearch({type:"bar",id:"11"});
    deepEqual(res === null,
              true, "dm.dataSearch('bar','11')) return null");
    res = dm.dataSearch({type:"foo",id:"99"});
    deepEqual(res === null,
              true, "dm.dataSearch('foo','99')) return null");
    res = dm.dataSearch({type:"foo",id:"11"});
    deepEqual(res !== null,
              true, "dm.dataSearch('foo','11')) return data");
  });

  test('DataModel.dataSearch on model created with type, id and deep data with deviant name_key', 8, function() {

    let data = {99:{list:"bar",data:{11:{list:"foo",foz_name:"The foo foz"},
                                     12:{list:"faz",foo_name:"The faz foo"},
                                     13:{list:"faz",faz_name:"The faz faz"}}}};
    let dm = new anyDataModel({type:"foo",data:data});
    let res = dm.dataSearch({type:null,id:"11"});
    deepEqual(res     !== null &&
              res[11] !== undefined,
              true, "dm.dataSearch(null,'11')) return data");
    res = dm.dataSearch({type:null,id:"12"});
    deepEqual(res     === null,
              true, "dm.dataSearch(null,'12')) return null");
    res = dm.dataSearch({type:"foo",id:"11"});
    deepEqual(res     !== null &&
              res[11] !== undefined,
              true, "dm.dataSearch('foo','11')) return data");
    res = dm.dataSearch({type:"foo",id:"12"});
    deepEqual(res     === null,
              true, "dm.dataSearch('foo','12')) return null");
    res = dm.dataSearch({type:"foz",id:"11"});
    deepEqual(res     === null,
              true, "dm.dataSearch('foz','11')) return null");
    res = dm.dataSearch({type:"baz",id:"11"});
    deepEqual(res === null,
              true, "dm.dataSearch('baz','11')) return null");
    res = dm.dataSearch({type:"faz",id:"12"});
    deepEqual(res     !== null &&
              res[12] !== undefined,
              true, "dm.dataSearch('faz','12')) return data");
    res = dm.dataSearch({type:null,id:"13"});
    deepEqual(res === null,
              true, "dm.dataSearch(null,'13')) return null");

    // TODO: Tests for non-numerical indexes
  });

  test('DataModel.dataSearch with parent == true', 1, function() {
    let data = {99:{type:"bar",data:{11:{type:"foo",foo_name:"The foo foz"},
                                    }}};
    let dm = new anyDataModel({type:"foo",data:data});
    let res = dm.dataSearch({type:"foo",id:"11",parent:true});
    deepEqual(res     !== null &&
              res[11] === undefined &&
              res.type === "bar" &&
              res.id === "99" &&
              res.data[11] !== undefined,
              true, "dm.dataSearch('foo','11', true)) return parent data");
  });

  ///////////////////// end dataSearch tests /////////////////////

  ///////////////////// dataInsert tests /////////////////////

  test('DataModel.dataInsert', 15, function() {
    // Test nid
    let mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                      12:{list:"faz",faz_name:"The faz"}}}};
    let dm = new anyDataModel({type:"foo",data:mdata});
    deepEqual(dm.data[99].data[13] === undefined,
              true, "dm.data[99].data[13] === undefined before dataInsert");
    let idata = {13:{list:"barbar",barbar_name:"The barbar"}};
    let res = dm.dataInsert({type:"bar",id:99,indata:idata,nid:13});
    deepEqual(dm.data[99].data[13] !== undefined,
              true, "dm.data[99].data[13] !== undefined after dataInsert");

    dm = new anyDataModel({type:"foo",data:null});
    idata = {14:{list:"barbar",barbar_name:"The barbar"}};
    res = dm.dataInsert({type:"bar",indata:idata});
    deepEqual(dm.data[14] !== undefined,
              true, "dm.data[14] !== undefined after dataInsert with to model with null data");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"foo",data:mdata});
    idata = {14:{list:"barbar",barbar_name:"The barbar"}};
    res = dm.dataInsert({type:"bar",id:99,indata:idata,nid:13});
    deepEqual(dm.data[99].data[13] === undefined,
              true, "dm.data[99].data[13] === undefined after dataInsert with nid == 13 not found in input data");
    idata = {14:{list:"barbar",barbar_name:"The barbar"}};
    res = dm.dataInsert({type:"bar",id:99,indata:idata,nid:14});
    deepEqual(dm.data[99].data[14] !== undefined,
              true, "dm.data[99].data[14] !== undefined after dataInsert with nid == 14 found in input data");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"foo",data:mdata});
    idata = {13:{list:"barbar",barbar_name:"The barbar"}};
    res = dm.dataInsert({type:"bar",id:99,indata:idata});
    deepEqual(dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99].data[13] !== undefined,
              true, "dm.data[99].data[11] !== undefined and "+
                    "dm.data[99].data[12] !== undefined and "+
                    "dm.data[99].data[13] !== undefined "+
                    "after dataInsert with id, but nid == undefined");

    // Test ptype
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"foo",data:mdata});
    idata = {13:{list:"barbar",barbar_name:"The barbar"}};
    res = dm.dataInsert({type:null,id:99,indata:idata});
    deepEqual(dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99].data[13] === undefined,
              true, "dm.data[99].data[11] !== undefined and "+
                    "dm.data[99].data[12] !== undefined and "+
                    "dm.data[99].data[13] === undefined "+
                    "after dataInsert with type == null and incorrect type");

    mdata = {99:{list:"foo",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"foo",data:mdata});
    idata = {13:{list:"foo",foo_name:"The foo"}};
    res = dm.dataInsert({type:null,id:99,indata:idata});
    deepEqual(dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99].data[13] !== undefined,
              true, "dm.data[99].data[11] !== undefined and "+
                    "dm.data[99].data[12] !== undefined and "+
                    "dm.data[99].data[13] !== undefined "+
                    "after dataInsert with type == null and correct type");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"foo",data:mdata});
    idata = {13:{list:"barbar",barbar_name:"The barbar"}};
    res = dm.dataInsert({type:"baz",id:99,indata:idata});
    deepEqual(dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99].data[13] === undefined,
              true, "dm.data[99].data[11] !== undefined and "+
                    "dm.data[99].data[12] !== undefined and "+
                    "dm.data[99].data[13] === undefined "+
                    "after dataInsert with type == baz");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"foo",data:mdata});
    idata = {list:"bar",bar_name:"The bar"};
    res = dm.dataInsert({type:"bar",id:99,indata:idata,nid:-1});
    deepEqual(dm.data[99].data[11]  !== undefined &&
              dm.data[99].data[12]  !== undefined &&
              dm.data[99].data[100] !== undefined,
              true, "dm.data[99].data[11] !== undefined and "+
                    "dm.data[99].data[12] !== undefined and "+
                    "dm.data[99].data[100] !== undefined "+
                    "after dataInsert with type == bar and nid == -1");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"foo",data:mdata});
    idata = {list:"foo",foo_name:"The foo"};
    res = dm.dataInsert({type:"foo",id:null,indata:idata,nid:null});
    deepEqual(dm.data[99] !== undefined &&
              dm.data.list === 'foo',
              true, "dm.data[99] !== undefined and "+
                    "dm.data.list === 'foo' "+
                    "after dataInsert with type == foo, id == null and nid == null");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"foo",data:mdata});
    idata = {list:"bar",bar_name:"The bar"};
    res = dm.dataInsert({type:"bar",id:null,indata:idata,nid:61});
    deepEqual(dm.data[99] !== undefined &&
              dm.data[61] !== undefined,
              true, "dm.data[99] !== undefined and "+
                    "dm.data[61] !== undefined "+
                    "after dataInsert with type == bar, id == null and nid == 61");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"foo",data:mdata});
    idata = {list:"bar",bar_name:"The bar"};
    res = dm.dataInsert({type:"bar",id:99,indata:idata,nid:-1});
    deepEqual(dm.data[99].data[11]  !== undefined &&
              dm.data[99].data[12]  !== undefined &&
              dm.data[99].data[100] !== undefined,
              true, "dm.data[99].data[11] !== undefined and "+
                    "dm.data[99].data[12] !== undefined and "+
                    "dm.data[99].data[100] !== undefined "+
                    "after dataInsert with type == bar");

    // Test id
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"foo",data:mdata});
    idata = {list:"bar",bar_name:"The bar"};
    res = dm.dataInsert({type:"bar",id:-1,indata:idata});
    deepEqual(res === null,
              true, "dataInsert with id == -1 returns null");
    idata = {list:"bar",bar_name:"The bar"};
    res = dm.dataInsert({type:"bar",id:66,indata:idata});
    deepEqual(res === null,
              true, "dataInsert with nonexisting id returns null");

    // TODO: Tests for non-numerical indexes

  });
  ///////////////////// end dataInsert tests /////////////////////

  ///////////////////// dataUpdate tests /////////////////////

  test('DataModel.dataUpdate', 6, function() {
    // Normal case
    let mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                      12:{list:"faz",faz_name:"The faz"}}}};
    let dm = new anyDataModel({type:"foo",data:mdata});
    let res = dm.dataUpdate({type:"foo",id:"11",indata:{foo_name:"Foz Baz"}});
    deepEqual(res !== null &&
              dm.data[99].data[11].foo_name === "Foz Baz" &&
              dm.data[99].data[11].dirty !== undefined,
              true, "dataUpdate with type, id and indata returns correctly updated data and dirty object");

    // Unexisting type
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"foo",data:mdata});
    res = dm.dataUpdate({type:"fiz",id:"11",indata:{foo_name:"Foz Baz"}});
    deepEqual(res === null &&
              dm.data[99].data[11].foo_name === "The foo" &&
              dm.data[99].data[11].dirty === undefined,
              true, "dataUpdate with illegal type, but legal id and indata returns null and data is not changed");

    // Missing / unmatching type
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"biz",data:mdata});
    res = dm.dataUpdate({id:"11",indata:{foo_name:"Foz Baz"}});
    deepEqual(res === null &&
              dm.data[99].data[11].foo_name === "The foo" &&
              dm.data[99].data[11].dirty === undefined,
              true, "dataUpdate with missing/unmatching type, but legal id and indata returns null and data is not changed");

    // Missing id
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"biz",data:mdata});
    res = dm.dataUpdate({type:"foo",indata:{foo_name:"Foz Baz"}});
    deepEqual(res === null &&
              dm.data[99].data[11].foo_name === "The foo" &&
              dm.data[99].data[11].dirty === undefined,
              true, "dataUpdate with missing id, but legal type and indata returns null and data is not changed");

    // Negative id
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"biz",data:mdata});
    res = dm.dataUpdate({type:"foo",id:-1,indata:{foo_name:"Foz Baz"}});
    deepEqual(res === null &&
              dm.data[99].data[11].foo_name === "The foo" &&
              dm.data[99].data[11].dirty === undefined,
              true, "dataUpdate with negative id, but legal type and indata returns null and data is not changed");

    // Missing indata
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"biz",data:mdata});
    res = dm.dataUpdate({type:"foo",id:"11"});
    deepEqual(res === null &&
              dm.data[99].data[11].foo_name === "The foo" &&
              dm.data[99].data[11].dirty === undefined,
              true, "dataUpdate with missing indata, but legal type and id returns null and data is not changed");

    // TODO: Tests for non-numerical indexes
  });

  ///////////////////// end dataUpdate tests /////////////////////

  ///////////////////// dataDelete tests /////////////////////

  test('DataModel.dataDelete', 8, function() {
    // Normal case
    let mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                      12:{list:"faz",faz_name:"The faz"}}}};
    let dm = new anyDataModel({type:"foo",data:mdata});
    let res = dm.dataDelete({type:"foo",id:"11"});
    deepEqual(res !== null &&
              dm.data[99].data[11] === undefined &&
              dm.data[99].data[12] !== undefined,
              true, "dataDelete with type and id correctly deletes data");

    // Subdata is deleted
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"foo",data:mdata});
    res = dm.dataDelete({type:"bar",id:"99"});
    deepEqual(res !== null &&
              dm.data[99] === undefined,
              true, "dataDelete with type and id correctly deletes data and subdata");

    // Non-existing type
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"foo",data:mdata});
    res = dm.dataDelete({type:"biz",id:"99"});
    deepEqual(res === null &&
              dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined,
              true, "dataDelete with nonexisting type returns null and data is not deleted, 1 of 2");

    // Missing type
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"foo",data:mdata});
    res = dm.dataDelete({id:"99"});
    deepEqual(res === null &&
              dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined,
              true, "dataDelete with missing type returns null and data is not deleted, 1 of 2");

    // Non-existing id
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"foo",data:mdata});
    res = dm.dataDelete({type:"bar",id:"999"});
    deepEqual(res === null &&
              dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined,
              true, "dataDelete with nonexisting id returns null and data is not deleted, 1 of 2");

    // Missing id
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"foo",data:mdata});
    res = dm.dataDelete({type:"bar"});
    deepEqual(res === null &&
              dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined,
              true, "dataDelete with missing id returns null and data is not deleted, 1 of 2");

    // Type and id does not match, 1 of 2
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"foo",data:mdata});
    res = dm.dataDelete({type:"faz",id:"11"});
    deepEqual(res === null &&
              dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined,
              true, "dataDelete with type and id does not match returns null and data is not deleted, 1 of 2");

    // Type and id does not match, 2 of 2
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyDataModel({type:"foo",data:mdata});
    res = dm.dataDelete({type:"foo",id:"12"});
    deepEqual(res === null &&
              dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined,
              true, "dataDelete with type and id does not match returns null and data is not deleted, 2 of 2");

    // TODO: Tests for non-numerical indexes
  });

  ///////////////////// end dataDelete tests /////////////////////

  ///////////////////// start dataUpdateLinkList tests /////////////////////

  test('DataModel.dataUpdateLinkList', 7, function() {
    // Normal case
    let mdata = {99:{list:"bar",
                     data:{11:{list:"bar",bar_name:"The first bar"},
                           12:{list:"bar",bar_name:"The second bar"}}}};
    let dm = new anyDataModel({list:"bar",data:mdata});
    let del = new Set(); del.add(11);
    let ins = new Set(); ins.add(14);
    let res = dm.dataUpdateLinkList({type:"bar",
                                     del:       del,
                                     ins:       ins,
                                     indata:    {14:{list:"bar",foo_name:"Fourteen bar"}},
                                     insert_id: 99});
    deepEqual(res !== null &&
              dm.data[99].data[11] === undefined &&
              dm.data[99].data[14] !== undefined &&
              dm.data[99].data[14].foo_name == "Fourteen bar" ,
              true, "dataUpdateLinkList with type, del, ins, indata and insert_id ok. ");

    // Insert point type differs from options type (1)
    mdata = {99:{list:"bar",
                 data:{11:{list:"bar",bar_name:"The first bar"},
                       12:{list:"bar",bar_name:"The second bar"}}}};
    dm = new anyDataModel({list:"bar",data:mdata});
    del = new Set(); del.add(11);
    ins = new Set(); ins.add(14);
    res = dm.dataUpdateLinkList({type:"foo",
                                 del:       del,
                                 ins:       ins,
                                 indata:    {14:{list:"bar",foo_name:"Fourteen bar"}},
                                 insert_id: 99});
    deepEqual(res !== null &&
              dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99].data[14] === undefined,
              true, "dataUpdateLinkList with data type different from insert_id type (2). ");

    // Insert point type differs from options type (2)
    mdata = {99:{list:"foo",
                 data:{11:{list:"bar",bar_name:"The first bar"},
                       12:{list:"bar",bar_name:"The second bar"}}}};
    dm = new anyDataModel({type:"bar",data:mdata});
    del = new Set(); del.add(11);
    ins = new Set(); ins.add(14);
    res = dm.dataUpdateLinkList({type:"bar",
                                 del:       del,
                                 ins:       ins,
                                 indata:    {14:{list:"bar",foo_name:"Fourteen bar"}},
                                 insert_id: 99});
    deepEqual(res !== null &&
              dm.data[99].data[11] === undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99].data[14] === undefined,
              true, "dataUpdateLinkList with data type different from insert_id type (1). ");

    // Insert point type differs from options type (3)
    mdata = {99:{list:"bar",
                 data:{11:{list:"bar",bar_name:"The first bar"},
                       12:{list:"bar",bar_name:"The second bar"}}}};
    dm = new anyDataModel({type:"bar",data:mdata});
    del = new Set(); del.add(11);
    ins = new Set(); ins.add(14);
    res = dm.dataUpdateLinkList({type:"bar",
                                 del:       del,
                                 ins:       ins,
                                 indata:    {14:{list:"foo",foo_name:"Fourteen foo"}},
                                 insert_id: 99});
    deepEqual(res !== null &&
              dm.data[99].data[11] === undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99].data[14] === undefined,
              true, "dataUpdateLinkList with data type different from insert_id type (3). ");

    // Insert point type differs from options type (4)
    mdata = {99:{list:"bar",
                 data:{11:{list:"bar",bar_name:"The first bar"},
                       12:{list:"bar",bar_name:"The second bar"}}}};
    dm = new anyDataModel({type:"bar",data:mdata});
    del = new Set(); del.add(11);
    ins = new Set(); ins.add(14);
    res = dm.dataUpdateLinkList({type:"foo",
                                 del:       del,
                                 ins:       ins,
                                 indata:    {14:{list:"foo",foo_name:"Fourteen foo"}},
                                 insert_id: 99});
    deepEqual(res !== null &&
              dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99].data[14] === undefined,
              true, "dataUpdateLinkList with data type different from insert_id type (4). ");

    // Insert point type differs from options type (5)
    mdata = {99:{list:"foo",
                 data:{11:{list:"bar",bar_name:"The first bar"},
                       12:{list:"bar",bar_name:"The second bar"}}}};
    dm = new anyDataModel({type:"bar",data:mdata});
    del = new Set(); del.add(11);
    ins = new Set(); ins.add(14);
    res = dm.dataUpdateLinkList({type:"bar",
                                 del:       del,
                                 ins:       ins,
                                 indata:    {14:{list:"foo",foo_name:"Fourteen foo"}},
                                 insert_id: 99});
    deepEqual(res !== null &&
              dm.data[99].data[11] === undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99].data[14] === undefined,
              true, "dataUpdateLinkList with data type different from insert_id type (5). ");

    // Insert point type differs from options type (6)
    mdata = {99:{list:"foo",
                 data:{11:{list:"bar",bar_name:"The first bar"},
                       12:{list:"bar",bar_name:"The second bar"}}}};
    dm = new anyDataModel({type:"bar",data:mdata});
    del = new Set(); del.add(11);
    ins = new Set(); ins.add(14);
    console.log(dm.data)
    res = dm.dataUpdateLinkList({type:"foo",
                                 del:       del,
                                 ins:       ins,
                                 indata:    {14:{list:"foo",foo_name:"Fourteen foo"}},
                                 insert_id: 99});
    console.log(dm.data)
    deepEqual(res !== null &&
              dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99].data[14] !== undefined,
              true, "dataUpdateLinkList with data type different from insert_id type (6). ");

  });

  ///////////////////// end dataUpdateLinkList tests /////////////////////

  ///////////////////// dbSearch tests /////////////////////

  asyncTest('dbSearch normal case - item', 4, function() {
    let dm = new anyDataModel({type:"user",search:false,mode:"remote"});
    let res = dm.dbSearch({id:"1"});
    deepEqual(res,
              true, "dbSearch({id:'1'}) returns true");
    setTimeout(function() {
      deepEqual(dm.error === "",
                true, "dbSearch({id:'1'}) no error:"+dm.error);
      deepEqual(dm.data !== null,
                true, "dbSearch({id:'1'}) returns item data:"+JSON.stringify(dm.data));
      deepEqual(dm.data !== null &&
                dm.data["+0"].data["+1"]["user_id"]   === "1" &&
                dm.data["+0"].data["+1"]["user_name"] === "Administrator",
                true, "dbSearch({id:'1'}) returns expected data");
      start();
    }, millisec);
  });

  asyncTest('dbSearch normal case - list', 4, function() {
    let dm = new anyDataModel({type:"user",search:false,mode:"remote"});
    deepEqual(dm.dbSearch({type:"user"}),
              true, "dbSearch() returns true");
    setTimeout(function() {
      deepEqual(dm.error === "",
                true, "dbSearch() no error:"+dm.error);
      let item = dm.dataSearch({type:"user",id:1});
      deepEqual(item !== null &&
                item["+1"]["user_id"]   === "1" &&
                item["+1"]["user_name"] === "Administrator",
                true, "dbSearch() returns good data");
      deepEqual(dm.data  !== null,
                true, "dbSearch() returns list data:"+JSON.stringify(dm.data));
      start();
    }, millisec);
  });

  asyncTest('dbSearch with non-existing model type and id_key', 3, function() {
    let dm = new anyDataModel({type:"foobar",id_key:"foobar_name",search:false,mode:"remote"});
    deepEqual(dm.dbSearch({id:"3"}),
              true, "dbSearch({id:'3'}) returns true");
    setTimeout(function() {
      deepEqual(dm.error !== "",
                true, "dbSearch({id:'3'}) error:"+dm.error);
      deepEqual(dm.data  === null,
                true, "dbSearch({id:'3'}) returns no data:"+JSON.stringify(dm.data));
      start();
    }, millisec);
  });

  asyncTest('dbSearch with existing model type but non-existing id_key', 3, function() {
    let dm = new anyDataModel({type:"user",id_key:"foo",search:false,mode:"remote"});
    deepEqual(dm.dbSearch({id:"1"}),
              true, "dbSearch({id:'1'}) returns true");
    setTimeout(function() {
      deepEqual(dm.error === "",
                true, "dbSearch({id:'1'}) no error:"+dm.error);
      deepEqual(dm.data  !== null,
                true, "dbSearch({id:'1'}) returns list data instead of item data:"+JSON.stringify(dm.data));
      start();
    }, millisec);
  });

  asyncTest('dbSearch with non-existing model type but existing type in search options', 3, function() {
    let dm = new anyDataModel({type:"foo",search:false,mode:"remote"});
    deepEqual(dm.dbSearch({type:"user",id:"1"}),
              true, "dbSearch({type:'user',id:'1'}) returns true");
    setTimeout(function() {
      deepEqual(dm.error === "",
                true, "dbSearch({type:'user',id:'1'}) no error:"+dm.error);
      deepEqual(dm.data  !== null,
                true, "dbSearch({type:'user',id:'1'}) returns item data for type given in search options:"+JSON.stringify(dm.data));
      start();
    }, millisec);
  });

  asyncTest('dbSearch for next id through dbSearch', 4, function() {
    let dm = new anyDataModel({type:"user",search:false,mode:"remote"});
    deepEqual(dm.dbSearch({type:"user",id:"max"}),
              true, "dbSearch({type:'user',id:'max'}) returns true");
    setTimeout(function() {
      deepEqual(dm.error === "",
                true, "dbSearch({type:'user',id:'max'}) no error:"+dm.error);
      deepEqual(dm.data  === null,
                true, "dbSearch({type:'user',id:'max'}) returns item data for type given in search options:"+JSON.stringify(dm.data));
      deepEqual(dm.max == "2", // Assuming there is only one user with id==1 in the db table
                true, "dbSearch({type:'user',id:'max'}) id==2:"+dm.max);
      start();
    }, millisec);
  });

  asyncTest('dbSearch for next id directly', 4, function() {
    let dm = new anyDataModel({type:"user",search:false,mode:"remote"});
    deepEqual(dm.dbSearchNextId({type:"user",id:"max"}),
              true, "dbSearch({type:'user',id:'max'}) returns true");
    setTimeout(function() {
      deepEqual(dm.error === "",
                true, "dbSearch({type:'user',id:'max'}) no error:"+dm.error);
      deepEqual(dm.data  === null,
                true, "dbSearch({type:'user',id:'max'}) returns item data for type given in search options:"+JSON.stringify(dm.data));
      deepEqual(dm.max == "2", // Assuming there is only one user with id==1 in the db table
                true, "dbSearch({type:'user',id:'max'}) id==2:"+dm.max);
      start();
    }, millisec);
  });

  ///////////////////// end dbSearch tests /////////////////////

} // testModel
