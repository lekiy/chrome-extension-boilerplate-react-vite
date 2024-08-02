import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('../package.json', 'utf8'));

const isFirefox = process.env.__FIREFOX__ === 'true';
/**
 * After changing, please reload the extension at `chrome://extensions`
 * @type {chrome.runtime.ManifestV3}
 */
const sidePanelConfig = {
  side_panel: {
    default_path: 'sidepanel/index.html',
  },
  permissions: !isFirefox ? ['sidePanel'] : [],
};

const manifest = Object.assign(
  {
    manifest_version: 3,
    default_locale: 'en',
    /**
     * if you want to support multiple languages, you can use the following reference
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
     */
    name: '__MSG_extensionName__',
    version: packageJson.version,
    description: '__MSG_extensionDescription__',
    permissions: ['storage'].concat(sidePanelConfig.permissions),
    options_page: 'options/index.html',
    background: {
      service_worker: 'background.iife.js',
      type: 'module',
    },
    action: {
      default_popup: 'popup/index.html',
      default_icon: 'icon-34.png',
    },
    icons: {
      128: 'icon-128.png',
    },
    content_scripts: [
      {
        matches: ['http://portal.ubif.net/*', 'https://portal.ubif.net/*'],
        js: ['content/index.iife.js'],
      },
      {
        matches: ['http://portal.ubif.net/*', 'https://portal.ubif.net/*'],
        js: ['content-ui/index.iife.js'],
      },
      {
        matches: ['http://portal.ubif.net/*', 'https://portal.ubif.net/*'],
        css: ['content.css'], // public folder
      },
    ],
    devtools_page: 'devtools/index.html',
    web_accessible_resources: [
      {
        resources: ['*.js', '*.css', '*.svg', 'icon-128.png', 'icon-34.png'],
        matches: ['*://*/*'],
      },
    ],
  },
  !isFirefox && { side_panel: { ...sidePanelConfig.side_panel } },
);

export default manifest;
