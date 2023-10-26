"use strict";
/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2023 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ***************************************************************************************/
var i18n = {
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
    buttonClose:          "Close",
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
    SYSTEM_ERROR:          "System error. ",
    SERVER_ERROR:          "Server error. See console log for details. ",
    DATASOURCE_MISSING:    "No local data source. ",
    CALLBACK_MISSING:      "Callback function or context missing. ",
    SUCCCESS_CB_MISSING:   "Success callback missing for local data source. ",
    VIEW_AREA_MISSING:     "View area missing. ",
    MODEL_MISSING:         "Model missing. ",
    OPTIONS_MISSING:       "Options missing. ",
    DATA_MISSING:          "Data missing. ",
    TYPE_MISSING:          "Type missing. ",
    LINK_TYPE_MISSING:     "Link type missing. ",
    TYPEKIND_MISSING:      "Missing type or kind for data with id ",
    ID_KEY_MISSING:        "Id key missing. ",
    NAME_KEY_MISSING:      "Name key missing. ",
    ID_MISSING:            "Id missing. ",
    ID_ILLEGAL:            "Id must be a positive integer or a string. ",
    LINK_ITEMS_MISSING:    "No items to add or remove. ",
    NEW_ID_NOT_FOUND:      "Could not find new id for type %%. ",
    ITEM_NOT_FOUND:        "Could not find %% item with id &&. ",
    FILTERS_MISSING:       "filter missing. ",
    FILTER_NOT_FOUND:      "Filter for %% not found. ",
    TOO_MUCH_RECURSION:    "Too much recursion. ",
    NOTHING_TO_UPDATE:     "Nothing to update. ",
    NOTHING_TO_INSERT:     "Nothing to insert. ",
    COULD_NOT_CREATE_VIEW: "Could not create view",
  },
};
