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
 const coreDir=process.env.NIGHTJAR_CORE_ARCHIVE_DIR;
 const version=family==='martlet'?'2.2.2':'2.2.3';
 const core=coreDir?[resolve(coreDir,`${family}-core-${version}.tgz`)]:[];
 const reactVersion=process.env.NIGHTJAR_REACT_ARCHIVE_VERSION||'0.1.0';
 if(!/^\d+\.\d+\.\d+$/.test(reactVersion))throw Error('Invalid React archive version');
 execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund','--package-lock=false','react@19.3.1','react-dom@19.3.1',...core,resolve(source,`${family}-react-${reactVersion}.tgz`)],{cwd:directory,stdio:'pipe'});
}
