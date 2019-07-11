//Copyright 2019, William Garrison

var client_id = "va97w97mn1qzq0nlrjavlifr92lstz"; //Twitch-API Client ID

var game_ids = localStorage.game_ids ? JSON.parse(localStorage.game_ids) : {};


chrome.alarms.create("myAlarm", { delayInMinutes: 5, periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener(function () {

    getFollows(localStorage.user_id);

});


if (localStorage.configured != "true") {

    chrome.browserAction.setBadgeText({ text: "CLICK" });
    chrome.browserAction.setBadgeBackgroundColor({ color: "#6642A1" })

}


function getFollows(id) {

    if (localStorage.configured) {

        $.ajax({

            type: 'GET',
            url: 'https://api.twitch.tv/helix/users/follows?first=100&from_id=' + id,
            dataType: 'json',
            headers: { 'Client-ID': client_id },

            success: function (data) {

                var add = "";

                $.each(data.data, function (index, value) {

                    add += "&user_login=" + value.to_name;

                });

                getStreams(add);

            }
        });
    }
}


function getStreams(addon) {

    $.ajax({

        type: 'GET',
        url: 'https://api.twitch.tv/helix/streams?first=100' + addon,
        dataType: 'json',
        headers: { 'Client-ID': client_id },

        success: function (data) {

            $.each(data.data, function(key, value){ //Prep stream info to reduce load on popup.js.

                value.up_time = uptime(value.started_at);
                value.thumbnail_url = value.thumbnail_url.replace("{width}x{height}", "240x90");
                value.stream_url = "https://www.twitch.tv/" + encodeURI(value.user_name);

            });

            localStorage.streams = JSON.stringify(data.data);
            chrome.browserAction.setBadgeText({ text: data.data.length + "" });
            chrome.browserAction.setBadgeBackgroundColor(localStorage.theme.includes("mono") ? { color: '#636363'} : { color: '#7248b4'});
            translateGames(data.data);

        }
    });
}


function translateGames(streams) {

    var add = "";
    $.each(streams, function (index, value) {
        if (!(value.game_id in game_ids)) {
            add += "&id=" + value.game_id;

        }
    });

    if (add.length > 0) {

        $.ajax({

            type: 'GET',
            url: 'https://api.twitch.tv/helix/games?first=100' + add,
            dataType: 'json',
            headers: { 'Client-ID': client_id },

            success: function (data) {

                $.each(data.data, function (index, value) {
                    game_ids[value.id] = value.name;

                });

                // console.log(data.data);
                // console.log(game_ids);
                localStorage.game_ids = JSON.stringify(game_ids);

            }
        });
    }
}

function uptime(start_date) {

    stream_date = new Date(start_date);
    current_date = new Date();

    Dif = (current_date - stream_date);

    H = Math.floor(Dif / 3600000);
    M = Math.floor((Dif % 3600000) / 60000);

    return ((H > 0) ? (H + "h ") : ("")) + ((M > 0) ? (M + "m") : (""));

};

getFollows(localStorage.user_id);
