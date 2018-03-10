/**
 * @fileoverview jsll the initialization of the JSLL script.
 */

module.exports = {
    'awa-init': require('./rules/awa-init/awa-init'),
    'script-included': require('./rules/script-included/script-included'),
    'validate-config': require('./rules/validate-config/validate-config')
};
