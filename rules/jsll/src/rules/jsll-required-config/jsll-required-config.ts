/**
 * @fileoverview Validate the required config properties.
 */

import { Category } from 'sonarwhal/dist/src/lib/enums/category';
import { RuleContext } from 'sonarwhal/dist/src/lib/rule-context';
import { IRule, IRuleBuilder, IScriptParse } from 'sonarwhal/dist/src/lib/types';
import { debug as d } from 'sonarwhal/dist/src/lib/utils/debug';

import { isPotentialInitScript, validateNodeProps, validateAwaInit, configProps } from '../validator';
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

                        const category = `required`;

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

            const results = linter.verify(scriptParse.sourceCode, { rules: { 'jsll-required-config': 'error' } });

            for (const result of results) {
                await context.report(scriptParse.resource, null, result.message);
            }
        };

        return { 'parse::javascript': validateScript };
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
