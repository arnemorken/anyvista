<!--
 ****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2024 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ****************************************************************************************
-->
<!doctype html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html;charset=utf-8"/>
<?php
  require_once dirname(__FILE__)."/../data/mysql/anyDefs.php";
?>

<!-- jQuery -->
<script src="<?php print gjQuery_js;?>"></script>

<!-- anyVista -->
<script src="<?php print gAnyvistaURL;?>/data/alasql/alasql-4.3.3.min.js"></script>
<script src="<?php print gAnyvistaURL;?>/data/alasql/db/dbConnection.js"></script>
<script src="<?php print gAnyvistaURL;?>/data/alasql/db/dbTable.js"></script>
<script src="<?php print gAnyvistaURL;?>/data/alasql/anyTable.js"></script>
<script src="<?php print gAnyvistaURL;?>/data/alasql/anyTableFactory.js"></script>

<script src="<?php print gAnyvistaURL;?>view/functions.js"></script>
<script src="<?php print gAnyvistaURL;?>view/anyDefs.js"></script>
<script src="<?php print gAnyvistaURL;?>view/anyStrings_en-GB.js"></script>
<script src="<?php print gAnyvistaURL;?>view/anyModel.js"></script>

<!-- QUnit -->
<title>anyVista QUnit test suite</title>
<link  href="http://localhost/Prosjekter/testserver/javascript/jquery/qunit/qunit-1.23.1.css" rel="stylesheet"/>
<script src="http://localhost/Prosjekter/testserver/javascript/jquery/qunit/qunit-1.23.1.js"></script>

<!-- Test files -->
<script src="TestModel.js"></script>
<script>
new Promise(function(resolve) { resolve(); }) // TODO! Why?
.then(function() { doTest("Model"); })
</script>
</head>

<body>
  <div>
    <h1  id="qunit-header">anyVista QUnit test suite</h1>
    <h2  id="qunit-banner"></h2>
    <div id="qunit-testrunner-toolbar"></div>
    <h2  id="qunit-userAgent"></h2>
    <ol  id="qunit-tests"></ol>
  </div>
  <div id="any_content" style="border:1px solid red">
  </div>
</body>
</html>
