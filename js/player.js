game.service ('Player', ['$window', 'Scene', 'World',
  function($window, Scene, World) {
    var self = this;
    var reTokens = new RegExp (/[^ &|()!]+/g);

    this.scene = null;
    this.progressFlags = []; // List of progress markers earned (strings)
    this.inventory = [];     // List of items in inventory (objects)
    this.serial = 0;         // Increment on progress update

    this.start = function () {
        // Load progress data from query string
        var query = URI(document.URL).query(true);
        if (query.flags) 
            self.progressFlags = query.flags.split(',');
        if (query.inventory) {
            var items = query.inventory.split(',');
            angular.forEach(items,function(item) {
                self.takeItem (item);
            });
        }
        if (query.scene)
            self.goToScene (query.scene);
    };

    this.goToScene = function (scene) {
        /* Go to the specified scene.
        
        Arguments
         scene -- A scene object or the name of a scene.
        */

        if (scene.substr) 
            scene = World.data.scenes[scene];
        self.scene = scene;
        Scene.set (scene);
    };

    this.leaveScene = function () {
        /* Leave the current scene. */

        self.scene = null;
        Scene.clear ();
    };

    this.grantFlag = function (flag) {
        /* Grant the specified progress flag to the player. */

        if (self.progressFlags.indexOf(flag) == -1) {
            self.progressFlags.push (flag);
            self.serial++;
        }
    };

    this.revokeFlag = function (flag) {
        /* Revoke the specified progress flag from the player. */

        var idx = self.progressFlags.indexOf(flag);
        if (idx == -1) return;
        self.progressFlags.splice (idx, 1);
        self.serial++;
    };

    this.hasFlag = function (flag) {
        /* Check whether a player has been granted the specified progress flag. */

        return self.progressFlags.indexOf(flag) != -1;
    };

    this.takeItem = function (item) {
        /* Add an item to the inventory.

        Arguments
         item -- An item name (string) or item object to add.
        */

        if (item.substr) item = World.getItem (item);
        self.inventory.push (item);
        self.serial++;
    };

    this.dropItem = function (item) {
        /* Remove an item from the inventory.

        Arguments
         item -- An item name (string) or item object to drop.
        */

        if (item.substr) item = World.getItem (item);

        var idx = self.inventory.indexOf(item);
        if (idx == -1) return;
        self.inventory.splice (idx, 1);
        self.serial++;
    };

    this.hasItem = function (item) {
        /* Check for the presence of an item in the inventory.

        Arguments
         item -- An item name (string) or item object to check for.
        */

        if (item.substr) item = World.getItem (item);

        return self.inventory.indexOf(item) != -1;
    };

    this.evaluateCondition = function (condition, context) {
        /* Safely evaluate a flag-based boolean condition.
        
        If a token in the condition begins with ::, the context argument is
        prepended before evaluation.
        */

        // Replace all non-operator elements with 0 or 1
        var tokens = condition.match(reTokens);
        for (var i=0; i<tokens.length; i++) {
            var token = tokens[i];
            var value = '0';
            var flagName = token;
            if (token.slice(0,2) == '::') flagName = context + token;
            if (self.hasFlag(flagName)) value = '1';
            condition = condition.replace(token, value);
        }
        return eval (condition);
    };

    return this;
}]);
