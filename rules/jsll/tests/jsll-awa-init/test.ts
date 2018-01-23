import { generateHTMLPage } from 'sonarwhal/dist/tests/helpers/misc';
import { getRuleName } from 'sonarwhal/dist/src/lib/utils/rule-helpers';
import { IRuleTest } from 'sonarwhal/dist/tests/helpers/rule-test-type';
import * as ruleRunner from 'sonarwhal/dist/tests/helpers/rule-runner';

import { code, scriptWrapper } from '../helpers/common';

const ruleName = getRuleName(__dirname);
const messages = {
    noConfigArgs: `JSLL initialization function "awa.init(config)" missing required parameter "config".`,
    noInit: `JSLL is not initialized with "awa.init(config)" function. Initialization script should be placed immediately after JSLL script.`
};

const tests: Array<IRuleTest> = [
    {
        // Validate init shouldn't run if the JSLL script link is not included.
        name: `The JSLL script itself was not included`,
        serverConfig: generateHTMLPage(`${scriptWrapper(null, code.notImmediateInithasFn, false)}`)
    },
    {
        name: `The script following JSLL script doesn't include code that initializes JSLL, and the spacer script has no function calls`,
        reports: [{ message: messages.noInit }],
        serverConfig: generateHTMLPage(`${scriptWrapper(null, code.notImmediateInitNoFn)}`)
    },
    {
        name: `The script following JSLL script doesn't include code that initializes JSLL, and the spacer script has function calls`,
        reports: [{ message: messages.noInit }],
        serverConfig: generateHTMLPage(`${scriptWrapper(null, code.notImmediateInithasFn)}`)
    },
    {
        name: `The init script is in <body> instead of <head>`,
        reports: [{ message: messages.noInit }],
        serverConfig: generateHTMLPage(code.jsllScript, `${scriptWrapper(null, code.emptyObjconfig)}`)
    },
    {
        name: `"awa.init" doesn't have the required parameter "config"`,
        reports: [{ message: messages.noConfigArgs }],
        serverConfig: generateHTMLPage(`${scriptWrapper(null, code.noConfigArgs)}`)
    },
    {
        name: `"awa.init" has an empty object as config parameter`,
        serverConfig: generateHTMLPage(`${scriptWrapper(null, code.emptyObjconfig)}`)
    },
    {
        // <head>
        //      <script src="../jsll-4.js"></script>
        // </head>
        name: `No script tages are encountered after the JSLL script link`,
        reports: [{ message: messages.noInit }],
        serverConfig: generateHTMLPage(`${scriptWrapper(null, null, true)}`)
    }
];

ruleRunner.testRule(ruleName, tests, { parsers: ['javascript'] });
