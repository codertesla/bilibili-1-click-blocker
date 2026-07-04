const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', 'script.user.js');
const source = fs.readFileSync(scriptPath, 'utf8');

function section(startMarker, endMarker) {
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start + startMarker.length);
    assert.notEqual(start, -1, `missing section start: ${startMarker}`);
    assert.notEqual(end, -1, `missing section end: ${endMarker}`);
    return source.slice(start, end);
}

function functionSource(name) {
    const start = source.indexOf(`function ${name}(`);
    assert.notEqual(start, -1, `missing function: ${name}`);
    const bodyStart = source.indexOf('{', start);
    let depth = 0;
    for (let i = bodyStart; i < source.length; i++) {
        if (source[i] === '{') depth++;
        if (source[i] === '}') depth--;
        if (depth === 0) return source.slice(start, i + 1);
    }
    assert.fail(`unterminated function: ${name}`);
}

test('metadata and runtime versions stay aligned', () => {
    const metadata = source.match(/\/\/ @version\s+(\S+)/);
    const runtime = source.match(/const VERSION = '([^']+)'/);
    assert.ok(metadata);
    assert.ok(runtime);
    assert.equal(metadata[1], runtime[1]);
});

test('video content observer is restricted to the right column', () => {
    const selectors = section('const PAGE_OBSERVER_SELECTORS', '// B 站不同版本播放器');
    const videoSelector = selectors.match(/video:\s*\[[^\]]*\]/)?.[0];
    assert.equal(videoSelector, "video: ['.right-container']");
});

test('player state observer never watches the player subtree', () => {
    const observer = section('function attachVideoPlayerStateObserver()', 'function detachVideoPlayerStateObserver()');
    assert.match(observer, /subtree:\s*false/);
    assert.doesNotMatch(observer, /subtree:\s*true/);
});

test('ad filtering is non-destructive', () => {
    const ads = section('function markAdCards(', 'function applyAdFilterState()');
    assert.match(ads, /classList\.add\('bili-blacklist-hidden-ad-card'\)/);
    assert.doesNotMatch(ads, /\.remove\s*\(/);
});

test('ad attribution URLs expose only explicit owner ids', () => {
    const extractUid = vm.runInNewContext(`(${functionSource('extractUid')})`);
    assert.equal(extractUid('//cm.bilibili.com/foo?space_mid=123'), '123');
    assert.equal(extractUid('//cm.bilibili.com/foo?payload=%7B%22video_up_mid%22%3A456%7D'), '456');
    assert.equal(extractUid('https://cm.bilibili.com/987654/path'), '');
    assert.equal(extractUid('/123'), '123');
});

test('video recommendation processing includes special ad cards', () => {
    const processor = section('function extractVideoRecommendationOwnerInfo(', 'function scheduleVideoPageRetry()');
    assert.match(processor, /video-page-card-small,\s*\.video-page-special-card-small/);
    assert.match(processor, /querySelectorAll\('a\[href\]'\)/);
    assert.match(processor, /extractUid\(item\.getAttribute\('href'\)\)/);
});

test('global Shadow DOM scanning and paid-page bypass stay removed', () => {
    assert.doesNotMatch(source, /shadowRootRegistry|queryAllDeep|scheduleShadowScan|isChargeProtectedVideoPage/);
    assert.doesNotMatch(source, /not-charge-high-level-cover/);
});

test('overlays hide when their native anchors are covered', () => {
    const positioning = section('function isAnchorOccluded(', 'function mountVideoProfileOverlay(');
    assert.match(positioning, /document\.elementsFromPoint/);
    assert.match(positioning, /element !== overlayHost/);
    assert.match(positioning, /isAnchorOccluded\(rect, videoProfileTarget\)/);
    assert.match(positioning, /isAnchorOccluded\(rect, card\)/);
});

test('real buttons are never inserted into Bilibili component DOM', () => {
    assert.doesNotMatch(source, /bili-blacklist-inline|insertAdjacentElement/);
});

test('content mutations are processed incrementally', () => {
    const handler = section('function handleContentMutations(', 'function resetPageState()');
    assert.match(handler, /mutation\.addedNodes/);
    assert.match(handler, /processPageRoot\(root, false\)/);
    assert.match(handler, /isInsideVideoPlayer\(root\)/);
});

test('SPA lifecycle rebinds content and late player roots', () => {
    const observer = section('function resetPageState()', '// ==================== 样式注入');
    assert.match(observer, /clearTimeout\(observerRebindTimer\)/);
    assert.match(observer, /handleRouteChange\(\)/);
    assert.match(observer, /getPageKind\(\) === 'video'\) attachVideoPlayerStateObserver\(\)/);
});
