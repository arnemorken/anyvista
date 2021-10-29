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
    buttonNew:            "Ny",
    buttonAdd:            "Legg til",
    buttonEdit:           "Rediger",
    buttonUpdate:         "Lagre",
    buttonDelete:         "Slett",
    buttonAddToList:      "Legg til %% i liste",
    buttonRemove:         "Fjern",
    buttonRemoveFromList: "Fjern %% fra liste",
    buttonCancel:         "Avbryt",
  },

  message: {
    newType:        "Ny %%",
    removeByName:   "Vil du fjerne %%",
    deleteByName:   "Vil du slette '%%'?\n\n<br/>Du kan ikke angre denne handlingen.",
  },

  // Error codes
  error: {
    SYSTEM_ERROR:        "Systemfeil. ",
    CALLBACK_MISSING:    "Mangler callback funksjon eller kontekst. ",
    SUCCCESS_CB_MISSING: "Mangler suksess callback for local modus. ",
    MODEL_MISSING:       "Mangler modell. ",
    OPTIONS_MISSING:     "Mangler options. ",
    DATA_MISSING:        "Mangler data. ",
    TYPE_MISSING:        "Mangler type. ",
    ID_KEY_MISSING:      "Mangler id key. ",
    ID_MISSING:          "Mangler id. ",
    ID_ILLEGAL:          "Id må være et positivt heltall eller en streng. ",
    UPDATE_DATA_MISSING: "Mangler data for oppdatering. ",
    NEW_ID_NOT_FOUND:    "Fant ikke ny id for type %%. ",
    ITEM_NOT_FOUND:      "Fant ikke element med id %%. ",
    VIEW_AREA_MISSING:   "Mangler view area. ",
    FILTERS_MISSING:     "filter mangler. ",
    FILTER_NOT_FOUND:    "Filter for %% finnes ikke. ",
    TOO_MUCH_RECURSION:  "For mye rekursjon. ",
    NOTHING_TO_UPDATE:   "Ingenting å oppdatere. ",
  },
};
