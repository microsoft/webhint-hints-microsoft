# jsll (`jsll`)

Validate the inclusion and initialization of the JSLL script via
multiple related rules.

## What does the rule check?

JSLL is the analytics library used by Microsoft. This package
contains the following rules:

* `jsll-script-included`
* `jsll-awa-init`
* `jsll-validate-config`

These rules test the following:

* Whether or not the JSLL script has been included.
  * If the script is inlcuded in `<head>`.
  * If the JSLL script is included before any other scripts.
  * If the script version is valid.
* Whether or not the JSLL init script has been included.
  * If the init script is in `<head>`.
  * If the init script is placed immediately after the JSLL script.
  * If `awa.init` is called to initialize JSLL.
  * If `awa.init` is called as early as possible in the init script.
* Whether or not the `config` variable is valid.
  * If `config` passed to `awa.init` is defined.
  * Validate the required properties in `config`.
  * Validate Optional properties in `config`.

### Examples that **trigger** the rule

The JSLL script was not included

```html
<head>
    ...
</head>
```

The JSLL init script was not included.

```html
<head>
    <script src="https://az725175.vo.msecnd.net/scripts/jsll-4.js" type="text/javascript"></script>
</head>
```

The JSLL init script doesn't follow the JSLL script immediately.

```html
<head>
    <script src="https://az725175.vo.msecnd.net/scripts/jsll-4.js" type="text/javascript"></script>
    <script>var a = 1;</script>
    <script>
        config = {...};
        awa.init(config);
    </script>
</head>
```

Required/Optional Properties are missing in `config`.

```html
<head>
    <script src="https://az725175.vo.msecnd.net/scripts/jsll-4.js" type="text/javascript"></script>
    <script>
        awa.init({});
    </script>
</head>
```

Invalid required/optional properties.

```html
<head>
    <script src="https://az725175.vo.msecnd.net/scripts/jsll-4.js" type="text/javascript"></script>
    <script>
        var config = {
                autoCapture: true // invalid type
            coreData: {
                appId: 'YourAppId',
                env: 'env',
                market: 'oo-oo', // invalid code
                pageName: 'name',
                pageType: 'type'
            },
            useShortNameForContentBlob: true
        };
        awa.init(config);
    </script>
</head>
```

### Examples that **pass** the rule

```html
<head>
    <script src="https://az725175.vo.msecnd.net/scripts/jsll-4.js" type="text/javascript"></script>
    <script>
        var config = {
                autoCapture: {
                lineage: true,
                scroll: true
            },
            coreData: {
                appId: 'YourAppId',
                env: 'env',
                market: 'en-us',
                pageName: 'name',
                pageType: 'type'
            },
            useShortNameForContentBlob: true
        };
        awa.init(config);
    </script>
</head>
```

### How the rule works

* `jsll-script-included` uses two variables `totalHeadScriptCount` and
  `jsllScriptCount` to keep track of the total number of script tags and the
  number of jsll script tags in head during traversal. `jsllScriptCount` is used
  to report the absence/redundancy of the jsll api links. And by comparing the
  value of the two variables, it validates the location of the JSLL api link
  relative to other script tags in `head`.

* `jsll-awa-init` uses a central state machine `currentState` to keep track of
  the current traversal location. It starts from `start` in the beginning of a
  scan and switches between six alternative values: `head`, `apiHead`,
  `headOtherScript`, `body`, `apiBody`, `bodyOtherScript`. State is only updated
  **after** the DOM traversal starts and the value is changed upon the events as
  follows.

  * Entering `head` element: `head`
  * Entering the JSLL script in the `head` element: `apiHead`
  * Parsing a non-JSLL script in the `head` element: `headOtherScript`
  * Entering `body` element: `body`
  * Entering the JSLL script in the `body` element: `apiBody`
  * Parsing a non-JSLL script in the `body` element: `bodyOtherScript`

  Notably, when the init script is included in an **external** script, the init
  script is parsed before the DOM traversal starts when using the `chrome`
  connector. In this scenario, we save the script in a variable `tempInit` and
  validate later after the traversal starts so that the central state machine
  reflects the correct location information.

* `jsll-validate-config` stubs the `init` function to expose the `config`
  variable passed into the `init` function when running the init script. The
  required and optional properties of the `config` variable is validated.
