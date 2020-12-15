import SolidRest from '../';
import SolidRestFile from '../plugins/solid-rest-file';
import SolidRestMem from '../plugins/solid-rest-mem';

let [tests,fails,passes,res] = [0,0,0]
let allfails = 0

let client = getRestClient('file');

const cfg = {
  base    : `file://${process.cwd()}/`,
  folder1 : `test-folder`,
  file1   : `test1.txt`,
  folder2 : `file://${process.cwd()}/test-folder/subFolder/`,
  file2   : `file://${process.cwd()}/test-folder/subFolder/test2.txt`,
  text    : "hello world",
}

async function test(){

console.log('headers');
  res = await HEAD( cfg.base )
  ok( "get content-type header", res.status==200 && res.headers.get('content-type')==='text/turtle',res)
  ok("get wac-allow header",res.headers.get('wac-allow').match('write'), res)

  res = await postFolder( cfg.base, cfg.folder1 )
  cfg.folder1 = cfg.base+cfg.folder1+'/';
  ok("get location header",cfg.folder1.match(res.headers.get('location')), res)

console.log('post');
  ok("post container",res.status==200, res)

  res = await postFile( cfg.folder1, cfg.file1, cfg.text )
  ok( "post resource", res.status==200,res)
  cfg.file1 = cfg.folder1+'/'+cfg.file1;


console.log('get');
  res = await GET( cfg.folder1 )
  ok("get container",res.status==200, res)


  res = await GET( cfg.file1 )
  let content = await res.text();
  ok("get resource",res.status==200 && content===cfg.text, res)

console.log('put');
  res = await PUT( cfg.file2, cfg.text )
  ok( "put resource", res.status==200,res)

console.log('head');
  res = await HEAD( cfg.base )
  ok( "head container", res.status==200 && res.headers.get('content-type')==='text/turtle',res)

  res = await HEAD( cfg.file1 )
  ok( "head resource", res.status==200 && res.headers.get('content-type')==='text/plain',res)

console.log('delete');
  res = await DELETE( cfg.file1 )
  res = await DELETE( cfg.file2 )
  ok( "delete resource", res.status==200,res)

  res = await DELETE( cfg.folder2 )
  res = await DELETE( cfg.folder1 )
  res = await GET( cfg.folder1 )
  ok( "delete container", res.status==404,res)

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
async function POST(parent,item,content,link,ctype){
  return await client.fetch( parent,{
    method:"POST",
    headers:{slug:item,link:link,"content-type":ctype},
    body:content
  })
}
async function postFile(parent,file,content){
  let link = '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
  return POST(parent,file,content,link,'text/plain')
}
async function postFolder(parent,folder){
  let link ='<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"'
  return POST(parent,folder,'',link,"text/turtle")
}

/* ============================================== */

function ok( label, success,res ){
   tests = tests + 1;   
   if(success) passes = passes + 1
   else fails = fails+1
   let msg = success ? "can " : "CAN NOT "
   console.warn( "  " + msg + label)
   if(!success && res ) console.warn(res.status,res.statusText)
   return success
}
