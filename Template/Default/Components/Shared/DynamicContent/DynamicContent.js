(function () {
    'use strict';

    angular
    .module('app')
    .directive('dynamiccontent', dynamicContent);

    dynamicContent.$inject = ['$compile'];

    function dynamicContent($compile) {
        function link(scope, element, attrs) {
            scope.$watch('content', function (newVal) {
                if (newVal !== undefined) {
                    console.log('test content');
                    element.html(scope.content.template).show();
                    scope.Tokens = scope.content.tokens;
                    $compile(element.contents())(scope);
                }
            });
        }

        var directive = {
            link: link,
            restrict: 'E',
            scope: {
                content: '=content',
            }
        };
        return directive;
    }
})();