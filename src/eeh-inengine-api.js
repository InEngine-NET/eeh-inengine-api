(function (angular) {
    'use strict';

    /**
     * Make the first letter of the keys of a response object, or an array of objects, lowercase.
     *
     * @param data
     * @returns {*}
     */
    function transformResponse(data) {
        var responseObject = angular.fromJson(data);
        if (angular.isArray(responseObject)) {
            return responseObject.map(function (item) {
                return transformResponse(item);
            });
        } else if (angular.isObject(responseObject)) {
            var item = angular.isObject(data) ? data : angular.fromJson(data);
            return angular.forEach(item, function (value, key) {
                var lowerCaseKey = key.length <= 1 ? key.toLowerCase() : key.substring(0, 1).toLowerCase() + key.substring(1);
                item[lowerCaseKey] = value;
                delete item[key];
            });
        }
    }

    /**
     * This service is the implementation of the inEngineApi configuration provider.
     * It injected into the inEngineApi service which allows the latter to be configured.
     *
     * tl;dr You probably do not need to use this service.
     *
     * @param apiUrl
     * @param endpointNames
     * @constructor
     */
    var InEngineApiConfiguration = function (apiUrl, endpointNames) {
        this._apiUrl = apiUrl;
        this._endpointNames = endpointNames;
        this._actions = {
            'get':    { method:'GET', transformResponse: transformResponse },
            'update': { method:'PUT', transformResponse: transformResponse },
            'save':   { method:'POST',transformResponse: transformResponse },
            'query':  { method:'GET', transformResponse: transformResponse, isArray:true },
            'remove': { method:'DELETE', transformResponse: transformResponse },
            'delete': { method:'DELETE', transformResponse: transformResponse }
        };
    };

    /**
     * Get the API url.
     *
     * @returns {string}
     */
    InEngineApiConfiguration.prototype.apiUrl = function () {
        return this._apiUrl;
    };

    /**
     * A list of end point names.
     *
     * @returns {*}
     */
    InEngineApiConfiguration.prototype.endpointNames = function () {
        return this._endpointNames;
    };

    InEngineApiConfiguration.prototype.actions = function () {
        return this._actions;
    };

    /**
     * The provider for the inEngineAPI configuration service.
     * This provider is used to configure the inEngineAPI service in an including module's .config method.
     * For instance, it is possible to change the API URL like this (in a module called 'myApp')...
     *
     * angular.module('myApp', ['inEngine.api']).config(function (eehInEngineApiConfigurationProvider) {
     *     eehInEngineApiConfigurationProvider.api('http://my-website:8080/api');
     * });
     *
     * @constructor
     */
    var InEngineApiConfigurationProvider = function () {
        this._apiUrl = 'http://localhost:9001/api';
        this._endpointNames = {
            cronTrigger: 'CronTrigger',
            jobType: 'JobType',
            simpleTrigger: 'SimpleTrigger',
            timeZone: 'TimeZone',
            healthStatus: 'HealthStatus'
        };
        this.$get = function () {
            return new InEngineApiConfiguration(this._apiUrl, this._endpointNames);
        };
    };

    /**
     * Get or set the API URL.
     *
     * @param value
     * @returns {string}
     */
    InEngineApiConfigurationProvider.prototype.apiUrl = function (value) {
        if (angular.isUndefined(value)) {
            return this._apiUrl;
        }
        this._apiUrl = value;
    };

    /**
     * Get or set the API endpoint map.
     *
     * @param value
     * @returns {{cronTrigger: string, jobType: string, simpleTrigger: string, timeZone: string, healthStatus: string}|*}
     */
    InEngineApiConfigurationProvider.prototype.endpointNames = function (value) {
        if (angular.isUndefined(value)) {
            return this._endpointNames;
        }
        this._endpointNames = value;
    };

    /**
     * This service used to interact with an instance of the InEngine.NET Web API.
     *
     * @param $resource
     * @param eehInEngineApiConfiguration
     * @constructor
     */
    var InEngineApi = function ($resource, eehInEngineApiConfiguration) {
        this.$resource = $resource;
        var config = eehInEngineApiConfiguration;
        var endpointNames = config.endpointNames();
        function getResource (endpointName ) {
            var resourceName = config.apiUrl() + '/' + endpointName + '/:id';
            return $resource(resourceName, {id:'@id'}, config.actions());
        }
        this.resources = {
            cronTriggers:   getResource(endpointNames.cronTrigger),
            simpleTriggers: getResource(endpointNames.simpleTrigger),
            timeZones: getResource(endpointNames.timeZone),
            jobTypes: getResource(endpointNames.jobType),
            healthStatus: getResource(endpointNames.healthStatus)
        }
    };

    /**
     * Query for a list of cron triggers.
     *
     * @returns {$promise|*}
     */
    InEngineApi.prototype.getCronTriggers = function () {
        return this.resources.cronTriggers.query().$promise;
    };

    /**
     * Delete a cron trigger.
     *
     * @param trigger
     * @returns {$promise|*}
     */
    InEngineApi.prototype.deleteCronTrigger = function (trigger) {
        return this.resources.cronTriggers.remove(trigger).$promise;
    };

    /**
     * Pause a trigger given a trigger resource.
     * Use the pauseCronTrigger or pauseSimpleTrigger methods instead.
     *
     * @param trigger
     * @param triggerResource
     * @returns {$promise|*}
     */
    InEngineApi.prototype._pauseTrigger = function (trigger, triggerResource) {
        var request = angular.copy(trigger);
        request.stateId = +(!request.stateId);
        return triggerResource.update({id: trigger.id}, request).$promise;
    };

    /**
     * Pause a cron trigger.
     *
     * @param trigger
     * @returns {$promise|*}
     */
    InEngineApi.prototype.pauseCronTrigger = function (trigger) {
        return this._pauseTrigger(trigger, this.resources['cronTriggers']);
    };

    /**
     * Pause a simple trigger.
     *
     * @param trigger
     * @returns {$promise|*}
     */
    InEngineApi.prototype.pauseSimpleTrigger = function (trigger) {
        return this._pauseTrigger(trigger, this.resources['simpleTriggers']);
    };

    /**
     * Query for a list of simple triggers.
     *
     * @returns {$promise|*}
     */
    InEngineApi.prototype.getSimpleTriggers = function () {
        return this.resources.simpleTriggers.query().$promise;
    };

    /**
     * Delete a simple trigger.
     *
     * @param trigger
     * @returns {$promise|*}
     */
    InEngineApi.prototype.deleteSimpleTrigger = function (trigger) {
        return this.resources.simpleTriggers.remove(trigger).$promise;
    };

    /**
     * Query for a list of time zones.
     *
     * @returns {$promise|*}
     */
    InEngineApi.prototype.getTimeZones = function () {
        return this.resources.timeZones.query().$promise;
    };

    /**
     * Query for a list of available job types.
     *
     * @returns {$promise|*}
     */
    InEngineApi.prototype.getJobTypes = function () {
        return this.resources.jobTypes.query().$promise;
    };

    /**
     * Get the health status server resources.
     *
     * @returns {$promise|*}
     */
    InEngineApi.prototype.getHealthStatus = function () {
        return this.resources.healthStatus.get().$promise;
    };

    angular.module('eehInEngine.api', ['ngResource'])
        .provider('eehInEngineApiConfiguration', InEngineApiConfigurationProvider)
        .service('eehInEngineApi', ['$resource', 'eehInEngineApiConfiguration', InEngineApi]);
}(angular));
