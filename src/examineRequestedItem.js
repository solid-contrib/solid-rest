import libPath from "path";
import Url from "url";

export async function getItem(uri,request,storage){
  const [objectType,objectExists,mode,item] =
    await this.storage.getObjectType(uri,request)
  item.mode = item.mode ? item.mode : {read:true,append:true,write:true};
  let pathHandler,url;
  if (request.protocol.startsWith('file')) {
    url = Url.format(request.url)
    item.rest_prefix = 'file'
    // item.pathname = Url.fileURLToPath(url)
    pathHandler = libPath;
  }
  else {
    url = decodeURIComponent(uri)
    // item.pathname = Url.parse(url).pathname
    item.rest_prefix=uri.replace(request.protocol+'//','').replace(/\/.*$/,'')
    pathHandler = libPath.posix
  }
  //  item.pathname = url.replace(request.protocol+'//','') ???
  item.pathname = uri.replace(request.protocol+'//','')
  if( request.method==='DELETE' && item.isContainer){
    let files = await storage.getContainer(item.pathname);
    files = files.filter(file =>  !this.isLink(file,{item:{pathHandler:item.pathHandler}}))
    if (files.length) item.containerNotEmpty = true;
  }

  this.getExtension = (path)=>{
    path = path || this.item.pathname;
    return ( path.startsWith('.') && !( (path.match(/\./g)||[]).length > 1 )
      ?path :pathHandler.extname(path) )
  };
  this.pathSep = pathHandler.sep;
  this.basename = pathHandler.extname
  this.mungePath = (pathname, slug, options)=>{
    pathname = pathHandler.join(pathname, slug)
    if (pathname.includes('\\')) pathname = pathname.replace(/\\/g, '/');
    return pathname;
  }
  return item;
}
