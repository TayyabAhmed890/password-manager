import { defineConfig } from 'wxt';

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Keynest Password Manager',
    description: 'Save and fill logins from your Keynest vault.',
    version: '0.1.0',
  },
});
