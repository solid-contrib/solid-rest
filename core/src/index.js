import { getRequest } from './examineRequest.js';
import { getItem } from './examineRequestedItem.js';
import { handleRequest } from './handleRequest.js';
import perform from './performRequestedMethod.js';
import { handleResponse } from './handleResponse.js';
import { createServerlessPod, getContentType, isAuxResource, getAuxResources, generateRandomSlug } from './utils/utils.js';
import containerAsTurtle from './utils/container.js';
import RestPatch from './utils/rest-patch.js';
export default class SolidRest {
  constructor(options) {
    options = options || {};

    if (!options.plugin) {
      console.log(`You must specify a plugin storage handler!`);
      process.exit(1);
    }

    this.storage = options.plugin;
    this.handleRequest = handleRequest.bind(this);
    this.handleResponse = handleResponse.bind(this);
    this.getItem = getItem.bind(this);
    this.getRequest = getRequest.bind(this);
    this.perform = perform.bind(this);
    this.isAuxResource = isAuxResource.bind(this);
    this.getAuxResources = getAuxResources.bind(this);
    this.getContentType = getContentType.bind(this);
    this.generateRandomSlug = generateRandomSlug.bind(this);
    this.createServerlessPod = createServerlessPod.bind(this);
    this.containerAsTurtle = containerAsTurtle.bind(this);
    let $rdf = options.parser ? options.parser : typeof window != "undefined" && window.$rdf ? window.$rdf : typeof global != "undefined" && global.$rdf ? global.$rdf : null;
    this.patch = options.patch = $rdf ? new RestPatch($rdf) : null;
  }

  async fetch(uri, options = {}) {
    let response = await this.handleRequest(uri, options);
    return await this.handleResponse(response, options);
  }

  async login(options) {
    options = {loginOptions:options,method:'login'};
    let response = await this.handleRequest('http://example.org/', options);
    return await this.handleResponse(response, options );
  }

  async itemExists(pathname) {
    return await this.perform('ITEM_EXISTS', pathname);
  }

  isPatchConflictError(response) {
    if (response === 400) return true;
  }

  isAccessError(response) {
    if (response === 401) return true;
  }

} // THE END
