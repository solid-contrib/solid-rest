import u from './utils.js';

export async function containerAsturtle( pathname, options, contentsArray, storage ){
    const pathSep = u.pathSep( options.item.pathHandler );
    if(typeof storage.container2turtle != "undefined")
      return storage.container2turtle(pathname,options,contentsArray)
    let filenames=contentsArray.filter( item => {
      if(!item.endsWith('.acl') && !item.endsWith('.meta')){ return item }
    })

    // cxRes
    if ( !pathname.endsWith(pathSep) ) pathname += pathSep
    // if (!pathname.endsWith("/")) pathname += "/"

    let str2 = ""
    let str = "@prefix : <#>. @prefix ldp: <http://www.w3.org/ns/ldp#>.\n"
            + "<> a ldp:BasicContainer, ldp:Container"
    if(filenames.length){
      str = str + "; ldp:contains\n";
      for(var i=0;i<filenames.length;i++){
        // let fn = filenames[i]
        let fn = encodeURI(filenames[i])
        let [ftype,e] =  await storage.getObjectType(pathname + fn,options.request)
        if(ftype==="Container" && !fn.endsWith("/")) fn = fn + "/"
        str = str + `  <${fn}>,\n`

        let ctype = u.getContentType(u.getExtension(fn,options),'Resource')
        ctype = ctype.replace(/;.*/,'')	  
        ftype = ftype==="Container" ? "ldp:Container; a ldp:BasicContainer" : "ldp:Resource"
        str2 = str2 + `<${fn}> a ${ftype}.\n`
        str2 = str2 + `<${fn}> a <http://www.w3.org/ns/iana/media-types/${ctype}#Resource>.\n`
        // str2 = str2 + `<${fn}> :type "${ctype}".\n`
      }
      str = str.replace(/,\n$/,"")
    }
    str = str + `.\n` + str2
    // str = _makeStream(str);
    return  ([200,str])
  }

