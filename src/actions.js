import u from './utils.js';
import {containerAsturtle} from './container.js';

async function GET(pathname,options,storage){
  if( options.item.isContainer ){
    let files = await storage.getContainer(pathname,options)
    return await containerAsturtle(pathname,options,files,storage)
  }
  else {
    return await storage.getResource(pathname,options)
  }
}

async function DELETE(pathname,options,storage){
  const links = await u.getLinks(pathname, options,storage);
  if (links.length) 
    links.map( async (link) => {
      await storage.deleteResource(link,options)
    })
  if (options.item.isContainer) 
    return await storage.deleteContainer(pathname,options)
  else
    return await storage.deleteResource(pathname,options)
}

export default {
  DELETE,
  GET,
}
