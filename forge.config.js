const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
packagerConfig: {
asar: true,
executableName: 'voice-studio-app',
    asarUnpack: [
      "src/main/runtimes/scripts/*",
      "src/main/installers/*"
    ],
    extraResource: [
      './src/main/runtimes/scripts',
      "./src/main/installers/50-docker.rules"
    ],
    out: './out',
    ignore: [
      /^\/(?!\.webpack|src|package\.json)/,
      /\/[.](git|DS_Store)$/,
      /\/node_modules\//,
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'voice_studio_app',
        setupExe: 'VoiceStudio-Setup.exe',
        exe: 'VoiceStudio.exe'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Euler Labs',
          homepage: 'https://voicestudio.2vid.ai',
          scripts: {
            postinst: 'src/main/installers/linux-post-install.sh'
          }
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
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
                config: './webpack.renderer.config.js'
              },
              outputPath: 'main_window'
            }
          ]
        },
        devContentSecurityPolicy: "connect-src 'self' * 'unsafe-eval'",
        port: 5173,
        loggerPort: 9000
      }
    }
  ]
};
