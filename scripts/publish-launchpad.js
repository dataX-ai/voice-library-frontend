const shell = require('shelljs');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Read from environment variables with fallbacks
const PPA = process.env.LAUNCHPAD_PPA;
const GPG_KEY = process.env.GPG_KEY;
const DISTRIBUTIONS = ['noble', 'jammy', 'focal', 'bookworm', 'trixie']; // Ubuntu 24.04, 22.04, 20.04, Debian 12, Debian 13

async function main() {
    try {
        // Validate required environment variables
        if (!process.env.LAUNCHPAD_PPA) {
            console.warn('Warning: LAUNCHPAD_PPA not set, using default:', PPA);
        }
        if (!process.env.GPG_KEY) {
            console.warn('Warning: GPG_KEY not set, using default:', GPG_KEY);
        }

        // Read package version from package.json first
        const packageJson = require('../package.json');
        const version = packageJson.version;

        // Check if .deb package exists
        const outDir = path.resolve(__dirname, '../out');
        const debDir = path.join(outDir, 'make/deb/x64');
        
        if (!fs.existsSync(debDir)) {
            console.error('Deb directory not found at:', debDir);
            console.error('Please run "npm run make" first.');
            process.exit(1);
        }

        // Find the .deb file
        const debFiles = fs.readdirSync(debDir).filter(file => file.endsWith('.deb'));
        
        if (debFiles.length === 0) {
            console.error('No .deb package found in:', debDir);
            console.error('Please run "npm run make" first.');
            process.exit(1);
        }

        const debFile = path.join(debDir, debFiles[0]);
        const workDir = path.join(outDir, 'launchpad');
        
        // Clean and create working directory
        fs.removeSync(workDir);
        fs.ensureDirSync(workDir);
        fs.ensureDirSync(path.join(workDir, 'debian'));
        
        // Extract package
        shell.exec(`dpkg-deb -R "${debFile}" "${workDir}"`);

        // Copy debian files
        fs.copyFileSync(
            path.join(__dirname, 'debian/rules'),
            path.join(workDir, 'debian/rules')
        );
        fs.copyFileSync(
            path.join(__dirname, 'debian/control'),
            path.join(workDir, 'debian/control')
        );

        // Make rules executable
        fs.chmodSync(path.join(workDir, 'debian/rules'), '755');

        for (const dist of DISTRIBUTIONS) {
            // Create version with distribution suffix
            const distVersion = `${version}-1~${dist}1`;
            
            // Note the double space before the timestamp
            const changelog = `voice-studio-app (${distVersion}) ${dist}; urgency=medium

  * Release for ${dist}
  * Version ${version}

 -- Kanishka <kanishka@ateulerlabs.ai>  ${new Date().toUTCString().replace('GMT', '+0000')}
`;

            // Write changelog
            fs.writeFileSync(path.join(workDir, 'debian/changelog'), changelog);

            // Build source package
            shell.cd(workDir);
            const buildResult = shell.exec('debuild -S -sa -k' + GPG_KEY);
            
            if (buildResult.code !== 0) {
                console.error(`Failed to build package for ${dist}`);
                continue;
            }

            // Upload to PPA
            const changesFile = `../voice-studio-app_${distVersion}_source.changes`;
            if (fs.existsSync(changesFile)) {
                const uploadResult = shell.exec(`dput ${PPA} ${changesFile}`);
                if (uploadResult.code !== 0) {
                    console.error(`Failed to upload package for ${dist}`);
                }
            } else {
                console.error(`Changes file not found for ${dist}: ${changesFile}`);
            }
        }

        console.log('Upload to Launchpad completed!');
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main(); 