# chisel (`chisel`)

Use Chisel to assess the accessibility of a web site or web application.

## Can the rule be configured?

Yes, you can configure this rule in your `sonarwhal` configuration file as
follows:

```json
    "rules": {
        "chisel": ["warning", { "testsToRun": "color-contrast"}]
    }
```

The available parameters include:

* `testsToRun?`: `string[]` - (Optional) Used to set the rules that will be run
    in chisel test run.

* `dom?`: `NodeSelector & Node | NodeList` - (Optional) Used to set the elements
    that will be tested; defaults to document if dom, selector, and
    include/exclude are not set.

* `selector?`: `string` - (Optional) Uses selector to get the elements that will
    be tested; ignored if dom is set.

* `include?`: `string[]` - (Optional) Uses an array of selectors to get the
    elements that will be tested and can be used with exclude; ignored if dom or
    selector are set.

* `exclude?`: `string[]` - (Optional) Uses an array of selectors to get the
    elements that will not be tested and can be used with include; ignored if
    dom or selector are set.

* `enableBestPracticeRules?`: `boolean` - (Optional, default is `false`) Enables
    rule that are not mapped to MAS/considered best practice; default is false
    and ignored if testsToRun is set.
