const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: {
      unpack: "*.{bat,sh}"
    },
    extraResource: [
      './src/main/runtimes/scripts'
    ],
    out: './out'
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'voice_studio_app',
        setupExe: 'VoiceStudio-Setup.exe',
        exe: 'VoiceStudio.exe'
      }
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/renderer/index.html',
              js: './src/renderer/renderer.js',
              name: 'main_window',
              preload: {
                js: './src/preload/preload.js',
                config: './webpack.renderer.config.js',
                config: {
                  name: 'preloadConfig'
                }
              }
            }
          ]
        },
        port: 5173,
        loggerPort: 9000
      }
    }
  ]
};
