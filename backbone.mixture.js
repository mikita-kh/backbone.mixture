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
    Mixture.VERSION = '0.0.1';
    Mixture.implement = function (implementation) {
        if (!implementation.id) {
            implementation = assign({id: _.uniqueId('mixture')}, implementation);
        }
        return implementation;
    };

    Mixture.mixin = Backbone.View.mixin = Backbone.Model.mixin = Backbone.Collection.mixin = Backbone.Router.mixin = mixin;

    function interceptBefore(object, methodName, fn) {
        var method = object[methodName] || noop;
        return (object[methodName] = function () {
            if (fn.apply(this, arguments) !== false) {
                return method.apply(this, arguments);
            }
        });
    }

    function interceptAfter(object, methodName, fn) {
        var method = object[methodName] || noop;
        return (object[methodName] = function () {
            var ret = method.apply(this, arguments);
            fn.apply(this, arguments);
            return ret;
        });
    }

    function mixin() {
        return _.reduce(_.flatten(arguments), function (cls, mixin) {
            var proto = cls.prototype;
            var mixins = proto.__mixins__ = proto.__mixins__ || {};
            var toOmit = ['constructor', 'id', 'beforeHooks', 'afterHooks', 'mixins'];
            var mixinId = mixin.id;
            if (mixins[mixinId]) {
                return cls;
            }
            if (mixin.mixins) {
                cls = mixin.apply(cls, mixin.mixins);
            }
            var beforeHooks = mixin.beforeHooks;
            var afterHooks = mixin.afterHooks;
            if (_.isObject(beforeHooks)) {
                _.each(beforeHooks, function (from, to) {
                    interceptBefore(proto, to, mixin[from]);
                    toOmit.push(from);
                });
            }
            if (_.isObject(afterHooks)) {
                _.each(afterHooks, function (from, to) {
                    interceptAfter(proto, to, mixin[from]);
                    toOmit.push(from);
                });
            }
            mixin = _.omit(mixin, toOmit);
            if (!beforeHooks && !afterHooks) {
                assign(proto, mixin);
            } else {
                cls = cls.extend(mixin);
                mixins = cls.prototype.__mixins__ = assign({}, mixins);
            }
            mixins[mixinId] = mixin;
            return cls;
        }, this);
    }

    return Mixture;

});