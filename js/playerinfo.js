game.service ('UIPlayerInfo', [function() {
    this.enabled = false;
}]);

game.directive ('playerinfo', function() {
    var controller = ['$scope', 'Player', 'UIPlayerInfo', function ($scope, Player, UIPlayerInfo) {
        var watches = [];
        $scope.visible = false;
        $scope.progressFlags = null;
        $scope.savelink = null;

        $scope.$watch(function(){return UIPlayerInfo.enabled;}, function(enabled) {
            $scope.visible = enabled;
            if (enabled) setUpWatches ();
            else cancelWatches ();
        });
        
        function setUpWatches () {
            watches.push($scope.$watch(function(){return Player.progressFlags;}, function(progressFlags) {
                $scope.progressFlags = progressFlags;
                rebuildSaveLink();
            }, true));
            watches.push($scope.$watch(function(){return Player.inventory;}, function(inventory) {
                rebuildSaveLink();
            }, true));
            watches.push($scope.$watch(function(){return Player.scene;}, function(scene) {
                rebuildSaveLink();
            }, true));
        }

        function rebuildSaveLink () {
            var state = [];
            var items = Player.inventory.map(function(item){return item.name;});
            if (Player.progressFlags.length > 0) state.push ('flags=' + Player.progressFlags.join(','));
            if (Player.inventory.length > 0) state.push ('inventory=' + items.join(','));
            if (Player.scene) state.push ('scene=' + Player.scene.name);
            state.push ('autostart=1');
            $scope.savelink = encodeURI('/?' + state.join('&'));
        }

        function cancelWatches () {
            for (var i=0; i<watches.length; i++) {
                var cancelFn = watches[i];
                cancelFn();
            }
            watches = [];
        }

    }];

    return {
        restrict: 'E',
        replace: true,
        templateUrl: '/partials/playerinfo.html',
        controller: controller,
        scope: {},
    };
});

