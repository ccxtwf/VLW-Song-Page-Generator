let datacontainer = [];
let table;

async function importFromVocaDB(b_reloadtable) {

    $('#loaderdimmer').addClass('active');
    $('#loader').addClass('active');

    let synthfamily = $("#synthfamilybox").dropdown("get value").trim();
    if (synthfamily == "") {
        window.alert("Please select at least one synth group.");
        return;
    }

    if (b_reloadtable) {datacontainer = [];};
    let urlquery = "https://vocadb.net/api/artists?artistTypes=" + synthfamily + "&allowBaseVoicebanks=true&maxResults=100&sort=AdditionDate&fields=Names,BaseVoicebank&lang=Japanese&start=" + datacontainer.length;

    console.log(urlquery);
    
    try {
        vocadbjson = await getJSonData(urlquery);
    } catch (error) {
        //await $('#loaderdimmer').removeClass('active');
        //await $('#loader').removeClass('active');
        window.alert("Unexpected error: Unable to fetch data from VocaDB Rest API" + "\n\n" + error);
        return;
    }

    let queriedartists = vocadbjson.items.map( function(item) {
        let vocadbid = item.id;
        let orgname = item.name;
        let miscnames = "";
        item.names.forEach(el => {
            miscnames += el.value == orgname ? "" : el.value + ", "; 
        });
        if (miscnames !== "") {miscnames = miscnames.substring(0, miscnames.length - 2)};
        let synthgroup = item.artistType;
        let creationdate = item.createDate ? new Date(item.createDate) : "";
        let releasedate = item.releaseDate ? new Date(item.releaseDate) : "";
        let vocadburl = "https://vocadb.net/Ar/" + vocadbid;

        return {
            vocadbid: vocadbid,
            orgname: orgname,
            miscnames: miscnames,
            synthgroup: synthgroup,
            creationdate: creationdate,
            releasedate: releasedate,
            vocadburl: vocadburl
        }
    })

    datacontainer.push(...queriedartists);

    //console.log(datacontainer);

    if (b_reloadtable) {

        let func_formathtmlwrap = function(cell, formatterParams, onRendered) {
            cell.getElement().style.whiteSpace = "pre-wrap";
            function emptyToSpace(value) {
                return value === null || typeof value === "undefined" || value === "" ? "&nbsp;" : value;
            }
            return emptyToSpace("<div>" + cell.getValue() + "</div>");
        }

        table = new Tabulator("#queriedresults-table", {

            data:datacontainer,
    
            layout:"fitColumns",
            //responsiveLayout:true,
    
            autoColumnsDefinitions:function(definitions){
                definitions.forEach((column) => {
                    column.headerFilter = true;
                });
                return definitions;
            },

            pagination:"local",
            paginationSize:100,
            paginationCounter:"rows",
    
            columns:[
                {title:"VocaDB ID", field:"vocadbid", hozAlign:"left", vertAlign:"middle", resizable:true, variableHeight:true, width:100,
                    mutator:function(value, data) {
                        return "<a href=\"https://vocadb.net/Ar/" + value + "\" target=\"_blank\" title=\"Go to VocaDB\">" + value + "</a>";
                    },
                    formatter:func_formathtmlwrap
                },
                {title:"Original name", field:"orgname", hozAlign:"left", vertAlign:"middle", resizable:true, variableHeight:true, formatter:"textarea"},
                {title:"Other names", field:"miscnames", hozAlign:"left", vertAlign:"middle", resizable:true, variableHeight:true, formatter:"textarea"},
                {title:"Part of group", field:"synthgroup", hozAlign:"left", vertAlign:"middle", resizable:true, variableHeight:true},
                {title:"Entry created", field:"creationdate_mut", hozAlign:"left", vertAlign:"middle", resizable:true, variableHeight:true, width:200,
                    mutator:function(value, data) {
                        return data.creationdate == "" ? "" : data.creationdate.toLocaleDateString('en-us', { year:"numeric", month:"short", day:"numeric"})
                    }
                },
                {title:"Release date", field:"releasedate_mut", hozAlign:"left", vertAlign:"middle", resizable:true, variableHeight:true, width:200,
                    mutator:function(value, data) {
                        return data.releasedate == "" ? "" : data.releasedate.toLocaleDateString('en-us', { year:"numeric", month:"short", day:"numeric"})
                    }
                }
            ],
        });
    }
    else {
        table.setData(datacontainer);
        table.setPage("last");
    }

    //Give alert to end user
    await $('#loaderdimmer').removeClass('active');
    await $('#loader').removeClass('active');
    //window.alert("Loaded successfully");

};

async function getJSonData(urlquery) {
    try {
        let res = await fetch(urlquery);
        return await res.json();
    } catch (error) {
        console.log(error);
        throw error;
    }
};