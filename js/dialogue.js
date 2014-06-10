// DialogueNotActive -- A dialogue event was fired outside an active conversation
function DialogueNotActive(){}
DialogueNotActive.prototype = GaffException;

// PromptNotActive -- A prompt event was fired outside an active prompt
function PromptNotActive(){}
PromptNotActive.prototype = GaffException;

// InvalidSelection -- The selected prompt option number does not exist
function InvalidSelection(index){this.index=index;}
InvalidSelection.prototype = GaffException;

// UnknownLineEvent -- The specified line event type is not recognised
function UnknownLineEvent(eventType){this.eventType=eventType;}
UnknownLineEvent.prototype = GaffException;

// UnsupportedJumpTarget -- Don't know how to jump to specified target
function UnsupportedJumpTarget(target){this.target = target;}
UnsupportedJumpTarget.prototype = GaffException;

// NoSuchSection -- Couldn't find a section with the specified name
function NoSuchSection(target){this.target = target;}
NoSuchSection.prototype = GaffException;

game.service ('Dialogue', ['$timeout', 'Character', 'Player', function ($timeout, Character, Player) {
    var self = this;

    this.character = null;    // Reference to Character object
    this.tree = null;         // Reference to dialogue tree structure
    this.prompt = null;       // Reference to current prompt
    this.activeLines = null;  // List of visible lines of speech
    this.interaction = null;  // Reference to originating SceneInteraction
    this.fnNextStep = null;   // Function to trigger the next 'step' in the conversation
    this.select = null;       // Function to select an option from a prompt
    this.cbEnd = null;        // Callback after dialogue finished

    this.beginDialogue = function (character, dialogueName, interaction, cbEnd) {
        /* Start a new conversation. */

        self.character = character;
        self.tree = character.dialogues[dialogueName];
        self.activeLines = [];
        self.interaction = interaction;
        self.cbEnd = cbEnd;

        self.step (self.tree.lines, 0, function () {
            self.endDialogue();
        });

    };

    this.endDialogue = function () {
        /* Stop the conversation. */

        if (self.cbEnd) self.cbEnd ();
        self.cbEnd = null;
        self.character = null;
        self.tree = null;
        self.activeLines = null;
        self.fnNextStep = null;
        self.interaction = null;
        self.select = null;
    };

    this.step = function (lines, currentPosition, complete) {
        /* Move forward in the conversation.
        
        Arguments
         lines -- The current list of lines we're working through.
         currentPosition -- Position of the current line (1-indexed).
         complete -- Function to call after the lines have been exhausted.
        */

        self.fnNextStep = null;

        if (currentPosition+1 > lines.length) {
            // We've run out of lines.
            return complete();
        }
        
        currentPosition += 1;
        var nextLine = lines[currentPosition-1];
        
        if (nextLine.event == 'line') {
            self.activeLines = [nextLine];
            self.fnNextStep = function () {
                return self.step (lines, currentPosition, complete);
            };
        } else if (nextLine.event == 'prompt') {
            return DoPrompt (nextLine, function () {
                return self.step (lines, currentPosition, complete);
            });
        } else if (nextLine.event == 'jump') {
            var target = GetSection(nextLine.target, self.tree);
            if (!target)
                throw new NoSuchSection (nextLine.target);

            var cbReturn = function () {
                return self.step (lines, currentPosition, complete);
            };
            if (target.event == 'prompt') {
                return DoPrompt (target, function () {
                    return self.step (lines, currentPosition, complete);
                });
            } else {
                throw new UnsupportedJumpTarget (target);
            }
        } else if (nextLine.event == 'grant') {
            return DoGrant (nextLine, function () {
                return self.step (lines, currentPosition, complete);
            });
        } else {
            throw new UnknownLineEvent (nextLine.event);
        }
    };

    function DoGrant (grantEvent, cbNext) {
        /* Grant the player a progress flag. */

        Player.grantFlag (grantEvent.flag);
        return cbNext ();
    }

    function DoPrompt (promptEvent, cbReturn) {
        /* Prompt the player with conversation options.

        Each option has a resulting conversation branch. When the resulting
        conversation is complete, a callback is fired and the conversation
        may continue.

        Arguments
         promptEvent -- Event object containing prompt options
         cbReturn -- Function to call when prompt is complete
        */

        var options = angular.copy (promptEvent.options);
        self.activeLines = [];
        self.prompt = [];
        angular.forEach (promptEvent.options, function (option) {
            if (option.condition && !Player.evaluateCondition(option.condition)) return;
            self.prompt.push (option);
        });
        if (self.prompt.length == 0) {
            // No valid options, continue
            self.prompt = null;
            self.select = null;
            cbReturn ();
        }

        self.select = function (index) {
            /* Select a dialogue prompt option. */

            if (index >= self.prompt.length)
                throw new InvalidSelection (index);
            
            var option = self.prompt[index];
            self.prompt = null;
            self.select = null;
            self.step (option.result, 0, cbReturn);
        };
    }

    function GetSection (name, tree) {
        /* Recursively walk a conversation tree and return a section with the specified name. */

        var lines;
        if (tree.event == 'dialogue') lines = tree.lines;
        else if (tree.event == 'prompt') lines = tree.options;
        else if (tree.event == 'option') lines = tree.result;
        else return false;
        for (var i=0; i<lines.length; i++) {
            var item = lines[i];
            if (item.name == name) return item;
            var section = GetSection (name, item);
            if (section) return section;
        }
        return false;
    }

    return this;
}]);

game.directive ('dialogue', function () {
    var controller = ['$scope', 'Dialogue', 'SceneInteraction', 'Scene', 
      function ($scope, Dialogue, SceneInteraction, Scene) {
        var unwatchLines = null;
        var unwatchPrompt = null;
        var npcRegion = null;

        $scope.lines = null;
        $scope.prompt = null;
        $scope.visible = false;
        
        $scope.$watch(function(){return Dialogue.character;}, function (character) {
            // The character being spoken to has changed (possibly to no one)

            if (!character) {
                // No active dialogue, clear scope and cancel watches

                if (unwatchLines) unwatchLines();
                if (unwatchPrompt) unwatchPrompt();
                unwatchLines = unwatchPrompt = null;
                npcRegion = null;
                $scope.visible = false;
                return;
            }

            $scope.visible = true;
            npcRegion = SceneInteraction.determineState(Dialogue.interaction).region;

            // Set up watches
            unwatchLines = $scope.$watch(function(){return Dialogue.activeLines;}, onLinesChange, true);
            unwatchPrompt = $scope.$watch(function(){return Dialogue.prompt;}, onPromptChange, true);
        });

        $scope.step = function () {
            /* User triggers the next step in the conversation, e.g. by clicking. */

            if (!$scope.visible)
                throw new DialogueNotActive();

            if ($scope.prompt)
                return;

            if (Dialogue.fnNextStep)
                Dialogue.fnNextStep();
        };

        $scope.selectOption = function (index, $event) {
            /* Select an item from the current prompt. */

            if (!$scope.visible)
                throw new DialogueNotActive();

            if (!$scope.prompt)
                throw new PromptNotActive();

            Dialogue.select (index);
            $event.stopPropagation();
        };

        function onLinesChange (lines) {
            /* The active lines have changed, format them for display. */

            $scope.lines = [];
            if (!lines) return;
            for (var i=0; i<lines.length; i++) {
                var line = lines[i];
                var displayLine = {content: line.content, style: {}};
                if (line.speaker == 'Player') {
                    displayLine.player = true;
                } else {
                    var left = npcRegion[0]
                    var right = left + npcRegion[2];
                    var sceneWidth = Scene.bgSize[0];
                    if (right/sceneWidth < 0.5) 
                        displayLine.style.left = right;
                    else
                        displayLine.style.right = sceneWidth - left;
                    displayLine.style.top = npcRegion[1];
                    displayLine.style.color = Dialogue.character.speechColor;
                }
                $scope.lines.push (displayLine);
            }
        }

        function onPromptChange (prompt) {
            // Current prompt options have changed, format them for display
            $scope.prompt = prompt;
        }
    }];

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'partials/dialogue.html',
        controller: controller,
        scope: {},
    };
});
