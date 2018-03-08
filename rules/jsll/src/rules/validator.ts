import * as validateCode from 'locale-code';
import { isObject, severityMatch, getMissingProps, pluralizedVerb } from './utils';

/** List of types in the parsed Javascript. */
const types = {
    identifier: 'Identifier',
    object: 'ObjectExpression',
    string: 'Literal'
};

/** Optional and required properties of 'config'. */
const config = {
    optional: ['useShortNameForContentBlob'],
    required: ['autoCapture', 'coreData']
};

/** Optional and required properties of 'coreData'. */
const coreData = {
    optional: ['pageName', 'pageType', 'env', 'market'],
    required: ['appId']
};

/** Optional properties of 'autoCapture'. */
const autoCapture = { optional: ['scroll', 'lineage'] };

/** Validate the 'coreData' property. */
const validateCoreData = (propValue, reports: Array<string>, severity: string) => {
    const coreDataValue = propValue;
    const report: boolean = config[severity].includes('coreData');

    if (report && !isObject(propValue)) {
        return reports.push(`The "coreData" property must be a valid object.`);
    }

    return validateNodeProps(coreData[severity], coreDataValue, severity, reports); // eslint-disable-line typescript/no-use-before-define,no-use-before-define
};

/** Validate the 'autoCapture' property. */
const validateAutoCapture = (propValue, reports: Array<string>, severity: string) => {
    const report: boolean = severityMatch(config, 'autoCapture', severity);
    const autoCaptureValue = propValue;

    if (report && !isObject(propValue)) {
        reports.push(`The "autoCapture" property is not a valid object.`);
    }

    return validateNodeProps(autoCapture[severity], autoCaptureValue, severity, reports); // eslint-disable-line typescript/no-use-before-define,no-use-before-define
};

/** Validate the 'useShortNameForContentBlob' property. */
const validateUseShortName = (useShortNameValue, reports: Array<string>, severity: string) => {
    if (!severityMatch(config, 'useShortNameForContentBlob', severity)) {
        return;
    }

    if (!useShortNameValue || useShortNameValue !== true) {
        reports.push(`"useShortNameForContentBlob" parameter is not set to true.`);
    }
};

/** Validate the 'appId' property. */
const validateAppId = (propValue, reports: Array<string>, severity: string) => {
    if (!severityMatch(coreData, 'appId', severity)) {
        return;
    }

    if (!propValue || typeof propValue !== 'string' || !propValue.length) {
        reports.push(`The "appId" must be a non-empty string.`);
    }
};

/** Validate the 'lineage' property. */
const validateLineage = (propValue, reports: Array<string>, severity: string) => {
    if (!severityMatch(autoCapture, 'lineage', severity)) {
        return;
    }

    const lineageValue = propValue;

    if (!lineageValue || lineageValue !== true) {
        reports.push(`"lineage" parameter is not set to true.`);
    }
};

/** Validate the 'market' property. */
const validateMarket = (propValue, reports: Array<string>, severity: string) => {
    if (!severityMatch(coreData, 'market', severity)) {
        return;
    }

    const marketValue = propValue;

    if (!marketValue) {
        reports.push(`"market" parameter needs to be defined.`);

        return;
    }
    const regex: RegExp = /[a-z]*-[a-z]*/;

    if (!regex.test(marketValue)) {
        reports.push(`The format of "market" parameter is not valid.`);

        return;
    }

    const [languageCode, countryCode] = marketValue.split('-');
    const denormalizedCode: string = `${languageCode}-${countryCode.toUpperCase()}`;
    // The validator doesn't recognize lowercase country codes.

    if (!validateCode.validateLanguageCode(denormalizedCode)) {
        reports.push(`The "market" parameter contains invalid language code "${languageCode}".`);
    }

    if (!validateCode.validateLanguageCode(denormalizedCode)) {
        reports.push(`The "market" parameter contains invalid country code "${countryCode}".`);
    }
};

/** Guess if a script is a JSLL init script. */
export const isPotentialInitScript = (sourceCode) => {
    const regex = /awa.init\([{*[\s\S]*?}*\)/i;
    // Pass:
    // awa.init(config)
    // awa.init(config1)
    // awa.init({ id: 1, name: {} })
    // awa.init({})
    // Fail:
    // awa.init=function()...

    return regex.test(sourceCode.text);
};

/** List of validators. */
const validators = {
    appId: validateAppId,
    autoCapture: validateAutoCapture,
    coreData: validateCoreData,
    lineage: validateLineage,
    market: validateMarket,
    useShortNameForContentBlob: validateUseShortName
};

/** Validate properties of the current node based on severity. */
export const validateNodeProps = (expectedProps: Array<string>, node, severity: string, reports: Array<string>) => {
    if (!expectedProps || !expectedProps.length) {
        return;
    }

    const properties = Object.keys(node);

    properties.forEach((property) => {
        const validator = validators[property];

        if (validator) {
            validator(node[property], reports, severity);
        }
    });

    const missingProps = getMissingProps(expectedProps, properties);

    if (missingProps.length) {
        reports.push(`${missingProps.join(', ')} ${pluralizedVerb(missingProps)} ${severity} but missing.`);
    }
};

/** Tell if a 'config' variable passed to 'awa.init' is defined. */
export const configIsDefined = (node, eslintContext) => {
    const expression = node.expression;
    const scope = eslintContext.getScope();
    const variables = scope.variables;
    const initArgs = expression.arguments;

    if (!initArgs) {
        return true;
    }

    const configVal = initArgs[0];

    if (configVal.type === types.identifier) { // e.g., awa.init(config);
        // Look for the definition of the 'config' variable.
        const configDefinition = variables.find((variable) => {
            return variable.name === configVal.name;
        });

        return !!configDefinition;
    }

    return true;
};

export const configProps = {
    autoCapture,
    config,
    coreData,
    types
};
