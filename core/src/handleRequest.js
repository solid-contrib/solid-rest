const methods = {
  DELETE: {
    mustExist: 1,
    requiresWrite: 1
  },
  POST: {
    requiresAppend: 1,
    requiresContentType: 1
  },
  GET: {
    mustExist: 1,
    requiresRead: 1
  },
  HEAD: {
    mustExist: 1,
    requiresRead: 1
  },
  OPTIONS: {
    requiresRead: 1
  },
  PUT: {
    requiresWrite: 1,
    requiresContentType: 1
  },
  PATCH: {
    requiresWrite: 1,
    requiresContentType: 1
  },
  LOGIN: {
  }
};
export async function handleRequest(uri, originalRequest) {
  const request = this.requestObj = await this.getRequest(uri, originalRequest); //
  const item = this.item = await this.getItem(uri, request); //
  // Errors we find in the request
  if (!request.url || !request.method) return 400;
  if (request.slug.endsWith('/')) return 400;
  if (request.originMismatch) return 403;
  if (request.unsupportedAcceptFormat) return 405;
  if (request.method === 'PATCH' && !this.patch) return 405;
  if (request.method === 'POST' && !request.headers.link) return 400;
  // Errors we find by comparing the request & the itemRequested
  if(item.isContainer && !item.contentType) item.contentType="text/turtle";
  if (item.folderFileConfusion) return 400; // can't have both /foo and /foo/
  if (item.patchOnNonRdf) return 400;

  if (item.isAuxResource) {
    if (item.isAcl) request.method.requiresControl = true;
    if (request.method === "POST") return 403;
  }
  if (item.mode.write) item.mode.append = true;

  const method = methods[request.method];
  if (!method) console.log(55,request.method);
  if (!method) return 409;
  if (method.mustExist && !item.exists) return 404;
  if (method.requiresRead && !item.mode.read || method.requiresAppend && !item.mode.append || method.requiresWrite && !item.mode.write || method.requiresControl && !item.mode.control) return 401;

  if (method.requiresContentType && !request.headers['content-type']) {
//    console.log(request.method, "No Content Type");
    return 400;
  }

  if (request.method === 'POST') {
    this.item.pathname = await this.generateRandomSlug(this.item.pathname, request.slug);
  } //
  // Errors from carrying out the request


  if (request.method === 'PUT' || request.method==='POST' || request.method === 'PATCH') {
    // if (item.isContainer) return 405;
    let okDir = await this.perform('CREATE_INTERMEDIATE_CONTAINERS');
    if (!okDir) return 500;
  }

  let response = await this.perform(request.method);
  if (!response && request.method === 'DELETE' && item.isContainer){
    let stillExists  = await this.perform('ITEM_EXISTS',this.item.pathname);
    if( stillExists ){
      return 409;
    }
  }
  return response;
} // ENDS
