// chat.js

function getCookie(name) {const value = `; ${document.cookie}`;const parts = value.split(`; ${name}=`);if (parts.length === 2) return parts.pop().split(';').shift();}
var socket;
socket = io(window.location.protocol+"//"+window.location.hostname + ':7000');
~(function(){
    console.log('[proxy] IO stream pipe fixated');
    console.log('[proxy] assessing target ' + window.location.protocol+"//"+window.location.hostname );
    $('input[type="text"]').focus()
    $(window).bind('beforeunload', function(){
        return '>>>>>Before You Go<<<<<<<< \n Your custom message go here';
    });
}());
var chat = {
    username: null,
    uuid: null,
    room: null,
    level: null,
    chanMaster: null,
    initVariable: function(room) {
        this.room = room;
        this.level = getCookie('_chatPerm');
        if(getCookie('_chatPerm') === 'admin' || getCookie('_chatPerm') === 'mod') {
            this.uuid = getCookie('_tempID')
            $('#mes').addClass('adMes');
        } else {
            this.uuid = getCookie('_tempID')
            this.uuid = this.uuid.substr(this.uuid.length - 4);
        }
        this.username = getCookie('_username').replace('%20', '_')+'#'+this.uuid;
        console.log('[proxy] identified room -> '+this.room)
        console.log('[proxy] initialized environment');
        socket.emit('meta#all', {intend: 'join', chan: chat.room, user: chat.username});
        socket.emit('user'+this.room, {user: 'BROADCAST', level: 'server', message: this.username+" joined the channel.", room: this.room});
        $('#hrUsern').text(chat.username);
        $('#hrUserl').text(chat.level);
        $('.ist').css('visibility', 'hidden')
        // event listeners
        return this;
    },
    emitChatMessage: function(e) {
        var loc = $('#mes').val();
        if(chat.level === 'admin' || chat.level === 'mod') {
            if(loc.substring(0,2) === '//') {
                var cmd = loc.split(" ");
                if(cmd[0] === '//bcast') {
                    var str = "",i=0;
                        for(i=1;i<cmd.length;i++) {
                            str=str+cmd[i]+" ";
                        }
                        socket.emit('user'+chat.room, {user: 'BROADCAST', level: 'server', message: str, room: chat.room});
                }
                if(cmd[0] === '//chat') {
                    if(cmd[1] === 'off') {
                        socket.emit('user'+chat.room, {user: 'BROADCAST', level: 'server', message: 'The chat has been disabled.', room: chat.room});
                        socket.emit('user'+this.room, {user: this.username, level: this.level, message: loc, room: this.room});
                    } if (cmd[1] === 'on') {
                        socket.emit('user'+chat.room, {user: 'BROADCAST', level: 'server', message: 'The chat has been enabled.', room: chat.room});
                        socket.emit('user'+this.room, {user: this.username, level: this.level, message: loc, room: this.room});
                    }
                }
                if(cmd[0] === '//alert') {
                    var str = "",i=0;
                        for(i=1;i<cmd.length;i++) {
                            str=str+cmd[i]+" ";
                        }
                    socket.emit('meta#bcast', {message: str});
                } else {
                    socket.emit('user'+this.room, {user: this.username, level: this.level, message: loc, room: this.room});
                }
            } else {
                socket.emit('user'+this.room, {user: this.username, level: this.level, message: loc, room: this.room});
            }
        } else {
            socket.emit('user'+this.room, {user: this.username, level: this.level, message: loc, room: this.room});
        }
        $('#mes').val('');
        return false;
    },
    openEmitListener: function(room) {
        console.log('[proxy] socket listener opened')
        socket.on('user'+room, function(msg){
            // <span class="server" id="chatMessage">> <span class="prefix" id="server">[BROADCAST] </span>Hello World!</span>
            if(msg.level === 'admin' || msg.level === 'mod') {
                console.log('command received')

                if(msg.message.substring(0,2) === '//') {
                    var cmd = msg.message.split(" ");
                    if(cmd[0] === '//clear') {
                        $('.viewport').html("<div id='chM'><span class='server' id='chatMessage'>> <span class='prefix' id='server'> [BROADCAST] </span>The chat was cleared.</span></div>");
                    }
                    if(cmd[0] === '//kick') {
                        if(chat.username === cmd[1]) {
                            chat.gotKicked();
                        }
                    }
                    if(cmd[0] === '//chat') {
                        if(cmd[1] === 'off') {
                            $('#mes').prop('disabled', true);
                            $('.adMes').prop('disabled', false);
                        } if (cmd[1] === 'on') {
                            $('#mes').prop('disabled', false);
                            $('input[type="text"]').focus()
                        }
                    }
                } else {
                    chat.printChat(msg);
                }
            } else {
                chat.printChat(msg);
            }
            
        });
        socket.on('meta#all', function(msg) {
            chat.chanMaster = msg
            $('#hrNum1').text('('+msg['#general'].length+')')
            $('#hrNum2').text('('+msg['#random'].length+')')
            $('#hrNum3').text('('+msg['#school'].length+')')
            $('#hrNum4').text('('+msg['#private'].length+')')
        });
        socket.on('meta#bcast', function(msg) {
            chat.openModal('normal', 'SERVER BROADCAST', msg.message);
        });
    },
    printChat: function(msg) {
        let final = "<div id='chM'><span class='"+msg.level+"' id='chatMessage'>> <span class='prefix' id='"+msg.level+"'> ["+msg.user+"] </span>"+chat.censorRE(msg.message)+"</span></div>";
        var ff = $('.viewport').html() + final;
        $('.viewport').html(ff);
        $('.viewport').scrollTop($('.viewport').height());
    },
    unload: function() {
        socket.emit('user'+this.room, {user: 'BROADCAST', level: 'server', message: this.username+" left the channel.", room: this.room});
        socket.emit('meta#all', {intend: 'leave', chan: chat.room, user: chat.username});
        console.log("[proxy] IO pipe disconnect");
        return false;
    },
    gotKicked: function() {
        socket.emit('meta#all', {intend: 'leave', chan: chat.room, user: chat.username});
        socket.emit('user'+this.room, {user: 'BAN HAMMER', level: 'banhammer', message: this.username+" was kicked from the channel!", room: this.room});
        $('.sidebar').text("NOT AVAILABLE")
        $('.viewport').text(" ")
        socket.disconnect();
        document.cookie = "_chatAuth=false";
        window.alert("You have been kicked from this server!");
        window.location = "https://google.com"
        },
    discon: (chanr) => {
        socket.emit('meta#all', {intend: 'leave', chan: chanr, user: chat.username});
        console.log("[proxy] IO pipe disconnect");return socket.disconnect();},
    swicon: (chanr) => {
        socket.emit('meta#all', {intend: 'leave', chan: chanr, user: chat.username});console.log("[proxy] IO pipe disconnect");
    },
    expandChan: function(num) {
        let chM = {1: '#general', 2: '#random', 3: '#school', 4: '#private'};
        let users = chat.chanMaster[chM[num]],i=0,ftr="<div id='qCopl"+num+"'>";
        for(i=0; i<users.length; i++) {
            ftr=ftr+'> '+users[i]+'<br>';
        }
        ftr=ftr+"</div>"
        $('#aa'+num).text('v');
        $('#aa'+num).attr('onclick', 'chat.colChan('+num+')');
        $('.chan'+num).append(ftr);
    },
    colChan: function(num) {
        $('#aa'+num).text('>');
        $('#qCopl'+num).remove();
        $('#aa'+num).attr('onclick', 'chat.expandChan('+num+')');
    },
    switchChan: function(num) {
        let chM = {1: '#general', 2: '#random', 3: '#school', 4: '#private'};
        let chW = {'#general': 1, '#random': 2, '#school': 3, '#private': 4};
            let was = chat.room;
            socket.emit('user'+was, {user: 'BROADCAST', level: 'server', message: chat.username+" left the channel.", room: was});
            chat.room = chM[num];
            $('.viewport').html('<div id="chM"><span class="server" id="chatMessage">> <span class="prefix" id="server">[BROADCAST] </span>Welcome to the chat!</span></div>');
            chat.swicon(was);
            socket.disconnect();
            socket = io(window.location.protocol+"//"+window.location.hostname + ':7000');
            chat.initVariable(chat.room);
            chat.openEmitListener(chat.room);
            $('.chan'+chW[was]).removeClass('actChan')
            $('.chan'+chW[was]).addClass('Chan');
            $('.chan'+chW[chat.room]).removeClass('Chan')
            $('.chan'+chW[chat.room]).addClass('actChan');
            $('#join'+chW[was]).removeClass('hidejoin')
            $('#join'+chW[was]).addClass('join');
            $('#join'+chW[chat.room]).removeClass('join')
            $('#join'+chW[chat.room]).addClass('hidejoin');
    },
    openModal: function(type, title, bottom, pkey, chan) {
        $('.blurer').css('opacity', '0.2');
        $('.popup').css('visibility', 'visible')
        if(type === 'private') {
            $('.pinput').css('visibility', 'visible');
            var a = null;
            $("#pkeyform").submit(function(e) {
                e.preventDefault();
            });
            $('#turninkey').click(function(){
                console.log($('#passkeyin').val())
                if($('#passkeyin').val() === atob(pkey)) {
                    chat.switchChan(chan);
                    chat.closeModal('private');
                } else {
                    chat.closeModal('private');
                }
            })
        } else {
            $('.pdone').css('visibility', 'visible');
            
        }
        $('.ptitle').text(title);
        $('.pcontent').text(bottom);
    },
    closeModal: function(a) {
        $('.blurer').css('opacity', '1');
        $('.popup').css('visibility', 'hidden')
        $('.pdone').css('visibility', 'hidden');
        if(a === 'private') {
            $('.pinput').css('visibility', 'hidden');
        }

    },
    short4: function() {chat.openModal('private', 'SECURE CHANNEL', 'Please enter the private key', "d2Fuc1ByaXZhdGVLZXk=", 4)},
    censorRE: function(message) {
        let blist = ['fuck', 'fucking', 'fucc', 'shit', 'bitch', 'slut', 'whore', 'penis', 'cock', 'vagina', 'anal', 'anus', 'dick',
                     'fucker', 'nigga', 'nigger', 'boobs', 'tits', 'cunt', 'motherfucker', 'faggot', 'dipshit', 'fucked'],i=0,x=0;
        message = message.split(' ');
        for(i=0; i<message.length; i++) {
            if(blist.includes(message[i].toLowerCase())) {
                let fstr = message[i].charAt(0);
                for(x=1; x<message[i].length; x++) {
                    fstr = fstr + "*"
                }
                message[i] = fstr;
            }
        }
        return message.join(" ");
    },
    terms: ()=>{chat.openModal('normal', 'CHATROOM RULES', 'No swearing, no spamming, no harassment, no defamation, no solicitation, no psuedonames.' +
    'The owner of this chat service will not be held responsible or liable for any illegal act commited in the chat service. At any point may the owner of '+
    'the chat service close any and all ports and websockets allowing the chat for any reason unspecified.'+
    'By using this chat service, you are hereby agreeing to all of these terms. Failure to abide by these can and will result in a ban from the chatroom channels.')},
}
!(function() {
}())