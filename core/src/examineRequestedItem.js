//import libPath from "path";
import Url from "url";
var pathHandler;

export async function getItem(uri, request) {
  let url, pname;
  pathHandler = await this.perform('GET_PATH_HANDLER',uri);

  if (uri.startsWith('file')) {
    url = Url.format(request.url);
    pname = Url.fileURLToPath(url);
  } else {
    url = decodeURIComponent(uri);
    pname = Url.parse(url).pathname;
  }

  const item = await this.perform('GET_ITEM_INFO', pname, request);
  item.mode = item.mode ? item.mode : {
    read: true,
    append: true,
    write: true
  };
  item.pathname = pname;

  if (request.method === 'DELETE' && item.isContainer) {
    let files = await this.perform('GET_FILES', item.pathname);
    if(!files.filter) item.containedFiles = 0;
    else {
// NO, if it has .acl it should be a containedFile
//      files = files.filter(file => !this.isAuxResource(file));
      item.containedFiles = files.length;
    }
  }

  this.getExtension = path => {
    path = path || this.item.pathname || "";
    if (typeof path === 'object') path = path.path;
    return path.startsWith('.') && !((path.match(/\./g) || []).length > 1) ? path : pathHandler.extname(path);
  };

  this.pathSep = pathHandler.sep;
  this.basename = pathHandler.extname;

  this.mungePath = (pathname, slug, options) => {
    pathname = pathHandler.join(pathname, slug);
    if (pathname.includes('\\')) pathname = pathname.replace(/\\/g, '/');
    return pathname;
  };

  pname = (request.method==="POST") ?this.mungePath(item.pathname,request.slug) :item.pathname;
  item.extension = this.getExtension(pname);
  item.contentType = await this.getContentType(item.pathname);
  item.patchOnNonTurtle = request.method === 'PATCH' && !item.contentType.match('text/turtle');
  item.isAcl = pname.match(/\.acl/); // TBD use LinkExt

  //item.isAuxResource = item.isAcl || this.extension === '.meta';
  item.isAuxResource = pname.match(/\.(acl|meta)$/) ?true :false;

  /*
    let conflict
    // item is container but file of same name exists
    if(item.pathname.endsWith('/')){
      let type = await this.perform('ITEM_TYPE',item.pathname.replace(/\/$/,''))
      item.folderFileConfusion = type && type==='Resource';
      return item;
    }
    conflict = await this.perform('ITEM_EXISTS',item.pathname+'/')
    if(!conflict){
      item.folderFileConfusion = false;
      return item;
    }
    item.folderFileConfusion = true;
  */

  return item;
}
/*
reqWithSlash
  if noSlash exists - fail
  else is container
reqNoSlash
  if method==get and withSlash exists - redirect
  else if withSlash exists - fail
  else is file
*/

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
