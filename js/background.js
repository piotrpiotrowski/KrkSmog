chrome.runtime.onInstalled.addListener(function () {
    chrome.alarms.create("refresh", { periodInMinutes: 1});
    storeStreetsData(storePollutionsData);
});

chrome.alarms.onAlarm.addListener(function () {
    storePollutionsData();
});

chrome.storage.onChanged.addListener(function (changes) {
    var currentStationId = changes["currentStationId"];
    if (currentStationId && currentStationId.oldValue !== currentStationId.newValue) {
        storePollutionsData();
    }
});

function storeStreetsData(callbackAfterStore) {
    $.getJSON("http://smogalert.pl/api/stations", function (response) {
        var currentStationId = getFirstStationAsDefault(response);
        chrome.storage.local.set({stations: response, currentStationId: currentStationId}, function () {
            callbackAfterStore();
        });
    });
}

var getFirstStationAsDefault = function (response) {
    return response[0]._id;
};


var storePollutionsData = function () {
    var currentStationId = null;
    var oldPollutionsData = null;
    var oldStationId = null;
    chrome.storage.local.get(function (storageData) {
        currentStationId = storageData["currentStationId"];
        oldPollutionsData = storageData["pollutants"];
        oldStationId = storageData["station_id"];
        var currentStationUrl = "http://smogalert.pl/api/stats/" + currentStationId;
        $.getJSON(currentStationUrl, function (response) {
            refreshBadge(response["pollutants"]);
            chrome.storage.local.set(response, function () {
                if (currentStationId === oldStationId) {
                    showNotificationForIncreasedValues(response["pollutants"], oldPollutionsData);
                }
            });
        });
    });
};

var refreshBadge = function (pollutants) {
    var badgeConfig = createBadgeConfig(pollutants);
    chrome.browserAction.setBadgeText({text: badgeConfig.text});
    chrome.browserAction.setBadgeBackgroundColor({color: badgeConfig.color});
};

var createBadgeConfig = function (statistics) {
    for (var i = 0; i < statistics.length; i++) {
        var stat = statistics[i];
        if (stat.normPercent > 100) {
            return buildBadgeConfig("!", "#990000");
        }
    }
    return buildBadgeConfig("OK", "#009900");
};

var buildBadgeConfig = function (text, color) {
    return {
        text: text,
        color: color
    };
};

var showNotificationForIncreasedValues = function (oldStatistics, newStatistics) {
    var messages = createMessages(oldStatistics, newStatistics);
    if (messages.length > 0) {
        var options = createNotificationOptions(messages);
        chrome.notifications.create("KrkSmogNotification", options, function () {
        });
    }
};

var createMessages = function (oldStatistics, newStatistics) {
    var messages = [];
    for (var i = 0; i < oldStatistics.length; i++) {
        if (newStatistics[i].normPercent > oldStatistics[i].normPercent) {
            messages.push(createMessage("increased", newStatistics[i], oldStatistics[i]));
        } else if (newStatistics[i].normPercent < oldStatistics[i].normPercent) {
            messages.push(createMessage("decreased", newStatistics[i], oldStatistics[i]));
        }
    }
    return messages;
};

var createNotificationOptions = function (messages) {
    return {
        title: "Warning",
        message: "Warning pollutions increased",
        iconUrl: "/img/icon_38.png",
        type: "list",
        items: messages
    };
};

var createMessage = function (text, newStatistic, oldStatistic) {
    return {
        title: newStatistic.pollutant,
        message: text + " from " + oldStatistic.normPercent + " to " + newStatistic.normPercent
    };
};

