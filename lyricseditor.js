//This script file also refers to the variable lyricsTable in the main HTML doc.

/*
 * Declarations of arrays to contain data from custom JSpreadsheet tables
 */
let arrDataLyrics = [];

let strOrigHeader = "";

/*
 * Event handler: Detect tables in the wiki page source code.
 */
function detectWikiTables() {
  //Read the source data
  let strSourceData = read_text("textboxsourcecode");

  //Detect tables in the source data
  let arrWikiTables = strSourceData.toString().match(/\{\|(?:(?!\|\})(.|\n|\r))*?\|\}/gm);

  //Reset dropdown box
  document.getElementById("dropdownselecttable").innerHTML = "";
  document.getElementById("tableerror").innerHTML = "";

  //Populate the dropdown box if tables are detected
  if (Array.isArray(arrWikiTables) && arrWikiTables.length) {
    for (let i = 0; i < arrWikiTables.length; i++) {
      document.getElementById("dropdownselecttable").innerHTML += "<option value=\"" + i + "\">Table " + (i+1) + "</option>\n";
    }
  }
  //Show alert if no tables are detected
  else {
    document.getElementById("tableerror").innerHTML = "<p style=\"font-size: 14pt;\"><b>Error:</b></p><p style=\"font-size: 10pt;\">No tables are detected in the wiki page source code.</p>"
  }
}

/*
 * Get the contents of the table from the source data.
 * Extract to lyricsTable in the HTML doc.
 */
function getTableFromSourceData() {

  //Read the source data
  let strSourceData = read_text("textboxsourcecode");

  //Detect tables in the source data
  let arrWikiTables = strSourceData.toString().match(/\{\|(?:(?!\|\})(.|\n|\r))*?\|\}/gm);
  //console.log(arrWikiTables);

  let getTableNo = document.getElementById("dropdownselecttable").selectedIndex;
  //console.log(getTableNo);
  if (getTableNo == null) {return;};

  let strWikiTable = arrWikiTables[getTableNo].toString();
  //console.log(strWikiTable);
  let splitWikiTableByLine = strWikiTable.split(/\r?\n/);
  //let bIsLineHeader = true;

  strOrigHeader = "";
  let plcStrNewHeader = "";
  let curLyricsLineCount = 0;
  let nextLyricsLineCount = 0;
  let numColumns = 0;
  let wikiRowLyrics = ["", "", "", ""];
  let rowStyling = "";
  let wikiLyrics = [];
  let mergedLyrics = "";
  let plcTryRegex = [];

  //Reset error
  document.getElementById("tableerror").innerHTML = "";
  
  while (curLyricsLineCount < splitWikiTableByLine.length - 1) {
    for (nextLyricsLineCount = curLyricsLineCount+1; nextLyricsLineCount < splitWikiTableByLine.length - 1; nextLyricsLineCount++) {
      if (splitWikiTableByLine[nextLyricsLineCount].trim().match(/^(\|\-|\|\})/)) {break;};
    };
    if (curLyricsLineCount == 0) {
      numColumns = nextLyricsLineCount - curLyricsLineCount - 1;
      for (let i = 0; i < nextLyricsLineCount; i++) {
        strOrigHeader += splitWikiTableByLine[i].trim() + "\n";
      };
      //If table has only one or more than 3 columns, show error 
      try {
        plcStrNewHeader = getNewColumnHeaders(false, false);
      }
      catch (error) {
        document.getElementById("tableerror").innerHTML = error;
        return;
      }
    }
    else {
      wikiRowLyrics = ["", "", "", ""];
      for (let i = 0; i < Math.min(4, nextLyricsLineCount - curLyricsLineCount); i++) {
        wikiRowLyrics[i] = splitWikiTableByLine[curLyricsLineCount + i].trim().substring(1).trim();
      };
      if (wikiRowLyrics[1].match(/\<br\s?\/?\>/)) {wikiRowLyrics[1] = "";}
      //Unmerge columns
      if (nextLyricsLineCount - curLyricsLineCount == 2) {
        console.log("Case unmerge: ") + wikiRowLyrics[1];
        //wikiRowLyrics[1] = wikiRowLyrics[1].replace(/^.*\|/,"")
        mergedLyrics = wikiRowLyrics[1];
        plcTryRegex = mergedLyrics.match(/(?<=(\{\{shared\|\d\}\})\s*).*/g);
        if (Array.isArray(plcTryRegex)) {
          //Case: Lyrics have been merged in the format "{{shared|n}} |"
          mergedLyrics = plcTryRegex[0];
        }
        else {
          plcTryRegex = mergedLyrics.match(/(?<=(colspan=["']?\d["']?)\s?\|).*/g);
          //Case: Lyrics have been merged in the format "colspan='n' |"
          if (Array.isArray(plcTryRegex)) {
            mergedLyrics = plcTryRegex[0];
            plcTryRegex = plcTryRegex[0].match(/(?<=\<\w*\>'{5}).*(?='{5}\<\/\w*\>)/g);
            //Remove additional formatting, e.g. <center>'''''text'''''</center>, if detected
            if (Array.isArray(plcTryRegex)) {mergedLyrics = plcTryRegex[0];};
          }
          else {
            //Case: no match found, keep merged lyrics as-is 
          }
        }
        wikiRowLyrics[1] = mergedLyrics;
        wikiRowLyrics[2] = mergedLyrics;
        wikiRowLyrics[3] = mergedLyrics;
      }
      rowStyling = wikiRowLyrics[0].substring(1).trim();
      //Span formatting
      if (rowStyling.match(/^style/)) {
        rowStyling = rowStyling.replace(/^style\s*=\s*(\"|\')color\:/, "");
        rowStyling = rowStyling.replace(/;?(\"|\')/, "");
        document.getElementById("tablestyle_span").checked = true;
      }
      //Lrc formatting
      else if (rowStyling.match(/^\{\{lrc.*\}\}/)) {
        rowStyling = rowStyling.replace(/^\{\{lrc.*\|/, "");
        rowStyling = rowStyling.replace(/\}\}/, "");
        document.getElementById("tablestyle_lrc").checked = true;
      }
      wikiRowLyrics[0] = rowStyling;
      wikiLyrics.push(wikiRowLyrics);
    }
    curLyricsLineCount = nextLyricsLineCount;
  }

  //console.log(wikiLyrics);
  lyricsTable.setData(wikiLyrics);
  //let bTranslationExists = lyricsTable.getColumnData(3).some(function (rowLyrics) {return rowLyrics.trim() !== "";});
  //document.getElementById("checkshowengcolumn").className = bTranslationExists ? "disabled" : "";
  //document.getElementById("checkshowengcolumnlabel").className = bTranslationExists ? "disabled" : "";
  //document.getElementById("checkshowengcolumn").disabled = bTranslationExists;
  //document.getElementById("checkshowengcolumn").checked = !bTranslationExists;

}

function generateLyrics() {

  //Read lyrics table
  arrDataLyrics = lyricsTable.getData();

  //Reset output
  document.getElementById("output").innerHTML = "";
  //console.log("ERASED");

  //let strWikiLyrics = "==Lyrics==\n";
  let strWikiLyrics = "";
  let strLyricsTable = "";

  let lrcTemplate = "";

  //let language = document.getElementById("languagelist").selectedIndex - 1;
  let bTranslationExists = false;
  let bTranslationNotesExist = false;
  let bTranslationIsOfficial = document.getElementById("officialtranslation").checked;
  let bShowEngColumn = document.getElementById("checkshowengcolumn").checked;
  let bLyricsAreRomanized = true;
  let bLyricsFormattingIsSpan = document.getElementById("tablestyle_span").checked;
  if (!bLyricsFormattingIsSpan) {
    lrcTemplate = read_text("tablestyle_lrc_template").toString();
    if (lrcTemplate == "") {lrcTemplate = "lrc"};
  };
  let translatorName = read_text("translator").toString();
  let translatorLicense = get_translator_license(translatorName);

  let numColumns = 0;
  let wikiNumColumns = 0;
  let rowOrigLyrics = "";
  let rowRomLyrics = "";
  let rowEngLyrics = "";
  let rowStyling = "";
  let setLyricsColours = new Set();

  const singingPartsTemplate_span = `{| border="1" cellpadding="4" style="border-collapse:collapse; border:1px groove; line-height:1.5"
!style="background-color:white; color:black"|Singer
#SINGING_PARTS
|}`
  const singingPartsTemplate_lrc = `{{lrc legend|black; color:white
#SINGING_PARTS
}}`

  //Check if a translation exists
  if (Array.isArray(arrDataLyrics) && arrDataLyrics.length) {
    numColumns = arrDataLyrics[0].length;
    bTranslationExists = arrDataLyrics.some(function (rowLyrics) {return rowLyrics[numColumns-1].trim() !== "";});
    //console.log("A translation exists: " + bTranslationExists);
    bTranslationNotesExist = arrDataLyrics.some(function (rowLyrics) {
      return rowLyrics[numColumns-1].match(/<\/ref>/) || rowLyrics[numColumns-1].match(/<ref name.*>/);
    });
    //Always show English column if a translation exists
    //bShowEngColumn = bShowEngColumn || bTranslationExists;
  }

  wikiNumColumns = numColumns - 1;
  if (!bShowEngColumn) {wikiNumColumns = wikiNumColumns - 1;};

  //Add wiki table headers
  try {
    strLyricsTable = getNewColumnHeaders(bShowEngColumn, bTranslationIsOfficial);
  }
  catch (error) {
    document.getElementById("tableerror").innerHTML = error;
    return;
  }

  //Combine table
  if (Array.isArray(arrDataLyrics) && arrDataLyrics.length) {
    arrDataLyrics.forEach(rowLyrics => {
      strLyricsTable += "|-";

      //Add styling
      rowStyling = rowLyrics[0].toString().trim();
      if (rowStyling !== "") {
        if (bLyricsFormattingIsSpan && validate_colour(rowStyling)) {
          strLyricsTable += " style=\"color:" + rowStyling + "\"";
        }
        else {
          strLyricsTable += " {{" + lrcTemplate + "|" + rowStyling + "}}";
        }
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
          strLyricsTable += "| {{shared|" + wikiNumColumns + "}} " + rowOrigLyrics + "\n";
      }

      //Add each line otherwise
      else {
        setLyricsColours.add(rowStyling);
        strLyricsTable += "|" + rowOrigLyrics + "\n";
        if (bLyricsAreRomanized) {strLyricsTable += "|" + rowRomLyrics + "\n";};
        if (bShowEngColumn) {strLyricsTable += "|" + rowEngLyrics + "\n";};
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
        if (bLyricsFormattingIsSpan) {
          singingParts += "|<span style=\"color:" + lyricsColour + "\">" + "Singer" + "</span>\n";
        }
        else {
          singingParts += "|" + lyricsColour + ":Colour\n"
        }
      };
    })
    if (setLyricsColours.has("")) {singingParts += "|" + "All" + "\n";}
    if (bLyricsFormattingIsSpan) {singingParts = singingPartsTemplate_span.replace("#SINGING_PARTS\n", singingParts);}
    else {singingParts = singingPartsTemplate_lrc.replace("#SINGING_PARTS\n", singingParts);};
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
  
  strWikiLyrics += strLyricsTable; 
  document.getElementById("output").innerHTML = strWikiLyrics;

}

/*
 * Actionable command: Decapitalize the romanized lyrics
 */
function actionable_decapitalizeRomanizedLyrics() {
  let arrRomLyrics = lyricsTable.getColumnData(2);
  let romLyrics = "";
  if (Array.isArray(arrRomLyrics) && arrRomLyrics.length) {
    for (let i = 0; i < arrRomLyrics.length; i++) {
      romLyrics = arrRomLyrics[i].toString().trim();
      romLyrics = romLyrics.toLowerCase();
      arrRomLyrics[i] = romLyrics;
    };
  };
  lyricsTable.setColumnData(2, arrRomLyrics);
}

/*
 * Actionable command: Remove tones from the romanized lyrics
 */
function actionable_removeTonesFromPinyin() {
  let arrRomLyrics = lyricsTable.getColumnData(2);
  let romLyrics = "";
  if (Array.isArray(arrRomLyrics) && arrRomLyrics.length) {
    for (let i = 0; i < arrRomLyrics.length; i++) {
      romLyrics = arrRomLyrics[i].toString().trim();
      romLyrics = romLyrics.replace(/[āáǎà]/gm, "a");
      romLyrics = romLyrics.replace(/[ĀÁǍÀ]/gm, "A");
      romLyrics = romLyrics.replace(/[īíǐì]/gm, "i");
      romLyrics = romLyrics.replace(/[ĪÍǏÌ]/gm, "I");
      romLyrics = romLyrics.replace(/[ūúǔù]/gm, "u");
      romLyrics = romLyrics.replace(/[ŪÚǓÙ]/gm, "U");
      romLyrics = romLyrics.replace(/[ēéěè]/gm, "e");
      romLyrics = romLyrics.replace(/[ĒÉĚÈ]/gm, "E");
      romLyrics = romLyrics.replace(/[ōóǒò]/gm, "o");
      romLyrics = romLyrics.replace(/[ŌÓǑÒ]/gm, "O");
      romLyrics = romLyrics.replace(/[ǖǘǚǜ]/gm, "ü");
      romLyrics = romLyrics.replace(/[ǕǗǙǛ]/gm, "Ü");
      arrRomLyrics[i] = romLyrics;
    };
  }
  lyricsTable.setColumnData(2, arrRomLyrics);
}

/*
 * Actionable command: Change 'wo' to 'o', 'he' to 'e', and the syllable 'dzu' to 'zu'
 */
function actionable_shiftRomajiToModernHepburn() {
  let arrRomLyrics = lyricsTable.getColumnData(2);
  let romLyrics = "";
  if (Array.isArray(arrRomLyrics) && arrRomLyrics.length) {
    for (let i = 0; i < arrRomLyrics.length; i++) {
      romLyrics = arrRomLyrics[i].toString().trim();
      romLyrics = romLyrics.toString();
      romLyrics = romLyrics.replace(/\bwo\b/gm, "o");
      romLyrics = romLyrics.replace(/\bhe\b/gm, "e");
      romLyrics = romLyrics.replace(/dzu/gm, "zu");
      arrRomLyrics[i] = romLyrics;
    };
  };
  lyricsTable.setColumnData(2, arrRomLyrics);
}

/*
 * Determine the new column headers based on the given input and user settings
 */
function getNewColumnHeaders(bShowEngColumn, bTranslationIsOfficial) {

  const strDefaultHeader =`{| style="width:100%"
|'''''Original'''''
|'''''Romanized'''''
`

  let strNewHeader = "";

  if (strOrigHeader == "") {
    strNewHeader = strDefaultHeader;
    if (bShowEngColumn) {
      if (bTranslationIsOfficial) {strNewHeader += "|{{OfficialEnglish}}\n";}
      else {strNewHeader += "|'''''English'''''\n"};
    }
    return strNewHeader;
  }

  let plcHeaders = strOrigHeader.split(/\r?\n/);
  plcHeaders.pop();
  //Has two or three columns
  if (plcHeaders.length == 3 || plcHeaders.length == 4) {

    //Remove English lyrics column header
    if (plcHeaders.length == 4) {plcHeaders.pop();};
    //Copy the column header data
    plcHeaders.forEach (header => {
      strNewHeader += header + "\n";
    });

    if (bShowEngColumn) {
      //Get the original lyrics column header, from which the template will be determined
      let origHeaderColumn = plcHeaders[1];
      let headerEnglishColumn = "";

      //Case "! align='left' |"
      if (origHeaderColumn.match(/^!\s?align=(\"|\')?left(\"|\')?\s?\|/)) {
        if (bTranslationIsOfficial) {
          headerEnglishColumn = origHeaderColumn.replace(/(?<=!\s?align=(\"|\')?left(\"|\')?\s?\|)'*\b.*\b'*(?!')/, "{{OfficialEnglish}}");
          headerEnglishColumn = headerEnglishColumn.match(/^!\s?align=(\"|\')?left(\"|\')?\s?\|{{OfficialEnglish}}/)[0];
          strNewHeader += headerEnglishColumn + "\n";
        }
        else {
          headerEnglishColumn = origHeaderColumn.replace(/(?<=!\s?align=(\"|\')?left(\"|\')?\s?\|'*)\b.*\b(?='*)/, "English");
          headerEnglishColumn = headerEnglishColumn.match(/^!\s?align=(\"|\')?left(\"|\')?\s?\|'*\b.*\b'*/)[0];
          strNewHeader += headerEnglishColumn + "\n";
        }
      }

      //Case "| (some format)"
      else if (origHeaderColumn.match(/^\|/)) {
        if (bTranslationIsOfficial) {headerEnglishColumn += "|{{OfficialEnglish}}";}
        else {headerEnglishColumn = origHeaderColumn.replace(/\b.*\b/, "English");}
        strNewHeader += headerEnglishColumn + "\n";
      }

      //Exceptions: Unrecognized format
      else {
        strNewHeader = strDefaultHeader;
        if (bTranslationIsOfficial) {strNewHeader += "|{{OfficialEnglish}}\n";}
        else {strNewHeader += "|'''''English'''''\n"};
      }

    };

    return strNewHeader;

  }

  //Exceptions (only one column or more than 3 columns)
  else {
    throw "<p style=\"font-size: 14pt;\"><b>Error:</b></p><p style=\"font-size: 10pt;\">Incorrect table template<br>Table must have 2 or 3 columns (Original Lyrics, Romanized Lyrics, and Translated Lyrics (if exists))</p>";
  }

}