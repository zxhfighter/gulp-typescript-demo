'use strict';

const path = require('path');
const tsConfigPath = path.join(__dirname, './config/tsconfig.json');

require('ts-node').register({
    project: tsConfigPath
});

require('./config/gulpfile');
