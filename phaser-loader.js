// Phaser loader — ensures window.Phaser is set in all browsers
// Uses async XHR + global eval to work around UMD wrapper issues
(function loadPhaser() {
    if (typeof Phaser !== 'undefined') {
        if (window._phaserReady) window._phaserReady();
        return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'phaser.min.js', true); // async
    xhr.onload = function() {
        if (xhr.status === 200 || xhr.status === 0) {
            try {
                (0, eval)(xhr.responseText);
            } catch(e) {
                console.error('Phaser eval error:', e);
            }
        }
        var s = document.createElement('script');
        s.src = 'game.js';
        document.body.appendChild(s);
    };
    xhr.onerror = function() {
        console.error('Failed to load Phaser via XHR');
        var s = document.createElement('script');
        s.src = 'game.js';
        document.body.appendChild(s);
    };
    xhr.send();
})();