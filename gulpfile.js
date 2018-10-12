'use strict';

const path = require('path');
const tsConfigPath = path.join(__dirname, './config/tsconfig.json');

// 使 gulp 脚本支持 typescript 编写
require('ts-node').register({
    project: tsConfigPath
});

// 引用真正的 ts 编写的 gulp 脚本
require('./config/gulpfile');
