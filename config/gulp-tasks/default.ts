import { resolve, join } from 'path';
import { task, dest, src, series } from 'gulp';
import { createProject } from 'gulp-typescript';
import * as browserify from 'browserify';
import * as source from 'vinyl-source-stream';
import * as watchify from 'watchify';
import * as uglify from 'gulp-uglify';
import * as sourcemaps from 'gulp-sourcemaps';
import * as buffer from 'vinyl-buffer';

import { log } from 'gulp-util';
import { watch } from 'fs';

const tsify = require('tsify');

const srcPath = resolve(__dirname, '../../src');
const distPath = resolve(__dirname, '../../dist');
const projectConfigPath = resolve(__dirname, '../../tsconfig.json');
// const tsProject = createProject(projectConfigPath);

const watchedBrowserify = watchify(browserify({
    basedir: '.',
    debug: true,
    entries: [(join(srcPath, './main.ts'))],
    cache: {},
    packageCache: {}
})).plugin(tsify, { project: projectConfigPath });

function bundle() {
    return watchedBrowserify
        .transform('babelify', {
            presets: ['@babel/preset-env'],
            extensions: ['.ts']
        })
        .bundle()
        // vinyl-source-stream lets us adapt the file output of Browserify
        // back into a format that gulp understands called vinyl.
        .pipe(source('bundle.js'))

        // 将 Vinyl 格式转化为 Buffer 模式
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(dest(distPath));
}

// task('compile-ts', () => {
//     return browserify({
//         basedir: '.',
//         debug: true,
//         entries: [(join(srcPath, './main.ts'))],
//         cache: {},
//         packageCache: {}
//     })
//     // 1. 会忽略 files, include 等字段，这个由 browserify 的 entries 指定
//     // 2. 不支持 declaration 参数，不会生成 .d.ts 类型声明文件
//     .plugin(tsify, { project: projectConfigPath })
//     .bundle()
//     // vinyl-source-stream lets us adapt the file output of Browserify
//     // back into a format that gulp understands called vinyl.
//     .pipe(source('bundle.js'))
//     .pipe(dest(distPath));
// });

task('copy-html', () => {
    return src(join(srcPath, './index.html'))
        .pipe(dest(distPath));
});

task('default', series('copy-html', done => {
    bundle();
    done();
}));

watchedBrowserify.on('update', bundle);
watchedBrowserify.on('log', log);
