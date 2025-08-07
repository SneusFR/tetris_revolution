// Dans votre route GET /api/shop/themes, remplacez :
themes.push({
  ...themeData,
  owned: isOwned,  // ❌ PROBLÈME ICI
  canPurchase: !isOwned
});

// Par :
themes.push({
  ...themeData,
  isOwned: isOwned,  // ✅ CORRECTION
  canPurchase: !isOwned
});

// Dans votre route GET /api/shop/effects, remplacez :
effects.push({
  ...effectData,
  owned: isOwned,  // ❌ PROBLÈME ICI
  canPurchase: !isOwned
});

// Par :
effects.push({
  ...effectData,
  isOwned: isOwned,  // ✅ CORRECTION
  canPurchase: !isOwned
});
