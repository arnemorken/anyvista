[![CodeQL](https://github.com/arnemorken/anyvista/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/arnemorken/anyvista/actions/workflows/codeql-analysis.yml)

# anyVista <img src="balanselogo_85x95.png" align="right">

A Javascript library for grouping, displaying and optionally editing hierarchical data as items or lists of almost any combination of HTML elements, freely mixing lists and items of different types, interacting with lists and list items, using predefined or user defined plugin types and more.

anyVista can read complex hierarchical and clustered data structures and display them in beautiful tables. The data may be read from Ajax, inline code or indeed any data source, as long as it follows a certain flexible data format.

The library is very versatile and can be used for displaying/editing data in web pages as well as in mobile apps, with or without a database back-end. Can also be used as a Wordpress plugin.

Early versions of the library are already being used in both commercial and non-commercial projects - see screenshots below:

**Example 1: "Rulletour", a free online bicycle tournament:**

![alt text](https://raw.githubusercontent.com/arnemorken/anyvista/main/examples/sample_ss_rt.png)

**Example 2: "Acupedia", a commercial Android app for professional acupuncturists:**

![alt text](https://user-images.githubusercontent.com/16836060/200034825-2d2fef1b-1b25-413b-a587-4c0e810e0da0.png)

jsFiddle examples coming soon.

# Download

The library is currently in the last stages of development. Find it at Github: https://github.com/arnemorken/anyvista/.

**First beta release planned for December 2022.**

# Usage

1. Include the anyVista script and CSS files:

```html
<script src="/path/to/anyvista.js"></script>
<link  href="/path/to/anyvista.css" rel="stylesheet"/>
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
      foo_id  : { HEADER:"Id",          DISPLAY:0, TYPE:"label" },
      foo_name: { HEADER:"Message",     DISPLAY:1, TYPE:"label" },
      foo_desc: { HEADER:"Description", DISPLAY:1, TYPE:"text" },
    },
  },
};
```

6. Give the model and filters to a view, tell the view where to live and display:
```js
let my_view  = new anyView({
  model:   my_model,
  filters: my_filters,
  id:      "myview", // Id of div in which to display result
});
my_view.refresh();
```

As an alternative  to the last step, one could do this:
```js
$("#myview").anyView({
  model:   my_model,
  filters: my_filters,
  id:      "myview", // Id of div in which to display result
});
$("#myview").anyView("refresh");
```

The above will produce an output like this:

![alt text](https://raw.githubusercontent.com/arnemorken/anyvista/main/examples/hello_world/hello_list_uneditable.png)

To make the view editable, give the following extra option to the anyView constructor:
```js
  ...
  isEditable: true,
  ...
```

We will then get a view like this:

![alt text](https://raw.githubusercontent.com/arnemorken/anyvista/main/examples/hello_world/hello_list_editable.png)

# API

Coming soon.

# Improvements

Got an idea for improving anyVista? A cool new feature you'd like to see? Think you've found a bug? Contact us at software@balanse.info!
We love pull requests! 

# License

AGPLv3.0 for open source use or anyVista Commercial License for commercial use.

Get licences here: https://anyvista.balanse.info/license/ (coming soon).

# Donations

Donations are very welcome :)

[![Donate](https://www.paypalobjects.com/en_US/GB/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/donate/?hosted_button_id=EZGCG4XQER5KQ)

# Contact

Feature requests, ideas, bug reports: software@balanse.info

License and other commercial inquiries: license@balanse.info
