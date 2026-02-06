
let exprEl, resultEl, explanationEl, statsInput;
let mode = 'deg';

document.addEventListener('DOMContentLoaded', ()=>{
	// Transição da splash screen
	const splash = document.getElementById('splash');
	const mainContent = document.getElementById('mainContent');
	const appHeader = document.getElementById('appHeader');
	
	setTimeout(()=>{
		splash.style.pointerEvents = 'none';
		mainContent.style.display = '';
		appHeader.style.display = '';
	}, 3000);

	exprEl = document.getElementById('expr');
	resultEl = document.getElementById('result');
	explanationEl = document.getElementById('explanation');
	statsInput = document.getElementById('statsInput');

	document.querySelectorAll('[data-value]').forEach(b=>b.addEventListener('click', ()=>appendValue(b.dataset.value)));
	document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click', ()=>handleAction(b.dataset.action)));

	document.getElementById('meanBtn').addEventListener('click', ()=>computeStats('mean'));
	document.getElementById('sumBtn').addEventListener('click', ()=>computeStats('sum'));
	document.getElementById('varBtn').addEventListener('click', ()=>computeStats('var'));
	document.getElementById('stdBtn').addEventListener('click', ()=>computeStats('std'));

	document.getElementById('toBin').addEventListener('click', ()=>convert('bin'));
	document.getElementById('toOct').addEventListener('click', ()=>convert('oct'));
	document.getElementById('toHex').addEventListener('click', ()=>convert('hex'));
	document.getElementById('toDec').addEventListener('click', ()=>convert('dec'));

	document.getElementById('helpBtn').addEventListener('click', ()=>openHelp());
	document.getElementById('closeHelp').addEventListener('click', ()=>closeHelp());
	document.getElementById('helpModal').addEventListener('click', (e)=>{
		if(e.target.id === 'helpModal') closeHelp();
	});

	updateDisplay();
});

function appendValue(v){
	if(exprEl.textContent === '0') exprEl.textContent = v;
	else exprEl.textContent += v;
}

function handleAction(a){
	let expr = exprEl.textContent;
	switch(a){
		case 'clear': exprEl.textContent = '0'; resultEl.textContent='0'; explanationEl.textContent=''; break;
		case 'back': exprEl.textContent = expr.slice(0,-1) || '0'; break;
		case 'equals': evaluateAndExplain(); break;
		case 'percent': exprEl.textContent += '/100'; break;
		case 'paren': addParen(); break;
		case 'pow2': exprEl.textContent += '**2'; break;
		case 'pow3': exprEl.textContent += '**3'; break;
		case 'pow': exprEl.textContent += '**'; break;
		case 'sqrt': exprEl.textContent += 'sqrt('; break;
		case 'cbrt': exprEl.textContent += 'cbrt('; break;
		case 'root': exprEl.textContent += 'root('; break;
		case 'inv': exprEl.textContent += '1/(' ; break;
		case 'sin': exprEl.textContent += 'sin(' ; break;
		case 'cos': exprEl.textContent += 'cos(' ; break;
		case 'tan': exprEl.textContent += 'tan(' ; break;
		case 'asin': exprEl.textContent += 'asin(' ; break;
		case 'acos': exprEl.textContent += 'acos(' ; break;
		case 'atan': exprEl.textContent += 'atan(' ; break;
		case 'ln': exprEl.textContent += 'ln(' ; break;
		case 'log': exprEl.textContent += 'log(' ; break;
		case 'exp': exprEl.textContent += 'exp(' ; break;
		case 'tenpow': exprEl.textContent += '10**(' ; break;
		case 'abs': exprEl.textContent += 'abs(' ; break;
		case 'fact': exprEl.textContent += '!' ; break;
		case 'pi': exprEl.textContent += 'π' ; break;
		case 'e': exprEl.textContent += 'e' ; break;
		case 'neg': toggleSign(); break;
		case 'mode': mode = (mode==='deg')? 'rad' : 'deg'; document.querySelector('[data-action="mode"]').textContent = mode==='deg'?'Deg':'Rad'; break;
		case 'sumstats': explanationEl.textContent='Use a lista e os botões Estat.'; break;
		case 'conv': explanationEl.textContent='Use os botões Bin/Oct/Hex/Dec para conversão.'; break;
	}
	updateDisplay();
}

function normalize(s){
	if(!s) return '0';
	return s.replace(/×/g,'*').replace(/÷/g,'/').replace(/[−–]/g,'-').replace(/π/g,'PI').replace(/\be\b/g,'E')
		.replace(/([0-9]+(\.[0-9]+)?)!/g, 'factorial($1)');
}

function safeEval(expr){
	expr = normalize(expr);
	try{
		const fn = new Function('PI','E','mode','sin','cos','tan','asin','acos','atan','ln','log10','sqrt','cbrt','root','abs','exp','factorial','return eval('+JSON.stringify(expr)+')');
		const val = fn(Math.PI, Math.E, mode, sinf, cosf, tanf, asinf, acosf, atanf, lnf, log10f, Math.sqrt, Math.cbrt||((x)=>Math.pow(x,1/3)), rootf, Math.abs, Math.exp, factorial);
		return Number.isFinite(val)?val:NaN;
	}catch(e){
		return NaN;
	}
}

function degToRad(x){return x*Math.PI/180}
function radToDeg(x){return x*180/Math.PI}
function sinf(x){return Math.sin(mode==='deg'?degToRad(x):x)}
function cosf(x){return Math.cos(mode==='deg'?degToRad(x):x)}
function tanf(x){return Math.tan(mode==='deg'?degToRad(x):x)}
function asinf(x){let r=Math.asin(x); return mode==='deg'?radToDeg(r):r}
function acosf(x){let r=Math.acos(x); return mode==='deg'?radToDeg(r):r}
function atanf(x){let r=Math.atan(x); return mode==='deg'?radToDeg(r):r}
function lnf(x){return Math.log(x)}
function log10f(x){return Math.log10?Math.log10(x):Math.log(x)/Math.LN10}
function rootf(n,x){return Math.pow(x,1/n)}
function factorial(n){n = Math.floor(Number(n)); if(n<0) return NaN; if(n===0) return 1; let r=1; for(let i=1;i<=n;i++) r*=i; return r}

function evaluateAndExplain(){
	const expr = exprEl.textContent;
	const steps = explainEvaluation(expr);
	const human = humanizeSteps(steps);
	explanationEl.innerHTML = human.map((s,i)=>`<div><strong>Passo ${i+1}:</strong> ${escapeHtml(s)}</div>`).join('');
	const last = steps.length? steps[steps.length-1].split(' = ').pop() : '0';
	const res = Number(last) || safeEval(expr);
	resultEl.textContent = Number.isFinite(res)?res:'Erro';
}

function explainEvaluation(raw){
	let expr = normalize(raw);
	const steps = [];
	try{
		const parenRe = /([a-zA-Z_]+)?\(([^()]*)\)/;
		while(parenRe.test(expr)){
			const m = expr.match(parenRe);
			const full = m[0];
			const func = m[1];
			const inner = m[2];

			const innerSteps = stepSimplify(inner);
			if(innerSteps.length) steps.push(...innerSteps);
			const innerVal = safeEval(inner);

			if(func){
				const call = func + '(' + innerVal + ')';
				const callVal = safeEval(call);
				steps.push(`${func}(${innerVal}) = ${callVal}`);
				expr = expr.replace(full, String(callVal));
			} else {
				steps.push(`(${inner}) = ${innerVal}`);
				expr = expr.replace(full, String(innerVal));
			}
		}

		const finalSteps = stepSimplify(expr);
		if(finalSteps.length) steps.push(...finalSteps);
	}catch(e){
		steps.push('Erro ao avaliar');
	}
	return steps;
}

function stepSimplify(expr){
	const steps = [];
	expr = String(expr).trim();

	function pushAndReplace(match, val){
		steps.push(`${match} = ${val}`);
		expr = expr.replace(match, String(val));
	}

	function isSingleValue(s){
		if(!s) return false;
		if(s === 'PI' || s === 'E') return true;
		return /^[-+]?\d+(?:\.\d+)?(?:e[+\-]?\d+)?$/i.test(s.trim());
	}

	while(true){
		expr = expr.trim();
		if(isSingleValue(expr)){
			steps.push(`${expr} = ${safeEval(expr)}`);
			break;
		}

		const powerRe = /(-?\b(?:\d+\.\d+|\d+|PI|E)\b)\s*\*\*\s*(-?\b(?:\d+\.\d+|\d+|PI|E)\b)/i;
		const mulDivRe = /(-?\b(?:\d+\.\d+|\d+|PI|E)\b)\s*([\*\/])\s*(-?\b(?:\d+\.\d+|\d+|PI|E)\b)/i;
		const addSubRe = /(-?\b(?:\d+\.\d+|\d+|PI|E)\b)\s*([+\-])\s*(-?\b(?:\d+\.\d+|\d+|PI|E)\b)/i;

		let m;
		if(m = expr.match(powerRe)){
			const match = m[0];
			const val = safeEval(match);
			pushAndReplace(match, val);
			continue;
		}

		if(m = expr.match(mulDivRe)){
			const match = m[0];
			const val = safeEval(match);
			pushAndReplace(match, val);
			continue;
		}

		if(m = expr.match(addSubRe)){
			const match = m[0];
			const val = safeEval(match);
			pushAndReplace(match, val);
			continue;
		}

		const final = safeEval(expr);
		steps.push(`${expr} = ${final}`);
		break;
	}

	return steps;
}

function humanizeSteps(steps){
	const mapOp = { '*': 'Multiplicação', '/': 'Divisão', '+': 'Adição', '-': 'Subtração', '**': 'Potência' };
	const funcMap = {
		sin: 'Seno', cos: 'Cosseno', tan: 'Tangente', asin: 'Arco seno', acos: 'Arco cosseno', atan: 'Arco tangente',
		sqrt: 'Raiz quadrada', cbrt: 'Raiz cúbica', root: 'Raiz n-ésima', abs: 'Valor absoluto', exp: 'Exponencial',
		ln: 'Log natural', log: 'Log decimal', factorial: 'Fatorial'
	};

	return steps.map((s, idx)=>{
		const parts = s.split(' = ');
		const left = parts[0].trim();
		const right = parts.slice(1).join(' = ').trim();

		const fcall = left.match(/^([a-zA-Z_]+)\((.*)\)$/);
		if(fcall){
			const fname = fcall[1];
			const arg = fcall[2];
			const title = funcMap[fname] || (`Função ${fname}`);
			let note = title + `(${arg}) = ${right}`;
			if(['sin','cos','tan','asin','acos','atan'].includes(fname) && mode==='deg'){
				note += '  — modo: graus (converte para radianos para calcular)';
			}
			if(fname==='factorial') note = `Fatorial de ${arg} = ${right}`;
			return note;
		}

		const paren = left.match(/^\((.*)\)$/);
		if(paren){
			return `Avaliar parênteses: (${paren[1]}) = ${right}`;
		}

		const bin = left.match(/^(.*)\s*(\*\*|\*|\/|\+|\-)\s*(.*)$/);
		if(bin){
			const a = bin[1].trim();
			const op = bin[2];
			const b = bin[3].trim();
			const opName = mapOp[op] || `Operação (${op})`;
			const sym = (op==='**')? '^' : (op==='*')? '×' : op;
			return `${opName}: ${a} ${sym} ${b} = ${right}`;
		}

		return `Avaliar: ${left} = ${right}`;
	});
}

function updateDisplay(){
	exprEl.textContent = exprEl.textContent || '0';
}

function addParen(){
	const s = exprEl.textContent;
	const open = (s.match(/\(/g)||[]).length;
	const close = (s.match(/\)/g)||[]).length;
	exprEl.textContent += (open>close)?')':'(';
}

function toggleSign(){
	const res = safeEval(normalize(exprEl.textContent));
	if(Number.isFinite(res)){
		exprEl.textContent = String(-res);
		resultEl.textContent = String(-res);
	} else {

		exprEl.textContent = '0';
	}
}

function computeStats(which){
	const arr = (statsInput.value||'').split(',').map(x=>parseFloat(x.trim())).filter(x=>!isNaN(x));
	if(!arr.length){ explanationEl.textContent='Insira uma lista válida.'; return; }
	const sum = arr.reduce((a,b)=>a+b,0);
	const mean = sum/arr.length;
	const variance = arr.reduce((a,b)=>a+Math.pow(b-mean,2),0)/arr.length;
	const std = Math.sqrt(variance);
	let out='';
	if(which==='sum') out = `Soma = ${sum}`;
	if(which==='mean') out = `Média = ${mean}`;
	if(which==='var') out = `Variância = ${variance}`;
	if(which==='std') out = `Desvio padrão = ${std}`;
	explanationEl.textContent = out;
	resultEl.textContent = (which==='sum')?sum:(which==='mean')?mean:(which==='var')?variance:std;
}

function convert(kind){
	const val = safeEval(normalize(exprEl.textContent));
	if(!Number.isFinite(val)){ explanationEl.textContent='Valor inválido para conversão'; return; }
	let out='';
	switch(kind){
		case 'bin': out = (Math.trunc(val)).toString(2); break;
		case 'oct': out = (Math.trunc(val)).toString(8); break;
		case 'hex': out = (Math.trunc(val)).toString(16).toUpperCase(); break;
		case 'dec': out = String(val); break;
	}
	explanationEl.textContent = `Conversão ${kind}: ${out}`;
	resultEl.textContent = out;
}

function flash(msg){
	explanationEl.textContent = msg;
	setTimeout(()=>{ explanationEl.textContent = ''; },900);
}

function escapeHtml(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function openHelp(){
	document.getElementById('helpModal').classList.remove('hidden');
}

function closeHelp(){
	document.getElementById('helpModal').classList.add('hidden');
}

