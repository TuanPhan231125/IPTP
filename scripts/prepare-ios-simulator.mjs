import {execFileSync} from 'node:child_process';
const simctl = (...args) => execFileSync('xcrun', ['simctl', ...args], {encoding:'utf8'}).trim();
const runtimes = () => JSON.parse(simctl('list','runtimes','--json')).runtimes;
let runtime = runtimes().find(r => r.version === '18.5' && r.isAvailable);
if (!runtime) {
  console.error('Installing the iOS 18.5 runtime required by the native tests.');
  execFileSync('xcodebuild', ['-downloadPlatform','iOS','-buildVersion','18.5'], {stdio:['ignore',2,2]});
  runtime = runtimes().find(r => r.version === '18.5' && r.isAvailable);
}
if (!runtime) throw new Error('iOS 18.5 runtime unavailable; native tests must not be skipped.');
const devices = JSON.parse(simctl('list','devices','available','--json')).devices[runtime.identifier] || [];
const device = devices.find(d => d.name === 'iPhone 16');
const id = device?.udid || simctl('create','TPUGSOUND Test iPhone','com.apple.CoreSimulator.SimDeviceType.iPhone-16',runtime.identifier);
console.log(id);
