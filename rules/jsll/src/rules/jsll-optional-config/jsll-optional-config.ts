/**
 * @fileoverview Validate the required optional properties.
 */

import { Category } from 'sonarwhal/dist/src/lib/enums/category';
import { RuleContext } from 'sonarwhal/dist/src/lib/rule-context';
import { IRule, IAsyncHTMLElement, IRuleBuilder, IElementFound, IScriptParse } from 'sonarwhal/dist/src/lib/types';
import { debug as d } from 'sonarwhal/dist/src/lib/utils/debug';

import { validateNodeProps, validateAwaInit, configProps, isPotentialInitScript } from '../validator';
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
        let hasJSLLScript: boolean = false; // If link to JSLL scripts has been included.

        linter.defineRule('jsll-required-config', {
            create(eslintContext) {
                let isFirstExpressionStatement = true;

                return {
                    ExpressionStatement(node) {
                        const configNode = validateAwaInit(node, eslintContext, false, isFirstExpressionStatement);

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
            const sourceCode = scriptParse.sourceCode;

            if (!isPotentialInitScript(sourceCode)) {
                return;
            }

            const results = linter.verify(scriptParse.sourceCode, { rules: { 'jsll-required-config': 'warn' } });

            hasJSLLScript = false;
            // Only the script included immediately after the JSLL link needs to be validated.
            // So flip the flag.


            for (const result of results) {
                await context.report(scriptParse.resource, null, result.message);
            }
        };

        const enableInitValidate = (data: IElementFound) => {
            const { element }: { element: IAsyncHTMLElement, resource: string } = data;

            if (hasJSLLScript) {
                return;
            }

            // JSLL init needs to be verified if JSLL script was included.
            hasJSLLScript = isJsllDir(element);
        };

        return {
            'element::script': enableInitValidate,
            'parse::javascript': validateScript
        };
    },
    meta: {
        docs: {
            category: Category.other,
            description: `Validate the optional config properties.`
        },
        recommended: false,
        schema: [],
        worksWithLocalFiles: true
    }
};

module.exports = rule;
