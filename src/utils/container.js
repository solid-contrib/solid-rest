

export  default async function containerAsTurtle( pathname, contentsArray ){
    const pathSep = this.pathSep;
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
        let ftype = await this.perform('ITEM_TYPE',pathname + filenames[i])
        let fn = encodeURI(filenames[i])
        if(ftype==="Container" && !fn.endsWith("/")) fn = fn + "/"
        str = str + `  <${fn}>,\n`

        let ctype = this.getContentType(this.getExtension(fn),'Resource')
        ctype = ctype.replace(/;.*/,'')	  
        ftype = ftype==="Container" 
          ? "ldp:Container; a ldp:BasicContainer; a ldp:Resource" 
          : "ldp:Resource"
        str2 = str2 + `<${fn}> a ${ftype}.\n`
        str2 = str2 + `<${fn}> a <http://www.w3.org/ns/iana/media-types/${ctype}#Resource>.\n`
        // str2 = str2 + `<${fn}> :type "${ctype}".\n`
      }
      str = str.replace(/,\n$/,"")
    }
    str = str + `.\n` + str2
    // str = _makeStream(str);
    return (str)
  }

