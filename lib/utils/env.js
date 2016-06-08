'use strict';

const BbPromise = require('bluebird'),
      fs = BbPromise.promisifyAll(require("fs-extra")),
      os = require('os'),
      path = require('path');

let rootFolder = path.join(__dirname, '../..'); // The root folder of funcy-azure
let projectFolder = process.cwd(); // The CLI needs to be invoked from the project folder

function envToObject(fullPath) {
    return fs.readFileAsync(fullPath)
        .then((file) => {
            let envVars = {};
            file = file.toString('utf8');
            file = file.replace(/ /g, "");
            let keyvals = file.split(os.EOL)
            for (let i = 0; i <= keyvals.length - 1; ++i) {
                let line = keyvals[i];
                let value = line.substring(line.indexOf('=')+1);
                let key = keyvals[i].split('=')[0];
                if(key !== '') {
                    envVars[key] = value;
                }
            }
            return envVars
        });
}

exports.rootFolder = rootFolder;

exports.projectFolder = projectFolder;

exports.projectName = path.basename(projectFolder);

exports.fazTemplatesFolder = path.join(rootFolder, 'lib/templates');

exports.adminVars = path.join(projectFolder, 'admin.env');

exports.cloudVars = path.join(projectFolder, 'cloud.env');

exports.localVars = path.join(projectFolder, 'local.env');

exports.ARMTemplate = path.join(projectFolder, 'f-resources-arm.json');

exports.projectFile = path.join(projectFolder, 'f-project.json');

exports.getAdminVars = function () {
    return envToObject(path.join(projectFolder, 'admin.env'));
}

exports.getCloudVars = function() {
    return envToObject(path.join(projectFolder, 'cloud.env'));
}

exports.getLocalVars = function() {
    return envToObject(path.join(projectFolder, 'local.env'));
}