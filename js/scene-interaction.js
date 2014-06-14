game.service ('SceneInteraction', ['$timeout', 'Player', 'Character', 'Dialogue', 'ItemInspector', 'Scene',
  function($timeout, Player, Character, Dialogue, ItemInspector, Scene) {
    var self = this;
    function RunAction (action) {
        for (var i=0; i<action.length; i++) {
            var command = action[i];
            if (command.event == 'narrate')
                Narrate (command.content);
            else if (command.event == 'moveto')
                MoveTo (command.destination);
            else if (command.event == 'grant')
                Grant (command.flag);
            else if (command.event == 'take')
                Take (command.item);
            else
                console.log ('Unknown event or command: ' + command.event);
        }
    }

    function Narrate (content) {
        Scene.narration = content;
        $timeout(function() {
            Scene.narration = null;
        }, 2000);
    }

    function MoveTo (destination) {
        Player.goToScene (destination);
    }

    function Grant (flag) {
        Player.grantFlag (flag);
    }

    function Take (item) {
        Player.takeItem (item);
    }

    function GetState (states, name) {
        for (var i=0; i<states.length; i++) {
            if (states[i].name == name) return states[i];
        }
        console.log ('Could not find a state with name ' + name + '!');
    }

    this.activate = function (interaction) {
        var actionMap = interaction.actionMappings[interaction.defaultAction];

        if (!actionMap) {
            console.log ('No actions mapped to this interaction!');
            return;
        }

        // Run the action for the first mapping condition that passes
        var mapping = self.determineAction (actionMap);
        if (!mapping) {
            console.log ('No passing action mappings found!');
            return;
        }

        var actionParts = mapping.action.split ('::');        
        if (actionParts[0] == 'Talk') {
            var character = Character.get(interaction.linkedCharacter);
            var dialogueName = actionParts[1];
            var flag = character.name.replace(' ','_') + '::~Active';
            Player.grantFlag (flag);
            Dialogue.beginDialogue (character, dialogueName, interaction, function () {
                Player.revokeFlag (flag);
            });
        } else {
            // Other action types are considered generic
            var action = interaction.actions[mapping.action];
            RunAction(action);
        }
    };

    this.determineAction = function (actionMap) {
        /* Returns the first passing rule in the action map. */

        for (var i=0; i<actionMap.length; i++) {
            var mapping = actionMap[i];
            if (!mapping.condition || Player.evaluateCondition (mapping.condition)) return mapping;
        }
    };

    this.determineState = function (interaction) {
        /* Return the active state to display for the given interaction. */

        var state = GetState(interaction.states,interaction.defaultState);
        var evalCtx = "";
        if (interaction.linkedCharacter)
            evalCtx = Character.get(interaction.linkedCharacter).name.replace(' ','_');
        for (var i=0; i<interaction.states.length; i++) {
            var cState = interaction.states[i];
            if (cState.condition && !Player.evaluateCondition(cState.condition, evalCtx)) continue;
            state = cState;
        }
        
        return state;
    };

    return this;
}]);

game.directive ('sceneInteraction', function () {
    var controller = ['$scope', 'SceneInteraction', 'Assets', 'Player', 'Debugger', 
      function ($scope, SceneInteraction, Assets, Player, Debugger) {
        $scope.css = {
            left: '0px',
            top: '0px',
            width: '0px',
            height: '0px'
        };
        $scope.showRegion = false;
        $scope.tooltip = '';
        
        // Attach all images in advance to avoid flicker when changing
        var imageLayers = []; // Map state name to layer index
        var bgImage = '';
        var bgSize = '';
        var states = $scope.model.states;
        for (var i=0; i<states.length; i++) {
            var state = states[i];
            if (!state.image) continue;
            var imageURI = Assets.getImageURI (state.image);
            if (bgImage.length > 0) {
                bgImage += ', ';
                bgSize += ', ';
            }
            bgImage += 'url(' + imageURI + ')';
            bgSize += '0 0'; // All hidden for now
            imageLayers.push (state.name);
        }
        $scope.css['background-image'] = bgImage;
        $scope.css['background-size'] = bgSize;

        function SetBackground (name) {
            var bgSize = '';
            for (var i=0; i<imageLayers.length; i++) {
                var stateName = imageLayers[i];
                if (stateName == name) bgSize += 'contain';
                else bgSize += '0%';
                if (i+1<imageLayers.length) bgSize += ', ';
            }
            $scope.css['background-size'] = bgSize;
        }

        function ApplyState (state) {
            var region = state.region;
            //var imageURI = Assets.getImageURI (state.image);
            SetBackground (state.name);
            if (region) {
                $scope.css['left'] = region[0] + "px";
                $scope.css['top'] = region[1] + "px";
                $scope.css['width'] = region[2] + "px";
                $scope.css['height'] = region[3] + "px";
            }
            var tooltip = '';
            var mapping = SceneInteraction.determineAction($scope.model.actionMappings[$scope.model.defaultAction]);
            if (state.tooltip)
                $scope.tooltip = mapping.verb + ' ' + state.tooltip;
        }

        // Watch for changes in the progress serial, so that we can keep the
        // interaction state up to date.
        $scope.$watch(function(){return Player.serial;}, function (serial) {
            var state = SceneInteraction.determineState ($scope.model);
            ApplyState (state);
        });

        $scope.$watch(function(){return Debugger.showRegions;}, function (showRegion) {
            $scope.showRegion = showRegion;
        });

        $scope.onClick = function () {
            SceneInteraction.activate($scope.model);
        };
    }];

    return {
        restrict: 'E',
        controller: controller,
        replace: false,
        templateUrl: 'partials/scene-interaction.html',
        scope: {
            model: '=ngModel',
        },
    };
});

