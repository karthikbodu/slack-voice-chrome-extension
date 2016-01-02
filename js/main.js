/**
 * Created by karthik on 29-12-2015.
 */

chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create('index.html', {
        'outerBounds': {
            'width': 600,
            'height': 600
        }
    });
});