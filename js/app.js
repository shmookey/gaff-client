var game = angular.module ('game',[]);

game.directive('ngRightClick', function($parse) {
    return function(scope, element, attrs) {
        var fn = $parse(attrs.ngRightClick);
        element.bind('contextmenu', function(event) {
            scope.$apply(function() {
                event.preventDefault();
                fn(scope, {$event:event});
            });
        });
    };
});

game.service ('Game', ['$rootScope','$http', 'World', 'Assets', 'WorldMap', 'Character', function ($rootScope, $http, World, Assets, WorldMap, Character) {
    var self = this;
    this.loaded = false;
    this.running = false;
    this.worldData = null;
    this.error = null;

    function onLoad () {
        self.loaded = true;
    }

    this.start = function () {
        self.running = true; 
    }

    $http.get('api/world').success(function(data) {
        self.worldData = data;
        World.data = data;
        Assets.loadImages(data.imageRefs, onLoad);
        WorldMap.loadMap ('initial');
        Character.onLoad (data.characters);
    }).error(function(data,status,headers,config) {
        self.error = 'Everyn is unavailable right now due to a server issue. Please try again later.';
    });

    return this;
}]);

game.directive ('game', function() {
    var link = function (scope, element, attrs) {
        $('.toolbar button').tooltip({container:'.toolbar'});
    };

    var controller = ['$scope', 'Game', 'UIPlayerInfo', 'UIInventory', 'Debugger',
      function($scope, Game, UIPlayerInfo, UIInventory, Debugger) {
        $scope.debugEnabled = Debugger.enabled;
        $scope.playerInfoEnabled = UIPlayerInfo.enabled;
        $scope.inventoryEnabled = UIInventory.enabled;

        $scope.toggleDebugger = function () {
            $scope.debugEnabled = Debugger.enabled = !Debugger.enabled;
        };
        $scope.togglePlayerInfo = function () {
            $scope.playerInfoEnabled = UIPlayerInfo.enabled = !UIPlayerInfo.enabled;
        };
        $scope.toggleInventory = function () {
            $scope.inventoryEnabled = UIInventory.enabled = !UIInventory.enabled;
        };
    }];
    return {
        restrict: 'E',
        scope: true,
        controller: controller,
        link: link,
    }
});

game.directive ('intro', function () {
    var controller = ['$scope', 'Game', 'Assets', function ($scope, Game, Assets) {
        $scope.visible = true;
        $scope.nImages = -1;
        $scope.nImagesLoaded = -1;
        $scope.error = null;

        $scope.$watch (function (){return Game.running;}, function(running) {
            $scope.visible = !running;
        });
        $scope.$watch (function (){return Game.error;}, function(error) {
            $scope.error = error;
        });
        $scope.$watch (function (){return Assets.nImages;}, function(nImages) {
            $scope.nImages = nImages;
        });
        $scope.$watch (function (){return Assets.nImagesLoaded;}, function(nImagesLoaded) {
            $scope.nImagesLoaded = nImagesLoaded;
        });
        $scope.startGame = function () {
            Game.start();
        };
    }];

    return {
        restrict: 'E',
        scope: {},
        controller: controller,
        templateUrl: 'partials/intro.html',
    };
});
