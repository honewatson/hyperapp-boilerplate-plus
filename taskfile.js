const browserSync = require('browser-sync');
const md5 = require('md5');
const dist = 'dist';
const release = 'release'

const src = {
  js: 'src/**/*.js',
  scss: 'src/styles/index.scss',
  staticAssets: [
    'src/static/**/*.*',
    'src/*.html',
    'src/api/*.json',
    'src/service-worker.js'
  ],
  vendor: []
};

let isWatching = false;

module.exports = {
  *clean(task) {
    yield task.clear([target, release])
  },
  *copyStaticAssets(task) {
    yield task.source(src.staticAssets).target(target);
  }
  *scripts(task) {
    //  'rollup-plugin-scss'
    yield task.source(src.js)
    .rollup({
      rollup: {
        plugins: [
          require('rollup-plugin-buble')({jsx: 'h'}),
          require('rollup-plugin-commonjs')(),
          require('rollup-plugin-replace')({
            'process.env.NODE_ENV': JSON.stringify(isWatching ? 'development' : 'production')
          }),
          require('rollup-plugin-node-resolve')({
            browser: true,
            main: true
          }),
          require('rollup-plugin-scss')()
        ]
      },
      bundle: {
        format: 'iife',
        sourceMap: isWatching,
        moduleName: "window"
      }
    })
    .target(`${dist}/js`);
  },
  *styles(task) {
    yield task.source(src.scss)
    .sass()
    .autoprefixer()
    .target(`${dist}/css`);
  },
  *reload(task) {
    isWatching && browserSync.reload()
  },
  *build(task) {
    yield task.parallel(['scripts', 'copyStaticAssets', 'styles']);
  },
  *watch(task) {
    isWatching = true;
    yield task.start('build');
    yield task.watch(src.js, ['js', 'reload']);
    yield task.watch(src.scss, ['styles', 'reload']);
    yield task.watch(src.staticAsssets, ['copyStaticAssets', 'reload']);
    browserSync({
      server: dist,
      logPrefix: 'hyperapp',
      port: process.env.PORT || 4000,
      middleware: [
        require('connect-history-api-fallback')()
      ]
    })
  }
}
