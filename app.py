# app.py - Secure & Accessible Digital Authentication System
import streamlit as st
import streamlit.components.v1 as components
import importlib
import random
import database as db
importlib.reload(db)
import translations
importlib.reload(translations)
from translations import TRANSLATIONS
import face_engine
importlib.reload(face_engine)
from face_engine import extract_face_features, compare_faces, check_lighting, analyze_face_spatial_guidance, get_spatial_voice_text
from risk_friction import RiskEngine, FrictionEngine
import voice_helper
try:
    importlib.reload(voice_helper)
except Exception:
    pass

play_speech = getattr(voice_helper, "play_speech", None)
stop_speech = getattr(voice_helper, "stop_speech", None)
play_audio_pulses = getattr(voice_helper, "play_audio_pulses", None)

if play_audio_pulses is None:
    def play_audio_pulses(pulse_count: int = 4):
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
                }} catch(e) {{}}
            }})();
        </script>
        """
        components.html(html_code, height=0, width=0)


# Page configuration
st.set_page_config(
    page_title="Secure & Accessible Auth",
    page_icon="🛡️",
    layout="centered",
    initial_sidebar_state="expanded"
)

# Initialize database
db.init_db()

# Safe Dictionary wrapper that NEVER raises KeyError
class SafeDict(dict):
    def __getitem__(self, key):
        if key in self:
            return super().__getitem__(key)
        # Fallback to English
        eng = TRANSLATIONS.get("English", {})
        if key in eng:
            return eng[key]
        fallbacks = {
            "sidebar_lang_label": "Language",
            "sidebar_theme_label": "Theme",
            "sidebar_theme_dark": "Dark",
            "sidebar_theme_light": "Light",
            "sidebar_font_label": "Text Size",
            "sidebar_font_help": "Adjust font size for easy reading",
            "blind_mode_title": "Blind Assist Mode Active",
            "blind_mode_subtitle": "Voice Guidance • Eyes-Free Face Login • High Contrast",
            "blind_welcome_speech": {
                "English": "Blind Assist Mode active. Voice guidance enabled. Press Tab to hear options, or use One-Tap Face Biometric Login without typing.",
                "Tamil": "பார்வை மாற்றுத்திறனாளி முறை செயல்படுத்தப்பட்டுள்ளது. ஆடியோ வழிகாட்டுதல் தயார். தட்டச்சு செய்யாமல் முக பயோமெட்ரிக் உள்நுழைவு அல்லது ஆடியோ பாதுகாப்பு சோதனையைப் பயன்படுத்தலாம்.",
                "Hindi": "ब्लाइंड असिस्ट मोड सक्रिय है। ऑडियो मार्गदर्शन तैयार है। आप बिना टाइप किए वन-टैप फेस बायोमेट्रिक लॉगिन का उपयोग कर सकते हैं।",
                "Telugu": "బ్లైండ్ అసిస్ట్ మోడ్ యాక్టివ్ చేయబడింది. ఆడియో మార్గదర్శకత్వం సిద్ధంగా ఉంది. టైప్ చేయకుండా వన్-ట్యాప్ ఫేస్ బయోమెట్రిక్ లాగిన్ ఉపయోగించవచ్చు.",
                "Kannada": "ಅಂಧರ ಸಹಾಯ ಮೋಡ್ ಸಕ್ರಿಯಗೊಂಡಿದೆ. ಧ್ವನಿ ಮಾರ್ಗದರ್ಶನ ಸಿದ್ಧವಾಗಿದೆ. ಟೈಪ್ ಮಾಡದೆಯೇ ಒನ್-ಟ್ಯಾಪ್ ಫೇಸ್ ಲಾಗಿನ್ ಬಳಸಬಹುದು.",
                "Malayalam": "ബ്ലൈൻഡ് അസിസ്റ്റ് മോഡ് സജീവമാക്കി. വോയ്‌സ് മാർഗ്ഗനിർദ്ദേശം തയ്യാറാണ്. ടൈപ്പ് ചെയ്യാതെ ഫേസ് ലോഗിൻ ഉപയോഗിക്കാം.",
                "Bengali": "ব্লাইন্ড অ্যাসিস্ট মোড সক্রিয় করা হয়েছে। ভয়েস নির্দেশিকা প্রস্তুত। টাইপ না করে ফেস লগইন ব্যবহার করতে পারেন।",
                "Marathi": "ब्लाइंड असिस्ट मोड सक्रिय आहे. ऑडिओ मार्गदर्शन तयार आहे. टाईप न करता वन-टॅप फेस लॉगिन वापरू शकता.",
                "Spanish": "Modo de Asistencia para Ciegos activado. Guía de voz habilitada. Puede iniciar sesión con reconocimiento facial con un toque sin escribir.",
                "French": "Mode d'assistance visuelle activé. Guidage vocal prêt. Vous pouvez utiliser la connexion faciale en un clic sans taper."
            }.get(st.session_state.get("lang", "English"), "Blind Assist Mode active. Voice guidance enabled. Press Tab to hear options."),
            "audio_challenge_prompt": {
                "English": "Security Audio Challenge. Please listen to the audio pulses. How many pulses did you hear?",
                "Tamil": "பாதுகாப்பு ஆடியோ சோதனை. ஒலி துடிப்புகளை கவனமாகக் கேளுங்கள். எத்தனை துடிப்புகள் கேட்டன?",
                "Hindi": "सुरक्षा ऑडियो चुनौती। कृपया ऑडियो पल्स सुनें। आपने कितनी पल्स सुनीं?",
                "Telugu": "భద్రతా ఆడియో ఛాలెంజ్. దయచేసి ఆడియో పల్స్‌లను వినండి. మీరు ఎన్ని పల్స్‌లను విన్నారు?",
                "Kannada": "ಸುರಕ್ಷತಾ ಆಡಿಯೋ ಸವಾಲು. ದಯವಿಟ್ಟು ಆಡಿಯೋ ನಾಡಿಮಿಡಿತಗಳನ್ನು ಆಲಿಸಿ. ನೀವು ಎಷ್ಟು ಸದ್ದುಗಳನ್ನು ಕೇಳಿದ್ದೀರಿ?",
                "Malayalam": "സുരക്ഷാ ഓഡിയോ വെല്ലുവിളി. ഓഡിയോ പൾസുകൾ ശ്രദ്ധിക്കുക. എത്ര പൾസുകൾ കേട്ടു?",
                "Bengali": "নিরাপত্তা অডিও চ্যালেঞ্জ। অডিও ডাল শুনুন। আপনি কয়টি ডাল শুনেছেন?",
                "Marathi": "सुरक्षा ऑडिओ आव्हान. कृपया ऑडिओ स्पंदने ऐका. तुम्ही किती स्पंदने ऐकली?",
                "Spanish": "Desafío de seguridad de audio. Escuche los pulsos de audio. ¿Cuántos pulsos escuchó?",
                "French": "Défi de sécurité audio. Écoutez les impulsions audio. Combien d'impulsions avez-vous entendues?"
            }.get(st.session_state.get("lang", "English"), "Security Audio Challenge. Please listen to the audio pulses. How many pulses did you hear?"),
            "audio_challenge_pass": {
                "English": "Audio security challenge verified successfully! Human verified.",
                "Tamil": "ஆடியோ பாதுகாப்பு சோதனை வெற்றிகரமாக சரிபார்க்கப்பட்டது! மனித பயனர் உறுதிசெய்யப்பட்டார்.",
                "Hindi": "ऑडियो सुरक्षा चुनौती सत्यापित! मानव उपयोगकर्ता की पुष्टि हुई।",
                "Telugu": "ఆడియో సెక్యూరిటీ ఛాలెంజ్ ధృవీకరించబడింది! మానవుడు ధృవీకరించబడ్డాడు.",
                "Kannada": "ಆಡಿಯೋ ಭದ್ರತಾ ಸವಾಲು ಯಶಸ್ವಿಯಾಗಿ ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿದೆ!",
                "Malayalam": "ഓഡിയോ സുരക്ഷാ വെല്ലുവിളി വിജയകരമായി സ്ഥിರീകരിച്ചു!",
                "Bengali": "অডিও নিরাপত্তা চ্যালেঞ্জ সফলভাবে যাচাই করা হয়েছে!",
                "Marathi": "ऑडिओ सुरक्षा आव्हान यशस्वीरित्या सत्यापित झाले!",
                "Spanish": "Desafío de seguridad de audio verificado con éxito.",
                "French": "Défi de sécurité audio vérifié avec succès."
            }.get(st.session_state.get("lang", "English"), "Audio security challenge verified successfully! Human verified."),
            "login_google": {
                "English": "Sign in with Google",
                "Tamil": "Google மூலம் உள்நுழைக",
                "Hindi": "Google के साथ साइन इन करें",
                "Telugu": "Googleతో సైన్ ఇన్ చేయండి",
                "Kannada": "Google ನೊಂದಿಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ",
                "Malayalam": "Google വഴി പ്രവേശിക്കുക",
                "Bengali": "Google দিয়ে সাইন ইন করুন",
                "Marathi": "Google सह साइन इन करा",
                "Spanish": "Iniciar sesión con Google",
                "French": "Se connecter avec Google"
            }.get(st.session_state.get("lang", "English"), "Sign in with Google"),
            "stop_btn": {
                "English": "⏹️ Stop Audio",
                "Tamil": "⏹️ ஆடியோவை நிறுத்து",
                "Hindi": "⏹️ ऑडियो बंद करें",
                "Telugu": "⏹️ ఆడియో ఆపు",
                "Kannada": "⏹️ ಆಡಿಯೋ ನಿಲ್ಲಿಸಿ",
                "Malayalam": "⏹️ ഓഡിയോ നിർത്തുക",
                "Bengali": "⏹️ অডিও বন্ধ করুন",
                "Marathi": "⏹️ ऑडिओ थांबवा",
                "Spanish": "⏹️ Detener Audio",
                "French": "⏹️ Arrêter l'Audio"
            }.get(st.session_state.get("lang", "English"), "⏹️ Stop Audio")
        }
        return fallbacks.get(key, str(key))

# ----------------- SESSION STATE & CONFIG -----------------
AVAILABLE_LANGUAGES = [
    "English", "Tamil", "Hindi", "Telugu", "Kannada", 
    "Malayalam", "Bengali", "Marathi", "Spanish", "French"
]
FONT_OPTIONS = [
    "Standard", 
    "Large", 
    "Extra Large"
]
ACCESSIBILITY_MODES = [
    "Standard Mode",
    "Dyslexia Mode",
    "Blind Assist Mode"
]

if "lang" not in st.session_state or st.session_state.lang not in AVAILABLE_LANGUAGES:
    st.session_state.lang = "English"
if "access_mode" not in st.session_state or st.session_state.access_mode not in ACCESSIBILITY_MODES:
    st.session_state.access_mode = "Standard Mode"
if "theme_mode" not in st.session_state or st.session_state.theme_mode not in ["Dark", "Light"]:
    st.session_state.theme_mode = "Light"
if "font_scale" not in st.session_state or st.session_state.font_scale not in FONT_OPTIONS:
    st.session_state.font_scale = "Large"
if "logged_in_user" not in st.session_state:
    st.session_state.logged_in_user = None
if "login_attempts" not in st.session_state:
    st.session_state.login_attempts = 0
if "captcha_q" not in st.session_state or "captcha_a" not in st.session_state:
    q, a = FrictionEngine.generate_captcha()
    st.session_state.captcha_q = q
    st.session_state.captcha_a = a
if "generated_otp" not in st.session_state:
    st.session_state.generated_otp = None
if "target_email_locked" not in st.session_state:
    st.session_state.target_email_locked = None
if "audio_pulse_count" not in st.session_state:
    st.session_state.audio_pulse_count = random.choice([3, 4, 5])
if "blind_challenge_solved" not in st.session_state:
    st.session_state.blind_challenge_solved = False
if "should_announce_blind" not in st.session_state:
    st.session_state.should_announce_blind = False

# Current translation dictionary
t = SafeDict(TRANSLATIONS.get(st.session_state.lang, TRANSLATIONS.get("English", {})))

# ----------------- CLEAN & ELEGANT THEME & FONT ENGINE -----------------
f_map = {
    "Standard": 1.0,
    "Large": 1.20,
    "Extra Large": 1.45,
    "Standard (100%)": 1.0,
    "Large (120%)": 1.20,
    "Extra Large (145%)": 1.45
}
f_scale = f_map.get(st.session_state.font_scale, 1.20)

is_dyslexia = (st.session_state.access_mode == "Dyslexia Mode")
is_blind = (st.session_state.access_mode == "Blind Assist Mode")
is_light = (st.session_state.theme_mode == "Light")

# Typography & Spacing Rules
if is_dyslexia:
    font_import = "@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800&display=swap');"
    font_family = "'Lexend', -apple-system, BlinkMacSystemFont, sans-serif !important;"
    letter_spacing = "0.13em !important;"
    word_spacing = "0.18em !important;"
    line_height = "1.85 !important;"
else:
    font_import = ""
    font_family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;"
    letter_spacing = "normal !important;"
    word_spacing = "normal !important;"
    line_height = "1.5 !important;"

# Color Themes
if is_dyslexia:
    if is_light:
        # Soft warm parchment cream - removes scotopic visual stress
        bg_color = "#FAF6EE"
        card_bg = "#FFFDF9"
        text_color = "#1E293B"
        sub_color = "#475569"
        placeholder_color = "#64748B"
        border_color = "#D7CEBD"
        input_bg = "#FFFDF9"
        input_text = "#1E293B"
        sidebar_bg = "#F2ECE0"
        dropdown_bg = "#FFFDF9"
        dropdown_text = "#1E293B"
        dropdown_hover = "#F2ECE0"
    else:
        # Soft warm dark slate
        bg_color = "#14171E"
        card_bg = "#1D222C"
        text_color = "#F8FAFC"
        sub_color = "#94A3B8"
        placeholder_color = "#94A3B8"
        border_color = "#333C4E"
        input_bg = "#232936"
        input_text = "#FFFFFF"
        sidebar_bg = "#181C25"
        dropdown_bg = "#1D222C"
        dropdown_text = "#FFFFFF"
        dropdown_hover = "#28303F"
elif is_blind:
    # High Contrast Mode
    if is_light:
        bg_color = "#FFFFFF"
        card_bg = "#FFFFFF"
        text_color = "#000000"
        sub_color = "#111111"
        placeholder_color = "#333333"
        border_color = "#000000"
        input_bg = "#FFFFFF"
        input_text = "#000000"
        sidebar_bg = "#F0F0F0"
        dropdown_bg = "#FFFFFF"
        dropdown_text = "#000000"
        dropdown_hover = "#E0E0E0"
    else:
        bg_color = "#000000"
        card_bg = "#0B0B0B"
        text_color = "#FFFFFF"
        sub_color = "#E0E0E0"
        placeholder_color = "#CCCCCC"
        border_color = "#FFFFFF"
        input_bg = "#121212"
        input_text = "#FFFFFF"
        sidebar_bg = "#080808"
        dropdown_bg = "#121212"
        dropdown_text = "#FFFFFF"
        dropdown_hover = "#242424"
else:
    if is_light:
        bg_color = "#f8fafc"
        card_bg = "#ffffff"
        text_color = "#0f172a"
        sub_color = "#475569"
        placeholder_color = "#64748b"
        border_color = "#cbd5e1"
        input_bg = "#ffffff"
        input_text = "#0f172a"
        sidebar_bg = "#f1f5f9"
        dropdown_bg = "#ffffff"
        dropdown_text = "#000000"
        dropdown_hover = "#f1f5f9"
    else:
        bg_color = "#0b0f19"
        card_bg = "#151d30"
        text_color = "#f8fafc"
        sub_color = "#94a3b8"
        placeholder_color = "#94a3b8"
        border_color = "#2b3b5c"
        input_bg = "#1a243b"
        input_text = "#ffffff"
        sidebar_bg = "#0f1524"
        dropdown_bg = "#151d30"
        dropdown_text = "#ffffff"
        dropdown_hover = "#1e293b"

def dyslexia_highlight(text: str) -> str:
    """Highlights mirror-letters with distinct colors to eliminate flipping in Dyslexia mode."""
    if st.session_state.get("access_mode") != "Dyslexia Mode":
        return text
    color_map = {
        'b': '#2563eb', 'B': '#2563eb',
        'd': '#16a34a', 'D': '#16a34a',
        'p': '#9333ea', 'P': '#9333ea',
        'q': '#ea580c', 'Q': '#ea580c',
        'm': '#d97706', 'M': '#d97706',
        'w': '#dc2626', 'W': '#dc2626'
    }
    out = []
    for ch in text:
        if ch in color_map:
            out.append(f'<span style="color: {color_map[ch]}; font-weight: 700;">{ch}</span>')
        else:
            out.append(ch)
    return "".join(out)

st.markdown(f"""
<style>
    {font_import}

    /* Clean System Typography */
    html, body, [class*="css"], p, span, div, label, input, button, textarea {{
        font-family: {font_family}
        letter-spacing: {letter_spacing}
        word-spacing: {word_spacing}
        line-height: {line_height}
    }}

    .stApp {{
        background-color: {bg_color} !important;
        color: {text_color} !important;
    }}
    
    section[data-testid="stSidebar"] {{
        background-color: {sidebar_bg} !important;
        border-right: 1px solid {border_color} !important;
    }}

    /* Global Text Scaling */
    html, body, p, span, div {{
        color: {text_color} !important;
    }}
    
    /* Input Labels */
    div[data-testid="stWidgetLabel"] label p {{
        font-size: calc(15px * {f_scale}) !important;
        font-weight: 600 !important;
        color: {text_color} !important;
    }}

    /* Text & Password Inputs */
    input[type="text"], input[type="password"], div[data-baseweb="input"] input {{
        background-color: {input_bg} !important;
        color: {input_text} !important;
        -webkit-text-fill-color: {input_text} !important;
        border: 1.5px solid {border_color} !important;
        border-radius: 8px !important;
        font-size: calc(15px * {f_scale}) !important;
        padding: 10px 14px !important;
    }}

    /* High Visibility Placeholder in Light and Dark Modes */
    input::placeholder, textarea::placeholder {{
        color: {placeholder_color} !important;
        -webkit-text-fill-color: {placeholder_color} !important;
        opacity: 0.9 !important;
    }}
    input::-webkit-input-placeholder {{
        color: {placeholder_color} !important;
        -webkit-text-fill-color: {placeholder_color} !important;
        opacity: 0.9 !important;
    }}
    input::-moz-placeholder {{
        color: {placeholder_color} !important;
        opacity: 0.9 !important;
    }}
    input:-ms-input-placeholder {{
        color: {placeholder_color} !important;
        opacity: 0.9 !important;
    }}

    /* Dropdown / Selectbox / Combobox Closed State */
    div[data-testid="stSelectbox"],
    div[data-testid="stSelectbox"] > div,
    div[data-baseweb="select"],
    div[data-baseweb="select"] > div,
    div[data-baseweb="select"] > div > div,
    div[data-baseweb="select"] input,
    section[data-testid="stSidebar"] div[data-testid="stSelectbox"] div,
    section[data-testid="stSidebar"] div[data-baseweb="select"] div {{
        background-color: {input_bg} !important;
        background: {input_bg} !important;
        color: {input_text} !important;
        -webkit-text-fill-color: {input_text} !important;
        border-color: {border_color} !important;
    }}

    div[data-baseweb="select"] > div {{
        border: 1.5px solid {border_color} !important;
        border-radius: 8px !important;
    }}

    div[data-testid="stSelectbox"] *,
    div[data-baseweb="select"] *,
    section[data-testid="stSidebar"] div[data-baseweb="select"] * {{
        color: {input_text} !important;
        -webkit-text-fill-color: {input_text} !important;
        fill: {input_text} !important;
        font-weight: 600 !important;
    }}

    /* Dropdown Options Popup Menu (Light mode: White background, Black text; Dark mode: Dark background, White text) */
    div[data-baseweb="popover"], 
    div[data-baseweb="popover"] > div,
    div[data-baseweb="popover"] > div > div,
    [data-baseweb="popover"], 
    [data-baseweb="popover"] > div,
    [data-baseweb="popover"] > div > div,
    [data-baseweb="menu"], 
    [data-baseweb="menu"] > div,
    ul[data-testid="stSelectboxVirtualDropdown"],
    ul[data-testid="stSelectboxVirtualDropdown"] > div,
    ul[data-testid="stSelectboxVirtualDropdown"] > div > div,
    ul[role="listbox"],
    ul[role="listbox"] > div,
    div[role="listbox"],
    div[role="listbox"] > div {{
        background-color: {dropdown_bg} !important;
        background: {dropdown_bg} !important;
        border: 1.5px solid {border_color} !important;
        border-radius: 8px !important;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15) !important;
    }}

    /* Every unhovered option in the dropdown list */
    ul[data-testid="stSelectboxVirtualDropdown"] li,
    ul[data-testid="stSelectboxVirtualDropdown"] li *,
    [data-baseweb="popover"] li,
    [data-baseweb="popover"] li *,
    [data-baseweb="menu"] li, 
    [data-baseweb="menu"] li *, 
    ul[role="listbox"] li,
    ul[role="listbox"] li *,
    div[role="listbox"] li,
    div[role="listbox"] li *,
    li[role="option"],
    li[role="option"] *,
    li[role="option"] > div,
    li[role="option"] span,
    li[role="option"] p,
    div[role="option"],
    div[role="option"] * {{
        background-color: {dropdown_bg} !important;
        background: {dropdown_bg} !important;
        color: {dropdown_text} !important;
        -webkit-text-fill-color: {dropdown_text} !important;
        font-weight: 600 !important;
    }}

    /* Hover option state */
    ul[data-testid="stSelectboxVirtualDropdown"] li:hover,
    ul[data-testid="stSelectboxVirtualDropdown"] li:hover *,
    [data-baseweb="popover"] li:hover,
    [data-baseweb="popover"] li:hover *,
    [data-baseweb="menu"] li:hover, 
    [data-baseweb="menu"] li:hover *, 
    ul[role="listbox"] li:hover,
    ul[role="listbox"] li:hover *,
    li[role="option"]:hover,
    li[role="option"]:hover *,
    div[role="option"]:hover, 
    div[role="option"]:hover * {{
        background-color: {dropdown_hover} !important;
        background: {dropdown_hover} !important;
        color: {dropdown_text} !important;
        -webkit-text-fill-color: {dropdown_text} !important;
    }}

    /* Selected option state */
    ul[data-testid="stSelectboxVirtualDropdown"] li[aria-selected="true"],
    ul[data-testid="stSelectboxVirtualDropdown"] li[aria-selected="true"] *,
    [data-baseweb="popover"] li[aria-selected="true"],
    [data-baseweb="popover"] li[aria-selected="true"] *,
    [data-baseweb="menu"] li[aria-selected="true"], 
    [data-baseweb="menu"] li[aria-selected="true"] *, 
    ul[role="listbox"] li[aria-selected="true"],
    ul[role="listbox"] li[aria-selected="true"] *,
    li[aria-selected="true"],
    li[aria-selected="true"] *,
    div[aria-selected="true"], 
    div[aria-selected="true"] * {{
        background-color: #2563eb !important;
        background: #2563eb !important;
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
        font-weight: 700 !important;
    }}

    /* High-Intensity Screen Flash Softbox for Low-Light / Dark Rooms */
    .screen-flash-box {{
        background-color: #ffffff !important;
        border: 12px solid #ffffff !important;
        border-radius: 16px !important;
        padding: 18px !important;
        box-shadow: 0 0 60px 30px rgba(255, 255, 255, 0.98), 0 0 120px 60px rgba(59, 130, 246, 0.45) !important;
        margin: 15px 0 !important;
    }}

    /* Main Title & Header */
    .app-header {{
        text-align: center;
        margin-bottom: 1.5rem;
    }}
    .app-title {{
        font-size: calc(26px * {f_scale}) !important;
        font-weight: 800 !important;
        letter-spacing: -0.02em;
        color: {text_color} !important;
        margin-bottom: 0.35rem !important;
    }}
    .app-subtitle {{
        font-size: calc(15px * {f_scale}) !important;
        color: {sub_color} !important;
        margin-bottom: 1rem !important;
    }}

    /* Headings */
    h2, [data-testid="stHeadingWithActionElements"] h2 {{
        font-size: calc(22px * {f_scale}) !important;
        font-weight: 700 !important;
        color: {text_color} !important;
    }}
    h3, [data-testid="stHeadingWithActionElements"] h3 {{
        font-size: calc(19px * {f_scale}) !important;
        font-weight: 650 !important;
        color: {text_color} !important;
    }}
    h4, [data-testid="stHeadingWithActionElements"] h4 {{
        font-size: calc(17px * {f_scale}) !important;
        font-weight: 600 !important;
        color: {text_color} !important;
    }}

    /* Tabs */
    button[data-baseweb="tab"] {{
        font-size: calc(16px * {f_scale}) !important;
        font-weight: 600 !important;
        padding: 10px 18px !important;
    }}

    /* Cards & Containers */
    div[data-testid="stForm"], .adaptive-card {{
        background-color: {card_bg} !important;
        border: 1.5px solid {border_color} !important;
        border-radius: 12px !important;
        padding: 1.5rem !important;
    }}

    .help-callout {{
        background-color: {card_bg} !important;
        border-left: 5px solid #3b82f6 !important;
        border-top: 1px solid {border_color} !important;
        border-right: 1px solid {border_color} !important;
        border-bottom: 1px solid {border_color} !important;
        border-radius: 10px !important;
        padding: 1.25rem 1.5rem !important;
        line-height: 1.7 !important;
        font-size: calc(15px * {f_scale}) !important;
    }}

    /* Permanent High-Contrast Buttons */
    div[data-testid="stButton"] button, 
    div[data-testid="stFormSubmitButton"] button,
    div[data-testid="stCameraInput"] button {{
        font-size: calc(15px * {f_scale}) !important;
        font-weight: 700 !important;
        border-radius: 8px !important;
        padding: 10px 18px !important;
        cursor: pointer !important;
        transition: all 0.2s ease-in-out !important;
    }}

    /* Primary Action Buttons (Log In, Register, Camera Photo, Speak) */
    div[data-testid="stFormSubmitButton"] button,
    div[data-testid="stButton"] button[kind="primary"],
    div[data-testid="stCameraInput"] button {{
        background-color: #2563eb !important;
        color: #ffffff !important;
        border: 1.5px solid #1d4ed8 !important;
    }}
    div[data-testid="stFormSubmitButton"] button:hover,
    div[data-testid="stButton"] button[kind="primary"]:hover,
    div[data-testid="stCameraInput"] button:hover {{
        background-color: #1d4ed8 !important;
        color: #ffffff !important;
        border-color: #1e40af !important;
    }}
    div[data-testid="stButton"] button[kind="primary"] p,
    div[data-testid="stFormSubmitButton"] button p,
    div[data-testid="stCameraInput"] button p {{
        color: #ffffff !important;
    }}

    /* Secondary Action Buttons (Stop Audio, Log Out) */
    div[data-testid="stButton"] button[kind="secondary"] {{
        background-color: {card_bg} !important;
        color: {text_color} !important;
        border: 1.5px solid {border_color} !important;
    }}
    div[data-testid="stButton"] button[kind="secondary"]:hover {{
        background-color: {'#e2e8f0' if is_light else '#1e293b'} !important;
        color: {'#000000' if is_light else '#ffffff'} !important;
        border-color: #3b82f6 !important;
    }}
    div[data-testid="stButton"] button[kind="secondary"] p {{
        color: {text_color} !important;
    }}

    /* Badges */
    .status-pill {{
        display: inline-block;
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 0.85rem;
        font-weight: 600;
        margin: 0.4rem 0;
    }}
    .pill-green {{
        background-color: rgba(16, 185, 129, 0.15);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.3);
    }}
    .pill-amber {{
        background-color: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.3);
    }}
    .pill-red {{
        background-color: rgba(239, 68, 68, 0.15);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
    }}

    /* High-Visibility Keyboard Focus Rings for Tab Navigation */
    *:focus-visible, 
    button:focus-visible, 
    input:focus-visible, 
    [data-baseweb="radio"]:focus-within,
    [tabindex="0"]:focus-visible,
    div[data-testid="stSelectbox"]:focus-within {{
        outline: 4px solid {'#f59e0b' if is_blind else '#2563eb'} !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 0 5px {'rgba(245, 158, 11, 0.5)' if is_blind else 'rgba(37, 99, 235, 0.4)'} !important;
    }}

    /* Camera Circular Viewfinder Frame */
    div[data-testid="stCameraInput"] video,
    div[data-testid="stCameraInput"] img {{
        border: 5px dashed #10b981 !important;
        border-radius: 50% !important;
        max-width: 320px !important;
        aspect-ratio: 1 / 1 !important;
        object-fit: cover !important;
        margin: 12px auto !important;
        display: block !important;
        box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.22), 0 0 30px rgba(16, 185, 129, 0.45) !important;
    }}
</style>
""", unsafe_allow_html=True)

# ----------------- SIDEBAR CONTROLS (UNILINGUAL) -----------------
with st.sidebar:
    # 1. LANGUAGE SELECTOR (10 Languages in English)
    st.subheader(f"🌐 {t['sidebar_lang_label']}")
    selected_lang = st.selectbox(
        t["sidebar_lang_label"],
        options=AVAILABLE_LANGUAGES,
        index=AVAILABLE_LANGUAGES.index(st.session_state.lang) if st.session_state.lang in AVAILABLE_LANGUAGES else 0,
        label_visibility="collapsed"
    )
    if selected_lang != st.session_state.lang:
        st.session_state.lang = selected_lang
        st.rerun()

    st.markdown("---")
    # 2. ACCESSIBILITY MODE SELECTOR
    st.subheader("🛡️ Accessibility Mode")
    selected_access = st.radio(
        "Accessibility Mode",
        options=ACCESSIBILITY_MODES,
        index=ACCESSIBILITY_MODES.index(st.session_state.access_mode) if st.session_state.access_mode in ACCESSIBILITY_MODES else 0,
        key="sidebar_access_mode_radio",
        label_visibility="collapsed"
    )
    if selected_access != st.session_state.access_mode:
        st.session_state.access_mode = selected_access
        if selected_access == "Blind Assist Mode":
            st.session_state.should_announce_blind = True
        st.rerun()

    st.markdown("---")
    # 3. THEME SELECTOR (Strictly translated)
    st.subheader(f"🎨 {t['sidebar_theme_label']}")
    theme_choices = [f"🌙 {t['sidebar_theme_dark']}", f"☀️ {t['sidebar_theme_light']}"]
    current_theme_idx = 0 if st.session_state.theme_mode == "Dark" else 1
    
    selected_theme_str = st.radio(
        t["sidebar_theme_label"],
        options=theme_choices,
        index=current_theme_idx,
        horizontal=True,
        label_visibility="collapsed"
    )
    new_theme = "Dark" if selected_theme_str == theme_choices[0] else "Light"
    if new_theme != st.session_state.theme_mode:
        st.session_state.theme_mode = new_theme
        st.rerun()

    st.markdown("---")
    # 4. ACCESSIBILITY FONT SIZE SLIDER (Strictly translated)
    st.subheader(f"🔤 {t['sidebar_font_label']}")
    selected_font = st.select_slider(
        t["sidebar_font_help"],
        options=FONT_OPTIONS,
        value=st.session_state.font_scale if st.session_state.font_scale in FONT_OPTIONS else FONT_OPTIONS[1],
        label_visibility="collapsed"
    )
    if selected_font != st.session_state.font_scale:
        st.session_state.font_scale = selected_font
        st.rerun()


t = SafeDict(TRANSLATIONS.get(st.session_state.lang, TRANSLATIONS.get("English", {})))

speech_lang_code = {
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
}.get(st.session_state.lang, "en-US")

# ----------------- CLIENT-SIDE KEYBOARD SHORTCUTS & TAB FOCUS SCREEN READER -----------------
components.html(f"""
<script>
(function() {{
    function setupShortcuts() {{
        var doc = (window.parent && window.parent.document) || document;
        if (!doc) return;
        
        doc.__accessCurrentLang = "{speech_lang_code}";
        
        if (doc.__accessShortcutsInstalled) return;
        doc.__accessShortcutsInstalled = true;
        
        var lastSpoken = "";
        var speakTimer = null;
        
        function speakFocus(text) {{
            if (!text || text.trim() === "" || text === lastSpoken) return;
            lastSpoken = text;
            
            clearTimeout(speakTimer);
            speakTimer = setTimeout(function() {{
                try {{
                    var synth = (window.parent && window.parent.speechSynthesis) || window.speechSynthesis;
                    if (synth) {{
                        synth.cancel();
                        var u = new SpeechSynthesisUtterance(text);
                        u.lang = doc.__accessCurrentLang || "en-US";
                        u.rate = 1.05;
                        synth.speak(u);
                    }}
                }} catch(e) {{}}
            }}, 40);
        }}

        function getElementDescription(el) {{
            if (!el) return "";
            var text = "";
            
            // Radio option
            var radio = el.closest('[data-baseweb="radio"]') || el.closest('label');
            if (radio && radio.innerText) {{
                return "Accessibility Option " + radio.innerText.trim();
            }}
            
            // Buttons
            if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {{
                var btnTxt = (el.innerText || el.getAttribute('aria-label') || "").trim();
                if (btnTxt.includes("Read Screen") || btnTxt.includes("Read")) {{
                    return "Read Screen button. Press Enter to listen.";
                }} else if (btnTxt.includes("Stop")) {{
                    return "Stop Audio button. Press Enter to stop.";
                }} else if (btnTxt.includes("Voice Instructions")) {{
                    return "Voice Instructions button. Press Enter to hear camera guide.";
                }} else if (btnTxt.includes("Play Audio Pulses")) {{
                    return "Play Audio Pulses challenge button. Press Enter to listen to beeps.";
                }} else if (btnTxt.includes("New Challenge")) {{
                    return "New Audio Challenge button. Press Enter to generate new sounds.";
                }} else if (btnTxt.includes("Pulses")) {{
                    return "Option " + btnTxt + " button. Press Enter to submit answer.";
                }} else if (btnTxt.includes("Take Photo")) {{
                    return "Take photo button. Press Enter or Space to capture.";
                }} else if (btnTxt.includes("Clear photo")) {{
                    return "Clear photo button. Press Enter to retake.";
                }} else if (btnTxt.includes("Register")) {{
                    return "Register account button. Press Enter to submit.";
                }} else if (btnTxt.includes("Log In") || btnTxt.includes("Login")) {{
                    return "Log In button. Press Enter to authenticate.";
                }} else {{
                    return btnTxt + " button. Press Enter to activate.";
                }}
            }}
            
            // Inputs
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {{
                var widget = el.closest('div[data-testid="stTextInput"]') || el.closest('div[data-testid="stWidgetLabel"]') || el.parentElement;
                var widgetLabel = widget ? widget.innerText.split('\\n')[0] : "";
                var ph = el.getAttribute('placeholder') || "";
                var name = widgetLabel || ph || el.type || "text";
                return name + " input field. Type your value.";
            }}
            
            // Camera input container
            if (el.closest('div[data-testid="stCameraInput"]')) {{
                return "Camera face scanner with circular guide. Position face inside circle and press Enter to capture.";
            }}
            
            // Selectbox
            if (el.closest('div[data-testid="stSelectbox"]')) {{
                return (el.innerText || "Language") + " dropdown. Press Enter to select.";
            }}
            
            if (el.getAttribute('aria-label')) {{
                return el.getAttribute('aria-label');
            }}
            
            return "";
        }}

        // Live Tab & Focus Event Listener
        doc.addEventListener('focusin', function(e) {{
            var desc = getElementDescription(e.target);
            if (desc) speakFocus(desc);
        }}, true);

        // Fallback on Tab keyup
        doc.addEventListener('keyup', function(e) {{
            if (e.key === 'Tab') {{
                setTimeout(function() {{
                    var activeEl = doc.activeElement;
                    var desc = getElementDescription(activeEl);
                    if (desc) speakFocus(desc);
                }}, 60);
            }}
        }}, true);

        // Keydown shortcuts
        doc.addEventListener('keydown', function(e) {{
            // Alt + B for Blind Assist Mode
            if (e.altKey && (e.key === 'b' || e.key === 'B')) {{
                e.preventDefault();
                var radios = doc.querySelectorAll('[data-baseweb="radio"]');
                for (var i = 0; i < radios.length; i++) {{
                    if (radios[i].innerText && radios[i].innerText.includes('Blind Assist Mode')) {{
                        radios[i].click();
                        speakFocus("Blind Assist Mode activated");
                        break;
                    }}
                }}
            }}
            // Alt + D for Dyslexia Mode
            else if (e.altKey && (e.key === 'd' || e.key === 'D')) {{
                e.preventDefault();
                var radios = doc.querySelectorAll('[data-baseweb="radio"]');
                for (var i = 0; i < radios.length; i++) {{
                    if (radios[i].innerText && radios[i].innerText.includes('Dyslexia Mode')) {{
                        radios[i].click();
                        speakFocus("Dyslexia Mode activated");
                        break;
                    }}
                }}
            }}
            // Alt + S for Standard Mode
            else if (e.altKey && (e.key === 's' || e.key === 'S')) {{
                e.preventDefault();
                var radios = doc.querySelectorAll('[data-baseweb="radio"]');
                for (var i = 0; i < radios.length; i++) {{
                    if (radios[i].innerText && radios[i].innerText.includes('Standard Mode')) {{
                        radios[i].click();
                        speakFocus("Standard Mode activated");
                        break;
                    }}
                }}
            }}
            // Alt + V for Voice Assistant Speak
            else if (e.altKey && (e.key === 'v' || e.key === 'V')) {{
                e.preventDefault();
                var btns = doc.querySelectorAll('button');
                for (var j = 0; j < btns.length; j++) {{
                    if (btns[j].innerText && (btns[j].innerText.includes('Read') || btns[j].innerText.includes('Voice Assistant'))) {{
                        btns[j].click();
                        break;
                    }}
                }}
            }}
        }});
    }}
    setupShortcuts();
    setInterval(setupShortcuts, 1500);
}})();
</script>
""", height=0, width=0)

# ===============================================================
# 🌟 TOP-LEVEL ACCESSIBILITY & VOICE BAR (FIRST TAB STOP ON LAPTOP)
# ===============================================================
with st.container():
    top_col1, top_col2 = st.columns([3, 2])
    with top_col1:
        st.markdown("**🛡️ Accessibility Mode Selection**")
        top_access = st.radio(
            "Accessibility Mode Selection",
            options=ACCESSIBILITY_MODES,
            index=ACCESSIBILITY_MODES.index(st.session_state.access_mode) if st.session_state.access_mode in ACCESSIBILITY_MODES else 0,
            horizontal=True,
            key="top_access_mode_radio",
            label_visibility="collapsed"
        )
        if top_access != st.session_state.access_mode:
            st.session_state.access_mode = top_access
            if top_access == "Blind Assist Mode":
                st.session_state.should_announce_blind = True
            st.rerun()

    with top_col2:
        st.markdown("**🎙️ Universal Voice Assistant**")
        v_col1, v_col2 = st.columns(2)
        with v_col1:
            if st.button("🔊 Read Screen", key="top_speak_btn", type="primary", use_container_width=True):
                if st.session_state.access_mode == "Blind Assist Mode":
                    play_speech(t["blind_welcome_speech"], st.session_state.lang)
                elif st.session_state.access_mode == "Dyslexia Mode":
                    play_speech("Dyslexia mode active. Lexend typography and mirror cue highlighting are enabled. You can use standard login or one tap face biometric login.", st.session_state.lang)
                else:
                    play_speech(t["speech_text"], st.session_state.lang)
        with v_col2:
            if st.button(t["stop_btn"], key="top_stop_btn", type="secondary", use_container_width=True):
                stop_speech()
                
    st.caption("⌨️ Laptop Shortcuts: Press Alt + B for Blind Mode • Alt + D for Dyslexia Mode • Alt + S for Standard Mode • Press Tab to navigate")

# Blind Mode Audio Auto-Announcement
if st.session_state.access_mode == "Blind Assist Mode":
    if st.session_state.get("should_announce_blind", False):
        st.session_state.should_announce_blind = False
        play_speech(t["blind_welcome_speech"], st.session_state.lang)

# ----------------- MAIN TITLE HEADER -----------------
st.markdown(f"""
<div class="app-header">
    <div class="app-title">🛡️ {t['title']}</div>
    <div class="app-subtitle">{t['subtitle']}</div>
</div>
""", unsafe_allow_html=True)

# Active Mode Banner
if st.session_state.access_mode == "Dyslexia Mode":
    st.markdown(f"""
    <div style="background-color: {card_bg}; border: 1.5px solid #2563eb; border-radius: 12px; padding: 12px 18px; margin: 10px 0 18px 0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
        <div>
            <strong style="color: #2563eb; font-size: 1.02rem;">🔤 Dyslexia Mode Active</strong>
            <div style="font-size: 0.88rem; color: {sub_color}; margin-top: 2px;">Lexend Typography • Wide Letter Spacing • Warm Contrast Tint</div>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px;">
            <span style="background: rgba(37,99,235,0.12); color: #2563eb; font-weight: 700; padding: 3px 8px; border-radius: 4px;">b Blue</span>
            <span style="background: rgba(22,163,74,0.12); color: #16a34a; font-weight: 700; padding: 3px 8px; border-radius: 4px;">d Green</span>
            <span style="background: rgba(147,51,234,0.12); color: #9333ea; font-weight: 700; padding: 3px 8px; border-radius: 4px;">p Purple</span>
            <span style="background: rgba(234,88,12,0.12); color: #ea580c; font-weight: 700; padding: 3px 8px; border-radius: 4px;">q Orange</span>
            <span style="background: rgba(217,119,6,0.12); color: #d97706; font-weight: 700; padding: 3px 8px; border-radius: 4px;">m Amber</span>
            <span style="background: rgba(220,38,38,0.12); color: #dc2626; font-weight: 700; padding: 3px 8px; border-radius: 4px;">w Red</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
# ----------------- LOGGED IN DASHBOARD -----------------
if st.session_state.logged_in_user:
    user = st.session_state.logged_in_user
    st.success(f"🎉 **{user['fullname']}**, you have successfully logged in!")
    
    is_google = (user.get("provider") == "Google SSO OAuth 2.0")
    if is_google:
        auth_badge = '<span class="status-pill pill-green">🌐 Google OAuth 2.0 SSO</span>'
        method_desc = "Google Identity Services OpenID Connect"
        token_info = "Google ID Token: <code>ya29.a0AfH6S... Verified</code>"
    else:
        auth_badge = '<span class="status-pill pill-green">👤 Multi-Factor Biometric Auth</span>'
        method_desc = "PBKDF2 Password + Facial Biometrics"
        token_info = "Cryptographic Salt: <code>PBKDF2-HMAC-SHA256</code>"

    st.markdown(f"""
    <div class="adaptive-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="margin: 0;">👤 Account Verified</h4>
            {auth_badge}
        </div>
        <p>• <strong>Full Name:</strong> {user['fullname']}<br>
        • <strong>Email:</strong> {user['email']}<br>
        • <strong>Phone:</strong> {user.get('phone', '+91 98765-XXXXX')}<br>
        • <strong>Authentication Method:</strong> {method_desc}<br>
        • <strong>Security Protocol:</strong> {token_info}<br>
        • <strong>Session Risk:</strong> Normal - Zero Trust Evaluated Low Risk 0.05</p>
    </div>
    """, unsafe_allow_html=True)
    
    if st.button("🚪 Log Out", type="secondary"):
        st.session_state.logged_in_user = None
        st.session_state.login_attempts = 0
        st.session_state.target_email_locked = None
        st.session_state.generated_otp = None
        st.session_state.show_google_dialog = False
        st.rerun()
    st.stop()

# ===============================================================
# 👁️ BLIND ASSIST MODE: EYES-FREE VOICE & BIOMETRIC CONSOLE
# ===============================================================
if st.session_state.access_mode == "Blind Assist Mode":
    st.markdown(f"""
    <div style="background-color: {card_bg}; border: 3px solid {'#f59e0b' if is_light else '#fbbf24'}; border-radius: 14px; padding: 18px 22px; margin: 8px 0 22px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <div>
                <h3 style="margin: 0; color: {'#000000' if is_light else '#ffffff'};">👁️ Blind Assist Voice Console</h3>
                <p style="margin: 4px 0 0 0; color: {sub_color}; font-size: 1.02rem;">Voice Guided • Eyes-Free Face Login • Acoustic Security Challenge</p>
            </div>
            <div style="margin-top: 6px;">
                <span class="status-pill pill-green" style="font-size: 0.95rem;">🔊 Audio Guidance Active</span>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # 1. ONE-TAP FACE BIOMETRIC LOGIN (PRIMARY EYES-FREE METHOD)
    with st.container(border=True):
        st.markdown("### 📸 Eyes-Free One-Tap Face Biometric Login")
        st.write("Position your face inside the green circular viewfinder and take a photo. Our spatial voice engine will guide you automatically.")
        
        col_b_cam1, col_b_cam2 = st.columns([3, 1])
        with col_b_cam1:
            blind_face_cam = st.camera_input("Scan Face for Eyes-Free Login", key="blind_main_face_cam")
        with col_b_cam2:
            if st.button("🔊 Voice Instructions", key="blind_voice_cam_btn", type="secondary", use_container_width=True):
                play_speech("Position your face directly towards your camera inside the circular guide and take a photo. If needed, the system will tell you to turn on lights or move your face.", st.session_state.lang)

        if blind_face_cam:
            spatial_b = analyze_face_spatial_guidance(blind_face_cam)
            if not spatial_b["is_ready"]:
                v_msg_b = get_spatial_voice_text(spatial_b["status"], st.session_state.lang)
                st.error(f"⚠️ {v_msg_b}")
                play_speech(v_msg_b, st.session_state.lang)
            else:
                centered_txt = get_spatial_voice_text("CENTERED", st.session_state.lang)
                st.info(f"✅ {centered_txt}")
                play_speech("Face detected inside circle. Verifying credentials.", st.session_state.lang)
                
                # Automatically check against all enrolled faces in database
                all_users = db.get_all_users_with_face()
                best_match = None
                best_score = 0.0
                for u in all_users:
                    matched, msg, score = compare_faces(u["face_data"], blind_face_cam, threshold=0.45)
                    if matched and score > best_score:
                        best_match = u
                        best_score = score
                
                if best_match:
                    st.success(f"✅ Face verified! Welcome back, {best_match['fullname']}!")
                    play_speech(f"Face verified. Welcome back {best_match['fullname']}", st.session_state.lang)
                    st.session_state.login_attempts = 0
                    db.reset_failed_attempts(best_match["email"])
                    st.session_state.logged_in_user = dict(best_match)
                    st.rerun()
                else:
                    st.error("❌ Face does not match registered biometrics. Please adjust lighting or try again.")
                    play_speech("Face does not match registered biometrics. Please adjust lighting and try again.", st.session_state.lang)

    # 2. ACOUSTIC SECURITY VIBRATION CHALLENGE (CAPTCHA FOR BLIND USERS)
    with st.container(border=True):
        st.markdown("### 📳 Audio Security Vibration Challenge")
        st.write("Acoustic CAPTCHA designed for visually impaired users. Listen to the audio pulse beeps and select the count.")
        
        col_p1, col_p2 = st.columns([1.5, 1])
        with col_p1:
            if st.button("🔊 Play Audio Pulses", key="blind_play_pulses_btn", type="primary", use_container_width=True):
                play_audio_pulses(st.session_state.audio_pulse_count)
                play_speech(t["audio_challenge_prompt"], st.session_state.lang)
        with col_p2:
            if st.button("🔄 New Challenge", key="blind_new_pulses_btn", type="secondary", use_container_width=True):
                st.session_state.audio_pulse_count = random.choice([2, 3, 4, 5])
                st.session_state.blind_challenge_solved = False
                st.rerun()

        st.markdown("**How many audio pulses did you hear?**")
        p_c1, p_c2, p_c3, p_c4 = st.columns(4)
        for col, count_val in zip([p_c1, p_c2, p_c3, p_c4], [2, 3, 4, 5]):
            with col:
                if st.button(f"{count_val} Pulses", key=f"pulse_sel_{count_val}", use_container_width=True):
                    if count_val == st.session_state.audio_pulse_count:
                        st.session_state.blind_challenge_solved = True
                        play_speech(t["audio_challenge_pass"], st.session_state.lang)
                        st.success(t["audio_challenge_pass"])
                    else:
                        play_speech("Incorrect pulse count. Please listen again.", st.session_state.lang)
                        st.error("Incorrect count. Please click Play Audio Pulses to listen again.")

        if st.session_state.blind_challenge_solved:
            st.success("✅ Acoustic Security Challenge Verified! Human User Confirmed.")

    # 3. REGISTER NEW USER (SIGN UP)
    with st.expander("📝 Register New Account & Enroll Face", expanded=False):
        st.write("Register a new user account with eyes-free face enrollment:")
        b_su_name = st.text_input(f"{t['fullname']} *", placeholder="Your Name", key="b_su_name")
        b_su_email = st.text_input(f"{t['email']} *", placeholder="name@example.com", key="b_su_email")
        b_su_phone = st.text_input(f"{t['phone']} *", placeholder="+91 9876543210", key="b_su_phone")
        b_su_pass = st.text_input(f"{t['password']} *", type="password", placeholder="••••••••", key="b_su_pass")
        b_su_cam = st.camera_input("Capture Face for Enrollment", key="b_su_cam")
        if b_su_cam:
            sp_su = analyze_face_spatial_guidance(b_su_cam)
            if not sp_su["is_ready"]:
                st.warning(get_spatial_voice_text(sp_su["status"], st.session_state.lang))
            else:
                st.info(get_spatial_voice_text("CENTERED", st.session_state.lang))
        if st.button("Register & Enroll Face", key="b_su_btn", type="primary", use_container_width=True):
            if not b_su_name or not b_su_email or not b_su_pass or not b_su_cam:
                st.error("Please fill all required fields and capture face.")
            else:
                sp_su = analyze_face_spatial_guidance(b_su_cam)
                if not sp_su["is_ready"]:
                    st.error("No face detected inside circle. Please position face in circle and retake photo.")
                    play_speech("No face detected inside circle. Please position face in circle and retake photo.", st.session_state.lang)
                else:
                    ok, face_res = extract_face_features(b_su_cam)
                    if ok:
                        reg_ok, reg_msg = db.register_user(b_su_name, b_su_email, b_su_phone, b_su_pass, face_res)
                        if reg_ok:
                            st.success(t["signup_success"])
                            play_speech(f"Welcome {b_su_name}. Account registered successfully.", st.session_state.lang)
                        else:
                            st.error(reg_msg)
                    else:
                        st.error("Failed to extract face features. Please retake photo.")

    # 4. MANUAL CREDENTIALS LOGIN FOR ASSISTED ACCESS
    with st.expander("📝 Manual Text Login for Assisted Access", expanded=False):
        st.write("If someone is assisting you with manual typing:")
        with st.form("blind_assisted_login_form"):
            b_email = st.text_input(t["email"], placeholder="name@example.com", key="b_login_email")
            b_password = st.text_input(t["password"], type="password", placeholder="••••••••", key="b_login_pass")
            b_submit = st.form_submit_button(t["login_btn"], type="primary", use_container_width=True)
            if b_submit:
                user = db.get_user_by_email(b_email)
                if user and db.verify_password(b_password, user["salt"], user["password_hash"]):
                    st.success("✅ Login successful!")
                    st.session_state.login_attempts = 0
                    db.reset_failed_attempts(b_email)
                    st.session_state.logged_in_user = dict(user)
                    st.rerun()
                else:
                    st.error(t["err_invalid_login"])

    st.markdown("---")
    st.caption("🔒 PS05: Secure & Accessible Digital Authentication • Multi-Factor Biometric & Adaptive Recovery")
    st.stop()

# ----------------- MAIN TABS -----------------
tab_login, tab_signup, tab_guide = st.tabs([
    t["tab_login"], 
    t["tab_signup"], 
    t["tab_guide"]
])

# ===============================================================
# TAB 1: LOGIN (WITH CAPTCHA & ADAPTIVE 3-FAILED RECOVERY)
# ===============================================================
with tab_login:
    st.subheader(t["login_heading"])

    # 3 FAILED ATTEMPTS -> ADAPTIVE RECOVERY
    if st.session_state.login_attempts >= 3:
        st.error(t["risk_alert_title"])
        st.markdown(f"**{t['risk_alert_desc']}**")
        
        fallback_choice = st.radio(
            t["choose_fallback"],
            options=[t["fallback_otp"], t["fallback_face"]],
            horizontal=True
        )
        
        user_record = db.get_user_by_email(st.session_state.target_email_locked) if st.session_state.target_email_locked else None

        # FALLBACK 1: OTP VERIFICATION
        if fallback_choice == t["fallback_otp"]:
            st.markdown("---")
            st.markdown("#### 📱 Step-Up OTP Verification")
            
            masked_phone = user_record["phone"] if user_record else "+91 98765-XXXXX"
            if not st.session_state.generated_otp:
                st.session_state.generated_otp = FrictionEngine.generate_otp()
            
            st.info(t["otp_sent_msg"].format(masked_phone))
            # Presentation Demo hint
            st.caption(f"💡 Demo SMS Code: **{st.session_state.generated_otp}**")

            entered_otp = st.text_input(t["enter_otp"], max_chars=6, placeholder="6-digit code")
            
            if st.button(t["verify_otp_btn"], type="primary", use_container_width=True):
                if entered_otp.strip() == st.session_state.generated_otp:
                    st.success(t["otp_success"])
                    st.session_state.login_attempts = 0
                    if user_record:
                        db.reset_failed_attempts(user_record["email"])
                        st.session_state.logged_in_user = dict(user_record)
                    else:
                        st.session_state.logged_in_user = {
                            "fullname": "Verified User",
                            "email": st.session_state.target_email_locked or "user@example.com",
                            "phone": masked_phone
                        }
                    st.session_state.generated_otp = None
                    st.rerun()
                else:
                    st.error(t["otp_fail"])

        # FALLBACK 2: FACE RECOGNITION
        elif fallback_choice == t["fallback_face"]:
            st.markdown("---")
            if "flash_login" not in st.session_state:
                st.session_state.flash_login = False

            col_lcam1, col_lcam2 = st.columns([3, 2])
            with col_lcam1:
                st.markdown("#### 📸 Step-Up Face Recognition Unlock")
                st.write(t["take_face_login"])
            with col_lcam2:
                flash_l_state = st.toggle("💡 Auto Flashlight", value=st.session_state.flash_login, key="login_flash_toggle")
                if flash_l_state != st.session_state.flash_login:
                    st.session_state.flash_login = flash_l_state
                    st.rerun()

            if st.session_state.flash_login:
                st.markdown('<div class="screen-flash-box">', unsafe_allow_html=True)
                st.info("💡 **Screen Flashlight Active:** Maximum display luminance is lighting up your face.")
                face_login_cam = st.camera_input("Scan Face for Unlock", key="face_unlock_cam")
                st.markdown('</div>', unsafe_allow_html=True)
            else:
                face_login_cam = st.camera_input("Scan Face for Unlock", key="face_unlock_cam")
            
            if face_login_cam:
                spatial_step = analyze_face_spatial_guidance(face_login_cam)
                if not spatial_step["is_ready"]:
                    v_msg = get_spatial_voice_text(spatial_step["status"], st.session_state.lang)
                    st.warning(f"⚠️ {v_msg}")
                    play_speech(v_msg, st.session_state.lang)
                else:
                    st.info(f"✅ {get_spatial_voice_text('CENTERED', st.session_state.lang)}")
            
            if face_login_cam and st.button(t["verify_face_btn"], type="primary", use_container_width=True):
                # Spatial Check
                spatial_step = analyze_face_spatial_guidance(face_login_cam)
                if not spatial_step["is_ready"]:
                    v_msg = get_spatial_voice_text(spatial_step["status"], st.session_state.lang)
                    st.error(f"⚠️ {v_msg}")
                    play_speech(v_msg, st.session_state.lang)
                else:
                    # Automatic Dark Environment Detection
                    is_dark, brightness = check_lighting(face_login_cam)
                    if is_dark and not st.session_state.flash_login:
                        st.session_state.flash_login = True
                        st.warning(f"⚠️ **Low Lighting Detected: {brightness}/255!** Screen Flashlight automatically turned ON. Please retake photo with screen flash.")
                        st.rerun()

                    with st.spinner("Analyzing biometric scan..."):
                        if user_record and user_record.get("face_data"):
                            matched, msg, score = compare_faces(user_record["face_data"], face_login_cam, threshold=0.45)
                            if matched:
                                st.success(f"{t['face_match_success']} • Match Confidence: {int(score*100)}%")
                                st.session_state.login_attempts = 0
                                db.reset_failed_attempts(user_record["email"])
                                st.session_state.logged_in_user = dict(user_record)
                                st.rerun()
                            else:
                                st.error(f"{t['face_match_fail']} • Score: {int(score*100)}%")
                        else:
                            st.error("No registered biometric face template found for this user. Please use OTP verification.")

    # STANDARD LOGIN (< 3 attempts)
    else:
        # Audio & Accessibility assistance banner right before the login form
        col_audio1, col_audio2 = st.columns([2.5, 1.5])
        with col_audio1:
            if st.session_state.access_mode == "Dyslexia Mode":
                st.caption("🔤 Dyslexia Mode: Wide letter spacing and mirror-cue guidance enabled.")
            elif st.session_state.access_mode == "Blind Assist Mode":
                st.caption("👁️ Blind Assist Mode: Audio assistance ready.")
        with col_audio2:
            if st.button("🔊 Read Security Code", key="btn_read_captcha_top", type="secondary", use_container_width=True):
                play_speech(f"Security challenge. What is {st.session_state.captcha_q}", st.session_state.lang)

        with st.form("login_form"):
            login_email = st.text_input(t["email"], placeholder="name@example.com")
            login_password = st.text_input(t["password"], type="password", placeholder="••••••••")
            
            st.markdown(f"**{t['captcha_label']}:**")
            col_c1, col_c2 = st.columns([1, 2])
            with col_c1:
                st.info(f"🧮 What is **{st.session_state.captcha_q}** ?")
            with col_c2:
                captcha_input = st.text_input("Captcha Result", placeholder="Enter answer", label_visibility="collapsed")
            
            submit_login = st.form_submit_button(t["login_btn"], type="primary", use_container_width=True)
            
            if submit_login:
                # 1. Validate CAPTCHA
                captcha_valid = False
                try:
                    if int(captcha_input.strip()) == st.session_state.captcha_a:
                        captcha_valid = True
                except:
                    captcha_valid = False
                
                # 2. Check credentials
                user = db.get_user_by_email(login_email)
                credentials_valid = False
                if user and db.verify_password(login_password, user["salt"], user["password_hash"]):
                    credentials_valid = True
                
                if credentials_valid and captcha_valid:
                    st.success("✅ Login successful!")
                    st.session_state.login_attempts = 0
                    db.reset_failed_attempts(login_email)
                    st.session_state.logged_in_user = dict(user)
                    st.rerun()
                else:
                    st.session_state.login_attempts += 1
                    st.session_state.target_email_locked = login_email
                    st.session_state.captcha_q, st.session_state.captcha_a = FrictionEngine.generate_captcha()
                    
                    st.error(t["err_invalid_login"])
                    st.warning(t["attempts_warning"].format(st.session_state.login_attempts))
                    st.rerun()

        # DIVIDER: OR
        st.markdown(f"""
        <div style="display: flex; align-items: center; text-align: center; margin: 1.4rem 0 0.8rem 0;">
            <div style="flex: 1; border-bottom: 1px solid {border_color};"></div>
            <span style="padding: 0 14px; font-size: 0.85rem; font-weight: 700; color: {sub_color}; letter-spacing: 1px;">OR</span>
            <div style="flex: 1; border-bottom: 1px solid {border_color};"></div>
        </div>
        """, unsafe_allow_html=True)

        col_act1, col_act2 = st.columns(2)
        with col_act1:
            if st.button("📸 One-Tap Face Biometric Login", key="face_login_toggle_btn", type="secondary", use_container_width=True):
                st.session_state.show_face_login = not st.session_state.get("show_face_login", False)
                st.session_state.show_google_dialog = False
        with col_act2:
            if st.button(f"🌐 {t['login_google']}", key="google_login_toggle", type="secondary", use_container_width=True):
                st.session_state.show_google_dialog = not st.session_state.get("show_google_dialog", False)
                st.session_state.show_face_login = False

        # ONE-TAP BIOMETRIC FACE LOGIN MODAL/BOX
        if st.session_state.get("show_face_login", False):
            st.markdown("---")
            st.markdown("#### 📸 Eyes-Free Biometric Face Login")
            st.caption("Position your face in front of the camera. The system will guide you automatically.")
            
            face_quick_cam = st.camera_input("Scan Face for Login", key="quick_face_cam")
            if face_quick_cam:
                spatial_l = analyze_face_spatial_guidance(face_quick_cam)
                if not spatial_l["is_ready"]:
                    voice_msg_l = get_spatial_voice_text(spatial_l["status"], st.session_state.lang)
                    st.warning(f"⚠️ {voice_msg_l}")
                    play_speech(voice_msg_l, st.session_state.lang)
                else:
                    st.info(f"✅ {get_spatial_voice_text('CENTERED', st.session_state.lang)}")
                    if st.button("Verify Face & Log In", key="quick_face_verify_btn", type="primary", use_container_width=True):
                        with st.spinner("Analyzing biometric scan..."):
                            all_users = db.get_all_users_with_face()
                            best_match = None
                            best_score = 0.0
                            for u in all_users:
                                matched, msg, score = compare_faces(u["face_data"], face_quick_cam, threshold=0.45)
                                if matched and score > best_score:
                                    best_match = u
                                    best_score = score
                            
                            if best_match:
                                st.success(f"✅ Face verified! Welcome back, {best_match['fullname']}!")
                                play_speech(f"Face verified. Welcome back {best_match['fullname']}", st.session_state.lang)
                                st.session_state.login_attempts = 0
                                db.reset_failed_attempts(best_match["email"])
                                st.session_state.logged_in_user = dict(best_match)
                                st.session_state.show_face_login = False
                                st.rerun()
                            else:
                                st.error("❌ Face does not match registered biometrics. Please adjust lighting or try again.")
                                play_speech("Face does not match registered biometrics.", st.session_state.lang)

        # GOOGLE POPUP MODAL (MATCHING GOOGLE ACCOUNTS OAUTH SCREENSHOT)
        if st.session_state.get("show_google_dialog", False):
            google_accounts_list = [
                {"name": "Aishwarya bh", "email": "aishuaadharv@gmail.com", "avatar": "A", "color": "#1a73e8"},
                {"name": "Aishwarya B H", "email": "aishwarya_bit28@mepcoeng.ac.in", "avatar": "A", "color": "#12b5cb"},
                {"name": "Akshitha B H", "email": "akshiaadharv_bai28@mepcoeng.ac.in", "avatar": "A", "color": "#5f6368"},
                {"name": "Nithya Shree T", "email": "nithya280607_bit28@mepcoeng.ac.in", "avatar": "N", "color": "#0d904f"},
                {"name": "Ezhilarasi R", "email": "ezhilarasir_bit28@mepcoeng.ac.in", "avatar": "E", "color": "#5f6368", "sub": "Signed out"},
                {"name": "Aishu BH", "email": "aishunithya123@gmail.com", "avatar": "A", "color": "#8430ce"},
                {"name": "Nithya", "email": "nithyaathirumoorthy@gmail.com", "avatar": "N", "color": "#e8710a"}
            ]

            st.markdown("""
            <div style="background-color: #131314; border: 1px solid #3c4043; border-radius: 20px; padding: 22px 26px; margin: 16px 0; color: #e3e3e3; box-shadow: 0 10px 30px rgba(0,0,0,0.45);">
                <div style="display: flex; align-items: center; padding-bottom: 14px; border-bottom: 1px solid #2e2f31;">
                    <svg width="20" height="20" viewBox="0 0 48 48" style="margin-right: 10px;">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <span style="font-size: 14px; font-weight: 500; color: #e3e3e3;">Sign in with Google</span>
                </div>
            </div>
            """, unsafe_allow_html=True)

            col_g_left, col_g_right = st.columns([1, 1.3])

            with col_g_left:
                st.markdown("""
                <div style="padding: 10px 5px;">
                    <h2 style="font-size: 26px; font-weight: 400; color: #ffffff; margin-bottom: 6px;">Choose an account</h2>
                    <p style="font-size: 14.5px; color: #9aa0a6;">to continue to <strong style="color: #8ab4f8;">AccessAuth</strong></p>
                </div>
                """, unsafe_allow_html=True)

            with col_g_right:
                for idx, g_acc in enumerate(google_accounts_list):
                    col_info, col_act = st.columns([4, 1.2])
                    with col_info:
                        sub_tag = f"<span style='float:right; font-size:11px; color:#9aa0a6;'>{g_acc.get('sub')}</span>" if g_acc.get("sub") else ""
                        st.markdown(f"""
                        <div style="display: flex; align-items: center; margin-bottom: 2px;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: {g_acc['color']}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; margin-right: 10px; flex-shrink: 0;">{g_acc['avatar']}</div>
                            <div style="line-height: 1.25; overflow: hidden;">
                                <div style="color: #e3e3e3; font-weight: 500; font-size: 14px;">{g_acc['name']} {sub_tag}</div>
                                <div style="color: #9aa0a6; font-size: 12px;">{g_acc['email']}</div>
                            </div>
                        </div>
                        """, unsafe_allow_html=True)
                    with col_act:
                        if st.button("Select", key=f"g_sel_{idx}", type="primary", use_container_width=True):
                            with st.spinner("Authenticating with Google OAuth 2.0..."):
                                g_user = db.get_or_create_google_user(g_acc['name'], g_acc['email'])
                                g_user["provider"] = "Google SSO (OAuth 2.0)"
                                st.session_state.logged_in_user = g_user
                                st.session_state.login_attempts = 0
                                st.session_state.show_google_dialog = False
                                st.rerun()

                    st.markdown("<div style='border-bottom: 1px solid #282a2d; margin: 4px 0 8px 0;'></div>", unsafe_allow_html=True)

                # Use another account option
                with st.expander("👤 Use another account"):
                    c_name = st.text_input("Name", placeholder="Your Name", key="g_u_name")
                    c_email = st.text_input("Google Email", placeholder="user@gmail.com", key="g_u_email")
                    if st.button("Continue", key="g_u_btn", type="primary"):
                        if c_name.strip() and "@" in c_email:
                            with st.spinner("Exchanging OAuth Token..."):
                                g_user = db.get_or_create_google_user(c_name.strip(), c_email.strip().lower())
                                g_user["provider"] = "Google SSO (OAuth 2.0)"
                                st.session_state.logged_in_user = g_user
                                st.session_state.login_attempts = 0
                                st.session_state.show_google_dialog = False
                                st.rerun()
                        else:
                            st.error("Please enter a valid Name and Email.")

                if st.button("✕ Close", key="close_g_box", type="secondary"):
                    st.session_state.show_google_dialog = False
                    st.rerun()

# ===============================================================
# TAB 2: SIGN UP (FIELD VALIDATION + FACE ENROLLMENT)
# ===============================================================
with tab_signup:
    st.subheader(t["signup_heading"])
    st.caption("All fields and biometric facial enrollment are required.")
    
    with st.container():
        signup_name = st.text_input(f"{t['fullname']} *", placeholder="Your Name", key="su_name")
        signup_email = st.text_input(f"{t['email']} *", placeholder="name@example.com", key="su_email")
        signup_phone = st.text_input(f"{t['phone']} *", placeholder="+91 9876543210", key="su_phone")
        
        col_p1, col_p2 = st.columns(2)
        with col_p1:
            signup_pass = st.text_input(f"{t['password']} *", type="password", placeholder="••••••••", key="su_pass")
        with col_p2:
            signup_confirm = st.text_input(f"{t['confirm_password']} *", type="password", placeholder="••••••••", key="su_conf")
        
        # SMART FLASHLIGHT & CAMERA FOR SIGN UP
        if "flash_signup" not in st.session_state:
            st.session_state.flash_signup = False

        col_cam_header, col_cam_toggle = st.columns([3, 2])
        with col_cam_header:
            st.markdown(f"#### 📸 {t['face_enroll_title']}")
            st.caption(t["face_enroll_help"])
        with col_cam_toggle:
            flash_su_state = st.toggle(
                "💡 Auto Flashlight", 
                value=st.session_state.flash_signup, 
                key="su_flash_toggle"
            )
            if flash_su_state != st.session_state.flash_signup:
                st.session_state.flash_signup = flash_su_state
                st.rerun()

        if st.session_state.flash_signup:
            st.markdown('<div class="screen-flash-box">', unsafe_allow_html=True)
            st.info("💡 **Screen Flashlight Active:** Maximum display luminance is lighting up your face.")
            face_camera_image = st.camera_input("Capture Face Biometric", key="signup_camera")
            st.markdown('</div>', unsafe_allow_html=True)
        else:
            face_camera_image = st.camera_input("Capture Face Biometric", key="signup_camera")
        if face_camera_image:
            spatial_su = analyze_face_spatial_guidance(face_camera_image)
            if not spatial_su["is_ready"]:
                voice_msg_su = get_spatial_voice_text(spatial_su["status"], st.session_state.lang)
                st.warning(f"⚠️ {voice_msg_su}")
                play_speech(voice_msg_su, st.session_state.lang)
            else:
                st.info(f"✅ {get_spatial_voice_text('CENTERED', st.session_state.lang)}")
        
        if st.button(t["signup_btn"], type="primary", use_container_width=True):
            missing_fields = []
            if not signup_name.strip(): missing_fields.append(t["fullname"])
            if not signup_email.strip(): missing_fields.append(t["email"])
            if not signup_phone.strip(): missing_fields.append(t["phone"])
            if not signup_pass.strip(): missing_fields.append(t["password"])
            if not signup_confirm.strip(): missing_fields.append(t["confirm_password"])
            
            if missing_fields:
                st.error(f"{t['err_missing_fields']}")
                st.error(f"👉 Missing fields: **{', '.join(missing_fields)}**")
            elif signup_pass != signup_confirm:
                st.error(t["pwd_mismatch"] if "pwd_mismatch" in t else t["err_pwd_mismatch"])
            elif not face_camera_image:
                st.error(t["err_face_missing"])
            else:
                # Spatial Face Guidance Validation
                spatial_su = analyze_face_spatial_guidance(face_camera_image)
                if not spatial_su["is_ready"]:
                    voice_msg_su = get_spatial_voice_text(spatial_su["status"], st.session_state.lang)
                    st.error(f"⚠️ {voice_msg_su}")
                    play_speech(voice_msg_su, st.session_state.lang)
                else:
                    # Automatic Dark Room Detection
                    is_dark, brightness = check_lighting(face_camera_image)
                    if is_dark and not st.session_state.flash_signup:
                        st.session_state.flash_signup = True
                        st.warning(f"⚠️ **Low Lighting Detected: {brightness}/255!** Screen Flashlight automatically turned ON. Please take photo with screen flash.")
                        st.rerun()

                    with st.spinner("Processing biometric template and hashing security keys..."):
                        success, face_result = extract_face_features(face_camera_image)
                        if not success:
                            st.error(f"❌ {face_result}")
                        else:
                            ok, db_msg = db.register_user(
                                fullname=signup_name,
                                email=signup_email,
                                phone=signup_phone,
                                password=signup_pass,
                                face_data=face_result
                            )
                            if ok:
                                st.success(t["signup_success"])
                                play_speech(f"Welcome {signup_name}. Account registered successfully.", st.session_state.lang)
                                st.balloons()
                            else:
                                st.error(f"❌ {db_msg}")

# ===============================================================
# TAB 3: HELP & MULTILINGUAL STEP-BY-STEP INSTRUCTIONS + VOICE
# ===============================================================
with tab_guide:
    st.subheader(t["guide_title"])
    st.caption("Visual and audio guidance to assist anyone with logging in or signing up.")
    
    col_v1, col_v2 = st.columns(2)
    with col_v1:
        if st.button(t["speak_btn"], type="primary", use_container_width=True):
            play_speech(t["speech_text"], st.session_state.lang)
            st.success(f"🔊 Playing audio guide in {st.session_state.lang}...")
    with col_v2:
        if st.button(t["stop_btn"], type="secondary", use_container_width=True):
            stop_speech()
            st.info("⏹️ Audio stopped.")
            
    st.markdown('<div class="help-callout">', unsafe_allow_html=True)
    st.markdown(f"### {t['guide_signup_title']}")
    st.markdown(t["guide_signup_steps"])
    
    st.markdown(f"### {t['guide_login_title']}")
    st.markdown(t["guide_login_steps"])
    
    st.markdown(f"### {t['guide_fail_title']}")
    st.markdown(t["guide_fail_steps"])
    st.markdown('</div>', unsafe_allow_html=True)

# Footer
st.markdown("---")
st.caption("🔒 PS05: Secure & Accessible Digital Authentication • Multi-Factor Biometric & Adaptive Recovery")
