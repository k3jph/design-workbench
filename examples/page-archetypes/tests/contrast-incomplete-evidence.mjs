// Record evidence for axe's actual incomplete targets. This never changes an
// incomplete result to a pass and intentionally does not infer paint contrast.
export async function captureIncompleteTargets(page,targets){
 return page.evaluate(targets=>{
  const rect=r=>({x:r.x,y:r.y,width:r.width,height:r.height});
  const alpha=value=>{const m=value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/);return m?(m[4]===undefined?1:Number(m[4])):null};
  const clipValue=value=>['hidden','clip','scroll','auto'].includes(value);
  return targets.map(target=>{
   if(target.length!==1)return {target,matches:[],unknown:['compound_or_shadow_target']};
   let nodes;try{nodes=[...document.querySelectorAll(target[0])]}catch{return {target,matches:[],unknown:['invalid_selector']}};
   if(!nodes.length)return {target,matches:[],unknown:['selector_did_not_match']};
   return {target,matches:nodes.map((node,index)=>{
    const style=getComputedStyle(node),box=node.getBoundingClientRect(),unknown=new Set(),chain=[];
    const svg=!!node.ownerSVGElement,foreground=svg?style.fill:style.color;
    if(alpha(foreground)!==1)unknown.add('foreground_not_opaque_rgb');
    if(svg)unknown.add('svg_paint_overlap_not_evaluated');
    if(box.width===0||box.height===0||style.display==='none'||style.visibility!=='visible')unknown.add('not_rendered');
    if(box.right<=0||box.bottom<=0||box.left>=innerWidth||box.top>=innerHeight)unknown.add('outside_viewport');
    else if(box.left<0||box.top<0||box.right>innerWidth||box.bottom>innerHeight)unknown.add('viewport_clipped');
    let ancestorBackground=null,backgroundUnknown=false,transparentPositioned=false;
    for(let el=node;el;el=el.parentElement){
     const s=getComputedStyle(el),r=el.getBoundingClientRect();
     chain.push({element:el.tagName.toLowerCase(),id:el.id||null,backgroundColor:s.backgroundColor,backgroundImage:s.backgroundImage,opacity:s.opacity,position:s.position,zIndex:s.zIndex,overflowX:s.overflowX,overflowY:s.overflowY,filter:s.filter,mixBlendMode:s.mixBlendMode,rect:rect(r)});
     if(s.opacity!=='1')unknown.add('opacity_requires_compositing');
     if(s.filter!=='none'||s.mixBlendMode!=='normal')unknown.add('filter_or_blending_requires_review');
     if(s.visibility!=='visible'||s.display==='none')unknown.add('not_rendered');
     if(el!==node&&((clipValue(s.overflowX)&&(box.left<r.left||box.right>r.right))||(clipValue(s.overflowY)&&(box.top<r.top||box.bottom>r.bottom))))unknown.add('ancestor_clipped');
     if(ancestorBackground===null&&!backgroundUnknown){
      if(s.backgroundImage!=='none'){backgroundUnknown=true;unknown.add('gradient_or_image_background');}
      else {const a=alpha(s.backgroundColor);if(a===null){backgroundUnknown=true;unknown.add('unsupported_background_color');}else if(a===1)ancestorBackground=s.backgroundColor;else if(a!==0){backgroundUnknown=true;unknown.add('background_requires_compositing');}else if(['fixed','absolute','sticky'].includes(s.position))transparentPositioned=true;}
     }
    }
    if(ancestorBackground===null&&!backgroundUnknown)unknown.add('no_opaque_background_found');
    if(transparentPositioned)unknown.add('positioned_transparent_backdrop_not_evaluated');
    if(style.textShadow!=='none')unknown.add('text_shadow_requires_review');
    const visible=box.width>0&&box.height>0&&box.right>0&&box.bottom>0&&box.left<innerWidth&&box.top<innerHeight;
    const x=Math.min(innerWidth-1,Math.max(0,box.left+box.width/2)),y=Math.min(innerHeight-1,Math.max(0,box.top+box.height/2));
    const hitNodes=visible?document.elementsFromPoint(x,y):[];
    if(hitNodes[0]&&hitNodes[0]!==node&&!node.contains(hitNodes[0])&&!hitNodes[0].contains(node))unknown.add('overlapping_paint_not_evaluated');
    const hitStack=hitNodes.map(el=>{const s=getComputedStyle(el);return {element:el.tagName.toLowerCase(),id:el.id||null,backgroundColor:s.backgroundColor,backgroundImage:s.backgroundImage,opacity:s.opacity,position:s.position,zIndex:s.zIndex}});
    // The ancestor chain is a useful candidate, not a paint verdict. Never
    // present it as a resolved background when any relevant condition is open.
    const background=unknown.size===0?ancestorBackground:null;
    return {index,tag:node.tagName.toLowerCase(),text:node.textContent?.trim()||'',rect:rect(box),foreground,background,opaqueAncestorBackground:ancestorBackground,font:{family:style.fontFamily,size:style.fontSize,weight:style.fontWeight,lineHeight:style.lineHeight,letterSpacing:style.letterSpacing},textShadow:style.textShadow,display:style.display,visibility:style.visibility,viewport:{width:innerWidth,height:innerHeight,scrollX,scrollY},backgroundChain:chain,hitStack,unknown:[...unknown]};
   }),unknown:nodes.length>1?['selector_matches_multiple_elements']:[]};
  });
 },targets);
}
