game.service ('Assets', ['$rootScope', function ($rootScope) {
    var self = this;
    this.imageRefs = {};
    this.nImages = -1;
    this.nImagesLoaded = -1;
    this.readyCallback = null;

    function imageLoaded () {
        self.nImagesLoaded += 1;
        if (self.nImagesLoaded == self.nImages) {
            self.readyCallback ();
        };
        $rootScope.$apply();
    }

    this.getImageURI = function (imageName) {
        return this.imageRefs[imageName];
    };

    this.loadImages = function (imageRefs, readyCallback) {
        this.nImages = 0;
        this.nImagesLoaded = 0;
        this.readyCallback = readyCallback;
        angular.forEach (imageRefs, function (url, name) {
            if (!url) return;
            self.nImages ++;
            var img = new Image();
            img.onload = imageLoaded;
            img.src = url;
        });
        this.imageRefs = imageRefs;
    };

    return this;
}]);
