(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['backbone', 'underscore'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('backbone'), require('underscore'));
    } else {
        root.Backbone.Mixture = factory(root.Backbone, root._);
    }
})(this, function factory(Backbone, _) {
    function noop() {}
    var assign = _.assign || _.extend;
    var Mixture = function () {};
    Mixture.extend = Backbone.Model.extend;
    Mixture.VERSION = '0.0.2';
    Mixture.implement = function (implementation, statics) {
        if (!implementation.id) {
            implementation = assign({id: _.uniqueId('mixture')}, implementation);
        }
        return this.extend(implementation, statics);
    };

    Mixture.mixin = Backbone.View.mixin = Backbone.Model.mixin = Backbone.Collection.mixin = Backbone.Router.mixin = mixin;

    function interceptBefore(object, methodName, fn) {
        var method = object[methodName] || noop;
        if (!_.isFunction(fn)) {
            return (object[methodName] = method);
        }
        return (object[methodName] = function () {
            if (fn.apply(this, arguments) !== false) {
                return method.apply(this, arguments);
            }
        });
    }

    function interceptAfter(object, methodName, fn) {
        var method = object[methodName] || noop;
        if (!_.isFunction(fn)) {
            return (object[methodName] = method);
        }
        return (object[methodName] = function () {
            var ret = method.apply(this, arguments);
            fn.apply(this, arguments);
            return ret;
        });
    }

    function mixin() {
        return _.reduce(_.flatten(arguments), function (cls, mixture) {
            var proto = cls.prototype;
            var mixins = proto.__mixins__ = proto.__mixins__ || {};
            var toOmit = ['constructor', 'id', 'beforeHooks', 'afterHooks', 'mixins'];
            var implementation = _.isFunction(mixture) ? mixture.prototype || new mixture() : mixture;
            if (!_.isObject(implementation)) {
                return cls;
            }
            var mixinId = implementation.id;
            if (mixinId && mixins[mixinId]) {
                return cls;
            }
            if (implementation.mixins) {
                cls = mixin.apply(cls, implementation.mixins);
            }
            var beforeHooks = implementation.beforeHooks;
            var afterHooks = implementation.afterHooks;
            if (_.isObject(beforeHooks)) {
                _.each(beforeHooks, function (from, to) {
                    if (to === Number(to)) {
                        to = from;
                    }
                    interceptBefore(proto, to, implementation[from]);
                    toOmit.push(from);
                });
            }
            if (_.isObject(afterHooks)) {
                _.each(afterHooks, function (from, to) {
                    if (to === Number(to)) {
                        to = from;
                    }
                    interceptAfter(proto, to, implementation[from]);
                    toOmit.push(from);
                });
            }
            assign(proto, _.omit(implementation, toOmit));
            assign(cls, _.omit(mixture, ['extend', 'implement', 'mixin', 'VERSION', '__super__']));
            mixins[mixinId] = mixture;
            return cls;
        }, this);
    }

    return Mixture;

});