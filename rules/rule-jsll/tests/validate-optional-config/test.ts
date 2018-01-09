import { generateHTMLPage } from 'sonarwhal/dist/tests/helpers/misc';
import { getRuleName } from 'sonarwhal/dist/src/lib/utils/rule-helpers';
import { IRuleTest } from 'sonarwhal/dist/tests/helpers/rule-test-type';
import * as ruleRunner from 'sonarwhal/dist/tests/helpers/rule-runner';
import * as _ from 'lodash';

import { code, perfectConfig, deleteProp, modifyConfigVal, scriptWrapper } from '../common';

const ruleName = getRuleName(__dirname);

const messages = {
    invalidCountryCode: `The "market" parameter contains invalid country code "oo".`,
    invalidLangCode: `The "market" parameter contains invalid language code "oo".`,
    invalidLineage: `"lineage" parameter is not set to true.`,
    invalidMarketValue: `The format of "market" parameter is not valid.`,
    invalidUseShortNameForContentBlob: `"useShortNameForContentBlob" parameter is not set to true.`,
    missingLineage: `lineage" parameter is not set to true.`,
    missingPageNameAndEnv: `pageName, env are optional but missing.`,
    missingOptionalConfigProp: `useShortNameForContentBlob is optional but missing.`,
    missingPageName: `pageName is optional but missing.`,
    missingUseShortNameForContentBlob: `useShortNameForContentBlob is optional but missing.`,
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
        name: `"awa.init" doesn't have any arguments`,
        serverConfig: generateHTMLPage(`${scriptWrapper(null, code.noConfigArgs)}`)
    },
    // All the tests beyond this point should pass, because they will be reported in rule `validate-awa-init`.
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
