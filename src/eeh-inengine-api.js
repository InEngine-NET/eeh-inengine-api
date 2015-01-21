(function (angular) {
    'use strict';
    var InEngineApiConfiguration = function (apiUrl, endpointNames) {
        this._apiUrl = apiUrl;
        this._endpointNames = endpointNames;
        this._methods = {
            'update': { method:'PUT' }
        };
    };

    InEngineApiConfiguration.prototype.apiUrl = function () {
        return this._apiUrl;
    };

    InEngineApiConfiguration.prototype.endpointNames = function () {
        return this._endpointNames;
    };

    InEngineApiConfiguration.prototype.methods = function () {
        return this._methods;
    };

    var InEngineApiConfigurationProvider = function () {
        var _apiUrl = 'http://localhost:9001/api';
        this.apiUrl = function (value) {
            if (angular.isUndefined(value)) {
                return _apiUrl;
            }
            _apiUrl = value;
        };
        var _endpointNames = {
            cronTrigger: 'CronTrigger',
            jobType: 'JobType',
            simpleTrigger: 'SimpleTrigger',
            timeZone: 'TimeZone',
            healthStatus: 'HealthStatus'
        };
        this.endpointNames = function (value) {
            if (angular.isUndefined(value)) {
                return _endpointNames;
            }
            _endpointNames = value;
        };
        this.$get = function () {
            return new InEngineApiConfiguration(_apiUrl, _endpointNames);
        };
    };

    var InEngineApi = function ($resource, eehInEngineApiConfiguration) {
        this.$resource = $resource;
        var config = eehInEngineApiConfiguration;
        var endpointNames = config.endpointNames();
        function getResource (endpointName ) {
            var resourceName = config.apiUrl() + '/' + endpointName + '/:id';
            return $resource(resourceName, {id:'@id'}, config.methods());
        }
        this.resources = {
            cronTriggers:   getResource(endpointNames.cronTrigger),
            simpleTriggers: getResource(endpointNames.simpleTrigger),
            timeZones: getResource(endpointNames.timeZone),
            jobTypes: getResource(endpointNames.jobType),
            healthStatus: getResource(endpointNames.healthStatus)
        }
    };

    InEngineApi.prototype.getCronTriggers = function () {
        return this.resources.cronTriggers.query().$promise;
    };

    InEngineApi.prototype.pauseTrigger = function (trigger, triggerResource) {
        var request = angular.copy(trigger);
        request.StateId = +(!request.StateId);
        return triggerResource.update({id: trigger.Id}, request).$promise;
    };

    InEngineApi.prototype.pauseCronTrigger = function (trigger) {
        return this.pauseTrigger(trigger, this.resources['cronTriggers']);
    };

    InEngineApi.prototype.pauseSimpleTrigger = function (trigger) {
        return this.pauseTrigger(trigger, this.resources['simpleTriggers']);
    };

    InEngineApi.prototype.deleteCronTrigger = function (trigger) {
        return this.resources.cronTriggers.remove(trigger).$promise;
    };

    InEngineApi.prototype.getSimpleTriggers = function () {
        return this.resources.simpleTriggers.query().$promise;
    };

    InEngineApi.prototype.deleteSimpleTrigger = function (trigger) {
        return this.resources.simpleTriggers.remove(trigger).$promise;
    };

    InEngineApi.prototype.getTimeZones = function () {
        return this.resources.timeZones.query().$promise;
    };

    InEngineApi.prototype.getJobTypes = function () {
        return this.resources.jobTypes.query().$promise;
    };

    InEngineApi.prototype.getHealthStatus = function () {
        return this.resources.healthStatus.query().$promise;
    };

    angular.module('eehInEngine.api', ['ngResource'])
        .provider('eehInEngineApiConfiguration', InEngineApiConfigurationProvider)
        .service('eehInEngineApi', ['$resource', 'eehInEngineApiConfiguration', InEngineApi]);
}(angular));
