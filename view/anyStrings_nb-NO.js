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
    buttonNew:            "Ny",
    buttonAdd:            "Legg til",
    buttonEdit:           "Rediger",
    buttonUpdate:         "Lagre",
    buttonDelete:         "Slett",
    buttonAddToList:      "Legg til %% i liste",
    buttonRemove:         "Fjern",
    buttonRemoveFromList: "Fjern %% fra liste",
    buttonCancel:         "Avbryt",
    buttonClose:          "Lukk",
    buttonSelect:         "Velg",
    buttonAddLink:        "Legg til",
  },

  message: {
    newType:        "Ny %%",
    removeByName:   "Vil du fjerne %%",
    deleteByName:   "Vil du slette '%%'?\n\n<br/>Du kan ikke angre denne handlingen.",
    addRemove:      "Legg til / fjern...",
  },

  // Error codes
  error: {
    SYSTEM_ERROR:        "Systemfeil. ",
    SERVER_ERROR:        "Serverfeil. Se konsoll loggen for detaljer. ",
    CALLBACK_MISSING:    "Mangler callback funksjon eller kontekst. ",
    SUCCCESS_CB_MISSING: "Mangler suksess callback for local modus. ",
    VIEW_AREA_MISSING:   "Mangler view område. ",
    MODEL_MISSING:       "Mangler modell. ",
    OPTIONS_MISSING:     "Mangler options. ",
    DATA_MISSING:        "Mangler data. ",
    TYPE_MISSING:        "Mangler type. ",
    LINK_TYPE_MISSING:   "Mangler lenke type. ",
    TYPEKIND_MISSING:    "Mangler type eller kind for data med id ",
    ID_KEY_MISSING:      "Mangler id key. ",
    NAME_KEY_MISSING:    "Mangler name key. ",
    ID_MISSING:          "Mangler id. ",
    ID_ILLEGAL:          "Id må være et positivt heltall eller en streng. ",
    UPDATE_DATA_MISSING: "Mangler data for oppdatering. ",
    LINK_ITEMS_MISSING:  "Mangler elementer å legge til eller fjerne. ",
    NEW_ID_NOT_FOUND:    "Fant ikke ny id for type %%. ",
    ITEM_NOT_FOUND:      "Fant ikke element med id %%. ",
    FILTERS_MISSING:     "filter mangler. ",
    FILTER_NOT_FOUND:    "Filter for %% finnes ikke. ",
    TOO_MUCH_RECURSION:  "For mye rekursjon. ",
    NOTHING_TO_UPDATE:   "Ingenting å oppdatere. ",
  },
};
