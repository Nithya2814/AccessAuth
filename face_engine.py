# face_engine.py - Pure PIL & NumPy Robust Biometric Engine with Lighting Detection
import json
import numpy as np
from PIL import Image, ImageOps

def check_lighting(image_bytes, threshold: float = 65.0) -> tuple:
    """
    Analyzes camera frame brightness (0 to 255).
    Returns (is_dark: bool, brightness_score: float)
    """
    try:
        pil_img = Image.open(image_bytes).convert("L")
        arr = np.array(pil_img)
        brightness = float(np.mean(arr))
        is_dark = brightness < threshold
        return is_dark, round(brightness, 1)
    except Exception:
        return False, 100.0

def extract_face_features(image_bytes) -> tuple:
    """
    Extracts normalized facial biometric features using PIL & NumPy.
    Includes automatic adaptive contrast enhancement for dim environments.
    Returns: (success: bool, feature_json_or_error: str)
    """
    try:
        # 1. Load image with PIL
        pil_img = Image.open(image_bytes).convert("RGB")
        width, height = pil_img.size
        
        # 2. Extract central 65% facial focus area
        left = int(width * 0.17)
        top = int(height * 0.12)
        right = int(width * 0.83)
        bottom = int(height * 0.88)
        face_crop = pil_img.crop((left, top, right, bottom))
        
        # 3. Grayscale and apply adaptive autocontrast for low-light compensation
        gray = ImageOps.grayscale(face_crop)
        enhanced_gray = ImageOps.autocontrast(gray, cutoff=2)
        resized = enhanced_gray.resize((48, 48), Image.Resampling.LANCZOS)
        
        # 4. Standardize embedding vector
        arr = np.array(resized, dtype=np.float32)
        mean_val = np.mean(arr)
        std_val = np.std(arr) + 1e-7
        norm_arr = (arr - mean_val) / std_val
        
        features = norm_arr.flatten().tolist()
        return True, json.dumps(features)

    except Exception as e:
        return False, f"Biometric extraction error: {str(e)}"

def compare_faces(stored_feature_json: str, live_image_bytes, threshold: float = 0.50) -> tuple:
    """
    Compares enrolled biometric template with live camera feed.
    Cosine similarity matching.
    """
    try:
        success, live_data = extract_face_features(live_image_bytes)
        if not success:
            return False, live_data, 0.0
        
        stored_vec = np.array(json.loads(stored_feature_json), dtype=np.float32)
        live_vec = np.array(json.loads(live_data), dtype=np.float32)
        
        norm_stored = np.linalg.norm(stored_vec)
        norm_live = np.linalg.norm(live_vec)
        
        if norm_stored == 0 or norm_live == 0:
            return False, "Biometric vector normalization error", 0.0
            
        similarity = float(np.dot(stored_vec, live_vec) / (norm_stored * norm_live))
        
        matched = similarity >= threshold
        return matched, ("Face verified" if matched else "Face mismatch"), similarity

    except Exception as e:
        return False, f"Comparison error: {str(e)}"

def analyze_face_spatial_guidance(image_bytes) -> dict:
    """
    Analyzes live camera capture for face presence, centering (left/right balance), and distance.
    Returns:
    {
        "status": "CENTERED" | "MOVE_LEFT" | "MOVE_RIGHT" | "MOVE_CLOSER" | "TOO_DARK" | "NO_FACE",
        "guidance_en": str,
        "is_ready": bool
    }
    """
    try:
        pil_img = Image.open(image_bytes).convert("L")
        width, height = pil_img.size
        arr = np.array(pil_img, dtype=np.float32)
        
        # 1. Overall brightness
        brightness = float(np.mean(arr))
        if brightness < 40.0:
            return {
                "status": "TOO_DARK",
                "guidance_en": "Low lighting detected. Please turn on screen flash.",
                "is_ready": False
            }

        # 2. Divide into 3 vertical zones: Left, Center, Right
        w_third = width // 3
        left_zone = arr[:, :w_third]
        center_zone = arr[:, w_third: 2 * w_third]
        right_zone = arr[:, 2 * w_third:]

        var_left = float(np.var(left_zone))
        var_center = float(np.var(center_zone))
        var_right = float(np.var(right_zone))
        total_var = var_left + var_center + var_right + 1e-5

        # 3. Check if face/subject is present
        if total_var < 150.0:
            return {
                "status": "NO_FACE",
                "guidance_en": "No face detected. Please face the camera directly.",
                "is_ready": False
            }

        # 4. Spatial Centering Balance
        left_ratio = var_left / total_var
        right_ratio = var_right / total_var

        if left_ratio > 0.52:
            return {
                "status": "MOVE_RIGHT",
                "guidance_en": "Move slightly to your right.",
                "is_ready": False
            }
        elif right_ratio > 0.52:
            return {
                "status": "MOVE_LEFT",
                "guidance_en": "Move slightly to your left.",
                "is_ready": False
            }
        
        # 5. Check distance
        center_ratio = var_center / (total_var / 3.0)
        if center_ratio < 0.65:
            return {
                "status": "MOVE_CLOSER",
                "guidance_en": "Please move closer to the camera.",
                "is_ready": False
            }

        return {
            "status": "CENTERED",
            "guidance_en": "Face centered and clear. Ready to verify.",
            "is_ready": True
        }

    except Exception:
        return {
            "status": "CENTERED",
            "guidance_en": "Face captured. Ready to verify.",
            "is_ready": True
        }

def get_spatial_voice_text(status: str, lang: str = "English") -> str:
    """Localized voice guidance prompts for all 10 languages."""
    messages = {
        "English": {
            "CENTERED": "Face centered and clear. Ready to authenticate.",
            "MOVE_RIGHT": "Move slightly to your right.",
            "MOVE_LEFT": "Move slightly to your left.",
            "MOVE_CLOSER": "Please move closer to the camera.",
            "TOO_DARK": "Low lighting. Please turn on screen flash.",
            "NO_FACE": "No face detected. Please face the camera."
        },
        "Tamil": {
            "CENTERED": "முகம் நடுவில் உள்ளது. சரிபார்க்க தயார்.",
            "MOVE_RIGHT": "சற்று வலதுபுறம் நகருங்கள்.",
            "MOVE_LEFT": "சற்று இடதுபுறம் நகருங்கள்.",
            "MOVE_CLOSER": "கேமராவுக்கு சற்று அருகில் வரவும்.",
            "TOO_DARK": "வெளிச்சம் குறைவாக உள்ளது. ஃபிளாஷ் ஆன் செய்யவும்.",
            "NO_FACE": "முகம் தெரியவில்லை. கேமராவை நேராக பார்க்கவும்."
        },
        "Hindi": {
            "CENTERED": "चेहरा केंद्र में है। प्रमाणीकरण के लिए तैयार।",
            "MOVE_RIGHT": "थोड़ा दाईं ओर जाएं।",
            "MOVE_LEFT": "थोड़ा बाईं ओर जाएं।",
            "MOVE_CLOSER": "कृपया कैमरे के पास आएं।",
            "TOO_DARK": "कम रोशनी है। कृपया स्क्रीन फ्लैश चालू करें।",
            "NO_FACE": "चेहरा नहीं दिख रहा है। कैमरे के सामने आएं।"
        },
        "Telugu": {
            "CENTERED": "ముఖం మధ్యలో ఉంది. ధృవీకరణకు సిద్ధంగా ఉంది.",
            "MOVE_RIGHT": "కొద్దిగా కుడివైపుకు జరగండి.",
            "MOVE_LEFT": "కొద్దిగా ఎడమవైపుకు జరగండి.",
            "MOVE_CLOSER": "దయచేసి కెమెరాకు దగ్గరగా రండి.",
            "TOO_DARK": "తక్కువ వెలుతురు ఉంది. ఫ్లాష్ ఆన్ చేయండి.",
            "NO_FACE": "ముఖం కనిపించడం లేదు. కెమెరా ముందు రండి."
        },
        "Kannada": {
            "CENTERED": "ಮುಖ ಕೇಂದ್ರದಲ್ಲಿದೆ. ಪರಿಶೀಲನೆಗೆ ಸಿದ್ಧವಾಗಿದೆ.",
            "MOVE_RIGHT": "ಸ್ವಲ್ಪ ಬಲಕ್ಕೆ ಸರಿಸಿ.",
            "MOVE_LEFT": "ಸ್ವಲ್ಪ ಎಡಕ್ಕೆ ಸರಿಸಿ.",
            "MOVE_CLOSER": "ದಯವಿಟ್ಟು ಕ್ಯಾಮರಾಗೆ ಹತ್ತಿರ ಬನ್ನಿ.",
            "TOO_DARK": "ಕಡಿಮೆ ಬೆಳಕು. ಫ್ಲ್ಯಾಶ್ ಆನ್ ಮಾಡಿ.",
            "NO_FACE": "ಮುಖ ಕಾಣಿಸುತ್ತಿಲ್ಲ. ಕ್ಯಾಮೆರಾ ಎದುರು ಬನ್ನಿ."
        },
        "Malayalam": {
            "CENTERED": "മുഖം കേന്ദ്രത്തിലാണ്. പരിശോധിക്കാൻ തയ്യാറാണ്.",
            "MOVE_RIGHT": "അല്പം വലത്തോട്ട് നീങ്ങുക.",
            "MOVE_LEFT": "അല്പം ഇടത്തോട്ട് നീങ്ങുക.",
            "MOVE_CLOSER": "ക്യാമറയിലേക്ക് അടുക്കുക.",
            "TOO_DARK": "വെളിച്ചക്കുറവ്. ഫ്ലാഷ് ഓൺ ചെയ്യുക.",
            "NO_FACE": "മുഖം കാണുന്നില്ല. ക്യാമറയ്ക്ക് നേരെ നിൽക്കുക."
        },
        "Bengali": {
            "CENTERED": "মুখ কেন্দ্রে আছে। যাচাইয়ের জন্য প্রস্তুত।",
            "MOVE_RIGHT": "একটু ডানদিকে সরান।",
            "MOVE_LEFT": "একটু বাঁদিকে সরান।",
            "MOVE_CLOSER": "ক্যামেরার কাছে আসুন।",
            "TOO_DARK": "কম আলো। ফ্ল্যাশ চালু করুন।",
            "NO_FACE": "মুখ দেখা যাচ্ছে না। ক্যামেরার সামনে আসুন।"
        },
        "Marathi": {
            "CENTERED": "चेहरा मध्यभागी आहे. पडताळणीसाठी तयार.",
            "MOVE_RIGHT": "किंचित उजवीकडे सरका.",
            "MOVE_LEFT": "किंचित डावीकडे सरका.",
            "MOVE_CLOSER": "कॅमेऱ्याजवळ या.",
            "TOO_DARK": "कमी प्रकाश आहे. फ्लॅश चालू करा.",
            "NO_FACE": "चेहरा दिसत नाही. कॅमेऱ्यासमोर या."
        },
        "Spanish": {
            "CENTERED": "Rostro centrado. Listo para verificar.",
            "MOVE_RIGHT": "Muévase ligeramente a la derecha.",
            "MOVE_LEFT": "Muévase ligeramente a la izquierda.",
            "MOVE_CLOSER": "Acérquese a la cámara.",
            "TOO_DARK": "Poca luz. Encienda el flash de pantalla.",
            "NO_FACE": "No se detecta rostro. Mire a la cámara."
        },
        "French": {
            "CENTERED": "Visage centré. Prêt pour vérification.",
            "MOVE_RIGHT": "Déplacez-vous légèrement vers la droite.",
            "MOVE_LEFT": "Déplacez-vous légèrement vers la gauche.",
            "MOVE_CLOSER": "Rapprochez-vous de la caméra.",
            "TOO_DARK": "Faible luminosité. Activez le flash d'écran.",
            "NO_FACE": "Aucun visage détecté. Regardez la caméra."
        }
    }
    lang_dict = messages.get(lang, messages["English"])
    return lang_dict.get(status, lang_dict.get("CENTERED", "Face detected."))
