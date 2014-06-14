game.service ('UIInventory', [function() {
    this.enabled = false;
}]);

game.directive ('inventory', function() {
    var controller = ['$scope', 'Player', 'UIInventory','Assets',
      function ($scope, Player, UIInventory, Assets) {
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
                $scope.items = [];
                for (var i=0; i<inventory.length; i++) {
                    var item = {
                        model: inventory[i],
                        style: {
                            'background-image': 'url(' + Assets.getImageURI(inventory[i].inventoryIcon) + ')',
                        }
                    };
                    $scope.items.push(item);
                }
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

