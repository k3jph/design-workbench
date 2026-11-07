import React, {useState, useRef, useLayoutEffect} from 'react';
import {AppShell, Button, Field, TextInput, Textarea, Fieldset, Radio, Checkbox, ErrorSummary, Notice, Dialog} from '@F/react';
import '@F/react/styles.css';
import '@F/core/fonts.css';
import './host.css';
// Consumer composition and simulated service state. All controls are real release exports.
export default function App(){
 const [mode,setMode]=useState('light'),[values,setValues]=useState({name:'',email:'',attendance:'',notes:'',reminder:false}),[errors,setErrors]=useState([]),[state,setState]=useState('idle'),[dirty,setDirty]=useState(false),[open,setOpen]=useState(false);
 const summary=useRef(null), reset=useRef(null), submit=useRef(null), busy=useRef(false), attempts=useRef(0);
 const [focusErrors,setFocusErrors]=useState(0);
 useLayoutEffect(()=>{if(focusErrors)summary.current?.focus();},[focusErrors]);
 const change=(key,value)=>{setValues(v=>({...v,[key]:value}));setDirty(true);};
 async function register(event){
  event?.preventDefault();if(busy.current)return;
  const next=[];if(!values.name.trim())next.push({targetId:'name',message:'Enter your name.'});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))next.push({targetId:'email',message:'Enter a valid email.'});
  if(!values.attendance)next.push({targetId:'attendance-group',message:'Choose attendance.'});
  setErrors(next);if(next.length){setState('invalid');setFocusErrors(n=>n+1);return;}
  if(summary.current?.contains(document.activeElement))submit.current?.focus();
  busy.current=true;setState('pending');
  await new Promise(done=>setTimeout(done,400));busy.current=false;
  if(++attempts.current===1){setState('failed');setFocusErrors(n=>n+1);}else{setState('saved');setDirty(false);}
 }
 function dismiss(){setOpen(false);reset.current?.focus();}
 function discard(){setValues({name:'',email:'',attendance:'',notes:'',reminder:false});setErrors([]);setState('idle');setDirty(false);attempts.current=0;dismiss();}
 return <div className="F" data-F={mode}><AppShell brand="Example workshop" navigationPlacement="top" navigationLabel="Workshop" navigation={<a href="#registration">Registration</a>} utilities={<Button id="appearance" onClick={()=>setMode(m=>m==='light'?'dark':'light')}>Change appearance</Button>}>
 <h1>Workshop registration</h1><p>A consumer of the public React archive. Nothing is sent or stored durably.</p>
 <form id="registration" aria-label="Workshop registration" className="consumer-form" noValidate aria-busy={state==='pending'} onSubmit={register}>
 {(state==='invalid'||state==='failed')&&<ErrorSummary id="summary" ref={summary} title={state==='failed'?'Registration failed':'Check your registration'} errors={errors}>{state==='failed'&&<Button id="retry" disabled={state==='pending'} onClick={()=>void register()}>Retry registration</Button>}</ErrorSummary>}
 <Fieldset id="details" legend="Your details" disabled={state==='pending'}>
 <Field id="name" label="Name (required)" hint="The name for your registration." error={errors.find(e=>e.targetId==='name')?.message}>{props=><TextInput {...props} name="name" required autoComplete="name" value={values.name} onChange={e=>change('name',e.target.value)}/>}</Field>
 <Field id="email" label="Email (required)" hint="An example contact address." error={errors.find(e=>e.targetId==='email')?.message}>{props=><TextInput {...props} type="email" name="email" required autoComplete="email" value={values.email} onChange={e=>change('email',e.target.value)}/>}</Field>
 </Fieldset>
 <Fieldset id="attendance-group" tabIndex={-1} legend="Attendance (required)" disabled={state==='pending'} error={errors.find(e=>e.targetId==='attendance-group')?.message}>
 <Radio name="attendance" value="studio" label="In the studio" checked={values.attendance==='studio'} onChange={()=>change('attendance','studio')}/><Radio name="attendance" value="online" label="Online" checked={values.attendance==='online'} onChange={()=>change('attendance','online')}/>
 </Fieldset>
 <Fieldset legend="Preferences" disabled={state==='pending'}><Checkbox id="reminder" label="Send a reminder" checked={values.reminder} onChange={e=>change('reminder',e.target.checked)}/><Field id="notes" label="Access requirements (optional)">{props=><Textarea {...props} value={values.notes} onChange={e=>change('notes',e.target.value)}/>}</Field></Fieldset>
 <div className="consumer-actions"><Button id="submit" ref={submit} type="submit" aria-disabled={state==='pending'}>Register</Button><Button id="reset" ref={reset} variant="secondary" disabled={state==='pending'} onClick={()=>dirty?setOpen(true):discard()}>Reset registration</Button></div>
 <Notice kind={state==='saved'?'success':'info'}>{state==='pending'?'Registering…':state==='saved'?'Registration recorded for this example.':state==='failed'?'Registration failed. Your entries are retained.':'Nothing sent.'}</Notice>
 </form>
 <Dialog open={open} title="Discard this registration?" onDismiss={dismiss}><p>Your unsent entries will be cleared.</p><div className="consumer-actions"><Button autoFocus onClick={dismiss}>Keep editing</Button><Button variant="secondary" onClick={discard}>Discard entries</Button></div></Dialog>
 </AppShell></div>;
}
