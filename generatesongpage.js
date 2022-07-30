//This script file also refers to the variables languages, lyricsTable, playLinksTable and extLinksTable in the main HTML doc.

const strInfoBoxTemplate = `{{Infobox_Song
|image = 
|songtitle = ""'''$ORIGINAL_TITLE'''""$ADDITIONAL_TITLES
|color = $BG_COLOUR; color:$FG_COLOUR
|original upload date = $DATEOFPUBLICATION
|singer = $SINGERS
|producer = $PRODUCERS
|#views = $VIEWCOUNT
|link = $PLAYLINKS
|description = $DESCRIPTION
}}`;

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pvserviceabbr = {
  "Niconico":"NN",
  "bilibili":"BB",
  "YouTube":"YT",
  "Vimeo":"VM",
  "piapro":"PP",
  "SoundCloud":"SC"
};

const translatorlicenses =
  [
  {id:["aWhimsicalStar☆"],
    license:"https://awhimsicalstar.dreamwidth.org"},
  {id:["Azayaka"], 
    license:"https://echoesofblue.tumblr.com/terms|her website"},
  {id:["a bunny's translations"],
    license:"http://bunnyword.tumblr.com/about|her tumblr"},
  {id:["BambooXZX"],
    license:"https://bambooxzx.wordpress.com/about/"},
  {id:["Bluepenguin", "EJ Translations"],
    license:"https://ejtranslations.wordpress.com/"},
  {id:["CoolMikeHatsune22"],
    license:"https://coolmikehatsune22.wordpress.com/about-me/"},
  {id:["Kazabana"],
    license:"https://kazabana.wordpress.com/about/"},
  {id:["ElectricRaichu", "Len's Lyrics", "Raichu"],
    license:"http://lenslyrics.ml/licence.html|his website"},
  {id:["Magenetra", "Kagamine_Neko", "aquariantwin", "Mellifera_x3"],
    license:"https://magenetratranslations.tumblr.com/Terms|their tumblr"},
  {id:["Matchakame"],
    license:"http://matchakame.tumblr.com/about|her tumblr"},
  {id:["PeanutSub"],
    license:"https://peanut-sub.tumblr.com/bya|their blog"},
  {id:["poppochan28"],
    license:"https://poppochan.dreamwidth.org/438.html|their blog"},
  {id:["Pricecheck Translations"],
    license:"http://pricechecktranslations.tumblr.com/about|her tumblr"},
  {id:["Releska"],
    license:"https://releska.com/|his blog"},
  {id:["TsunaguSubs"],
    license:"https://tsunagusubs.github.io/#faq|her website"},
  {id:["shiyuki332", "Shiyuki", "Shiyuki332"],
    license:"https://twitter.com/shiyuki332/status/1256815663663837184|their twitter"},
  {id:["Yumemiru Sekai"],
    license:"https://yumemirusekai.wordpress.com/faq/|their blog"}
  ];

/*
 * Declarations of arrays to contain data from custom JSpreadsheet tables
 */
let arrDataPlayLinks = [];
let arrDataExtLinks = [];
let arrDataLyrics = [];

/*
 * Read data input into custom JSpreadsheet tables
 */
function readTables() {
  arrDataPlayLinks = playLinksTable.getData();
  arrDataExtLinks = extLinksTable.getData();
  arrDataLyrics = lyricsTable.getData();
}

/*
 * Generate entire song page
 */
function generateSongPage() {
  //Reset output
  document.getElementById("output").innerHTML = "";
  document.getElementById("pagetitle").innerHTML = "";

  //Check for errors
  let ignoreerrors = document.getElementById("ignoreerrors").checked;
  let bErrorsExist = check_form_for_errors();
  if (!ignoreerrors && bErrorsExist) {
    return;
  }

  //Otherwise generate the song page
  readTables();
  document.getElementById("output").innerHTML = generateContentWarnings() + generateInfoBox() + "\n\n" + generateLyrics() + "\n\n" + generateExternalLinks() + "\n\n\n" + generateListOfCategories();
  let pageTitle = read_text("originaltitle");
  let romTitle = read_text("romajititle");
  if (romTitle !== "") {pageTitle += " (" + romTitle + ")"};
  document.getElementById("pagetitle").innerHTML = pageTitle;

}

function generateContentWarnings() {
  let strContentWarnings = "";
  if (document.getElementById("questionablecontent").checked) {strContentWarnings = "{Questionable}\n";}
  else if (document.getElementById("explicitcontent").checked) {strContentWarnings = "{Explicit}\n";}
  if (document.getElementById("epilepticcontent").checked) {strContentWarnings = "{Epilepsy}" + strContentWarnings;}
  return strContentWarnings;
}

function generateInfoBox() {
  let strInfoBox = strInfoBoxTemplate;

  //Fetch song language and title information
  let language = document.getElementById("languagelist").selectedIndex - 1;
  let bShowRomTitle = (language < 0 || "transliteration" in languages[language]);
  let bShowEngTitle = (language !== 0);
  let origTitle = read_text("originaltitle");
  let romTitle = read_text("romajititle");
  let engTitle = read_text("translatedtitle");
  let transliteration = "";
  if (language == -1) {transliteration = "Romanized: "}
  else if (bShowRomTitle) {transliteration = languages[language].transliteration + ": "}
  bShowRomTitle = bShowRomTitle && romTitle !== "";
  bShowEngTitle = bShowEngTitle && engTitle !== "";
  let additionalTitles = "";
  if (bShowRomTitle) {additionalTitles += "<br />" + transliteration + romTitle};
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
  let strDescription = toHTML(read_text("description"));

  //Initialize variables to fetch view count and play links information  
  let strPlayLinks = "";
  let playLinkURL = "";
  let strPlayLinkPerPV = "";
  let strPlayLinkNote = "";
  let strViewCount = "";
  let strViewCountPerPV = "";
  let viewCount = 0;

  //Fetch view count and play links information
  if (Array.isArray(arrDataPlayLinks) && arrDataPlayLinks.length) {

    //Fetch view count if the PV is not a reprint (fetch if PV is auto-generated by YT Topics), still up online, and is on a website that displays view count
    let numPVwithViewCounts = arrDataPlayLinks.reduce(function (n, playLink) {
      return n + (!playLink[2] && !playLink[4] && playLink[0] in pvserviceabbr);
    }, 0);
    if (numPVwithViewCounts == 0) {strViewCount = "N/A";}
    let bShowPVService = (numPVwithViewCounts > 1);

    arrDataPlayLinks.forEach(playLink => {

      //Write play link information
      playLinkURL = playLink[1];
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
        //Round down view count number if numeric
        if (playLink[5].trim() !== "" && !isNaN(playLink[5].trim())) {
          viewCount = parseInt(playLink[5]);
          if (viewCount < 10000) {viewCount = Math.floor(viewCount / 100) * 100;}
          else {viewCount = Math.floor(viewCount / 1000) * 1000;}
          strViewCountPerPV = viewCount.toLocaleString('en-US') + "+";
        }
        //Show view count number as text if non-numeric
        else {strViewCountPerPV = playLink[5].trim();}
        //Show the website on which the PV is published, if needed
        if (bShowPVService) {strViewCountPerPV += " (" + pvserviceabbr[playLink[0]] + ")";}
        strViewCount = addItemToListString(strViewCountPerPV, strViewCount, ", ");
      }

    });
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
  strInfoBox = strInfoBox.replace("$DESCRIPTION", strDescription);

  return strInfoBox;

}

function generateLyrics() {
  let strWikiLyrics = "==Lyrics==\n";
  let strLyricsTable = "";

  let language = document.getElementById("languagelist").selectedIndex - 1;
  let bTranslationExists = false;
  let translatorName = read_text("translator").toString();
  let translatorLicense = get_translator_license(translatorName);

  let numColumns = 0;
  let rowOrigLyrics = "";
  let rowRomLyrics = "";
  let rowEngLyrics = "";
  let rowStyling = "";

  if (language == 0) {
    //Song is English
    if (Array.isArray(arrDataLyrics) && arrDataLyrics.length) {

      //Colour per segment of lyrics
      for (let i = 0; i < arrDataLyrics.length; i++) {
        rowEngLyrics = arrDataLyrics[i][1].toString().trim();
        if (rowStyling !== arrDataLyrics[i][0].toString().trim() && validate_colour(arrDataLyrics[i][0].toString().trim())) {
          rowStyling = arrDataLyrics[i][0].toString().trim();
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
    }

    //Check if translation is approved
    let bTranslationIsOfficial = document.getElementById("officialtranslation").checked;

    //Add wiki table headers
    strLyricsTable = "{| style='width:100%'\n";
    if (language == -1) {
      //No language specified
      strLyricsTable += "|'''''Original'''''\n";
      strLyricsTable += "|'''''Romanized'''''\n"
    }
    else if ("transliteration" in languages[language]) {
      //Add romanized lyrics column
      strLyricsTable += "|'''''" + languages[language].name + "'''''\n";
      strLyricsTable += "|'''''" + languages[language].transliteration + "'''''\n"
    };
    //TODO: Add if statement to only add English column if a translation exists
    if (bTranslationIsOfficial) {strLyricsTable += "|{{OfficialEnglish}}\n";}
    else {strLyricsTable += "|'''''English'''''\n"};

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
        if (language == -1 || "transliteration" in languages[language]) {rowRomLyrics = rowLyrics[2].toString().trim();}
        else {rowRomLyrics = rowOrigLyrics;}
        rowEngLyrics = rowLyrics[numColumns - 1].toString().trim();
        //TODO: Add if statement to only add English column if a translation exists
        
        //Add blank line if detected
        if (rowOrigLyrics == "" && rowRomLyrics == "" && rowEngLyrics == "") {
          strLyricsTable += "|<br />\n"
        }

        //Merge the columns if they have identical text
        else if ((bTranslationExists && rowOrigLyrics == rowRomLyrics && rowOrigLyrics == rowEngLyrics) || (!bTranslationExists && numColumns == 3 && rowOrigLyrics == rowRomLyrics)) {
          //strLyricsTable += "| {{shared|" + numColumns-1 + "}} style=\"font-style:italic; font-weight:bold; text-align:center;\" |" + rowOrigLyrics + "\n";
          strLyricsTable += "| {{shared|3}} style=\"font-style:italic; font-weight:bold; text-align:center;\" |" + rowOrigLyrics + "\n";
        }

        //Add each line otherwise
        //TODO: Add if statement to only add English column if a translation exists
        else {
          strLyricsTable += "|" + rowOrigLyrics + "\n";
          strLyricsTable += "|" + rowRomLyrics + "\n";
          strLyricsTable += "|" + rowEngLyrics + "\n";
        }
      });
    }

    //Close the wiki table
    strLyricsTable += "}";

    //Add translator credit
    if (bTranslationExists) {
      if (translatorName == "" && !bTranslationIsOfficial) {
        translatorName = "Anonymous";
      }
      if (!(bTranslationIsOfficial && translatorName == "")) {
        strLyricsTable = translatorLicense + strLyricsTable + "\n" + "{{Translator|" + translatorName + "}}"
      };
    };

  }
  
  strWikiLyrics += strLyricsTable; 
  return strWikiLyrics;
}

function generateExternalLinks() {
  let strWikiExternalLinks = "==External Links==";
  if (Array.isArray(arrDataExtLinks) && arrDataExtLinks.length) {
    let strExtLink = "";

    let url = "";
    let description = "";
    let wiki = "";
    let page = "";

    arrDataExtLinks.forEach(extLink => {
      url = extLink[0];
      description = extLink[1];
      //VocaDB
      if (url.match(/^https?:\/\/vocadb\.net\/.*/)) {
        strExtLink = "*{{VDB|" + url.replace(/^https?:\/\/vocadb\.net\//, "") + "}}";
      }
      //Fandom Wiki
      else if (url.match(/^https?:\/\/.*\.fandom\.com\/.*/)) {
        wiki = url.replace(/^https?:\/\//, "").replace(/\.fandom\.com\/wiki\/.*/, "");
        page = url.replace(/^https?:\/\/.*\.fandom\.com\/wiki\//, "");
        strExtLink = "*[[w:c:" + wiki + ":" + page + "|" + description + "]]";
      }
      //Wikipedia
      else if (url.match(/^https?:\/\/en\.wikipedia\.org\/wiki\/.*/)) {
        page = url.replace(/^https?:\/\/en\.wikipedia\.org\/wiki\//, "");
        strExtLink = "*[[wikipedia:" + page + "|" + description + "]]";
      }
      else {
        strExtLink = "*[" + url + " " + description + "]";
      }
      strWikiExternalLinks = addItemToListString(strExtLink, strWikiExternalLinks, "\n");
    });
  }
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
 * Autoload categories as interpreted from input fields
 */
function autoloadCategories()
{
  let strSingers = "";
  strSingers = read_textbox("singer").toString();
  strSingers = strSingers.replace(/<small>.*<\/small>/, "");
  let arrSingers = strSingers.match(/\[\[[^\[\]:]*\]\]/gm);
  
  strSingers = read_textbox("singer").toString();
  let arrMinorSingers = strSingers.match(/<small>.*<\/small>/gm);
  if (Array.isArray(arrMinorSingers)) {
    strSingers = arrMinorSingers[0];
    arrMinorSingers = strSingers.match(/\[\[[^\[\]:]*\]\]/gm);
  };
  
  let strProducers = read_textbox("producers").toString();
  let arrProducers = strProducers.match(/\[\[[^\[\]:]*\]\]\s\([^\(\)]*\)/gm);
  
  let prodName = "";
  let strProdRoles = "";
  let arrProdRoles = [];
  let bProdWikiCat = {};

  //let strAutoloadCategories = "";
  let strAutoloadCategories = "Vocaloid original songs";
  if (arrFeaturingOtherSynths.size > 0) { 
    arrFeaturingOtherSynths.forEach(featuredSynth => {
      strAutoloadCategories = strAutoloadCategories.concat("\n", "Songs featuring " + featuredSynth);
    });
  }
  //strAutoloadCategories = strAutoloadCategories + "\n" + "Album Only songs";
  let language = document.getElementById("languagelist").selectedIndex - 1;
  if (language >= 0) {strAutoloadCategories += "\n" + languages[language].name + " original songs";}
  if (Array.isArray(arrSingers) && arrSingers.length) { 
    arrSingers.forEach(singer => {
      singer = singer.substring(2, singer.length-2);
      strAutoloadCategories += "\n" + singer + " original songs";
    });
    if (Array.isArray(arrMinorSingers) && arrMinorSingers.length) {
      arrMinorSingers.forEach(singer => {
        singer = singer.substring(2, singer.length-2);
        strAutoloadCategories += "\n" + singer + " original songs";
      });
    }
    if (arrSingers.length > 3) {strAutoloadCategories += "\n" + "Group rendition original songs"}
    else if (arrSingers.length > 2) {strAutoloadCategories += "\n" + "Trios original songs"}
    else if (arrSingers.length > 1) {strAutoloadCategories += "\n" + "Duet original songs"};
  }
  if (Array.isArray(arrProducers) && arrProducers.length) {
    arrProducers.forEach(producer => {
      prodName = producer.match(/\[\[[^\[\]]*\]\]/gm)[0];
      //strProdRoles = producer.match(/\([^\(\)]*\)/gm)[0];
      strProdRoles = producer.replace(prodName + " ", "");
      prodName = prodName.substring(2, prodName.length-2);
      strProdRoles = strProdRoles.substring(1, strProdRoles.length-1);
      arrProdRoles = strProdRoles.split(",");
      //console.log(arrProdRoles);
      arrProdRoles.forEach(prodRole => {
        bProdWikiCat = {"music":false,"lyrics":false,"tuning":false,"arrangement":false,"visuals":false,"other":false,"default":false};
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
          case "other":
            bProdWikiCat["other"] = true;
            break;
          default:
            bProdWikiCat["default"] = true;
            break;
        };
        if (bProdWikiCat["music"] || bProdWikiCat["default"]) {
          strAutoloadCategories += "\n" + prodName + " original songs"
        }
        else {
          if (bProdWikiCat["lyrics"]) {
            strAutoloadCategories += "\n" + prodName + " original songs/Lyrics"
          }
          if (bProdWikiCat["tuning"]) {
            strAutoloadCategories += "\n" + prodName + " original songs/Tuning"
          }
          if (bProdWikiCat["arrangement"]) {
            strAutoloadCategories += "\n" + prodName + " original songs/Arrangement"
          }
          if (bProdWikiCat["visuals"]) {
            strAutoloadCategories += "\n" + prodName + " original songs/Visuals"
          }
          if (bProdWikiCat["other"]) {
            strAutoloadCategories += "\n" + prodName + " original songs/Other"
          }
        }
      });
    });
  }

  if (language = -1 || language >= 0) {
    let arrTranslatedLyrics = lyricsTable.getColumnData(lyricsTable.getConfig().colWidths.length - 1);
    let bTranslationExists = arrTranslatedLyrics.some(function (rowLyrics) {return rowLyrics.trim() !== "";});
    //console.log(bTranslationExists);
    if (!bTranslationExists) {
      strAutoloadCategories += "\n" + "Intervention Required";
      strAutoloadCategories += "\n" + "Pages in need of English translation";
    }
  }
  
  document.getElementById("categories").value = strAutoloadCategories;

}

/*
 * Check if all required information has been added
 * Returns true if errors are detected
 */
function check_form_for_errors() {

  error_resets();
  let error = false;

  let elementValue = "";

  //No language selected?
  let language = document.getElementById("languagelist").selectedIndex - 1;
  error = highlight_field("languagelist", language < 0, "You haven't chosen a language.") || error;
  
  //No original title given?
  elementValue = read_text("originaltitle");
  error = highlight_field("originaltitle", elementValue == "", "You haven't entered a song title.") || error;

  //No upload date given?
  let dateOfPublication = document.getElementById("uploaddate").valueAsDate;
  error = highlight_field("uploaddate", dateOfPublication == null, "You haven't entered the date of publication.") || error;

  //No information added in singers box?
  elementValue = read_text("singer");
  error = highlight_field("singer", elementValue == "", "You haven't listed any singers.") || error;
  //No singer in markup in singers box?
  let arrSingers = elementValue.match(/\[\[[^\[\]:]*\]\]/gm);
  error = highlight_field("singer", !Array.isArray(arrSingers), "You need to list at least one singer in markup, e.g. [[Hatsune Miku]]") || error;

  //No information in producers box?
  elementValue = read_text("producers");
  error = highlight_field("producers", elementValue == "", "You haven't listed any producers.") || error;

  //No rows in play links table
  arrDataPlayLinks = playLinksTable.getData();
  error = highlight_field("playlinkscaption", arrDataPlayLinks.length == 0, "No PVs or play links are detected: Is the song an album-only release?") || error;

  //No URL supplied in play links table
  error = highlight_field("playlinkscaption", 
    !arrDataPlayLinks.some(function (rowPlayLink) {return rowPlayLink[1].trim() !== "";}), 
    "No URL to any PV or play link is given.") 
    || error;

  //Original lyrics is empty
  let arrOrigLyrics = lyricsTable.getColumnData(1);
  error = highlight_field("lyricstablecaption", 
    !arrOrigLyrics.some(function (rowLyrics) {return rowLyrics.trim() !== "";}), 
    "Original lyrics column is empty.") 
    || error;

  //Romanized lyrics is empty
  if (language < 0 || "transliteration" in languages[language]) {
    let arrRomLyrics = lyricsTable.getColumnData(2);
    error = highlight_field("lyricstablecaption", 
      !arrRomLyrics.some(function (rowLyrics) {return rowLyrics.trim() !== "";}), 
      "Romanized/transliterated lyrics column is empty.") 
      || error;
  }

  //Translation exists, but there's no translator's name
  if (language !== 0) {
    elementValue = read_text("translator");
    let arrEngLyrics = lyricsTable.getColumnData(lyricsTable.getConfig().colWidths.length - 1);
    let bTranslationExists = arrEngLyrics.some(function (rowLyrics) {return rowLyrics.trim() !== "";});
    error = highlight_field("translator", 
      (bTranslationExists && elementValue == "" && !document.getElementById("officialtranslation").checked), 
      "Translator is uncredited.") 
      || error;
  }  

  //Forgot to autoload categories?
  elementValue = read_text("categories");
  error = highlight_field("categories", elementValue == "", "Did you forget to add categories?") || error;

  //Validate 
  return error;

}

/*
 * Return a license string if the given translator is recognized as
 * having specific license conditions. Otherwise return an empty string.
 */
function get_translator_license(translator)
{
 for (let i = 0; i < translatorlicenses.length; ++i)
 {
  if (translatorlicenses[i].id.indexOf(translator) >= 0)
   return "{{TranslatorLicense|" + translatorlicenses[i].id[0] +
    "|" + translatorlicenses[i].license + "}}\n";
 }
 return "";
}

/*
 * Function for adding item to a string representing a list of items.
 */
function addItemToListString(item, liststr, delim) {
    if (liststr == "") {
        liststr = item;
    }
    else if (item !== "") {
        liststr += delim + item;
    }
    return liststr;
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
 * Return whether or not a string is a valid CSS colour.
 */
function validate_colour(colour) {
 return colour == "" || colour.match("^#[0-9a-f]{6}$") || colournames.indexOf(colour) >= 0;
}

/*
 * Highlight/unhighlight a field according to whether an error
 * has been detected.
 * Output an error message.
 * Return error status for convenience.
 */
function highlight_field(fieldname, errorstatus, message)
{
 document.getElementById(fieldname).className =
  errorstatus ? "texterror" : "";
 if (errorstatus)
 {
  let errors = document.getElementById("errors");
  errors.innerHTML += "<p>" + message + "</p>";
 }
 return errorstatus;
}

/*
 * Clear errors and warnings.
 */
function error_resets()
{
 highlight_field("languagelist", false);
 highlight_field("originaltitle", false);
 highlight_field("bgcolour", false);
 highlight_field("fgcolour", false);
 highlight_field("producers", false);
 highlight_field("uploaddate", false);
 highlight_field("singer", false);
 document.getElementById("errors").innerHTML = "";
 document.getElementById("warnings").innerHTML = "";
}
