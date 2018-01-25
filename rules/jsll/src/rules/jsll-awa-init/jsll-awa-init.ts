/**
 * @fileoverview Validate the use of `awa.init` to initialize the JSLL script.
 */

import { Category } from 'sonarwhal/dist/src/lib/enums/category';
import { RuleContext } from 'sonarwhal/dist/src/lib/rule-context';
import { IRule, IAsyncHTMLElement, IRuleBuilder, IElementFound, IScriptParse } from 'sonarwhal/dist/src/lib/types';
import { debug as d } from 'sonarwhal/dist/src/lib/utils/debug';

import { isPotentialInitScript, validateAwaInit } from '../validator';
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
        let isHead: boolean = true;
        let validated: boolean = false; // If the linter has run.
        let immediateAfterJSLLscript: boolean = false; // If JSLL init should be validated.
        let traverseStarts: boolean = false;
        let tempInit: IScriptParse | null = null; // A temporary cache for JSLL init script content.

        linter.defineRule('jsll-awa-init', {
            create(eslintContext) {
                let isFirstExpressionStatement: boolean = true;

                return {
                    ExpressionStatement(node) {
                        validateAwaInit(node, eslintContext, true, isFirstExpressionStatement);
                        isFirstExpressionStatement = false;
                        validated = true;
                    }
                };
            }
        });

        const validateScript = async (scriptParse: IScriptParse) => {
            const sourceCode = scriptParse.sourceCode;

            if (!isPotentialInitScript(sourceCode)) {
                immediateAfterJSLLscript = false;

                return;
            }

            if (!traverseStarts) {
                // When jsll init script is included in an external script
                // `parse::javascript` of the init script is emitted before `element::script` of the JSLL link.
                // So wait to run `validateScript` until traversal starts, otherwise the `immediateAfterJSLLscript` flag is not right.
                tempInit = scriptParse;

                return;
            }

            if (isHead && !immediateAfterJSLLscript) {
                await context.report(scriptParse.resource, null, `The JSLL init script should be immediately following the JSLL script.`);
            }

            if (!isHead) {
                await context.report(scriptParse.resource, null, `The JSLL init script should be in <head>.`);
            }

            immediateAfterJSLLscript = false;

            const results = linter.verify(sourceCode, { rules: { 'jsll-awa-init': 'error' } });

            for (const result of results) {
                await context.report(scriptParse.resource, null, result.message);
            }
        };

        const updateImmedateAfterJSLLScript = (data: IElementFound) => {
            const { element }: { element: IAsyncHTMLElement, resource: string } = data;

            if (immediateAfterJSLLscript) {
                return;
            }

            // JSLL script has been included at this point.
            // Now JSLL init needs to be verified.
            immediateAfterJSLLscript = isJsllDir(element);

            if (immediateAfterJSLLscript && tempInit) {
                validateScript(tempInit);
                tempInit = null;
            }
        };

        const updateTraverseStart = () => {
            traverseStarts = true;
        };

        const enterBody = async (data: IElementFound) => {
            const { resource }: { resource: string, element: IAsyncHTMLElement } = data;

            isHead = false;

            if (!validated) {
                // Should verify init but no script tag was encountered after the JSLL link.
                // e.g.:
                // <head>
                //      <script src="../jsll-4.js"></script>
                // </head>
                await context.report(resource, null, `JSLL is not initialized with "awa.init(config)" function in <head>. Initialization script should be placed immediately after JSLL script.`);
            }
        };

        return {
            'element::body': enterBody,
            'element::script': updateImmedateAfterJSLLScript,
            'parse::javascript': validateScript,
            'traverse::start': updateTraverseStart
        };
    },
    meta: {
        docs: {
            category: Category.other,
            description: `Validate the use of 'awa.init' to initialize the JSLL script.`
        },
        ignoredConnectors: ['jsdom'],
        recommended: false,
        schema: [],
        worksWithLocalFiles: true
    }
};

module.exports = rule;
