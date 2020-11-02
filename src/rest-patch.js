//import RdfQuery from './rdf-query.js' // '../../../../../src/utils/rdf-query.js' //'./rdf-query.js'

const RdfQuery = require('./rdf-query') // new RdfQuery()
const rdf = new RdfQuery()
const termType = ['subject', 'predicate', 'object', 'graph']
const N3 = require('n3')
//const parser = new N3.Parser() //options)


class RestPatch {
  constructor() {}  

  async patchContent (pathname, content, contentType, options) {
    options = {
      format: contentType,
      baseIRI: pathname,
      prefix: 'predicate',
      ...options
    }
    let patchType = options.headers['Content-Type']
      if (!(patchType === 'text/n3' || patchType === 'application/sparql-update')) {
      return [415, '415 patch has an invalid contentType'] // throw '415 patch has an invalid contentType'
    }
    let patchContent = options.body;
    if (patchType === 'application/sparql-update') {
      patchContent = _sparqlToN3(patchContent, pathname);
    }

//console.log(content)
//let testContent = `@prefix c: <#>. c:Tom a c:Cat.`
//let testContent = content //`<> a <test>.` // pathname.startsWith('app') ? content : await content.text() //
//    const store = await this._parse(content, { baseIRI: pathname})
//console.log(store)
    try {
      const parse = await rdf.parse(pathname, content, { baseIRI: pathname })
//console.log('L32 '+parse)
//    } catch (e) { return [401, e.message] }
//    try {
      await _patchN3(patchContent, pathname)
//    } catch (e) { return [401, e.message] }
//    try {
      let resContent = await rdf.write(pathname, options) //, { prefixes: prefixes })
      return [200, resContent]
    } catch (e) {
      e.status = parseInt(e.message) ? parseInt(e.message) : (e.status ? e.status : 400)
      return [e.status, e.message]
    }
  }
}

async function _patchN3 (n3String, patchToUrl) {

  // get stores from solid:patches
  const patchName = 'patchStore'
  try {
    let patchStore = await rdf.parse(patchName, n3String, { format: 'text/n3' })
  } catch(e) { console.log(e.message); throw new Error('400 : '+ e.message) }

  try {
    let patches = await rdf.query(patchName, null, { solid: 'patches' }, null)
    // TODO patches.length = 0

    // needed to work with solid-rest
    if (!patches[0].object.value.includes(patchToUrl)) throw (new Error('400 : wrong destination file in patch'))
    let patchStore1 = await rdf.parse(patchName, n3String, { baseIRI: patchToUrl, format: 'text/n3' })
//console.log(patchStore1)
    // query patch "BlankNode" graphs
    let where = await rdf.query(patchName, null, { solid: 'where' }, null)
    let deletes = await rdf.query(patchName, null, { solid: 'deletes' }, null)
    let inserts = await rdf.query(patchName, null, { solid: 'inserts' }, null)
    if (deletes.length > 1 || inserts.length > 1) throw (new Error('400 : maximum one inserts and one deletes'))
    if (deletes.length+inserts.length === 0) throw (new Error('400 : at least one inserts or deletes'))

    let variable = {}

    // resolves "Variable" for where
    if (where.length) {
        where = await rdf.query(patchName, null, null, null, where[0].object) //{ id: where[0].object }) //
        // get variables
        for (const quad in where) {
          let queryQuad = []
          termType.map(term => {
              if (where[quad][term].termType === 'Variable') { queryQuad[term] = [null, where[quad][term].value] }
              else queryQuad[term] = [where[quad][term]] // [{ id: where[quad][term] }] // [where[quad][term]]// //TODO see rdf-query.js
          })
          let res = await rdf.query(patchToUrl, queryQuad.subject[0], queryQuad.predicate[0], queryQuad.object[0])
          // set variable value
          if (!res.length) throw (new Error('400 : cannot resolve where : no match'))
          for (const term in queryQuad) {
              if (queryQuad[term][0] === null) {
                  const termList = await rdf.getTermList(term, res)
                  const resTerm = Object.keys(termList)
                  if (resTerm.length !== 1) throw (new Error('400 : cannot resolve where : more than one match for ?'+queryQuad[term][1]))
                  variable[queryQuad[term][1]] = resTerm[0]
              }
            }
        }
      const res = Object.keys(variable)
        if (!res.length) throw (new error('400 : cannot resolve where'))
    }
    
    // patch destination graph
    if (deletes.length) {
//      try {
      await _patch(deletes, patchName, variable, patchToUrl, 'deletes') //this.removeQuad.bind(this))
//      } catch(e) {console.log(e)}
    }
    if (inserts.length) {
      try {
      await _patch(inserts, patchName, variable, patchToUrl, 'inserts') //this.addQuad.bind(this))
      } catch(e) {inserts+ '\n'+console.log(e)}
    }
  } catch(e)  { throw new Error(e.message) }
}

async function _patch(quads, patchName, variable, patchToUrl, patchType) {
  const patchQuads = await rdf.query(patchName, null, null, null, quads[0].object) //{ id: quads[0].object })
  for (const quad in patchQuads) {
    const queryQuad = _replaceVariable(patchQuads[quad], variable)
    let success = false
    if (patchType === 'deletes') success = await rdf.removeQuad(patchToUrl, queryQuad.subject[0], queryQuad.predicate[0], queryQuad.object[0]) // .bind(this)
    if (patchType === 'inserts') success = await rdf.addQuad(patchToUrl, queryQuad.subject[0], queryQuad.predicate[0], queryQuad.object[0]) // .bind(this)
    if (!success)
      throw (new Error(`409 : cannot resolve "${patchType}"`))
  }
}

function _sparqlToN3(sparqlString, patchToUrl) {
  const n3String = sparqlString.replace(new RegExp('INSERT', 'g'), '><solid:inserts')
    .replace(new RegExp('DELETE', 'g'), '><solid:deletes').split('><')
  let n3Patch = n3String[0]
    + `\n@prefix solid: <http://www.w3.org/ns/solid/terms#>.\n@prefix : <#>.\n<> solid:patches <${patchToUrl}>`
  for (let i = 1; i < n3String.length; i += 1) {
    if (n3String[i].length) n3Patch = n3Patch + `;\n   ${n3String[i]}`
  }
  n3Patch = n3Patch + '.'
  return n3Patch
}

function _replaceVariable(quad, variable) {
  const termType = ['subject', 'predicate', 'object', 'graph']
  let queryQuad = []
  termType.map(term => {
    if (quad[term].termType === 'Variable') {
      const queryVar = quad[term].value
      if (!variable[queryVar]) throw (new Error ('?' + queryVar + ' : do not exist in solid:where'))
      //quad[term] = NamedNode:  {id : variable[quad[term].value] }
      queryQuad[term] = [{ termType: 'NamedNode', value: variable[quad[term].value] }] //{id: {NamedNode: { id:variable[quad[term].value] } } }//[variable[queryVar]] // quad[term].value]] //[{ id: variable[quad[term].value] }]
      queryQuad[term] = [N3.DataFactory.namedNode(variable[quad[term].value])] //{id: {NamedNode: { id:variable[quad[term].value] } } }//[variable[queryVar]] // quad[term].value]] //[{ id: variable[quad[term].value] }]
      
      /*console.log('variable replaced')
      quad[term] = N3.DataFactory.namedNode(variable[quad[term].value])
      console.log(JSON.stringify(quad[term])) */
    }
    else
      queryQuad[term] = [quad[term]] // [{ id: quad[term] }]
      //console.log(JSON.stringify(queryQuad[term]))
  })
  //console.log('queryQuad')
  //console.log(queryQuad)
  return queryQuad
}

//export default RestPatch
module.exports = exports = RestPatch

/*
required
  query
  parse
  addQuad
  removeQuad
  write
    writeQuads
        addQuads
  getTermList

unused
  parseUrl
  removeMatches
*/
