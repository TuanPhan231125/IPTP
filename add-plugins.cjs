const xcode = require('xcode');
const fs = require('fs');

const projectPath = 'ios/App/App.xcodeproj/project.pbxproj';
const myProj = xcode.project(projectPath);

myProj.parse(function (err) {
    if (err) {
        console.error('Error parsing project:', err);
        process.exit(1);
    }
    
    const targetUuid = myProj.getFirstTarget().uuid;
    const appDir = 'ios/App/App';
    const files = fs.readdirSync(appDir)
        .filter(f => f.endsWith('.swift') || f.endsWith('.m'))
        .filter(f => f !== 'AppDelegate.swift'); // AppDelegate is usually already there

    // Find the group key for the "App" group
    const groups = myProj.hash.project.objects['PBXGroup'];
    let appGroupKey;
    for (const key in groups) {
        if (groups[key].name === 'App' || groups[key].path === 'App') {
            appGroupKey = key;
            break;
        }
    }

    if (!appGroupKey) {
        console.error('Could not find App group');
        process.exit(1);
    }

    files.forEach(file => {
        // Add file to project
        myProj.addSourceFile(file, { target: targetUuid }, appGroupKey);
        console.log('Added:', file);
    });

    fs.writeFileSync(projectPath, myProj.writeSync());
    console.log('Successfully updated project.pbxproj');
});
