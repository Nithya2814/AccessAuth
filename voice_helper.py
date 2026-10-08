# voice_helper.py - Browser Web Speech API Integration for 10 Languages
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
    # Clean text for JavaScript
    clean_text = text.replace('"', '\\"').replace("'", "\\'").replace("\n", " ").strip()
    
    html_code = f"""
    <script>
        if ('speechSynthesis' in window) {{
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance("{clean_text}");
            utterance.lang = "{lang_code}";
            utterance.rate = 0.90;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        }} else {{
            console.warn("SpeechSynthesis not supported on this browser.");
        }}
    </script>
    """
    components.html(html_code, height=0, width=0)

def stop_speech():
    """Immediately stops and cancels any active audio speech in the browser."""
    html_code = """
    <script>
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    </script>
    """
    components.html(html_code, height=0, width=0)
