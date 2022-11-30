
module.exports = {
    hidden: function (featureManager) {
        return !(featureManager.features.cosmetics?.["class"]?.playerHasACosmeticA || false)
    }
}