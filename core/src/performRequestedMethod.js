export default async function perform(method, pathname, content, ctype) {
  this.request = this.requestObj;
  method = method || this.request.method;
  this.item = this.item || {
    pathname: pathname
  };
  pathname = pathname || this.item.pathname;
  let res;
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

    case 'GET_ITEM_INFO':
      return await this.storage.getItemInfo(pathname, content);
      break;

    case 'GET_FILES':
      return await this.storage.getContainer(pathname);
      break;

    case 'DELETE_AUX_RESOURCES':
      const links = (await this.getAuxResources(pathname)) || [];

      try {
        links.map(async link => {
          await this.storage.deleteResource(link);
        });
      } catch (e) {
        console.log(e);
        return null;
      }

      return 200;
      break;

    case 'CREATE_INTERMEDIATE_CONTAINERS':
      return await this.storage.makeContainers(pathname);
      break;

    case 'GET':
      if (this.item.isContainer) {
        let files = await this.storage.getContainer(pathname);

        if (files.headers) {
          return files;
        }

        return await this.containerAsTurtle(pathname, files, this.request.typewanted);
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
      ctype = ctype || this.item.contentType; // console.log('content for put',content);
      let x = await this.storage.putResource(pathname, content, ctype); // console.log('response from put',x);

      return x;
      return await this.storage.putResource(pathname, content, ctype);
      break;

    case 'FULL_PUT':
      let success = await this.storage.makeContainers(pathname);
      if (!success) return false;
      if (typeof content === "undefined") content = this.request.body;
      ctype = ctype || this.item.contentType;
      return await this.storage.putResource(pathname, content, ctype);
      break;

    case 'DELETE':
      if (this.item.isContainer) return await this.storage.deleteContainer(pathname);else return await this.storage.deleteResource(pathname);
      break;

    case 'POST':
      if (this.request.headers.link.match("Container")) {
        this.response.headers.location = pathname + '/';
        return await this.storage.postContainer(pathname, this.request);
      } else {
        this.response.headers.location = pathname;
        return await this.storage.putResource(pathname, this.request.body);
      }

      break;

    case 'PATCH':
      // 415 patchOnNonTurtle is handled already in handleRequest.js
      let oldContent = await this.storage.getResource(pathname);
      oldContent = oldContent && oldContent.body ? oldContent.body : oldContent;
      if (!oldContent) return false;
      oldContent = typeof oldContent === 'string' ? oldContent : oldContent.toString();
      const contentType = this.item.contentType;
      let newContent;

      try {
        const [patchStatus, newContent] = await this.patch.patchContent(oldContent, contentType, this.request);

        if (patchStatus !== 200) {
          return {
            status: patchStatus,
            statusText: newContent
          };
        }
      } catch (e) {
        return {
          status: parseInt(e),
          statusText: e
        };
      }

      const status = await this.storage.makeContainers(pathname);
      if (!status) return false;
      let putStatus = await this.storage.putResource(pathname, this.request.body);
      putStatus = putStatus && putStatus.body ? putStatus.body : putStatus;
      return putStatus;
      break;
  }
} // ENDS
