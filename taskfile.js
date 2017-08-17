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
        'src/api/*.json'
    ],
    vendor: []
};

let isWatching = false;

module.exports = {
    *clean(task) {
        yield task.clear([dist, release])
    },
    *copyStaticAssets(task) {
        yield task.source(src.staticAssets).target(dist);
    },
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
            .sass({
                outputStyle: 'compressed',
                includePaths: []
            })
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
        yield task.watch(src.js, ['scripts', 'reload']);
        yield task.watch(src.scss, ['styles', 'reload']);
        yield task.watch(src.staticAssets, ['copyStaticAssets', 'reload']);
        browserSync({
            server: dist,
            logPrefix: 'hyperapp',
            port: process.env.PORT || 4001,
            middleware: [
                require('connect-history-api-fallback')()
            ]
        })
    }
}
