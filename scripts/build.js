const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const htmlMinifier = require('html-minifier-terser');
const JavaScriptObfuscator = require('javascript-obfuscator');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

const JS_OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  numbersToExpressions: true,
  simplify: true,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.8,
  splitStrings: true,
  splitStringsChunkLength: 5,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  selfDefending: false,
  debugProtection: false
};

const HTML_MINIFIER_OPTIONS = {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  minifyCSS: true,
  minifyJS: true
};

async function build() {
  console.log('Starting production build...');
  const startTime = Date.now();

  // 1. Reset dist directory
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // 2. Copy static files/directories
  const staticItems = ['favicon', 'CNAME', 'robots.txt', '.nojekyll', '.well-known'];
  for (const item of staticItems) {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(distDir, item);
    if (fs.existsSync(srcPath)) {
      fs.cpSync(srcPath, destPath, { recursive: true });
      console.log(`Copied static asset: ${item}`);
    }
  }

  // 3. Minify CSS
  const cssSrc = path.join(srcDir, 'styles.css');
  if (fs.existsSync(cssSrc)) {
    const rawCss = fs.readFileSync(cssSrc, 'utf8');
    const minifiedCss = new CleanCSS({ level: 2 }).minify(rawCss);
    if (minifiedCss.errors && minifiedCss.errors.length) {
      throw new Error('CleanCSS error: ' + minifiedCss.errors.join(', '));
    }
    fs.writeFileSync(path.join(distDir, 'styles.css'), minifiedCss.styles, 'utf8');
    console.log(`Minified CSS: styles.css (${rawCss.length} -> ${minifiedCss.styles.length} bytes)`);
  }

  // 4. Obfuscate JavaScript files
  const jsFiles = ['script.js', 'email-validator.js', 'anti-inspect.js'];
  for (const file of jsFiles) {
    const jsSrc = path.join(srcDir, file);
    if (fs.existsSync(jsSrc)) {
      const rawJs = fs.readFileSync(jsSrc, 'utf8');
      const obfuscated = JavaScriptObfuscator.obfuscate(rawJs, JS_OBFUSCATOR_OPTIONS).getObfuscatedCode();
      fs.writeFileSync(path.join(distDir, file), obfuscated, 'utf8');
      console.log(`Obfuscated JS: ${file} (${rawJs.length} -> ${obfuscated.length} bytes)`);
    }
  }

  // 5. Minify HTML files
  const htmlFiles = ['index.html', '404.html'];
  for (const file of htmlFiles) {
    const htmlSrc = path.join(srcDir, file);
    if (fs.existsSync(htmlSrc)) {
      const rawHtml = fs.readFileSync(htmlSrc, 'utf8');
      const minifiedHtml = await htmlMinifier.minify(rawHtml, HTML_MINIFIER_OPTIONS);
      fs.writeFileSync(path.join(distDir, file), minifiedHtml, 'utf8');
      console.log(`Minified HTML: ${file} (${rawHtml.length} -> ${minifiedHtml.length} bytes)`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Build completed successfully in ${duration}s! Output written to dist/`);
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
