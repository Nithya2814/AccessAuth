# voice_helper.py - Browser Web Speech API & Audio Pulse Generator
import streamlit.components.v1 as components

def play_speech(text: str, language_name: str = "English"):
    """
    Plays client-side audio speech using standard HTML5 SpeechSynthesis.
    Supports 10 languages: English, Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, Marathi, Spanish, French.
    """
    lang_codes = {
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
    lang_code = lang_codes.get(language_name, "en-US")
    # Clean text for JavaScript string literal
    clean_text = text.replace('\\', '\\\\').replace('"', '\\"').replace("'", "\\'").replace("\n", " ").strip()
    
    html_code = f"""
    <script>
        (function() {{
            try {{
                var synth = (window.parent && window.parent.speechSynthesis) || window.speechSynthesis;
                if (synth) {{
                    synth.cancel();
                    var utterance = new SpeechSynthesisUtterance("{clean_text}");
                    utterance.lang = "{lang_code}";
                    utterance.rate = 0.92;
                    utterance.pitch = 1.0;

                    var hasSpoken = false;
                    function assignVoiceAndSpeak() {{
                        if (hasSpoken) return;
                        hasSpoken = true;
                        try {{
                            var voices = synth.getVoices() || [];
                            var targetCode = "{lang_code}".toLowerCase();
                            var targetPrefix = targetCode.split("-")[0];
                            
                            var matched = voices.find(function(v) {{
                                return v.lang && v.lang.toLowerCase() === targetCode;
                            }});
                            if (!matched) {{
                                matched = voices.find(function(v) {{
                                    return v.lang && v.lang.toLowerCase().startsWith(targetPrefix);
                                }});
                            }}
                            if (matched) {{
                                utterance.voice = matched;
                            }}
                            synth.speak(utterance);
                        }} catch(err) {{
                            synth.speak(utterance);
                        }}
                    }}

                    var currentVoices = synth.getVoices() || [];
                    if (currentVoices.length > 0) {{
                        assignVoiceAndSpeak();
                    }} else {{
                        synth.onvoiceschanged = assignVoiceAndSpeak;
                        setTimeout(assignVoiceAndSpeak, 120);
                    }}
                }}
            }} catch(e) {{
                console.error("SpeechSynthesis error:", e);
            }}
        }})();
    </script>
    """
    components.html(html_code, height=0, width=0)

def stop_speech():
    """Immediately stops and cancels any active audio speech in the browser."""
    html_code = """
    <script>
        (function() {
            try {
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
                        gain.gain.setValueAtTime(0.3, ctx.currentTime);
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
            }} catch(e) {{
                console.error("Audio pulse error:", e);
            }}
        }})();
    </script>
    """
    components.html(html_code, height=0, width=0)

