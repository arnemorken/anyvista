<?php
/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2023 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ****************************************************************************************/
/*
 * Include this file in user defined type classes that are using a server backend
 */
?>
<!-- jQuery -->
<script src="<?php print gjQuery_js;?>"></script>
<script src="<?php print gjQueryWidget_js;?>"></script>

<!-- W3.CSS and Font Awesome -->
<link href="<?php print gW3CSS_css;?>"       rel="stylesheet"/>
<link href="<?php print gFontAwesome_css;?>" rel="stylesheet"/>

<!-- TinyMCE -->
<script src="<?php print gTinyMCE_js;?>"></script>

<!-- anyPaginator -->
<link  href="<?php print gAnyPaginator_css;?>" rel="stylesheet"/>
<script src="<?php print gAnyPaginator_js;?>"></script>

<!--
  -- anyVista
  -->
<link  href="<?php print gAnyvistaURL;?>view/skin/<?php print gSkin;?>/anyvista.css" rel="stylesheet"/>

<script src="<?php print gAnyvistaURL;?>view/functions.js"></script>
<script src="<?php print gAnyvistaURL;?>view/anyDefs.js"></script>
<script src="<?php print gAnyvistaURL;?>view/anyStrings_en-GB.js"></script>

<script src="<?php print gAnyvistaURL;?>view/anyModel.js"></script>
<script src="<?php print gAnyvistaURL;?>view/anyView.js"></script>
<script src="<?php print gAnyvistaURL;?>view/anyViewTabs.js"></script>
<script src="<?php print gAnyvistaURL;?>view/anyFilter.js"></script>

<style>
body {
  margin:0; padding:0;
}
</style>
