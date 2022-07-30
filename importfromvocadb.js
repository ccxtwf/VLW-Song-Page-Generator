
//This script file also refers to the variables listPVService, listRecognizedLinks, lyricsTable, playLinksTable and extLinksTable in the main HTML doc.

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
    let englishTitle = "";
    let dateOfPublication = new Date("01-01-1900");
    let singers = "";
    let producers = "";
    let playLinks = [];
    let extLinks = [];
    let thumbLinks = [];

    arrFeaturingOtherSynths = new Set();

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
        let artists = vocadbjson.artists;
        singers = "";
        producers = "";
        let lookupJSonEntry = {};
        let artistName = "";
        let minorSingers = "";
        let artistCredit = "";
        let groupCredit = "";
        let arrArtistRoles = [];
        artists.forEach(artist => {
            switch(artist.categories) {

                case "Vocalist":
                    try {
                        lookupJSonEntry = listofvocaloid[artist.artist.id];
                        //console.log(artist.artist.id);
                        artistName = lookupJSonEntry.fullvoicebankname;
                        if (lookupJSonEntry.synthgroup == "Vocaloid") {artistName = "[[" + artistName + "]]";}
                        else {arrFeaturingOtherSynths.add(lookupJSonEntry.synthgroup);}
                    }
                    catch (error) {
                        console.log(error);
                        artistName = artist.name;
                    }
                    if (artist.isSupport) {minorSingers = addItemToListString(artistName, minorSingers, ", ");}
                    else {singers = addItemToListString(artistName, singers, ", ");}
                    break;

                case "Producer":
                case "Illustrator":
                case "Animator":
                case "Other":
                    //artistCredit = artist.name;
                    artistCredit = "";
                    arrArtistRoles = artist.roles.split(", ");
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
                            case "Lyricist":
                                artistCredit = addItemToListString("lyrics", artistCredit, ", ");
                                break;
                            case "Illustrator":
                                artistCredit = addItemToListString("illust", artistCredit, ", ");
                                break;
                            case "Animator":
                                artistCredit = addItemToListString("PV", artistCredit, ", ");
                                break;
                            case "Publisher":
                                //groupCredit = "<b>" + artist.name + ":</b>\n";
                                artistCredit = addItemToListString("publisher", artistCredit, ", ");
                                break;
                            case "Other":
                            default:
                                artistCredit = addItemToListString("other", artistCredit, ", ");
                                break;
                        };
                    });
                    producers = addItemToListString(artist.name + " (" + artistCredit + ")", producers, "\n");
                    break;

                case "Circle":
                    groupCredit = "<b>" + artist.name + ":</b>\n";

                default:
                    break;
            }
        });
        producers = groupCredit + producers;
        if (minorSingers !== "") singers += "\n<small>" + minorSingers + "</small>";

        //Obtain list of official & unofficial play links, plus thumbnail links to official PV stills 
        let pvs = vocadbjson.pvs;
        let pvsite;
        let pvthumb;
        pvs.forEach(pv => {
            pvsite = identify_website(pv.url, listPVService);
            switch(pv.pvType) {

                case "Original":
                    playLinks.push([pvsite,pv.url,false,false,pv.disabled,""]);
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
                                pvthumb = pv.thumbUrl.replace(/^https?:\/\/i\d.hdslb.com/, "https://i0.hdslb.com/");
                                break;
                            default:
                                pvthumb = pv.thumbUrl;
                                break;
                        }
                        thumbLinks.push([pvthumb,pv.thumbUrl]);
                    }
                    break;
                
                case "Reprint":
                    playLinks.push([pvsite,pv.url,true,false,pv.disabled,""]);
                    break;
                case "Other":
                default:
                    break;
              };
        });

        //Obtain list of official & unofficial reference/web links
        let webLinks = vocadbjson.webLinks;
        let weblinkcount = 1;
        let weblink_site;
        extLinks[0] = ["https://vocadb.net/S/" + vocadbid, "VocaDB"];
        webLinks.forEach(weblink => {
            weblink_site = identify_website(weblink.url, listRecognizedLinks);
            if (weblink_site !== weblink.description) {weblink_site = addItemToListString(weblink.description, weblink_site, " - ");};
            extLinks[weblinkcount] = [weblink.url, weblink_site];
            weblinkcount++;
        });

        //testOutput();

        //Write data to online form
        document.getElementById("originaltitle").value = originalTitle;
        document.getElementById("romajititle").value = transliteratedTitle;
        document.getElementById("translatedtitle").value = englishTitle;
        document.getElementById("uploaddate").valueAsDate = dateOfPublication;
        document.getElementById("singer").value = singers;
        document.getElementById("producers").value = producers;
    
        //Write data to input tables (not including lyrics table)
        if (playLinks.length > 0) playLinksTable.setData(playLinks);
        if (extLinks.length > 0) extLinksTable.setData(extLinks);
    
        //Add images
        document.getElementById("thumbrow").style.display = "";
        thumbLinks.forEach(thumbLink => {
            document.getElementById("thumbrowinner").innerHTML = document.getElementById("thumbrowinner").innerHTML + "<img src=\"" + thumbLink[0] + "\" width=\"400\" alt=\"Image not found\" onerror=\"this.onerror=null;this.src=\'" + thumbLink[1] + "\';\" />";
        });

        //Give alert to end user
        window.alert("Loaded successfully");

    }
    else {
        window.alert("URL must be from a VocaDB song page and start with 'https://vocadb.net/S/'");
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
    siteurl = siteurl.replace(/^https?:\/\/vocadb\.net\/S\//,"");
    siteurl = siteurl.replace(/\?.*/,"");
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