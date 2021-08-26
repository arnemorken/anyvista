"use strict";
/**
 ****************************************************************************************
 *
 * anyList is copyright (C) 2011-2021 Arne D. Morken and Balanse Software.
 *
 * @license AGPLv3.0 for open source use or anyList Commercial License for commercial use.
 * Get licences here: http://balanse.info/anylist/license/ (coming soon).
 *
 ****************************************************************************************
 *
 * __View for the anyList data model.__
 *
 * See <a href="../classes/anyDataModel.html">`anyDataModel`</a> for a description of the data model class.
 *
 * Note: All jQuery id's in anyList are on the format [base_id]\_[type]\_[kind]\_[id]\_[html_name].
 *
 * @class anyDataView
 * @constructor Sets the view's variables according to `options`, or to default values.
 * @param {Object}  options An object which may contain these elements:
 *
 *        {Object}  model:                 The model with data to be displayed. Default: null.
 *        {Object}  filters:               The filters define how the data will be displayed. Default: null.
 *        {string}  id:                    The jQuery id of a container element in which to display the view. Default: null.
 *        {string}  grouping:              How to group data: Empty string for no grouping, "tabs" for using anyDataViewTabs to group data into tabs. Default: "".
 *        {boolean} refresh:               If true, the constructor will call `this.refresh` at the end of initialization. Default: false.
 *        {boolean} isEditable:            Icons for edit, update and cancel will be displayed. Ignored if isSelectable is set. Default: false.
 *        {boolean} isRemovable:           An icon for removing will be displayed. Ignored if isSelectable is set. Default: false.
 *        {boolean} isDeletable:           An icon for deleting will be displayed. Ignored if isSelectable is set. Default: false.
 *        {boolean} isLinkable:            NOT IMPLEMENTED. An icon for linking will be displayed. Ignored if isSelectable is set. Default: false.
 *        {boolean} isSelectable:          An icon for selecting a list row will be displayed. Ignored for items. If isSelectable is set,
 *                                         isEditable, isRemovable, isDeletable and isLinkable will be ignored. Default: false.
 *        {boolean} confirmRemove:         A remove confirmation dialog will be displayed. Default: true.
 *        {boolean} confirmDelete:         A delete confirmation dialog will be displayed. Default: true.
 *        (boolean) showHeader:            If false, all headers will be suppressed. Default: true.
 *        (boolean) showTableHeader:       Whether to show headers for list tables. Default: true.
 *        (boolean) showMessages:          Will show a message field in a toolbar. Default: false.
 *        (boolean) showEmptyRows:         Shows empty rows in non-edit mode. Default: false.
 *        (boolean) showSelectAll:         If isSelectable is true, a button for selecting all rows will be shown. Default: false.
 *        (integer) showButtonAdd:         If isEditable is true, a button for adding new rows may be shown in list table headers. Possible values:
 *                                         0: Do not show an add button. 1: Show button in first column. 2: Show button in last column. Default: 0.
 *        (boolean) showButtonEdit:        If isEditable is true, will show an edit button in front of each list table row. Default: true.
 *        (boolean) showButtonUpdate:      If isEditable is true, will show an update button in front of each list table row in edit-mode. Default: true.
 *        (boolean) showButtonRemove:      If isEditable is true, will show a remove button after each list table row. Default: false.
 *        (boolean) showButtonLink:        If isEditable is true, will show a link button after each list table row in edit-mode. Default: true.
 *        (boolean) showButtonDelete:      If isEditable is true, will show a delete button after each list table row in edit-mode. Default: false.
 *        (boolean) showButtonCancel:      If isEditable is true, will show a cancel button after each list table row in edit-mode. Default: true.
 *        (boolean) showButtonNew:         If isEditable is true, will show a button for adding a new item. Default: false.
 *        (boolean) showButtonAddLink:     Will show a button for adding links to an item. Default: true.
 *        {boolean} showButtonLabels:      Will show labels for buttons on the button panel. Default: false.
 *        {boolean} onEnterCallDatabase:   Pressing enter will update the database with the value of the row being edited. Default: true.
 *        {boolean} onEnterInsertNew:      A new row will be inserted when pressing enter while editing a list. Default: false.
 *        {boolean} onEnterMoveFocus:      Pressing enter will move the focus to the next input element if editing an item. Default: True.
 *        {boolean} onEscRemoveEmpty:      The current row being edited in a list will be removed when pressing the Esc key if the row is empty. Default: true.
 *        {boolean} onFocusoutRemoveEmpty: The current row being edited in a list will be removed when loosing focus if the row is empty. Default: true.
 *        {boolean} onUpdateEndEdit:       NOT IMPLEMENTED. Pressing the update button will close the element currently being edited for editing. Default: true.
 *        {boolean} useOddEven:            If true, tags for odd and even columns will be generated for list entries. Default: false.
 *
 * @example
 *      new anyDataView({filters:my_filters,id:"my_content"});
 */
