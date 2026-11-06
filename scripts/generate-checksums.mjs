import {createHash} from 'node:crypto';
import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {basename,join,resolve} from 'node:path';

const [directoryArgument='release',outputArgument='SHA256SUMS.txt',extensionArgument='']=process.argv.slice(2);
const directory=resolve(directoryArgument);
const files=readdirSync(directory).filter(file=>!extensionArgument||file.endsWith(extensionArgument)).sort();
if(!files.length)throw new Error(`No artifacts matching ${extensionArgument||'requested filter'} in ${directory}`);
const lines=files.map(file=>`${createHash('sha256').update(readFileSync(join(directory,file))).digest('hex')}  ${basename(file)}`);
const output=resolve(directory,outputArgument);
writeFileSync(output,`${lines.join('\n')}\n`,'utf8');
console.log(output);
