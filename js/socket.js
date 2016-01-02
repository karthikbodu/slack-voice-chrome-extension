var _socket;
var userID;
var userName;
var prefs;
var conn;
var retry_timer;
var heartbeat_timer;
var ping_counter = 1;
var defibrillate_timer;

function connectSocket(url) {
    _socket = new WebSocket(url);

    _socket.onopen = function (event) {
        clearTimeout(retry_timer);
        heartbeat_start();
        $("#apikey").hide();
        $("#message-conf").hide();
        $("#message-voice").hide();
        $("#con-status").show();
        $("#con-status").html('<p>Connected</p></p><img src="img/circle_green.png"/>');
        $("#auth-connect").hide();
        $("#auth-disconnect").show();
        conn = true;
    };
    _socket.onmessage = function (event) {
        var message = JSON.parse(event.data);
        var matched = true;
        var patt = '';
        heartbeat_beat();
        var messageText = message.text;
        var msgPref = $('input[name=message-type]:checked').val();
        if (msgPref == "mentions" && messageText != '') {
            matched = false;
            var prefString = prefs.split(",");
            if (messageText != undefined && userName != undefined) {
                messageText = messageText.replace(/<@.*>/, userName);
                prefString.push('@' + userName);
            }
            var pstrlen = prefString.length;
            for (i = 0; i < pstrlen; i++) {
                patt = new RegExp(prefString[i], "g");
                matched = patt.test(messageText);
                if (matched) {
                    break;
                }
            }
        }

        // Translate the message to voice
        if (message.type == 'message' && userID != message.user && matched == true) {
            readMessage(message.user, messageText);
        }
        else if (message.type == 'pong') {
            heartbeat_cancel_defibrillate();
        }
    };

    _socket.onerror = function (event) {
        chrome.alarms.create("reconnectSocket", {periodInMinutes: 0.5});
        heartbeat_stop();
    };

    _socket.onclose = function (event) {
        if (conn) {
            chrome.alarms.create("reconnectSocket", {periodInMinutes: 0.5});
            heartbeat_stop();
        }
    };
}

function disconnectSocket() {
    _socket.close();
    chrome.storage.local.set({'auth': ''});
    conn = false;
}

function reconnectSocket() {
    retry_timer = chrome.alarms.create("reconnectSocket", {periodInMinutes: 1});
    $.ajax({
        url: "https://slack.com/api/rtm.start",
        data: {
            token: auth.token
        },
        success: function (data, status, jqxhr) {
            if (data.ok) {
                userName = data.self.name;
                userID = data.self.id;
                prefs = data.self.prefs.highlight_words;
                connectSocket(data.url);
            }
            else {
                $("#api-error").html('<p style="color:red">Invalid slack api token.</p>');
            }
        }
    });
}

function heartbeat_start() {
    heartbeat_timer = chrome.alarms.create("heartbeat_check", {periodInMinutes: 1});
}

function heartbeat_beat() {
    clearTimeout(heartbeat_timer);
    heartbeat_timer = chrome.alarms.create("heartbeat_check", {periodInMinutes: 1});
}

function heartbeat_check() {
    defibrillate_timer = chrome.alarms.create("heartbeat_defibrillate", {periodInMinutes: 0.5});
    _socket.send(JSON.stringify({id: ping_counter++, type: "ping"}));
}

function heartbeat_defibrillate() {
    chrome.alarms.create("reconnectSocket", {periodInMinutes: 1});
}

function heartbeat_cancel_defibrillate() {
    clearTimeout(defibrillate_timer);
}

function heartbeat_stop() {
    cleartTimeout(heartbeat_timer);
}

function readMessage(uid, messageText) {
    $.ajax({
        url: "https://slack.com/api/users.list",
        data: {
            token: auth.token
        },
        success: function (data, status, jqxhr) {
            if (data.ok) {
                var memCount = data.members.length;
                for (var i = 0; i < memCount; i++) {
                    if (data.members[i].id == uid && data.members[i].real_name != undefined) {
                        var profileName = data.members[i].real_name;
                        if (!profileName) {
                            profileName = 'user';
                        }
                        messageText = profileName + ' says ' + messageText;
                        var messageVoice = $('input[name=message-voice]:checked').val();
                        chrome.tts.speak(messageText, {
                            'rate': 0.8,
                            'gender': messageVoice,
                            'pitch': 1,
                            'volume': 1,
                            'enqueue': true
                        });
                    }
                }
            }
        }
    });
}