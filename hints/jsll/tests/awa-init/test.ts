import generateHTMLPage from 'hint/dist/src/lib/utils/misc/generate-html-page';
import { HintTest } from '@hint/utils-tests-helpers/dist/src/hint-test-type';
import * as hintRunner from '@hint/utils-tests-helpers/dist/src/hint-runner';

import { code, scriptWrapper } from '../helpers/common';

const hintName = 'jsll/awa-init';
const messages = {
    noInit: `JSLL is not initialized with "awa.init(config)" function in <head>. Initialization script should be placed immediately after JSLL script.`,
    notCallASAP: `"awa.init" is not called as soon as possible.`,
    notImmediateAfter: `The JSLL init script should be immediately following the JSLL script.`,
    notInHead: `The JSLL init script should be in <head>.`,
    undefinedConfig: `The variable passed to "awa.init" is not defined.`
};

const tests: Array<HintTest> = [
    {
        // Validate init should still run even if the JSLL script link is not included.
        name: `The JSLL script itself was not included`,
        reports: [{ message: messages.notImmediateAfter }],
        serverConfig: generateHTMLPage(`${scriptWrapper(null, code.notImmediateInithasFn, false)}`)
    },
    {
        name: `The script following JSLL script doesn't include code that initializes JSLL, and the spacer script has no function calls`,
        reports: [{ message: messages.notImmediateAfter }],
        serverConfig: generateHTMLPage(`${scriptWrapper(null, code.notImmediateInitNoFn)}`)
    },
    {
        name: `The script following JSLL script doesn't include code that initializes JSLL, and the spacer script has function calls`,
        reports: [{ message: messages.notImmediateAfter }],
        serverConfig: generateHTMLPage(`${scriptWrapper(null, code.notImmediateInithasFn)}`)
    },
    {
        name: `'window.awa.init' is called instead of 'awa.init', and called ASAP in the script`,
        serverConfig: generateHTMLPage(`${scriptWrapper(`var config=${JSON.stringify(code.perfectConfig)};`, 'window.awa.init(config);')}`)
    },
    {
        name: `'window.awa.init' is called instead of 'awa.init', but not called ASAP in the script`,
        reports: [{ message: messages.notCallASAP }],
        serverConfig: generateHTMLPage(`${scriptWrapper(`var config=${JSON.stringify(code.perfectConfig)};`, `console.log('adsf');window.awa.init({})`)}`)
    },
    {
        // <head>
        //      <script src="../jsll-4.js"></script>
        // </head>
        name: `The init script is not included, and no script tages are encountered after the JSLL script link`,
        reports: [{ message: messages.noInit }],
        serverConfig: generateHTMLPage(`${scriptWrapper(null, null, true)}`)
    },
    {
        // <head>
        //      <script src="../jsll-4.js"></script>
        //      <script>console.log('jsll')</script>
        // </head>
        name: `The init script is not included, and non-init script tages are encountered after the JSLL script link`,
        reports: [{ message: messages.noInit }],
        serverConfig: generateHTMLPage(`${scriptWrapper(null, `console.log('jsll')`, true)}`)
    },
    {
        name: `The init script is in <body> instead of <head>`,
        reports: [{ message: messages.noInit }, { message: messages.notInHead }],
        serverConfig: generateHTMLPage(code.jsllScript, `${scriptWrapper(null, code.emptyObjconfig)}`)
    },
    {
        name: `Both of the JSLL script and the init script are in <body> instead of <head>`,
        reports: [{ message: messages.noInit }, { message: messages.notInHead }],
        serverConfig: generateHTMLPage(null, `${scriptWrapper(null, code.emptyObjconfig)}`)
    },
    {
        name: `The init script is an external script and 'awa.init' is not called immediately`,
        reports: [{ message: messages.notCallASAP }],
        serverConfig: {
            '/': generateHTMLPage(`${code.jsllScript}<script src="init.js"></script>`),
            '/init.js': { content: `console.log('adsf');awa.init({})` }
        }
    },
    {
        name: '"config" is passed to "awa.init", but "config" is not defined',
        reports: [{ message: messages.undefinedConfig }],
        serverConfig: generateHTMLPage(`${scriptWrapper(null, code.initConfig)}`)
    }
];

hintRunner.testHint(hintName, tests, { parsers: ['javascript'] });
