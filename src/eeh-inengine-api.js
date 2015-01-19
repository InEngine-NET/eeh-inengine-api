(function (angular) {
    'use strict';
    var InEngineApi = function ($resource, apiUrl) {
        this.$resource = $resource;
        this.apiUrl = apiUrl;
    };

    InEngineApi.prototype.queryResource = function (name) {
        return this.$resource(this.apiUrl + '/' + name).query().$promise;
    };

    InEngineApi.prototype.getCronTriggers = function () {
        return this.queryResource('CronTrigger');
    };

    InEngineApi.prototype.getSimpleTriggers = function () {
        return this.queryResource('SimpleTrigger');
    };

    InEngineApi.prototype.getJobTypes = function () {
        return this.queryResource('JobType');
    };

    InEngineApi.prototype.getTimeZones = function () {
        return this.queryResource('TimeZone');
    };

    angular.module('eehInEngine.api', ['ngResource'])
    .provider('eehInEngineApi', function () {
        var _apiUrl = 'http://localhost:9001/api';
        this.apiUrl = function (value) {
            if (angular.isUndefined(value)) {
                return _apiUrl;
            }
            _apiUrl = value;
        };
        this.$get = function ($resource) {
            return new InEngineApi($resource, _apiUrl);
        };
    });
}(angular));
