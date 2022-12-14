//This script file also refers to the variables extLinksTable and trackListTable in the albumgenerator HTML doc.

const albumPageTemplate = `{{Album Infobox
|title = $_ROMANIZED_TITLE
|orgtitle = $_ORIGINAL_TITLE
|label = $_LABEL
|desc = $_DESCRIPTION
|vdb = $_VOCADB_ID
|vw = $_VOCALOID_WIKI_LINK

|image = 
|color = $_BGCOLOUR; color:$_FGCOLOUR
$_TRACKLIST
}}

$_EXTERNAL_LINKS

$_DEFAULTSORT
$_CATEGORIES`

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
    let originalTitle = "";
    let transliteratedTitle = "";
    let singers = "";
    let producers = "";
    let label = "";
    let description = "";
    let vocaloidwikiurl = "";
    let vocaloidwikipagename = "";
    let trackList = [];
    let extLinks = [];
    let tryRegex = [];

    let setOfFeaturedEngines = new Set();

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
        urlquery = "https://vocadb.net/api/albums/" + vocadbid + "?fields=MainPicture,PVs,Artists,Tracks,WebLinks&songfields=Artists&lang=English"
        try {
            vocadbjson = await getJSonData(urlquery);
        } catch (error) {
            await $('#loaderdimmer').removeClass('active');
            await $('#loader').removeClass('active');
            window.alert("Unexpected error: Unable to fetch data from VocaDB Rest API" + "\n\n" + error);
            return;
        }
        
        //Save fetched data to various variables
        originalTitle = vocadbjson.defaultName;
        transliteratedTitle = "";

        //Obtain published label, list of featured vocal synths, and list of producers
        let labels = vocadbjson.artists.filter( artist => {
            return artist.categories == "Label" || artist.categories == "Circle"
        });
        labels = labels.map(item => item.name);
        let albumartists = vocadbjson.artists.filter( artist => {
            return artist.categories == "Producer" && !artist.isSupport
        });
        albumartists = albumartists.map(item => item.name);
        //console.log(labels);
        //console.log(albumartists);
        let bAlbumContainsMoreThanOneProducer = albumartists.length > 1;

        let checkofffeaturedsynth = new Set();

        //Obtain tracklist
        let tracks = vocadbjson.tracks;
        let diskno = 0;
        let trackno = 0;
        let trackName = "";
        let trackProdCredits = "";
        let trackVocCredits = "";
        let trackArtists = [];
        let artistname = "";
        let redirect = "";
        let trackVocalist = "";
        tracks.forEach( track => {
            diskno = track.discNumber;
            trackno = track.trackNumber;
            trackName = track.song.defaultName;
            trackArtists = track.song.artists;
            trackProdCredits = "";
            trackVocCredits = "";
            trackArtists.forEach( trackArtist => {
                switch (trackArtist.categories) {
                    case "Vocalist":
                        try {
                            trackVocalist = listofvocaloid[trackArtist.artist.id];
                            setOfFeaturedEngines.add(trackVocalist.synthgroup);
                            artistname = trackVocalist.fullvoicebankname;
                            redirect = trackVocalist.basevoicebankname;
                            if (!checkofffeaturedsynth.has(artistname)) {
                                checkofffeaturedsynth.add(artistname);
                                if (artistname == redirect) {artistname = "[[" + artistname + "]]";}
                                else {artistname = "[[" + artistname + "|" + redirect + "]]";};
                            }
                            else {artistname = redirect};
                        }
                        catch (error) {artistname = trackArtist.name;};
                        trackVocCredits = addItemToListString(artistname, trackVocCredits, ", ");
                        break;
                    case "Producer":
                        if (bAlbumContainsMoreThanOneProducer) {trackProdCredits = addItemToListString(trackArtist.name, trackProdCredits, ", ")};
                        break;
                    default:
                        //do nothing
                        break;
                }
            });
            if (trackVocCredits == "") {trackProdCredits += trackProdCredits == "" ? "Instrumental" : " (Instrumental)"};
            trackList.push([diskno, trackno, trackName, trackProdCredits, trackVocCredits]);
        });

        //Obtain list of official & unofficial reference/web links
        let webLinks = vocadbjson.webLinks;
        let pvLinks = vocadbjson.pvs;
        let weblink_site;
        let weblink_url;
        let bLinkIsOfficial = false;
        weblink_url = "https://vocadb.net/Al/" + vocadbid;
        weblink_url = "<a href=\"" + weblink_url + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + weblink_url + "</a>";
        extLinks[0] = [weblink_url, "VocaDB", false];
        pvLinks.forEach(weblink => {
            weblink_site = "Album crossfade - " + weblink.service;
            weblink_url = "<a href=\"" + weblink.url + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + weblink.url + "</a>";
            bLinkIsOfficial = weblink.pvType !== "Reprint";
            if (bLinkIsOfficial) {
                extLinks.push([weblink_url, weblink_site, bLinkIsOfficial]);
            }
        });
        webLinks.forEach(weblink => {
            weblink_site = identify_website(weblink.url, listRecognizedLinks);
            if (weblink_site == "Vocaloid Wiki") {
                vocaloidwikiurl = weblink.url;
                tryRegex = vocaloidwikiurl.match(/(?<=^https?:\/\/vocaloid\.fandom\.com\/wiki\/).*/);
                if (Array.isArray(tryRegex) && tryRegex.length) {vocaloidwikipagename = tryRegex[0];};
            }
            if (weblink_site !== weblink.description) {weblink_site = addItemToListString(weblink.description, weblink_site, " - ");};
            weblink_url = "<a href=\"" + weblink.url + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + weblink.url + "</a>";
            bLinkIsOfficial = weblink.category == "Commercial" || weblink.category == "Official";
            extLinks.push([weblink_url, weblink_site, bLinkIsOfficial]);
        });

        description = albumartists.length < 4 ? "an album by " + albumartists.map(item => "[[" + item + "]]").join(", ") : "an album featuring several producers";

        //Write data to online form
        $("#originaltitle").val(originalTitle);
        $("#romajititle").val(transliteratedTitle);
        $("#label").val(labels.join(", "));
        $("#singer").val(singers);
        $("#producers").val(producers);
        $("#description").val(description);
        $("#vocadbid").val(vocadbid);
        $("#vocaloidwikipage").val(vocaloidwikipagename);
    
        //Write data to input tables
        if (extLinks.length > 0) extLinksTable.setData(extLinks);
        if (trackList.length > 0) trackListTable.setData(trackList);

        //Add featured synth software
        setOfFeaturedEngines.forEach( featuredEngine => {
            if (listofsynthengines.includes(featuredEngine)) {
                $("#featuredsynth").dropdown("set selected", featuredEngine);
            }
            else {
                $("#featuredsynth").dropdown("set selected", "Other Voice Synthesizer");
            }
        });

        //Load image
        let coverpictureurl = vocadbjson.mainPicture.urlOriginal;
        $("#thumbrowinner").append("<img src=\"" + coverpictureurl + "\" width=\"400\" alt=\"Image not found\">");
        $("#thumbrow").show();

        //Give alert to end user
        await $('#loaderdimmer').removeClass('active');
        await $('#loader').removeClass('active');
        window.alert("Loaded successfully");

    }
    else {
        await $('#loaderdimmer').removeClass('active');
        await $('#loader').removeClass('active');
        window.alert("URL must be from a VocaDB album page and start with 'https://vocadb.net/Al/'");
    }
}

function autoloadCategories() {

    let arr_track_producers = trackListTable.getColumnData(3);
    let arr_track_singers = trackListTable.getColumnData(4);
    let strVocalSynthGroups = $("#featuredsynth").dropdown("get value");
    let arrVocalSynthGroups = strVocalSynthGroups.split(",");
    let str_description = read_text("description");
    let arrSynths = [];
    let arrProducers = [];

    //Producers as listed in the tracklist
    arr_track_producers.forEach( row => {
        try_match = row.match(/(?<=\[\[)[^\[\]]*(?=\]\])/g);
        if (Array.isArray(try_match) && try_match.length) {
            try_match = try_match.map(item => item.replace(/\|.*$/, ""));
            arrProducers.push(...try_match);
        };
    });
    //Producers as listed in the description
    try_match = str_description.match(/(?<=\[\[)[^\[\]]*(?=\]\])/g);
    if (Array.isArray(try_match) && try_match.length) {
        try_match = try_match.map(item => item.replace(/\|.*$/, ""));
        arrProducers.push(...try_match);
    };
    //Singers as listed in the tracklist
    arr_track_singers.forEach( row => {
        try_match = row.match(/(?<=\[\[)[^\[\]]*(?=\]\])/g);
        if (Array.isArray(try_match) && try_match.length) {
            try_match = try_match.map(item => item.replace(/\|.*$/, ""));
            arrSynths.push(...try_match);
        };
        try_match = row.match(/(?<=\{\{[Ss]inger\|)[^\}]*(?=\}\})/g);
        if (Array.isArray(try_match) && try_match.length) {
            try_match = try_match.map(item => item.replace(/\|.*$/, ""));
            arrSynths.push(...try_match);
        };
    });
    //Remove duplicates
    arrProducers = [...new Set(arrProducers)];
    arrSynths = [...new Set(arrSynths)];
    let strCategories = "";

    //Featuring software/engines
    if (strVocalSynthGroups !== "") {
        arrVocalSynthGroups.forEach( synthgroup => {
            strCategories += "Albums featuring " + synthgroup + "\n";
        });
    };

    //Featuring singers
    arrSynths.forEach( synth => {
        synth = synth.trim();
        strCategories += "Albums featuring " + synth + "\n";
    });

    //Featuring Producers
    arrProducers.forEach( producer => {
        producer = producer.trim();
        strCategories += producer + " songs list/Albums\n";
    });

    //Write categories
    $("#categories").val(strCategories);

}

/*
 * Check if all required information has been added
 * Returns true if errors are detected
 */
function check_form_for_errors() {

    //console.log("checking errors");

    error_resets();
    let arrStrWarning = [];
    let bRecommendToReloadCategories = false;

    //No original title given?
    if (read_text("originaltitle") == "") {
        arrStrWarning.push("You haven't entered an album name.");
        $("#originaltitle").parent().toggleClass("error",true);
    }
    
    //Non-recognized colour format for infobox
    if (!validate_colour(read_text("bgcolour"))) {
        arrStrWarning.push("There is an error with the background colour.");
        $("#bgcolour").parent().toggleClass("error",true);
    }
    if (!validate_colour(read_text("fgcolour"))) {
        arrStrWarning.push("There is an error with the foreground colour.");
        $("#fgcolour").parent().toggleClass("error",true);
    }
    
    //No description added
    if (read_text("description") == "") {
        arrStrWarning.push("You must add a short description about the album.");
        $("#description").parent().toggleClass("error",true);
    }
    
    //No VocaDB ID
    if (read_text("vocadbid") == "") {
        arrStrWarning.push("You must add the VocaDB page ID.");
        $("#vocadbid").parent().toggleClass("error",true);
    }

    //No tracks added
    let arrTrackList = trackListTable.getData();
    if (!Array.isArray(arrTrackList) || arrTrackList.length == 0 || 
        !arrTrackList.some(function (rowTrack) {return rowTrack[2] !== "";})) {
        arrStrWarning.push("You must add at least one song to the tracklist.");
        $("#tracklist").parent().toggleClass("error",true);
    }
    else {
        //Tracklist issues
        if (arrTrackList.some(function (rowTrack) {return rowTrack[1] == "";})) {
            arrStrWarning.push("You must add the track listing number to all tracks.");
            $("#tracklist").parent().toggleClass("error",true);
        }
        if (arrTrackList.some(function (rowTrack) {return isNaN(rowTrack[0])})) {
            arrStrWarning.push("The disc number must be numeric.");
            $("#tracklist").parent().toggleClass("error",true);
        }
        if (arrTrackList.some(function (rowTrack) {return isNaN(rowTrack[1])})) {
            arrStrWarning.push("The track listing number must be numeric.");
            $("#tracklist").parent().toggleClass("error",true);
        }
        if (arrTrackList.some(function (rowTrack) {return rowTrack[2].trim() == "";})) {
            arrStrWarning.push("You must add a track name to all tracks.");
            $("#tracklist").parent().toggleClass("error",true);
        }
        if (arrTrackList.some(function (rowTrack) {return rowTrack[3].trim() == "" && rowTrack[4].trim() == "";})) {
            arrStrWarning.push("You must add featured producers/singers to all tracks, or specify that the song is an instrumental if there are no singers.");
            $("#tracklist").parent().toggleClass("error",true);
        }
    }

    //Forgot to autoload categories?
    if (read_text("categories") == "") {
        arrStrWarning.push("Did you forget to add categories?");
        $("#categories").toggleClass("error",true);
        bRecommendToReloadCategories = true;
      }
    
    //Write warnings
    if (arrStrWarning.length) {
        let strWarning = "<h2>Errors detected:</h2><p><ul>";
        arrStrWarning.forEach( message => {
        strWarning += "<li>" + message + "</li>";
        });
        strWarning += "</ul></p>";
        if (bRecommendToReloadCategories) {
        strWarning += "<p>Please click the \"Autoload Categories\" button again before you generate the song page.</p>"
        }
        $("#error").html(strWarning);
        $("#error").show();
        return true;
    }

  return false;

}

function generateAlbumPage() {

    //Check for errors
    let ignoreerrors = document.getElementById("ignoreerrors").checked;
    let bErrorsExist = check_form_for_errors();
    if (!ignoreerrors && bErrorsExist) {
        return;
    }

    let tryRegex = [];

    //Read data
    let romanizedtitle = read_text("romajititle");
    let originaltitle = read_text("originaltitle");
    if (romanizedtitle == "") {
        romanizedtitle = originaltitle;
        originaltitle = "";
    };
    let label = read_text("label");
    let description = read_text("description");
    let vocadbid = read_text("vocadbid");
    let vocaloidwikipage = read_text("vocaloidwikipage");
    let infoboxbgcolour = read_text("bgcolour");
    let infoboxfgcolour = read_text("fgcolour");
    let sorttemplate = "";

    //Get page name
    let pagename = "";
    if (romanizedtitle !== originaltitle) {
        if (originaltitle == "") {pagename = romanizedtitle}
        else {pagename = originaltitle + " (" + romanizedtitle + ")"};
    };
    pagename += " (album)";

    //Read list of categories
    let strCategories = read_text("categories");
    let arrCategories = strCategories.split("\n").map(x => x.trim()).filter(x => x);
    strCategories = "";
    arrCategories.forEach( category => {
        strCategories += "[[Category:" + category + "]]\n"
    });

    //Read tracklist data
    let arrTrackList = trackListTable.getData();
    let diskno = 0;
    let trackno = 0;
    let trackname = "";
    let trackcredits = "";
    let vlwpagename = "";
    let strTrackList = "";
    if (Array.isArray(arrTrackList) && arrTrackList.length) {
        arrTrackList.forEach( track => {
            diskno = track[0];
            trackno = track[1];
            trackname = track[2].trim();
            trackcredits = track[4].trim();
            if (track[3].trim() !== "") {
                tryRegex = detagHref(track[3].trim()).match(/(?<=^https?:\/\/vocaloidlyrics\.fandom\.com\/wiki\/).*/);
                if (Array.isArray(tryRegex) && tryRegex.length) {
                    vlwpagename = tryRegex[0];
                    vlwpagename = decodeURI(vlwpagename);
                    vlwpagename = vlwpagename.replace(/_/g, " ");
                    if (trackname !== vlwpagename) {
                        trackname = "[[" + vlwpagename + "|" + trackname + "]]";
                    }
                    else {
                        trackname = "[[" + vlwpagename+ "]]";
                    }
                }
            }
            if (diskno > 1) {
                strTrackList = addItemToListString("|" + diskno + "tr" + trackno + " = " + trackname, strTrackList, "\n");
                strTrackList = addItemToListString("|" + diskno + "tr" + trackno + "s = " + trackcredits, strTrackList, "\n");
            }
            else {
                strTrackList = addItemToListString("|tr" + trackno + " = " + trackname, strTrackList, "\n");
                strTrackList = addItemToListString("|tr" + trackno + "s = " + trackcredits, strTrackList, "\n");
            };
        });
    };

    //Read external links data
    let arrExtLinks = extLinksTable.getData();
    let strExtLinks = "";
    if (Array.isArray(arrExtLinks) && arrExtLinks.length) {
        let bExtLinkExists = arrExtLinks.some(function (extLink) {return extLink[0].trim() !== "";});;
        if (bExtLinkExists) {
            strExtLinks = "==External Links==";
            let arrOfficialLinks = arrExtLinks.filter(function (extLink) {return extLink[2];});
            let arrUnofficialLinks = arrExtLinks.filter(function (extLink) {return !extLink[2];});
            strExtLinks += listLinksInWikitextFormat(arrOfficialLinks, true);
            strExtLinks += listLinksInWikitextFormat(arrUnofficialLinks, false);
        };
    };

    // Set defaultsort template
    if (romanizedtitle !== originaltitle && originaltitle !== "") {
        sorttemplate = "{{sort-album"
        if (detonePinyin(romanizedtitle, false).replace(/[ -~]/g, "") !== "") {
            sorttemplate += "|" + detonePinyin(romanizedtitle, false) + "}}"
        }
        else {sorttemplate += "}}"}
    };

    //Write data onto the album page template
    let albumpage = albumPageTemplate;
    albumpage = albumpage.replace("$_ROMANIZED_TITLE", romanizedtitle);
    albumpage = albumpage.replace("$_ORIGINAL_TITLE", originaltitle);
    albumpage = albumpage.replace("$_LABEL", label);
    albumpage = albumpage.replace("$_DESCRIPTION", description);
    albumpage = albumpage.replace("$_VOCADB_ID", vocadbid);
    albumpage = albumpage.replace("$_VOCALOID_WIKI_LINK", vocaloidwikipage);
    albumpage = albumpage.replace("$_BGCOLOUR", infoboxbgcolour);
    albumpage = albumpage.replace("$_FGCOLOUR", infoboxfgcolour);
    albumpage = albumpage.replace("$_CATEGORIES", strCategories);
    albumpage = albumpage.replace("$_EXTERNAL_LINKS", strExtLinks);
    albumpage = albumpage.replace("$_DEFAULTSORT", sorttemplate);
    albumpage = albumpage.replace("$_TRACKLIST", strTrackList);

    $("#pagetitle").html(pagename);
    $("#output").html(albumpage);
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
    if (siteurl.match(/^https?:\/\/vocadb\.net\/Al\/.*/)) {return true;}
    else {return false;}    
}

function getVocaDBID(siteurl) {
    let tryregex = siteurl.match(/(?<=^https?:\/\/vocadb\.net\/Al\/)\d*/gm);
    if (Array.isArray(tryregex)) {siteurl = tryregex[0];};
    return siteurl;
}