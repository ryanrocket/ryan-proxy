/*
 *
 * MASTER.js - Server File 
 * Nohup & Disown
 * by Ryan Wans for Ryan-Proxy at proxy.ryanwans.com
 * 
 */

const { stringify } = require('querystring');

var express = require('express')
  , app = express()
  , cP = require('cookie-parser')
  , bP = require('body-parser')
  , atob = require('atob')
  , sqs = require('set-query-string')
  , btoa = require('btoa')
  , cookies = ['adminAcnt231', 'rywans231']
  , chatCok = ['adminAcnt231', 'rywans231', 'jwoods1', 'ryanOact', 'RYANWANS', 'JACKWOODS']
  , rooms = ['#school', '#general', '#random', '#private']
  , extensions = ['home']
  , liveUsers = 0
  , http = require('http')
  , ser1 = http.createServer()
  , ser2 = http.createServer()
  , httpProxy = require('http-proxy')
  , { createProxyMiddleware } = require('http-proxy-middleware')
  , request = require('request')
  , io = require('socket.io')(ser1)
  , sio = require('socket.io')(ser2)
  , streamPort = 7012
  , chatPort = 7000
  , chan = {'#general': [], '#school': [], '#random': [], '#private': []}; 

app.use( bP.json() );
app.use(cP());
app.use(bP.urlencoded({ 
    extended: true
}));

var proxy = httpProxy.createProxyServer();

ser1.listen(streamPort, () => console.log(`[proxy] proxy server listening on port: ${streamPort}`))
ser2.listen(chatPort, () => console.log(`[proxy] chat server listening on port: ${chatPort}`))

io.on('connection', (socket) => {
    console.log('[proxy] IO stream connected')
    socket.on('newClient', (evt) => {
        console.log("[proxy] new client -> "+atob(evt))
    })

    socket.on('disconnect', (evt) => {
        console.log('[proxy] IO stream pipe broken')
    })
})
sio.on('connection', (socket) => {
    console.log('[proxy] new chat IO stream');
    // chan['#general'].push()

    socket.on('meta#all', (msg) => {
        if(msg.intend === 'join') {
            chan[msg.chan].push(msg.user);
        } else if (msg.intend === 'leave') {
            chan[msg.chan] = chan[msg.chan].filter(e => e !== msg.user);
        } else if (msg.intend === 'typing') {
            sio.emit('user'+msg.chat, {cmd: 'typing', username: msg.username})
        }else if (msg.intend === 'notyping') {
            sio.emit('user'+msg.chat, {cmd: 'notyping', username: msg.username})
        }
        // console.log(msg);
        sio.emit('meta#all', chan);
        //console.log(chan);
    });

    socket.on('meta#bcast', (msg) => {
        sio.emit('meta#bcast', msg);
    });

    socket.on('user#general', (msg) => {
        // console.log("[proxy] new chat on #general");
        sio.emit('user#general', msg);
    });
    socket.on('user#random', (msg) => {
        // console.log("[proxy] new chat on #random");
        sio.emit('user#random', msg);
    });
    socket.on('user#school', (msg) => {
        // console.log("[proxy] new chat on #school");
        sio.emit('user#school', msg);
    });
    socket.on('user#private', (msg) => {
        // console.log("[proxy] new chat on #private");
        sio.emit('user#private', msg);
    });

    socket.on('disconnect', () => {
        console.log('[proxy] chat IO stream pipe broken');
    });
});



app.use('/', function(req, res, next) {
    liveUsers++;
    next();
});

/* * * * * * * * * * * * */
app.post('/proxy', function (req, res) {
    console.log('[proxy] targeting http://'+req.body.url+'');
    res.cookie('_target', req.body.url.split("/")[2]);
    res.cookie('_activeSession', true);
    request({
        'url':req.body.url,
        'method': "GET",
      },function (error, response, body) {
        console.log('[proxy] hit target')
        var a = body;
        var b = atob(req.cookies['3s7h3g6s']);
        setTimeout(function(){io.sockets.emit('data'+b, a);}, 1000);
        
      })
    
      res.sendFile('./assets/proxy.html', {root: __dirname});

});
/* * * * * * * * * * * * */

app.get('/', function(req, res) {
    if(req.cookies['_activeSession'] === 'true') {
        request({
            'url':'http://'+req.cookies['_target'],
            'method': "GET",
          },function (error, response, body) {
            console.log('[proxy] hit target')
            var a = body;
            var b = atob(req.cookies['3s7h3g6s']);
            res.send(a);
          })
    } else {
        if(req.cookies['_chatAuth'] === 'false') {
            res.send("you were kicked from this server");
        } else {
            res.sendFile('./assets/login.html', {root: __dirname});
        }
    }
});
app.get('/chat/authenticated', function(req, res) {
    if(req.cookies['_chatAuth'] === 'true' && chatCok.includes(req.cookies['_username'])) {
        res.sendFile('./assets/chat.html', {root: __dirname});
    } else {
        res.send("Unauthorized access - you were either kicked or have no credentials");
    }
});
app.post('/chat/callback/auth', function(req, res) {
    res.clearCookie('_auth');
    res.clearCookie('_target');
    res.clearCookie('_activeSession');
    if(req.body.username === "adminAcnt231" && req.body.chid === "#admin") {
        res.cookie('_username', req.body.username)
        res.cookie('_chatroomID', req.body.chid)
        res.cookie('_chatAuth', true);
        var clients = io.sockets.clients();
        res.header('users', toString(clients));
        res.sendFile('./assets/admin2.html', {root: __dirname});
    }
    else if(req.body.username === "rywans231" && req.body.chid === "#admin"){
        console.log('[proxy] an admin has logged in')
        res.cookie('_username', 'RYANWANS')
        res.cookie('_chatroomID', '#general')
        res.cookie('_chatPerm', 'admin');
        res.cookie('_chatAuth', true);
        res.cookie('_tempID', 'admin');
        chatCok.push(req.body.username);
        res.redirect('/chat/authenticated')
    }
    else if(req.body.username === "jwoods1" && req.body.chid === "#mod"){
        console.log('[proxy] a moderator has logged in')
        res.cookie('_username', 'JACKWOODS')
        res.cookie('_chatroomID', '#general')
        res.cookie('_chatPerm', 'mod');
        res.cookie('_chatAuth', true);
        res.cookie('_tempID', 'mod');
        chatCok.push(req.body.username);
        res.redirect('/chat/authenticated')
    }
    else if(req.body.chid === '#general' && req.body.username) {
        res.cookie('_username', req.body.username)
        res.cookie('_chatroomID', req.body.chid)
        res.cookie('_chatPerm', 'user');
        res.cookie('_chatAuth', true);
        res.cookie('_tempID', Date.now());
        chatCok.push(req.body.username);
        res.redirect('/chat/authenticated')
    } else {
        console.log('[proxy] invalid body -> ' + req.body)
        res.redirect('/?throw=login2')
    }
    
});
app.get('/external/proxy', function(req, res) {
    if(req.cookies['_auth'] === '1' && atob(req.cookies['3s7h3g6s']) === 'adminLogin231') {
        res.header('tokens', JSON.stringify(cookies));
        res.sendFile('./assets/admin.html', {root: __dirname});
    }
    else if(req.cookies['_auth'] === '1' && cookies.includes(atob(req.cookies['3s7h3g6s']))) {
        res.sendFile('./assets/home.html', {root: __dirname});
    } else {
        res.sendFile('./assets/invalidParm.html', {root: __dirname});
    }
})
app.post('/internal/callback/auth', function(req, res) {
    if(cookies.includes(req.body.token)) {
        console['log']("[proxy] login success token -> " + req.body.token)
        res.cookie('_auth', 1); res.cookie('3s7h3g6s', btoa(req.body.token))
        res.redirect('/external/proxy');
    } else {
        console['log']("[proxy] failed login token -> " + req.body.token)
        res.cookie('_auth', 0); res.cookie('3s7h3g6s', null)
        res.redirect('/?throw=login1'); 
    }
});
app.post('/internal/callback/admin/admittoken', function(req, res) {
    if(atob(req.cookies['3s7h3g6s']) === "adminLogin231") {
        console.log("[proxy] admitting token -> " + req.body.token)
        cookies.push(req.body.token);
        res.redirect('/external/proxy');
   
    }
});
app.get('/internal/socket.io.js', function(req, res) {
    res.sendFile("./node_modules/socket.io-client/dist/socket.io.js",{root: __dirname});
});
app.get('/internal/socket.io.js.map', function(req, res) {
    res.sendFile("./node_modules/socket.io-client/dist/socket.io.js.map",{root: __dirname});
});
app.get('/internal/session_manager.js', function(req, res) {
    res.sendFile("./assets/session_manager.js",{root: __dirname});
});
app.get('/internal/chat.js', function(req, res) {
    res.sendFile("./assets/chat.js",{root: __dirname});
});
app.post('/internal/callback/admin/revoketoken', function(req, res) {
    if(atob(req.cookies['3s7h3g6s']) === "adminLogin231") {
        console.log("[proxy] revoking token -> " + req.body.token)
        var a = cookies.indexOf(req.body.token);
        cookies.splice(a, 1);
        res.redirect('/external/proxy');
    }
});
app.post('/internal/callback/admin/restartServerNOWWWW', function(req, res) {
    if(atob(req.cookies['3s7h3g6s']) === "adminLogin231") {
        console.log("[proxy] killing server! called by -> " + atob(req.cookies['3s7h3g6s']))
        io.sockets.emit('broadcast', "[WARN] Server is shutting down!")
        process.abort();
    }
});
app.post('/internal/callback/admin/blockAllUsersNOWWWW', function(req, res) {
    if(atob(req.cookies['3s7h3g6s']) === "adminLogin231") {
        console.log("[proxy] banning users! called by -> " + atob(req.cookies['3s7h3g6s']))
        cookies = ["adminLogin231"];
        res.redirect('/external/proxy');
    }
});
app.post('/internal/callback/admin/broadcastmessage', function(req, res) {
    if(atob(req.cookies['3s7h3g6s']) === "adminLogin231") {
        console.log("[proxy] emitting message -> " + req.body.token)
        io.sockets.emit('broadcast', req.body.token)
        res.redirect('/external/proxy')
    }
});

app.get('/*', function(req, res) {

    console.log('[proxy] targeting extraneous resource http://'+req.cookies['_target']+req.originalUrl);
    var c = req.originalUrl.split('.')
    c = c[c.length-1];
    var extImg = ['jpeg','jfif','tiff','gif','bmp','png','heif','svg', 'jpg'];
    var extApp = ['js', 'pdf', 'xml', 'json', 'zip'];
    var extText = ['css', 'html', 'csv']
    console.log("[proxy] c-type "+c)
    if(extImg.includes(c)) {
        if(c === 'svg') {res.setHeader('content-type', 'image/'+c+'+xml');} else {res.setHeader('content-type', 'image/'+c);}
        console.log('[proxy] found image request')
        request({
            'url':"http://"+req.cookies['_target']+req.originalUrl,
            'method': "GET",
            'encoding': null,
            },function (error, response, body) {
                console.log('[proxy] hit target')
                var a = body;
                var b = atob(req.cookies['3s7h3g6s']);

                res.send(a);
            });
    } else {
        request({
            'url':"http://"+req.cookies['_target']+req.originalUrl,
            'method': "GET",
        },function (error, response, body) {
            console.log('[proxy] hit target')
            var a = body;
            if(extApp.includes(c)) {
                console.log('[proxy] found application request')
                res.setHeader('content-type', 'application/'+c);
            }
            if(extText.includes(c)) {
                console.log('[proxy] found text request')
                res.setHeader('content-type', 'text/'+c);
            }
            res.send(a);
        })
    }
});

console['log']('[proxy] web server listening on port 7090')
app.listen(7090, '0.0.0.0');