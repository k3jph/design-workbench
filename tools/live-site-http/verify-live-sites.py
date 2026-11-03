#!/usr/bin/env python3
"""Bounded, read-only HTTP integrity/link verification for the eight final hosts.

Production execution requires --live-ready. Local origin mappings exercise the
same checks without confusing not-yet-provisioned DNS with final failures.
"""
import argparse,base64,concurrent.futures,hashlib,html,json,mimetypes,pathlib,re,socket,threading,time,urllib.error,urllib.parse,urllib.request
from html.parser import HTMLParser
from collections import defaultdict

ROOT=pathlib.Path(__file__).resolve().parent
FAMILIES=['martlet','krigsvold'];FRAMEWORKS=['astro','react','jekyll']
HOSTS={f'{prefix}{family}design.dev' for family in FAMILIES for prefix in ['', 'astro.','react.','jekyll.']}
STAGED_ORIGIN_MAP={'https://jekyll.martletdesign.dev':'https://martletdesign-jekyll-reference.k3jph.workers.dev','https://jekyll.krigsvolddesign.dev':'https://krigsvolddesign-jekyll-reference.k3jph.workers.dev'}
STAGED_ORIGINS=set(STAGED_ORIGIN_MAP.values())
EXTERNAL={'github.com','api.github.com','objects.githubusercontent.com','release-assets.githubusercontent.com','registry.npmjs.org','www.npmjs.com','npmjs.com','martlettheme.dev','krigsvoldtheme.dev','www.martlettheme.dev','www.krigsvoldtheme.dev'}
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 NightjarVerification/1.0'
def sha(data):return hashlib.sha256(data).hexdigest()
def safe_url(value):
 try:
  p=urllib.parse.urlsplit(value);query=p.query
  if query and p.hostname not in HOSTS and p.hostname not in ['127.0.0.1','localhost']:query='[redacted]'
  elif query:
   private={'token','access_token','secret','password','api_key','apikey','authorization','signature','x-amz-signature','jwt'}
   query='&'.join(part.split('=',1)[0]+'=[redacted]' if urllib.parse.unquote_plus(part.split('=',1)[0]).lower() in private else part for part in query.split('&'))
  return urllib.parse.urlunsplit((p.scheme,p.netloc.rsplit('@',1)[-1],p.path,query,p.fragment))
 except ValueError:return '[invalid URL redacted]'
def safe_detail(value):
 if isinstance(value,(tuple,list)):return [safe_detail(item) for item in value]
 if isinstance(value,str):return re.sub(r'https?://[^\s\"\']+',lambda match:safe_url(match.group(0)),value)
 return value
def require(ok,message):
 if not ok:raise AssertionError(message)
def load(path,default=None):
 try:return json.loads(pathlib.Path(path).read_text())
 except FileNotFoundError:return default

class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):return None
class Document(HTMLParser):
 def __init__(self,data):
  super().__init__(convert_charrefs=True);self.ids=set();self.duplicates=[];self.links=[];self.title=[];self.in_title=False;self.h1=0;self.main=0;self.lang=None;self.explicit_families=[];self.scripts=[];self.meta={};self.all_text=[];self.feed(data.decode('utf-8','replace'))
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='html':self.lang=a.get('lang')
  if tag=='title':self.in_title=True
  if tag=='h1':self.h1+=1
  if tag=='main':self.main+=1
  if a.get('id'):
   if a['id'] in self.ids:self.duplicates.append(a['id'])
   self.ids.add(a['id'])
  if tag in ['html','body']:
   for family in FAMILIES:
    if 'data-'+family in a or family in a.get('class','').split():self.explicit_families.append(family)
  for key in ['data-family','data-nightjar-family','data-design-family']:
   if a.get(key):self.explicit_families.append(a[key])
  for key in ['href','src','poster']:
   if a.get(key):self.links.append((a[key],tag,key))
  if a.get('srcset'):
   for item in a['srcset'].split(','):
    if item.strip():self.links.append((item.strip().split()[0],tag,'srcset'))
  if tag=='script' and a.get('src'):self.scripts.append(a['src'])
  if tag=='meta' and a.get('name'):self.meta[a['name']]=a.get('content','')
 def handle_endtag(self,tag):
  if tag=='title':self.in_title=False
 def handle_data(self,data):
  if self.in_title:self.title.append(data)
  self.all_text.append(data)

class Transport:
 def __init__(self,origin_map,deadline,concurrency=4,timeout=20):
  self.origin_map={k.rstrip('/'):v.rstrip('/') for k,v in origin_map.items()};self.deadline=deadline;self.timeout=timeout;self.semaphore=threading.Semaphore(concurrency);self.lock=threading.Lock();self.cache={};self.operations=[];self.opener=urllib.request.build_opener(NoRedirect())
 def allowed(self,url):
  p=urllib.parse.urlsplit(url)
  require(not p.username and not p.password,'Credential-bearing URLs are not followed')
  require(p.scheme=='https' and p.hostname in HOSTS|EXTERNAL|{urllib.parse.urlsplit(u).hostname for u in self.origin_map.values() if u in STAGED_ORIGINS} and p.port in [None,443] or p.scheme=='http' and p.hostname in ['127.0.0.1','localhost'] and self.origin_map,'URL outside the explicit read-only allowlist: '+safe_url(url))
 def logical_url(self,url):
  p=urllib.parse.urlsplit(url);origin=p.scheme+'://'+p.netloc
  for logical,wire in self.origin_map.items():
   if origin==wire:return logical+urllib.parse.urlunsplit(('','',p.path,p.query,p.fragment))
  return url
 def wire_url(self,url):
  p=urllib.parse.urlsplit(url);origin=p.scheme+'://'+p.netloc
  if origin in self.origin_map:return self.origin_map[origin]+urllib.parse.urlunsplit(('','',p.path,p.query,''))
  return urllib.parse.urldefrag(url)[0]
 def request(self,url,method='GET',body=None,mcp=False):
  self.allowed(url)
  require(method in ['GET','HEAD'] or method=='POST' and mcp,'Only GET/HEAD and explicit read-only MCP POST are allowed')
  if mcp:
   value=json.loads(body);require(value.get('method') in ['initialize','tools/list','tools/call'],'Unexpected MCP method')
   if value.get('method')=='tools/call':require(value.get('params',{}).get('name')=='get_manifest','Only get_manifest is callable')
  key=(method,urllib.parse.urldefrag(url)[0],body)
  with self.lock:
   existing=self.cache.get(key)
   if existing is None:existing=concurrent.futures.Future();self.cache[key]=existing;owner=True
   else:owner=False
  if not owner:return existing.result(timeout=max(1,min(120,self.deadline-time.monotonic())))
  began=time.monotonic()
  try:
   result=self._request(url,method,body,mcp);existing.set_result(result);return result
  except BaseException as error:
   with self.lock:self.operations.append({'url':safe_url(url),'method':method,'status':None,'error':type(error).__name__+': '+safe_detail(str(error))[:800],'elapsedMs':round((time.monotonic()-began)*1000)})
   existing.set_exception(error);raise
 def _request(self,url,method,body,mcp):
  start=time.monotonic();operation_deadline=min(self.deadline,start+self.timeout);current=url;redirects=[]
  with self.semaphore:
   for hop in range(7):
    require(time.monotonic()<operation_deadline,'HTTP operation deadline exceeded')
    headers={'User-Agent':UA,'Accept-Encoding':'identity','Accept':'application/json, text/event-stream' if mcp else '*/*'}
    if body is not None:headers['Content-Type']='application/json';headers['MCP-Protocol-Version']='2025-06-18'
    req=urllib.request.Request(self.wire_url(current),data=body,headers=headers,method=method)
    try:
     response=self.opener.open(req,timeout=max(0.1,min(self.timeout,operation_deadline-time.monotonic())))
    except urllib.error.HTTPError as error:response=error
    status=response.code;rh={k.lower():v for k,v in response.headers.items()}
    if status in [301,302,303,307,308] and 'location' in rh:
     wire_location=urllib.parse.urljoin(self.wire_url(current),rh['location']);self.allowed(wire_location);location=self.logical_url(wire_location);redirects.append({'status':status,'from':safe_url(current),'to':safe_url(location),'wireRedirectTo':safe_url(wire_location)})
     response.close();require(method in ['GET','HEAD'],'Read-only MCP requests must not redirect');current=location;continue
    try:data=self.read_body(response,method,operation_deadline)
    finally:response.close()
    result={'url':url,'finalUrl':current,'status':status,'headers':rh,'body':data,'sha256':sha(data),'bytes':len(data),'redirects':redirects,'elapsedMs':round((time.monotonic()-start)*1000)}
    record={k:v for k,v in result.items() if k not in ['body','headers']};record['url']=safe_url(record['url']);record['finalUrl']=safe_url(record['finalUrl']);record['contentType']=rh.get('content-type');record['method']=method;record['wireUrl']=safe_url(self.wire_url(current))
    with self.lock:self.operations.append(record)
    return result
   raise AssertionError('Redirect limit exceeded: '+safe_url(url))

 def read_body(self,response,method,operation_deadline):
  chunks=[];size=0;body_deadline=min(self.deadline,operation_deadline,time.monotonic()+30)
  if method=='HEAD':return b''
  while True:
   require(time.monotonic()<body_deadline,'Response body deadline exceeded')
   for attributes in [('fp','raw','_sock'),('fp','fp','raw','_sock')]:
    sock=response
    for attribute in attributes:sock=getattr(sock,attribute,None)
    if sock is not None and hasattr(sock,'settimeout'):
     sock.settimeout(max(0.1,min(self.timeout,body_deadline-time.monotonic())));break
   chunk=response.read1(65536) if hasattr(response,'read1') else response.read(65536)
   if not chunk:break
   size+=len(chunk);require(size<=32*1024*1024,'Response exceeded the 32 MiB verification limit');chunks.append(chunk)
  data=b''.join(chunks);length=response.headers.get('Content-Length')
  if length is not None:require(length.isdigit() and int(length)==len(data),'Truncated or invalid-length HTTP response')
  return data

class Verifier:
 def __init__(self,args):
  self.args=args;self.deadline=time.monotonic()+args.overall_timeout;self.http=Transport(args.origin_map,self.deadline,args.concurrency,args.request_timeout);self.documents={};self.doc_lock=threading.Lock();self.results=[];self.targets=self.targets_from_inputs();self.case_failures=[];self.canonical=(load(ROOT/'canonical-recipes.json') or load(ROOT/'martlet-jekyll/_data/examples.json'))['pages'];require(len(self.canonical)==50 and len({p['id'] for p in self.canonical})==50,'Expected 50 unique canonical recipe definitions')
 def targets_from_inputs(self):
  base=load(self.args.manifest,{'targets':[]})['targets'];by_host={urllib.parse.urlsplit(t['url']).hostname:t.copy() for t in base};result=[]
  overrides=load(self.args.expectations,{}).get('hosts',{}) if self.args.expectations else {}
  astro=load(ROOT/'astro-deploy-artifacts.json',[])
  react=load(ROOT/'react-results.json',{}).get('families',[])
  websites=load(ROOT/'website-results.json',{}).get('families',[])
  for family in FAMILIES:
   for framework in [None,*FRAMEWORKS]:
    host=(framework+'.' if framework else '')+family+'design.dev'
    if self.args.hosts and host not in self.args.hosts:continue
    if not self.args.hosts and by_host and host not in by_host:continue
    t=by_host.get(host,{'family':family,'role':'reference' if framework else 'main','framework':framework,'url':'https://'+host+'/','routes':[]});t['host']=host;t.setdefault('framework',framework)
    t['artifactRoot']=str(ROOT/'deploy-ready'/(family+'-'+framework)) if framework else str(ROOT/(family+'-website')/'dist')
    if not framework:
     website=next((x for x in websites if x.get('repository')==family+'design/website'),{});t['sourceCommit']=website.get('mainCommit',website.get('main',website.get('head')));t['sourceTree']=website.get('mainTree',website.get('sourceTree'));t['deploymentReady']=website.get('deploymentReady') is True
     handoff=load(ROOT/(family+'-website')/'worker/handoff.json',{})
     t['expectedHealth']={k:v for k,v in {'sourceCommit':handoff.get('source',{}).get('commit'),'sourceDigest':handoff.get('source',{}).get('sourceDigest')}.items() if v}
     t['expectedDownloadHashes']={'/agents/'+name:item['sha256'] for name,item in handoff.get('files',{}).items() if name.endswith(('.zip','.tar.gz'))}
    if framework=='jekyll':t['version']='1.0.0';t['proofPath']='/deployment-proof.json';t['sourceCommit']=load(ROOT/(family+'-jekyll-source-release-proof.json'),{}).get('sourceCommit');t.setdefault('downloads',[]).append({'path':'/template.zip','sha256':load(ROOT/(family+'-jekyll-source-release-proof.json'),{}).get('sourceZipSha256'),'releaseEvidence':str(ROOT/(family+'-jekyll-published-verification.json'))})
    elif framework=='astro':
     a=next((x for x in astro if x['family']==family),{});p=a.get('proof',{});t['artifactRoot']=a.get('artifactRoot',t['artifactRoot']);t['version']=p.get('version','2.0.0');t['proofPath']='/release.json';t['sourceCommit']=a.get('sourceCommit');t.setdefault('downloads',[]).append({'path':f'/downloads/{family}-astro-{t["version"]}.tgz','sha256':p.get('packageArchiveSha256'),'registryPackage':'@'+family+'/astro','version':t['version']})
    elif framework=='react':
     a=next((x for x in react if x['family']==family),{});t['version']=a.get('version','0.2.0');t['proofPath']='/version.json';t['sourceCommit']=a.get('mainSourceCommit',a.get('sourceHead'));t.setdefault('downloads',[]).append({'path':f'/downloads/{family}-react-{t["version"]}.tgz','sha256':a.get('artifact',{}).get('sha256'),'registryPackage':'@'+family+'/react','version':t['version']})
    if framework=='react':
     handoff=load(ROOT/(family+'-website')/'worker/handoff.json',{});t.setdefault('expectedDownloadHashes',{'/agents/'+name:item['sha256'] for name,item in handoff.get('files',{}).items() if name.endswith(('.zip','.tar.gz'))})
    t.update(overrides.get(host,{}))
    if framework=='react' and 'downloads' not in overrides.get(host,{}):
     for download in t.get('downloads',[]):
      if download.get('path') and not (pathlib.Path(t['artifactRoot'])/download['path'].lstrip('/')).is_file():download['path']=None
    result.append(t)
  require(result,'No hosts selected')
  if self.args.stage_ready:require(all(t['url'].rstrip('/') in STAGED_ORIGIN_MAP for t in result),'Staged runs must select only the two authorized Jekyll targets')
  return result
 def call(self,t,path,method='GET',**kwargs):return self.http.request(urllib.parse.urljoin(t['url'],path),method,**kwargs)
 def parallel(self,fn,items):
  def inspect(item):
   try:return fn(item),None
   except Exception as error:return None,{'item':str(safe_detail(item))[:500],'error':type(error).__name__+': '+safe_detail(str(error))[:1200]}
  with concurrent.futures.ThreadPoolExecutor(max_workers=self.args.concurrency) as pool:results=list(pool.map(inspect,items))
  failures=[error for _,error in results if error]
  with self.doc_lock:self.case_failures+=failures
  require(not failures,'Failed '+str(len(failures))+' independent cases: '+json.dumps(failures[:8]))
  return [value for value,_ in results]
 def check(self,checks,name,fn):
  start=time.monotonic()
  try:value=fn();record={'name':name,'status':'passed','elapsedMs':round((time.monotonic()-start)*1000),'evidence':value}
  except Exception as error:record={'name':name,'status':'failed','elapsedMs':round((time.monotonic()-start)*1000),'error':type(error).__name__+': '+safe_detail(str(error))[:1400]}
  checks.append(record);return record
 def document(self,url,canonical=False,family=None):
  r=self.http.request(url);require(r['status']==200,f'Expected HTML 200, got {r["status"]}: '+safe_url(url));require('text/html' in r['headers'].get('content-type',''),'Unexpected HTML MIME: '+safe_url(url))
  with self.doc_lock:d=self.documents.get(r['finalUrl'])
  if d is None:
   d=Document(r['body'])
   with self.doc_lock:self.documents[r['finalUrl']]=d
  require(not d.duplicates,'Duplicate document IDs: '+str(d.duplicates[:5])+' at '+safe_url(url))
  if canonical:require(d.main==1 and d.h1==1,f'Canonical page requires one main/h1; got {d.main}/{d.h1}: '+safe_url(url))
  if family:
   if d.explicit_families:require(all(v==family for v in d.explicit_families),'Incorrect explicit family identity')
   require(family in ''.join(d.title).lower() or family in d.explicit_families,'Family identity absent from document title/marker: '+safe_url(url))
  return r,d
 def local_hash(self,t,path,result):
  final=urllib.parse.urlsplit(result.get('finalUrl',''))
  if final.hostname==t['host']:path=final.path
  expected=t.get('expectedFileHashes',{})
  relative_key=urllib.parse.unquote(urllib.parse.urlsplit(path).path).lstrip('/')
  require('..' not in pathlib.PurePosixPath(relative_key).parts,'Unsafe expected-file lookup')
  for key in [relative_key,relative_key.rstrip('/')+'/index.html' if relative_key else 'index.html']:
   if key in expected:
    record=expected[key];digest=record.get('sha256') if isinstance(record,dict) else record
    require(result['sha256']==digest,'Live bytes differ from independently pinned artifact: '+path)
    if isinstance(record,dict) and 'size' in record:require(result['bytes']==record['size'],'Live size differs from independently pinned artifact: '+path)
    return True
  if not t.get('artifactRoot'):return None
  root=pathlib.Path(t['artifactRoot']).resolve();relative=pathlib.PurePosixPath(urllib.parse.unquote(urllib.parse.urlsplit(path).path).lstrip('/'))
  require('..' not in relative.parts,'Unsafe artifact lookup path')
  local=root.joinpath(*relative.parts).resolve();require(local.is_relative_to(root),'Artifact lookup escaped its reviewed root')
  if local.is_dir():local=local/'index.html'
  if local.is_file():require(sha(local.read_bytes())==result['sha256'],'Live bytes differ from reviewed local artifact: '+path);return True
  return None
 def mime(self,url,result):
  path=urllib.parse.urlsplit(url).path.lower();ctype=result['headers'].get('content-type','').lower()
  if path.endswith('.css'):require('text/css' in ctype,'CSS asset resolved to incorrect MIME: '+safe_url(url))
  elif path.endswith(('.js','.mjs')):require('javascript' in ctype or 'ecmascript' in ctype,'JavaScript asset resolved to incorrect MIME: '+safe_url(url))
  elif path.endswith('.svg'):require('image/svg+xml' in ctype,'SVG asset resolved to incorrect MIME: '+safe_url(url))
  elif path.endswith(('.woff','.woff2','.ttf','.otf')):require('font' in ctype or 'octet-stream' in ctype,'Font asset resolved to incorrect MIME: '+safe_url(url))
  elif path.endswith(('.png','.jpg','.jpeg','.webp','.gif','.avif')):require(ctype.startswith('image/'),'Image asset resolved to incorrect MIME: '+safe_url(url))
  elif path.endswith(('.zip','.tgz','.tar.gz','.pdf','.csv','.json')):require('text/html' not in ctype,'Non-HTML download/data asset resolved to an HTML fallback: '+safe_url(url))
 def verify_links(self,t,pages):
  links={};assets=[];deferred=[];external=set()
  for url in pages:
   _,d=self.document(url)
   for value,tag,kind in d.links:
    p=urllib.parse.urlsplit(value)
    if p.scheme in ['mailto','tel','data','blob']:continue
    require(not p.scheme or p.scheme in ['https','http'],'Unexpected link scheme: '+value[:120])
    absolute=urllib.parse.urljoin(url,value);u=urllib.parse.urlsplit(absolute)
    if u.hostname not in HOSTS and not(u.hostname in ['127.0.0.1','localhost'] and self.args.origin_map):external.add(safe_url(absolute));continue
    if not self.args.live_ready and u.scheme+'://'+u.netloc not in self.args.origin_map:external.add(safe_url(absolute)+' [not requested before deployment ready]');continue
    fragment=urllib.parse.unquote(u.fragment);plain=urllib.parse.urldefrag(absolute)[0];links[(plain,fragment)]=(tag,kind)
  def one(item):
   (url,fragment),(tag,kind)=item;r=self.http.request(url);require(r['status']==200,f'Broken linked destination {r["status"]}: '+safe_url(url))
   ctype=r['headers'].get('content-type','');self.mime(url,r)
   target=next((target for target in self.targets if target['host']==urllib.parse.urlsplit(url).hostname),None)
   if target:
    query=urllib.parse.parse_qs(urllib.parse.urlsplit(r['finalUrl']).query,keep_blank_values=True)
    if target.get('framework')=='react' and set(query)&{'component','page','workspace'}:
     expected=target.get('legacyReferenceHtmlSha256');require(expected and r['sha256']==expected,'Legacy query did not deliver its reviewed reference HTML')
    else:self.local_hash(target,urllib.parse.urlsplit(r['finalUrl']).path,r)
   if fragment and ('text/html' in ctype or 'image/svg+xml' in ctype):
    d=Document(r['body'])
    if fragment not in d.ids:
     # The preserved component reference renders its dynamic anchors client-side.
     if '/?component=' in url or '/?page=' in url or d.main==0 and d.scripts:deferred.append({'url':safe_url(url),'fragment':fragment,'reason':'client-rendered anchor; browser compatibility gate required'})
     else:raise AssertionError('Missing linked fragment '+fragment+' at '+safe_url(url))
   if 'text/css' in ctype:return self.css_assets(url,r['body'])
   return []
  for more in self.parallel(one,list(links.items())):assets+=more
  seen=set()
  for depth in range(8):
   pending=[u for u in assets if u not in seen];assets=[]
   if not pending:break
   seen.update(pending)
   for more in self.parallel(lambda u:one(((u,''),('css','url'))),pending):assets+=more
  require(not [u for u in assets if u not in seen],'CSS import depth exceeded its bound')
  return {'linkedDestinationsAndFragments':len(links),'cssAssets':len(seen),'clientRenderedFragmentsDeferredToBrowser':deferred,'outOfScopeExternalLinksNotFetched':sorted(external)}
 def css_assets(self,url,body):
  text=body.decode('utf-8','replace');values=re.findall(r'url\(\s*[\'\"]?([^\)\'\"]+)',text)+re.findall(r'@import\s+[\'\"]([^\'\"]+)',text);out=[]
  for value in values:
   value=value.strip()
   if value.startswith(('data:','#','blob:')):continue
   dest=urllib.parse.urljoin(url,value)
   if urllib.parse.urlsplit(dest).hostname in HOSTS or self.args.origin_map:out.append(urllib.parse.urldefrag(dest)[0])
  return out
 def reference(self,t,checks):
  pages=[]
  for prefix in ['', '/preview']:
   paths=[prefix+'/',prefix+'/examples/',*[prefix+'/examples/'+p['id']+'/' for p in self.canonical]]
   def verify(path):
    r,d=self.document(urllib.parse.urljoin(t['url'],path),canonical='/examples/' in path and path.rstrip('/')!=prefix+'/examples',family=t['family']);require(self.local_hash(t,path,r) is True,'Missing independent reviewed HTML pin: '+path);return r['url']
   pages+=self.parallel(verify,paths)
   version=t['version'];vroot=prefix+'/docs/v/'+version+'/'
   version_paths=[vroot,*[vroot+'examples/'+p['id']+'/' for p in self.canonical],prefix+'/docs/versions/']
   def version_page(path):
    r,d=self.document(urllib.parse.urljoin(t['url'],path),canonical='/examples/' in path,family=t['family'] if '/examples/' in path else None)
    require('noindex' in d.meta.get('robots','').lower(),'Versioned documentation must declare noindex: '+path);require(self.local_hash(t,path,r) is True,'Missing independent reviewed HTML pin: '+path);return r['url']
   pages+=self.parallel(version_page,version_paths)
  unique=list(dict.fromkeys(pages));return {'documents':len(unique),'canonicalRecipeRoutes':200,'links':self.verify_links(t,unique)}
 def snapshots(self,t):
  evidence=[]
  for prefix in ['', '/preview']:
   base=prefix+'/docs/v/'+t['version']+'/'
   name='nightjar-local-evidence.json' if t['framework']=='jekyll' else 'manifest.json'
   response=self.call(t,base+name);require(response['status']==200,'Static snapshot manifest missing');require(self.local_hash(t,base+name,response) is True,'Snapshot inventory lacks an independent reviewed artifact pin')
   manifest=json.loads(response['body']);require(manifest.get('family')==t['family'] and manifest.get('framework')==t['framework'],'Snapshot identity mismatch')
   require(manifest.get('version',manifest.get('docsVersion'))==t['version'],'Snapshot version mismatch')
   require(manifest.get('base_path',manifest.get('basePath'))==base,'Snapshot base path mismatch')
   entries=manifest.get('files',[]);require(entries and len({item['path'] for item in entries})==len(entries),'Snapshot file inventory is empty or duplicated')
   def one(item):
    path=pathlib.PurePosixPath(item['path']);require(not path.is_absolute() and '..' not in path.parts and str(path)==item['path'],'Unsafe snapshot file path')
    result=self.call(t,base+item['path']);require(result['status']==200,'Snapshot member unavailable: '+item['path']);self.mime(result['finalUrl'],result)
    require(result['bytes']==item['size'] and result['sha256']==item['sha256'],'Snapshot member integrity mismatch: '+item['path']);return result['sha256']
   self.parallel(one,entries)
   source=manifest.get('implementation_commit') if t['framework']=='jekyll' else manifest.get('source',{}).get('commit')
   if source is not None:require(re.fullmatch('[0-9a-f]{40}',source),'Invalid snapshot source commit')
   evidence.append({'basePath':base,'manifestSha256':response['sha256'],'completeFilesVerified':len(entries),'snapshotSourceCommit':source,'deployedMainSourceCommit':t.get('sourceCommit'),'snapshotSourceMatchesMain':source==t.get('sourceCommit') if source else None,'authenticatedStorageOrAntiRollbackClaimed':False})
  return evidence
 def proof(self,t):
  r=self.call(t,t['proofPath']);require(r['status']==200,'Missing source proof');require(self.local_hash(t,t['proofPath'],r) is True,'Source proof bytes lack an independent artifact pin');d=json.loads(r['body']);require(d.get('family')==t['family'],'Proof family mismatch');require(d.get('framework')==t['framework'],'Proof framework mismatch')
  source=d.get('sourceCommit') or d.get('mainCommit') or d.get('buildSourceCommit') or d.get('source',{}).get('commit')
  require(t.get('sourceCommit') and source==t['sourceCommit'],'Source proof does not match independently expected commit')
  require(re.fullmatch('[0-9a-f]{40}',source or ''),'Invalid source commit identity')
  if 'mainCommit' in d:require(d['mainCommit']==source,'Artifact proof is not bound to merged main')
  require(not any(label in str(d.get('sourceStatus','')).lower() for label in ['candidate','rehearsal','pending']),'A candidate/rehearsal artifact is not a final deployed source proof')
  repository=d.get('sourceRepository') or d.get('repository') or d.get('source',{}).get('repository');require(repository==t['family']+'design/'+t['framework'],'Proof repository identity mismatch')
  package=d.get('package')
  if package is not None:require((package.get('name') if isinstance(package,dict) else package)=='@'+t['family']+'/'+t['framework'],'Proof package identity mismatch')
  if t['framework'] in ['astro','react']:
   core=d.get('core',{});published=load(ROOT/(t['family']+'-core-registry-bytes.json'),{});expected_version='2.2.3' if t['family']=='martlet' else '2.2.4'
   require(core.get('name')=='@'+t['family']+'/core' and core.get('version')==expected_version,'Proof Core package identity differs')
   require(core.get('integrity')==published.get('dist',{}).get('integrity'),'Proof Core integrity is not the independently verified registry identity')
  if d.get('deliveryMode')=='native-cloudflare-static-assets':require(d.get('runtimeSecrets') is False,'Native static delivery must not advertise runtime secrets')
  disabled=d.get('advancedArchiveEnabled') is False or d.get('advancedArchive',{}).get('enabled') is False or d.get('delivery',{}).get('advancedArchive',{}).get('enabled') is False
  require(disabled,'Advanced archive pathway must be explicitly disabled')
  if 'runtimeBindings' in d:require(d['runtimeBindings']==['ASSETS'],'Unexpected runtime binding claim')
  require(d.get('version',d.get('package',{}).get('version'))==t['version'],'Proof version mismatch');return {'sourceCommit':source,'version':t['version'],'sha256':r['sha256'],'advancedArchiveEnabled':False}
 def downloads(self,t):
  evidence=[]
  for item in t.get('downloads',[]):
   require(item.get('sha256'),'Missing independently reviewed download SHA-256');paths=[item['path']] if item.get('path') else []
   if t['role']=='reference' and item.get('path') and (t.get('framework')=='jekyll' or item.get('previewPath') or t.get('artifactRoot') and (pathlib.Path(t['artifactRoot'])/('preview'+item['path'])).is_file()):paths.append(item.get('previewPath','/preview'+item['path']))
   if t.get('framework')=='jekyll':paths += [f'/docs/v/{t["version"]}/template.zip',f'/preview/docs/v/{t["version"]}/template.zip']
   for path in paths:
    r=self.call(t,path);require(r['status']==200,'Download failed '+path);self.mime(r['finalUrl'],r);require(r['sha256']==item['sha256'],'Download differs from reviewed/published bytes: '+path)
    h=self.call(t,path,'HEAD');require(h['status']==200,'Download HEAD failed '+path)
    if h['headers'].get('content-length') is not None:require(int(h['headers']['content-length'])==r['bytes'],'HEAD/GET download size differs: '+path)
    evidence.append({'path':path,'sha256':r['sha256'],'bytes':r['bytes'],'headStatus':h['status']})
   if self.args.live_ready and item.get('registryPackage'):
    package=item['registryPackage'];version=item['version'];r=self.http.request('https://registry.npmjs.org/'+urllib.parse.quote(package,safe='@')+'/'+version);require(r['status']==200,'Genuine registry version is not published');metadata=json.loads(r['body']);require(metadata.get('name')==package and metadata.get('version')==version,'Registry package identity differs')
    dist=metadata['dist'];tar=self.http.request(dist['tarball']);require(tar['status']==200 and tar['sha256']==item['sha256'],'Registry archive differs from public reviewed download');integrity='sha512-'+base64.b64encode(hashlib.sha512(tar['body']).digest()).decode();require(dist['integrity']==integrity,'Registry SHA-512 mismatch');evidence.append({'registryPackage':package,'version':version,'registryIntegrity':integrity,'sha256':tar['sha256'],'attestationMetadataPresent':bool(dist.get('attestations'))})
   if (self.args.live_ready or self.args.stage_ready) and item.get('releaseEvidence'):
    release_path=pathlib.Path(item['releaseEvidence']);record=load(release_path if release_path.is_absolute() else ROOT/release_path);require(record and record.get('reviewedBytesMatched'),'Missing independent published release evidence')
    require(record['sourceCommit']==t['sourceCommit'] and record['sourceZipSha256']==item['sha256'],'Published source proof differs')
    asset=next(a for a in record['assets'] if a['name']=='source.zip');r=self.http.request(asset['url']);require(r['status']==200 and r['sha256']==item['sha256'],'GitHub release source ZIP differs');evidence.append({'releaseUrl':record['releaseUrl'],'sourceZipSha256':r['sha256'],'administratorImmutable':record.get('immutable') is True})
  return evidence
 def ui_attribution(self,t):
  require(t.get('deploymentReady') is True,'Private-site artifact is not marked final/deployment-ready')
  require(re.fullmatch('[0-9a-f]{40}',t.get('sourceCommit') or ''),'Missing independently expected private-site UI source commit')
  require(t.get('artifactRoot') and pathlib.Path(t['artifactRoot']).is_dir(),'Missing reviewed private-site static artifact')
  if t.get('sourceTree'):require(re.fullmatch('[0-9a-f]{40}',t['sourceTree']),'Invalid private-site source tree')
  r=self.call(t,'/');require(self.local_hash(t,'/',r) is True,'Main UI bytes cannot be attributed to the reviewed static artifact')
  return {'privateSourceRepository':t['family']+'design/website','uiSourceCommit':t['sourceCommit'],'uiSourceTree':t.get('sourceTree'),'reviewedRootHtmlSha256':r['sha256'],'MCPGuidanceCommitIsNotUISource':True,'CloudflareVersionSourceLinkage':'coordinator deployment record'}
 def main_pages(self,t):
  paths=['/',*t.get('routes',[])];pages=[]
  for path in paths:
   r,d=self.document(urllib.parse.urljoin(t['url'],path),family=t['family']);require(d.main>=1 and d.h1>=1,'Main page lacks main/heading');require(self.local_hash(t,path,r) is True,'Main page lacks reviewed static artifact pin: '+path);pages.append(r['url'])
  return {'documents':len(pages),'links':self.verify_links(t,pages)}
 def health(self,t):
  r=self.call(t,'/health');require(r['status']==200,'Health endpoint missing');d=json.loads(r['body']);require(d.get('family')==t['family'],'Health family mismatch');require(d.get('readOnly') is True or d.get('read_only') is True,'Main worker must advertise read-only mode');require(t.get('expectedHealth',{}).get('sourceCommit') and t.get('expectedHealth',{}).get('sourceDigest'),'Missing independent main worker handoff pin')
  for key,value in t['expectedHealth'].items():require(d.get(key)==value,'Health source pin mismatch: '+key)
  return d
 def legacy_theme(self,t):
  out=[]
  for path,expected in [('/theme','/design-system/'),('/theme/','/design-system/'),('/theme/agents/?nightjar=compatibility','/agents/?nightjar=compatibility')]:
   r=self.call(t,path);require(r['redirects'],'Legacy theme path must redirect');first=r['redirects'][0];require(first['status'] in [301,308],'Legacy theme redirect must be permanent');require(urllib.parse.urlsplit(r['finalUrl']).hostname==t['host'],'Legacy theme redirect escaped family host');require(urllib.parse.urlsplit(first['to']).path==urllib.parse.urlsplit(expected).path and urllib.parse.urlsplit(first['to']).query==urllib.parse.urlsplit(expected).query,'Legacy theme path/query mapping differs');require(r['status']==200,'Legacy theme destination does not resolve');out.append({'path':path,'finalUrl':safe_url(r['finalUrl']),'status':r['status']})
  return out
 def mcp(self,t):
  r=self.call(t,'/mcp');require(r['status'] in [200,405],'Unexpected MCP GET response')
  def rpc(method,params=None,ident=1):
   payload={'jsonrpc':'2.0','id':ident,'method':method}
   if params is not None:payload['params']=params
   response=self.call(t,'/mcp','POST',body=json.dumps(payload).encode(),mcp=True);require(response['status']==200,'Read-only MCP request failed')
   text=response['body'].decode()
   try:value=json.loads(text)
   except ValueError:
    values=[json.loads(line[5:].strip()) for line in text.splitlines() if line.startswith('data:')];require(values,'No MCP SSE data');value=next((v for v in values if v.get('id')==ident),values[-1])
   require('error' not in value,'MCP returned a protocol error');return value['result']
  tools=rpc('tools/list');names=[x['name'] for x in tools.get('tools',[])];require(set(names)=={'get_manifest','get_reference','search_guidance'},'Public MCP tool set differs from the reviewed read-only interface')
  value=rpc('tools/call',{'name':'get_manifest','arguments':{}},2);parts=[c['text'] for c in value.get('content',[]) if c.get('type')=='text'];require(parts,'Manifest result missing text');manifest=json.loads('\n'.join(parts));require(manifest.get('family')==t['family'],'MCP manifest family mismatch')
  return {'getStatus':r['status'],'toolNames':names,'manifestFamily':manifest['family'],'manifestSha256':sha(json.dumps(manifest,sort_keys=True).encode()),'snapshotVersion':manifest.get('version',manifest.get('snapshotVersion'))}
 def legacy_react(self,t):
  contract=load(ROOT/'legacy-react-reference-contract.json');require(contract,'Legacy React contract missing');out=[]
  queries=['',*['page='+p for p in contract['pageQueries']], 'page=components','page=__nightjar_unknown__','workspace','workspace=0',*['component='+name for name in contract['componentQueryNames']]]
  if t['role']=='main':
   bare=self.call(t,'/react?component=Button');require(bare['status']==200 and bare['redirects'] and bare['redirects'][0]['status'] in [301,308],'No-slash React reference did not permanently forward');require(urllib.parse.urlsplit(bare['finalUrl']).hostname=='react.'+t['family']+'design.dev' and urllib.parse.urlsplit(bare['finalUrl']).query=='component=Button','No-slash React query mapping differs');out.append({'path':'/react?component=Button','finalUrl':safe_url(bare['finalUrl'])})
  for query in queries:
   path=('/react/' if t['role']=='main' else '/')+('?' + query if query else '');r=self.call(t,path);require(r['status']==200,'Legacy React query destination failed')
   require(urllib.parse.urlsplit(r['finalUrl']).hostname=='react.'+t['family']+'design.dev','Legacy React escaped the independent reference host');require(urllib.parse.urlsplit(r['finalUrl']).query==query,'Legacy React query was not preserved exactly')
   if t['role']=='main':require(r['redirects'] and r['redirects'][0]['status'] in [301,308],'Main legacy reference must permanently forward')
   _,d=self.document(r['finalUrl']);require(d.scripts,'Legacy React must deliver its actual reference application')
   expected=t.get('legacyReferenceHtmlSha256') or next((x.get('legacyReferenceHtmlSha256') for x in self.targets if x.get('framework')=='react' and x['family']==t['family']),None)
   require(expected,'Independent legacy reference HTML hash is required before declaring compatibility delivery')
   require(r['sha256']==expected,'Legacy query did not deliver the preserved component-reference application')
   out.append({'query':query,'finalUrl':safe_url(r['finalUrl']),'scriptAssets':d.scripts})
  for path in contract['agentDownloadPaths'][t['family']]:
   r=self.call(t,path);require(r['status']==200 and r['bytes']>100,'Agent download is unavailable');out.append({'agentDownload':path,'sha256':r['sha256'],'bytes':r['bytes'],'publishedHashComparison':'matched'})
   require(path in t.get('expectedDownloadHashes',{}),'Independent agent bundle hash is required');require(r['sha256']==t['expectedDownloadHashes'][path],'Agent download differs from reviewed bundle')
  return {'HTTPTransportPassed':True,'queryCount':len(queries),'actualQueryDOMVerification':'delegated to independent live browser compatibility gate; HTTP 200 alone is not success','cases':out}
 def verify_target(self,t):
  checks=[];start=time.monotonic();self.check(checks,'root GET/HEAD and family identity',lambda:self.root(t))
  if t['role']=='reference':
   self.check(checks,'reviewed source/deployment proof',lambda:self.proof(t));self.check(checks,'50 recipes, root/preview, versioned docs, assets and fragments',lambda:self.reference(t,checks));self.check(checks,'complete static snapshot inventory and file integrity',lambda:self.snapshots(t));self.check(checks,'advanced archive read route disabled',lambda:self.archive_disabled(t))
   if t.get('framework')=='react':self.check(checks,'preserved React query transport and agent downloads',lambda:self.legacy_react(t))
  else:
   self.check(checks,'reviewed private-site UI artifact attribution',lambda:self.ui_attribution(t))
   self.check(checks,'main navigation, footer destinations and local assets/fragments',lambda:self.main_pages(t));self.check(checks,'main read-only health identity',lambda:self.health(t));self.check(checks,'legacy theme permanent path/query redirects',lambda:self.legacy_theme(t));self.check(checks,'public read-only MCP manifest',lambda:self.mcp(t));self.check(checks,'legacy React query transport and agent downloads',lambda:self.legacy_react(t))
  self.check(checks,'reviewed and published package/source downloads',lambda:self.downloads(t))
  result={'host':t['host'],'testedOrigin':self.http.origin_map.get(t['url'].rstrip('/'),t['url'].rstrip('/')),'canonicalDomainVerified':self.args.live_ready and not self.args.origin_map,'family':t['family'],'role':t['role'],'framework':t.get('framework'),'sourceCommitExpected':t.get('sourceCommit'),'status':'passed' if all(c['status']=='passed' for c in checks) else 'failed','elapsedSeconds':round(time.monotonic()-start,2),'checks':checks};print(json.dumps({'host':t['host'],'status':result['status'],'checks':len(checks),'failures':[c['name'] for c in checks if c['status']=='failed']}),flush=True);return result
 def root(self,t):
  r,d=self.document(t['url'],family=t['family']);h=self.call(t,'/','HEAD');require(h['status']==200,'Root HEAD failed');return {'status':r['status'],'headStatus':h['status'],'title':''.join(d.title),'mainCount':d.main,'h1Count':d.h1,'bytes':r['bytes'],'sha256':r['sha256'],'finalUrl':safe_url(r['finalUrl'])}
 def archive_disabled(self,t):
  r=self.call(t,'/_archive/catalog');require(r['status'] in [404,405],'Advanced archive route unexpectedly available');return {'method':'GET','status':r['status'],'writeProbePerformed':False,'runtimeWriteIsolationEstablishedByHTTP':False}
 def run(self):
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:self.results=list(pool.map(self.verify_target,self.targets))
  final={'schemaVersion':1,'mode':'final-live-read-only' if self.args.live_ready else 'staged-native-workers-read-only' if self.args.stage_ready else 'localhost-harness-verification','liveDeploymentReadyAuthorization':self.args.live_ready,'stagedDeploymentReadyAuthorization':self.args.stage_ready,'originOverrides':self.args.origin_map or None,'userAgent':UA,'tlsVerificationDisabled':False,'proxyEnvironmentPreserved':True,'maxConcurrentRequests':self.args.concurrency,'requestTimeoutSeconds':self.args.request_timeout,'overallTimeoutSeconds':self.args.overall_timeout,'status':'passed' if all(t['status']=='passed' for t in self.results) else 'failed','targets':self.results,'operations':self.http.operations,'independentCaseFailures':self.case_failures,'limitations':['HTTP cannot establish manual accessibility or administrator immutability.','Client-rendered React query content and dynamic anchors require the independent browser gate.','Out-of-scope external personal/legal websites are listed but not fetched.']};pathlib.Path(self.args.output).write_text(json.dumps(final,indent=2)+'\n');return final

def main():
 global ROOT
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--state-root',type=pathlib.Path);p.add_argument('--live-ready',action='store_true');p.add_argument('--stage-ready',action='store_true');p.add_argument('--prepare-only',action='store_true');p.add_argument('--hosts',nargs='*');p.add_argument('--origin-map',type=pathlib.Path);p.add_argument('--manifest');p.add_argument('--expectations',type=pathlib.Path);p.add_argument('--output');p.add_argument('--concurrency',type=int,default=4);p.add_argument('--request-timeout',type=int,default=20);p.add_argument('--overall-timeout',type=int,default=1200);a=p.parse_args();ROOT=a.state_root.resolve() if a.state_root else ROOT;a.manifest=a.manifest or str(ROOT/'live-eight-hosts-manifest.json');a.output=a.output or str(ROOT/('live-http-expectations-template.json' if a.prepare_only else 'live-http-results.json'));a.origin_map=load(a.origin_map,{}) if a.origin_map else {};require(a.prepare_only or a.live_ready or a.stage_ready or a.origin_map,'Live requests are blocked until --live-ready is explicitly supplied by the coordinator');require(1<=a.concurrency<=8,'Use 1–8 bounded concurrent requests');require(not(a.stage_ready and a.live_ready),'Choose either staged or canonical-domain verification');require(not a.live_ready or not a.origin_map,'Canonical live verification must not use origin overrides');require(not a.origin_map or all((v.rstrip('/') in STAGED_ORIGINS if a.stage_ready else urllib.parse.urlsplit(v).hostname in ['127.0.0.1','localhost']) for v in a.origin_map.values()),'Origin overrides must be loopback or the exact two authorized staged origins');require(not a.stage_ready or {k.rstrip('/'):v.rstrip('/') for k,v in a.origin_map.items()}==STAGED_ORIGIN_MAP,'Staged verification requires the exact two authorized logical-to-Workers.dev mappings')
 v=Verifier(a)
 if a.prepare_only:
  selected={t['host']:{k:value for k,value in t.items() if k not in ['host','url','base','routes','health','legacyThemeRedirect']} for t in v.targets};pathlib.Path(a.output).write_text(json.dumps({'status':'prepared-not-executed','hosts':selected},indent=2)+'\n');print('Prepared expectations without making HTTP requests');return
 result=v.run();raise SystemExit(0 if result['status']=='passed' else 1)
if __name__=='__main__':main()
