// Simple click monitor
(function() {
    const clicks = [];
    
    document.addEventListener('click', function(event) {
        const target = event.target;
        const click = {
            timestamp: new Date().toISOString(),
            element: {
                tag: target.tagName,
                id: target.id,
                classes: Array.from(target.classList),
                text: target.textContent?.slice(0, 100),
                href: target instanceof HTMLAnchorElement ? target.href : undefined
            },
            position: {
                x: event.clientX,
                y: event.clientY
            }
        };
        
        clicks.push(click);
        console.log('Click detected:', JSON.stringify(click, null, 2));
    }, true);
    
    // Expose clicks array globally
    window.__clickMonitor = {
        getClicks: () => clicks,
        clearClicks: () => clicks.length = 0
    };
    
    console.log('Click monitor installed');
})();
