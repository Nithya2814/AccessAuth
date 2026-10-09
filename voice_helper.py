# voice_helper.py - High-Fidelity Multilingual Native Audio Engine & Acoustic Pulses
import io
import base64
import streamlit.components.v1 as components

# In-memory audio cache for 0ms replay latency
_AUDIO_CACHE = {}

GTTS_LANG_CODES = {
    "English": "en",
    "Tamil": "ta",
    "Hindi": "hi",
    "Telugu": "te",
    "Kannada": "kn",
    "Malayalam": "ml",
    "Bengali": "bn",
    "Marathi": "mr",
    "Spanish": "es",
    "French": "fr"
}

WEB_SPEECH_CODES = {
    "English": "en-US",
    "Tamil": "ta-IN",
    "Hindi": "hi-IN",
    "Telugu": "te-IN",
    "Kannada": "kn-IN",
    "Malayalam": "ml-IN",
    "Bengali": "bn-IN",
    "Marathi": "mr-IN",
    "Spanish": "es-ES",
    "French": "fr-FR"
}

def play_speech(text: str, language_name: str = "English"):
    """
    Plays high-fidelity native audio speech in the chosen language.
    Primary: Generates natural native pronunciation via gTTS and plays via HTML5 Audio.
    Fallback: Automatic client-side SpeechSynthesis with exact BCP-47 regional voice match.
    """
    if not text or not text.strip():
        return
        
    clean_text = text.replace('\\', '\\\\').replace('"', '\\"').replace("'", "\\'").replace("\n", " ").strip()
    gtts_code = GTTS_LANG_CODES.get(language_name, "en")
    web_code = WEB_SPEECH_CODES.get(language_name, "en-US")
    
    b64_audio = None
    cache_key = (clean_text, language_name)
    
    # 1. Check in-memory cache
    if cache_key in _AUDIO_CACHE:
        b64_audio = _AUDIO_CACHE[cache_key]
    else:
        # 2. Generate native audio with gTTS
        try:
            from gtts import gTTS
            tts = gTTS(text=clean_text, lang=gtts_code)
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)
            b64_audio = base64.b64encode(fp.read()).decode('utf-8')
            _AUDIO_CACHE[cache_key] = b64_audio
        except Exception:
            b64_audio = None

    if b64_audio:
        # Primary: HTML5 Audio stream with immediate SpeechSynthesis fallback
        html_code = f"""
        <div style="display:none;">
            <audio id="activeVoicePlayer" autoplay src="data:audio/mp3;base64,{b64_audio}"></audio>
            <script>
                (function() {{
                    function fallbackSpeak() {{
                        try {{
                            var synth = (window.parent && window.parent.speechSynthesis) || window.speechSynthesis;
                            if (synth) {{
                                synth.cancel();
                                var u = new SpeechSynthesisUtterance("{clean_text}");
                                u.lang = "{web_code}";
                                u.rate = 1.0;
                                var voices = synth.getVoices() || [];
                                var target = "{web_code}".toLowerCase();
                                var prefix = target.split("-")[0];
                                var matched = voices.find(function(v) {{
                                    return v.lang && v.lang.toLowerCase() === target;
                                }}) || voices.find(function(v) {{
                                    return v.lang && v.lang.toLowerCase().startsWith(prefix);
                                }});
                                if (matched) u.voice = matched;
                                synth.speak(u);
                            }}
                        }} catch(err) {{}}
                    }}

                    try {{
                        var doc = (window.parent && window.parent.document) || document;
                        var oldAudio = doc.getElementById("globalVoicePlayer");
                        if (oldAudio) {{
                            oldAudio.pause();
                            oldAudio.remove();
                        }}
                        var audio = document.getElementById("activeVoicePlayer");
                        if (audio) {{
                            audio.id = "globalVoicePlayer";
                            doc.body.appendChild(audio);
                            var playPromise = audio.play();
                            if (playPromise !== undefined) {{
                                playPromise.catch(function(e) {{
                                    fallbackSpeak();
                                }});
                            }}
                        }} else {{
                            fallbackSpeak();
                        }}
                    }} catch(e) {{
                        fallbackSpeak();
                    }}
                }})();
            </script>
        </div>
        """
        components.html(html_code, height=0, width=0)
    else:
        # Secondary Fallback: Direct Browser Web Speech API
        html_code = f"""
        <script>
            (function() {{
                try {{
                    var synth = (window.parent && window.parent.speechSynthesis) || window.speechSynthesis;
                    if (synth) {{
                        synth.cancel();
                        var utterance = new SpeechSynthesisUtterance("{clean_text}");
                        utterance.lang = "{web_code}";
                        utterance.rate = 1.0;
                        utterance.pitch = 1.0;
                        
                        function assignVoiceAndSpeak() {{
                            var voices = synth.getVoices() || [];
                            var target = "{web_code}".toLowerCase();
                            var prefix = target.split("-")[0];
                            var matched = voices.find(function(v) {{
                                return v.lang && v.lang.toLowerCase() === target;
                            }}) || voices.find(function(v) {{
                                return v.lang && v.lang.toLowerCase().startsWith(prefix);
                            }});
                            if (matched) utterance.voice = matched;
                            synth.speak(utterance);
                        }}

                        if (synth.getVoices().length > 0) {{
                            assignVoiceAndSpeak();
                        }} else {{
                            synth.onvoiceschanged = function() {{
                                assignVoiceAndSpeak();
                            }};
                            setTimeout(assignVoiceAndSpeak, 100);
                        }}
                    }}
                }} catch(e) {{}}
            }})();
        </script>
        """
        components.html(html_code, height=0, width=0)


def stop_speech():
    """Immediately halts any playing audio stream and synthesizers."""
    html_code = """
    <script>
        (function() {
            try {
                var doc = (window.parent && window.parent.document) || document;
                var audio = doc.getElementById("globalVoicePlayer");
                if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                    audio.remove();
                }
                var synth = (window.parent && window.parent.speechSynthesis) || window.speechSynthesis;
                if (synth) {
                    synth.cancel();
                }
            } catch(e) {}
        })();
    </script>
    """
    components.html(html_code, height=0, width=0)

def play_audio_pulses(pulse_count: int = 4):
    """
    Plays rhythmic acoustic beeps via Web Audio API and triggers device vibration.
    Used for eyes-free blind security challenge.
    """
    html_code = f"""
    <script>
        (function() {{
            try {{
                var AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {{
                    var ctx = new AudioContext();
                    var count = {pulse_count};
                    for (var i = 0; i < count; i++) {{
                        var osc = ctx.createOscillator();
                        var gain = ctx.createGain();
                        osc.type = "sine";
                        osc.frequency.setValueAtTime(600, ctx.currentTime);
                        gain.gain.setValueAtTime(0.35, ctx.currentTime);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        var start = ctx.currentTime + (i * 0.45);
                        osc.start(start);
                        osc.stop(start + 0.22);
                    }}
                }}
                if (navigator.vibrate) {{
                    var vib = [];
                    for (var j = 0; j < {pulse_count}; j++) {{
                        vib.push(220);
                        if (j < {pulse_count} - 1) vib.push(230);
                    }}
                    navigator.vibrate(vib);
                }}
            }} catch(e) {{}}
        }})();
    </script>
    """
    components.html(html_code, height=0, width=0)
