//This script file also refers to the variables extLinksTable and trackListTable in the albumgenerator HTML doc.

const list_roles = ["composer", "lyricist", "tuner", "illustrator", "animator", "arranger", "instrumentalist", "mixer", "masterer"];

const wiki_domain = "vocaloidlyrics";

//Declaration to local JSon file
let listofvocaloid;
fetch("listofvocaloid.json")
    .then(Response => Response.json())
    .then(data => {
        listofvocaloid = data;
});

//Import data from VocaDB
async function importFromVocaDB() {

    //Local declarations
    let vocadbid = "";
    let vocadbjson = "";
    let urlquery = "";

    let mainalias = "";
    let additionalnames = "";
    let description = "";
    let affliations = [];
    let labels = [];
    let pfp_url = [];
    let extLinks = [];    

    let siteurl = $("#preloadfromurl").val().trim();
    //console.log(siteurl);
    if (validateURL(siteurl)) {

        //Fetch data from VocaDB Rest API
        try {
            vocadbid = getVocaDBID(siteurl);
        } catch (error) {
            await $('#loaderdimmer').removeClass('active');
            await $('#loader').removeClass('active');
            console.error(error.name);
            console.error(error.message);
            window.alert("Unexpected error: Please recheck given URL");
            return;
        }
        urlquery = "https://vocadb.net/api/artists/" + vocadbid + "?fields=AdditionalNames,MainPicture,Description,ArtistLinks,WebLinks&lang=English"
        try {
            vocadbjson = await getJSonData(urlquery);
        } catch (error) {
            await $('#loaderdimmer').removeClass('active');
            await $('#loader').removeClass('active');
            window.alert("Unexpected error: Unable to fetch data from VocaDB Rest API" + "\n\n" + error);
            return;
        }
        
        //Save fetched data to various variables
        pfp_url.push(vocadbjson.mainPicture.urlThumb);
        pfp_url.push(vocadbjson.mainPicture.urlOriginal);
        description = vocadbjson.description;
        mainalias = vocadbjson.name;
        additionalnames = vocadbjson.additionalNames;
        description = "'''" + mainalias + "''' (" + additionalnames + ") is a vocal synth producer. " + description;

        //Get the producer's affliations
        vocadbjson.artistLinks.forEach( artistLink => {
            //artistType can be "Label" or "Circle"
            if (artistLink.artist.artistType == "Label") {
                labels.push(artistLink.artist.name);
            }
            else {
                affliations.push(artistLink.artist.name);
            }
        });

        //Get the web links
        let webLink_category = "";
        let webLink_url = "";
        let webLink_description = "";
        let webLink_isMedia = false;
        let webLink_isInactive = false;
        let webLink_isOfficial = false;
        let webLink_site = "";
        vocadbjson.webLinks.forEach( webLink => {
            webLink_category = webLink.category;
            webLink_url = webLink.url;
            webLink_description = webLink.description;
            webLink_isInactive = webLink.disabled;
            webLink_isOfficial = (webLink_category == "Official" || webLink_category == "Commercial")
            webLink_site = identify_website(webLink_url);
            webLink_isMedia = (["YouTube", "Niconico", "bilibili", "piapro", "SoundCloud", "Bandcamp", "Vimeo", "Netease Music", "YouTube Channel", "Spotify", "Tunecore Japan", "bilibili Space"].includes(webLink_site));
            webLink_url = "<a href=\"" + webLink_url + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + webLink_url + "</a>";
            extLinks.push([webLink_url, webLink_description, webLink_isMedia, webLink_isOfficial, webLink_isInactive]);
        });
        webLink_url = "https://vocadb.net/Ar/" + vocadbid;
        webLink_url = "<a href=\"" + webLink_url + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + webLink_url + "</a>";
        extLinks.push([webLink_url, "VocaDB", false, false, false]);

        //Write data to online form
        $("#mainalias").val(mainalias);
        //$("#miscalias").val(additionalnames);
        $("#affliations").val(affliations.join("\n"));
        $("#labels").val(labels.join("\n"));
        $("#description").val(description);
    
        //Write data to input tables
        if (extLinks.length > 0) extLinksTable.setData(extLinks);
        extLinksTable.orderBy(2, 2);
        extLinksTable.orderBy(3, 1);

        //Load image
        $("#thumbrowinner").append("<img src=\"" + pfp_url[0] + "\" width=\"250\" alt=\"Image not found\" onerror=\"this.onerror=null;this.src=\'" + pfp_url[1] + "\';\" />");
        $("#thumbrow").show();

        //Give alert to end user
        await $('#loaderdimmer').removeClass('active');
        await $('#loader').removeClass('active');
        window.alert("Loaded successfully");

    }
    else {
        await $('#loaderdimmer').removeClass('active');
        await $('#loader').removeClass('active');
        window.alert("URL must be from a VocaDB artist page and start with 'https://vocadb.net/Ar/'");
    }
}

/*
 * Check if all required information has been added
 * Returns true if errors are detected
 */
function check_form_for_errors() {

    //console.log("checking errors");

    error_resets();
    let arrStrError = [];

    //Main alias is empty
    if (read_text("mainalias") == "") {
        arrStrError.push("You must add the producer category page name for the producer. (This will be used as the parameter of {{ProdLinks}})");
        $("#mainalias").parent().toggleClass("error",true);
    }

    //No language selected?
    let language = $("#languagelist").dropdown("get value").trim();
    if (language == "") {
        arrStrError.push("You haven't chosen a language.");
        $("#languagelist").toggleClass("error",true);
    }

    //No listed vocal synth engines?
    let synthengine = $("#featuredsynth").dropdown("get value").trim();
    if (synthengine == "") {
        arrStrError.push("Please list at least one vocal synth engine, e.g. VOCALOID. Choose \"Other/Unlisted\" if not on the list.");
        $("#featuredsynth").toggleClass("error",true);
    }

    //Typical roles aren't selected
    rolesdetected = false;
    list_roles.forEach( role => {
        rolesdetected = document.getElementById(role).checked || rolesdetected;
    })
    if (!rolesdetected) {
        arrStrError.push("You must specify at least one role for the producer, e.g. Do they compose their own songs? Are they an illustrator/PV maker for other producers?");
        $("#producerroles").toggleClass("error",true);
    }

    //No description
    if (read_text("description") == "") {
        arrStrError.push("You must add a description for the producer. Even a short description, e.g. \"[PRODUCER] is a VOCALOID producer.\", will do.");
        $("#description").toggleClass("error",true);
    }

    //No ext link
    let extLinkData = extLinksTable.getData(0);
    if (!extLinkData.some(function (extLink) {return detagHref(extLink[0]).trim() !== "";})) {
        arrStrError.push("You must add at least one external link.");
        $("#extlinks").parent().toggleClass("error",true);
    }

    //Needs at least one official link
    if (!extLinkData.some(function (extLink) {
        return detagHref(extLink[0]).trim() !== "" && extLink[3];
    })) {
        arrStrError.push("You must add at least one official external link, e.g. the producer's social media.");
        $("#extlinks").parent().toggleClass("error",true);
    }

    //No song page
    let listsongpage = songPageTable.getColumnData(0);
    if (!listsongpage.some(function (songpage) {return songpage.trim() !== "";})) {
        arrStrError.push("No song page has been added.");
        $("#songpagelist").parent().toggleClass("error",true);
    }
    
    //Write warnings
    if (arrStrError.length) {
        let strError = "<h2>Errors detected:</h2><p><ul>";
        arrStrError.forEach( message => {
          strError += "<li>" + message + "</li>";
        });
        strError += "</ul></p>";
        $("#error").html(strError);
        $("#error").show();
        return true;
      }

  return false;

}

function generateProducerPage() {

    //Check for errors
    let ignoreerrors = document.getElementById("ignoreerrors").checked;
    let bErrorsExist = check_form_for_errors();
    if (!ignoreerrors && bErrorsExist) {
        return;
    }

    //Read data
    let mainalias = read_text("mainalias");
    let miscalias = read_text("miscalias");
    let affliations_raw = read_text("affliations");
    let labels_raw = read_text("labels");
    let description = read_text("description");
    let extlinksdata = extLinksTable.getData();
    let songpagelistdata = songPageTable.getData();
    let albumpagelistdata = albumPageTable.getData();

    let strAffliations = "";
    let strProducerLinks = "";
    let strProducerCategoryNavigation = "==Producer categories==\n{{ProdLinks|$_MAINCAT}}";
    let strLinksTemplate = `{{links |p=yes
   |atmiku = $_MIKUWIKI_SITEID
   |atutau = $_UTAUDB_SITEID
   |nico   = $_NICOPEDIA_SITEID
   |vocadb = $_VOCADB_SITEID
   |tag    = $_NICOTAG_SITEID
   |mgp    = $_MGP_SITEID
}}`
    let strCategories = "";
    let strSongPageList = "";
    let strAlbumPageList = "";
    let strProducerPage = "";

    let linksTemplate_regex = {
        MIKUWIKI:/^https?:\/\/(?:w|www5)\.atwiki\.jp\/hmiku\/pages\/(\d*)\.html/,
        UTAUDB:/^https?:\/\/w\.atwiki\.jp\/utauuuta\/pages\/(\d*)\.html/,
        NICOPEDIA:/^https?:\/\/dic\.nicovideo\.jp\/id\/(.*)$/,
        VOCADB:/^https?:\/\/vocadb\.net\/Ar\/(\d*)/,
        NICOTAG:/^https?:\/\/www\.nicovideo\.jp\/tag\/(.*)$/,
        MGP:/^https?:\/\/mzh\.moegirl\.org\.cn\/(.*)$/
    };

    //Set the producer category navigation
    strProducerCategoryNavigation = strProducerCategoryNavigation.replace("$_MAINCAT", mainalias.replace(" ", "_"));
    strProducerCategoryNavigation += "\n\n"

    //Set the producer's affliations
    let list_label = labels_raw.split("\n").map(x => x.trim()).filter(x => x);
    let list_affliations = affliations_raw.split("\n").map(x => x.trim()).filter(x => x);
    if (list_label.length) {
        strAffliations += "==Labels==\n"
        list_label.forEach(label => {
            strAffliations += "*" + label + "\n"
        });
    };
    if (list_label.length && list_affliations.length) {strAffliations += "\n"};
    if (list_affliations.length) {
        strAffliations += "==Affiliations==\n"
        list_affliations.forEach(affliation => {
            strAffliations += "*" + affliation + "\n"
        });
    };
    if (strAffliations !== "") {strAffliations += "\n"}

    //Set the producer links
    let arrOfficialLinks = extlinksdata.filter( extlink => {
        return detagHref(extlink[0]).trim() !== "" && extlink[3] && !extlink[2];
    });
    let arrMediaLinks = extlinksdata.filter( extlink => {
        return detagHref(extlink[0]).trim() !== "" && extlink[3] && extlink[2];
    });
    let arrUnofficialLinks = extlinksdata.filter( extlink => {
        return detagHref(extlink[0]).trim() !== "" && !extlink[3];
    });
    strProducerLinks += "==External Links==\n";
    if (arrOfficialLinks.length) {
        arrOfficialLinks.forEach( link => {
            strLink = link[1].trim() + ": [" + detagHref(link[0]).trim() + "]";
            if (link[4]) {strLink = "<s>" + strLink + "</s>";};
            strProducerLinks += "* " + strLink + "\n";
        })
        strProducerLinks += "\n";
    }
    if (arrMediaLinks.length) {
        strProducerLinks += "===Media===\n";
        arrMediaLinks.forEach( link => {
            strLink = "[" + detagHref(link[0]).trim() + " " + link[1].trim() + "]";
            if (link[4]) {strLink = "<s>" + strLink + "</s>";};
            strProducerLinks += "* " + strLink + "\n";
        })
        strProducerLinks += "\n";
    }
    if (arrUnofficialLinks.length) {
        strProducerLinks += "===Unofficial===\n";
        let pattern_regex = new RegExp();
        let matched_template_param = [];
        let siteurl = "";
        let siteid = "";
        Object.keys(linksTemplate_regex).forEach( key => {
            pattern_regex = linksTemplate_regex[key];
            matched_template_param = arrUnofficialLinks.filter( extLink => {
                return Array.isArray(detagHref(extLink[0]).trim().match(pattern_regex));
            })
            if (matched_template_param.length) {
                matched_template_param = matched_template_param.slice()[0];
                arrUnofficialLinks.splice(arrUnofficialLinks.indexOf(matched_template_param), 1);
                siteurl = matched_template_param[0];
                siteurl = detagHref(siteurl).trim();
                siteid = [...siteurl.match(pattern_regex)][1];
                console.log(key, siteid);
                strLinksTemplate = strLinksTemplate.replace("$_" + key + "_SITEID", siteid);
            }            
        });
        Object.keys(linksTemplate_regex).forEach( key => {
            strLinksTemplate = strLinksTemplate.replace("$_" + key + "_SITEID", "");
        });
        strProducerLinks += strLinksTemplate + "\n";
        arrUnofficialLinks.forEach( link => {
            strLink = "[" + detagHref(link[0]).trim() + " " + link[1].trim() + "]";
            if (link[4]) {strLink = "<s>" + strLink + "</s>";};
            strProducerLinks += "* " + strLink + "\n";
        })
    }

    //Set the categories
    strCategories += "__NOTOC__\n"
    strCategories += "[[Category:Producers]]" + "\n";
    list_roles.forEach( role => {
        if (document.getElementById(role).checked) {
            setcategory = role.replace(/^(\w)/, function(firstletter) {return firstletter.toUpperCase();})
            strCategories += "[[Category:" + setcategory + "s]]\n";
        }
    })
    //Categories: Language
    let arrLanguages = [];
    arrLanguages = $("#languagelist").dropdown("get value").split(",");
    arrLanguages = arrLanguages.map(function (lang) {return lang == "" ? "" : languages[lang].name});
    if (arrLanguages.length && arrLanguages[0] !== "") { 
        arrLanguages.forEach(lang => {
            if (lang == "Mandarin") {lang = "Chinese"};
            strCategories += "[[Category:" + lang + " original producers]]\n";
        });
    }
    //Categories: Vocal Synth Groups
    let arrFeaturingSynths = [];
    arrFeaturingSynths = $("#featuredsynth").dropdown("get value").split(",");
    if (arrFeaturingSynths.length && arrFeaturingSynths[0] !== "") { 
        arrFeaturingSynths.forEach(featuredSynth => {
            strCategories += "[[Category:Producers using " + featuredSynth + "]]\n";
        });
    }

    //Set the song page list
    let add_params = "";
    strSongPageList += "==Works==\n";
    strSongPageList += miscalias == "" ? "" : "{{pwt alias|" + miscalias + "}}\n";
    strSongPageList += "{| class=\"sortable producer-table\"\n|- class=\"vcolor-default\"\n! {{pwt head}}\n";
    songpagelistdata.forEach(songpage => {
        strSongPageList += "|-\n";
        strSongPageList += "| {{pwt row|" + songpage[0].trim();
        add_params = songpage[1].trim();
        if (add_params !== "") {
            strSongPageList += add_params.match(/^\|/) ? "" : "|";
            strSongPageList += add_params;
        };
        strSongPageList += "}}\n";
    })
    strSongPageList += "|}"
    strSongPageList += "\n\n";

    //Set the album page list
    if (albumpagelistdata.some(function (albumpage) {return albumpage[0].trim() !== "";})) {
        strAlbumPageList += "==Discography==\n{| class=\"sortable producer-table\"\n|- class=\"vcolor-default\"\n! {{awt head}}\n";
        albumpagelistdata.forEach(albumpage => {
            strAlbumPageList += "|-\n";
            strAlbumPageList += "| {{awt row|" + albumpage[0].trim();
            add_params = albumpage[1].trim();
            if (add_params !== "") {
                add_params.match(/^\|/) ? "" : "|";
                strAlbumPageList += add_params;
            };
            strAlbumPageList += "}}\n";
        })
        strAlbumPageList += "|}";
        strAlbumPageList += "\n\n";
    }

    //Finally write the producer page
    strProducerPage += "<div class=\"producer-links\">\n[[File:FILENAME HERE|250px|center]]\n";
    strProducerPage += strProducerCategoryNavigation;
    strProducerPage += strAffliations;
    strProducerPage += strProducerLinks;
    strProducerPage += "</div>\n\n";
    strProducerPage += description;
    strProducerPage += "\n\n";
    strProducerPage += strSongPageList;
    strProducerPage += strAlbumPageList;
    strProducerPage += strCategories;
    
    $("#output").val(strProducerPage);
}

function listLinksInWikitextFormat(arrLinks, bLinksAreOfficial) {

    let strWikiExternalLinks = "";
  
    if (!Array.isArray(arrLinks) || arrLinks.length == 0) {return strWikiExternalLinks;}
  
    if (bLinksAreOfficial) {
        //strWikiExternalLinks += "===Official===";
    }
    else {strWikiExternalLinks += "===Unofficial===";};
  
    let url = "";
    let description = "";
    let wiki = "";
    let page = "";
    let strExtLink = "";
  
    arrLinks.forEach(extLink => {
      url = detagHref(extLink[0].trim());
      description = extLink[1];
      //VocaDB
      if (url.match(/^https?:\/\/vocadb\.net\/.*/)) {
        strExtLink = "*{{VDB|" + url.replace(/^https?:\/\/vocadb\.net\//, "") + "|" + description + "}}";
      }
      //Fandom Wiki
      else if (url.match(/^https?:\/\/.*\.fandom\.com\/.*/)) {
        wiki = url.replace(/^https?:\/\//, "").replace(/\.fandom\.com\/wiki\/.*/, "");
        page = url.replace(/^https?:\/\/.*\.fandom\.com\/wiki\//, "");
        page = decodeURI(page);
        strExtLink = "*[[w:c:" + wiki + ":" + page + "|" + description + "]]";
      }
      //Wikipedia
      else if (url.match(/^https?:\/\/en\.wikipedia\.org\/wiki\/.*/)) {
        page = url.replace(/^https?:\/\/en\.wikipedia\.org\/wiki\//, "");
        page = decodeURI(page);
        strExtLink = "*[[wikipedia:" + page + "|" + description + "]]";
      }
      else {
        strExtLink = "*[" + url + " " + description + "]";
      };
      strWikiExternalLinks = addItemToListString(strExtLink, strWikiExternalLinks, "\n");
    });
    if (strWikiExternalLinks !== "") {strWikiExternalLinks = "\n" + strWikiExternalLinks};
  
    return strWikiExternalLinks;
  
}

async function getListOfSongsFromWiki(producer_name) {

    let urlquery = "";
    let wikijson = "";
    let wikijson_subcat = "";

    let list_of_queried_items;
    let list_of_page_titles = [];
    let list_of_subcategories = [];
    let list_of_albums = [];
    let list_of_pages_in_subcat = [];

    urlquery = "https://" + wiki_domain + ".fandom.com/api.php?action=query&format=json&list=categorymembers&cmtitle=Category:" + producer_name + "_songs_list&cmprop=title|sortkeyprefix&cmlimit=500&cmtype=page|subcat&cmsort=sortkey&cmdir=ascending&origin=*";
    //urlquery = "https://vocaloidlyrics.fandom.com/api.php?action=query&format=json&generator=categorymembers&gcmtitle=Category:" + producer_name + "_songs_list&gcmtype=page|subcat&gcmlimit=500&prop=pageprops&gcmsort=sortkey&gcmdir=ascending&origin=*";
    
    try {
        wikijson = await getJSonData(urlquery);
    } catch (error) {
        throw ("Error: Unable to obtain data from API. The error code is as shown:" + "\n\n" + error);
    }

    console.log(wikijson);

    list_of_queried_items = wikijson.query.categorymembers;

    if (!Array.isArray(list_of_queried_items) || list_of_queried_items.length == 0) {
        throw ("Error: Cannot find any pages under the given producer name");
    }

    //console.log(list_of_queried_items);

    list_of_page_titles = list_of_queried_items.filter(page => page.ns == 0);
    list_of_page_titles = list_of_page_titles.map(function(page) {
        page_title = unicodeToChar(page.title);
        sortkey = page.sortkeyprefix;
        sortkey = sortkey ? unicodeToChar(sortkey) : page_title;
        return [page_title, sortkey];
    });
    //(list_of_page_titles);

    list_of_subcategories = list_of_queried_items.filter(page => page.ns == 14);
    list_of_subcategories = list_of_subcategories.map(function(page) {return unicodeToChar(page.title)});

    album_subcat = "Category:" + producer_name + " songs list/Albums";
    if (list_of_subcategories.includes(album_subcat)) {
        list_of_subcategories = list_of_subcategories.filter(item => item !== album_subcat);
        urlquery = "https://" + wiki_domain + ".fandom.com/api.php?action=query&format=json&list=categorymembers&cmtitle=" + album_subcat + "&cmprop=title|sortkeyprefix&cmlimit=500&cmtype=page&cmsort=sortkey&cmdir=ascending&origin=*";
        try {
            wikijson_subcat = await getJSonData(urlquery);
        } catch (error) {
            throw ("Unexpected error occured. The error code is as shown:" + "\n\n" + error);
        };
        list_of_albums = wikijson_subcat.query.categorymembers.map(function(page) {
            return unicodeToChar(page.title);
        });
    };

    for (let i=0; i<list_of_subcategories.length; i++) {
        subcat = list_of_subcategories[i];
        list_of_pages_in_subcat = [];

        urlquery = "https://" + wiki_domain + ".fandom.com/api.php?action=query&format=json&list=categorymembers&cmtitle=" + subcat + "&cmprop=title|sortkeyprefix&cmlimit=500&cmtype=page&cmsort=sortkey&cmdir=ascending&origin=*";
        try {
            wikijson_subcat = await getJSonData(urlquery);
        } catch (error) {
            throw ("Unexpected error occured. The error code is as shown:" + "\n\n" + error);
        };
        list_of_queried_items = wikijson_subcat.query.categorymembers;
        list_of_pages_in_subcat = list_of_queried_items.map(function(page) {
            page_title = unicodeToChar(page.title);
            sortkey = page.sortkeyprefix;
            sortkey = sortkey ? unicodeToChar(sortkey) : page_title;
            return [page_title, sortkey];
        });

        //console.log(list_of_pages_in_subcat);

        list_of_page_titles.push(...list_of_pages_in_subcat.filter(item => 
            !list_of_page_titles.map(item_2 => item_2[0]).includes(item[0]) 
        ));
    };

    //Sort pages by sortkey (as stored in wiki)
    list_of_page_titles.sort((a, b) => {
        if (a[1] < b[1]) {return -1;}
        if (a[1] > b[1]) {return 1;}
        return 0;
    });

    return [
        list_of_page_titles.map(item => item[0]),
        list_of_albums
    ];

};

async function queryFromWiki() {
    producer_alias = read_text("mainalias");
    producer_alias = producer_alias.replace(/^(\w)/, w => w.toUpperCase());
    try {
        res = await getListOfSongsFromWiki(producer_alias);
    } catch (error) {
        await $('#loaderdimmer').removeClass('active');
        await $('#loader').removeClass('active');
        window.alert(error);
        return;
    };
    await $('#loaderdimmer').removeClass('active');
    await $('#loader').removeClass('active');
    [list_of_page_titles, list_of_albums] = res;
    //console.log(list_of_page_titles);
    //console.log(list_of_albums);
    songPageTable.setData(list_of_page_titles.map(item => [item, ""]));
    albumPageTable.setData(list_of_albums.map(item => [item, ""]));
    window.alert("Finished querying the list of pages from the Vocaloid Lyrics Wiki and copied them onto the tables.");
}

async function getJSonData(urlquery) {
    try {
        let res = await fetch(urlquery);
        return await res.json();
    } catch (error) {
        console.log(error);
        throw "Error: unable to obtain requested information";
    }
}

function validateURL(siteurl) {
    if (siteurl.match(/^https?:\/\/vocadb\.net\/Ar\/.*/)) {return true;}
    else {return false;}    
}

function getVocaDBID(siteurl) {
    let tryregex = siteurl.match(/(?<=^https?:\/\/vocadb\.net\/Ar\/)\d*/gm);
    if (Array.isArray(tryregex)) {siteurl = tryregex[0];};
    return siteurl;
}
