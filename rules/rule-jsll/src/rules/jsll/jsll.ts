/**
 * @fileoverview Validate the initialization of the JSLL script.
 */

import { Category } from 'sonarwhal/dist/src/lib/enums/category';
import { RuleContext } from 'sonarwhal/dist/src/lib/rule-context';
import { IRule, IAsyncHTMLElement, IRuleBuilder, IElementFound, IScriptParse } from 'sonarwhal/dist/src/lib/types';
import { debug as d } from 'sonarwhal/dist/src/lib/utils/debug';

import { validateNodeProps, configProps } from './validator';
import { isJsllDir } from './utils';

import { Linter } from 'eslint';

const debug: debug.IDebugger = d(__filename);

/*
 * ------------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------------
 */

const rule: IRuleBuilder = {
    create(context: RuleContext): IRule {
        // const errorsOnly = context.ruleOptions && context.ruleOptions['errors-only'] || false;
        const linter = new Linter();
        let initValidated = false; // If JSLL initialization has been verified.
        let validateInit = false; // If JSLL initialization should be verified, only the script immediately after the JSLL should be verified.
        let configNode;

        const validateAwaInit = (expression, node, scope, eslintContext) => {
            const variables = scope.variables;
            const callee = expression.callee;

            initValidated = true;

            if (!callee || !callee.object || callee.object.name !== 'awa' || callee.property.name !== 'init') {
                eslintContext.report(node, 'JSLL is never initialized with "awa.init(config)" function.');

                return;
            }

            const initArgs = expression.arguments;

            if (initArgs.length < 1) {
                eslintContext.report(node, `JSLL initialization function "awa.init(config)" missing required parameter "config".`);

                return;
            }

            if (initArgs.length > 1) {
                eslintContext.report(node, `"init" arguments can't take more than one arguments.`);

                return;
            }

            const configVal = initArgs[0];

            if (!['Identifier', 'ObjectExpression'].includes(configVal.type)) {
                eslintContext.report(configVal, `The argument of "awa.init" is not of type Object.`);

                return;
            }

            if (configVal.type === configProps.types.identifier) { // e.g., awa.init(config);
                const configDefinition = variables.find((variable) => {
                    return variable.name === configVal.name;
                });

                if (!configDefinition) {
                    eslintContext.report(node, `${configVal.name} is not defined.`);

                    return;
                }

                configNode = configDefinition.defs[0].node.init;

                if (configNode.type !== configProps.types.object) {
                    eslintContext.report(configNode, `${configDefinition.name} is not of type Object.`);

                    return;
                }
            } else {
                configNode = configVal; // awa.init({...});
            }
        };

        linter.defineRule('validate-awa-init', {
            create(eslintContext) {
                let isFirstExpressionStatement = true;

                return {
                    ExpressionStatement(node) {
                        if (!isFirstExpressionStatement) { // Only the first expression statement should be checked.
                            return;
                        }

                        isFirstExpressionStatement = false;

                        const expression = node.expression;
                        const scope = eslintContext.getScope();

                        validateAwaInit(expression, node, scope, eslintContext);
                    },
                    'Program:exit'(programNode) {
                        if (validateInit && (!initValidated)) { // Should verify init but no ExpressionStatement was encountered.
                            eslintContext.report(programNode, `JSLL is never initialized with "awa.init(config)" function.`);
                        }
                    }
                };

            }
        });

        linter.defineRule('validate-required-config', {
            create(eslintContext) {
                let isFirstExpressionStatement = true;

                return {
                    ExpressionStatement() {
                        if (!isFirstExpressionStatement) { // Only the first expression statement should be checked.
                            return;
                        }

                        isFirstExpressionStatement = false;

                        if (!configNode) {
                            return;
                        }

                        const category = `required`;

                        validateNodeProps(configProps.config[category], configNode, category, eslintContext);
                    }
                };

            }
        });

        linter.defineRule('validate-optional-config', {
            create(eslintContext) {
                let isFirstExpressionStatement = true; // Only check the first expression statements.

                return {
                    ExpressionStatement() {
                        if (!isFirstExpressionStatement) { // Only check the first expression statement.
                            return;
                        }

                        isFirstExpressionStatement = false;

                        if (!configNode) {
                            return;
                        }

                        const category = `optional`;

                        validateNodeProps(configProps.config[category], configNode, category, eslintContext);
                    }
                };

            }
        });

        const validateScript = async (scriptParse: IScriptParse) => {
            if (!validateInit) {
                return;
            }

            const results = linter.verify(scriptParse.sourceCode, {
                rules: {
                    'validate-awa-init': 'error',
                    'validate-optional-config': 'warn',
                    'validate-required-config': 'error'
                }
            });

            validateInit = false; // Only validates the script included immediately after the JSLL link.

            for (const result of results) {
                await context.report(scriptParse.resource, null, result.message);
            }
        };

        const updateVerifyJSLLInit = (data: IElementFound) => {
            const { element }: { element: IAsyncHTMLElement, resource: string } = data;

            if (validateInit) {
                return;
            }

            // JSLL script has been included at this point.
            // Now JSLL init needs to be verified.
            validateInit = isJsllDir(element);
        };

        return {
            'element::script': updateVerifyJSLLInit,
            'parse::javascript': validateScript
        };
    },
    meta: {
        docs: {
            category: Category.interoperability,
            description: `Check if your scripts use semicolon`
        },
        recommended: false,
        schema: [],
        worksWithLocalFiles: true
    }
};

module.exports = rule;
