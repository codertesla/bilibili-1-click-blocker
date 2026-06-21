const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const scriptPath = path.join(__dirname, '..', 'script.user.js');
const source = fs.readFileSync(scriptPath, 'utf8');

function section(startMarker, endMarker) {
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start + startMarker.length);
    assert.notEqual(start, -1, `missing section start: ${startMarker}`);
    assert.notEqual(end, -1, `missing section end: ${endMarker}`);
    return source.slice(start, end);
}

test('metadata and runtime versions stay aligned', () => {
    const metadata = source.match(/\/\/ @version\s+(\S+)/);
    const runtime = source.match(/const VERSION = '([^']+)'/);
    assert.ok(metadata);
    assert.ok(runtime);
    assert.equal(metadata[1], runtime[1]);
});

test('video content observer is restricted to the right column', () => {
    const selectors = section('const PAGE_OBSERVER_SELECTORS', 'const VIDEO_PLAYER_ROOT_SELECTOR');
    const videoSelector = selectors.match(/video:\s*\[[^\]]*\]/)?.[0];
    assert.equal(videoSelector, "video: ['.right-container']");
});

test('buttons use inline mounts without detached overlay infrastructure', () => {
    assert.match(source, /createElement\('span'\)/);
    assert.match(source, /bili-blacklist-inline/);
    assert.doesNotMatch(source, /attachShadow|blacklist-overlay|positionVideoCardOverlays|positionHomeCardOverlays/);
    assert.doesNotMatch(source, /addEventListener\('scroll'/);
});

test('inline mounts are safe siblings instead of children of author links', () => {
    const mounts = section('// ==================== 受控内联挂载', '// ==================== 统一入口');
    assert.match(mounts, /anchor\.insertAdjacentElement\('afterend', mount\)/);
    assert.match(mounts, /link\.insertAdjacentElement\('afterend', mount\)/);
    assert.match(mounts, /top\.appendChild\(mount\)/);
    assert.doesNotMatch(mounts, /link\.appendChild\(.*bilibili-blacklist/s);
});

test('inline mounts are idempotent and replace stale UIDs on reused cards', () => {
    const mounts = section('function createInlineMount(', '// ==================== 页面处理：首页');
    assert.match(mounts, /existing\.dataset\.biliBlacklistUid === uid/);
    assert.match(mounts, /if \(existing\) existing\.remove\(\)/);
    assert.match(mounts, /mount\.dataset\.biliBlacklistUid = uid/);
});

test('ad filtering is non-destructive', () => {
    const ads = section('function markAdCards(', 'function applyAdFilterState()');
    assert.match(ads, /classList\.add\('bili-blacklist-hidden-ad-card'\)/);
    assert.doesNotMatch(ads, /\.remove\s*\(/);
});

test('global Shadow DOM scanning and paid-page bypass stay removed', () => {
    assert.doesNotMatch(source, /shadowRootRegistry|queryAllDeep|scheduleShadowScan|isChargeProtectedVideoPage/);
    assert.doesNotMatch(source, /not-charge-high-level-cover/);
});

test('content mutations are processed incrementally', () => {
    const handler = section('function scheduleContentRoot(', 'function resetPageState()');
    assert.match(handler, /mutation\.addedNodes/);
    assert.match(handler, /processPageRoot\(item, false\)/);
    assert.match(handler, /isInsideVideoPlayer\(root\)/);
    assert.match(handler, /root\.closest\('\.bili-blacklist-inline'\)/);
    assert.match(handler, /requestAnimationFrame/);
});

test('SPA lifecycle removes owned inline nodes and rebinds content', () => {
    const observer = section('function resetPageState()', '// ==================== 样式注入');
    assert.match(observer, /clearTimeout\(observerRebindTimer\)/);
    assert.match(observer, /removeInlineButtons\(\)/);
    assert.match(observer, /handleRouteChange\(\)/);
});
