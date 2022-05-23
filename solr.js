// Requires cors.js to be loaded first

"use strict";

var SOLR_CONFIG = {
    "server": "http://localhost:8983/solr/homebanking_collection/select?",  // Solr server
    "filter": "*:*",  // Filter results for an organization or user
    "limit": 10,  // Max number of results to retrieve per page
    "resultsElementId": "searchResults",  // Element to contain results
    "urlElementId": "searchUrl",  // Element to display search URL
    "countElementId": "resultCount",  // Element showing number of results
    "pagesElementId": "pagination",  // Element to display result page links
    "showPages": 5  // MUST BE ODD NUMBER! Max number of page links to show
};


// Get URL arguments
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


// Parse Solr search results into HTML
function parseSolrResults(resultJson) {
    var docs = resultJson["response"]["docs"];
    var html = [];
    var htmlContent = '';
    if(docs.length>0){
        htmlContent = '<table id="solrtable">';
        htmlContent += '<thead><tr>'
        htmlContent += '<th>ID</th>';
        htmlContent += '<th>Title</th>';
        htmlContent += '<th>Type</th>';
        htmlContent += '<th>Key Type</th>';
        htmlContent += '<th>Key Value</th>';
        htmlContent += '</tr></thead>'        
    }
    for (var i = 0; i < docs.length; i++) {
        var doc = docs[i];  
        var id = doc["id"]+"";
        var title = doc["title"]+"";
        var type = doc["type"]+"";
        var keyType = doc["keyType"]+"";
        var keyValue = doc["keyValue"]+"";       
        console.log(id,title,type,keyType,keyValue);      
        htmlContent += '<tr>'
        htmlContent += '<td>'+id+'</td>';
        htmlContent += '<td>'+title +'</td>';
        htmlContent += '<td>'+type+'</td>';
        htmlContent += '<td>'+keyType+'</td>';
        htmlContent += '<td>'+keyValue+'</td>';
        htmlContent += '</tr>';             
    }
    if(docs.length>0){
        htmlContent += '</table>';
        html.push(htmlContent);
    }
    if (html.length) {
        console.log('htmlContent',htmlContent);
        return html;
    }
    else {
        return "<p>Your search returned no results.</p>";
    }
}


function show_loading(isLoading) {
    var x = document.getElementById("loading-div");
    if (isLoading) {
        document.body.style.cursor = "wait";
        x.style.display = "block";
    }
    else {
        document.body.style.cursor = "default";
        x.style.display = "none";
    }
}


// Function to call if CORS request is successful
function successCallback(headers, response) {
    show_loading(false);

    // Write results to page
    document.getElementById("searchResults").innerHTML = JSON.stringify(response, null, 4);
    var data = JSON.parse(response);
    var resultHtml = parseSolrResults(data);
    var elementId = SOLR_CONFIG["resultsElementId"];
    document.getElementById(elementId).innerHTML = resultHtml;

    // Add links to additional search result pages if necessary
    var currentStart = getParameterByName("start");
    if (!currentStart) {
        currentStart = 0;
    }
    else {
        currentStart = parseInt(currentStart);
    }
    var count = parseInt(data["response"]["numFound"]);
    var limit = parseInt(SOLR_CONFIG["limit"]);
    var showPages = parseInt(SOLR_CONFIG["showPages"]);
    var pageElementId = SOLR_CONFIG["pagesElementId"];
    showPageLinks(count, limit, showPages, currentStart, pageElementId);
    var query = getParameterByName("q");
    if (query) query = query.trim();
    var bank = getParameterByName("bank");
    var type = getParameterByName("type");
    if (bank && bank !== "ALL") {
        query += '&fq=keyValue:"' + bank + '"';
    }
    if (type && type !== "ALL") {
        query += '&fq=type:"' + type + '"';
    }
    showResultCount(query, count, limit, currentStart, SOLR_CONFIG["countElementId"]);
}


// Function to call if CORS request fails
function errorCallback() {
    show_loading(false);
    alert("There was an error making the request.");
}


// Writes CORS request URL to the page so user can see it
function showUrl(url) {
    url = encodeURI(url);
    var txt = '<a href="' + url + '" target="_blank">' + url + '</a>';
    var element = document.getElementById(SOLR_CONFIG["urlElementId"]);
    element.innerHTML = txt;
}

function successInsertCallback(headers, response){
    show_loading(false);
    alert(JSON.stringify(response));
}

function insertData(){
    var randomNumber = Date.now();
    var url= 'http://localhost:8983/solr/homebanking_collection/update?_='+randomNumber+'&commitWithin=1000&overwrite=true&wt=json';
    var param = [{
        "keyValue":[
            "HOMEBANKING,BSE"
        ],
        "id":"1798552101",
        "title":"Donazione",
        "type":"altririsultati",
        "hashCheck":"3A934814902E1D927F3627BB6ED9BD77FBE913795DBCFE4F63038DC63D9CD173",
        "code":"DONAZIONI",
        "keyType":"appcodicebancaibcode"
    },
    {
        "keyValue":[
            "HOMEBANKING,BSE"
        ],
        "id":"1798552091",
        "title":"Collega conti di altre banche",
        "type":"altririsultati",
        "hashCheck":"8CE2AE521F0A3E833AD8394F2385B4D4F17A19234740DF333CBD83F960179500",
        "code":"AGGREGATOR",
        "keyType":"appcodicebancaibcode"
    }];
    makeCorsPostRequest(url,JSON.stringify(param), successInsertCallback, errorCallback);
}


// Passes search URL and callbacks to CORS function
function searchSolr(query, bank, type, start) {
    var base = SOLR_CONFIG["server"];
    var fields = ["type",
                  "keyType",
                  "keyValue",
                  "title",
                  "id"].toString();
    var params = "fl=" + fields + "&indent=true";
    var limit = "&rows=" + SOLR_CONFIG["limit"];
    if (start === undefined) start = "0";
    start = "&start=" + start;
    if(query){
        query = "&q="  + query;
    }else{
        query = "&q=" + SOLR_CONFIG["filter"] + " " + query;
    }
    
    if (bank && bank !== "ALL") {
        params += '&fq=keyValue:"' + bank + '"';
    }
    if (type && type !== "ALL") {
        params += '&fq=type:"' + type + '"';
    }
    var url = base + params + limit + start + query;
    showUrl(url);
    show_loading(true);
    makeCorsRequest(url, successCallback, errorCallback);
}


// When the window loads, read query parameters and perform search
window.onload = function(e) {    
    var query = getParameterByName("q");
    if (query) query = query.trim();
    var start = getParameterByName("start");
    var bank = getParameterByName("bank");
    var type = getParameterByName("type");
    document.forms.dataSearchForm.q.value = query;
    if (!(query && query.trim())) {
        query = "";  // default for empty query
    }

    var banks = document.getElementById("bank");
    for (var i=0; i < banks.length; i++) {
        if (bank == banks[i].value) {
            banks[i].selected = true;
            break;
        }
    }

    var types = document.getElementById("type");
    for (var i=0; i < types.length; i++) {
        if (type == types[i].value) {
            types[i].selected = true;
            break;
        }
    }
    
    if (!start) {
        start = 0;
    }
    searchSolr(query, bank, type, start);
};