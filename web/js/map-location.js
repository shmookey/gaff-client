game.directive ('mapLocation', function () {
    var link = function (scope, element, attrs) {
        $(element).tooltip({title: scope.model.name});
    };

    var controller = ['$scope', 'WorldMap', 'Player', 'Debugger', function ($scope, WorldMap, Player, Debugger) {
        $scope.region = {
            left: "0px",
            top: "0px",
            width: "0px",
            height: "0px"
        };
        $scope.showRegion = false;

        $scope.$watch(function(){return $scope.model.screenRegion;}, function(region) {
            $scope.region = {
                left: region[0] + "px",
                top: region[1] + "px",
                width: region[2] + "px",
                height: region[3] + "px",
            };
        }, true);

        $scope.$watch(function(){return Debugger.showRegions;}, function (showRegion) {
            $scope.showRegion = showRegion;
        });

        $scope.visit = function () {
            Player.goToScene ($scope.model);
        };
    }];

    return {
        restrict: 'E',
        controller: controller,
        link: link,
        replace: true,
        templateUrl: 'partials/map-location.html',
        scope: {
            model: '=ngModel',
        },
    };
});

