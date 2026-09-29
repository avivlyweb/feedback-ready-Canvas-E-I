import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { patchLiveBundle } from "./patch-live-bundle.mjs";

const frameOrigin = process.env.FRAME_ORIGIN;
if (!frameOrigin) throw new Error("FRAME_ORIGIN is required");

const output = ".vercel/output";
await mkdir(`${output}/static/assets`, { recursive: true });
await cp("recovered-live/index.html", `${output}/static/index.html`);
await cp("recovery-artifacts/index-CvrZNA0C.css", `${output}/static/assets/index-CvrZNA0C.css`);
const liveBundle = await readFile("recovery-artifacts/index-CE_nbZlN.js", "utf8");
const patched = patchLiveBundle(liveBundle, frameOrigin);
await writeFile(`${output}/static/assets/index-CE_nbZlN.js`, patched.code);
await writeFile(`${output}/config.json`, JSON.stringify({ version: 3 }));
console.log(JSON.stringify(patched.replacements));
