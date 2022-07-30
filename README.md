# VLW-Song-Page-Generator
Song page generator for Vocaloid Lyrics Wiki (https://vocaloidlyrics.fandom.com/)

1) Automatically fetch song information from VocaDB:
<br>Calls from the public VocaDB Rest API (https://vocadb.net/swagger/index.html) to automatically fetch various information (e.g. song title, upload date, official and unofficial links, PV thumbnails). This information is then loaded to the song page generator.
2) Ease of input:
<br>Use easy-to-use spreadsheet tables to input the song lyrics.
3) Generate the song page, in accordance to the Vocaloid Lyrics Wiki Guideline.
<br>Follows a set template and automates everything for the convenience of the end-user. 

Referenced libraries:
 - JSpreadsheet: https://github.com/jspreadsheet/ce
