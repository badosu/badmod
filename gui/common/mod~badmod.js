global["balancedMapsCompatibilityMatcher"] = new RegExp('^0\\.19(\\.|$)', 'i');

autociv_patchApplyN("hasSameMods", function (target, that, args)
{
	let mod = ([name, version]) => !/^FGod.*/i.test(name);
	return target.apply(that, args.map(mods => mods.filter(mod)));
})

autociv_patchApplyN("hasSameMods", function (target, that, args)
{
	let mod = ([name, version]) => !/^AutoCiv.*/i.test(name);
	return target.apply(that, args.map(mods => mods.filter(mod)));
})

autociv_patchApplyN("hasSameMods", function (target, that, args)
{
  let nameFilter = (name) => !/^balanced[-_]maps.*/i.test(name);
  let compatibilityFilter = ([name, version]) => (nameFilter(name) || global["balancedMapsCompatibilityMatcher"].test(version));

  if (args[0].every(compatibilityFilter)) {
    return target.apply(that, args.map(mods => mods.filter(nameFilter)));
  } else {
    return target.apply(that, args);
  }
})
