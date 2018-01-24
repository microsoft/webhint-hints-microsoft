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
        name: `The JSLL script itself was not included and the config is valid`,
        serverConfig: generateHTMLPage(`${scriptWrapper(`var config=${JSON.stringify(code.perfectConfig)};`, code.initConfig, false)}`)
    },
    {
        name: `The JSLL script itself was not included but the config is not valid`,
        reports: [{ message: messages.missingAppId }],
        serverConfig: generateHTMLPage(`${scriptWrapper(deleteProp('appId'), code.initConfig, false)}`)
    },
    {
        name: `The init code is not the first expression statement in the init script`,
        reports: [{ message: messages.missingAppId }],
        serverConfig: generateHTMLPage(`${scriptWrapper(deleteProp('appId'), `console.log('jsll');${code.initConfig}`)}`)
    },
    {
        name: `The config code is not the first variable defined in the init script`,
        reports: [{ message: messages.missingAppId }],
        serverConfig: generateHTMLPage(`${scriptWrapper(`var a = 1;${deleteProp('appId')}`, `${code.initConfig}`)}`)
    },
    {
        name: `The init script is an external script and the config is not valid'`,
        reports: [{ message: messages.missingRequiredConfigProps }],
        serverConfig: {
            '/': generateHTMLPage(`${code.jsllScript}<script src="init.js"></script>`),
            '/init.js': { content: `console.log('adsf');${code.emptyObjconfig}` }
        }
    },
    {
        name: `"awa.init" doesn't have the required parameter "config"`,
        serverConfig: generateHTMLPage(`${scriptWrapper(null, code.noConfigArgs)}`)
    },
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
