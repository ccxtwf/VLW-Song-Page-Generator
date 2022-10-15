//This script file also refers to the variables playLinksTable and extLinksTable in the main HTML doc.

//Declaration to local JSon file
let listofvocaloid;
fetch("listofvocaloid.json")
    .then(Response => Response.json())
    .then(data => {
        listofvocaloid = data;
        //console.log(listofvocaloid["1"]);
});

async function importFromVocaDB() {

    //Local declarations
    let vocadbid = "";
    let vocadbjson = "";
    let urlquery = "";
    let originalTitle = "";
    let transliteratedTitle = "";
    let englishTitle = "";
    let dateOfPublication = new Date("01-01-1900");
    let singers = "";
    let producers = "";
    let playLinks = [];
    let extLinks = [];
    let thumbLinks = [];

    let setOfSynths = new Set();

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
        urlquery = "https://vocadb.net/api/songs/" + vocadbid + "?fields=Artists,Names,PVs,WebLinks&lang=English"
        try {
            vocadbjson = await getJSonData(urlquery);
        } catch (error) {
            window.alert("Unexpected error: Unable to fetch data from VocaDB Rest API" + "\n\n" + error);
            return;
        }
        
        //Save fetched data to various variables
        originalTitle = vocadbjson.defaultName;
        transliteratedTitle = "";
        englishTitle = "";
        let songnames = vocadbjson.names;
        songnames.forEach(songname => {
            switch(songname.language) {
                case "Japanese":
                    // do nothing
                    break;
                case "Romaji":
                    transliteratedTitle = addItemToListString(songname.value, transliteratedTitle, " / ");
                    break;
                case "English":
                    englishTitle = addItemToListString(songname.value, englishTitle, " / ");
                    break;
                case "Unspecified":
                default:
                    englishTitle = addItemToListString(songname.value, englishTitle, " / ");
                    break;
              }
        });
        let dateOfPublication_rawStr = vocadbjson.publishDate;
        dateOfPublication = new Date(dateOfPublication_rawStr);
        //Output credits for singers, producers and list of synths in use
        let obj_credits = getCredits(vocadbjson.artists);
        singers = obj_credits.singers;
        producers = obj_credits.producers;
        setOfSynths = obj_credits.setofsynths;

        //Obtain list of official & unofficial play links, plus thumbnail links to official PV stills 
        let pvs = vocadbjson.pvs;
        let pvsite;
        let pvthumb;
        let pvurl;
        pvs.forEach(pv => {
            pvsite = identify_website(pv.url, listPVService);
            pvurl = "<a href=\"" + pv.url + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + pv.url + "</a>";
            switch(pv.pvType) {

                case "Original":
                    playLinks.push([pvsite,pvurl,false,false,pv.disabled,""]);
                    //Only add PV thumbnail if the PV is originally published by the author and is still up
                    if (!pv.disabled) {
                        switch(pvsite) {
                            case "Niconico":
                                pvthumb = pv.thumbUrl + ".L";
                                break;
                            case "YouTube":
                                pvthumb = pv.thumbUrl.replace("/vi/", "/vi_webp/");
                                pvthumb = pvthumb.replace("default.jpg", "hqdefault.webp");
                                break;
                            case "bilibili":
                                pvthumb = pv.thumbUrl;
                                //pvthumb = pvthumb.replace(/^https?:\/\/i\d.hdslb.com/, "https://i0.hdslb.com/");
                                break;
                            default:
                                pvthumb = pv.thumbUrl;
                                break;
                        }
                        thumbLinks.push([pvthumb,pv.thumbUrl]);
                    }
                    break;
                
                case "Reprint":
                    playLinks.push([pvsite,pvurl,true,false,pv.disabled,""]);
                    break;
                case "Other":
                default:
                    break;
              };
        });

        //Obtain list of official & unofficial reference/web links
        let webLinks = vocadbjson.webLinks;
        let weblink_site;
        let weblink_url;
        let bLinkIsOfficial = false;
        weblink_url = "https://vocadb.net/S/" + vocadbid;
        weblink_url = "<a href=\"" + weblink_url + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + weblink_url + "</a>";
        extLinks[0] = [weblink_url, "VocaDB", false];
        webLinks.forEach(weblink => {
            weblink_site = identify_website(weblink.url, listRecognizedLinks);
            if (weblink_site !== weblink.description) {weblink_site = addItemToListString(weblink.description, weblink_site, " - ");};
            weblink_url = "<a href=\"" + weblink.url + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + weblink.url + "</a>";
            bLinkIsOfficial = weblink.category == "Commercial" || weblink.category == "Official";
            extLinks.push([weblink_url, weblink_site, bLinkIsOfficial]);
        });

        //testOutput();

        //Write data to online form
        $("#originaltitle").val(originalTitle);
        $("#romajititle").val(transliteratedTitle);
        $("#translatedtitle").val(englishTitle);
        document.getElementById("uploaddate").valueAsDate = dateOfPublication;
        $("#singer").val(singers);
        $("#producers").val(producers);
    
        //Write data to input tables (not including lyrics table)
        if (playLinks.length > 0) playLinksTable.setData(playLinks);
        if (extLinks.length > 0) extLinksTable.setData(extLinks);

        //Add featured synth software
        //console.log(setOfSynths);
        //console.log(listofsynthengines);
        setOfSynths.forEach( featuredSynth => {
            if (listofsynthengines.includes(featuredSynth)) {
                $("#featuredsynth").dropdown("set selected", featuredSynth);
            }
            else {
                $("#featuredsynth").dropdown("set selected", "Other Voice Synthesizer");
            }
        });
    
        //Add images
        $("#thumbrow").show();
        thumbLinks.forEach(thumbLink => {
            $("#thumbrowinner").append("<img src=\"" + thumbLink[0] + "\" width=\"400\" alt=\"Image not found\" onerror=\"this.onerror=null;this.src=\'" + thumbLink[1] + "\';\" />");
        });

        //Give alert to end user
        window.alert("Loaded successfully");

    }
    else {
        window.alert("URL must be from a VocaDB song page and start with 'https://vocadb.net/S/'");
    }
}

/*
 * Return an object containing: 1) The singer credits, including minor singers (as a string)
 *                              2) The producer credits, including group/label/circle (as a string)
 *                              3) The set of vocal producer engine/software
 */
function getCredits(artistJson) {
    let lookupJSonEntry = {};
    let setOfSynths = new Set();

    let artistName = "";
    let redirect = "";

    let singers = "";
    let producers = "";
    let minorSingers = "";
    let artistCredit = "";
    let groupCredit = "";
    let arrArtistRoles = [];

    let artistCategories_toread = ""

    artistJson.forEach(artist_toread => {
        console.log(artist_toread);
        artistCategories_toread = artist_toread.categories
        //Artist is a vocalist (whether human or synth)
        if (artistCategories_toread.search("Vocalist") > -1) {
            try {
                lookupJSonEntry = listofvocaloid[artist_toread.artist.id];
                //console.log(artist_toread.artist.id);
                artistName = lookupJSonEntry.fullvoicebankname;
                redirect = lookupJSonEntry.basevoicebankname;
                if (artistName == redirect) {artistName = "[[" + artistName + "]]";}
                else {artistName = "[[" + artistName + "|" + redirect + "]]";};
                setOfSynths.add(lookupJSonEntry.synthgroup);
            }
            catch (error) {
                console.log(error);
                artistName = artist_toread.name;
            }
            if (artist_toread.isSupport) {minorSingers = addItemToListString(artistName, minorSingers, ", ");}
            else {singers = addItemToListString(artistName, singers, ", ");}
        }
        //Song is released under a circle
        if (artistCategories_toread.search("Circle") > -1) {
            groupCredit = "<b>" + artist_toread.name + ":</b>\n";
        }
        //Cases where the artist is not a vocalist or a circle group
        if (artistCategories_toread !== "Vocalist" && artistCategories_toread !== "Circle") {
            //artistCredit = artist_toread.name;
            artistCredit = "";
            arrArtistRoles = artist_toread.effectiveRoles.split(", ");
            arrArtistRoles.forEach(artistRole => {
                switch(artistRole) {
                    case "Default":
                        artistCredit = addItemToListString("music", artistCredit, ", ");
                        break;
                    case "Composer":
                        artistCredit = addItemToListString("music", artistCredit, ", ");
                        break;
                    case "VoiceManipulator":
                        artistCredit = addItemToListString("tuning", artistCredit, ", ");
                        break;
                    case "Arranger":
                        artistCredit = addItemToListString("arrange", artistCredit, ", ");
                        break;
                    case "Mixer":
                        artistCredit = addItemToListString("mix", artistCredit, ", ");
                        break;
                    case "Mastering":
                        artistCredit = addItemToListString("mastering", artistCredit, ", ");
                        break;
                    case "Lyricist":
                        artistCredit = addItemToListString("lyrics", artistCredit, ", ");
                        break;
                    case "Instrumentalist":
                        artistCredit = addItemToListString("instruments", artistCredit, ", ");
                        break;
                    case "Illustrator":
                        artistCredit = addItemToListString("illustration", artistCredit, ", ");
                        break;
                    case "Animator":
                        artistCredit = addItemToListString("PV", artistCredit, ", ");
                        break;
                    case "Distributor":
                    case "Publisher":
                        //groupCredit = "<b>" + artist_toread.name + ":</b>\n";
                        artistCredit = addItemToListString("publisher", artistCredit, ", ");
                        break;
                    case "Vocalist":
                        artistCredit = addItemToListString("vocals", artistCredit, ", ");
                        break;
                    case "Chorus":
                        artistCredit = addItemToListString("chorus", artistCredit, ", ");
                        break;
                    case "Encoder":
                        artistCredit = addItemToListString("encoding", artistCredit, ", ");
                        break;
                    case "VocalDataProvider":
                        artistCredit = addItemToListString("voice provider", artistCredit, ", ");
                        break;
                    case "Other":
                    default:
                        artistCredit = addItemToListString("other", artistCredit, ", ");
                        break;
                };
            });
            producers = addItemToListString(artist_toread.name + " (" + artistCredit + ")", producers, "\n");
        }
    });
    producers = groupCredit + producers;
    if (minorSingers !== "") singers += "\n<small>" + minorSingers + "</small>";

    return {
        "singers":singers,
        "producers":producers,
        "setofsynths":setOfSynths
    }
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
    if (siteurl.match(/^https?:\/\/vocadb\.net\/S\/.*/)) {return true;}
    else {return false;}    
}

function getVocaDBID(siteurl) {
    let tryregex = siteurl.match(/(?<=^https?:\/\/vocadb\.net\/S\/)\d*/gm);
    if (Array.isArray(tryregex)) {siteurl = tryregex[0];};
    return siteurl;
}

function testOutput() {

    document.write(urlquery + "<br><hr>");
    document.write(JSON.stringify(vocadbjson) + "<br><hr>");
    document.write("Original Title: " + originalTitle + "<br>");
    document.write("Transliterated Title: " + transliteratedTitle + "<br>");
    document.write("English Title: " + englishTitle + "<br>");
    document.write("Date of Publication: " + dateOfPublication.toUTCString() + "<br>");
    document.write("Singers: " + singers + "<br>");
    document.write("Producers: " + producers + "<br><hr>");
    document.write("Play Links: <br>" + JSON.stringify(playLinks) + "<br><hr>");
    document.write("External Links: <br>" + JSON.stringify(extLinks) + "<br><hr>");
    document.write("Thumb Links: <br>" + JSON.stringify(thumbLinks) + "<br><hr>");

    //console.log(playLinks);
    //onsole.log(extLinks);
    //console.log(thumbLinks);

}