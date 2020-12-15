export default async function perform(method,pathname,arg){
  method = method || this.request.method;
  pathname = pathname || this.item.pathname;
  let res;
  this.response = this.response || {headers:{}};
  switch( method ) {

    case 'STORAGE_NAME':
      return this.storage.name;
    break;

    case 'ITEM_EXISTS':
      return await this.storage.itemExists(pathname);
    break;

    case 'ITEM_TYPE': // Container/Resource
      return await this.storage.itemType(pathname);
    break;

    case 'GET_ITEM_INFO':
      return await this.storage.getObjectType(pathname,arg)
    break;

    case 'GET_FILES':
      return await this.storage.getContainer(pathname)
    break;

    case 'DELETE_AUX_RESOURCES':
      const links = await this.getAuxResources(pathname) || [];
      try {
        links.map( async (link) => { await this.storage.deleteResource(link) })
      }
      catch(e){ console.log(e); return null; }
      return 200;
    break;

    case 'CREATE_INTERMEDIATE_CONTAINERS':
      return await this.storage.makeContainers(pathname);
    break;

    case 'GET':
      if( this.item.isContainer ){
        let files = await this.storage.getContainer(pathname)
        return await this.containerAsTurtle(pathname,files)
      }
      else {
        return await this.storage.getResource(pathname)
      }
    break;

    case 'OPTIONS':
    case 'HEAD':
        return [200];
    break;

    case 'PUT':
      return await this.storage.putResource(pathname,this.request.body);
    break;

    case 'DELETE':
      if (this.item.isContainer) 
        return await this.storage.deleteContainer(pathname)
      else
        return await this.storage.deleteResource(pathname)
    break;

    case 'POST':
      if( this.request.headers.link.match("Container") ){
        this.response.headers.location = pathname + '/';
        return await this.storage.postContainer(pathname,this.request)
      }
      else {
        this.response.headers.location = pathname;
        return await this.storage.putResource(pathname,this.request.body)
      }
    break;

    case 'PATCH':
      let [getStatus,oldContent,h] = await this.storage.getResource(pathname)
      if(getStatus !== 200) return [getStatus]
      oldContent = typeof oldContent === 'string' 
        ? oldContent : oldContent.toString()
      const contentType = this.getContentType( this.getExtension(pathname) );
      if (contentType !== 'text/turtle')
        return [400,"Can not patch : ${pathname} is not a text/turtle file"]; 
      let newContent;
      try {
        const [patchStatus, newContent] = await this.patch.patchContent(
          oldContent, contentType, this.request
        )
        if ( patchStatus !== 200 ) return [ patchStatus, newContent ]
      } catch (e) { return [parseInt(e),e] }
      const status = await this.storage.makeContainers(pathname);
      if(!status) return [500]
      this.request.body = newContent
      const [putStatus,,putHeaders] = await this.storage.putResource(
        pathname, this.request.body
      );
      return [putStatus,newContent];
    break;

  }
}
