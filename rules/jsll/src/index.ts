/**
 * @fileoverview jsll the initialization of the JSLL script.
 */

module.exports = {
    'jsll-awa-init': require('./rules/jsll-awa-init/jsll-awa-init'),
    'jsll-optional-config': require('./rules/jsll-optional-config/jsll-optional-config'),
    'jsll-required-config': require('./rules/jsll-required-config/jsll-required-config'),
    'jsll-script-included': require('./rules/jsll-script-included/jsll-script-included')
};
