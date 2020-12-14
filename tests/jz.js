import SolidRest from '../';
import SolidRestFile from '../plugins/solid-rest-file';
import SolidRestMem from '../plugins/solid-rest-mem';

let [tests,fails,passes,res] = [0,0,0]
let allfails = 0

let client = getRestClient('file');

const cfg = {
  base : `file://${process.cwd()}/`,
  file : `file://${process.cwd()}/test.txt`,
  text : "hello world",
}

async function test(){

  res = await GET( cfg.base )
  ok("200 get container",res.status==200, res)

  res = await PUT( cfg.file,cfg.text )
  ok( "201 put resource", res.status==201,res)

  res = await GET( cfg.file )
  ok("200 get resource",res.status==200 && await res.text()===cfg.text, res)

}
test();

function getRestClient(protocol,parser){
  const plugin = protocol.startsWith('file') ? new SolidRestFile()
               : protocol.startsWith('mem')  ? new SolidRestMem()
               : protocol.startsWith('ssh')  ? new SolidRestSsh() : null;
  return new SolidRest({
    plugin : plugin,
    parser : parser,
  });
}
async function GET(url){
  return await client.fetch( url, {method:"GET"} )
}
async function HEAD(url){
  return await client.fetch( url, {method:"HEAD"} )
}
async function PUT(url,text){
  return await client.fetch( url, {method:"PUT",body:text,headers:{"content-type":"text/plain"}} )
}
async function PATCH(url, patchContent, patchContentType){
  return await client.fetch(url, {
    method: 'PATCH',
    body:patchContent,
    headers:{
      'Content-Type': patchContentType,
      link: '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
    },
    relative: true
  })
} 
async function DELETE(url){
  return await client.fetch( url, {method:"DELETE"} )
}
async function POST(parent,item,content,link){
  return await client.fetch( parent,{
    method:"POST",
    headers:{slug:item,link:link,"content-type":"text/turtle"},
    body:content
  })
}
async function postFile(parent,file,content){
  let link = '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
  return POST(parent,file,content,link)
}
async function postFolder(parent,folder){
  let link ='<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"'
  return POST(parent,folder,'',link)
}

/* ============================================== */

function ok( label, success,res ){
   tests = tests + 1;   
   if(success) passes = passes + 1
   else fails = fails+1
   let msg = success ? "ok " : "FAIL "
   console.warn( "  " + msg + label)
   if(!success && res ) console.warn(res.status,res.statusText)
   return success
}
