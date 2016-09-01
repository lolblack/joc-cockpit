/**
 * Created by sourabhagrawal on 20/06/16.
 */

(function () {
    'use strict';
    angular.module('app')
        .factory('CoreService', CoreService)
        .factory('SavedFilter', SavedFilter);

    CoreService.$inject = ['$window'];
    function CoreService($window) {

        if ($window.localStorage.$SOS$VIEW) {
            var _view = $window.localStorage.$SOS$VIEW;
        } else {
            var _view = 'grid';
            $window.localStorage.$SOS$VIEW = 'grid';
        }

        if ($window.localStorage.$SOS$SIDEVIEW == 'true' || $window.localStorage.$SOS$SIDEVIEW == true) {
            var _sideView = $window.localStorage.$SOS$SIDEVIEW;
        } else {
            var _sideView = false;
            $window.localStorage.$SOS$SIDEVIEW = false;
        }


        return {
            getParams: function (name) {
                name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
                var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                    results = regex.exec(location.search);
                return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
            },
            setView: function (view) {
                $window.localStorage.$SOS$VIEW = view;
                _view = view;
            },
            getView: function () {
                return _view;
            },
            setSideView: function (view) {
                $window.localStorage.$SOS$SIDEVIEW = view;
                _sideView = view;
            },
            getSideView: function () {
                return !_sideView;
            }
        }
    }


    SavedFilter.$inject = ['$window'];
    function SavedFilter($window) {

        var props = ['jobChainFilters', 'orderFilters', 'jobFilters', 'historyFilters','ignoreList'];

        var propsPrefix = '$SOS$';

        function SavedFilter() {
            var self = this;
            props.forEach(function (name) {
                self[name] = load(name);
            });

        }

        SavedFilter.prototype.save = function () {
            var self = this;
            var storage = $window.localStorage;

            props.forEach(function (name) {

                save(storage, name, self[name]);
            });
        };

        SavedFilter.prototype.setJobChain = function (jobchain) {
            this.jobChainFilters = JSON.stringify(jobchain);
        };

        SavedFilter.prototype.setOrder = function (order) {
            this.orderFilters = JSON.stringify(order);
        };
        SavedFilter.prototype.setJob = function (job) {
            this.jobFilters = JSON.stringify(job);
        };
        SavedFilter.prototype.setHistory = function (history) {
            this.historyFilters = JSON.stringify(history);
        };

        SavedFilter.prototype.setIgnoreList = function (list) {
            this.ignoreList = JSON.stringify(list);
        };

        SavedFilter.prototype.clearStorage = function () {
            props.forEach(function (name) {
                save($window.localStorage, name, null);
            });
        };

        return new SavedFilter();

        // Note: LocalStorage converts the value to string
        // We are using empty string as a marker for null/undefined values.
        function save(storage, name, value) {
            var key = propsPrefix + name;
            if (value == null) value = '';
            storage[key] = value;
        }

        function load(name) {
            var key = propsPrefix + name;

            return $window.localStorage[key] || null;
        }
    }


})();
