import generateHTMLPage from 'hint/dist/src/lib/utils/misc/generate-html-page';
import { HintTest } from '@hint/utils-tests-helpers/dist/src/hint-test-type';
import * as hintRunner from '@hint/utils-tests-helpers/dist/src/hint-runner';

import { code, deleteProp, modifyConfigVal, scriptWrapper } from '../helpers/common';

const hintName = 'jsll/validate-config';
const messages = {
    invalidAppId: `The "appId" must be a non-empty string.`,
    invalidAutoCapture: `The "autoCapture" property is not a valid object.`,
    invalidCountryCode: `The "market" parameter contains invalid country code "oo".`,
    invalidLangCode: `The "market" parameter contains invalid language code "oo".`,
    invalidLineage: `"lineage" parameter is not set to true.`,
    invalidMarketValue: `The format of "market" parameter is not valid.`,
    invalidUseShortNameForContentBlob: `"useShortNameForContentBlob" parameter is not set to true.`,
    missingAppId: `appId is required but missing.`,
    missingAutoCapture: `autoCapture is required but missing.`,
    missingLineageAndScroll: `scroll, lineage are optional but missing.`,
    missingOptionalConfigProp: `useShortNameForContentBlob is optional but missing.`,
    missingPageName: `pageName is optional but missing.`,
    missingPageNameAndEnv: `pageName, env are optional but missing.`,
    missingRequiredConfigProps: `autoCapture, coreData are required but missing.`,
    missingUseShortNameForContentBlob: `useShortNameForContentBlob is optional but missing.`,
    noConfigArgs: `No config argument was passed to JSLL initialization function "awa.init".`
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

const tests: Array<HintTest> = [
    {
        name: `The JSLL script was not included, but the init script is present and the config is valid`,
        serverConfig: generateHTMLPage(`${scriptWrapper(`var config=${JSON.stringify(code.perfectConfig)};`, code.initConfig, false)}`)
    },
    {
        name: `The JSLL script was not included, but the init script is present and config is not valid`,
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
        reports: [{ message: messages.missingRequiredConfigProps }, { message: messages.missingUseShortNameForContentBlob }],
        serverConfig: {
            '/': generateHTMLPage(`${code.jsllScript}<script src="init.js"></script>`),
            '/init.js': { content: `console.log('adsf');${code.emptyObjconfig}` }
        }
    },
    {
        name: `"awa.init" has no arguments`,
        reports: [{ message: messages.noConfigArgs }],
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
        reports: [{ message: messages.invalidAutoCapture }, { message: messages.missingLineageAndScroll }],
        serverConfig: generateHTMLPage(`${scriptWrapper(modifyConfigVal('autoCapture', true), code.initConfig)}`)
    },
    {
        name: `"config" is an empty object`,
        reports: [{ message: messages.missingRequiredConfigProps }, { message: messages.missingUseShortNameForContentBlob }],
        serverConfig: generateHTMLPage(`${scriptWrapper(null, code.emptyObjconfig)}`)
    },
    {
        name: `"config" properties are strings instead of identifiers`,
        serverConfig: generateHTMLPage(`${scriptWrapper(`var config=${JSON.stringify(stringPropertyConfig)};`, code.initConfig)}`)
    },
    {
        name: `Both required and optional properties string literals`,
        reports: [{ message: messages.missingAppId }, { message: messages.missingPageNameAndEnv }],
        serverConfig: generateHTMLPage(`${scriptWrapper(deleteProp(['appId', 'pageName', 'env']), code.initConfig)}`)
    },
    {
        name: `"config" misses optional properties`,
        reports: [{ message: messages.missingOptionalConfigProp }],
        serverConfig: generateHTMLPage(`${scriptWrapper(deleteProp('useShortNameForContentBlob'), code.initConfig)}`)
    },
    {
        name: `"market" has an invalid value`,
        reports: [{ message: messages.invalidMarketValue }],
        serverConfig: generateHTMLPage(`${scriptWrapper(modifyConfigVal('market', 'market'), code.initConfig)}`)
    },
    {
        name: `"market" has an invalid lauguage/country code`,
        reports: [{ message: messages.invalidLangCode }, { message: messages.invalidCountryCode }],
        serverConfig: generateHTMLPage(`${scriptWrapper(modifyConfigVal('market', 'oo-oo'), code.initConfig)}`)
    },
    {
        name: `"pageName" is missing`,
        reports: [{ message: messages.missingPageName }],
        serverConfig: generateHTMLPage(`${scriptWrapper(deleteProp('pageName'), code.initConfig)}`)
    },
    {
        name: `"lineage" is not set as true`,
        reports: [{ message: messages.invalidLineage }],
        serverConfig: generateHTMLPage(`${scriptWrapper(modifyConfigVal('lineage', 1), code.initConfig)}`)
    },
    {
        name: `"useShortNameForContentBlob" is not set as true`,
        reports: [{ message: messages.invalidUseShortNameForContentBlob }],
        serverConfig: generateHTMLPage(`${scriptWrapper(modifyConfigVal('useShortNameForContentBlob', false), code.initConfig)}`)
    },
    {
        name: `"config" property values are computed`,
        reports: [{ message: messages.invalidLineage }, { message: messages.missingUseShortNameForContentBlob }],
        serverConfig: generateHTMLPage(`${scriptWrapper(code.calculatedConfig, code.initConfig)}`)
    },
    {
        name: `'window.awa.init' is called instead of 'awa.init', and the config is valid`,
        serverConfig: generateHTMLPage(`${scriptWrapper(`var config=${JSON.stringify(code.perfectConfig)};`, 'window.awa.init(config);')}`)
    },
    {
        name: `'window.awa.init' is called instead of 'awa.init', and the config is not valid`,
        reports: [{ message: messages.missingAppId }],
        serverConfig: generateHTMLPage(`${scriptWrapper(deleteProp('appId'), 'window.awa.init(config);')}`)
    }
];

hintRunner.testHint(hintName, tests, { parsers: ['javascript'] });
