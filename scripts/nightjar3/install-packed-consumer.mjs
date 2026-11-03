// Optional extraction-rehearsal mode for the existing consumer suites.
// With no directory configured, retain their original workspace resolution.
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
export function installPackedConsumer(directory,family){
 const source=process.env.NIGHTJAR_REACT_ARCHIVE_DIR;
 if(!source)return;
 if(!['martlet','krigsvold'].includes(family))throw Error('Unknown family');
 writeFileSync(resolve(directory,'package.json'),JSON.stringify({name:'nightjar-packed-consumer',private:true,type:'module'}));
 execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund','--package-lock=false','react@19.3.1','react-dom@19.3.1',resolve(source,`${family}-react-0.1.0.tgz`)],{cwd:directory,stdio:'pipe'});
}
