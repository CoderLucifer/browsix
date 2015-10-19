/// <reference path="../../typings/node/node.d.ts" />

'use strict';

import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as pipe2 from 'node-pipe2';

function main(): void {
	'use strict';

	let pathToScript = process.argv[1];
	let args = process.argv.slice(2);
	let waiting = 2;
	let exit = 0;

	pipe2((perr: any, rfd: number, wfd: number) => {
		if (perr)
			throw new Error('pipe2 failed: ' + perr);

		let echo = child_process.spawn('/usr/local/suck/bin/echo', ['hello world'], { stdio: [0, wfd, 2] });
		echo.on('error', (err: any) => {
			process.stderr.write('error: ' + err, () => {
				exit = 1;
				waiting--;
				if (!waiting)
					process.exit(1);
			});
		});
		echo.on('exit', (code: number) => {
			waiting--;
			if (!waiting)
				process.exit(code);
		});

		// XXX: we don't need the wfd at this point, and
		// keeping it open seems to prevent cat from getting
		// an EOF on the pipe?
		fs.close(wfd, () => {
			let cat = child_process.spawn('cat', [], { stdio: [rfd, 1, 2] });
			cat.on('error', (err: any) => {
				process.stderr.write('error: ' + err, () => {
					exit = 1;
					waiting--;
					if (!waiting)
						process.exit(1);
				});
			});
			cat.on('exit', (code: number) => {
				waiting--;
				if (!waiting)
					process.exit(code);
			});
			fs.close(rfd);
		});

	});
}

main();
