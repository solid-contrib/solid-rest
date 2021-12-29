let $rdf; //import crypto from 'crypto' TODO may be

const PATCH_NS = 'http://www.w3.org/ns/solid/terms#';
const PREFIXES = `PREFIX solid: <${PATCH_NS}>\n`;
const PATCH_PARSERS = {
  'application/sparql-update': parsePatchSparql,
  'text/n3': parsePatchN3
};

export default class RestPatch {

  constructor(passedRDF) {
    $rdf = passedRDF;
  }

  async patchContent(content, contentType, request) {
    const url = request.url;
    const resource = {
      contentType: contentType,
      url: url
    };
    const patch = {
      text: request.body.toString(),
      contentType: request.headers['content-type']
    };
    const parsePatch = PATCH_PARSERS[patch.contentType];
    if (!parsePatch) {
      return[415,`415 Unsupported patch content type: ${patch.contentType}`];
    }
    // Parse the patch document and verify permissions
    const patchUri = `${url}#patch`;
    try {
      const patchObject = await parsePatch(url, patchUri, patch.text);
      const graph = await this.readGraph(content, resource);
      /* rdf.sparqlUpdateParser accepts multiple INSERT statements
         but only applies the last one;  so gives a false 200;
         I trap it here with kldugy regex; TBD - better solution (Jeff)
      */
      let insertStmts = patch.text.match(/INSERT/g);
      if(insertStmts && insertStmts.length>1)
        return [400,"can not have multiple INSERT statements in a patch"];

      await this.applyPatch(patchObject, graph, url);
      const newContent = await this.writeGraph(graph, resource);
      return [200, newContent];
    } catch (e) {
      return [parseInt(e.message), e.message];
    }
  } 

  // PARSE ORIGINAL DOCUMENT
  //
  async readGraph(fileContents, resource) {
    const graph = $rdf.graph();
    if(!fileContents.length) return graph;
    try {
      $rdf.parse(fileContents, graph, resource.url, resource.contentType);
    } catch (err) {
     throw new Error(`500 : Patch: Target ${resource.contentType} file syntax error: ${err}`)  
    }
    return graph;
  } 

  // APPLY PATCH
  //
  async applyPatch(patchObject, graph, url) {
    return new Promise((resolve, reject) => graph.applyPatch(patchObject, graph.sym(url), err => {
      if (err) {
        const message = err.message || err; // returns string at the moment
        return reject(new Error(`409 : The patch could not be applied. ${message}`)) // is this correct : not tested
      }

      resolve(graph);
    }));
  } 

  // serialize graph to turtle
  async writeGraph(graph, resource) {
    const resourceSym = graph.sym(resource.url);
console.log(44,resource.contentType)
    try {
      const serialized = $rdf.serialize(resourceSym, graph, resource.url, resource.contentType)
      return serialized;
    }
    catch(e){console.log(e)}
  }
  // Creates a hash of the given text
  hash(text) {
    return crypto.createHash('md5').update(text).digest('hex');
  }

} // END OF CLASS RestPatch

// PARSE SPARQL
//
  async function parsePatchSparql(targetURI, patchURI, patchText) {
    const baseURI = patchURI.replace(/#.*/, '');
    try {
      return $rdf.sparqlUpdateParser(patchText, $rdf.graph(), baseURI);
    } catch (err) {
     throw new Error(`400 : Patch document syntax error: ${err}`) 
    }
  }

// PARSE N3
//
  async function parsePatchN3(targetURI, patchURI, patchText) {
    const patchGraph = $rdf.graph();
    try {
      $rdf.parse(patchText, patchGraph, patchURI, 'text/n3');
    } catch (err) {
      throw new Error(`400 : Patch document syntax error: ${err}`);
    }
    let firstResult;
    try {
      firstResult = await queryForFirstResult(patchGraph, `${PREFIXES}
      SELECT ?insert ?delete ?where WHERE {
        ?patch a solid:InsertDeletePatch.
        OPTIONAL { ?patch solid:inserts ?insert. }
        OPTIONAL { ?patch solid:deletes ?delete. }
        OPTIONAL { ?patch solid:where   ?where.  }
      }`);
    } catch (err) {
      try {
        firstResult = await queryForFirstResult(patchGraph, `${PREFIXES}
        SELECT ?insert ?delete ?where WHERE {
          ?patch solid:patches <${targetURI}>.
          OPTIONAL { ?patch solid:inserts ?insert. }
          OPTIONAL { ?patch solid:deletes ?delete. }
          OPTIONAL { ?patch solid:where   ?where.  }
        }`);
      } catch (err) {
        throw new Error(`400 : No patch for ${targetURI} found. ${err}`) 
      }
    }
    const {
      '?insert': insert,
      '?delete': deleted,
      '?where': where
    } = firstResult;
    if (!insert && !deleted) {
      return[400, 'Patch should at least contain inserts or deletes.']; 
//      throw error(400, 'Patch should at least contain inserts or deletes.') 
    }
    return {
      insert,
      delete: deleted,
      where
    };
  }

// EXECUTE FIRST SPARQL QUERY IN STORE & RETURN RESULTS
//
  function queryForFirstResult(store, sparql) {
    return new Promise((resolve, reject) => {
      const query = $rdf.SPARQLToQuery(sparql, false, store);
      store.query(query,resolve,null,() => { return ['409 : No results.']});
      // TODO check status
    });
  }
