//This script file also refers to the variables extLinksTable and trackListTable in the albumgenerator HTML doc.

const list_roles = ["composer", "lyricist", "illustrator"];

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
            console.error(error.name);
            console.error(error.message);
            window.alert("Unexpected error: Please recheck given URL");
            return;
        }
        urlquery = "https://vocadb.net/api/artists/" + vocadbid + "?fields=AdditionalNames,MainPicture,Description,ArtistLinks,WebLinks&lang=English"
        try {
            vocadbjson = await getJSonData(urlquery);
        } catch (error) {
            window.alert("Unexpected error: Unable to fetch data from VocaDB Rest API" + "\n\n" + error);
            return;
        }
        
        //Save fetched data to various variables
        pfp_url.push(vocadbjson.mainPicture.urlThumb);
        pfp_url.push(vocadbjson.mainPicture.urlOriginal);
        description = vocadbjson.description;
        mainalias = vocadbjson.name;
        additionalnames = vocadbjson.additionalNames;
        description = "'''" + mainalias + "''' (" + additionalnames + ") is a VOCALOID producer. " + description;

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
            webLink_isMedia = (["YouTube", "Niconico", "bilibili", "piapro", "SoundCloud", "Bandcamp", "Vimeo", "Netease Music", "YouTube Channel", "Spotify", "Tunecore Japan"].includes(webLink_site));
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
        window.alert("Loaded successfully");

    }
    else {
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
        arrStrError.push("You must add a main alias for the producer.");
        $("#mainalias").parent().toggleClass("error",true);
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
    let affliations_raw = read_text("affliations");
    let labels_raw = read_text("labels");
    let description = read_text("description");
    let extlinksdata = extLinksTable.getData();
    let songpagelistdata = songPageTable.getData();
    let albumpagelistdata = albumPageTable.getData();

    let strAffliations = "";
    let strProducerLinks = "";
    let strProducerCategoryNavigation = `==Producer categories==
{{ProdLinks|catname = $_MAINCAT|album =$_cat_album|lyrics =$_cat_lyrics|arrangement =$_cat_arrange|tuning =$_cat_tuning|other =$_cat_other|visuals =$_cat_visuals}}`;
    let strLinksTemplate = `{{links |p=yes
   |at     = $_UTAUDB_SITEID
   |nico   = $_NICOPEDIA_SITEID
   |vocadb = $_VOCADB_SITEID
   |tag    = $_NICOTAG_SITEID
}}`
    let strCategories = "";
    let strSongPageList = "";
    let strAlbumPageList = "";
    let strProducerPage = "";

    let linksTemplate_regex = {
        UTAUDB:/^https?:\/\/w\.atwiki\.jp\/utauuuta\/pages\/(\d*)\.html/,
        NICOPEDIA:/^https?:\/\/dic\.nicovideo\.jp\/id\/(.*)$/,
        VOCADB:/^https?:\/\/vocadb\.net\/Ar\/(\d*)/,
        NICOTAG:/^https?:\/\/www\.nicovideo\.jp\/tag\/(.*)$/
    };

    //Set the producer category navigation
    let list_subcat_checkbox = ["cat_album", "cat_lyrics", "cat_arrange", "cat_tuning", "cat_other", "cat_visuals"];
    list_subcat_checkbox.forEach(checkbox => {
        if (document.getElementById(checkbox).checked) {
            strProducerCategoryNavigation = strProducerCategoryNavigation.replace("$_" + checkbox, "1");
        }
        else {
            strProducerCategoryNavigation = strProducerCategoryNavigation.replace("$_" + checkbox, "");
        }
    });
    strProducerCategoryNavigation = strProducerCategoryNavigation.replace("$_MAINCAT", mainalias);
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
        strAffliations += "==Affliations==\n"
        list_affliations.forEach(affliation => {
            strAffliations += "*" + affliation + "\n"
        });
    };
    if (strAffliations !== "") {strAffliations += "\n\n"}

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

    //Set the song page list
    strSongPageList += "==Works==\n{| class=\"sortable producer-table\"\n|- class=\"vcolor-default\"\n! {{pwt head}}\n";
    songpagelistdata.forEach(songpage => {
        strSongPageList += "|-\n";
        strSongPageList += "| {{pwt row|" + songpage[0].trim();
        if (songpage[1].trim() !== "") {strSongPageList += "|" + songpage[1].trim();};
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
            if (albumpage[1].trim() !== "") {strAlbumPageList += "|" + albumpage[1].trim();};
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