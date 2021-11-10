<?php
/****************************************************************************************
 *
 * anyList is copyright (C) 2011-2021 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyList Commercial License for commercial use.
 * Get licences here: http://balanse.info/anylist/license/ (coming soon).
 *
 ****************************************************************************************/
/*
 * Include this file in plugins that are using the anyList user plugin with a server backend
 */
?>
<!-- jQuery -->
<script src="<?php print gjQuery_js;?>"></script>
<script src="<?php print gjQueryWidget_js;?>"></script>

<!-- W3.CSS and Font Awesome -->
<link href="<?php print gW3CSS_css;?>"       rel="stylesheet"/>
<link href="<?php print gFontAwesome_css;?>" rel="stylesheet"/>

<!--
  -- AnyList
  -->
<link  href="<?php print gAnyListURL;?>view/skin/<?php print gSkin;?>/anylist.css" rel="stylesheet"/>

<script src="<?php print gAnyListURL;?>view/functions.js"></script>
<script src="<?php print gAnyListURL;?>view/anyDefs.js"></script>
<script src="<?php print gAnyListURL;?>view/anyStrings_en-GB.js"></script>

<script src="<?php print gAnyListURL;?>view/anyDataModel.js"></script>
<script src="<?php print gAnyListURL;?>view/anyDataView.js"></script>
<script src="<?php print gAnyListURL;?>view/anyFilter.js"></script>

<style>
body {
  margin:0; padding:0;
}
</style>
