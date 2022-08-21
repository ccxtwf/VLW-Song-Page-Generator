
//This script file also refers to the variables listPVService, listRecognizedLinks, extLinksTable and trackListTable in the albumgenerator HTML doc.

/*
 * Names of commonly used sites based on their URLs.
 * ### fandom sites should use w:c: links in generated code
 */
const listPVService =
    [
    {re:"^https?://youtu\\.be/",                   site:"YouTube"},
    {re:"^https?://(|www\\.)youtube.com/watch?.*", site:"YouTube"},
    {re:"^https?://www\\.nicovideo\\.jp/.*",       site:"Niconico"},
    {re:"^https?://piapro\\.jp/.*",                site:"piapro"},
    {re:"^https?://soundcloud\\.com/.*",           site:"SoundCloud"},
    {re:"^https?://.*bandcamp\\.com/.*",           site:"Bandcamp"},
    {re:"^https?://vimeo\\.com/.*",                site:"Vimeo"},
    {re:"^https?://www\\.bilibili\\.com/.*",       site:"bilibili"},
    {re:"^https?://music\\.163\\.com/\\.*",        site:"Netease Music"},
    ];

const listRecognizedLinks = 
listPVService.concat(
    [
    {re:"^https?://www\\.animelyrics\\.com/.*",    site:"Anime Lyrics"},
    {re:"^https?://vocadb\\.net/.*",               site:"VocaDB"},
    {re:"^https?://vocaloidlyrics\\.fandom\\.com/*", site:"Vocaloid Lyrics Wiki"},
    {re:"^https?://www5\\.atwiki\\.jp/hmiku/.*",   site:"Hatsune Miku Wiki"},
    {re:"^https?://w\\.atwiki\\.jp/hmiku/.*",      site:"Hatsune Miku Wiki"},
    {re:"^https?://vocaloid\\.fandom\\.com/.*",    site:"Vocaloid Wiki"},
    {re:"^https?://dic\\.nicovideo\\.jp/.*",       site:"Niconico Pedia"},
    {re:"^https?://ch\\.nicovideo\\.jp/.*",        site:"Blomaga"},
    {re:"^https?://commons\\.nicovideo\\.jp/.*",   site:"Niconi Commons"},
    {re:"^https?://www\\.pixiv\\.net/.*",          site:"pixiv"},
    {re:"^https?://utaitedb\\.net/.*",             site:"UtaiteDB"},
    {re:"^https?://project-diva\\.fandom\\.com/.*", site:"Project DIVA Wiki"},
    {re:"^https?://projectdiva\\.wiki/.*",         site:"ProjectDIVA Wiki"},
    {re:"^https?://theevilliouschronicles\\.fandom\\.com/.*", site:"The Evillious Chronicles Wiki"},
    {re:"^https?://w\\.atwiki\\.jp/vocaloidenglishlyric/.*", site:"Vocaloid English & Romaji Lyrics @wiki"},
    {re:"^https?://ja\\.chordwiki\\.org/.*",       site:"ChordWiki"},
    {re:"^https?://dic\\.pixiv\\.net/.*",          site:"Pixiv Encyclopedia"},
    {re:"^https?://en-dic\\.pixiv\\.net/.*",       site:"Pixiv Encyclopedia (English)"},
    {re:"^https?://j-lyric\\.net/.*",              site:"J-Lyrics.net"},
    {re:"^https?://karent\\.jp/.*",                site:"KARENT"},
    {re:"^https?://en\\.wikipedia\\.org/.*",       site:"Wikipedia"},
    {re:"^https?://ja\\.wikipedia\\.org/.*",       site:"Wikipedia (Japanese)"},
    {re:"^https?://twitter\\.com/.*",              site:"Twitter"},
    {re:"^https?://utaten\\.com/.*",               site:"UtaTen"},
    {re:"^https?://www\\.kkbox\\.com/.*",          site:"KKBOX"},
    {re:"^https?://www\\.lyrical-nonsense\\.com/.*", site:"Lyrical Nonsense"},
    {re:"^https?://www\\.kget\\.jp/.*",            site:"KashiGET"},
    {re:"^https?://www\\.dropbox\\.com/.*",        site:"Dropbox"},
    {re:"^https?://drive\\.google\\.com/.*",       site:"Google Drive"},
    {re:"^https?://docs\\.google\\.com/.*",        site:"Google Docs"},
    {re:"^https?://[^.]+\\.deviantart\\.com/.*",   site:"DeviantArt"},
    {re:"^https?://fav\\.me/.*",                   site:"DeviantArt"},
    {re:"^https?://lenslyrics\\.ml/.*",            site:"Len's Lyrics"},
    {re:"^https?://pan\\.baidu\\.com/\\.*",        site:"Baidu"},
    {re:"^https?://5sing\\.kugou\\.com/.*",        site:"5Sing"},
    ]);

const albumPageTemplate = `{{Album Infobox
|title = $_ROMANIZED_TITLE
|orgtitle = $_ORIGINAL_TITLE
|label = $_LABEL
|desc = $_DESCRIPTION
|vdb = $_VOCADB_ID
|vw = $_VOCALOID_WIKI_LINK

|image = 
|color = $_BGCOLOUR
$_TRACKLIST
}}

$_EXTERNAL_LINKS

$_CATEGORIES`

//Declaration to local JSon file
let listofvocaloid;
fetch("listofvocaloid.json")
    .then(Response => Response.json())
    .then(data => {
        listofvocaloid = data;
});

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
    let vocaloidwikiurl = "";
    let vocaloidwikipagename = "";
    let trackList = [];
    let extLinks = [];
    let tryRegex = [];

    let setOfFeaturedSynths = new Set();
    let setOfFeaturedEngines = new Set();
    let setOfFeaturedProducers = new Set();

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
        urlquery = "https://vocadb.net/api/albums/" + vocadbid + "?fields=Artists,Tracks,WebLinks&lang=English"
        try {
            vocadbjson = await getJSonData(urlquery);
        } catch (error) {
            window.alert("Unexpected error: Unable to fetch data from VocaDB Rest API" + "\n\n" + error);
            return;
        }
        
        //Save fetched data to various variables
        originalTitle = vocadbjson.defaultName;
        transliteratedTitle = "";

        //Obtain published label, list of featured vocal synths, and list of producers
        let artists = vocadbjson.artists;
        let artistName = "";
        let synthEngine = "";
        artists.forEach(artist => {
            switch(artist.categories) {

                case "Vocalist":
                    try {
                        lookupJSonEntry = listofvocaloid[artist.artist.id];
                        //console.log(artist.artist.id);
                        artistName = lookupJSonEntry.fullvoicebankname;
                        synthEngine = lookupJSonEntry.synthgroup;
                    }
                    catch (error) {
                        console.log(error);
                        artistName = artist.name;
                    }
                    setOfFeaturedSynths.add(artistName);
                    setOfFeaturedEngines.add(synthEngine);
                    break;

                case "Label":
                case "Circle":
                    label = addItemToListString(artist.name, label, ", ");
                    break;

                case "Producer":
                default:
                    setOfFeaturedProducers.add(artist.name);
                    break;
            }
        }); 
        setOfFeaturedSynths.forEach( synth => {singers = addItemToListString(synth, singers, "; ");});
        setOfFeaturedProducers.forEach( producer => {producers = addItemToListString(producer, producers, "; ");});

        //Obtain tracklist
        let tracks = vocadbjson.tracks;
        let diskno = 0;
        let trackno = 0;
        let trackName = "";
        let trackCredits = "";
        let bAlbumContainsMoreThanOneProducer = setOfFeaturedProducers.size > 1;
        tracks.forEach( track => {
            diskno = track.discNumber;
            trackno = track.trackNumber;
            trackName = track.song.defaultName;
            trackCredits = track.song.artistString;
            if (!bAlbumContainsMoreThanOneProducer) {trackCredits = trackCredits.replace(/^.*\bfeat\b\.\s/, "")};
            trackList.push([diskno, trackno, trackName, "", trackCredits]);
        });

        //Obtain list of official & unofficial reference/web links
        let webLinks = vocadbjson.webLinks;
        let weblink_site;
        let weblink_url;
        let bLinkIsOfficial = false;
        weblink_url = "https://vocadb.net/Al/" + vocadbid;
        weblink_url = "<a href=\"" + weblink_url + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + weblink_url + "</a>";
        extLinks[0] = [weblink_url, "VocaDB", false];
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

        //Write data to online form
        $("#originaltitle").val(originalTitle);
        $("#romajititle").val(transliteratedTitle);
        $("#label").val(label);
        $("#singer").val(singers);
        $("#producers").val(producers);
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

        //Give alert to end user
        window.alert("Loaded successfully");

    }
    else {
        window.alert("URL must be from a VocaDB album page and start with 'https://vocadb.net/Al/'");
    }
}

function autoloadCategories() {
    let strSynths = read_text("singer");
    let strProducers = read_text("producers");
    let strVocalSynthGroups = $("#featuredsynth").dropdown("get value");
    let arrSynths = strSynths.split(";");
    let arrProducers = strProducers.split(";");
    let arrVocalSynthGroups = strVocalSynthGroups.split(",");
    let strCategories = "";

    //Featuring software/engines
    if (strVocalSynthGroups !== "") {
        arrVocalSynthGroups.forEach( synthgroup => {
            strCategories += "Albums featuring " + synthgroup + "\n";
        });
    };

    //Featuring singers
    if (strSynths !== "") {
        arrSynths.forEach( synth => {
            synth = synth.trim();
            strCategories += "Albums featuring " + synth + "\n";
        });
    };

    //Featuring Producers
    if (strProducers !== "") {
        arrProducers.forEach( producer => {
            producer = producer.trim();
            strCategories += producer + " songs list/Albums\n";
        });
    };

    //Write categories
    $("#categories").val(strCategories);

}

/*
 * Check if all required information has been added
 * Returns true if errors are detected
 */
function check_form_for_errors() {

    console.log("checking errors");

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
        $("#tracklisttablecaption").toggleClass("error",true);
    }
    else {
        //Tracklist issues
        if (arrTrackList.some(function (rowTrack) {return rowTrack[1] == "";})) {
            arrStrWarning.push("You must add the track listing number to all tracks.");
            $("#tracklisttablecaption").toggleClass("error",true);
        }
        if (arrTrackList.some(function (rowTrack) {return isNaN(rowTrack[0])})) {
            arrStrWarning.push("The disc number must be numeric.");
            $("#tracklisttablecaption").toggleClass("error",true);
        }
        if (arrTrackList.some(function (rowTrack) {return isNaN(rowTrack[1])})) {
            arrStrWarning.push("The track listing number must be numeric.");
            $("#tracklisttablecaption").toggleClass("error",true);
        }
        if (arrTrackList.some(function (rowTrack) {return rowTrack[2].trim() == "";})) {
            arrStrWarning.push("You must add a track name to all tracks.");
            $("#tracklisttablecaption").toggleClass("error",true);
        }
        if (arrTrackList.some(function (rowTrack) {return rowTrack[4].trim() == "";})) {
            arrStrWarning.push("You must add featured producers & singers to all tracks, or specify that the song is an instrumental if there are no singers.");
            $("#tracklisttablecaption").toggleClass("error",true);
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
        $("#warnings").html(strWarning);
        $("#warnings").show();
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
    if (romanizedtitle == "") {romanizedtitle = originaltitle};
    let label = read_text("label");
    let description = read_text("description");
    let vocadbid = read_text("vocadbid");
    let vocaloidwikipage = read_text("vocaloidwikipage");
    let infoboxcolour = read_text("bgcolour");

    //Get page name
    let pagename = originaltitle;
    if (romanizedtitle !== originaltitle) {pagename += " (" + romanizedtitle + ")"};
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

    //Write data onto the album page template
    let albumpage = albumPageTemplate;
    albumpage = albumpage.replace("$_ROMANIZED_TITLE", romanizedtitle);
    albumpage = albumpage.replace("$_ORIGINAL_TITLE", originaltitle);
    albumpage = albumpage.replace("$_LABEL", label);
    albumpage = albumpage.replace("$_DESCRIPTION", description);
    albumpage = albumpage.replace("$_VOCADB_ID", vocadbid);
    albumpage = albumpage.replace("$_VOCALOID_WIKI_LINK", vocaloidwikipage);
    albumpage = albumpage.replace("$_BGCOLOUR", infoboxcolour);
    albumpage = albumpage.replace("$_CATEGORIES", strCategories);
    albumpage = albumpage.replace("$_EXTERNAL_LINKS", strExtLinks);
    albumpage = albumpage.replace("$_TRACKLIST", strTrackList);

    $("#pagetitle").html(pagename);
    $("#output").html(albumpage);
}

function listLinksInWikitextFormat(arrLinks, bLinksAreOfficial) {

    let strWikiExternalLinks = "";
  
    if (!Array.isArray(arrLinks) || arrLinks.length == 0) {return strWikiExternalLinks;}
  
    if (bLinksAreOfficial) {strWikiExternalLinks += "\n===Official===";}
    else {strWikiExternalLinks += "\n===Unofficial===";};
  
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

function addItemToListString(item, liststr, delim) {
    if (liststr == "") {liststr = item;}
    else if (item !== "") {liststr += delim + item;}
    return liststr;
}

function identify_website(linkurl, listwebsite)
{
 for (var i = 0; i < listwebsite.length; ++i)
 {
  if (linkurl.match(listwebsite[i].re))
   return listwebsite[i].site;
 }
 return "";
}

/*
 * Remove <a href> tag and get displayed URL/text
 */
function detagHref(strHref) {
    let linkurl = strHref;
    let tryRegex = strHref.match(/(?<=\<a href=\".*\".*\>).*(?=\<\/a\>)/gm);
    if (Array.isArray(tryRegex)) {linkurl = tryRegex[0];};
    return linkurl;
}