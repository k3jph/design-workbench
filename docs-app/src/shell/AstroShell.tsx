import {implementationVersion,repo} from '../data';
import {useEffect,useRef} from 'react';
import type {LayoutProps} from '../layout-types';
import {descriptions} from '../data';
import './react-content.css';
import martletMark from '../../brand/martlet-mark.svg';
import krigsvoldMark from '../../brand/krigsvold-mark.svg';
import ownerMark from '../../brand/jh-badge-1x1.svg';
type Props=LayoutProps & {family:'martlet'|'krigsvold';chrome:{header:string;footer:string}};
export function AstroShell({family,chrome,mode,onModeChange,directory,page,children}:Props){
 const header=useRef<HTMLDivElement>(null);
 const component=new URLSearchParams(typeof location==='undefined'?'':location.search).get('component');
 const name=family==='martlet'?'Martlet':'Krigsvold';
 const titles:Record<string,string>={home:name+' React',language:name+' design language',start:'Build with '+name+'.',agents:'Build with '+name+'.',collection:'Working patterns',patterns:'Reference patterns',research:'Following the water',component:component||'Component reference'};
 const title=titles[page]||name;
 const description=component?descriptions[component]:page==='home'?'Components, working patterns, and guidance built inside the shared Astro shell.':page==='research'?'Research project · Demonstration · Fictional study · Sample data':`Design language 0.3 preview · React ${implementationVersion} · MIT`;
 const host=`https://${family}design.dev`;
 // These fragments are generated from the trusted Astro build, never user input.
 const html=(value:string)=>value.replace(/src="\/martlet-mark.svg"/g,`src="${martletMark}"`).replace(/src="\/krigsvold-mark.svg"/g,`src="${krigsvoldMark}"`).replace(/src="\/assets\/identity\/jh-badge-1x1.svg"/g,`src="${ownerMark}"`).replace(`${name} Design`,`${name} React`).replaceAll(`https://github.com/${family}theme/${family}theme`,repo).replace(`>${family}design.dev<`,`>react.${family}design.dev<`).replace(/href="\/(?!\/)/g,`href="${host}/`);
 useEffect(()=>{document.documentElement.dataset.appearance=mode;header.current?.querySelectorAll('[data-appearance-toggle]').forEach(b=>{b.textContent=mode==='dark'?'Light mode':'Dark mode';b.setAttribute('aria-pressed',String(mode==='dark'));});},[mode]);
 useEffect(()=>{
 const element=header.current!;const nav=element.querySelector<HTMLElement>('.site-header,.site-navbar')!;nav.dataset.navigationReady='true';
 const menu=element.querySelector<HTMLButtonElement>('.menu-button,.navbar-toggler');
 const links=element.querySelector<HTMLElement>('.site-header nav,.navbar-collapse');
 const setOpen=(open:boolean)=>{menu?.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-menu-open',open);links?.classList.toggle('is-open',open);links?.classList.toggle('show',open);};
 const closeDropdowns=()=>element.querySelectorAll('.dropdown-menu.show').forEach(e=>{e.classList.remove('show');e.parentElement?.querySelector('[data-bs-toggle]')?.setAttribute('aria-expanded','false')});
 const click=(event:Event)=>{const target=event.target as HTMLElement;if(target.closest('[data-appearance-toggle]')){onModeChange();return;}if(target.closest('.menu-button,.navbar-toggler')){setOpen(menu?.getAttribute('aria-expanded')!=='true');return;}const toggle=target.closest<HTMLElement>('[data-bs-toggle="dropdown"]');if(toggle){event.preventDefault();const open=toggle.getAttribute('aria-expanded')!=='true';closeDropdowns();toggle.setAttribute('aria-expanded',String(open));toggle.parentElement?.querySelector('.dropdown-menu')?.classList.toggle('show',open);}};
 const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){const toggle=element.querySelector<HTMLElement>('[data-bs-toggle="dropdown"][aria-expanded="true"]');if(toggle){closeDropdowns();toggle.focus();}else if(menu?.getAttribute('aria-expanded')==='true'){setOpen(false);menu.focus();}}};
 const scroll=()=>nav.classList.toggle('is-scrolled',scrollY>=Math.min(260,Math.max(160,innerHeight*.25)));
 const media=matchMedia(family==='martlet'?'(max-width:68rem), (max-aspect-ratio:4/5)':'(max-width:991.98px)');const resize=()=>{setOpen(false);closeDropdowns()};
 const blur=(event:FocusEvent)=>{if(!element.contains(event.relatedTarget as Node))closeDropdowns()};
 nav.classList.add('is-ready');scroll();element.addEventListener('click',click);element.addEventListener('focusout',blur);window.addEventListener('keydown',escape);window.addEventListener('scroll',scroll,{passive:true});media.addEventListener('change',resize);
 return()=>{element.removeEventListener('click',click);element.removeEventListener('focusout',blur);window.removeEventListener('keydown',escape);window.removeEventListener('scroll',scroll);media.removeEventListener('change',resize)};
 },[family,onModeChange]);
 const content=<><p className="eyebrow">The React reference</p><h1>{title}</h1><p>{description}</p></>;
 return <div className="reference-shell" data-page={page}>
 <a className="skip-link" href="#reference-main">Skip to content</a>
 <div ref={header} dangerouslySetInnerHTML={{__html:html(chrome.header)}} />
 <main id="reference-main" tabIndex={-1}>
 {family==='martlet'?<header className="page-intro"><div className="page-intro__shade"><div className="container page-intro__content">{content}</div></div></header>:<header className="page-masthead page-masthead--plain"><div className="page-masthead__veil"/><div className="container"><div className="row"><div className="col-lg-9">{content}</div></div></div></header>}
 <div className="container reference-body">
 <nav className="reference-destinations" aria-label="React reference"><a href="../examples/">50 page recipes</a><a href="?">Components</a><a href="?page=language">The Language</a><a href="?page=collection">Working Patterns</a><a href="?page=patterns">Reference Patterns</a><a href="?page=research">Research Project</a><a href="?page=start">Getting Started</a><a href="?page=agents">For Agents</a></nav>
 <details className="reference-directory"><summary>Browse the 22 components</summary>{directory}</details>
 <div className={`reference-content ${family}-reference`}>{children}</div>
 </div></main>
 <div dangerouslySetInnerHTML={{__html:html(chrome.footer)}} />
 </div>;
}
