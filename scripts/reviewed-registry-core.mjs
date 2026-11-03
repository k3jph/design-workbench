// Retrieve immutable, independently reviewed public Core archives for consumers.
// Historical fixture archives remain rehearsal inputs, never release dependencies.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
export const reviewedCore = Object.freeze({
 martlet:{version:'2.2.3',sha256:'1395eb206514b54500e4a098b1aafe59492c516c301a7e8c81a18672f6f4ce42'},
 krigsvold:{version:'2.2.4',sha256:'c2088b2585e913c11f74a045805bcef186e8e830f5c626e46c0c299e6a6eb7c4'},
});
export function reviewedRegistryCoreArchive(family,directory){
 const core=reviewedCore[family];if(!core)throw Error('Unknown Core family');
 const packed=JSON.parse(execFileSync('npm',['pack',`@${family}/core@${core.version}`,'--ignore-scripts','--json','--pack-destination',directory],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:120000}));
 if(packed.length!==1||packed[0].name!==`@${family}/core`||packed[0].version!==core.version)throw Error('Registry Core identity mismatch');
 const file=resolve(directory,packed[0].filename);
 if(createHash('sha256').update(readFileSync(file)).digest('hex')!==core.sha256)throw Error('Registry Core differs from independently reviewed bytes');
 return file;
}
