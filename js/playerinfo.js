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
                var items = Player.inventory.map(function(item){return item.name;});
                $scope.savelink = encodeURI('/?flags=' + progressFlags.join(',') + '&inventory=' + items.join(','));
            }, true));
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

