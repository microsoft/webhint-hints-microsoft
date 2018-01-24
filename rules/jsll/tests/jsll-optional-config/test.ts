import { generateHTMLPage } from 'sonarwhal/dist/tests/helpers/misc';
import { getRuleName } from 'sonarwhal/dist/src/lib/utils/rule-helpers';
import { IRuleTest } from 'sonarwhal/dist/tests/helpers/rule-test-type';
import * as ruleRunner from 'sonarwhal/dist/tests/helpers/rule-runner';

import { code, deleteProp, modifyConfigVal, scriptWrapper } from '../helpers/common';

const ruleName = getRuleName(__dirname);

const messages = {
    invalidCountryCode: `The "market" parameter contains invalid country code "oo".`,
    invalidLangCode: `The "market" parameter contains invalid language code "oo".`,
    invalidLineage: `"lineage" parameter is not set to true.`,
    invalidMarketValue: `The format of "market" parameter is not valid.`,
    invalidUseShortNameForContentBlob: `"useShortNameForContentBlob" parameter is not set to true.`,
    missingLineage: `lineage" parameter is not set to true.`,
    missingOptionalConfigProp: `useShortNameForContentBlob is optional but missing.`,
    missingPageName: `pageName is optional but missing.`,
    missingPageNameAndEnv: `pageName, env are optional but missing.`,
    missingUseShortNameForContentBlob: `useShortNameForContentBlob is optional but missing.`
};

const tests: Array<IRuleTest> = [
    {
        name: `The JSLL script itself was not included and the config is valid`,
        serverConfig: generateHTMLPage(`${scriptWrapper(`var config=${JSON.stringify(code.perfectConfig)};`, code.initConfig, false)}`)
    },
    {
        name: `The JSLL script itself was not included but the config is not valid`,
        reports: [{ message: messages.missingPageName }],
        serverConfig: generateHTMLPage(`${scriptWrapper(deleteProp('pageName'), code.initConfig, false)}`)
    },
    {
        name: `The init code is not the first expression statement in the init script`,
        reports: [{ message: messages.missingPageName }],
        serverConfig: generateHTMLPage(`${scriptWrapper(deleteProp('pageName'), `console.log('jsll');${code.initConfig}`)}`)
    },
    {
        name: `The config code is not the first variable defined in the init script`,
        reports: [{ message: messages.missingPageName }],
        serverConfig: generateHTMLPage(`${scriptWrapper(`var a = 1;${deleteProp('pageName')}`, `${code.initConfig}`)}`)
    },
    {
        name: `The init script is an external script and the config is not valid'`,
        reports: [{ message: messages.missingUseShortNameForContentBlob }],
        serverConfig: {
            '/': generateHTMLPage(`${code.jsllScript}<script src="init.js"></script>`),
            '/init.js': { content: `console.log('adsf');${code.emptyObjconfig}` }
        }
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
        name: `"pageName" is missing`, // optional child property (pageName) of a required parent property (coreData)
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
        name: `"config" is an empty object`,
        reports: [{ message: messages.missingUseShortNameForContentBlob }],
        serverConfig: generateHTMLPage(`${scriptWrapper(null, code.emptyObjconfig)}`)
    },
    {
        name: `Both required and optional properties are missing in "config"`,
        reports: [{ message: messages.missingPageNameAndEnv }],
        serverConfig: generateHTMLPage(`${scriptWrapper(deleteProp(['appId', 'pageName', 'env']), code.initConfig)}`)
    }
];

ruleRunner.testRule(ruleName, tests, { parsers: ['javascript'] });
