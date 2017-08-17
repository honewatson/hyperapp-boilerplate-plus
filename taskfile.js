const browserSync = require('browser-sync');
const md5 = require('md5');
const rollup = require('rollup');
const rollupBuble = require('rollup-plugin-buble');
const rollupCommonjs = require('rollup-plugin-commonjs');
const rollupReplace = require('rollup-plugin-replace');
const rollupNodeResolve = require('rollup-plugin-node-resolve');
const rollupScss = require('rollup-plugin-scss');
const rollupJson = require('rollup-plugin-json');
const toString = require('hyperapp-server').toString;
const deepAssign = require('deep-assign');
const path = require('path');
const join = path.join;
const colors = require('colors/safe');
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
    jsx: 'src/jsx/*.jsx',
    vendor: []
};

let isWatching = false;


function fromRollupCode(result) {
    return result.code;
}

function createNewFunction(code) {
    var contentPrep = code.split("\n");
    var first = contentPrep.shift();
    var fnBody = [].concat(
        first,
        "var module = {};",
        contentPrep,
        "return module.exports;").join("\n");
    return new Function(fnBody);
}

function hyperNodeToString(nodeFactory, props) {
    var fn = nodeFactory();
    return toString(fn(props))
}

//
function getData(filename) {
    var data = {};
    try {
        // a path we KNOW is totally bogus and not a module
        var pageData = require('./src/' + filename.replace(/\.jsx/, '.json'));
        var defaultData = require('./src/jsx/default.json');
        data = deepAssign(defaultData, pageData);

    }
    catch (e) {
        data = require('./src/jsx/default.json');
    }
    return data;
}

function handleErrors(e) {
    console.log(colors.red(e))
}

module.exports = {
    *clean(task) {
        yield task.clear([dist, release])
    },
    *copyStaticAssets(task) {
        yield task.source(src.staticAssets).target(dist);
    },
    *jsx(task) {
        yield task.source(src.jsx).run({
            every: true,
            *func(file) {
                const self = this;
                // Rollup pretty standard stuff
                // https://github.com/rollup/rollup/wiki/JavaScript-API
                yield rollup.rollup({
                    entry: join(file.dir, file.base),
                    plugins: [
                        rollupJson(),
                        rollupNodeResolve({jsnext: true, main: true}),
                        rollupCommonjs({include: 'node_modules/**'}),
                        rollupBuble({jsx: 'h'}),
                    ]
                }).then(function (bundle) {
                    // Cache our bundle for later use (optional)


                    // A Promise that fulfills with { code: string, sourcemap: object }
                    return bundle.generate({
                        // output format - 'amd', 'cjs', 'es', 'iife', 'umd'
                        format: 'cjs'
                    });

                }).then(function staticHyperapp(result) {
                    var contentOut = hyperNodeToString(
                        createNewFunction(fromRollupCode(result)),
                        getData(join(file.dir, file.base))
                    );
                    //console.log(contentOut)
                    file.data = new Buffer('<!DOCTYPE html>\n' + contentOut)
                    file.base = file.base.replace(/\.jsx/, '.html');
                    self._.file = file;
                    return contentOut;

                }).catch(handleErrors); // log errors
            }
        }).target(`${dist}`)
    },
    *scripts(task) {
        //  'rollup-plugin-scss'
        yield task.source(src.js)
            .rollup({
                rollup: {
                    plugins: [
                        rollupBuble({jsx: 'h'}),
                        rollupCommonjs(),
                        rollupReplace({
                            'process.env.NODE_ENV': JSON.stringify(isWatching ? 'development' : 'production')
                        }),
                        rollupNodeResolve({
                            browser: true,
                            main: true
                        }),
                        rollupScss()
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
        yield task.parallel(['scripts', 'jsx', 'copyStaticAssets', 'styles']);
    },
    *watch(task) {
        isWatching = true;
        yield task.start('build');
        yield task.watch(src.js, ['scripts', 'reload']);
        yield task.watch(src.jsx, ['jsx', 'reload'])
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
