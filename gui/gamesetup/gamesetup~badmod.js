function badmod_patchModFilter()
{
  if (!global["getFilteredMods"])
    global["getFilteredMods"] = function(gameData) { return Engine.GetEngineInfo().mods };

  // Generate with `ls maps/random/*.js | sed -r 's/(\w|\/)+_triggers.js//g' | sed -r 's/.js//g' | sed -r '/^$/d' | paste -sd "," - | sed -r "s/,/\",\"/g" | sed -r "s/^|$/\"/g"`
  if (!global["balancedMaps"])
    global["balancedMaps"] = [
      "maps/random/badcontinent",
      "maps/random/bad_hyrcanian_shores",
      "maps/random/badmainland_fixed",
      "maps/random/badmainland",
      "maps/random/britannic_road",
      "maps/random/cross",
      "maps/random/slopes",
      "maps/random/wrench_fixed",
      "maps/random/wrench"
    ];

  function isBalancedMap(mapName) {
    return global["balancedMaps"].indexOf(mapName) > -1;
  }

  autociv_patchApplyN("getFilteredMods", function (target, that, args)
  {
  	let mod = ([name, version]) => !/^FGod.*/i.test(name);
  	return target.apply(that, args).filter(mod);
  });

  autociv_patchApplyN("getFilteredMods", function (target, that, args)
  {
  	let mod = ([name, version]) => !/^AutoCiv.*/i.test(name);
  	return target.apply(that, args).filter(mod);
  });

  autociv_patchApplyN("getFilteredMods", function (target, that, args)
  {
  	let mod = ([name, version]) => (!/^balanced[-_]maps.*/i.test(name) || isBalancedMap(args[0].map));

  	return target.apply(that, args).filter(mod);
  });
}

autociv_patchApplyN("init", function (target, that, args)
{
	target.apply(that, args);
	badmod_patchModFilter();
})
