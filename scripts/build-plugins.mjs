import {cp,mkdir,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const distribution=JSON.parse(await readFile('docs/distribution.json','utf8'));
const json=(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n');
for(const family of ['martlet','krigsvold']) {
 const title=family==='martlet'?'Martlet':'Krigsvold', name=`${family}-design-language`, dir=`plugins/${name}`;
 await rm(dir,{recursive:true,force:true});await mkdir(`${dir}/assets`,{recursive:true});await mkdir(`${dir}/.claude-plugin`,{recursive:true});
 await cp(`skills/${family}-builder`,`${dir}/skills/${family}-builder`,{recursive:true});
 await cp(`docs-app/brand/${family}-mark.svg`,`${dir}/assets/mark.svg`);
 const description=`Build ${title} interfaces with its independent UI grammar, source decisions, platform APIs, task patterns and read-only guidance MCP. Experimental application grammar; explicit framework and evidence limits.`;
 const base={name,version:distribution.mcpVersion??distribution.preview.version,description,author:{name:'James P. Howard, II'},homepage:`${distribution.families[family].home}/agents/`,repository:'https://github.com/k3jph/design-workbench',license:'MIT'};
 const subtitle=`Build with ${title}`;assert.ok(subtitle.length<=30);
 await json(`${dir}/plugin.json`,{$schema:'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',...base,extensions:{'com.openai':{interface:{displayName:`${title} Design Language`,shortDescription:subtitle,longDescription:description,developerName:'James P. Howard, II',category:'Developer Tools',capabilities:[],logo:'./assets/mark.svg',composerIcon:'./assets/mark.svg',defaultPrompt:`Use ${title}'s grammar to build this interface. Retrieve the manifest and platform-specific guidance before choosing APIs.`}}}});
 await json(`${dir}/mcp.json`,{$schema:'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',mcpServers:{[family]:{type:'streamable-http',url:distribution.families[family].mcp.url,extensions:{'com.openai':{auth:{type:'none'}}}}}});
 await json(`${dir}/.claude-plugin/plugin.json`,{...base,displayName:`${title} Design Language`});
 await json(`${dir}/.mcp.json`,{mcpServers:{[family]:{type:'http',url:distribution.families[family].mcp.url}}});
 // These copies are portable plugin components, not a second authority for the skill.
 for(const file of await readdir(`skills/${family}-builder/references`))assert.equal(await readFile(`${dir}/skills/${family}-builder/references/${file}`,'utf8'),await readFile(`skills/${family}-builder/references/${file}`,'utf8'));
 console.log(`Built ${name}: matching skill, source mark and remote MCP configurations`);
}
