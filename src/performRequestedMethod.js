export default async function perform(method,pathname){
    pathname = pathname || this.item.pathname;
    let res;
    switch( method || this.request.method ) {
      case 'GET':
        if( this.item.isContainer ){
          let files = await this.storage.getContainer(pathname)
          return await this.containerAsTurtle(pathname,files)
        }
        else {
          return await this.storage.getResource(pathname)
        }
        break;
      case 'PUT':
        res =  await this.storage.putResource(pathname,this.request,this.item)
        return(res)
        break;
      case 'CREATE_INTERMEDIATE_CONTAINERS':
        res = await this.storage.makeContainers(pathname)
        return(res)
        //return await this.storage.makeContainers(pathname)
        break;
      default:

  }
}
/*
  async GET(pathname,options,storage){
    if( options.item.isContainer ){
      let files = await storage.getContainer(pathname,options)
      return await containerAsturtle(pathname,options,files,storage)
    }
    else {
      return await storage.getResource(pathname,options)
    }
  }

  async DELETE(pathname,options,storage){
    const links = await this.getLinks(pathname, options,storage);
    if (links.length) 
      links.map( async (link) => {
        await storage.deleteResource(link,options)
      })
    if (options.item.isContainer) 
      return await storage.deleteContainer(pathname,options)
    else
      return await storage.deleteResource(pathname,options)
  }

  async PUT(pathname,options,storage){
return(777);
  }
  async POST(pathname,options,storage){
return(777);
  }
  async PATCH(pathname,options,storage){
return(777);
  }
  async HEAD(pathname,options,storage){
return(777);
  }
  async OPTIONS(pathname,options,storage){
return(777);
  }
  
}

*/
