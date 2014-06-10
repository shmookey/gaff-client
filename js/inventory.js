game.service ('UIInventory', [function() {
    this.enabled = false;
}]);

game.directive ('inventory', function() {
    var controller = ['$scope', 'Player', 'UIInventory', function ($scope, Player, UIInventory) {
        var watches = [];
        $scope.visible = false;
        $scope.items = null;

        $scope.$watch(function(){return UIInventory.enabled;}, function(enabled) {
            $scope.visible = enabled;
            if (enabled) setUpWatches ();
            else cancelWatches ();
        });
        
        function setUpWatches () {
            watches.push($scope.$watch(function(){return Player.inventory;}, function(inventory) {
                $scope.items = inventory;
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
        templateUrl: '/partials/inventory.html',
        controller: controller,
        scope: {},
    };
});

