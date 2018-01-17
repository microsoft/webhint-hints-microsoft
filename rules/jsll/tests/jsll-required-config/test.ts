import { generateHTMLPage } from 'sonarwhal/dist/tests/helpers/misc';
import { getRuleName } from 'sonarwhal/dist/src/lib/utils/rule-helpers';
import { IRuleTest } from 'sonarwhal/dist/tests/helpers/rule-test-type';
import * as ruleRunner from 'sonarwhal/dist/tests/helpers/rule-runner';

import { code, deleteProp, modifyConfigVal, scriptWrapper } from '../helpers/common';

const ruleName = getRuleName(__dirname);
const messages = {
    invalidAppId: `The "appId" must be a non-empty string.`,
    invalidAutoCapture: `The "autoCapture" property is not a valid object.`,
    missingAppId: `appId is required but missing.`,
    missingAutoCapture: `autoCapture is required but missing.`,
    missingRequiredConfigProps: `autoCapture, coreData are required but missing.`
};
const stringPropertyConfig = {
    'autoCapture': { // eslint-disable-line quote-props
        lineage: true,
        scroll: true
    },
    coreData: {
        'appId': '1', // eslint-disable-line quote-props
        env: 'env',
        market: 'en-us',
        pageName: 'name',
        pageType: 'type'
    },
    useShortNameForContentBlob: true
};

const tests: Array<IRuleTest> = [
    {
        // Validate init shouldn't run if the JSLL script link is not included.
        name: `The JSLL script itself was not included`,
        serverConfig: generateHTMLPage(`${scriptWrapper(null, code.notImmediateInithasFn, false)}`)
    },
    {
        name: `The script following JSLL script doesn't include code that initializes JSLL, and the spacer script has no function calls`,
        serverConfig: generateHTMLPage(`${scriptWrapper(null, code.notImmediateInitNoFn)}`)
    },
    {
        name: `The script following JSLL script doesn't include code that initializes JSLL, and the spacer script has function calls`,
        serverConfig: generateHTMLPage(`${scriptWrapper(null, code.notImmediateInithasFn)}`)
    },
    {
        name: `"awa.init" doesn't have the required parameter "config"`,
        serverConfig: generateHTMLPage(`${scriptWrapper(null, code.noConfigArgs)}`)
    },
    // All the tests beyond this point should pass, because they will be reported in rule `jsll-awa-init`.
    {
        name: `"config" misses required properties "autoCapture"`,
        reports: [{ message: messages.missingAutoCapture }],
        serverConfig: generateHTMLPage(`${scriptWrapper(deleteProp('autoCapture'), code.initConfig)}`)
    },
    {
        name: `"appId" is missing`,
        reports: [{ message: messages.missingAppId }],
        serverConfig: generateHTMLPage(`${scriptWrapper(deleteProp('appId'), code.initConfig)}`)
    },
    {
        name: `"appId" is not a string`,
        reports: [{ message: messages.invalidAppId }],
        serverConfig: generateHTMLPage(`${scriptWrapper(modifyConfigVal('appId', 1), code.initConfig)}`)
    },
    {
        name: `"autoCapture" is not a valid object`,
        reports: [{ message: messages.invalidAutoCapture }],
        serverConfig: generateHTMLPage(`${scriptWrapper(modifyConfigVal('autoCapture', true), code.initConfig)}`)
    },
    {
        name: `"config" is an empty object`,
        reports: [{ message: messages.missingRequiredConfigProps }],
        serverConfig: generateHTMLPage(`${scriptWrapper(null, code.emptyObjconfig)}`)
    },
    {
        name: `"config" properties are strings instead of identifiers`,
        serverConfig: generateHTMLPage(`${scriptWrapper(`var config=${JSON.stringify(stringPropertyConfig)};`, code.initConfig)}`)
    },
    {
        name: `Both required and optional properties are missing in "config"`,
        reports: [{ message: messages.missingAppId }],
        serverConfig: generateHTMLPage(`${scriptWrapper(deleteProp(['appId', 'pageName', 'env']), code.initConfig)}`)
    }
];

ruleRunner.testRule(ruleName, tests, { parsers: ['javascript'] });
