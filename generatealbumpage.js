
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
    let setOfFeaturedProducers = new Set();

    let siteurl = document.getElementById("preloadfromurl").value.trim();
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
        artists.forEach(artist => {
            switch(artist.categories) {

                case "Vocalist":
                    try {
                        lookupJSonEntry = listofvocaloid[artist.artist.id];
                        //console.log(artist.artist.id);
                        artistName = lookupJSonEntry.fullvoicebankname;
                        if (lookupJSonEntry.synthgroup == "Vocaloid") {artistName = "[[" + artistName + "]]";};
                    }
                    catch (error) {
                        console.log(error);
                        artistName = artist.name;
                    }
                    setOfFeaturedSynths.add(artistName);
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
        weblink_url = "https://vocadb.net/Al/" + vocadbid;
        weblink_url = "<a href=\"" + weblink_url + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + weblink_url + "</a>";
        extLinks[0] = [weblink_url, "VocaDB"];
        webLinks.forEach(weblink => {
            weblink_site = identify_website(weblink.url, listRecognizedLinks);
            if (weblink_site == "Vocaloid Wiki") {
                vocaloidwikiurl = weblink.url;
                tryRegex = vocaloidwikiurl.match(/(?<=^https?:\/\/vocaloid\.fandom\.com\/wiki\/).*/);
                if (Array.isArray(tryRegex) && tryRegex.length) {vocaloidwikipagename = tryRegex[0];};
            }
            if (weblink_site !== weblink.description) {weblink_site = addItemToListString(weblink.description, weblink_site, " - ");};
            weblink_url = "<a href=\"" + weblink.url + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + weblink.url + "</a>";
            extLinks.push([weblink_url, weblink_site]);
        });

        //Write data to online form
        document.getElementById("originaltitle").value = originalTitle;
        document.getElementById("romajititle").value = transliteratedTitle;
        document.getElementById("label").value = label;
        document.getElementById("singer").value = singers;
        document.getElementById("producers").value = producers;
        document.getElementById("vocadbid").value = vocadbid;
        document.getElementById("vocaloidwikipage").value = vocaloidwikipagename;
    
        //Write data to input tables
        if (extLinks.length > 0) extLinksTable.setData(extLinks);
        if (trackList.length > 0) trackListTable.setData(trackList);

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
    let arrSynths = strSynths.split(";");
    let arrProducers = strProducers.split(";");
    let strCategories = "";
    let tryRegex = [];
    arrSynths.forEach( synth => {
        synth = synth.trim();
        tryRegex = synth.match(/(?<=\[\[).*(?=\]\])/);
        if (Array.isArray(tryRegex) && tryRegex.length) {
            synth = tryRegex[0];
            strCategories += "Albums featuring " + synth + "\n";
        }
    });
    arrProducers.forEach( producer => {
        producer = producer.trim();
        tryRegex = producer.match(/(?<=\[\[).*(?=\]\])/);
        if (Array.isArray(tryRegex) && tryRegex.length) {
            producer = tryRegex[0];
            strCategories += producer + " songs list/Albums\n";
        }
    });
    document.getElementById("categories").value = strCategories;
}

/*
 * Check if all required information has been added
 * Returns true if errors are detected
 */
function check_form_for_errors() {

    error_resets();
    let error = false;

    let elementValue = "";

    //No original title given?
    elementValue = read_text("originaltitle");
    error = highlight_field("originaltitle", elementValue == "", "You haven't entered an album name.") || error;

    //Non-recognized colour format for infobox
    error = highlight_field("bgcolour", !validate_colour(read_text("bgcolour")), "There is an error with the infobox colour") || error;

    //No description added
    elementValue = read_text("description");
    error = highlight_field("description", elementValue == "", "You must add a short description about the album.") || error;

    //No VocaDB ID
    elementValue = read_text("vocadbid");
    error = highlight_field("vocadbid", elementValue == "", "You must add the VocaDB page ID.") || error;

    //No tracks added
    let arrTrackList = trackListTable.getData();
    if (!Array.isArray(arrTrackList) || arrTrackList.length == 0) {
        error = highlight_field("tracklisttablecaption", 
            true, "You must add at least one song to the tracklist.") 
            || error;
    }
    else {
        //Tracklist issues
        error = highlight_field("tracklisttablecaption", 
            arrTrackList.some(function (rowTrack) {return rowTrack[1] == "";}), 
            "You must add the track listing number to all tracks.") 
            || error;
        error = highlight_field("tracklisttablecaption", 
            arrTrackList.some(function (rowTrack) {return isNaN(rowTrack[0])}), 
            "The disc number must be numeric.") 
            || error;
        error = highlight_field("tracklisttablecaption", 
            arrTrackList.some(function (rowTrack) {return isNaN(rowTrack[1])}), 
            "The track listing number must be numeric.") 
            || error;
        error = highlight_field("tracklisttablecaption", 
            arrTrackList.some(function (rowTrack) {return rowTrack[2].trim() == "";}), 
            "You must add a track name to all tracks.") 
            || error;
        error = highlight_field("tracklisttablecaption", 
            arrTrackList.some(function (rowTrack) {return rowTrack[4].trim() == "";}), 
            "You must add featured producers & singers to all tracks, or specify that the song is an instrumental if there are no singers.") 
            || error;
    }

    //Forgot to autoload categories?
    elementValue = read_text("categories");
    error = highlight_field("categories", elementValue == "", "Did you forget to add categories?") || error;

    //Validate 
    return error;

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
    let url = "";
    let linkdesc = "";
    let wiki = "";
    let page = "";
    let strExtLink = "";
    let strExtLinks = "";
    if (Array.isArray(arrExtLinks) && arrExtLinks.length) {
        strExtLinks = "==External Links==\n"
        arrExtLinks.forEach( extLink => {
            url = detagHref(extLink[0].trim());
            linkdesc = extLink[1];
            //VocaDB
            //if (url.match(/^https?:\/\/vocadb\.net\/.*/)) {
                //strExtLink = "*{{VDB|" + url.replace(/^https?:\/\/vocadb\.net\//, "") + "}}";
            //}
            //Fandom Wiki
            if (url.match(/^https?:\/\/.*\.fandom\.com\/.*/)) {
                wiki = url.replace(/^https?:\/\//, "").replace(/\.fandom\.com\/wiki\/.*/, "");
                page = url.replace(/^https?:\/\/.*\.fandom\.com\/wiki\//, "");
                strExtLink = "*[[w:c:" + wiki + ":" + page + "|" + linkdesc + "]]";
            }
            //Wikipedia
            else if (url.match(/^https?:\/\/en\.wikipedia\.org\/wiki\/.*/)) {
                page = url.replace(/^https?:\/\/en\.wikipedia\.org\/wiki\//, "");
                strExtLink = "*[[wikipedia:" + page + "|" + linkdesc + "]]";
            }
            else {
                strExtLink = "*[" + url + " " + linkdesc + "]";
            };
            strExtLinks += strExtLink + "\n";
        });
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

    document.getElementById("pagetitle").innerHTML = pagename;
    document.getElementById("output").innerHTML = albumpage;
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