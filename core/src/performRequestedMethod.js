
export default async function perform(method, pathname, content, ctype) {
  this.request = this.requestObj;
  method = method || this.request.method;
  this.item = this.item || {
    pathname: pathname
  };
  pathname = pathname || this.item.pathname;
  let res,fn;
  this.response = this.response || {
    headers: {}
  };

  switch (method) {
    case 'STORAGE_NAME':
      return this.storage.name;
      break;

    case 'ITEM_EXISTS':
      pathname = pathname.replace('file://', '');
      return await this.storage.itemExists(pathname);
      break;

    case 'LOGIN':
      return await this.storage.login(this.request.loginoptions);
      break;

    case 'ITEM_TYPE':
      // Container/Resource
      return await this.storage.itemType(pathname);
      break;

    case 'GET_CONTENT_TYPE':
      return await this.storage.getContentType(pathname).bind(this.storage);
      break;

    case 'GET_PATH_HANDLER':
      return await this.storage.getPathHandler(pathname);
      break;

    case 'GET_ITEM_INFO':
      return await this.storage.getItemInfo(pathname,this.request);
      break;

    case 'GET_FILES':
      return await this.storage.getContainer(pathname);
      break;

    case 'DELETE':
      if (this.item.isContainer){
        await this.perform('DELETE_AUX_RESOURCES',pathname)
        return await this.storage.deleteContainer(pathname);
      }
      else {
        await this.perform('DELETE_AUX_RESOURCES',pathname)
        return await this.storage.deleteResource(pathname);
      }
      break;

    case 'DELETE_AUX_RESOURCES':
      const links = (await this.getAuxResources(pathname)) || [];
      try {
        links.map(async link => {
          res = await this.storage.deleteResource(link);
        });
        return true;
      } catch (e) {
        console.log(e);
        return false;
      }
      return 200;
      break;

    case 'CREATE_INTERMEDIATE_CONTAINERS':
      return await this.storage.makeContainers(pathname) || 1;
      break;

    case 'GET':
      if (this.item.isContainer) {
        let files = await this.storage.getContainer(pathname);

        if (files.headers) {
          return files;
        }

        return await this.containerAsTurtle(pathname, files, this.request.typewanted,this);
      } else {
        let thing = await this.storage.getResource(pathname);
        if (!thing) return false;

        if (thing.headers) {
          return thing;
        }

        this.response.body = thing;
        this.response.headers.status = 200;
        return true;
      }

      break;

    case 'OPTIONS':
    case 'HEAD':
      return true;
      break;

    case 'PUT':
      content = content || this.request.body;
      ctype = ctype || this.item.contentType || ""; // console.log('content for put',content);
      let x = await this.storage.putResource(pathname, content, ctype); // console.log('response from put',x);

      return x;
      return await this.storage.putResource(pathname, content, ctype);
      break;

    case 'FULL_PUT':
      let success = await this.storage.makeContainers(pathname);
      if (!success) return false;
      if (typeof content === "undefined") content = this.request.body;
      ctype = ctype || this.item.contentType || "";
      return await this.storage.putResource(pathname, content, ctype);
      break;

    case 'POST':
      if (this.request.headers.link.match("Container")) {
//        this.response.headers.location = pathname.replace(/.*\//,'') + '/';
        this.response.headers.location = pathname + '/';
        return await this.storage.postContainer(pathname, this.request);
      } else {
//        this.response.headers.location = pathname.replace(/.*\//,'');
        this.response.headers.location = pathname;

        return await this.storage.putResource(pathname, this.request.body);
      }

      break;

    case 'PATCH':
      const contentType = this.item.contentType;
      if(!contentType.match(/(text\/turtle|text\/n3|application\/ld\+json|application\/rdf\+xml)/)) return( {
            status: 409,
            body: "can not patch a file of type "+contentType
      });
      if(pathname.endsWith('/')) return( {
            status: 409,
            body: "can not patch a Container"
      });
      let exists=await this.storage.itemExists(pathname.replace('file://',''));
      if( !exists ) await this.perform('FULL_PUT', pathname, "", ctype);
;
      // 415 patchOnNonTurtle is handled already in handleRequest.js
      let oldContent = await this.storage.getResource(pathname);
      oldContent = oldContent && oldContent.body ? oldContent.body : oldContent;
//      if (!oldContent) return false;
      oldContent = typeof oldContent === 'string' ? oldContent : oldContent.toString();
      let newContent,patchStatus;
      try {
        [patchStatus, newContent] = await this.patch.patchContent(oldContent, contentType, this.request);
        if (patchStatus !== 200) {
          return {
            status: patchStatus,
            body: newContent
          };
        }
      } catch (e) {
        if(!e.length) e = "";
        return {
          status: e,
          statusText: e.toString()
        };
      }
//      const status = await this.storage.makeContainers(pathname);

//      if (!status) return false;
//      let putStatus = await this.storage.putResource(pathname, this.request.bod);
      let putStatus = await this.storage.putResource(pathname, newContent);
      putStatus = putStatus && putStatus.body ? putStatus.body : putStatus;
      return putStatus;
      break;
  }
} // ENDS
