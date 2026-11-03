import { createHash } from 'node:crypto';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import postcss from 'postcss';
import postcssModules from 'postcss-modules';

const bundlePath = new URL('../lib/client.js', import.meta.url);
const cssPath = new URL('../lib/client.css', import.meta.url);
const rawBundle = await readFile(bundlePath, 'utf8');
const rawCss = await readFile(cssPath, 'utf8');
let classMap = {};
const processedCss = await postcss([
  postcssModules({
    generateScopedName(localName, filename) {
      const digest = createHash('sha1')
        .update(`${filename}:${localName}`)
        .digest('hex')
        .slice(0, 6);
      return `qg_${localName}_${digest}`;
    },
    getJSON(_filename, json) {
      classMap = json;
    },
  }),
]).process(rawCss, { from: cssPath.pathname });

const styleMappingMarker = 'var styles_default = {};';
if (!rawBundle.includes(styleMappingMarker)) {
  throw new Error('tsup output did not contain the expected CSS module placeholder');
}
const clientBundle = rawBundle.replace(styleMappingMarker, `var styles_default = ${JSON.stringify(classMap)};`);
const cssId = 'dsh-quota-guard/styles.module.css';
const styleBootstrap = `
    const dshQuotaGuardCss = ${JSON.stringify(processedCss.css)};
    const dshQuotaGuardCssId = ${JSON.stringify(cssId)};
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(dshQuotaGuardCssId) + ']') === null) {
      const tag = document.createElement('style');
      tag.dataset.plugin = 'dsh-quota-guard';
      tag.dataset.pluginCss = dshQuotaGuardCssId;
      tag.textContent = dshQuotaGuardCss;
      document.head.appendChild(tag);
    }
`;
const wrappedBundle = `window.__ModuleLoader__.load({
  id: 'dsh-quota-guard',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
${styleBootstrap}
${clientBundle}
    return module.exports;
  }
});
`;

await writeFile(bundlePath, wrappedBundle, 'utf8');
await unlink(cssPath);
