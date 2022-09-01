/*
 * Stores shared arrays and functions
 */

const colournames =
    {
    "aliceblue":"#f0f8ff",
    "antiquewhite":"#faebd7",
    "aqua":"#00ffff",
    "aquamarine":"#7fffd4",
    "azure":"#f0ffff",
    "beige":"#f5f5dc",
    "bisque":"#ffe4c4",
    "black":"#000000",
    "blanchedalmond":"#ffebcd",
    "blue":"#0000ff",
    "blueviolet":"#8a2be2",
    "brown":"#a52a2a",
    "burlywood":"#deb887",
    "cadetblue":"#5f9ea0",
    "chartreuse":"#7fff00",
    "chocolate":"#d2691e",
    "coral":"#ff7f50",
    "cornflowerblue":"#6495ed",
    "cornsilk":"#fff8dc",
    "crimson":"#dc143c",
    "cyan":"#00ffff",
    "darkblue":"#00008b",
    "darkcyan":"#008b8b",
    "darkgoldenrod":"#b8860b",
    "darkgray":"#a9a9a9",
    "darkgreen":"#006400",
    "darkkhaki":"#bdb76b",
    "darkmagenta":"#8b008b",
    "darkolivegreen":"#556b2f",
    "darkorange":"#ff8c00",
    "darkorchid":"#9932cc",
    "darkred":"#8b0000",
    "darksalmon":"#e9967a",
    "darkseagreen":"#8fbc8f",
    "darkslateblue":"#483d8b",
    "darkslategray":"#2f4f4f",
    "darkturquoise":"#00ced1",
    "darkviolet":"#9400d3",
    "deeppink":"#ff1493",
    "deepskyblue":"#00bfff",
    "dimgray":"#696969",
    "dodgerblue":"#1e90ff",
    "firebrick":"#b22222",
    "floralwhite":"#fffaf0",
    "forestgreen":"#228b22",
    "fuchsia":"#ff00ff",
    "gainsboro":"#dcdcdc",
    "ghostwhite":"#f8f8ff",
    "gold":"#ffd700",
    "goldenrod":"#daa520",
    "gray":"#808080",
    "green":"#008000",
    "greenyellow":"#adff2f",
    "grey":"#808080",
    "honeydew":"#f0fff0",
    "hotpink":"#ff69b4",
    "indianred ":"#cd5c5c",
    "indigo":"#4b0082",
    "ivory":"#fffff0",
    "khaki":"#f0e68c",
    "lavender":"#e6e6fa",
    "lavenderblush":"#fff0f5",
    "lawngreen":"#7cfc00",
    "lemonchiffon":"#fffacd",
    "lightblue":"#add8e6",
    "lightcoral":"#f08080",
    "lightcyan":"#e0ffff",
    "lightgoldenrodyellow":"#fafad2",
    "lightgrey":"#d3d3d3",
    "lightgreen":"#90ee90",
    "lightpink":"#ffb6c1",
    "lightsalmon":"#ffa07a",
    "lightseagreen":"#20b2aa",
    "lightskyblue":"#87cefa",
    "lightslategray":"#778899",
    "lightsteelblue":"#b0c4de",
    "lightyellow":"#ffffe0",
    "lime":"#00ff00",
    "limegreen":"#32cd32",
    "linen":"#faf0e6",
    "magenta":"#ff00ff",
    "maroon":"#800000",
    "mediumaquamarine":"#66cdaa",
    "mediumblue":"#0000cd",
    "mediumorchid":"#ba55d3",
    "mediumpurple":"#9370d8",
    "mediumseagreen":"#3cb371",
    "mediumslateblue":"#7b68ee",
    "mediumspringgreen":"#00fa9a",
    "mediumturquoise":"#48d1cc",
    "mediumvioletred":"#c71585",
    "midnightblue":"#191970",
    "mintcream":"#f5fffa",
    "mistyrose":"#ffe4e1",
    "moccasin":"#ffe4b5",
    "navajowhite":"#ffdead",
    "navy":"#000080",
    "oldlace":"#fdf5e6",
    "olive":"#808000",
    "olivedrab":"#6b8e23",
    "orange":"#ffa500",
    "orangered":"#ff4500",
    "orchid":"#da70d6",
    "palegoldenrod":"#eee8aa",
    "palegreen":"#98fb98",
    "paleturquoise":"#afeeee",
    "palevioletred":"#d87093",
    "papayawhip":"#ffefd5",
    "peachpuff":"#ffdab9",
    "peru":"#cd853f",
    "pink":"#ffc0cb",
    "plum":"#dda0dd",
    "powderblue":"#b0e0e6",
    "purple":"#800080",
    "rebeccapurple":"#663399",
    "red":"#ff0000",
    "rosybrown":"#bc8f8f",
    "royalblue":"#4169e1",
    "saddlebrown":"#8b4513",
    "salmon":"#fa8072",
    "sandybrown":"#f4a460",
    "seagreen":"#2e8b57",
    "seashell":"#fff5ee",
    "sienna":"#a0522d",
    "silver":"#c0c0c0",
    "skyblue":"#87ceeb",
    "slateblue":"#6a5acd",
    "slategray":"#708090",
    "snow":"#fffafa",
    "springgreen":"#00ff7f",
    "steelblue":"#4682b4",
    "tan":"#d2b48c",
    "teal":"#008080",
    "thistle":"#d8bfd8",
    "tomato":"#ff6347",
    "turquoise":"#40e0d0",
    "violet":"#ee82ee",
    "wheat":"#f5deb3",
    "white":"#ffffff",
    "whitesmoke":"#f5f5f5",
    "yellow":"#ffff00",
    "yellowgreen":"#9acd32"
    };

const wikitemplates =
    [
    "Vocaloid Lyrics wiki", 
    "UTAU Lyrics wiki", 
    "CeVIO Lyrics wiki", 
    "SynthV Lyrics wiki", 
    "Voice Synth Lyrics wiki"
    ]

/*
 * Names of commonly used sites based on their URLs.
 * ### fandom sites should use w:c: links in generated code
 */
 const listPVService =
    [
    {re:"^https?://youtu\\.be/",                        site:"YouTube"},
    {re:"^https?://(|www\\.)youtube.com/watch?.*",      site:"YouTube"},
    {re:"^https?://www\\.nicovideo\\.jp/.*",            site:"Niconico"},
    {re:"^https?://piapro\\.jp/.*",                     site:"piapro"},
    {re:"^https?://soundcloud\\.com/.*",                site:"SoundCloud"},
    {re:"^https?://.*bandcamp\\.com/.*",                site:"Bandcamp"},
    {re:"^https?://vimeo\\.com/.*",                     site:"Vimeo"},
    {re:"^https?://www\\.bilibili\\.com/.*",            site:"bilibili"},
    {re:"^https?://music\\.163\\.com/\\.*",             site:"Netease Music"},
    ];

const pvserviceabbr = 
    {
    "Niconico":"NN",
    "bilibili":"BB",
    "YouTube":"YT",
    "Vimeo":"VM",
    "piapro":"PP",
    "SoundCloud":"SC"
    };

const listRecognizedLinks = 
    listPVService.concat(
    [
    {re:"^https?://www\\.animelyrics\\.com/.*",                 site:"Anime Lyrics"},
    {re:"^https?://vocadb\\.net/.*",                            site:"VocaDB"},
    {re:"^https?://vocaloidlyrics\\.fandom\\.com/*",            site:"Vocaloid Lyrics Wiki"},
    {re:"^https?://www5\\.atwiki\\.jp/hmiku/.*",                site:"Hatsune Miku Wiki"},
    {re:"^https?://w\\.atwiki\\.jp/hmiku/.*",                   site:"Hatsune Miku Wiki"},
    {re:"^https?://vocaloid\\.fandom\\.com/.*",                 site:"Vocaloid Wiki"},
    {re:"^https?://dic\\.nicovideo\\.jp/.*",                    site:"Niconico Pedia"},
    {re:"^https?://ch\\.nicovideo\\.jp/.*",                     site:"Blomaga"},
    {re:"^https?://commons\\.nicovideo\\.jp/.*",                site:"Niconi Commons"},
    {re:"^https?://www\\.pixiv\\.net/.*",                       site:"pixiv"},
    {re:"^https?://utaitedb\\.net/.*",                          site:"UtaiteDB"},
    {re:"^https?://project-diva\\.fandom\\.com/.*",             site:"Project DIVA Wiki"},
    {re:"^https?://projectdiva\\.wiki/.*",                      site:"ProjectDIVA Wiki"},
    {re:"^https?://theevilliouschronicles\\.fandom\\.com/.*",   site:"The Evillious Chronicles Wiki"},
    {re:"^https?://w\\.atwiki\\.jp/vocaloidenglishlyric/.*",    site:"Vocaloid English & Romaji Lyrics @wiki"},
    {re:"^https?://ja\\.chordwiki\\.org/.*",                    site:"ChordWiki"},
    {re:"^https?://dic\\.pixiv\\.net/.*",                       site:"Pixiv Encyclopedia"},
    {re:"^https?://en-dic\\.pixiv\\.net/.*",                    site:"Pixiv Encyclopedia (English)"},
    {re:"^https?://j-lyric\\.net/.*",                           site:"J-Lyrics.net"},
    {re:"^https?://karent\\.jp/.*",                             site:"KARENT"},
    {re:"^https?://en\\.wikipedia\\.org/.*",                    site:"Wikipedia"},
    {re:"^https?://ja\\.wikipedia\\.org/.*",                    site:"Wikipedia (Japanese)"},
    {re:"^https?://twitter\\.com/.*",                           site:"Twitter"},
    {re:"^https?://utaten\\.com/.*",                            site:"UtaTen"},
    {re:"^https?://www\\.kkbox\\.com/.*",                       site:"KKBOX"},
    {re:"^https?://www\\.lyrical-nonsense\\.com/.*",            site:"Lyrical Nonsense"},
    {re:"^https?://www\\.kget\\.jp/.*",                         site:"KashiGET"},
    {re:"^https?://www\\.dropbox\\.com/.*",                     site:"Dropbox"},
    {re:"^https?://drive\\.google\\.com/.*",                    site:"Google Drive"},
    {re:"^https?://docs\\.google\\.com/.*",                     site:"Google Docs"},
    {re:"^https?://[^.]+\\.deviantart\\.com/.*",                site:"DeviantArt"},
    {re:"^https?://fav\\.me/.*",                                site:"DeviantArt"},
    {re:"^https?://lenslyrics\\.ml/.*",                         site:"Len's Lyrics"},
    {re:"^https?://pan\\.baidu\\.com/\\.*",                     site:"Baidu"},
    {re:"^https?://5sing\\.kugou\\.com/.*",                     site:"5Sing"},
    ]);

const languages =
  [
  {name:"English"},  
  {name:"Japanese", transliteration:"Romaji"},
  {name:"Mandarin", transliteration:"Pinyin"},
  {name:"Korean", transliteration:"Romaja"},
  {name:"Spanish"},
  {name:"Acehnese"},
  {name:"Catalan"},
  {name:"Cantonese", transliteration:"Jyutping"},
  {name:"Dutch"},
  {name:"Esperanto"},
  {name:"Filipino"},
  {name:"Finnish"},
  {name:"French"},
  {name:"German"},
  {name:"Greek", transliteration:"Romanization"},
  {name:"Indonesian"},
  {name:"Irish"},
  {name:"Italian"},
  {name:"Latin"},
  {name:"Malay"},
  {name:"Polish"},
  {name:"Portuguese"},
  {name:"Romanian"},
  {name:"Russian", transliteration:"Romanization"},
  {name:"Sundanese"},
  {name:"Swedish"},
  {name:"Thai", transliteration:"Romanization"},
  {name:"Turkish"},
  {name:"Vietnamese"},
  {name:"Welsh"},
  ];

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

const months = 
    ["January", "February", "March", 
    "April", "May", "June", 
    "July", "August", "September", 
    "October", "November", "December"];

const listofsynthengines = 
    [
    "VOCALOID", "UTAU", "CeVIO", "Synthesizer V", 
    "A.I.Voice", "ACE Virtual Singer", "AISingers", "Alter/Ego", "AquesTone/AquesTalk", 
    "Chipspeech", "CoeFont", "DeepVocal", "EmVoice", "MUTA", "NEUTRINO", "NIAONiao", 
    "NNSVS", "Piapro Studio", "Renoid", "Sharpkey", "Sinsy", "VOCALINA", "VOICEROID", 
    "Voidol", "VOICEVOX", "VoiSona", "X Studio Singer"
    ];

/*
 * Obtain contents of a text field as input by the user. Trimmed.
 */
function read_text(fieldname) {
    return document.getElementById(fieldname).value.trim();
}
  
/*
* Obtain contents of a textbox field as input by the user
* split into an array of lines. Trimmed. Empty lines removed.
*/
function read_textbox(fieldname) {
    return document.getElementById(fieldname).value.split("\n").map(x => x.trim()).filter(x => x);
}
  
/*
* Return whether or not a string is a valid CSS colour.
*/
function validate_colour(colour) {
    return colour == "" || colour.match("^#[0-9a-f]{6}$") || Object.keys(colournames).includes(colour);
}

/*
* Identify a website from its URL.
* Return site name, or "(unidentified website)" if not recognized.
*/
function identify_website(linkurl, listLinks = listRecognizedLinks) {
    let website = "";
    linkurl = detagHref(linkurl);
    listLinks.forEach( link => {
        if (linkurl.match(link.re)) {
            website = link.site;
        };
    });
    return website;
}

/*
 * Return a license string if the given translator is recognized as
 * having specific license conditions. Otherwise return an empty string.
 */
function get_translator_license(translator) {
    for (let i = 0; i < translatorlicenses.length; i++) {
        if (translatorlicenses[i].id.indexOf(translator) >= 0) {
            return "{{TranslatorLicense|" + translatorlicenses[i].id[0] +
            "|" + translatorlicenses[i].license + "}}\n";
        };
    }
    return "";
}

/*
 * Remove <a href> tag and get displayed URL/text
 */
function detagHref(strHref) {
    let linkurl = strHref;
    let tryRegex = strHref.match(/(?<=\>).*(?=\<\/a\>)/gm);
    if (Array.isArray(tryRegex) && tryRegex.length) {linkurl = tryRegex[0];};
    return linkurl;
}

/*
 * Add listing
 */
function addItemToListString(item, liststr, delim) {
    if (liststr == "") {liststr = item;}
    else if (item !== "") {liststr += delim + item;}
    return liststr;
}

function detonePinyin(romLyrics, bShowUmlaut = false) {
    romLyrics = romLyrics.trim();
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
    if (bShowUmlaut) {
        romLyrics = romLyrics.replace(/[ǖǘǚǜ]/gm, "ü");
        romLyrics = romLyrics.replace(/[ǕǗǙǛ]/gm, "Ü");
    }
    else {
        romLyrics = romLyrics.replace(/[ǖǘǚǜ]/gm, "v");
        romLyrics = romLyrics.replace(/[ǕǗǙǛ]/gm, "V");
    }
    return romLyrics;
}