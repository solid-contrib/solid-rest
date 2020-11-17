let $rdf;
//const crypto = require('crypto') TODO may be

const PATCH_NS = 'http://www.w3.org/ns/solid/terms#'
const PREFIXES = `PREFIX solid: <${PATCH_NS}>\n`

// Patch parsers by request body content type
const PATCH_PARSERS = {
  'application/sparql-update': parsePatchSparql,
  'text/n3': parsePatchN3
}

class RestPatch {

  constructor(passedRDF){
    $rdf = passedRDF;
  }

  async patchContent (content, contentType, options) {
    const url = options.url
    const resource = { 
      contentType: contentType,
      url: url }
    // Obtain details of the patch document
    const patch = {
      text: options.body.toString(),
      contentType: options.headers['content-type'] // normalized to lowercase
    }
    const parsePatch = PATCH_PARSERS[patch.contentType]
    if (!parsePatch) {
      return [415, `Unsupported patch content type: ${patch.contentType}`] 
    }
    // Parse the patch document and verify permissions
    const patchUri = `${url}#patch` // `${url}#patch-${hash(patchContentType)}`
    try {
      const patchObject = await parsePatch(url, patchUri, patch.text)
      const graph = await this.readGraph(content, resource)
      await this.applyPatch(patchObject, graph, url)
      const newContent = await this.writeGraph(graph, resource)
      return [200, newContent]
    } catch(e) { return [parseInt(e.message), e.message] }
  }

  // parse the resource content to graph
  async readGraph (fileContents, resource) {
    const graph = $rdf.graph()
    try {
      $rdf.parse(fileContents, graph, resource.url, resource.contentType)
    } catch (err) {
      throw new Error(`500 : Patch: Target ${resource.contentType} file syntax error: ${err}`)
    }
    return graph
  }
    
  // apply patch to graph
  async applyPatch (patchObject, graph, url) {
    return new Promise((resolve, reject) =>
      graph.applyPatch(patchObject, graph.sym(url), (err) => {
        if (err) {
          const message = err.message || err // returns string at the moment
          return reject(new Error(`409 : The patch could not be applied. ${message}`)) // is this correct : not tested
        }
        resolve(graph)
      })
    )
  }

  // serialize graph to turtle
  async writeGraph (graph, resource) {
      const resourceSym = graph.sym(resource.url)
      const serialized = $rdf.serialize(resourceSym, graph, resource.url, resource.contentType)
    return serialized
  }

  // Creates a hash of the given text
  hash (text) {
    return crypto.createHash('md5').update(text).digest('hex')
  }
}

// Parses the given SPARQL UPDATE document
async function parsePatchSparql (targetURI, patchURI, patchText) {
  const baseURI = patchURI.replace(/#.*/, '')
  try {
    return $rdf.sparqlUpdateParser(patchText, $rdf.graph(), baseURI)
  } catch (err) {
    throw new Error(`400 : Patch document syntax error: ${err}`)
  }
}

// Parses the given N3 patch document
async function parsePatchN3 (targetURI, patchURI, patchText) {

  // Parse the N3 document into triples
  const patchGraph = $rdf.graph()
  try {
    $rdf.parse(patchText, patchGraph, patchURI, 'text/n3')
  } catch (err) {
    throw new Error(`400: Patch document syntax error: ${err}`)
  }

  // Query the N3 document for insertions and deletions
  let firstResult
  try {
    firstResult = await queryForFirstResult(patchGraph, `${PREFIXES}
    SELECT ?insert ?delete ?where WHERE {
      ?patch solid:patches <${targetURI}>.
      OPTIONAL { ?patch solid:inserts ?insert. }
      OPTIONAL { ?patch solid:deletes ?delete. }
      OPTIONAL { ?patch solid:where   ?where.  }
    }`)
  } catch (err) {
    throw new Error(`400 : No patch for ${targetURI} found. ${err}`)
  }

  // Return the insertions and deletions as an rdflib patch document
  const {'?insert': insert, '?delete': deleted, '?where': where} = firstResult
  if (!insert && !deleted) {
    throw error(400, 'Patch should at least contain inserts or deletes.')
  }
  return {insert, delete: deleted, where}
}

// Queries the store with the given SPARQL query and returns the first result
function queryForFirstResult(store, sparql) {
  return new Promise((resolve, reject) => {
    const query = $rdf.SPARQLToQuery(sparql, false, store)
    store.query(query, resolve, null, () => reject(new Error('409 : No results.'))) // TODO check status
  })
}

module.exports = exports = RestPatch
