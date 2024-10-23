const cl = (txt)=> console.log(txt);
import {Router} from "https://deno.land/x/oak@v17.0.0/mod.ts";
import DB from "./src/myPass.json" with {type:"json"};
export const passRt = new Router();

passRt.get("/", (ctx) => { 
  ctx.response.redirect(ctx.request.url+"/index.html") 
})

passRt.get('/get-data', ({response}) => {
  response.body = DB.encDB
})

passRt.post("/save-data", async ({request, response}) => {
  const req = await request.body.json(); DB.encDB = req.encDB
  Deno.writeTextFile("./apps/pass/src/myPass.json", JSON.stringify(DB ,null,2));
  response.status = 200
})
