# ACL Authorization
 1. [x] WAC-allow in header ( solid-rest : Allways default toRead Append Write Control)
 2. [ ] algorithm 
    - [x] implicit in solid-rest  ( solid-rest : Allways default toRead Append Write Control)
    - inheritance algorithm
 3. [x] authorization properties
    - acl:Read GET
    - ACL Resource acl:Control (POST, PUT, DELETE)
    - Other Resource and Container
      - acl:Append POST, PUT
      - acl:Write POST, PUT, DELETE

# Solid fetch()

## GET
 1. [x] 404 not found
 2. Container
    - [x] Container with contentType text/turtle returns a text/turtle document
    - [ ] with read META
    - [x] with read content list

## POST
 1. [x] do not create missing directories
 2. [ ] 400 slug must not contain / or | ( slug.match(/\/|\||:/) )
 3. [x] slug with .acl or .meta ext must have text/turle contentType : 415 required 
 4. Container : 
    - [ ] create default META
    - [ ] must end with / (add if missing)
 5. [ ] slug without extension add ext to slug : slug = slug + ext
 6. [ ] Resource (path + slug) exists Resource name is server created (path+uuid.V1()+slug)
## PUT
 - [x] Container : 409 not supported by PUT
 - Resource :
    - [x] 415 contentType required
    - [x] 415 ACL RDF contentType : actually text/turtle
    - [x] create missing directories
## DELETE
 - [x] 404 not found
 - [x] with links
    - [x] Container : .acl, .meta .meta.acl
    - [x] Resource : .acl

## OPTIONS

## HEADER

# Other Solid spec
1. contentType : 
   - [x] MUST exist in headers
   - [ ] default to application/octet-stream

2. Container :
   - [ ] MUST end with /
   - [x] contentType for Container defines document type for list content (usually text/turtle)

3. Resource

    3.1 -  Auxiliary Resources (links) : 
    - [x] declared in Resource header
    - [x] actually : ACL (.acl), META (.meta), only META can have ACL
    - [x] RDF content (actually text/turtle)

    3.2 [ ] Resource name should not be parent folder name (not implemented)
    
    3.3 [ ] Resource URL with extension (.ext) : recommended

    3.5 [ ] /profile/card contentType is text/turtle and file is card$.ttl

# NSS resource mapper : manage Resource url <--> file/folder
    - mapFileToUrl : 
      - [ ] encodeURIComponent from split('/)
      - [x] contentType defined by extension,
      - [ ] default to application/octet-stream
      - [ ] remove $.ext
    - mapUrlToFile :
      - [ ] decodeURIComponent
      - [ ] contentType in extension (.ext or $.ext)

