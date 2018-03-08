import { generateHTMLPage } from 'sonarwhal/dist/tests/helpers/misc';
import { RuleTest } from 'sonarwhal/dist/tests/helpers/rule-test-type';
import * as ruleRunner from 'sonarwhal/dist/tests/helpers/rule-runner';

const ruleName = 'chisel';

const html = {
    missingLang: `<!doctype html>
    <html>
       <head>
           <title>test</title>
       </head>
       <body>
       </body>
   </html>`,
    noProblems: generateHTMLPage()
};

const tests: Array<RuleTest> = [
    {
        name: `Page doesn't have any a11y problems and passes`,
        serverConfig: html.noProblems
    },
    {
        name: `HTML is missing the lang attribute and fails`,
        reports: [{ message: '<html> element must have a lang attribute' }],
        serverConfig: html.missingLang
    }
];

const testsWithCustomConfiguration: Array<RuleTest> = [
    {
        name: `Page doesn't have any a11y problems and passes`,
        serverConfig: html.noProblems
    },
    {
        name: `HTML is missing the lang attribute and passes because of custom config`,
        serverConfig: html.missingLang
    }
];

const testsWithOverridenConfiguration: Array<RuleTest> = [
    {
        name: `Page doesn't have any a11y problems and passes, but warns about the overriden config setting`,
        reports: [{ message: 'exclude is ignored when selector is set.' }],
        serverConfig: html.noProblems
    },
    {
        name: `HTML is missing the lang attribute and fails, and warns about the overriden config setting`,
        reports: [{ message: 'exclude is ignored when selector is set.' }, { message: '<html> element must have a lang attribute' }],
        serverConfig: html.missingLang
    }
];

ruleRunner.testRule(ruleName, tests);
ruleRunner.testRule(ruleName, testsWithCustomConfiguration, { ruleOptions: { testsToRun: ['color-contrast'] } });
ruleRunner.testRule(ruleName, testsWithOverridenConfiguration, {
    ruleOptions: {
        exclude: ['html'],
        selector: 'html'
    }
});
