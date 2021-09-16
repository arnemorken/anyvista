<!--
 ****************************************************************************************
 *
 * anyList is copyright (C) 2011-2021 Arne D. Morken and Balanse Software.
 *
 * @license AGPLv3.0 for open source use or anyList Commercial License for commercial use.
 * Get licences here: http://balanse.info/anylist/license/ (coming soon).
 *
 ****************************************************************************************
-->
<!doctype html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html;charset=utf-8"/>
<?php
  require_once dirname(__FILE__)."/../data/anyDefs.php";
?>

<!-- jQuery -->
<script src="<?php print gjQuery_js;?>"></script>

<!-- AnyList -->
<script src="<?php print gAnyListURL;?>view/functions.js"></script>
<script src="<?php print gAnyListURL;?>view/anyDefs.js"></script>
<script src="<?php print gAnyListURL;?>view/anyStrings_en-GB.js"></script>
<script src="<?php print gAnyListURL;?>view/anyDataModel.js"></script>

<!-- QUnit -->
<title>anyList QUnit test suite</title>
<link  href="http://localhost/Prosjekter/testserver/javascript/jquery/qunit/qunit-1.23.1.css" rel="stylesheet"/>
<script src="http://localhost/Prosjekter/testserver/javascript/jquery/qunit/qunit-1.23.1.js"></script>

<!-- Test files -->
<script src="TestDataModel.js"></script>
<script>
new Promise(function(resolve) { resolve(); })
.then(function() { doTest("Model"); })
</script>
</head>

<body>
  <div>
    <h1  id="qunit-header">anyList QUnit test suite</h1>
    <h2  id="qunit-banner"></h2>
    <div id="qunit-testrunner-toolbar"></div>
    <h2  id="qunit-userAgent"></h2>
    <ol  id="qunit-tests"></ol>
  </div>
  <div id="any_content" style="border:1px solid red">
  </div>
</body>
</html>
