/**
 * @fileoverview Validate the use of `awa.init` to initialize the JSLL script.
 */

import { Category } from 'sonarwhal/dist/src/lib/enums/category';
import { RuleContext } from 'sonarwhal/dist/src/lib/rule-context';
import { IRule, IAsyncHTMLElement, IRuleBuilder, IElementFound, IScriptParse, ITraverseUp } from 'sonarwhal/dist/src/lib/types';
import { debug as d } from 'sonarwhal/dist/src/lib/utils/debug';

import { validateAwaInit } from '../validator';
import { isJsllDir, isHeadElement } from '../utils';

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
        let validated: boolean = false; // If `validateAwaInit` has run.
        let hasJSLLScript: boolean = false; // If link to JSLL scripts has been included.

        linter.defineRule('jsll-awa-init', {
            create(eslintContext) {
                let isFirstExpressionStatement: boolean = true;

                return {
                    ExpressionStatement(node) {
                        if (!isFirstExpressionStatement) { // Only the first expression statement should be checked.
                            return;
                        }

                        isFirstExpressionStatement = false;

                        validateAwaInit(node, eslintContext, true);

                        validated = true;
                    },
                    'Program:exit'(programNode) {
                        if (hasJSLLScript && (!validated)) {
                            // Should verify init but no ExpressionStatement was encountered.
                            // e.g.:
                            // ...
                            // <script src="../jsll-4.js"></script>
                            // <script>var a = 2;</script>
                            eslintContext.report(programNode, `JSLL is not initialized with "awa.init(config)" function. Initialization script should be placed immediately after JSLL script.`);
                        }
                    }
                };
            }
        });

        const validateScript = async (scriptParse: IScriptParse) => {
            if (!hasJSLLScript) {
                return;
            }

            const results = linter.verify(scriptParse.sourceCode, { rules: { 'jsll-awa-init': 'error' } });

            hasJSLLScript = false;
            // Only validates the script included immediately after the JSLL link.
            // So flip this flag to avoid duplicates.

            for (const result of results) {
                await context.report(scriptParse.resource, null, result.message);
            }
        };

        const enableInitValidate = (data: IElementFound) => {
            const { element }: { element: IAsyncHTMLElement, resource: string } = data;

            if (hasJSLLScript) {
                return;
            }

            // JSLL script has been included at this point.
            // Now JSLL init needs to be verified.
            hasJSLLScript = isJsllDir(element);
        };

        const validateInit = async (event: ITraverseUp) => {
            const { resource }: { resource: string } = event;

            if (!isHeadElement(event.element)) {
                return;
            }

            if (hasJSLLScript && (!validated)) {
                // Should verify init but no script tag was encountered after the JSLL link.
                // e.g.:
                // <head>
                //      <script src="../jsll-4.js"></script>
                // </head>
                await context.report(resource, null, `JSLL is not initialized with "awa.init(config)" function. Initialization script should be placed immediately after JSLL script.`);
            }

        };

        return {
            'element::script': enableInitValidate,
            'parse::javascript': validateScript,
            'traverse::up': validateInit
        };
    },
    meta: {
        docs: {
            category: Category.other,
            description: `Validate the use of 'awa.init' to initialize the JSLL script.`
        },
        recommended: false,
        schema: [],
        worksWithLocalFiles: true
    }
};

module.exports = rule;
