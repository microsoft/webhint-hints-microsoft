/**
 * @fileoverview Validate the required config properties.
 */

import { Category } from 'sonarwhal/dist/src/lib/enums/category';
import { RuleContext } from 'sonarwhal/dist/src/lib/rule-context';
import { IRule, IAsyncHTMLElement, IRuleBuilder, IElementFound, IScriptParse } from 'sonarwhal/dist/src/lib/types';
import { debug as d } from 'sonarwhal/dist/src/lib/utils/debug';

import { validateNodeProps, validateAwaInit, configProps } from '../validator';
import { isJsllDir } from '../utils';

import { Linter } from 'eslint';

const debug: debug.IDebugger = d(__filename);

/*
 * ------------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------------
 */

const rule: IRuleBuilder = {
    create(context: RuleContext): IRule {
        const linter = new Linter();
        let initValidate = false; // If JSLL initialization should be verified, only the script immediately after the JSLL should be verified.

        linter.defineRule('validate-required-config', {
            create(eslintContext) {
                let isFirstExpressionStatement = true;

                return {
                    ExpressionStatement(node) {
                        if (!isFirstExpressionStatement) {
                            // Only the first expression statement should be checked.
                            return;
                        }

                        isFirstExpressionStatement = false;
                        const configNode = validateAwaInit(node, eslintContext, false);

                        if (!configNode) {
                            return;
                        }

                        const category = `required`;

                        validateNodeProps(configProps.config[category], configNode, category, eslintContext);
                    }
                };

            }
        });

        const validateScript = async (scriptParse: IScriptParse) => {
            if (!initValidate) {
                return;
            }

            const results = linter.verify(scriptParse.sourceCode, {
                rules: { 'validate-required-config': 'error' }
            });

            initValidate = false;
            // Only the script included immediately after the JSLL link needs to be validated.
            // So flip the flag.

            for (const result of results) {
                await context.report(scriptParse.resource, null, result.message);
            }
        };

        const enableInitValidate = (data: IElementFound) => {
            const { element }: { element: IAsyncHTMLElement, resource: string } = data;

            if (initValidate) {
                return;
            }

            // JSLL init needs to be verified if JSLL script was included.
            initValidate = isJsllDir(element);
        };

        return {
            'element::script': enableInitValidate,
            'parse::javascript': validateScript
        };
    },
    meta: {
        docs: {
            category: Category.other,
            description: `Validate the required config properties.`
        },
        recommended: false,
        schema: [],
        worksWithLocalFiles: true
    }
};

module.exports = rule;
