// 电影语音翻译 - Deno Deploy 全合一应用

const FRONTEND = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>电影语音翻译</title>
<style>:root{--bg:#09090b;--card:#18181b;--border:#27272a;--accent:#8b5cf6;--danger:#ef4444;--text:#f4f4f5;--muted:#a1a1aa}*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;-webkit-tap-highlight-color:transparent}.card{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:20px}.subtitle-bar{text-align:center;padding:12px 16px;border-radius:14px;background:rgba(0,0,0,.4);border:1px solid var(--border);min-height:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}.subtitle-bar .orig{font-size:.75rem;color:var(--muted)}.subtitle-bar .trans{font-size:1.15rem;font-weight:700;color:#fff;word-break:break-word;line-height:1.4}.lang-btn{display:flex;align-items:center;gap:8px;width:100%;padding:12px 14px;border-radius:12px;cursor:pointer;transition:all .2s;border:2px solid var(--border);background:0 0;color:var(--text);font-size:.85rem;text-align:left;font-family:inherit}.lang-btn.active{border-color:var(--accent);background:rgba(139,92,246,.1)}.lang-btn .emoji{font-size:1.3rem}.lang-btn .title{font-weight:600;display:block}.lang-btn .sub{font-size:.7rem;color:var(--muted)}.main-btn{width:100%;padding:16px 24px;border-radius:100px;border:none;cursor:pointer;font-weight:700;font-size:1rem;transition:all .3s;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;gap:8px;font-family:inherit;-webkit-appearance:none}.main-btn:active{transform:scale(.97)}.main-btn.rec{background:var(--danger);animation:p 2s infinite}@keyframes p{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)}50%{box-shadow:0 0 0 16px rgba(239,68,68,0)}}.dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}.dot.idle{background:var(--muted)}.dot.listening{background:#22c55e}.dot.translating{background:#f59e0b}.dot.speaking{background:#8b5cf6}.log-panel{max-height:120px;overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:monospace;font-size:.6rem;color:var(--muted);line-height:1.5;background:rgba(0,0,0,.2);border-radius:10px;padding:8px 10px}.ok{color:#4ade80}.err{color:#f87171}.warn{color:#f59e0b}.row{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;background:rgba(0,0,0,.25)}.test-btn{width:100%;padding:10px;border-radius:12px;border:1px dashed var(--border);background:0 0;color:var(--muted);cursor:pointer;font-size:.8rem;font-family:inherit;-webkit-appearance:none}.test-btn:active{border-color:var(--accent);color:#a78bfa}.text-input{width:100%;padding:12px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,.05);color:var(--text);font-size:1rem;font-family:inherit;outline:none;-webkit-appearance:none}.text-input:focus{border-color:var(--accent)}.text-input::placeholder{color:var(--muted)}</style>
</head>
<body class="flex items-center justify-center min-h-screen p-4">
<div class="w-full max-w-md mx-auto flex flex-col gap-3">
<div class="text-center"><span class="text-2xl">🎬</span><h1 class="text-lg font-bold">电影语音翻译</h1></div>
<div class="card space-y-3">
<div class="grid grid-cols-2 gap-2">
<button class="lang-btn active" onclick="pick('ug',this)"><span class="emoji">🏴</span><span><span class="title">维吾尔语</span><span class="sub">Uyghur</span></span></button>
<button class="lang-btn" onclick="pick('uz',this)"><span class="emoji">🇺🇿</span><span><span class="title">乌兹别克语</span><span class="sub">Uzbek</span></span></button>
</div>
<div class="row"><span class="dot idle" id="dot"></span><span class="text-sm flex-1" id="st">就绪</span><span class="text-xs text-[var(--muted)]" id="sd"></span></div>
<div class="flex gap-2"><input type="text" class="text-input flex-1" id="ti" placeholder="输入中文台词..." autocomplete="off"><button class="main-btn" style="width:auto;padding:12px 18px;white-space:nowrap" onclick="sendText()">📤 翻译</button></div>
<button class="main-btn" id="mb" onclick="toggle()"><span>🎤</span><span id="mbt">语音监听 (Chrome)</span></button>
<div class="subtitle-bar"><span class="orig" id="origTxt">输入文字或按语音按钮</span><span class="trans" id="transTxt"></span></div>
<button class="test-btn" onclick="testBeep()">🔔 蜂鸣测试</button>
<div class="log-panel" id="log"></div>
</div>
<p class="text-[10px] text-[var(--muted)] text-center">Deno Deploy 代理 · Google TTS 真声</p>
</div>
<script>
var lang='ug',active=!1,rec=null,queue=[],busy=!1,audioCtx=null;
function L(m,c){var e=document.getElementById('log'),t=new Date;t=t.toLocaleTimeString('zh-CN',{hour12:!1});e.innerHTML+='<div class="'+(c||'')+'">'+t+' '+m+'</div>';e.scrollTop=e.scrollHeight;while(e.children.length>35)e.firstChild.remove()}
function getAC(){if(!audioCtx){audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}return audioCtx}
function pick(l,e){lang=l;document.querySelectorAll('.lang-btn').forEach(function(b){b.classList.remove('active')});e.classList.add('active');L('语言: '+(l==='ug'?'维吾尔语':'乌兹别克语'))}
function SS(s,m){document.getElementById('dot').className='dot '+s;document.getElementById('st').textContent=m}
function sub(orig,trans){document.getElementById('origTxt').textContent=orig||'';document.getElementById('transTxt').textContent=trans||''}
function sendText(){var inp=document.getElementById('ti'),text=inp.value.trim();if(!text)return;inp.value='';L('⌨ '+text);sub(text,'⏳');SS('translating','翻译中');tr(text).then(function(r){if(r){queue.push(r);flush()}})}
document.getElementById('ti').addEventListener('keydown',function(e){if(e.key==='Enter')sendText()});
function testBeep(){L('🔔 蜂鸣测试...','warn');try{var ctx=getAC(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);osc.frequency.value=440;gain.gain.value=.3;osc.start();osc.stop(ctx.currentTime+.5);L('✅ 蜂鸣播放中！','ok')}catch(e){L('❌ 蜂鸣失败','err')}}
function speak(text){L('🔊 合成: "'+text.slice(0,35)+'..."');SS('speaking','朗读中');fetch('/api/tts?tl='+lang+'&q='+encodeURIComponent(text),{signal:AbortSignal.timeout(15000)}).then(function(r){if(r.ok)return r.blob().then(function(b){if(b.size>500)return b.arrayBuffer()});throw new Error('fail')}).then(function(buf){var ctx=getAC();return ctx.decodeAudioData(buf)}).then(function(ab){var src=getAC().createBufferSource();src.buffer=ab;src.connect(getAC().destination);src.onended=function(){L('  ▶ 完毕','ok')};src.start();L('  ✓ 播放中','ok');sub('',text)}).catch(function(e){L('  TTS失败: '+e.message,'err');L('⚠ 仅显示字幕','warn');sub('',text)})}
function tr(text){return fetch('/api/tr?tl='+lang+'&q='+encodeURIComponent(text),{signal:AbortSignal.timeout(10000)}).then(function(r){return r.json()}).then(function(d){if(d&&d[0]){var t=d[0].map(function(p){return p[0]}).join('');L('✓ 翻译: "'+t.slice(0,35)+'..."','ok');return t}}).catch(function(e){L('❌ 翻译失败','err');sub(text,'❌ 翻译失败');return null})}
function flush(){if(busy||!queue.length)return;busy=!0;var t=queue.shift();speak(t).then(function(){busy=!1;if(queue.length)flush();else SS('idle','就绪')})}
function toggle(){var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){sub('','请用 Chrome 或直接打字');return}active?stop():start()}
function start(){var SR=window.SpeechRecognition||window.webkitSpeechRecognition;rec=new SR;rec.lang='zh-CN';rec.continuous=!0;rec.interimResults=!0;rec.maxAlternatives=1;rec.onresult=function(e){for(var i=e.resultIndex;i<e.results.length;i++){if(!e.results[i].isFinal)continue;var t=e.results[i][0].transcript.trim();if(t.length<2)continue;L('🎤 '+t);SS('translating','翻译中');sub(t,'⏳');tr(t).then(function(r){if(r){queue.push(r);flush()}})}};rec.onerror=function(e){if(e.error==='no-speech'){if(active)SS('listening','监听中');return}if(e.error==='aborted')return;if(e.error==='not-allowed'){L('❌ 麦克风权限被拒','err');stop();return}L('⚠ '+e.error,'warn')};rec.onend=function(){if(active)setTimeout(function(){if(active)try{rec.start()}catch(_){}},200)};rec.start();active=!0;document.getElementById('mb').classList.add('rec');document.getElementById('mbt').textContent='停止监听';SS('listening','监听中...');sub('','🎤 请说中文...');L('🎤 已启动','ok')}
function stop(){active=!1;if(rec){rec.stop();rec=null}queue=[];busy=!1;if(window.speechSynthesis)speechSynthesis.cancel();document.getElementById('mb').classList.remove('rec');document.getElementById('mbt').textContent='语音监听 (Chrome)';SS('idle','就绪');sub('输入文字或按语音按钮','');L('⏹ 已停止')}
if(window.speechSynthesis){speechSynthesis.getVoices();speechSynthesis.onvoiceschanged=function(){speechSynthesis.getVoices()}}
document.addEventListener('click',function(){getAC()},{once:!0});document.addEventListener('touchend',function(){getAC()},{once:!0});
L('✅ 就绪 — Deno Deploy 代理模式','ok');
</script>
</body>
</html>`;

// ── SERVER ──
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" },
    });
  }

  try {
    if (path === "/api/tts") {
      const tl = url.searchParams.get("tl") || "ug";
      const q = url.searchParams.get("q") || "";
      if (!q) return new Response(JSON.stringify({ error: "missing q" }), { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

      const ttsUrl = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=" + tl + "&q=" + encodeURIComponent(q);
      const resp = await fetch(ttsUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!resp.ok) return new Response(JSON.stringify({ error: "upstream error", status: resp.status }), { status: resp.status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

      const buf = await resp.arrayBuffer();
      return new Response(buf, {
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" },
      });
    }

    if (path === "/api/tr") {
      const tl = url.searchParams.get("tl") || "ug";
      const q = url.searchParams.get("q") || "";
      if (!q) return new Response(JSON.stringify({ error: "missing q" }), { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

      const trUrl = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=" + tl + "&dt=t&q=" + encodeURIComponent(q);
      const resp = await fetch(trUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
      });
    }

    return new Response(FRONTEND, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
});
