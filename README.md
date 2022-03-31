[![CodeQL](https://github.com/arnemorken/anylist/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/arnemorken/anylist/actions/workflows/codeql-analysis.yml)

# anylist <img src="balanselogo_85x95.png" align="right">

A Javascript library that can be used in apps or web pages, with or without a database back-end, for displaying editable or non-editable items and lists of almost any combination of HTML elements, freely mixing lists and items of different types, interacting with lists and list items and using predefined or user defined plugins. 

anyList can read complex data structures from Ajax, inline code or indeed any data source, as long as it follows a certain flexible data format, and display the data in beautiful tables. 

anyList can also be used as a Wordpress plugin. 

Early versions of the library is already been used in both commercial and non-commercial projects - see screenshots below:

**Example 1: "Rulletour", a free online bicycle tournament:**

![alt text](https://raw.githubusercontent.com/arnemorken/anylist/main/examples/sample_ss_rt.png)

**Example 2: "Acupedia", a commercial Android app for professional acupuncturists:**

![alt text](https://raw.githubusercontent.com/arnemorken/anylist/main/examples/sample_ss_acupedia.png)

jsFiddle examples coming soon.

# Download

The library is currently in the last stages of development. Find it at Github: https://github.com/arnemorken/anylist/.

**First beta release planned for April 2022.**

# Usage

1. Include the anyList script and CSS files:

```html
<script src="/path/to/anyList.js"></script>
<link  href="/path/to/anyList.css" rel="stylesheet"/>
```

2. Create a place for the view to live:
```html
<div id="myview"></div>
```

3. Provide some data, in this case a list (the data may come from any source as long as it's on the proper format):
```js
let my_data = {
  0: {
    list: "foo",
    foo_name: "Hello world 1",
    foo_desc: "A simple hello to the world",
  },
  1: {
    foo_name: "Hello world 2",
    foo_desc: "Another hello to the world",
  },
};
```

4. Feed the data  to a model:
```js
let my_model = new anyModel({ data: my_data });
```

5. Provide filters to describe the data for the view:
```js
let my_filters = {
  foo: {
    list: {
      foo_id  : { HEADER:"Id",          DISPLAY:0, HTML_TYPE:"label" },
      foo_name: { HEADER:"Message",     DISPLAY:1, HTML_TYPE:"label" },
      foo_desc: { HEADER:"Description", DISPLAY:1, HTML_TYPE:"text" },
    },
  },
};
```

6. Give the model and filters to a view, tell the view where to live and display:
```js
let my_view  = new anyView({
  model:   my_model,
  filters: my_filters,
  id:      "myview",
});
my_view.refresh();
```

7. As an alternative  to the last step, one could do this:
```js
$("#minimal_foo_list").anyView({
  model:   my_model,
  filters: my_filters,
  id:      "minimal_foo_list", // Id of div in which to display result
});
$("#minimal_foo_list").anyView("refresh");
```

The above will produce an output like this:

![alt text](https://raw.githubusercontent.com/arnemorken/anylist/main/examples/hello_world/hello_list_uneditable.png)

To make the view editable, give the following option to the anyView constructor:
```js
  ...
  isEditable: true,
  ...
```

We will then get a view like this:

![alt text](https://raw.githubusercontent.com/arnemorken/anylist/main/examples/hello_world/hello_list_editable.png)

# API

Coming soon.

# Improvements

Got an idea for improving anyList? A cool new feature you'd like to see? Think you've found a bug? Contact us at software@balanse.info!
We love pull requests! 

# License

AGPLv3.0 for open source use or anyList Commercial License for commercial use.

Get licences here: https://anylist.balanse.info/license/ (coming soon).

# Donations

Donations are very welcome :)

[![Donate](https://www.paypalobjects.com/en_US/GB/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/donate/?hosted_button_id=EZGCG4XQER5KQ)

# Contact

Feature requests, ideas, bug reports: software@balanse.info

License and other commercial inquiries: license@balanse.info
