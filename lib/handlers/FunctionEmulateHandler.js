'use strict';

const path = require('path'),
	  os = require('os'),
	  chalk = require('chalk'),
	  BbPromise = require('bluebird'),
	  fs = BbPromise.promisifyAll(require("fs-extra")),
	  Events = require('./../BindingTypes'),
	  FError = require('./../Error'),
	  env = require('./../utils/env');

class FunctionEmulateHandler {
	constructor() {
		this.context = 'function';
		this.action = 'emulate';
	}

	process(options) {
		return BbPromise.try(() => {
			let fFile = options.n || options.name;
			fFile = path.resolve((path.extname(fFile) === '') ? path.join(fFile, 'index.js') : fFile);
			let fPath = path.resolve(path.dirname(fFile));
			let f = require(fFile);

			let fArgs = options.i || options.input || path.join(fPath, 'args.json');
			let i = require(fArgs);

			let ctxFactory = require('./../ContextFactory');
			let metadata = this._extractFunctionMetadata(fPath);
			let ctx = ctxFactory.createContext(metadata, i);

			let args = [];
			metadata.in.forEach(function (b) {
				args.push(ctx.bindings[b.name]);
			}, this);

			args.unshift(ctx);
			this._setEnvVars()
				.then(() => f.apply(this, args));
		});
	}
	
	help() {
		let help = 'Runs the service locally on your machine. Expects a "function.json" file in the function folder.' + os.EOL + 
					'Creates a trigger specific context object and "in" parameters and passes them to your service.' + os.EOL + os.EOL;
		help += '-n, --name' + os.EOL;
		help += '      Name of the function (folder), expects index.js.' + os.EOL;
		help += '-i, --input' + os.EOL;
		help += '      (Optional): Path to the input file, assumes args.json in function folder per default'; + os.EOL;
		console.log(chalk.cyan(help)); 
	}
	
	_setEnvVars() {
		return env.getLocalVars()
		.then((localVars) => {
			Object.keys(localVars).forEach((key) => {
        		process.env[key] = localVars[key];
    		});	
		});
	}
	
	_extractFunctionMetadata(p) {
		let metadata = { out: [], in: [] };
		try {
			var f = require(path.join(p, 'function.json'));
		} catch(e) {
			throw new FError('Missing file "function.json" in your Azure Function folder.');
		}
		f.bindings.forEach(function(binding) {
			let types = Events.TRIGGER.toArray();
			let pos = types.indexOf(binding.type); 
			if (pos !== -1) { // We found the Trigger Binding
				metadata.triggerType = types[pos];
			}
			if (binding.direction === 'out') { // We store the 'out' bindings to improve visulization of run results
				metadata.out.push({ name: binding.name, type: binding.type });
			}
			if (binding.direction === 'in') { // We store the 'in' bindings to pass individual params to the Azure function
				metadata.in.push({ name: binding.name, type: binding.type });
			}
		}, this);
		
		return metadata;
	}
}

module.exports = FunctionEmulateHandler;