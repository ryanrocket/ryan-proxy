// session_manager.js

function getCookie(name) {const value = `; ${document.cookie}`;const parts = value.split(`; ${name}=`);if (parts.length === 2) return parts.pop().split(';').shift();}
~(function() {
    var socket = io(window.location.origin + ':7012');
    console.log('[proxy] IO stream pipe fixated');
    setTimeout(function() {
        $('.conState').text("GOOD");
        $('.conState').removeAttr('id');
        $('.conState').attr('id', 'good')
        $('.conState').removeClass('inact');
        $('.conState').addClass('good');
    }, 1000)    
    
    socket.emit('newClient', getCookie('3s7h3g6s'))
    socket.on('data'+atob(getCookie('3s7h3g6s').replace('%3D%3D', "")), (data) => {
        console['log']('[proxy] received webpage');
        var myFrame = $("#browser").contents().find('body');
        myFrame.html(data);
    })

    socket.on('broadcast', (data) => {
        window.alert("[ADMIN BROADCAST]  "+data);
    })
    if(window.location.pathname === "/proxy") {
        setInterval(function() {
            $('#urlinput').attr('value', document.getElementById("browser").contentDocument.querySelector("link[rel='canonical']").getAttribute("href")); 

        }, 1000);
    }
    
}())
