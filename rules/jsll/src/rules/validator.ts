import * as validateCode from 'locale-code';
import { severityMatch, reportMissingProps } from './utils';

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
const validateCoreData = (property, eslintContext, severity: string) => {
    const coreDataValue = property.value;
    const report: boolean = config[severity].includes('coreData');

    if (report && coreDataValue.type !== types.object) {
        return eslintContext.report(coreDataValue, `The "coreData" property must be a valid object.`);
    }

    return validateNodeProps(coreData[severity], coreDataValue, severity, eslintContext); // eslint-disable-line typescript/no-use-before-define,no-use-before-define
};

/** Validate the 'autoCapture' property. */
const validateAutoCapture = (property, eslintContext, severity: string) => {
    const report: boolean = severityMatch(config, 'autoCapture', severity);
    const autoCaptureValue = property.value;

    if (report && autoCaptureValue.type !== types.object) {
        return eslintContext.report(autoCaptureValue, `The "autoCapture" property is not a valid object.`);
    }

    return validateNodeProps(autoCapture[severity], autoCaptureValue, severity, eslintContext); // eslint-disable-line typescript/no-use-before-define,no-use-before-define
};

/** Validate the 'useShortNameForContentBlob' property. */
const validateUseShortName = (property, eslintContext, severity: string) => {
    if (!severityMatch(config, 'useShortNameForContentBlob', severity)) {
        return;
    }

    const useShortNameValue = property.value;

    if (!useShortNameValue || useShortNameValue.value !== true) {
        eslintContext.report(property.value, `"useShortNameForContentBlob" parameter is not set to true.`);
    }
};

/** Validate the 'appId' property. */
const validateAppId = (property, eslintContext, severity: string) => {
    if (!severityMatch(coreData, 'appId', severity)) {
        return;
    }

    const id = property.value;

    if (id.type !== types.string || !id.value || !id.value.length) {
        eslintContext.report(property.value, `The "appId" must be a non-empty string.`);
    }
};

/** Validate the 'lineage' property. */
const validateLineage = (property, eslintContext, severity: string) => {
    if (!severityMatch(autoCapture, 'lineage', severity)) {
        return;
    }

    const lineageValue = property.value;

    if (!lineageValue || lineageValue.value !== true) {
        eslintContext.report(property.value, `"lineage" parameter is not set to true.`);
    }
};

/** Validate the 'market' property. */
const validateMarket = (property, eslintContext, severity: string) => {
    if (!severityMatch(coreData, 'market', severity)) {
        return;
    }

    const marketValue = property.value;

    if (!marketValue) {
        eslintContext.report(marketValue, `"market" parameter needs to be defined.`);

        return;
    }
    const regex: RegExp = /[a-z]*-[a-z]*/;

    if (!regex.test(marketValue.value)) {
        eslintContext.report(marketValue, `The format of "market" parameter is not valid.`);

        return;
    }

    const [languageCode, countryCode] = marketValue.value.split('-');
    const denormalizedCode: string = `${languageCode}-${countryCode.toUpperCase()}`;
    // The validator doesn't recognize lowercase country codes.

    if (!validateCode.validateLanguageCode(denormalizedCode)) {
        eslintContext.report(property.value, `The "market" parameter contains invalid language code "${languageCode}".`);
    }

    if (!validateCode.validateLanguageCode(denormalizedCode)) {
        eslintContext.report(property.value, `The "market" parameter contains invalid country code "${countryCode}".`);
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

/** Validate the initialization of JSLL using `awa.init(config)`. */
export const validateAwaInit = (node, eslintContext, report: boolean, isFirstExpression?: boolean) => {
    const expression = node.expression;
    const scope = eslintContext.getScope();
    const variables = scope.variables;
    const { callee } = expression;
    let configNode;
    const isNotInitCode = !callee || !callee.object || callee.object.name !== 'awa' || callee.property.name !== 'init';

    if (isNotInitCode) {
        if (isFirstExpression && report) {
            eslintContext.report(node, '"awa.init(config)" is not called as soon as possible.');
        }

        return null; // This line of code doesn't include `awa.init`, so not validate.
    }

    const initArgs = expression.arguments;

    if (initArgs.length < 1) {
        if (report) {
            eslintContext.report(node, `JSLL initialization function "awa.init(config)" missing required parameter "config".`);
        }

        return null;
    }

    if (initArgs.length > 1) {
        if (report) {
            eslintContext.report(node, `"init" arguments can't take more than one arguments.`);
        }

        return null;
    }

    const configVal = initArgs[0];

    if (!['Identifier', 'ObjectExpression'].includes(configVal.type)) {
        if (report) {
            eslintContext.report(configVal, `The argument of "awa.init" is not of type Object.`);
        }

        return null;
    }

    if (configVal.type === types.identifier) { // e.g., awa.init(config);
        const configDefinition = variables.find((variable) => {
            return variable.name === configVal.name;
        });

        if (!configDefinition) {
            if (report) {
                eslintContext.report(node, `${configVal.name} is not defined.`);
            }

            return null;
        }

        configNode = configDefinition.defs[0].node.init;

        if (configNode.type !== types.object) {
            if (report) {
                eslintContext.report(configNode, `${configDefinition.name} is not of type Object.`);
            }

            return null;
        }
    } else {
        configNode = configVal; // awa.init({...});
    }

    return configNode;
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
export const validateNodeProps = (expectedProps: Array<string>, target, severity: string, eslintContext) => { // eslint-disable-line consistent-return
    if (!expectedProps || !expectedProps.length) {
        return;
    }

    const properties = target.properties;
    const existingProps = [];

    properties.forEach((property) => {
        const key = property.key.name || property.key.value;

        const validator = validators[key];

        if (validator) {
            validator(property, eslintContext, severity);
        }
        existingProps.push(key);

    });
    reportMissingProps(expectedProps, existingProps, severity, target, eslintContext);
};

export const configProps = {
    autoCapture,
    config,
    coreData,
    types
};
