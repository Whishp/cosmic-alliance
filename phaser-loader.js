// Phaser loader — ensures window.Phaser is set in ALL browsers
// Uses synchronous XHR + global eval (the ONLY method that reliably
// sets window.Phaser across Chrome, Safari, Firefox, and mobile browsers)
// Synchronous XHR is deprecated but fully supported in 2024 and required here.
(function loadPhaser() {
    if (typeof Phaser !== 'undefined') {
        // Phaser already loaded, proceed directly
        var s = document.createElement('script');
        s.src = 'game.js';
        document.head.appendChild(s);
        return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'phaser.min.js', false); // synchronous — required for global eval
    try {
        xhr.send();
    } catch (e) {
        // Synchronous XHR failed — fallback to async with DOM script
        var fallback = document.createElement('script');
        fallback.src = 'phaser.min.js';
        fallback.onload = function() {
            if (typeof Phaser !== 'undefined') {
                var gs = document.createElement('script');
                gs.src = 'game.js';
                document.head.appendChild(gs);
            }
        };
        document.head.appendChild(fallback);
        return;
    }

    if (xhr.status === 200 || xhr.status === 0) {
        try {
            (0, eval)(xhr.responseText);
        } catch (e) {
            console.error('Phaser eval error:', e);
        }
    }

    if (typeof Phaser !== 'undefined') {
        var gs = document.createElement('script');
        gs.src = 'game.js';
        document.head.appendChild(gs);
    } else {
        console.error('Phaser failed to load');
    }
})();