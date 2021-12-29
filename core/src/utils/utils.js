// import { contentType as contentTypeLookup } from 'mime-types';
import { v1 as uuidv1 } from 'uuid';
import * as pod from './createServerlessPod.js';
const linkExt = ['.acl', '.meta'];
const linksExt = linkExt.concat('.meta.acl');


async function createServerlessPod(base) {
  console.log(`Creating pod at <${base}>`);
  base = base.replace(/\/$/, '');
  base = base.replace(/^[^:]*:\/\//, '');
  await this.perform('FULL_PUT', base + "/.acl", pod.acl_content);
  await this.perform('FULL_PUT', base + "/profile/card", pod.profile_content);
  await this.perform('FULL_PUT', base + "/settings/prefs.ttl", pod.prefs_content);
  await this.perform('FULL_PUT', base + "/settings/privateTypeIndex.ttl", pod.private_content);
  await this.perform('FULL_PUT', base + "/settings/publicTypeIndex.ttl", pod.public_content);
  await this.perform('FULL_PUT', base + "/private/.meta", "");
  await this.perform('FULL_PUT', base + "/.well-known/.meta", "");
  await this.perform('FULL_PUT', base + "/public/.meta", "");
  await this.perform('FULL_PUT', base + "/inbox/.meta", "");
}

async function getContentType(path, type) {
  let ext = this.getExtension(path);
  if (!ext || ext === '.ttl' || ext === '.acl' || ext === '.meta' || type === "Container") {
    return 'text/turtle';
  } else {
//    let ctype = contentTypeLookup(ext) || "";
    let ctype = await this.perform('GET_CONTENT_TYPE',path) || "";
    return ctype;
  }
}

function isAuxResource(o) {
  return linkExt.find(ext => this.getExtension(o) === ext);
  // return linkExt.find(ext => o.extension === ext);
}

async function getAuxResources(pathname) {
  if(pathname.endsWith('.acl')) return [];
  if(pathname.endsWith('.meta')) return [];
  let linksExists = linksExt.filter(async (ext) => await this.perform('ITEM_EXISTS', pathname + ext));
  const links = linksExists.map(ext => pathname + ext);
  return links || [];
}

async function generateRandomSlug(pathname, slug = uuidv1()) {
  let requestUrl = this.mungePath(pathname, slug);
  if (this.item.isContainer && !this.request.url.endsWith(this.pathSep)) requestUrl = requestUrl + this.pathSep;

  if (await this.perform('ITEM_EXISTS', requestUrl)) {
    slug = `${uuidv1()}-${slug}`;
  }

  return this.mungePath(pathname, slug);
}

export { createServerlessPod, getContentType, isAuxResource, getAuxResources, generateRandomSlug, linkExt, linksExt };
