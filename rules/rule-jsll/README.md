# jsll (`jsll`)

Validate the inclusion and initialization of the JSLL script.

## What does the rule check?

* Whether or not the JSLL script has been included.
  * If the script is inlcuded in `<head>`.
  * If the JSLL script is included before any other scripts.
  * If the script version is valid.
* Whether or not the JSLL init script has been included.
  * If the init script is placed immediately after the JSLL script.
  * If `awa.init` was used to initialize JSLL.
  * If `config` was defined.
  * Validate required properties.
  * Validate Optional properties.

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
        awa.init({});
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
        awa.init({});
    </script>
</head>
```
