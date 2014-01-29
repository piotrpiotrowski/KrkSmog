var refresh = function () {
    chrome.storage.local.get(refreshPopup);
};

var refreshPopup = function (storageData) {
    var stations = storageData["stations"];
    var pollutants = storageData["pollutants"];
    var currentStationId = storageData["currentStationId"];
    refreshStations(stations, currentStationId);
    refreshPollutions(pollutants);
};

refresh();
chrome.storage.onChanged.addListener(function () {
    refresh();
});

var refreshStations = function (stations, stationId) {
    var stationsHtml = createStationsHtml(stations);
    $("#stations").html(stationsHtml)
        .val(stationId)
        .on("change", onChangeStreet);
};

var refreshPollutions = function (pollutants) {
    var pollutionsHtml = createStatisticsHtml(pollutants);
    $("#pollutions").html(pollutionsHtml);
};

var onChangeStreet = function () {
    var currentStationId = $("#stations").val();
    chrome.storage.local.set({currentStationId: currentStationId}, function () {
    });
};

var createStatisticsHtml = function (pollutants) {
    var items = [];
    for (var i = 0; i < pollutants.length; i++) {
        items.push(createTr(pollutants[i]));
    }
    return items.join("");
};

var createStationsHtml = function (stations) {
    var items = [];
    for (var i = 0; i < stations.length; i++) {
        items.push(createOption(stations[i]));
    }
    return items.join("");
};

var createTr = function (stat) {
    return "<tr><td>" + stat.pollutant + "</td><td>" + stat.normPercent + "%</td></tr>";
};

var createOption = function (stations) {
    return "<option value=\"" + stations._id + "\">" + stations.address + "</option>";
};
