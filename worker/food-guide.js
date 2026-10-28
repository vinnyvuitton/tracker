const CURRENT = "food-guide:current:v1";
const validVersion = value => typeof value === "string" && /^[a-zA-Z0-9._-]{1,80}$/.test(value);
const failure = (message, status, cors) => Response.json({error:message}, {status,headers:{...cors,"Cache-Control":"no-store"}});
export async function foodGuide(request, env, cors) {
  const url = new URL(request.url);
  if(request.method !== "GET") return failure("Method not allowed",405,cors);
  const manifest = await env.TRACKER_KV.get(CURRENT,"json");
  if(!manifest || manifest.status!=="approved" || !validVersion(manifest.version) || !/^[a-f0-9]{64}$/.test(manifest.sha256||"") || !Number.isInteger(manifest.bytes) || manifest.bytes<5 || manifest.bytes>3000000 || !Number.isInteger(manifest.pages) || manifest.pages<1 || manifest.pages>300 || typeof manifest.updatedAt!=="string" || !/^\d{4}-\d{2}-\d{2}$/.test(manifest.logsReviewedThrough||"")) return failure("Your reviewed food guide is not available yet.",404,cors);
  if(url.pathname === "/food-guide") return Response.json({guide:{version:manifest.version,title:manifest.title,updatedAt:manifest.updatedAt,logsReviewedThrough:manifest.logsReviewedThrough,pages:manifest.pages,updateMode:"Reviewed at weekly check-ins; new editions need approval.",filename:"Vinnys_Food_Guide.pdf"}},{headers:{...cors,"Cache-Control":"no-store","Vary":"Origin, Authorization"}});
  if(url.searchParams.get("version") && url.searchParams.get("version")!==manifest.version) return failure("A newer guide is available. Open Food Guide again to load it.",409,cors);
  const stored = await env.TRACKER_KV.get("food-guide:pdf:"+manifest.sha256,"json");
  if(!stored || typeof stored.base64!=="string" || stored.base64.length>4000000) return failure("The food guide could not be loaded. Please try again.",503,cors);
  try {
    const bytes=Uint8Array.from(atob(stored.base64),c=>c.charCodeAt(0));
    if(bytes.length!==manifest.bytes || new TextDecoder().decode(bytes.slice(0,5))!=="%PDF-") throw Error();
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),b=>b.toString(16).padStart(2,"0")).join("");
    if(digest!==manifest.sha256) throw Error();
    return new Response(bytes,{headers:{...cors,"Content-Type":"application/pdf","Content-Disposition":'inline; filename="Vinnys_Food_Guide.pdf"',"Content-Length":String(bytes.length),"Cache-Control":"private, no-store","Vary":"Origin, Authorization","X-Content-Type-Options":"nosniff"}});
  } catch {return failure("The food guide could not be verified. Please try again.",503,cors);}
}
