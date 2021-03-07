GameRegisterStanza = new Proxy(GameRegisterStanza, {
    construct: function (target, args)
    {
        let instance = new target(...args);
        let mod = ([name, version]) => !/^balanced[-_]maps.*/i.test(name);
        instance.mods = JSON.stringify(JSON.parse(instance.mods).filter(mod));
        return instance;
    }
});
