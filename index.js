/*!
 * Prowl - powerful routing manager middleware for Express
 *
 * @author Eugene Nezhuta <eugene.nezhuta@gmail.com>
 * Copyright(c) 2015 Eugene Nezhuta
 * MIT Licensed
 */

/**
 * Module dependencies
 */

var express = require('express');

/**
 * @param {Object} config
 * @return {Function}
 */
exports = module.exports = function prowl(config) {

    if (!config) {
        throw new TypeError('configuration required');
    }

    if (typeof config !== 'object') {
        throw new TypeError('configuration should be an object');
    }

    if (!config.paths) {
        throw new TypeError('configuration paths required');
    }

    if (!config.paths.controllers) {
        throw new TypeError('configuration paths controllers required');
    }

    if (!config.resources) {
        throw new TypeError('configuration resources required');
    }

    return function prowl(req, res, next) {

        // iterate through resources and register proper routes
        config.resources.forEach(function(resource, index) {

            for (var urlConfig in resource.routes) {
                var routeData  = parseResourceUrlConfig(urlConfig),
                    router     = express.Router(),
                    module     = resource.module || '',
                    controllersPath = config.paths.controllers.replace('*', module),
                    controller = require(controllersPath + routeData['controller']),
                    middleware = loadResourceRouteMiddleware(resource.routes[urlConfig]);

                router[routeData['type']](routeData['url'], middleware, controller[routeData['action']]);
            }

            req.app.use(resource.mount, router);

        });

        return next();
    }
};

/**
 * Parse resource 'url config' and prepare an object with request type, route url cntroller and action
 *
 * @param {String} urlConfig e.g 'get /:name users/hello'
 * @returns {{type: *, url: *, controller: *, action: *}}
 * @private
 */
var parseResourceUrlConfig = function(urlConfig) {
    var splitted = urlConfig.split(' ');

    return {
        'type'       : splitted[0],
        'url'        : splitted[1],
        'controller' : splitted[2].split('@')[0],
        'action'     : splitted[2].split('@')[1]
    }
};

/**
 * Locate and require route-specific middleware, if needed
 *
 * @param {Array} middlewareNames
 * @returns {Array} List of middleware ready to be injected into the route
 * @private
 */
var loadResourceRouteMiddleware = function(middlewareNames) {

    if (!middlewareNames) {
        return [];
    }

    return middlewareNames.map(function(name) {
        return require(config.paths.middlewares + name);
    });
}