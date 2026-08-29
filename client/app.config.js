const PROD_API_URL = 'https://gorave.uilora.com'

const APP_ENV = process.env.APP_ENV || 'development'
const allowCleartext = APP_ENV === 'development'

module.exports = ({ config }) => {
  const apiUrl = APP_ENV === 'development' ? config.extra.apiUrl : PROD_API_URL

  const plugins = config.plugins.map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'expo-build-properties') {
      return [
        plugin[0],
        {
          ...plugin[1],
          android: {
            ...plugin[1].android,
            usesCleartextTraffic: allowCleartext,
          },
        },
      ]
    }
    return plugin
  })

  return {
    ...config,
    plugins,
    extra: {
      ...config.extra,
      apiUrl,
    },
  }
}
