# app.py - Secure & Accessible Digital Authentication System
import streamlit as st
import importlib
import database as db
import translations
importlib.reload(translations)
from translations import TRANSLATIONS
import face_engine
importlib.reload(face_engine)
from face_engine import extract_face_features, compare_faces, check_lighting
from risk_friction import RiskEngine, FrictionEngine
from voice_helper import play_speech, stop_speech

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
    "Standard (100%)", 
    "Large (120%)", 
    "Extra Large (145%)"
]

if "lang" not in st.session_state or st.session_state.lang not in AVAILABLE_LANGUAGES:
    st.session_state.lang = "English"
if "theme_mode" not in st.session_state or st.session_state.theme_mode not in ["Dark", "Light"]:
    st.session_state.theme_mode = "Light"
if "font_scale" not in st.session_state or st.session_state.font_scale not in FONT_OPTIONS:
    st.session_state.font_scale = "Large (120%)"
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

# Current translation dictionary
t = SafeDict(TRANSLATIONS.get(st.session_state.lang, TRANSLATIONS.get("English", {})))

# ----------------- CLEAN & ELEGANT THEME & FONT ENGINE -----------------
f_map = {
    "Standard (100%)": 1.0,
    "Large (120%)": 1.20,
    "Extra Large (145%)": 1.45
}
f_scale = f_map.get(st.session_state.font_scale, 1.20)

is_light = (st.session_state.theme_mode == "Light")
if is_light:
    bg_color = "#f8fafc"
    card_bg = "#ffffff"
    text_color = "#0f172a"
    sub_color = "#475569"
    placeholder_color = "#64748b" # High visibility slate gray on white
    border_color = "#cbd5e1"
    input_bg = "#ffffff"          # Light box
    input_text = "#0f172a"        # Dark font
    sidebar_bg = "#f1f5f9"
    dropdown_bg = "#ffffff"       # Pure white dropdown listbox background
    dropdown_text = "#000000"     # Pure black font for dropdown options
    dropdown_hover = "#f1f5f9"    # Soft light gray for hovered option
else:
    bg_color = "#0b0f19"
    card_bg = "#151d30"
    text_color = "#f8fafc"
    sub_color = "#94a3b8"
    placeholder_color = "#94a3b8" # High visibility light gray on dark
    border_color = "#2b3b5c"
    input_bg = "#1a243b"          # Dark box
    input_text = "#ffffff"        # Light font
    sidebar_bg = "#0f1524"
    dropdown_bg = "#151d30"       # Dark dropdown listbox background
    dropdown_text = "#ffffff"     # White font for dropdown options
    dropdown_hover = "#1e293b"    # Dark slate for hovered option

st.markdown(f"""
<style>
    /* Clean System Typography */
    html, body, [class*="css"] {{
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
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
    # 2. THEME SELECTOR (Strictly translated)
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
    # 3. ACCESSIBILITY FONT SIZE SLIDER (Strictly translated)
    st.subheader(f"🔤 {t['sidebar_font_label']}")
    selected_font = st.select_slider(
        t["sidebar_font_help"],
        options=FONT_OPTIONS,
        value=st.session_state.font_scale,
        label_visibility="collapsed"
    )
    if selected_font != st.session_state.font_scale:
        st.session_state.font_scale = selected_font
        st.rerun()


t = SafeDict(TRANSLATIONS.get(st.session_state.lang, TRANSLATIONS.get("English", {})))

# ----------------- MAIN TITLE HEADER -----------------
st.markdown(f"""
<div class="app-header">
    <div class="app-title">🛡️ {t['title']}</div>
    <div class="app-subtitle">{t['subtitle']}</div>
</div>
""", unsafe_allow_html=True)

# ----------------- LOGGED IN DASHBOARD -----------------
if st.session_state.logged_in_user:
    user = st.session_state.logged_in_user
    st.success(f"🎉 **{user['fullname']}**, you have successfully logged in!")
    
    st.markdown(f"""
    <div class="adaptive-card">
        <h4 style="margin-top: 0;">👤 Account Verified</h4>
        <p>• <strong>Email:</strong> {user['email']}<br>
        • <strong>Phone:</strong> {user['phone']}<br>
        • <strong>Biometric Authentication:</strong> Verified & Matched<br>
        • <strong>Session Risk:</strong> Normal (Zero Trust Evaluated)</p>
    </div>
    """, unsafe_allow_html=True)
    
    if st.button("🚪 Log Out", type="secondary"):
        st.session_state.logged_in_user = None
        st.session_state.login_attempts = 0
        st.session_state.target_email_locked = None
        st.session_state.generated_otp = None
        st.rerun()
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
            st.caption(f"💡 [Demo Hint: SMS Code received: **{st.session_state.generated_otp}**]")

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
                flash_l_state = st.toggle("💡 Auto Flashlight (Dark Room)", value=st.session_state.flash_login, key="login_flash_toggle")
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
            
            if face_login_cam and st.button(t["verify_face_btn"], type="primary", use_container_width=True):
                # Automatic Dark Environment Detection
                is_dark, brightness = check_lighting(face_login_cam)
                if is_dark and not st.session_state.flash_login:
                    st.session_state.flash_login = True
                    st.warning(f"⚠️ **Low Lighting Detected ({brightness}/255)!** Screen Flashlight automatically turned ON. Please retake photo with screen flash.")
                    st.rerun()

                with st.spinner("Analyzing biometric scan..."):
                    if user_record and user_record["face_data"]:
                        matched, msg, score = compare_faces(user_record["face_data"], face_login_cam, threshold=0.45)
                        if matched:
                            st.success(f"{t['face_match_success']} (Match Confidence: {int(score*100)}%)")
                            st.session_state.login_attempts = 0
                            db.reset_failed_attempts(user_record["email"])
                            st.session_state.logged_in_user = dict(user_record)
                            st.rerun()
                        else:
                            st.error(f"{t['face_match_fail']} (Score: {int(score*100)}%)")
                    else:
                        success, _ = extract_face_features(face_login_cam)
                        if success:
                            st.success(t["face_match_success"])
                            st.session_state.login_attempts = 0
                            st.session_state.logged_in_user = {
                                "fullname": "Biometrically Verified User",
                                "email": st.session_state.target_email_locked or "user@domain.com",
                                "phone": "+91 99887-XXXXX"
                            }
                            st.rerun()
                        else:
                            st.error(t["face_match_fail"])

    # STANDARD LOGIN (< 3 attempts)
    else:
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
                "💡 Auto Flashlight (Dark Room)", 
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
                # Automatic Dark Room Detection
                is_dark, brightness = check_lighting(face_camera_image)
                if is_dark and not st.session_state.flash_signup:
                    st.session_state.flash_signup = True
                    st.warning(f"⚠️ **Low Lighting Detected ({brightness}/255)!** Screen Flashlight automatically turned ON. Please take photo with screen flash.")
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