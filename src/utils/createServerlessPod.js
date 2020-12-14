
module.exports.profile_content = `@prefix : <#>.
@prefix jef: <../>.
@prefix ldp: <http://www.w3.org/ns/ldp#>.
@prefix inbox: <../inbox/>.
@prefix pro: <./>.
@prefix ter: <http://www.w3.org/ns/solid/terms#>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.
@prefix pim: <http://www.w3.org/ns/pim/space#>.
@prefix n2: <http://>.
@prefix n3: <https://>.
@prefix vcard: <http://www.w3.org/2006/vcard/ns#>.
@prefix sch: <http://schema.org/>.
@prefix n1: <http://www.w3.org/ns/auth/acl#>.

pro:card a foaf:PersonalProfileDocument; foaf:maker :me; foaf:primaryTopic :me.

:me
    a sch:Person, foaf:Person;
    vcard:fn "Local Solid User";
    vcard:role "software developer";
    n1:trustedApp
            [
                n1:mode n1:Append, n1:Control, n1:Read, n1:Write;
                n1:origin <http://example.org>
            ];
    ldp:inbox inbox:;
    pim:preferencesFile <../settings/prefs.ttl>;
    pim:storage jef:;
    ter:account jef:;
    ter:privateTypeIndex <../settings/privateTypeIndex.ttl>;
    ter:publicTypeIndex <../settings/publicTypeIndex.ttl>;
    foaf:name "Local Solid User".
`;

module.exports.prefs_content = `@prefix : <#>.
@prefix solid: <http://www.w3.org/ns/solid/terms#>.
@prefix sp: <http://www.w3.org/ns/pim/space#>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix c: <../profile/card#>.
@prefix mee: <http://www.w3.org/ns/pim/meeting#>.

<> a sp:ConfigurationFile; dct:title "Preferences file".

c:me
    a solid:Developer, solid:PowerUser;
    solid:privateTypeIndex <privateTypeIndex.ttl>;
    solid:publicTypeIndex <publicTypeIndex.ttl>.
`;

module.exports.public_content = `@prefix : <#>.
@prefix solid: <https://www.w3.org/ns/solid/terms#>.
@prefix terms: <http://purl.org/dc/terms/>.
@prefix ter: <http://www.w3.org/ns/solid/terms#>.
@prefix bookm: <http://www.w3.org/2002/01/bookmark#>.

<> a solid:ListedDocument, solid:TypeIndex; terms:references :Bookmark.

:Bookmark
    a ter:TypeRegistration;
    ter:forClass bookm:Bookmark;
    ter:instance <../bookmarks.ttl>.
`;
module.exports.private_content = `
@prefix solid: <https://www.w3.org/ns/solid/terms#>.
<>
    a solid:TypeIndex ;
    a solid:UnlistedDocument.
`;

module.exports.acl_content = `@prefix acl: <http://www.w3.org/ns/auth/acl#>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.

# The homepage is readable by the public
<#public>
    a acl:Authorization;
    acl:agentClass foaf:Agent;
    acl:accessTo <./>;
    acl:mode acl:Read.

# The owner has full access to every resource in their pod.
# Other agents have no access rights,
# unless specifically authorized in other .acl resources.
<#owner>
    a acl:Authorization;
    acl:agent <./profile/card#me>;
    # Set the access to the root storage folder itself
    acl:accessTo <./>;
    # All resources will inherit this authorization, by default
    acl:default <./>;
    # The owner has all of the access modes allowed
    acl:mode
        acl:Read, acl:Write, acl:Control.
`;

/* ENDS */

