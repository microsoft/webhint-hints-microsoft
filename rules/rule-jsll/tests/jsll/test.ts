import { generateHTMLPage } from 'sonarwhal/dist/tests/helpers/misc';
import { getRuleName } from 'sonarwhal/dist/src/lib/utils/rule-helpers';
import { IRuleTest } from 'sonarwhal/dist/tests/helpers/rule-test-type';
import * as ruleRunner from 'sonarwhal/dist/tests/helpers/rule-runner';
import * as _ from 'lodash';

const ruleName = getRuleName(__dirname);

/*
 * You should test for cases where the rule passes and doesn't.
 * More information about how `ruleRunner` can be configured is
 * available in:
 * https://sonarwhal.com/docs/contributor-guide/rules/#howtotestarule
 */
const perfectConfig = {
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

const jsllScript = `<script src="https://az725175.vo.msecnd.net/scripts/jsll-4.js" type="text/javascript"></script>`;
const noInit = `console.log('"awa.init" is not called.')`;
const noInitNoFnCall = `var a=0;`;
const noConfig = `awa.init();`;
const initConfig = `awa.init(config);`;

const messages = {
    invalidAppId: `The "appId" must be a non-empty string.`,
    invalidCountryCode: `The "market" parameter contains invalid country code "oo".`,
    invalidLangCode: `The "market" parameter contains invalid language code "oo".`,
    invalidLineage: `"lineage" parameter is not set to true.`,
    invalidMarketValue: `The format of "market" parameter is not valid.`,
    missingAppId: `appId is required but missing.`,
    missingLineage: `lineage" parameter is not set to true.`,
    missingOptionalConfigProp: `useShortNameForContentBlob is optional but missing.`,
    missingPageName: `pageName is optional but missing.`,
    missingRequiredConfigProps: `autoCapture is required but missing.`,
    missingUseShortNameForContentBlob: `"useShortNameForContentBlob" parameter is not set to true.`,
    noConfig: `JSLL initialization function "awa.init(config)" missing required parameter "config".`,
    noInit: `JSLL is never initialized with "awa.init(config)" function.`
};

const scriptWrapper = (config, initCode, includeJSLLScript = true) => {
    return `${includeJSLLScript ? jsllScript : ''}<script>${config || ''}${initCode || ''}</script>`;
};

const modifyValue = (obj, targetProp, targetValue) => {
    if (!(obj instanceof Object) || Array.isArray(obj)) {
        return;
    }

    const isDelete = targetValue === null;

    if (obj.hasOwnProperty(targetProp)) {
        if (isDelete) {
            delete obj[targetProp];
        } else {
            obj[targetProp] = targetValue;
        }
    } else {
        const props = Object.keys(obj);

        props.forEach((childProp) => {
            modifyValue(obj[childProp], targetProp, targetValue);
        });
    }
};

const deleteProp = (prop) => {
    const missiongPropConfig = _.cloneDeep(perfectConfig);

    modifyValue(missiongPropConfig, prop, null);

    return `var config=${JSON.stringify(missiongPropConfig)};`;
};

const modifyConfigVal = (targetProp, targetValue) => {
    const modifiedConfig = _.cloneDeep(perfectConfig);

    modifyValue(modifiedConfig, targetProp, targetValue);

    return `var config=${JSON.stringify(modifiedConfig)};`;
};

const tests: Array<IRuleTest> = [
    {
        // Validate init shouldn't run if the JSLL script link is not included.
        name: `The JSLL script itself was not included`,
        serverConfig: generateHTMLPage(`${scriptWrapper(null, noInit, false)}`)
    },
    {
        name: `The script following JSLL script doesn't include code that initializes JSLL`,
        reports: [{ message: messages.noInit }],
        serverConfig: generateHTMLPage(`${scriptWrapper(null, noInit)}`)
    },
    {
        name: `The script following JSLL script doesn't include code that initializes JSLL and doesn't contain an expression statement`,
        reports: [{ message: messages.noInit }],
        serverConfig: generateHTMLPage(`${scriptWrapper(null, noInitNoFnCall)}`)
    },
    {
        name: `"awa.init" doesn't have any arguments`,
        reports: [{ message: messages.noConfig }],
        serverConfig: generateHTMLPage(`${scriptWrapper(null, noConfig)}`)
    },
    {
        name: `"config" misses required properties`,
        reports: [{ message: messages.missingRequiredConfigProps }],
        serverConfig: generateHTMLPage(`${scriptWrapper(deleteProp('autoCapture'), initConfig)}`)
    },
    {
        name: `"config" misses optional properties`,
        reports: [{ message: messages.missingOptionalConfigProp }],
        serverConfig: generateHTMLPage(`${scriptWrapper(deleteProp('useShortNameForContentBlob'), initConfig)}`)
    },
    {
        name: `"market" has an invalid value`,
        reports: [{ message: messages.invalidMarketValue }],
        serverConfig: generateHTMLPage(`${scriptWrapper(modifyConfigVal('market', 'market'), initConfig)}`)
    },
    {
        name: `"market" has an invalid lauguage/country code`,
        reports: [{ message: messages.invalidLangCode }, { message: messages.invalidCountryCode }],
        serverConfig: generateHTMLPage(`${scriptWrapper(modifyConfigVal('market', 'oo-oo'), initConfig)}`)
    },
    {
        name: `"appId" is missing`,
        reports: [{ message: messages.missingAppId }],
        serverConfig: generateHTMLPage(`${scriptWrapper(deleteProp('appId'), initConfig)}`)
    },
    {
        name: `"appId" is not a string`,
        reports: [{ message: messages.invalidAppId }],
        serverConfig: generateHTMLPage(`${scriptWrapper(modifyConfigVal('appId', 1), initConfig)}`)
    },
    {
        name: `"pageName" is missing`,
        reports: [{ message: messages.missingPageName }],
        serverConfig: generateHTMLPage(`${scriptWrapper(deleteProp('pageName'), initConfig)}`)
    },
    {
        name: `"lineage" is not set as true`,
        reports: [{ message: messages.invalidLineage }],
        serverConfig: generateHTMLPage(`${scriptWrapper(modifyConfigVal('lineage', 1), initConfig)}`)
    },
    {
        name: `"useShortNameForContentBlob" is not set as true`,
        reports: [{ message: messages.missingUseShortNameForContentBlob }],
        serverConfig: generateHTMLPage(`${scriptWrapper(modifyConfigVal('useShortNameForContentBlob', false), initConfig)}`)
    }
];

ruleRunner.testRule(ruleName, tests, { parsers: ['javascript'] });
