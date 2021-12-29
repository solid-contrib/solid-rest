// import libPath from 'path';


export default async function containerAsTurtle(pathname, contentsArray, typeWanted,self) {
  const pathSep = self.pathSep;
  function basename(path) {
    return path.substr(path.lastIndexOf(self.pathSep) + 1);
  }
  let filenames = contentsArray.filter(item => {
    if (item.path && !item.path.endsWith('.acl') && !item.path.endsWith('.meta')) {
      return item;
    }
  });
  if (!pathname.endsWith(pathSep)) pathname += pathSep;
  let str2 = "";
  let str = `
@prefix : <#>.
@prefix ldp: <http://www.w3.org/ns/ldp#>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix stat: <http://www.w3.org/ns/posix/stat#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
<> a ldp:BasicContainer, ldp:Container
`;

  if (filenames.length) {
    str = str + "; ldp:contains\n";

    for (var i = 0; i < filenames.length; i++) {
      let fn = filenames[i].path;
      if (typeWanted) fn = "/" + typeWanted + fn;
      fn = encodeURI(fn);
      fn = basename(fn);  // contained resources are relative to folder
      if (filenames[i].isContainer && !fn.endsWith("/")) fn = fn + "/";
      str = str + `  <${fn}>,\n`;
      let ftype = filenames[i].isContainer ? "Container" : "Resource";
      let ctype,size,mtime,modified;
      if(self && self.storage.getMetadata){
        try {
          let i = await self.storage.getMetadata(pathname+"/"+fn);
          ctype = i.contentType
          size = i.size;
          mtime = i.mtime;
          modified = i.modified;
        }
        catch(e){console.log(e)}
      }
      ctype = ctype || await self.getContentType(fn, ftype) || "";
      // REMOVE CHARSET FROM CONTENT-TYPE
      ctype = ctype.replace(/;.*/, '');
      ftype = filenames[i].isContainer ? "ldp:Container; a ldp:BasicContainer; a ldp:Resource" : "ldp:Resource";
      str2 = str2 + `<${fn}> a ${ftype}.\n`;
      if(ctype)
        str2 = str2 + `<${fn}> a <http://www.w3.org/ns/iana/media-types/${ctype}#Resource>.\n`; // str2 = str2 + `<${fn}> :type "${ctype}".\n`
      if(size){
        str2 = str2 + `<${fn}> stat:size ${size}; stat:mtime ${mtime}; dct:"${modified}"^^xsd:dateTime.\n`
      }
    }

    str = str.replace(/,\n$/, "");
  }

  str = str + `.\n` + str2; // str = _makeStream(str);

  return str;
}
