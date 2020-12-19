import libPath from "path";
import Url from "url";

export async function getItem(uri,request){
  let pathHandler,url,pname;
  if (uri.startsWith('file')) {
    url = Url.format(request.url)
    pname = Url.fileURLToPath(url)
    pathHandler = libPath;
  }
  else {
    url = decodeURIComponent(uri)
    pname = Url.parse(url).pathname
    pathHandler = libPath.posix
  }
  const item =  await this.perform('GET_ITEM_INFO',pname,request)
  item.mode = item.mode ? item.mode : {read:true,append:true,write:true};
  item.pathname = pname;

  if( request.method==='DELETE' && item.isContainer){
    let files = await this.perform('GET_FILES',item.pathname);
    files = files.filter(file =>  !this.isAuxResource(file))
    item.containedFiles = files.length;
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
  item.extension = this.getExtension(item.pathname);
  item.contentType = this.getContentType(item.extension);
  item.patchOnNonTurtle = request.method==='PATCH' && !item.contentType.match('text/turtle');
  item.isAcl = this.extension==='.acl';
  item.folderFileConfusion = false; // TBD
  item.isAuxResource = false; // TBD
  item.isAcl = false; // TBD
  return item;
}
/*
item = {
  mode: { read: true, write: true, append: true, control: true },
  exists: true,
  isContainer: true,
  pathname: '/home/jeff/Dropbox/Web/solid/solid-rest/2.0.0/test-folder/',
  containedFiles: 0,
  extension: '',
  contentType: 'text/turtle',
  patchOnNonTurtle: false,
  isAcl: false,
  folderFileConfusion: false,
  isAuxResource: false
}

*/
