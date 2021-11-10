"use strict";
/*
 ****************************************************************************************
 *
 * anyList is copyright (C) 2011-2021 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyList Commercial License for commercial use.
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

    let dm1 = new anyModel();
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

    dm1 = new anyModel({ type: "foo" });
    deepEqual(dm1.type             === "foo" &&
              dm1.id_key           === "foo_id" &&
              dm1.name_key         === "foo_name",
              true, "Constructor sets correct defaults for id_key and name_key when type is given in options.");
    dm1 = new anyModel({
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

    let dm2 = new anyModel(null);
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

    let dm1 = new anyModel({type:"foo",mode:"remote"});
    deepEqual(dm1._getDataSourceName() === any_defs.dataScript,
              true, "_getDataSourceName ok");
  });

  ///////////////////// end _getDataSourceName test /////////////////////

  ///////////////////// dataSearchNextId / dataSearchMaxId tests /////////////////////

  test('dataSearchNextId and dataSearchMaxId', function() {

    let dm1 = new anyModel({type:"foo",mode:"remote"});
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

  test('Model.dataSearch on model created with missing type, id and data', 1, function() {

    let dm = new anyModel();
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

  test('Model.dataSearch on model created with type, id and data with conflicting type', 1, function() {

    let dm = new anyModel({type:"foo",data:{99:{list:"bar"}}});
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

  test('Model.dataSearch on model created with type, id and data with correct type', 3, function() {

    let dm = new anyModel({type:"foo",data:{99:{list:"foo"}}});
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

  test('Model.dataSearch on model created with type, id and deep data', 3, function() {

    let dm = new anyModel({type:"foo",data:{99:{list:"bar",data:{11:{list:"foo"}}}}});
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

  test('Model.dataSearch on model created with type, id and deep data with deviant name_key', 8, function() {

    let data = {99:{list:"bar",data:{11:{list:"foo",foz_name:"The foo foz"},
                                     12:{list:"faz",foo_name:"The faz foo"},
                                     13:{list:"faz",faz_name:"The faz faz"}}}};
    let dm = new anyModel({type:"foo",data:data});
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

  test('Model.dataSearch with parent == true', 1, function() {
    let data = {99:{type:"bar",data:{11:{type:"foo",foo_name:"The foo foz"},
                                    }}};
    let dm = new anyModel({type:"foo",data:data});
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

  test('Model.dataInsert', 13, function() {
    let mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                      12:{list:"faz",faz_name:"The faz"}}}};
    let dm = new anyModel({type:"foo",data:mdata});
    let idata = {list:"barbar",barbar_name:"The barbar"};
    let res = dm.dataInsert({type:"bar",id:99,indata:idata,new_id:13});
    deepEqual(dm.data[99].data[12] !== undefined &&
              dm.data[99].data[13] !== undefined,
              true, "dm.data[99].data[12] != undefined and dm.data[99].data[13] !== undefined after dataInsert with new_id==13");

    mdata = null;
    dm = new anyModel({type:"foo",data:mdata});
    idata = {14:{list:"barbar",barbar_name:"The barbar"}};
    res = dm.dataInsert({type:"bar",indata:idata});
    deepEqual(dm.data[14] !== undefined,
              true, "dm.data[14] !== undefined after dataInsert of indexed data and without new_id to model with null data");

    mdata = null;
    dm = new anyModel({type:"foo",data:mdata});
    idata = {list:"barbar",barbar_name:"The barbar"};
    res = dm.dataInsert({type:"bar",indata:idata,new_id:77});
    deepEqual(dm.data[77] !== undefined,
              true, "dm.data[77] !== undefined after dataInsert of non-indexed data and with new_id==77 to model with null data");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"foo",data:mdata});
    idata = {list:"barbar",barbar_name:"The barbar"};
    res = dm.dataInsert({type:"bar",id:99,indata:idata});
    deepEqual(dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99]["barbar_name"] !== undefined,
              true, "dm.data[99].data[11] !== undefined and "+
                    "dm.data[99].data[12] !== undefined "+
                    "dm.data[99]['barbar_name'] !== undefined "+
                    "after dataInsert with id, but new_id == undefined");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"foo",data:mdata});
    idata = {list:"barbar",barbar_name:"The barbar"};
    res = dm.dataInsert({type:null,id:99,indata:idata,new_id:13});
    deepEqual(dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99].data[13] === undefined,
              true, "dm.data[99].data[11] !== undefined and "+
                    "dm.data[99].data[12] !== undefined and "+
                    "dm.data[99].data[13] === undefined "+
                    "after dataInsert with type == null and incorrect type");

    mdata = {99:{list:"foo",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"foo",data:mdata});
    idata = {list:"foo",foo_name:"The foo"};
    res = dm.dataInsert({type:null,id:99,indata:idata,new_id:13});
    deepEqual(dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99].data[13] !== undefined,
              true, "dm.data[99].data[11] !== undefined and "+
                    "dm.data[99].data[12] !== undefined and "+
                    "dm.data[99].data[13] !== undefined "+
                    "after dataInsert with type == null and correct type");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"foo",data:mdata});
    idata = {list:"barbar",barbar_name:"The barbar"};
    res = dm.dataInsert({type:"baz",id:99,indata:idata,new_id:13});
    deepEqual(dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99].data[13] === undefined,
              true, "dm.data[99].data[11] !== undefined and "+
                    "dm.data[99].data[12] !== undefined and "+
                    "dm.data[99].data[13] === undefined "+
                    "after dataInsert with type == baz");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"foo",data:mdata});
    idata = {list:"bar",bar_name:"The bar"};
    res = dm.dataInsert({type:"bar",id:99,indata:idata,new_id:-1});
    deepEqual(dm.data[99].data[11]  !== undefined &&
              dm.data[99].data[12]  !== undefined &&
              dm.data[99].data[100] !== undefined,
              true, "dm.data[99].data[11] !== undefined and "+
                    "dm.data[99].data[12] !== undefined and "+
                    "dm.data[99].data[100] !== undefined "+
                    "after dataInsert with type == bar and new_id == -1");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"foo",data:mdata});
    idata = {list:"foo",foo_name:"The foo"};
    res = dm.dataInsert({type:"foo",id:null,indata:idata,new_id:null});
    deepEqual(dm.data[99] !== undefined &&
              dm.data.list === 'foo',
              true, "dm.data[99] !== undefined and "+
                    "dm.data.list === 'foo' "+
                    "after dataInsert with type == foo, id == null and new_id == null");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"foo",data:mdata});
    idata = {list:"bar",bar_name:"The bar"};
    res = dm.dataInsert({type:"bar",id:null,indata:idata,new_id:61});
    deepEqual(dm.data[99] !== undefined &&
              dm.data[61] !== undefined,
              true, "dm.data[99] !== undefined and "+
                    "dm.data[61] !== undefined "+
                    "after dataInsert with type == bar, id == null and new_id == 61");

    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"foo",data:mdata});
    idata = {list:"bar",bar_name:"The bar"};
    res = dm.dataInsert({type:"bar",id:99,indata:idata,new_id:-1});
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
    dm = new anyModel({type:"foo",data:mdata});
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

  test('Model.dataUpdate', 6, function() {
    // Normal case
    let mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                      12:{list:"faz",faz_name:"The faz"}}}};
    let dm = new anyModel({type:"foo",data:mdata});
    let res = dm.dataUpdate({type:"foo",id:"11",indata:{foo_name:"Foz Baz"}});
    deepEqual(res !== null &&
              dm.data[99].data[11].foo_name === "Foz Baz" &&
              dm.data[99].data[11].dirty !== undefined,
              true, "dataUpdate with type, id and indata returns correctly updated data and dirty object");

    // Unexisting type
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"foo",data:mdata});
    res = dm.dataUpdate({type:"fiz",id:"11",indata:{foo_name:"Foz Baz"}});
    deepEqual(res === null &&
              dm.data[99].data[11].foo_name === "The foo" &&
              dm.data[99].data[11].dirty === undefined,
              true, "dataUpdate with illegal type, but legal id and indata returns null and data is not changed");

    // Missing / unmatching type
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"biz",data:mdata});
    res = dm.dataUpdate({id:"11",indata:{foo_name:"Foz Baz"}});
    deepEqual(res === null &&
              dm.data[99].data[11].foo_name === "The foo" &&
              dm.data[99].data[11].dirty === undefined,
              true, "dataUpdate with missing/unmatching type, but legal id and indata returns null and data is not changed");

    // Missing id
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"biz",data:mdata});
    res = dm.dataUpdate({type:"foo",indata:{foo_name:"Foz Baz"}});
    deepEqual(res === null &&
              dm.data[99].data[11].foo_name === "The foo" &&
              dm.data[99].data[11].dirty === undefined,
              true, "dataUpdate with missing id, but legal type and indata returns null and data is not changed");

    // Negative id
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"biz",data:mdata});
    res = dm.dataUpdate({type:"foo",id:-1,indata:{foo_name:"Foz Baz"}});
    deepEqual(res === null &&
              dm.data[99].data[11].foo_name === "The foo" &&
              dm.data[99].data[11].dirty === undefined,
              true, "dataUpdate with negative id, but legal type and indata returns null and data is not changed");

    // Missing indata
    mdata = {99:{list:"bar",data:{11:{list:"foo",foo_name:"The foo"},
                                  12:{list:"faz",faz_name:"The faz"}}}};
    dm = new anyModel({type:"biz",data:mdata});
    res = dm.dataUpdate({type:"foo",id:"11"});
    deepEqual(res === null &&
              dm.data[99].data[11].foo_name === "The foo" &&
              dm.data[99].data[11].dirty === undefined,
              true, "dataUpdate with missing indata, but legal type and id returns null and data is not changed");

    // TODO: Tests for non-numerical indexes
  });

  ///////////////////// end dataUpdate tests /////////////////////

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

  ///////////////////// start dataUpdateLinkList tests /////////////////////

  test('Model.dataUpdateLinkList', 7, function() {
    // Normal case
    let mdata = {99:{list:"bar",
                     data:{11:{list:"bar",bar_name:"The first bar"},
                           12:{list:"bar",bar_name:"The second bar"}}}};
    let dm = new anyModel({type:"bar",data:mdata});
    let del = new Set(); del.add(11);
    let ins = new Set(); ins.add(14);
    let res = dm.dataUpdateLinkList({type: "bar",
                                     unselect:  del,
                                     select:    ins,
                                     data:      {14:{list:"bar",foo_name:"INSERT 14"}},
                                     insert_id: 99});
    deepEqual(res &&
              dm.data[99].data[11] === undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99].data[14] !== undefined &&
              dm.data[99].data[14].foo_name == "INSERT 14" ,
              true, "dataUpdateLinkList with type, del, ins, indata and insert_id ok. ");

    // Insert point type differs from options type (1)
    mdata = {99:{list:"bar",
                 data:{11:{list:"bar",bar_name:"The first bar"},
                       12:{list:"bar",bar_name:"The second bar"}}}};
    dm = new anyModel({type:"bar",data:mdata});
    del = new Set(); del.add(11);
    ins = new Set(); ins.add(14);
    res = dm.dataUpdateLinkList({type: "foo",
                                 unselect:  del,
                                 select:    ins,
                                 data:      {14:{list:"bar",foo_name:"INSERT 14"}},
                                 insert_id: 99});
    deepEqual(res !== null &&
              dm.data[99].data[11] !== undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99].data[14] === undefined,
              true, "dataUpdateLinkList with data type different from insert_id type (1). ");

    // Insert point type differs from options type (2)
    mdata = {99:{list:"foo",
                 data:{11:{list:"bar",bar_name:"The first bar"},
                       12:{list:"bar",bar_name:"The second bar"}}}};
    dm = new anyModel({type:"bar",data:mdata});
    del = new Set(); del.add(11);
    ins = new Set(); ins.add(14);
    res = dm.dataUpdateLinkList({type: "bar",
                                 unselect:  del,
                                 select:    ins,
                                 data:      {14:{list:"bar",foo_name:"INSERT 14"}},
                                 insert_id: 99});
    deepEqual(res !== null &&
              dm.data[99].data[11] === undefined &&
              dm.data[99].data[12] !== undefined &&
              dm.data[99].data[14] === undefined,
              true, "dataUpdateLinkList with data type different from insert_id type (2). ");

    // Insert point type differs from options type (3)
    mdata = {99:{list:"bar",
                 data:{11:{list:"bar",bar_name:"The first bar"},
                       12:{list:"bar",bar_name:"The second bar"}}}};
    dm = new anyModel({type:"bar",data:mdata});
    del = new Set(); del.add(11);
    ins = new Set(); ins.add(14);
    res = dm.dataUpdateLinkList({type: "bar",
                                 unselect:  del,
                                 select:    ins,
                                 data:      {14:{list:"foo",foo_name:"Fourteen foo"}},
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
    dm = new anyModel({type:"bar",data:mdata});
    del = new Set(); del.add(11);
    ins = new Set(); ins.add(14);
    res = dm.dataUpdateLinkList({type: "foo",
                                 unselect:  del,
                                 select:    ins,
                                 data:      {14:{list:"foo",foo_name:"Fourteen foo"}},
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
    dm = new anyModel({type:"bar",data:mdata});
    del = new Set(); del.add(11);
    ins = new Set(); ins.add(14);
    res = dm.dataUpdateLinkList({type: "bar",
                                 unselect:  del,
                                 select:    ins,
                                 data:      {14:{list:"foo",foo_name:"Fourteen foo"}},
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
    dm = new anyModel({type:"bar",data:mdata});
    del = new Set(); del.add(11);
    ins = new Set(); ins.add(14);
    console.log(dm.data)
    res = dm.dataUpdateLinkList({type: "foo",
                                 unselect:  del,
                                 select:    ins,
                                 data:      {14:{list:"foo",foo_name:"Fourteen foo"}},
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

  asyncTest('dbSearch normal case - item, with header', 4, function() {
    let dm = new anyModel({type:"user",search:false,mode:"remote"});
    let res = dm.dbSearch({id:"1",head:true});
    deepEqual(res,
              true, "dbSearch({id:'1'}) returns true");
    setTimeout(function() {
      deepEqual(dm.error === "",
                true, "dbSearch({id:'1'}) no error:"+dm.error);
      deepEqual(dm.data !== null,
                true, "dbSearch({id:'1'}) returns item data:"+JSON.stringify(dm.data));
      deepEqual(dm.data !== null &&
                dm.data["+0"].data["+1"]["user_id"]      === "1" &&
                dm.data["+0"].data["+1"]["user_name"] === "Administrator",
                true, "dbSearch({id:'1'}) returns expected data");
      start();
    }, millisec);
  });

  asyncTest('dbSearch normal case - item, without header', 4, function() {
    let dm = new anyModel({type:"user",search:false,mode:"remote"});
    let res = dm.dbSearch({id:"1"});
    deepEqual(res,
              true, "dbSearch({id:'1'}) returns true");
    setTimeout(function() {
      deepEqual(dm.error === "",
                true, "dbSearch({id:'1'}) no error:"+dm.error);
      deepEqual(dm.data !== null,
                true, "dbSearch({id:'1'}) returns item data:"+JSON.stringify(dm.data));
      deepEqual(dm.data !== null &&
                dm.data["+1"]["user_id"]   === "1" &&
                dm.data["+1"]["user_name"] === "Administrator",
                true, "dbSearch({id:'1'}) returns expected data");
      start();
    }, millisec);
  });

  asyncTest('dbSearch normal case - list', 4, function() {
    let dm = new anyModel({type:"user",search:false,mode:"remote"});
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
    let dm = new anyModel({type:"foobar",id_key:"foobar_name",search:false,mode:"remote"});
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
    let dm = new anyModel({type:"user",id_key:"foo",search:false,mode:"remote"});
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
    let dm = new anyModel({type:"foo",search:false,mode:"remote"});
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

  asyncTest('dbSearch for next id through dbSearch with id==max', 4, function() {
    let dm = new anyModel({type:"user",search:false,mode:"remote"});
    deepEqual(dm.dbSearch({type:"user",id:"max"}),
              true, "dbSearch({type:'user',id:'max'}) returns true");
    setTimeout(function() {
      deepEqual(dm.error === "",
                true, "dbSearch({type:'user',id:'max'}) no error:"+dm.error);
      deepEqual(dm.data  === null,
                true, "dbSearch({type:'user',id:'max'}) returns item data for type given in search options:"+JSON.stringify(dm.data));
      deepEqual(parseInt(dm.max) > 3, // Assuming that last user id==3 in the db table
                true, "dbSearch({type:'user',id:'max'}) id > 3:"+dm.max);
      start();
    }, millisec);
  });

  asyncTest('dbSearch for next id through dbSearchNextId', 4, function() {
    let dm = new anyModel({type:"user",search:false,mode:"remote"});
    deepEqual(dm.dbSearchNextId({type:"user",id:"max"}),
              true, "dbSearch({type:'user',id:'max'}) returns true");
    setTimeout(function() {
      deepEqual(dm.error === "",
                true, "dbSearch({type:'user',id:'max'}) no error:"+dm.error);
      deepEqual(dm.data  === null,
                true, "dbSearch({type:'user',id:'max'}) returns item data for type given in search options:"+JSON.stringify(dm.data));
      deepEqual(parseInt(dm.max) > 3, // Assuming that last user id==3 in the db table
                true, "dbSearch({type:'user',id:'max'}) id > 3:"+dm.max);
      start();
    }, millisec);
  });

  ///////////////////// end dbSearch tests /////////////////////

  ///////////////////// dbUpdate tests /////////////////////

  asyncTest('dbUpdate - item: normal case (user 2 must exist in database)', 3, function() {
    let data = {99:{list:"bar",data:{11:{list:"foo",foz_name:"The foo foz"},
                                     12:{list:"faz",foo_name:"The faz foo"},
                                     2:{list:"user",user_name:"The faz user",
                                         dirty:{list:"user",user_name:"The faz user",user_name:"The faz user name"}}}}};
    let dm = new anyModel({name_key:"user_name",type:"user",search:false,mode:"remote",data:data});
    let res = dm.dbUpdate({type:"user",id:2});
    deepEqual(res,
              true, "dbUpdate({type:'user',id:2}) returns true");
    setTimeout(function() {
      let item = dm.dataSearch({type:"user",id:2});
      deepEqual(item[2].user_name === "The faz user" &&
                item[2].dirty === undefined,
                true, "dbUpdate({type:'user',id:2}) returns with correct data in memory:"+
                      item[2].user_name+","+item[2].dirty);
      let dm2 = new anyModel({type:"user",search:false,mode:"remote",data:null});
      dm2.dbSearch({type:"user",id:2});
      setTimeout(function() {
        deepEqual(dm2.data && dm2.data["+2"].user_name === "The faz user",
                  true, "dbUpdate({type:'user',id:2}) returns with correct data in database");
        start();
      }, millisec);
    }, millisec);
  });

  asyncTest('dbUpdate - item: empty input', 3, function() {
    let data = {99:{list:"bar",data:{11:{list:"foo",foz_name:"The foo foz"},
                                     12:{list:"faz",foo_name:"The faz foo"},
                                     50:{list:"event",event_name:"The faz event",
                                         dirty:{list:"event",event_name:"The faz event"}}}}};
    let dm = new anyModel({type:"event",search:false,mode:"remote",data:data});
    let res = dm.dbUpdate();
    deepEqual(res,
              false, "dbUpdate({type:'event',id:50}) with empty input returns false");
    setTimeout(function() {
      let item = dm.dataSearch({type:"event",id:50});
      deepEqual(item[50].event_name === "The faz event" &&
                item[50].dirty !== undefined,
                true, "dbUpdate({type:'event',id:50}) with empty input returns returns unchanged memory data:"+
                      item[50].event_name+","+item[50].dirty);
      let dm2 = new anyModel({type:"event",search:false,mode:"remote",data:null});
      dm2.dbSearch({type:"baz",id:50});
      setTimeout(function() {
        deepEqual(dm2.data=== null,
                  true, "dbUpdate({type:'event',id:50}) with empty input returns null from dbSearch:"+
                        dm2.data);
        start();
      }, millisec);
    });
  });

  asyncTest('dbUpdate - item: id exists in model, but not in database', 3, function() {
    let data = {99:{list:"bar",data:{11:{list:"foo",foz_name:"The foo foz"},
                                     12:{list:"faz",foo_name:"The faz foo"},
                                     555:{list:"event",event_name:"The faz event",
                                         dirty:{list:"event",event_name:"The faz event"}}}}};
    let dm = new anyModel({type:"event",search:false,mode:"remote",data:data});
    let res = dm.dbUpdate({type:"event",id:555});
    deepEqual(res,
              true, "dbUpdate({type:'event',id:555}) returns true");
    setTimeout(function() {
      let item = dm.dataSearch({type:"event",id:555});
      deepEqual(item[555].event_name === "The faz event" &&
                item[555].dirty !== undefined,
                true, "dbUpdate({type:'event',id:555}) returns with correct data in memory:"+
                      item[555].event_name+","+item[555].dirty);
      let dm2 = new anyModel({type:"event",search:false,mode:"remote",data:null});
      dm2.dbSearch({type:"event",id:555});
      setTimeout(function() {
        deepEqual(dm2.data === null,
                  true, "dbUpdate({type:'event',id:555}) returns null from database");
        start();
      }, millisec);
    }, millisec);
  });

  asyncTest('dbUpdate - item with nonexisting id', 3, function() {
    let data = {99:{list:"bar",data:{11:{list:"foo",foz_name:"The foo foz"},
                                     12:{list:"faz",foo_name:"The faz foo"},
                                     50:{list:"baz",event_name:"The faz event",
                                         dirty:{list:"event",event_name:"The faz event"}}}}};
    let dm = new anyModel({type:"event",search:false,mode:"remote",data:data});
    let res = dm.dbUpdate({type:"event",id:6346});
    deepEqual(res,
              false, "dbUpdate({type:'baz',id:6346}) item with nonexisting id returns false");
    setTimeout(function() {
      let item = dm.dataSearch({type:"baz",id:6346});
      deepEqual(item === null,
                true, "dbUpdate({type:'baz',id:6346}) item with nonexisting id returns returns null from dataSearch");
      let dm2 = new anyModel({type:"biz",search:false,mode:"remote",data:null});
      dm2.dbSearch({type:"baz",id:6346});
      setTimeout(function() {
        deepEqual(dm2.data=== null,
                  true, "dbUpdate({type:'baz',id:6346}) item with nonexisting id returns null from dbSearch:"+
                        dm2.data);
        start();
      }, millisec);
    }, millisec);
  });

  asyncTest('dbUpdate - item with different model.type', 3, function() {
    let data = {99:{list:"bar",data:{11:{list:"foo",foz_name:"The foo foz"},
                                     12:{list:"faz",foo_name:"The faz foo"},
                                     2:{list:"user",user_name:"The faz user",
                                         dirty:{list:"user",user_name:"The faz user"}}}}};
    let dm = new anyModel({type:"baz",search:false,mode:"remote",data:data});
    let res = dm.dbUpdate({type:"user",id:2});
    deepEqual(res,
              true, "dbUpdate({type:'user',id:2}) with different model type returns true");
    setTimeout(function() {
      let item = dm.dataSearch({type:"user",id:2});
      deepEqual(item[2].user_name === "The faz user" &&
                item[2].dirty === undefined,
                true, "dbUpdate({type:'user',id:2}) with different model type returns with correct data in memory:"+
                      item[2].user_name+","+item[2].dirty);
      let dm2 = new anyModel({type:"user",search:false,mode:"remote",data:null});
      dm2.dbSearch({type:"user",id:2});
      setTimeout(function() {
        deepEqual(dm2.data["+2"].user_name === "The faz user",
                  true, "dbUpdate({type:'user',id:2}) with different model type returns with correct data in database:"+
                        dm2.data["+2"].user_name);
        start();
      }, millisec);
    }, millisec);
  });

  asyncTest('dbUpdate - item with type that does not match model.type', 3, function() {
    let data = {99:{list:"bar",data:{11:{list:"foo",foz_name:"The foo foz"},
                                     12:{list:"faz",foo_name:"The faz foo"},
                                     2:{list:"baz",user_name:"The faz user",
                                         dirty:{list:"user",user_name:"The faz user"}}}}};
    let dm = new anyModel({type:"user",search:false,mode:"remote",data:data});
    let res = dm.dbUpdate({type:"biz",id:2});
    deepEqual(res,
              false, "dbUpdate({type:'baz',id:2}) with input type that does not match model type returns false");
    setTimeout(function() {
      let item = dm.dataSearch({type:"baz",id:2});
      deepEqual(item[2].user_name === "The faz user" &&
                item[2].dirty !== undefined,
                true, "dbUpdate({type:'baz',id:2}) with input type that does not match model type returns returns unchanged memory data:"+
                      item[2].user_name+","+item[2].dirty);
      let dm2 = new anyModel({type:"biz",search:false,mode:"remote",data:null});
      dm2.dbSearch({type:"baz",id:2});
      setTimeout(function() {
        deepEqual(dm2.data=== null,
                  true, "dbUpdate({type:'baz',id:2}) with input type that does not match model type returns null from dbSearch:"+
                        dm2.data);
        start();
      }, millisec);
    }, millisec);
  });

  asyncTest('dbUpdate insert (user) data that is in memory', 3, function() {
    let usrname = "user"+Math.floor(Math.random()*100000);
    let data7779 = {77:{list:"user",user_name:"us77"},
                    79:{list:"user",user_name:"us79",user_login:usrname,user_pass:"qqq",user_pass_again:"qqq",is_new:true}};
    let dm = new anyModel({type:"user",search:false,mode:"remote",data:data7779});
    // insert
    let res = dm.dbUpdate({id:79,is_new:true}); // insert data
    deepEqual(res,
              true, "dbUpdate(data) returns true (insert1)");
    setTimeout(function() {
      deepEqual(dm.last_insert_id !== undefined &&
                dm.data[dm.last_insert_id].is_new === undefined,
                true, "dbUpdate() deletes is_new mark when data is given as model's data");
      deepEqual(dm.message == "User created. " || dm.message == "User created. User logged in. ",
                true, "dbUpdate() creates user");
      start();
    }, millisec);
  });

  asyncTest('dbUpdate insert data that is not in memory', 2, function() {
    let data22 = {22:{list:"user",user_name:"us22"}};
    let dm = new anyModel({type:"user",search:false,mode:"remote",data:data22});
    // insert
    let data23 = {23:{list:"user",user_name:"us23",is_new:true}};
    let res = dm.dbUpdate({id:23,indata:data23,is_new:true}); // insert data
    deepEqual(res,
              true, "dbUpdate(data) returns true (insert2)");
    setTimeout(function() {
      deepEqual(dm.data[22] !== undefined &&
                dm.data[23] === undefined,
                true, "dbUpdate() does not insert into memory when data is given as parameter to update only");
      start();
    }, millisec);
  });

  ///////////////////// end dbUpdate tests /////////////////////

  ///////////////////// dbUpdateLinkList
  // TODO

  ///////////////////// dbDelete

  asyncTest('dbDelete: normal case (user with id 55 must exist in db user table)', 3, function() {
    let dm = new anyModel({type:"user",search:false,mode:"remote",data:null});
    let res = dm.dbDelete({type:"user",id:55});
    deepEqual(res,
              true, "dbDelete() returns true");
    setTimeout(function() {
      deepEqual(dm.data === null,
                true, "dbDelete() returns no data from db:"+dm.data);
      deepEqual(dm.error === "" || dm.error === "Nothing to delete",
                true, "no error or nothing to delete:"+dm.error);
      start();
    }, millisec);
  });

  asyncTest('dbDelete: deleting non-existing id (user with id 56 must NOT exist in db user table)', 3, function() {
    let dm = new anyModel({type:"user",search:false,mode:"remote",data:null});
    let res = dm.dbDelete({type:"user",id:56});
    deepEqual(res,
              true, "dbDelete() returns true");
    setTimeout(function() {
      deepEqual(dm.data === null,
                true, "dbDelete() returns no data from db:"+dm.data);
      deepEqual(dm.message !== "",
                true, "message is not blank:"+dm.message);
      start();
    }, millisec);
  });

  test('dbDelete: model with no type or id_key', 1, function() {
    let dm = new anyModel({search:false,mode:"remote"});
    deepEqual(dm.dbDelete({}),
             false, "dbDelete() returns false");
  });

  asyncTest('dbDelete: model with type not in database', 3, function() {
    let dm = new anyModel({type:"foox",search:false,mode:"remote",data:null});
    let res = dm.dbDelete({id:99});
    deepEqual(res,
              true, "dbDelete() returns true");
    setTimeout(function() {
      deepEqual(dm.data === null,
                true, "dbDelete() returns no data from db:"+dm.data);
      deepEqual(dm.error !== "",
                true, "error is not blank:"+dm.error);
      start();
    }, millisec);
  });

  asyncTest('dbDelete: model with existing type, calling delete with existing id but non-existing type', 3, function() {
    let dm = new anyModel({type:"user",search:false,mode:"remote",data:null});
    let res = dm.dbDelete({type:"foox",id:50}); // user 50 must exist in db user table
    deepEqual(res,
              true, "dbDelete() returns true");
    setTimeout(function() {
      deepEqual(dm.data === null,
                true, "dbDelete() returns no data from db:"+dm.data);
      deepEqual(dm.error !== "",
                true, "error is not blank:"+dm.error);
      start();
    }, millisec);
  });

  asyncTest('dbDelete: model type in data structure, but not in database', 3, function() {
    let data = {99:{list:"bar",data:{11:{list:"foox",foz_name:"The foox foz"},
                                     12:{list:"faz",foo_name:"The faz foo"},
                                     66:{list:"user",user_name:"The faz user"}}}};
    let dm = new anyModel({type:"foox",search:false,mode:"remote",data:data});
    let res = dm.dbDelete({id:66});
    deepEqual(res,
              true, "dbDelete() returns true");
    setTimeout(function() {
      deepEqual(dm.data[99].data[66] !== undefined,
                true, "dbDelete() does not delete local data when data not in database");
      deepEqual(dm.error !== "",
                true, "error is not blank:"+dm.error);
      start();
    }, millisec);
  });

  asyncTest('dbDelete: model type in data structure and in database (user with id 67 must exist in user table)', 3, function() {
    let data = {99:{list:"bar",data:{11:{list:"foo",foz_name:"The foo foz"},
                                     12:{list:"faz",foo_name:"The faz foo"},
                                     67:{list:"user",user_name:"delme"}}}};
    let dm = new anyModel({type:"user",search:false,mode:"remote",data:data});
    let res = dm.dbDelete({type:"user",id:67});
    deepEqual(res,
              true, "dbDelete() returns true");
    setTimeout(function() {
      deepEqual(dm.data[99].data[67] !== undefined,
                true, "dbDelete() does not delete local data when deleting data in database");
      deepEqual(dm.error === "" || dm.error === "Nothing to delete",
                true, "no error or nothing to delete:"+dm.error);
      start();
    }, millisec);
  });

  // insert, update, search and delete tests
  asyncTest('dbUpdate and dbDelete: Insert, update, search, view and delete user', 15, function() {
    let data33 = {33:{list:"user",user_name:"us33",user_login:"us33",user_pass:"qqq",user_pass_again:"qqq"}};
    let dm = new anyModel({type:"user",search:false,mode:"remote",data:data33});
    // insert
    let data34 = {34:{list:"user",user_name:"us34",user_login:"us34",user_pass:"qqq",user_pass_again:"qqq",is_new:true}};
    let res = dm.dbUpdate({id:34,indata:data34,is_new:true}); // insert data
    deepEqual(res, true, "dbUpdate(data) returns true (insert)");
    setTimeout(function() {
      deepEqual(dm.data[34] === undefined, true, "dbUpdate(data) does not insert into memory when data is given as parameter to update only");
      deepEqual(dm.error === "", true, "no error:"+dm.error);
      let new_id = dm.last_insert_id;
      deepEqual(new_id  != null && new_id != undefined,true, "new_id has a value:"+new_id);
      deepEqual(dm.data != null && dm.data!= undefined,true, "data has a value:"+JSON.stringify(dm.data));
      start();
      stop();
      // update
      dm.data = null;
      dm.dataInsert({type:"user",id:null,indata:data34});
      deepEqual(dm.data[34] !== null, true, "inserted data with id 34:"+JSON.stringify(dm.data));
      let data = {[new_id]:{list:"user",user_name:"us1_changed",user_pass:"qqq",user_pass_again:"qqq",
                            dirty:{user_name:"us1_changed",user_pass:"qqq",user_pass_again:"qqq"}}};
      let res = dm.dbUpdate({id:new_id,indata:data});
      deepEqual(res,
                true, "dbUpdate("+new_id+",data) returns true (update)");
      setTimeout(function() {
        deepEqual(dm.error === "",  true, "no error:"+dm.error);
        deepEqual(dm.data != null && dm.data!= undefined, true, "data has a value:"+JSON.stringify(dm.data));
        start();
        stop();
        // search
        deepEqual(dm.dbSearch({id:new_id}), true, "dbSearch('"+new_id+"') returns true when valid id");
        setTimeout(function() {
          deepEqual(dm.data !== null,true, "dbSearch('"+new_id+"') returns item data:"+JSON.stringify(dm.data));
          deepEqual(dm.error === "", true, "no error:"+dm.error);
          start();
          stop();
          // delete
          dm.data = null;
          let res = dm.dbDelete({id:new_id});
          deepEqual(res, true, "dbDelete("+new_id+") returns true");
          setTimeout(function() {
            deepEqual(dm.data === null,true, "dbDelete("+new_id+") returns no data:"+dm.data);
            deepEqual(dm.error === "", true, "dbDelete returns no error:"+dm.error);
            // do a manual check that user is deleted from database
            start();
          }, millisec);
        }, millisec);
      }, millisec);

    }, millisec);
  });

  ///////////////////// end dbDelete tests /////////////////////

} // testModel
