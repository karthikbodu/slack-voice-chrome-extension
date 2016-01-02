var auth;
$(document).ready(function() {
    $("#con-status").hide();
    $("#auth-disconnect").hide();
    /* Define Connect button click handler. */
    $("#auth-connect").click(function() {
        var authToken = $("#auth-token").val();
        if(authToken == '') {
            $("#api-error").html('<p style="color:red">Enter the slack api token.</p>');
        }
        else {
            $("#api-error").html('');
            auth = {};
            auth.token = authToken;
            chrome.storage.local.set({'auth': JSON.stringify(auth)});
            reconnectSocket();
        }
    });

    /* Define Disconnect button click handler. */
    $("#auth-disconnect").click(function() {
        $("#auth-disconnect").hide();
        $("#message").html("");
        $("#auth-token").val("");
        $("#apikey").show();
        $("#message-conf").show();
        $("#message-voice").show();
        $("#con-status").html("");
        $("#auth-connect").show();
        disconnectSocket();
    });
});
