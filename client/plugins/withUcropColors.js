const { withAndroidColors } = require('@expo/config-plugins');

module.exports = function withUcropColors(config) {
  return withAndroidColors(config, async (config) => {
    // Ensure the color array exists
    config.modResults = config.modResults || {};
    config.modResults.resources = config.modResults.resources || {};
    config.modResults.resources.color = config.modResults.resources.color || [];
    
    const colors = config.modResults.resources.color;
    
    // Add our custom UCrop colors to override the Android native defaults
    const ucropColors = [
      // Makes the bottom slider panel background black
      { $: { name: 'ucrop_color_widget_background' }, _: '#000000' },
      // Inactive icon color in the bottom panel
      { $: { name: 'ucrop_color_widget' }, _: '#888888' },
      // Active icon color (for scale/rotate)
      { $: { name: 'ucrop_color_widget_active' }, _: '#FFFFFF' },
      // Just in case, override the toolbar text color to ensure it stays white
      { $: { name: 'ucrop_color_toolbar_widget' }, _: '#FFFFFF' }
    ];

    ucropColors.forEach(newColor => {
      const existingIndex = colors.findIndex(c => c.$.name === newColor.$.name);
      if (existingIndex > -1) {
        colors[existingIndex] = newColor;
      } else {
        colors.push(newColor);
      }
    });

    config.modResults.resources.color = colors;
    return config;
  });
};
