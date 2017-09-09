on("ready", function() {
    log("### Loaded Timed Events v0.4 ###");

    function TimedEvent(source, sourceMessage, flavorMessage, startTime, action, action_id) {
        this.source = source;
        this.sourceMessage = sourceMessage;
        this.flavorMessage = flavorMessage;
        this.startTime = startTime;
        this.action = action;

        this.action_id = action_id;
        this.hasFired = false;
    }

    TimedEvent.prototype.fire = function() {
        this.hasFired = true;
        if (this.source && this.sourceMessage) {
            this.sendChat(this.source, this.sourceMessage);
        }
        if (this.flavorMessage) {
            this.sendChat(null, this.flavorMessage);
        }
        if (this.action) {
            // TODO: JJ - Fix - hack right now
            if (this.action_id === 1) {
                this.action(false);
            } else if (this.action_id === 2) {
                this.action(true);
            }

        }
    };

    TimedEvent.prototype.sendChat = function(character, message) {
        if (character) {
            sendChat(character, message, {noarchive:true});
        } else {
            sendChat("", "/desc " + message, {noarchive:true});
        }
    };

    function TimedEventManager() {
        this.elapsedTime = 0;
        this.isPaused = true;
    }

    // Complexity: O(n)
    TimedEventManager.prototype.processEvents = function() {
        var currentTime = this.elapsedTime;
        var eventsThatCanFire = _.filter(this.events, function(event) {
            return currentTime >= event.startTime  && event.hasFired === false;
        });

        if (eventsThatCanFire.length > 0) {
            _.each(eventsThatCanFire, function(event, index, list) {
                event.fire();
            });
        }
    };

    TimedEventManager.prototype.tick = function() {
        if (this.isPaused === false) {
            this.elapsedTime += 5;
            this.processEvents();
        }
    };

    TimedEventManager.prototype.processCommand = function(commandText, msg) {
        switch (commandText) {
            case "start":
                this.elapsedTime = 0;
                this.isPaused = false;
                break;
            case "pause":
                this.isPaused = true;
                break;
            case "resume":
                this.isPaused = false;
                break;
            case "settimer":
                var timeToSet = parseInt(msg.content.replace("!setTimer ", ""));
                if (timeToSet || timeToSet === 0) {
                    this.elapsedTime = timeToSet
                }
                break;
            case "restart":
                _.each(this.events, function(event, index, list) {
                    event.hasFired = false;
                });
                this.resetTime();
                break;
            case "status":
                sendChat("", "/w gm Current Time: " + this.elapsedTime);
                break;
            case "lightsoff":
                this.setLights(false);
                break;
            case "lightson":
                this.setLights(true);
                break;
        }
    };

    TimedEventManager.prototype.resetTime = function() { this.elapsedTime = 0; };
    TimedEventManager.prototype.setEvents = function(events) {
        // Expecting an array of TimedEvent objects
        this.events = events;
    };

    TimedEventManager.prototype.setLights = function(turnOn) {
        var floorOneTorches = ["-KtGDDNDFDdTfDpOU79P", "-KtGAqgxWnWZ2BXKgB0a", "-KtGDCiYAnoRgSIt94uP", "-KtGEK9-VXCVkYnuIR-T",
            "-KtGEDitJz1_JjsdmP7r", "-KtGDc4LOzh0UDkoxzvT", "-KtGDlNMRtPhM3Ar3TFM", "-KtGDMuuHgoj8_5zurAy", "-KtGDDfKX2AhqWcgDIE8",
            "-KtGDOdg-bPZdUB1VD-t", "-KtGDHBexbPsqJtI8_x8", "-KtGhuVNtkcYxWByBK4r"];

        if (turnOn === false) {
            _.each(floorOneTorches, function(torchId, index, list) {
                // This will stagger each torch shutting down so they turn off 1 second after the other.
                setTimeout(function() { Torch.KillFlicker(torchId); }, index * 800);
            });
            // Turn off fireplace
            Torch.KillFlicker("-KtGHKzYgi97zGvViPKS");
        } else {
            _.each(floorOneTorches, function(torchId, index, list) {
                setTimeout(function() { Torch.StartFlicker("!flicker-on 50 25 yes 002 360 " + torchId); }, index * 200);
            });
            Torch.StartFlicker("!flicker-on 100 50 yes 001 360 " + "-KtGHKzYgi97zGvViPKS");
        }
    };


    /* Main */

    // The event manager will do the bulk of the tracking / messaging work.
    var eventManager = new TimedEventManager();

    var timedEvents = [
        new TimedEvent("", null, "The Woolen Calf Inn is packed with customers this evening.", 0, eventManager.setLights, 2),
        new TimedEvent("character|-Kt_shvutPSvx8_CcPwA", "I once knew a girl with a fiery mound .. the sky I must say did not favor the ground…", "From the corner of the Woolen Calf Inn a bard continues to sing lewd songs to drunk visitors.", 60, null),
        new TimedEvent("character|-KtJLfi0ypyIpgXNX-_y", "That's it! Out ya' go!", "A tiny man covered in urine is hoisted up by his overalls and thrown violently out of the front door by a guard.", 60*4, null),
        new TimedEvent("character|-Kt_shvutPSvx8_CcPwA", "Gather round all, let us sing to the pride of our nation", "The crowd begins to gather around the fireplace to sing the anthem.", 60*6, null),
        new TimedEvent("", null, "A raucous noise  comes from the 2nd floor of the Inn - the distinct sound of dogs barking running back and forth echoes loudly throughout the inn.", 60*8, null),
        new TimedEvent("character|-Kt_h0XqDJ5XjMuy1_QN", "RRRRAAAAAOOOO \<HISS\>", "You hear a noise from the corner and a cat jumps down from the rafters", 60*11, null),
        new TimedEvent("", null, "Silence falls over the Inn as the lights are all snuffed out one by one", 60*15, eventManager.setLights, 1),
        new TimedEvent("", null, "A large and furious fire erupts from the hearth - it looks to have a mind of its own.", 60*16, null),
        new TimedEvent("character|-Kt_vF8B_gKgCOJiuOZq", "ARRRRGHGHG!!! Make it stoooop!", "A loud booming voice can be heard eminating from the fire in the corner of the Inn.", 60*17, null),
        new TimedEvent("", null, "The screams from the 1st floor of the Inn turn to battle cries as monsters spill forth from the flame.", 60*18, null),
        new TimedEvent("", null, "Two elves silently slip into the Inn and begin surveying the Inns 1st floor.", 60*22, null),
        // TODO: Black out scene
        new TimedEvent("", null, "Your vision retreats inward and slowly robs you all of sight as your vision fades to black along with your bodies’ strength.", 60*25, null)
    ];
    eventManager.setEvents(timedEvents);

    // Start main run loop
    setInterval(function() {
        eventManager.tick();
    }, 5000); //take an action every 5 seconds

    // Handle Chat commands
    on("chat:message", function(msg) {
        if(msg.type === "api" && msg.content.indexOf("!") !== -1 && msg.content.length > 1) {
            // log("Who: " + msg.who + " id: " + msg.playerid + " admin?: " + playerIsGM(msg.playerid));
            var command = msg.content.replace("!", "").split(" ")[0];
            var sender = msg.who.toLowerCase();
            if (sender.indexOf("gm") !== -1) {
                eventManager.processCommand(command.toLowerCase(), msg);
            } else {
                sendChat(msg.who, "You're unauthorized to perform this command");
            }
        }
    });

});