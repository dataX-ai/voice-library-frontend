const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

// Determine platform-specific settings
const isWindows = process.platform === 'win32';

module.exports = {
  packagerConfig: {
    name: 'VoiceStudio',
    executableName: isWindows ? 'VoiceStudio' : 'voice-studio-app', // Different naming as Linux has stricter naming requirements
    asar: true,
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
    ],
    icon: './assets/icons/icon' // Electron will automatically use the right extension based on the platform
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'VoiceStudio',
        setupExe: 'VoiceStudio-Setup.exe',
        setupIcon: './assets/icons/icon.ico'
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
          name: 'voice-studio-app',
          icon: './assets/icons/icon.png',
          scripts: {
            postinst: 'src/main/installers/linux-post-install.sh'
          }
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          name: 'voice-studio-app'
        }
      },
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
              },
            },
          ],
        },
      },
    },
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ]
};
