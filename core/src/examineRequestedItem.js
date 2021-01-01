import libPath from "path";
import Url from "url";
export async function getItem(uri, request) {
  let pathHandler, url, pname;

  if (uri.startsWith('file')) {
    url = Url.format(request.url);
    pname = Url.fileURLToPath(url);
    pathHandler = libPath;
  } else {
    url = decodeURIComponent(uri);
    pname = Url.parse(url).pathname;
    pathHandler = libPath.posix;
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
    files = files.filter(file => !this.isAuxResource(file));
    item.containedFiles = files.length;
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

  item.extension = this.getExtension(item.pathname);
  item.contentType = this.getContentType(item.extension);
  item.patchOnNonTurtle = request.method === 'PATCH' && !item.contentType.match('text/turtle');
  item.isAcl = this.extension === '.acl'; // TBD use LinkExt

  item.isAuxResource = item.isAcl || this.extension === '.meta';
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