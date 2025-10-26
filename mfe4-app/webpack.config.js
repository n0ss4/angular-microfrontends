const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({

  name: 'mfe4-app',

  exposes: {
    './WebComponent': './src/bootstrap-elements.ts',
  },

  shared: {
    ...shareAll({ singleton: false, strictVersion: false, requiredVersion: 'auto' }),
  },

});
