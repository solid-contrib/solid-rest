export default async function containerAsTurtle(pathname, contentsArray, typeWanted) {
  const pathSep = this.pathSep;
  let filenames = contentsArray.filter(item => {
    if (!item.path.endsWith('.acl') && !item.path.endsWith('.meta')) {
      return item;
    }
  });
  if (!pathname.endsWith(pathSep)) pathname += pathSep;
  let str2 = "";
  let str = "@prefix : <#>. @prefix ldp: <http://www.w3.org/ns/ldp#>.\n" + "<> a ldp:BasicContainer, ldp:Container";

  if (filenames.length) {
    str = str + "; ldp:contains\n";

    for (var i = 0; i < filenames.length; i++) {
      let fn = filenames[i].path;
      if (filenames[i].isContainer && !fn.endsWith("/")) fn = fn + "/";
      if (typeWanted) fn = "/" + typeWanted + fn;
      fn = encodeURI(fn);
      str = str + `  <${fn}>,\n`;
      let ftype = filenames[i].isContainer ? "Container" : "Resource";
      let ctype = this.getContentType(this.getExtension(fn), ftype);
      ctype = ctype.replace(/;.*/, '');
      ftype = filenames[i].isContainer ? "ldp:Container; a ldp:BasicContainer; a ldp:Resource" : "ldp:Resource";
      str2 = str2 + `<${fn}> a ${ftype}.\n`;
      str2 = str2 + `<${fn}> a <http://www.w3.org/ns/iana/media-types/${ctype}#Resource>.\n`; // str2 = str2 + `<${fn}> :type "${ctype}".\n`
    }

    str = str.replace(/,\n$/, "");
  }

  str = str + `.\n` + str2; // str = _makeStream(str);

  return str;
}