import { resolve, join } from 'path';
import { task, dest, src, series } from 'gulp';
import * as browserify from 'browserify';
import * as source from 'vinyl-source-stream';
import * as watchify from 'watchify';
import * as uglify from 'gulp-uglify';
import * as sourcemaps from 'gulp-sourcemaps';
import * as buffer from 'vinyl-buffer';

import { log } from 'gulp-util';

const tsify = require('tsify');
const srcPath = resolve(__dirname, '../../src');
const distPath = resolve(__dirname, '../../dist');
const projectConfigPath = resolve(__dirname, '../../tsconfig.json');

// 1.使用 browserify 创建一个 BrowserifyObject 对象
// 2.使用 watchify 对创建的 BrowserifyObject 对象进行监听
// 3.使用 tsify 从入口文件开始进行 ts 编译，target 为 es2015 模式

const watchedBrowserify = watchify(browserify({
    basedir: '.',
    debug: true,
    entries: [(join(srcPath, './main.ts'))],
    cache: {},
    packageCache: {}
}))
// tsify 有如下特点：
// 1. 会忽略 files, include 等字段，这个由 browserify 的 entries 指定
// 2. 不支持 declaration 参数，不会生成 .d.ts 类型声明文件
.plugin(tsify, { project: projectConfigPath });

/**
 * 实际打包函数
 */
function bundle() {
    return watchedBrowserify
        // 进行 babel 转义，注意 presets 需要写包的全名 `@babel/preset-env` 而不是 `env`
        // 另外，需要在扩展中填写 '.ts'，因为其默认不支持
        .transform('babelify', {
            presets: ['@babel/preset-env'],
            extensions: ['.ts']
        })
        // 递归打包，生成一个只读流
        .bundle()
        // 将只读流转化为 Vinyl 格式
        .pipe(source('bundle.js'))
        // 将 Vinyl 格式转化为 Buffer 模式
        .pipe(buffer())
        // 初始化 sourcemap
        .pipe(sourcemaps.init({ loadMaps: true }))
        // 压缩
        .pipe(uglify())
        // 写入 sourcemap
        .pipe(sourcemaps.write('./'))
        // 输出
        .pipe(dest(distPath));
}

// 拷贝 html 到目标目录
task('copy-html', () => {
    return src(join(srcPath, './index.html'))
        .pipe(dest(distPath));
});

// Gulp 4.0 任务依赖使用 series 和 parallel 方法来处理
// 另外，@types/gulp 也需要安装 4.0 以上的版本
task('default', series('copy-html', done => {
    bundle();
    done();
}));

// 监听 browserfy 入口文件的依赖
watchedBrowserify.on('update', bundle);

// 记录日志
watchedBrowserify.on('log', log);
