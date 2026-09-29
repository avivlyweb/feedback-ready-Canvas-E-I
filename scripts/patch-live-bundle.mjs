import { readFile, writeFile } from "node:fs/promises";

function replaceExactlyOnce(code, needle, replacement, label) {
  const first = code.indexOf(needle);
  if (first < 0 || code.indexOf(needle, first + needle.length) >= 0) {
    throw new Error(`Expected exactly one ${label} match`);
  }
  return code.slice(0, first) + replacement + code.slice(first + needle.length);
}

export function patchLiveBundle(source, rawFrameOrigin) {
  const frameOrigin = new URL(rawFrameOrigin).origin;
  const replacements = { component: 0, iframe: 0, listener: 0, toolbar: 0 };
  let code = source;

  const componentMarker = "J_=({project:n,";
  const componentStart = code.indexOf(componentMarker);
  if (componentStart < 0) throw new Error("Live annotation component was not found");
  const hookNeedle = "=>{const I=J.useRef(null)";
  const hookIndex = code.indexOf(hookNeedle, componentStart);
  if (hookIndex < 0 || hookIndex - componentStart > 800) throw new Error("Annotation component hook boundary was not found");
  const hookReplacement = `=>{const frameOrigin=${JSON.stringify(frameOrigin)},studentOrigin=(()=>{try{return new URL(n.content).origin}catch{return""}})(),[frameMode,setFrameMode]=J.useState(null);J.useEffect(()=>{if(n.type!==Ze.URL||n.content.includes("shoulder-rehab-esp.netlify.app"))return;let active=!0;fetch(frameOrigin+"/api/frame?check=1&url="+encodeURIComponent(n.content)).then(response=>response.json()).then(result=>{active&&setFrameMode(result.mode)}).catch(()=>{active&&setFrameMode(null)});return()=>{active=!1}},[n.content]);const I=J.useRef(null)`;
  code = code.slice(0, hookIndex) + hookReplacement + code.slice(hookIndex + hookNeedle.length);
  replacements.component += 1;

  const listenerNeedle = 'const ne=le=>{const Y=le.data;if(!(!Y||Y.source!=="canvas-feedback-agent")';
  const listenerReplacement = 'const ne=le=>{const Y=le.data;if(le.origin!==frameOrigin&&le.origin!==studentOrigin)return;if(!(!Y||Y.source!=="canvas-feedback-agent")';
  code = replaceExactlyOnce(code, listenerNeedle, listenerReplacement, "message listener");
  replacements.listener += 1;

  const iframeNeedle = 'src:n.content.includes("shoulder-rehab-esp.netlify.app")?void 0:n.content,srcDoc:';
  const iframeReplacement = 'src:n.content.includes("shoulder-rehab-esp.netlify.app")?void 0:frameOrigin+"/api/frame?url="+encodeURIComponent(n.content),srcDoc:';
  code = replaceExactlyOnce(code, iframeNeedle, iframeReplacement, "URL iframe");
  replacements.iframe += 1;

  const toolbarNeedle = 'n.type===Ze.URL&&y.jsx(Y_,{onResize:B,activeWidth:z,suggestedBreakpoint:P,onAcceptBreakpoint:()=>{B(P==="Mobile"?mt.mobile:P==="Tablet"?mt.tablet:mt.desktop),Z(null)}}),S&&';
  const toolbarReplacement = 'n.type===Ze.URL&&y.jsx(Y_,{onResize:B,activeWidth:z,suggestedBreakpoint:P,onAcceptBreakpoint:()=>{B(P==="Mobile"?mt.mobile:P==="Tablet"?mt.tablet:mt.desktop),Z(null)}}),n.type===Ze.URL&&y.jsxs("div",{className:"flex items-center justify-center gap-2 border-b border-slate-200 bg-white px-3 py-1.5 text-[11px]",children:[frameMode==="proxied"&&y.jsx("span",{className:"rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-800",children:"Shown via CanvasFeedback preview (site blocks embedding)"}),y.jsx("a",{href:n.content,target:"_blank",rel:"noopener noreferrer",className:"font-semibold text-indigo-700 hover:underline",children:"Open live site"})]}),S&&';
  code = replaceExactlyOnce(code, toolbarNeedle, toolbarReplacement, "URL toolbar");
  replacements.toolbar += 1;

  return { code, replacements };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [, , input, output, origin] = process.argv;
  if (!input || !output || !origin) throw new Error("Usage: node patch-live-bundle.mjs <input> <output> <frame-origin>");
  const result = patchLiveBundle(await readFile(input, "utf8"), origin);
  await writeFile(output, result.code);
  console.log(JSON.stringify(result.replacements));
}
