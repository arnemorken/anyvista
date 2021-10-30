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
var i18n = {
  general: {
  },

  button: {
    buttonNew:            "New",
    buttonAdd:            "Add",
    buttonEdit:           "Edit",
    buttonUpdate:         "Save",
    buttonDelete:         "Delete",
    buttonAddToList:      "Add %% to list",
    buttonRemove:         "Remove",
    buttonRemoveFromList: "Remove %% from list",
    buttonCancel:         "Cancel",
    buttonSelect:         "Select",
    buttonAddLink:        "Add",
  },

  message: {
    newType:        "New %%",
    removeByName:   "Do you want to remove %%",
    deleteByName:   "Do you want to delete '%%'?\n\n<br/>You can not undo this action.",
    addRemove:      "Add / remove...",
  },

  // Error codes
  error: {
    SYSTEM_ERROR:        "System error. ",
    CALLBACK_MISSING:    "Callback function or context missing. ",
    SUCCCESS_CB_MISSING: "Success callback missing for local mode. ",
    MODEL_MISSING:       "Model missing. ",
    OPTIONS_MISSING:     "Options missing. ",
    DATA_MISSING:        "Data missing. ",
    TYPE_MISSING:        "Type missing. ",
    ID_KEY_MISSING:      "Id key missing. ",
    ID_MISSING:          "Id missing. ",
    ID_ILLEGAL:          "Id must be a positive integer or a string. ",
    UPDATE_DATA_MISSING: "No data for update. ",
    NEW_ID_NOT_FOUND:    "Could not find new id for type %%. ",
    ITEM_NOT_FOUND:      "Could not find item with id %%. ",
    VIEW_AREA_MISSING:   "View area missing. ",
    FILTERS_MISSING:     "filter missing. ",
    FILTER_NOT_FOUND:    "Filter for %% not found. ",
    TOO_MUCH_RECURSION:  "Too much recursion. ",
    NOTHING_TO_UPDATE:   "Nothing to update. ",
  },
};
