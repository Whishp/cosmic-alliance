// Phaser loader — ensures window.Phaser is set in ALL browsers
// Uses async script loading (replaces deprecated synchronous XHR)
(function loadPhaser() {
    if (typeof Phaser !== 'undefined') {
        // Phaser already loaded, proceed directly
        var s = document.createElement('script');
        s.src = 'game.js';
        document.head.appendChild(s);
        return;
    }

    var phaserScript = document.createElement('script');
    phaserScript.src = 'phaser.min.js';
    phaserScript.onload = function() {
        if (typeof Phaser !== 'undefined') {
            var gs = document.createElement('script');
            gs.src = 'game.js';
            document.head.appendChild(gs);
        } else {
            console.error('Phaser failed to load: Phaser object not defined after script loaded');
        }
    };
    phaserScript.onerror = function() {
        console.error('Phaser failed to load: network error fetching phaser.min.js');
    };
    document.head.appendChild(phaserScript);
})();