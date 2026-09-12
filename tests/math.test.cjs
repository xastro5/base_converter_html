const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const source = html.split('// BEGIN INTEGER MATH')[1].split('// END INTEGER MATH')[0];
const math = vm.runInNewContext(source.slice(source.indexOf('\n')) + '\nIntegerMath;');
let comparisons = 0;
function equal(actual, expected, label) { comparisons++; assert.equal(actual, expected, label); }
function reference(value, width, base) {
  const full = 2n ** BigInt(width), half = full / 2n;
  const magnitude = value < 0n ? -value : value;
  const allowed = magnitude < half;
  const unsigned = value < 0n ? full + value : value;
  const bits = magnitude.toString(2).padStart(width, '0');
  return {
    binInput: value.toString(2), octInput: value.toString(8), decInput: value.toString(),
    hexInput: value.toString(16).toUpperCase(), customInput: value.toString(base),
    signMagInput: allowed ? (value < 0n ? '1' : '0') + bits.slice(1) : null,
    onesInput: allowed ? (value < 0n ? bits.replace(/[01]/g, x => x === '0' ? '1' : '0') : bits) : null,
    twosInput: unsigned.toString(2).padStart(width, '0'), unsigned: unsigned.toString()
  };
}
function check(value, width, base) {
  const actual = math.represent(value, width, base), expected = reference(value, width, base);
  for (const key of Object.keys(expected)) equal(actual[key], expected[key], `${width}-bit ${value}, base ${base}, ${key}`);
  for (const [id, radix] of [['binInput',2],['octInput',8],['decInput',10],['hexInput',16],['customInput',base]]) {
    const parsed = math.parseRadix(actual[id], radix);
    equal(parsed.status, 'valid'); equal(parsed.value, value, `${id} round trip`);
  }
  for (const [id,kind] of [['signMagInput','sm'],['onesInput','ones'],['twosInput','twos']]) {
    if (actual[id] !== null) {
      const parsed = math.parsePattern(actual[id], width, kind);
      equal(parsed.status, 'valid'); equal(parsed.value, value, `${id} round trip`);
    }
  }
}

test('all signed values at widths 1–10, every base 2–36', () => {
  for (let width = 1; width <= 10; width++) {
    const half = 2n ** BigInt(width - 1);
    for (let value = -half; value < half; value++) for (let base = 2; base <= 36; base++) check(value, width, base);
  }
});

test('every advertised width 1–128: exact boundaries and seeded samples in every base', () => {
  let seed = 0x962547fabde314n;
  const next = () => { seed = (seed * 6364136223846793005n + 1442695040888963407n) % (2n ** 128n); return seed; };
  for (let width = 1; width <= 128; width++) {
    const full = 2n ** BigInt(width), half = full / 2n;
    const samples = new Set([-half, -half + 1n, half - 1n, -1n, 0n]);
    for (let i = 0; i < 20; i++) samples.add(next() % full - half);
    for (const value of samples) for (let base = 2; base <= 36; base++) check(value, width, base);
  }
});

test('decode every possible bit pattern at widths 1–10, including negative zero', () => {
  for (let width = 1; width <= 10; width++) {
    const half = 2 ** (width - 1), full = 2 ** width;
    for (let raw = 0; raw < full; raw++) {
      const bits = raw.toString(2).padStart(width, '0');
      const negative = raw >= half;
      equal(math.parsePattern(bits,width,'sm').value, BigInt(negative ? -(raw - half) : raw));
      equal(math.parsePattern(bits,width,'ones').value, BigInt(negative ? -(full - 1 - raw) : raw));
      equal(math.parsePattern(bits,width,'twos').value, BigInt(negative ? raw - full : raw));
    }
  }
});

test('normalize signs, whitespace and corresponding prefixes without changing meaning', () => {
  for (const [raw,base,expected] of [['−0x 3B',16,-59n],['-0B11\n1011',2,-59n],['\u00a0−0o73 ',8,-59n],['+00059',10,59n],['0B',16,11n],['0xff',36,43323n],['-0',10,0n]]) {
    const result = math.parseRadix(raw,base); equal(result.status,'valid'); equal(result.value,expected,raw);
  }
  equal(math.parsePattern('0b 1100\n0101',8,'twos').value,-59n);
  for (const raw of ['-', '−', '+', '-0x', '0x']) equal(math.parseRadix(raw,16).status,'incomplete');
  for (const [raw,base] of [['GG',16],['2',2],['8',8],['1.2',10],['1e3',10],['--1',10],['0xFF',10]]) equal(math.parseRadix(raw,base).status,'invalid');
  equal(math.parseRadix('9'.repeat(1025),10).status,'invalid');
  equal(math.parseRadix(' \n',10).status,'empty');
  equal(math.parsePattern('-0000001',8,'twos').status,'invalid');
  equal(math.parsePattern('111',8,'twos').status,'invalid');
});

test('all 65,536 sixteen-bit patterns match an independent weighted-bit decoder', () => {
  function decode(bits,kind) {
    let magnitude=0n,invertedMagnitude=0n;
    for(let i=1;i<bits.length;i++) {
      const weight=2n**BigInt(bits.length-1-i);
      if(bits[i]==='1')magnitude+=weight;else invertedMagnitude+=weight;
    }
    if(bits[0]==='0')return magnitude;
    if(kind==='sm')return -magnitude;
    if(kind==='ones')return -invertedMagnitude;
    return magnitude-2n**BigInt(bits.length-1);
  }
  for(let n=0;n<65536;n++) {
    const bits=n.toString(2).padStart(16,'0');
    for(const kind of ['sm','ones','twos'])equal(math.parsePattern(bits,16,kind).value,decode(bits,kind));
  }
  for(let width=1;width<=128;width++) {
    const samples=['0'.repeat(width),'1'.repeat(width),'1'+'0'.repeat(width-1),'0'+'1'.repeat(width-1),'10'.repeat(width).slice(0,width),'01'.repeat(width).slice(0,width)];
    for(const bits of samples)for(const kind of ['sm','ones','twos'])equal(math.parsePattern(bits,width,kind).value,decode(bits,kind));
  }
});

test('reject invalid configuration and out-of-range rendering', () => {
  for (const raw of ['0','129','-1','1.5','1e2','', 'Infinity']) equal(math.boundedInteger(raw,1,128),null);
  equal(math.boundedInteger('128',1,128),128);
  equal(math.boundedInteger('08',1,128),8);
  for (const raw of ['1','37','2.5','2e1','']) equal(math.boundedInteger(raw,2,36),null);
  assert.throws(() => math.represent(128n,8,10));
  assert.throws(() => math.represent(-129n,8,10));
  assert.throws(() => math.represent(1,8,10));
  for (const width of [0,129,1.5,NaN]) assert.throws(() => math.limits(width));
});

test('exact examples from the review and the preserved left/right convention', () => {
  equal(math.represent(-59n,8,10).binInput,'-111011');
  equal(math.represent(-59n,8,10).signMagInput,'10111011');
  equal(math.represent(-59n,8,10).onesInput,'11000100');
  equal(math.represent(-59n,8,10).twosInput,'11000101');
  equal(math.represent(-1n,32,10).unsigned,'4294967295');
  equal(math.represent(1n,64,10).twosInput,'0'.repeat(63)+'1');
  equal(math.parseRadix('9007199254740993',10).value,9007199254740993n);
  equal(math.parsePattern('1'.repeat(64),64,'twos').value,-1n);
  equal(math.represent(0n,1,10).signMagInput,'0');
  equal(math.represent(-1n,1,10).signMagInput,null);
  console.log(`${comparisons.toLocaleString()} exact comparisons completed.`);
});
