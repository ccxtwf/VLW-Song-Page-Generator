//This script file also refers to the variables lyricsTable, playLinksTable and extLinksTable in the main HTML doc.

const strInfoBoxTemplate = `{{Infobox_Song
|image = 
|songtitle = "'''$ORIGINAL_TITLE'''"$ADDITIONAL_TITLES
|color = $BG_COLOUR; color:$FG_COLOUR
|original upload date = $DATEOFPUBLICATION
|singer = $SINGERS
|producer = $PRODUCERS
|#views = $VIEWCOUNT
|link = $PLAYLINKS
$DESCRIPTION
}}`;

/*
 * Declarations of arrays to contain data from custom JSpreadsheet tables
 */
let arrDataPlayLinks = [];
let arrDataExtLinks = [];
let arrDataLyrics = [];

let configLanguages = {
  "bLanguageIsUndefined": true,
  "bLanguageIsTransliterated": true,
  "bLanguageIsNonEnglish": true,
  "arrLyricsOrigLang": ["Original"],
  "arrLyricsTransliteration": ["Romanized"]
};

/*
 * Read data input into custom JSpreadsheet tables
 */
function readTables() {
  arrDataPlayLinks = playLinksTable.getData();
  arrDataExtLinks = extLinksTable.getData();
  arrDataLyrics = lyricsTable.getData();
}

function determineLanguages() {

  //Reset
  configLanguages = {
    "bLanguageIsUndefined": true,
    "bLanguageIsTransliterated": true,
    "bLanguageIsNonEnglish": true,
    "arrLyricsOrigLang": ["Original"],
    "arrLyricsTransliteration": ["Romanized"]
  }

  let arrLanguages = [];

  //Determine configurations
  let dropdownvalue = $("#languagelist").dropdown("get value");
  let bLanguageIsUndefined = dropdownvalue == "";
  if (!bLanguageIsUndefined) {

    arrLanguages = dropdownvalue.split(",").map(x => parseInt(x));

    let bLanguageIsTransliterated = bLanguageIsUndefined || arrLanguages.some(function (language) {return "transliteration" in languages[language];});
    let bLanguageIsNonEnglish = bLanguageIsUndefined || arrLanguages.some(function (language) {return language > 0;});

    let arrLyricsOrigLang = [];
    let arrLyricsTransliteration = [];
    arrLyricsOrigLang = arrLanguages.map(lang => languages[lang].name);
    let arrTransliteratedLanguages = arrLanguages.filter(function (language) {return "transliteration" in languages[language];});
    arrLyricsTransliteration = arrTransliteratedLanguages.map(lang => languages[lang].transliteration);

    //Set properties
    configLanguages.bLanguageIsUndefined = bLanguageIsUndefined;
    configLanguages.bLanguageIsTransliterated = bLanguageIsTransliterated;
    configLanguages.bLanguageIsNonEnglish = bLanguageIsNonEnglish;
    configLanguages.arrLyricsOrigLang = arrLyricsOrigLang;
    configLanguages.arrLyricsTransliteration = arrLyricsTransliteration;

  }
  else {return;}

}

/*
 * Generate entire song page
 */
function generateSongPage() {

  //Reset output
  $("#output").html("");
  $("#pagetitle").html("");

  //Check for errors
  let ignoreerrors = document.getElementById("ignoreerrors").checked;
  let bErrorsExist = check_form_for_errors();
  if (!ignoreerrors && bErrorsExist) {
    return;
  }

  //Otherwise generate the song page
  readTables();
  determineLanguages();

  let pageTitle = read_text("originaltitle");
  let romTitle = read_text("romajititle");
  if (romTitle !== "") {pageTitle += " (" + romTitle + ")"};
  $("#pagetitle").html(pageTitle);
  let sortTemplate = "";
  if (romTitle !== "") {
    sortTemplate = "{{sort"
    if (romTitle.replace(/[ -~]/g, "") !== "") {
      sortTemplate += "|" + detonePinyin(romTitle, false) + "}}"
    }
    else {sortTemplate += "}}"}
  };
  

  let strSongPage = ""
  if (document.getElementById("unavailable").checked) {strSongPage += "{{Unavailable}}"};
  strSongPage += generateContentWarnings();
  strSongPage += sortTemplate
  strSongPage += generateInfoBox();
  strSongPage += "\n\n" + generateLyrics();
  strSongPage += "\n\n" + generateExternalLinks();
  strSongPage += "\n\n\n";
  //if (romTitle !== "") {strSongPage += "{{DEFAULTSORT:" + detonePinyin(romTitle, false) + "}}\n"};
  strSongPage += generateListOfCategories();
  
  $("#output").html(strSongPage);

}

function generateContentWarnings() {
  let strContentWarnings = "";
  if (document.getElementById("questionablecontent").checked) {strContentWarnings = "{{Questionable}}\n";}
  else if (document.getElementById("explicitcontent").checked) {strContentWarnings = "{{Explicit}}\n";}
  if (document.getElementById("epilepticcontent").checked) {strContentWarnings = "{{Epilepsy}}" + strContentWarnings;}
  return strContentWarnings;
}

function generateInfoBox() {
  let strInfoBox = strInfoBoxTemplate;

  //Fetch song language and title information
  let bLanguageIsUndefined = configLanguages.bLanguageIsUndefined;
  let bShowRomTitle = configLanguages.bLanguageIsTransliterated;
  let bShowEngTitle = configLanguages.bLanguageIsNonEnglish;

  let origTitle = read_text("originaltitle");
  let romTitle = read_text("romajititle");
  let engTitle = read_text("translatedtitle");
  bShowRomTitle = bShowRomTitle && romTitle !== "";
  bShowEngTitle = bShowEngTitle && engTitle !== "";

  let additionalTitles = "";
  if (bShowRomTitle) {
    if (bLanguageIsUndefined) {additionalTitles += "<br />Romanized: " + romTitle}
    else {
      //Assumes that the romanized title is only given in the first chosen language ("the main language")
      additionalTitles += "<br />" + configLanguages.arrLyricsTransliteration[0] + ": " + romTitle;
    };
  };
  if (bShowEngTitle) {additionalTitles += "<br />" + "English: " + engTitle}

  //Fetch additional information
  let bgColour = read_text("bgcolour");
  let fgColour = read_text("fgcolour");
  let dateOfPublication = document.getElementById("uploaddate").valueAsDate;
  let strDateOfPublication = "";
  if (dateOfPublication !== null) {
    strDateOfPublication = "{{Date|" + dateOfPublication.getFullYear() + "|" + months[dateOfPublication.getMonth()] + "|" + dateOfPublication.getDate() + "}}";
  };
  let strSingers = toHTML(read_text("singer"));
  let strProducers = toHTML(read_text("producers"));
  let strDescription = "";
  if (read_text("description") !== "") {strDescription = "\n|description = " + toHTML(read_text("description")) + "\n";};

  //Initialize variables to fetch view count and play links information  
  let strPlayLinks = "";
  let playLinkURL = "";
  let strPlayLinkPerPV = "";
  let strPlayLinkNote = "";
  let strViewCount = "";
  let strViewCountPerPV = "";
  let viewCountStr = "";
  let viewCount = 0;
  let divViewCount = 1;

  //Fetch view count and play links information
  if (Array.isArray(arrDataPlayLinks) && arrDataPlayLinks.length) {

    //Fetch view count if the PV is not a reprint (fetch if PV is auto-generated by YT Topics), still up online, and is on a website that displays view count
    let numPVwithViewCounts = arrDataPlayLinks.reduce(function (n, playLink) {
      return n + (playLink[1].trim() !== "" && !playLink[2] && !playLink[4] && playLink[0] in pvserviceabbr);
    }, 0);
    if (numPVwithViewCounts == 0) {strViewCount = "N/A";}
    let bShowPVService = (numPVwithViewCounts > 1);

    for (let i = 0; i < arrDataPlayLinks.length; i++) {
      //Write play link information
      let playLink = arrDataPlayLinks[i];
      playLinkURL = detagHref(playLink[1].trim());
      if (playLinkURL == "" || playLink[0] == "") {continue;};
      playLinkURL = playLinkURL.replace(/^https?:\/\/youtu\.be\//, "https://www.youtube.com/watch?v=");
      strPlayLinkPerPV = "[" + playLinkURL + " " + playLink[0] + " Broadcast]";
      strPlayLinkNote = "";
      if (playLink[2]) {strPlayLinkNote = addItemToListString("reprint", strPlayLinkNote, ", ")}
      if (playLink[3]) {strPlayLinkNote = addItemToListString("auto-generated by YT", strPlayLinkNote, ", ")}
      if (playLink[4]) {strPlayLinkNote = addItemToListString("deleted", strPlayLinkNote, ", ")}
      if (strPlayLinkNote !== "") {strPlayLinkPerPV += " <small>(" + strPlayLinkNote + ")</small>"}
      strPlayLinks = addItemToListString(strPlayLinkPerPV, strPlayLinks, " / ");

      //Write view count information
      if ((!playLink[2] && !playLink[4] && playLink[0] in pvserviceabbr)) {
        viewCountStr = playLink[5].trim();
        viewCountStr = viewCountStr.replace(/[,.]\s?(?=\d{3})/g, "");
        //Round down view count number if numeric
        if (viewCountStr !== "" && !isNaN(viewCountStr)) {
          viewCount = parseInt(viewCountStr);
          if (viewCount < 1000) {
            divViewCount = 10 ** Math.trunc(Math.log10(viewCount));
          }
          else {
            divViewCount = 10 ** (Math.trunc(Math.log10(viewCount)) - 1);
          }
          viewCount = Math.floor(viewCount / divViewCount) * divViewCount;
          strViewCountPerPV = viewCount.toLocaleString('en-US') + "+";
        }
        //Show view count number as text if non-numeric
        else {strViewCountPerPV = viewCountStr;}
        //Show the website on which the PV is published, if needed
        if (bShowPVService) {strViewCountPerPV += " (" + pvserviceabbr[playLink[0]] + ")";}
        strViewCount = addItemToListString(strViewCountPerPV, strViewCount, ", ");
      }

    };
    if (strPlayLinks == "") {strPlayLinks = "N/A"};
  }
  else {
    strPlayLinks = "N/A";
    strViewCount = "N/A";
  }

  //Write infobox
  strInfoBox = strInfoBox.replace("$BG_COLOUR", bgColour);
  strInfoBox = strInfoBox.replace("$FG_COLOUR", fgColour);
  strInfoBox = strInfoBox.replace("$DATEOFPUBLICATION", strDateOfPublication);
  strInfoBox = strInfoBox.replace("$SINGERS", strSingers);
  strInfoBox = strInfoBox.replace("$PRODUCERS", strProducers);
  strInfoBox = strInfoBox.replace("$VIEWCOUNT", strViewCount);
  strInfoBox = strInfoBox.replace("$PLAYLINKS", strPlayLinks);
  strInfoBox = strInfoBox.replace("$ORIGINAL_TITLE", origTitle);
  strInfoBox = strInfoBox.replace("$ADDITIONAL_TITLES", additionalTitles);
  strInfoBox = strInfoBox.replace("\n$DESCRIPTION\n", strDescription);

  return strInfoBox;

}

function generateLyrics() {
  //console.log("PASSED LYRICS");
  let strWikiLyrics = "==Lyrics==\n";
  let strLyricsTable = "";

  let bTranslationExists = false;
  let bTranslationNotesExist = false;
  let bTranslationIsOfficial = document.getElementById("officialtranslation").checked;
  let bLyricsAreRomanized = configLanguages.bLanguageIsTransliterated;
  let translatorName = read_text("translator").toString();
  let translatorLicense = get_translator_license(translatorName);

  let numColumns = 0;
  let wikiNumColumns = 0;
  let rowOrigLyrics = "";
  let rowRomLyrics = "";
  let rowEngLyrics = "";
  let rowStyling = "";
  let setLyricsColours = new Set();

  const singingPartsTemplate = `{| border="1" cellpadding="4" style="border-collapse:collapse; border:1px groove; line-height:1.5"
!style="background-color:white; color:black"|Singer
#SINGING_PARTS
|}`

  if (!configLanguages.bLanguageIsNonEnglish) {
    //Song is English
    if (Array.isArray(arrDataLyrics) && arrDataLyrics.length) {

      //Colour per segment of lyrics
      for (let i = 0; i < arrDataLyrics.length; i++) {
        rowEngLyrics = arrDataLyrics[i][1].toString().trim();
        //if (arrDataLyrics[i][0].toString().trim() == "") {setLyricsColours.add("");};
        if (rowStyling !== arrDataLyrics[i][0].toString().trim() && validate_colour(arrDataLyrics[i][0].toString().trim())) {
          rowStyling = arrDataLyrics[i][0].toString().trim();
          if (rowEngLyrics !== "") {setLyricsColours.add(rowStyling);};
          if (rowStyling !== "") {rowEngLyrics = "<span style=\"color:" + rowStyling + "\">" + rowEngLyrics;};
        }
        if (rowStyling !== "" && (i == arrDataLyrics.length-1 || rowStyling !== arrDataLyrics[i+1][0].toString().trim())) {
          rowEngLyrics += "</span>";
        }
        strLyricsTable += rowEngLyrics + "\n";
      };

    };
    strLyricsTable = "{{Lyrics|" + strLyricsTable + "}}\n";
  }              
  else {

    //Check if a translation exists
    if (Array.isArray(arrDataLyrics) && arrDataLyrics.length) {
      numColumns = arrDataLyrics[0].length;
      bTranslationExists = arrDataLyrics.some(function (rowLyrics) {return rowLyrics[numColumns-1].trim() !== "";});
      //console.log("A translation exists: " + bTranslationExists);
      //Check if translation notes exist
      bTranslationNotesExist = arrDataLyrics.some(function (rowLyrics) {
        return rowLyrics[numColumns-1].match(/<\/ref>/) || rowLyrics[numColumns-1].match(/<ref name.*>/);
      });
    }

    wikiNumColumns = numColumns - 1;
    if (!bTranslationExists) {wikiNumColumns = wikiNumColumns - 1;};

    //Add wiki table headers
    strLyricsTable = "{| style=\"width:100%\"\n";
    if (configLanguages.bLanguageIsUndefined) {
      //No language specified
      strLyricsTable += "|'''''Original'''''\n";
      strLyricsTable += "|'''''Romanized'''''\n"
    }
    else {
      if (bLyricsAreRomanized || bTranslationExists) {
        strLyricsTable += "|'''''" + configLanguages.arrLyricsOrigLang.join("/") + "'''''\n";
      }
      //Add romanized lyrics column
      if (bLyricsAreRomanized) {
        strLyricsTable += "|'''''" + configLanguages.arrLyricsTransliteration.join("/") + "'''''\n"
      };
    };
    if (bTranslationExists) {
      if (bTranslationIsOfficial) {strLyricsTable += "|{{OfficialEnglish}}\n";}
      else {strLyricsTable += "|'''''English'''''\n"};
    };

    //Combine table in the case where the language is not English
    if (Array.isArray(arrDataLyrics) && arrDataLyrics.length) {
      arrDataLyrics.forEach(rowLyrics => {
        strLyricsTable += "|-";

        //Add styling
        rowStyling = rowLyrics[0].toString().trim();
        if (rowStyling !== "" && validate_colour(rowStyling)) {
          strLyricsTable += " style=\"color:" + rowStyling + "\"";
        }
        strLyricsTable += "\n";
        
        //Get lyrics
        rowOrigLyrics = rowLyrics[1].toString().trim();
        if (bLyricsAreRomanized) {rowRomLyrics = rowLyrics[2].toString().trim();}
        else {rowRomLyrics = rowOrigLyrics;}
        rowEngLyrics = rowLyrics[numColumns - 1].toString().trim();

        //Add blank line if detected
        if (rowOrigLyrics == "" && rowRomLyrics == "" && rowEngLyrics == "") {
          strLyricsTable += "|<br />\n"
        }

        //Merge the columns if they have identical text
        else if (
          (bLyricsAreRomanized && bTranslationExists && rowOrigLyrics == rowRomLyrics && rowOrigLyrics == rowEngLyrics) ||
          (bLyricsAreRomanized && !bTranslationExists && rowOrigLyrics == rowRomLyrics) ||
          (!bLyricsAreRomanized && bTranslationExists && rowOrigLyrics == rowEngLyrics)) {
            setLyricsColours.add(rowStyling);
            strLyricsTable += "| {{shared|" + wikiNumColumns + "}} style=\"font-style:italic; font-weight:bold; text-align:center;\" |" + rowOrigLyrics + "\n";
        }

        //Add each line otherwise
        else {
          setLyricsColours.add(rowStyling);
          strLyricsTable += "|" + rowOrigLyrics + "\n";
          if (bLyricsAreRomanized) {strLyricsTable += "|" + rowRomLyrics + "\n";};
          if (bTranslationExists || !bLyricsAreRomanized) {strLyricsTable += "|" + rowEngLyrics + "\n";};
        }
      });
    }

    //Close the wiki table
    strLyricsTable += "|}";

    //Add a box identifying each coloured part
    if (setLyricsColours.size > 1) {
      let singingParts = "";
      setLyricsColours.forEach (function(lyricsColour) {
        if (lyricsColour !== "") {
          singingParts += "|<span style=\"color:" + lyricsColour + "\">" + "Singer" + "</span>\n";
        };
      })
      if (setLyricsColours.has("")) {singingParts += "|" + "All" + "\n";}
      singingParts = singingPartsTemplate.replace("#SINGING_PARTS\n", singingParts);
      strLyricsTable = singingParts + "\n" + strLyricsTable;
    }

    //Add translator credit
    if (bTranslationExists) {
      if (translatorName == "" && !bTranslationIsOfficial) {
        translatorName = "Anonymous";
      }
      if (!(bTranslationIsOfficial && translatorName == "")) {
        strLyricsTable = translatorLicense + strLyricsTable + "\n" + "{{Translator|" + translatorName + "}}"
      };
    };

    //Add translation notes
    if (bTranslationNotesExist) {
      strLyricsTable += "\n\n" + "==Translation Notes==\n<references />"
    }

  }
  
  strWikiLyrics += strLyricsTable; 
  return strWikiLyrics;

}

function generateExternalLinks() {
  //console.log("PASSED EXT LINKS");
  let strWikiExternalLinks = "";
  if (Array.isArray(arrDataExtLinks) && arrDataExtLinks.length) {
    
    let bExtLinkExists = arrDataExtLinks.some(function (extLink) {return extLink[0].trim() !== "";});;
    if (!bExtLinkExists) {return strWikiExternalLinks};
    strWikiExternalLinks = "==External Links==";

    let arrOfficialLinks = arrDataExtLinks.filter(function (extLink) {return extLink[2];});
    let arrUnofficialLinks = arrDataExtLinks.filter(function (extLink) {return !extLink[2];});

    strWikiExternalLinks += listLinksInWikitextFormat(arrOfficialLinks, true);
    strWikiExternalLinks += listLinksInWikitextFormat(arrUnofficialLinks, false);
    
  }
  return strWikiExternalLinks;
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

function generateListOfCategories() {
  let strListOfCategories = "";
  let arrRawCategories = read_textbox("categories");
  if (Array.isArray(arrRawCategories) && arrRawCategories.length) {
    arrRawCategories.forEach(rawCategory => {
      //Capitalize first character
      rawCategory = rawCategory.charAt(0).toUpperCase() + rawCategory.substr(1);
      strListOfCategories += "[[Category:" + rawCategory + "]]\n"; 
    });
  }
  return strListOfCategories;
}

/*
 * Autoload categories as interpreted from the input fields
 */
function autoloadCategories() {

  let strSingers = "";
  strSingers = read_textbox("singer").toString();
  strSingers = strSingers.replace(/<small>.*<\/small>/, "");
  let arrSingers = strSingers.match(/\[\[[^\[\]:]*\]\]/gm);
  if (Array.isArray(arrSingers)) {arrSingers = arrSingers.map(singer => singer.replace(/\|.*(?=\]\])/,""));}
  
  strSingers = read_textbox("singer").toString();
  let arrMinorSingers = strSingers.match(/<small>.*<\/small>/gm);
  if (Array.isArray(arrMinorSingers)) {
    strSingers = arrMinorSingers[0];
    arrMinorSingers = strSingers.match(/\[\[[^\[\]:]*\]\]/gm);
    if (Array.isArray(arrMinorSingers)) {arrMinorSingers = arrMinorSingers.map(singer => singer.replace(/\|.*(?=\]\])/,""));};
  };
  //console.log(arrSingers);
  //console.log(arrMinorSingers);
  
  let strProducers = read_textbox("producers").toString();
  let arrProducers = strProducers.match(/\[\[[^\[\]:]*\]\]\s\([^\(\)]*\)/gm);
  
  let prodName = "";
  let strProdRoles = "";
  let arrProdRoles = [];
  let bProdWikiCat = {};

  //Initialize
  let strAutoloadCategories = "Songs";

  //Categories: Language
  determineLanguages();
  if (!configLanguages.bLanguageIsUndefined) {
    configLanguages.arrLyricsOrigLang.forEach( language => {
      strAutoloadCategories += "\n" + language + " songs";
    });
  };

  //Categories: Vocal Synth Groups
  let arrFeaturingSynths = [];
  arrFeaturingSynths = $("#featuredsynth").dropdown("get value").split(",");
  //console.log(arrFeaturingSynths);
  if (arrFeaturingSynths.length && arrFeaturingSynths[0] !== "") { 
    arrFeaturingSynths.forEach(featuredSynth => {
      strAutoloadCategories += "\n" + featuredSynth + " original songs";
    });
  }

  //Categories: Singers (including minor singers)
  if (Array.isArray(arrSingers) && arrSingers.length) { 
    arrSingers.forEach(singer => {
      singer = singer.substring(2, singer.length-2);
      strAutoloadCategories += "\nSongs featuring " + singer;
    });
    if (Array.isArray(arrMinorSingers) && arrMinorSingers.length) {
      arrMinorSingers.forEach(singer => {
        singer = singer.substring(2, singer.length-2);
        strAutoloadCategories += "\nSongs featuring " + singer;
      });
    }
    //Categories: Number of singers (excluding minor singers)
    if (arrSingers.length > 3) {strAutoloadCategories += "\n" + "Group rendition original songs"}
    else if (arrSingers.length > 2) {strAutoloadCategories += "\n" + "Trios original songs"}
    else if (arrSingers.length > 1) {strAutoloadCategories += "\n" + "Duet original songs"};
  }

  //Categories: Producers
  if (Array.isArray(arrProducers) && arrProducers.length) {
    arrProducers.forEach(producer => {
      prodName = producer.match(/\[\[[^\[\]]*\]\]/gm)[0];
      strProdRoles = producer.replace(prodName + " ", "");
      prodName = prodName.substring(2, prodName.length-2);
      strProdRoles = strProdRoles.substring(1, strProdRoles.length-1);
      arrProdRoles = strProdRoles.split(",");
      bProdWikiCat = {"music":false,"lyrics":false,"tuning":false,"arrangement":false,"visuals":false,"other":false,"default":false};
      arrProdRoles.forEach(prodRole => {
        switch(prodRole.trim()) {
          case "music":
            bProdWikiCat["music"] = true;
            break;
          case "lyrics":
            bProdWikiCat["lyrics"] = true;
            break;
          case "tuning":
            bProdWikiCat["tuning"] = true;
            break;
          case "arrange":
          case "arrangement":
            bProdWikiCat["arrangement"] = true;
            break;
          case "illust":
          case "illustration":
          case "PV":
          case "video":
          case "animation":
            bProdWikiCat["visuals"] = true;
            break;
          case "mix":
          case "master":
          case "mastering":
          case "instruments":
          case "other":
            bProdWikiCat["other"] = true;
            break;
          default:
            bProdWikiCat["default"] = true;
            break;
        };
      });
      //console.log(bProdWikiCat);
      if (bProdWikiCat["music"] || bProdWikiCat["default"]) {
        strAutoloadCategories += "\n" + prodName + " songs list"
      }
      else {
        if (bProdWikiCat["lyrics"]) {
          strAutoloadCategories += "\n" + prodName + " songs list/Lyrics"
        }
        if (bProdWikiCat["tuning"]) {
          strAutoloadCategories += "\n" + prodName + " songs list/Tuning"
        }
        if (bProdWikiCat["arrangement"]) {
          strAutoloadCategories += "\n" + prodName + " songs list/Arrangement"
        }
        if (bProdWikiCat["visuals"]) {
          strAutoloadCategories += "\n" + prodName + " songs list/Visuals"
        }
        if (bProdWikiCat["other"]) {
          strAutoloadCategories += "\n" + prodName + " songs list/Other"
        }
      }
    });
  }

  //Categories: Album-only songs
  let bSongIsAlbumOnly = document.getElementById("albumonly").checked;
  if (bSongIsAlbumOnly) {strAutoloadCategories += "\n" + "Album Only songs"};

  //Categories: Needing translation
  if (configLanguages.bLanguageIsNonEnglish) {
    let arrTranslatedLyrics = lyricsTable.getColumnData(lyricsTable.getConfig().colWidths.length - 1);
    let bTranslationExists = arrTranslatedLyrics.some(function (rowLyrics) {return rowLyrics.trim() !== "";});
    //console.log(bTranslationExists);
    if (!bTranslationExists) {
      strAutoloadCategories += "\n" + "Pages in need of English translation";
    }
  }
  
  $("#categories").val(strAutoloadCategories);

}

/*
 * Check if all required information has been added
 * Returns true if errors are detected
 */
function check_form_for_errors() {

  console.log("checking errors");

  error_resets();
  let arrStrError = [];
  let arrStrWarning = [];
  let bRecommendToReloadCategories = false;

  //No language selected?
  let language = $("#languagelist").dropdown("get value").trim();
  if (language == "") {
    arrStrError.push("You haven't chosen a language.");
    $("#languagelist").toggleClass("error",true);
    bRecommendToReloadCategories = true;
  }

  //No original title given?
  if (read_text("originaltitle") == "") {
    arrStrError.push("You haven't entered a song title.");
    $("#originaltitle").parent().toggleClass("error",true);
  }

  //No upload date given?
  let dateOfPublication = document.getElementById("uploaddate").valueAsDate;
  if (dateOfPublication == null) {
    arrStrError.push("You haven't entered the date of publication.");
    $("#uploaddate").toggleClass("error",true);
  }

  //Non-recognized colour format for infobox
  if (!validate_colour(read_text("bgcolour"))) {
    arrStrError.push("There is an error with the background colour.");
    $("#bgcolour").parent().toggleClass("error",true);
  }
  if (!validate_colour(read_text("fgcolour"))) {
    arrStrError.push("There is an error with the foreground colour.");
    $("#fgcolour").parent().toggleClass("error",true);
  }

  //Non-recognized colour format in lyrics table
  let arrStyleLyrics = lyricsTable.getColumnData(0);
  if (arrStyleLyrics.some(function (rowLyrics) {return !validate_colour(rowLyrics.trim());})) {
    arrStrError.push("There is an error with one of the colours in the lyrics table.");
    $("#lyricstablecaption").toggleClass("error",true);
  }

  //No information added in singers box?
  if (read_text("singer") == "") {
    arrStrError.push("You haven't listed any singers.");
    $("#singer").toggleClass("error",true);
  }
  //No singer in markup in singers box?
  let arrSingers = read_text("singer").match(/\[\[[^\[\]:]*\]\]/gm);
  if (!Array.isArray(arrSingers)) {
    arrStrError.push("You need to list at least one singer in markup, e.g. [[Hatsune Miku]]");
    $("#singer").toggleClass("error",true);
    bRecommendToReloadCategories = true;
  }

  //No listed vocal synth engines?
  let synthengine = $("#featuredsynth").dropdown("get value").trim();
  if (synthengine == "") {
    arrStrError.push("Please list at least one vocal synth engine, e.g. VOCALOID. Choose \"Other/Unlisted\" if not on the list.");
    $("#featuredsynth").toggleClass("error",true);
    bRecommendToReloadCategories = true;
  }

  //No information in producers box?
  let strProducers = read_text("producers");
  if (strProducers == "") {
    arrStrError.push("You haven't listed any producers. For well-known producers, it is recommended that the producer's name is listed in markup, e.g. [[wowaka]], before you generate the song page.");
    $("#producers").toggleClass("error",true);
    bRecommendToReloadCategories = true;
  }

  //No producers in markup?
  let tryRegex = strProducers.match(/\[\[[^\[\]:]*\]\]\s\([^\(\)]*\)/gm);
  if (!Array.isArray(tryRegex) || tryRegex.length) {
    arrStrWarning.push("If the producer already has a page on Vocaloid Lyrics wiki, then you should add the name of that producer in markup, e.g. \"[[wowaka]] (music)\" or \"[[nagimiso]] (illustration)\". Clicking the \"Autoload Categories\" button again in this case will automatically generate the category for that producer.");
    //bRecommendToReloadCategories = true;
  }

  //No rows in play links table
  arrDataPlayLinks = playLinksTable.getData();
  if (!Array.isArray(arrDataPlayLinks) || arrDataPlayLinks.length == 0) {
    arrStrError.push("No music videos or play links are detected. Please check the \"Song is not publicly available\" option if the song is no longer publicly available or check the \"Album-only Release\" option if the song is released on albums only");
    $("#playlinkscaption").toggleClass("error",true);
    bRecommendToReloadCategories = true;
  }

  //No URL supplied in play links table
  let bSongIsAlbumOnly = document.getElementById("albumonly").checked;
  let bSongIsUnavailable = document.getElementById("unavailable").checked;
  let bNoURLDetected = !arrDataPlayLinks.some(function (rowPlayLink) {return rowPlayLink[1].trim() !== "";});
  if (bNoURLDetected && !bSongIsAlbumOnly && !bSongIsUnavailable) {
    arrStrError.push("No music videos or play links are detected. Please check the \"Song is not publicly available\" option if the song is no longer publicly available or check the \"Album-only Release\" option if the song is released on albums only");
    $("#playlinkscaption").toggleClass("error",true);
    bRecommendToReloadCategories = true;
  }

  //Original lyrics is empty
  let arrOrigLyrics = lyricsTable.getColumnData(1);
  if (!arrOrigLyrics.some(function (rowLyrics) {return rowLyrics.trim() !== "";})) {
    arrStrError.push("Original lyrics column is empty.");
    $("#lyricstablecaption").toggleClass("error",true);
  }

  //Romanized lyrics is empty
  let lyricsTable_numColumn = lyricsTable.getConfig().colWidths.length;
  //Only check in the case where the romanized lyrics column is set
  if (lyricsTable_numColumn == 4) {
    let arrRomLyrics = lyricsTable.getColumnData(2);
    if (!arrRomLyrics.some(function (rowLyrics) {return rowLyrics.trim() !== "";})) {
      arrStrError.push("Romanized/transliterated lyrics column is empty.");
      $("#lyricstablecaption").toggleClass("error",true);
    }
  }

  //Translation exists, but there's no translator's name
  //Someone's name is given in the translation, but no translation exists
  //Only check in the case where the English lyrics column is set
  if (lyricsTable_numColumn > 2) {
    let arrEngLyrics = lyricsTable.getColumnData(lyricsTable_numColumn - 1);
    let bTranslationExists = arrEngLyrics.some(function (rowLyrics) {return rowLyrics.trim() !== "";});
    let bTranslatorIsCredited = (read_text("translator") !== "" || document.getElementById("officialtranslation").checked);
    if (bTranslationExists && !bTranslatorIsCredited) {
      arrStrWarning.push("A translation exists, but the translator is uncredited. Is it made by an anonymous contributor?");
      //$("#translator").parent().toggleClass("error",true);
    }
    if (!bTranslationExists && bTranslatorIsCredited) {
      arrStrWarning.push("A translator is credited, but the translation column is empty.");
      //$("#translator").parent().toggleClass("error",true);
    }
  }
  
  //Forgot to autoload categories?
  if (read_text("categories") == "") {
    arrStrError.push("Did you forget to add categories?");
    $("#categories").toggleClass("error",true);
    bRecommendToReloadCategories = true;
  }
  

  //Write warnings
  if (arrStrWarning.length) {
    let strWarning = "<h2>Warning</h2><p><ul>";
    arrStrWarning.forEach( message => {
      strWarning += "<li>" + message + "</li>";
    });
    strWarning += "</ul></p>";
    $("#warnings").html(strWarning);
    $("#warnings").show();
  }
  if (arrStrError.length) {
    let strError = "<h2>Errors detected:</h2><p><ul>";
    arrStrError.forEach( message => {
      strError += "<li>" + message + "</li>";
    });
    strError += "</ul></p>";
    if (bRecommendToReloadCategories) {
      strError += "<p>Please click the \"Autoload Categories\" button again before you generate the song page.</p>"
    }
    $("#error").html(strError);
    $("#error").show();
    return true;
  }

  return false;

}

/*
 * Function to replace a string with \n line breaks to <br> line breaks.
 */
function toHTML(string) {
  return string.replace(/(?:\r\n|\r|\n)/g, "<br />");
}

/*
 * Style a string in <span> tags
 */
function style_colour(string, colour) {
  if (colour !== "" && validate_colour(colour)) {string = "<span style=" + colour + ">" + string + "</span>";};
  return string;
}

/*
 * Clear errors and warnings.
 */
function error_resets() {

  let arrDomElements = [
    $("#languagelist"),
    $("#originaltitle").parent(),
    $("#uploaddate"),
    $("#bgcolour").parent(),
    $("#fgcolour").parent(),
    $("#lyricstablecaption"),
    $("#singer"),
    $("#featuredsynth"),
    $("#producers"),
    $("#playlinkscaption"),
    $("#lyricstablecaption"),
    $("#translator").parent(),
    $("#categories")
  ]

  arrDomElements.forEach( domElement => {
    domElement.toggleClass("error", false);
  })

  $("#error").html("");
  $("#error").hide();
  $("#warnings").html("");
  $("#warnings").hide();
}
