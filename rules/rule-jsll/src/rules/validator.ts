import * as validateCode from 'locale-code';
import { severityMatch, reportMissingProps } from './utils';

const types = {
    identifier: 'Identifier',
    object: 'ObjectExpression',
    string: 'Literal'
};

const config = {
    optional: ['useShortNameForContentBlob'],
    required: ['autoCapture', 'coreData']
};

const coreData = {
    optional: ['pageName', 'pageType', 'env', 'market'],
    required: ['appId']
};

const autoCapture = { optional: ['scroll', 'lineage'] };

const validateCoreData = (property, eslintContext, severity) => {
    const value = property.value;
    const report = config[severity].includes('coreData');

    if (report && value.type !== types.object) {
        return eslintContext.report(value, `The "coreData" property must be a valid object.`);
    }

    return validateNodeProps(coreData[severity], value, severity, eslintContext); // eslint-disable-line typescript/no-use-before-define,no-use-before-define
};

const validateAutoCapture = (property, eslintContext, severity) => {
    const report = severityMatch(config, 'autoCapture', severity);
    const autoCaptureValue = property.value;

    if (report && autoCaptureValue.type !== types.object) {
        return eslintContext.report(autoCaptureValue, `The "autoCapture" property is not a valid object.`)
    }

    return validateNodeProps(autoCapture[severity], autoCaptureValue, severity, eslintContext); // eslint-disable-line typescript/no-use-before-define,no-use-before-define
};

const validateUseShortName = (property, eslintContext, severity) => {
    if (!severityMatch(config, 'useShortNameForContentBlob', severity)) {
        return;
    }

    const useShortNameValue = property.value;

    if (!useShortNameValue || useShortNameValue.value !== true) {
        eslintContext.report(property.value, `"useShortNameForContentBlob" parameter is not set to true.`);
    }
};

const validateAppId = (property, eslintContext, severity) => {
    if (!severityMatch(coreData, 'appId', severity)) {
        return;
    }

    const id = property.value;

    if (id.type !== types.string || !id.value || !id.value.length) {
        eslintContext.report(property.value, `The "appId" must be a non-empty string.`);
    }
};

const validateLineage = (property, eslintContext, severity) => {
    if (!severityMatch(autoCapture, 'lineage', severity)) {
        return;
    }

    const lineageValue = property.value;

    if (!lineageValue || lineageValue.value !== true) {
        eslintContext.report(property.value, `"lineage" parameter is not set to true.`);
    }
};

const validateMarket = (property, eslintContext, severity) => {
    if (!severityMatch(coreData, 'market', severity)) {
        return;
    }

    const marketValue = property.value;

    if (!marketValue) {
        eslintContext.report(marketValue, `"market" parameter needs to be defined.`);

        return;
    }
    const regex = /[a-z]*-[a-z]*/;

    if (!regex.test(marketValue.value)) {
        eslintContext.report(marketValue, `The format of "market" parameter is not valid.`);

        return;
    }

    const [languageCode, countryCode] = marketValue.value.split('-');
    const denormalizedCode = `${languageCode}-${countryCode.toUpperCase()}`;
    // The validator doesn't recognize lowercase country codes.

    if (!validateCode.validateLanguageCode(denormalizedCode)) {
        eslintContext.report(property.value, `The "market" parameter contains invalid language code "${languageCode}".`);
    }

    if (!validateCode.validateLanguageCode(denormalizedCode)) {
        eslintContext.report(property.value, `The "market" parameter contains invalid country code "${countryCode}".`);
    }
};

export const validateAwaInit = (node, eslintContext, report) => {
    const expression = node.expression;
    const scope = eslintContext.getScope();
    const variables = scope.variables;
    const { callee } = expression;
    let configNode;

    if (!callee || !callee.object || callee.object.name !== 'awa' || callee.property.name !== 'init') {
        report && eslintContext.report(node, 'JSLL is not initialized with "awa.init(config)" function. Initialization script should be placed immediately after JSLL script.');

        return;
    }

    const initArgs = expression.arguments;

    if (initArgs.length < 1) {
        report && eslintContext.report(node, `JSLL initialization function "awa.init(config)" missing required parameter "config".`);

        return;
    }

    if (initArgs.length > 1) {
        report && eslintContext.report(node, `"init" arguments can't take more than one arguments.`);

        return;
    }

    const configVal = initArgs[0];

    if (!['Identifier', 'ObjectExpression'].includes(configVal.type)) {
        report && eslintContext.report(configVal, `The argument of "awa.init" is not of type Object.`);

        return;
    }

    if (configVal.type === configProps.types.identifier) { // e.g., awa.init(config);
        const configDefinition = variables.find((variable) => {
            return variable.name === configVal.name;
        });

        if (!configDefinition) {
            report && eslintContext.report(node, `${configVal.name} is not defined.`);

            return;
        }

        configNode = configDefinition.defs[0].node.init;

        if (configNode.type !== configProps.types.object) {
            report && eslintContext.report(configNode, `${configDefinition.name} is not of type Object.`);

            return;
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

export const validateNodeProps = (expectedProps, target, severity, eslintContext) => { // eslint-disable-line consistent-return
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
