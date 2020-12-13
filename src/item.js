import Url from "url";
import u from './utils.js';

export async function getItem(uri,request,storage){
  const [objectType,objectExists,mode,item] =
    await storage.getObjectType(uri,request)
  item.mode = item.mode ? item.mode : {read:true,append:true,write:true};
  let pathHandler,url;
  if (request.protocol.startsWith('file')) {
    url = Url.format(request.url)
    item.rest_prefix = 'file'
    // item.pathname = Url.fileURLToPath(url)
    item.pathHandler = 'default'
  }
  else {
    url = decodeURIComponent(uri)
    // item.pathname = Url.parse(url).pathname
    item.rest_prefix=uri.replace(request.protocol+'//','').replace(/\/.*$/,'')
    item.pathHandler = 'posix'
  }
  item.pathname = uri.replace(request.protocol+'//','')
  if( request.method==='DELETE' && item.isContainer){
    let files = await storage.getContainer(item.pathname);
    files = files.filter(file =>  !u.isLink(file,{item:{pathHandler:item.pathHandler}}))
    if (files.length) item.containerNotEmpty = true;
  }

  return item;
}

