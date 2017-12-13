/**
 * @fileoverview Use Chisel to assess the accessibility of a web site or web application.
 */

import { Category } from 'sonarwhal/dist/src/lib/enums/category';
import { RuleContext } from 'sonarwhal/dist/src/lib/rule-context';
import { IRule, IRuleBuilder, ITraverseEnd, IAsyncHTMLElement, Severity } from 'sonarwhal/dist/src/lib/types';
import { debug as d } from 'sonarwhal/dist/src/lib/utils/debug';
import { IChiselResults, AxeNodeResult, AxeRule, IChiselDecorations, IChiselOptions } from '@mskeros/chisel';
import { readFileAsync } from 'sonarwhal/dist/src/lib/utils/misc';

const debug: debug.IDebugger = d(__filename);

/*
 * ------------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------------
 */

const rule: IRuleBuilder = {
    create(context: RuleContext): IRule {
        /** Configuration of the chisel rule. */
        let chiselConfig: IChiselOptions = {};

        /** Table of overriden config properties. */
        const overrideLookUp: object = {
            dom: ['include', 'exclude'],
            selector: ['include', 'exclude'],
            testsToRun: ['enableBestPracticeRules']
        };

        /** Interface of a chisel violation. */
        interface IChiselViolation extends AxeRule, IChiselDecorations { }

        /** Load rule configuration. */
        const loadRuleConfig = () => {
            if (!context.ruleOptions) {
                return;
            }

            chiselConfig = context.ruleOptions;
        };

        /** Generate the script to initiate the chisel scan in a page. */
        const generateScript = (): string => {
            // This is run in the page, not sonarwhal itself.
            const script: string =
                `function runChiselScan() {
                    return new Promise(function (resolve, reject) {
                        Chisel.scan(${JSON.stringify(chiselConfig, null, 2)}, function (results) {
                            resolve(results);
                        }, function (error) {
                            reject(error);
                        });
                    });
                }`;

            return script;
        };

        /** Get element from an axe node in the scan result. */
        const getElement = async (node: AxeNodeResult): Promise<IAsyncHTMLElement> => {
            const selector: string = node.target[0];
            const elements: Array<IAsyncHTMLElement> = await context.querySelectorAll(selector);

            return elements[0];
        };

        /** Validate config to warn against overriden properties. */
        const validateConfig = (config: IChiselOptions) => {
            const warnings: Array<string> = [];

            Object.keys(overrideLookUp).forEach((dominant: string) => {
                if (config.hasOwnProperty(dominant)) {
                    const lessers = overrideLookUp[dominant].filter((lesserProperty) => {
                        return config.hasOwnProperty(lesserProperty);
                    });

                    if (lessers.length) {
                        warnings.push(`${lessers.join(', ')} is ignored when ${dominant} is set.`);
                    }
                }
            });

            return warnings;
        };

        const validate = async (traveseEnd: ITraverseEnd) => {
            const { resource } = traveseEnd;
            const chiselScript: string = await readFileAsync(require.resolve('@mskeros/chisel'));
            const runChiselScript: string = `(function() {
                ${chiselScript};

                return ${generateScript()}();
            }())`;
            let result: IChiselResults = null;

            const warnings = validateConfig(chiselConfig);

            if (warnings.length) {
                const reportPromises = warnings.map((warning) => {
                    return context.report(resource, null, warning, null, null, Severity.warning);
                });

                await Promise.all(reportPromises);
            }

            try {
                result = await context.evaluate(runChiselScript);
            } catch (error) {
                await context.report(resource, null, `Error executing script${error.message ? `: "${error.message}"` : ''}. Please try with another connector`, null, null, Severity.warning);
                debug('Error executing script %O', error);

                return;
            }

            if (!result || !Array.isArray(result.violations)) {
                debug(`Unable to parse chisel results ${result}`);

                return;
            }

            if (result.violations.length === 0) {
                debug('No accessibility issues found');

                return;
            }

            const reportPromises = result.violations.reduce((promises: Array<Promise<void>>, violation: IChiselViolation) => {
                const elementPromises = violation.nodes.map(async (node: AxeNodeResult) => {
                    const element: IAsyncHTMLElement = await getElement(node);

                    return context.report(resource, element, violation.help);
                });

                return promises.concat(elementPromises);
            }, []);

            await Promise.all(reportPromises);
        };

        loadRuleConfig();

        return { 'traverse::end': validate };
    },
    meta: {
        docs: {
            category: Category.accessibility,
            description: `Use Chisel to assess the accessibility of a web site or web application.`
        },
        recommended: false,
        schema: [{
            additionalProperties: false,
            properties: {
                dom: { type: ['string', 'array'] },
                enableBestPracticeRules: { type: 'boolean' },
                exclude: {
                    items: { type: 'string' },
                    type: 'array'
                },
                include: {
                    items: { type: 'string' },
                    type: 'array'
                },
                selector: { type: 'string' },
                testsToRun: {
                    items: { type: 'string' },
                    type: 'array'
                }
            }
        }],
        worksWithLocalFiles: false
    }
};

module.exports = { chisel: rule };
