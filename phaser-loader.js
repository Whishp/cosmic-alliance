// Phaser loader — ensures window.Phaser is set in all browsers
// Uses XHR + global eval which works around UMD/strict mode issues
(function loadPhaser() {
    if (typeof Phaser !== 'undefined') return; // already loaded
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'phaser.min.js', false); // synchronous
    xhr.onload = function() {
        if (xhr.status === 200 || xhr.status === 0) {
            try {
                (0, eval)(xhr.responseText);
                if (typeof Phaser === 'undefined') {
                    console.error('Phaser still undefined after eval');
                }
            } catch(e) {
                console.error('Phaser eval error:', e);
            }
        } else {
            console.error('Failed to load Phaser:', xhr.status);
        }
    };
    xhr.onerror = function() {
        console.error('Phaser XHR error');
    };
    xhr.send();
})();
