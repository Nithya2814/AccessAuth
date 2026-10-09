# face_engine.py - Pure PIL, NumPy & OpenCV Robust Biometric Engine with Circle Face Validation
import json
import numpy as np
from PIL import Image, ImageOps

# Initialize OpenCV Haar Cascade Face Detector if available (with local XML models)
import os
base_dir = os.path.dirname(os.path.abspath(__file__))
haar_face_xml = os.path.join(base_dir, "haarcascade_frontalface_default.xml")
haar_eye_xml = os.path.join(base_dir, "haarcascade_eye.xml")

cv2_cascade = None
eye_cascade = None
try:
    import cv2
    if hasattr(cv2, "CascadeClassifier"):
        if os.path.exists(haar_face_xml):
            cv2_cascade = cv2.CascadeClassifier(haar_face_xml)
        elif hasattr(cv2, "data") and hasattr(cv2.data, "haarcascades"):
            cv2_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
            
        if os.path.exists(haar_eye_xml):
            eye_cascade = cv2.CascadeClassifier(haar_eye_xml)
        elif hasattr(cv2, "data") and hasattr(cv2.data, "haarcascades"):
            eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")
except Exception:
    cv2_cascade = None
    eye_cascade = None

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
    Analyzes live camera capture using OpenCV colorimetry, contours, and geometry.
    Verifies human face presence inside the viewfinder circle and rejects non-face/empty photos.
    """
    try:
        pil_rgb = Image.open(image_bytes).convert("RGB")
        width, height = pil_rgb.size
        
        # 1. Overall brightness check
        pil_l = ImageOps.grayscale(pil_rgb)
        arr_gray = np.array(pil_l, dtype=np.float32)
        brightness = float(np.mean(arr_gray))
        if brightness < 38.0:
            return {
                "status": "TOO_DARK",
                "guidance_en": "Low lighting detected. Please turn on screen flash.",
                "is_ready": False
            }

        # 2. OpenCV Multi-Layer Biometric Verification (Haar Cascade + YCrCb Chrominance)
        try:
            import cv2
            np_frame = np.array(pil_rgb)

            # Check Haar Cascade first if classifier model is available
            if cv2_cascade is not None:
                try:
                    gray_frame = cv2.cvtColor(np_frame, cv2.COLOR_RGB2GRAY)
                    haar_faces = cv2_cascade.detectMultiScale(
                        gray_frame, 
                        scaleFactor=1.15, 
                        minNeighbors=4, 
                        minSize=(int(min(width, height) * 0.2), int(min(width, height) * 0.2))
                    )
                    if len(haar_faces) > 0:
                        hx, hy, hw, hh = max(haar_faces, key=lambda b: b[2] * b[3])
                        hcx = hx + hw / 2
                        hcy = hy + hh / 2
                        if hcx < width * 0.36:
                            return {"status": "MOVE_RIGHT", "guidance_en": "Move slightly to your right inside the circle.", "is_ready": False}
                        elif hcx > width * 0.64:
                            return {"status": "MOVE_LEFT", "guidance_en": "Move slightly to your left inside the circle.", "is_ready": False}
                        if hcy < height * 0.30:
                            return {"status": "MOVE_DOWN", "guidance_en": "Move slightly down inside the circle.", "is_ready": False}
                        elif hcy > height * 0.70:
                            return {"status": "MOVE_UP", "guidance_en": "Move slightly up inside the circle.", "is_ready": False}
                        if hw < width * 0.20 or hh < height * 0.20:
                            return {"status": "MOVE_CLOSER", "guidance_en": "Please move closer to the camera inside the circle.", "is_ready": False}
                        if eye_cascade is not None:
                            roi_gray = gray_frame[hy:hy + int(hh * 0.6), hx:hx + hw]
                            eyes = eye_cascade.detectMultiScale(roi_gray, scaleFactor=1.1, minNeighbors=3)
                            if len(eyes) == 1:
                                return {"status": "LOOK_STRAIGHT", "guidance_en": "Please look straight into the camera inside the circle.", "is_ready": False}
                        return {"status": "CENTERED", "guidance_en": "Face and eyes centered inside circle. You are inside the frame. You can now take photo, press Enter or Space.", "is_ready": True}
                except Exception:
                    pass

            # Universal human skin detection in YCrCb chrominance space
            ycrcb = cv2.cvtColor(np_frame, cv2.COLOR_RGB2YCrCb)
            lower_skin = np.array([0, 133, 77], dtype=np.uint8)
            upper_skin = np.array([255, 175, 128], dtype=np.uint8)
            skin_mask = cv2.inRange(ycrcb, lower_skin, upper_skin)
            
            # Morphological smoothing to remove noise
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
            skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
            skin_mask = cv2.morphologyEx(skin_mask, cv2.MORPH_OPEN, kernel, iterations=1)
            
            # Target circle definition: center of the image, radius 38% of min dimension
            center_x = width // 2
            center_y = height // 2
            radius = int(min(width, height) * 0.38)
            
            circle_mask = np.zeros((height, width), dtype=np.uint8)
            cv2.circle(circle_mask, (center_x, center_y), radius, 255, -1)
            
            # Skin pixels inside target circle
            skin_in_circle = cv2.bitwise_and(skin_mask, skin_mask, mask=circle_mask)
            skin_pixels_in_circle = int(np.sum(skin_in_circle > 0))
            circle_area = int(np.pi * (radius ** 2))
            skin_circle_ratio = skin_pixels_in_circle / max(1, circle_area)
            
            # Find skin contours
            contours, _ = cv2.findContours(skin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            valid_face_contour = None
            max_area = 0
            min_face_area = int(width * height * 0.04)
            
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area > min_face_area and area > max_area:
                    max_area = area
                    valid_face_contour = cnt
            
            # If no skin contour found or skin ratio in circle < 10%, reject as NO_FACE
            if valid_face_contour is None or skin_circle_ratio < 0.10:
                # Secondary check using luminance variance
                w_third = width // 3
                center_zone = arr_gray[:, w_third: 2 * w_third]
                if float(np.var(center_zone)) < 160.0 or skin_circle_ratio < 0.05:
                    return {
                        "status": "NO_FACE",
                        "guidance_en": "No face detected inside the circle. Please face the camera directly.",
                        "is_ready": False
                    }

            # If contour exists, check its spatial centering
            if valid_face_contour is not None:
                M = cv2.moments(valid_face_contour)
                if M["m00"] > 0:
                    cx = M["m10"] / M["m00"]
                    cy = M["m01"] / M["m00"]
                else:
                    x, y, w, h = cv2.boundingRect(valid_face_contour)
                    cx = x + w / 2
                    cy = y + h / 2
                x, y, w, h = cv2.boundingRect(valid_face_contour)
                
                # 1. Horizontal (X) centering check
                if cx < width * 0.36:
                    return {
                        "status": "MOVE_RIGHT",
                        "guidance_en": "Move slightly to your right inside the circle.",
                        "is_ready": False
                    }
                elif cx > width * 0.64:
                    return {
                        "status": "MOVE_LEFT",
                        "guidance_en": "Move slightly to your left inside the circle.",
                        "is_ready": False
                    }
                
                # 2. Vertical (Y) centering check
                if cy < height * 0.30:
                    return {
                        "status": "MOVE_DOWN",
                        "guidance_en": "Move slightly down inside the circle.",
                        "is_ready": False
                    }
                elif cy > height * 0.70:
                    return {
                        "status": "MOVE_UP",
                        "guidance_en": "Move slightly up inside the circle.",
                        "is_ready": False
                    }

                # 3. Scale check
                if w < width * 0.20 or h < height * 0.20:
                    return {
                        "status": "MOVE_CLOSER",
                        "guidance_en": "Please move closer to the camera inside the circle.",
                        "is_ready": False
                    }

                # 4. Iris & Gaze Centering Analysis
                try:
                    eye_y1 = max(0, y + int(h * 0.16))
                    eye_y2 = min(height, y + int(h * 0.52))
                    eye_x1 = max(0, x)
                    eye_x2 = min(width, x + w)
                    if eye_y2 > eye_y1 and eye_x2 > eye_x1:
                        eye_crop = cv2.cvtColor(np_frame[eye_y1:eye_y2, eye_x1:eye_x2], cv2.COLOR_RGB2GRAY)
                        min_v, _, _, _ = cv2.minMaxLoc(eye_crop)
                        thresh_v = min(80, max(25, int(min_v + 28)))
                        _, dark_mask = cv2.threshold(eye_crop, thresh_v, 255, cv2.THRESH_BINARY_INV)
                        
                        half_w = eye_crop.shape[1] // 2
                        left_eye_half = dark_mask[:, :half_w]
                        right_eye_half = dark_mask[:, half_w:]
                        
                        cnts_l, _ = cv2.findContours(left_eye_half, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                        cnts_r, _ = cv2.findContours(right_eye_half, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                        
                        has_l = any(cv2.contourArea(c) > 12 for c in cnts_l)
                        has_r = any(cv2.contourArea(c) > 12 for c in cnts_r)
                        
                        if has_l and not has_r:
                            return {
                                "status": "LOOK_STRAIGHT",
                                "guidance_en": "Please look straight into the camera inside the circle.",
                                "is_ready": False
                            }
                        elif has_r and not has_l:
                            return {
                                "status": "LOOK_STRAIGHT",
                                "guidance_en": "Please look straight into the camera inside the circle.",
                                "is_ready": False
                            }
                except Exception:
                    pass

            return {
                "status": "CENTERED",
                "guidance_en": "Face and eyes centered inside circle. You are inside the frame. You can now take photo, press Enter or Space.",
                "is_ready": True
            }
        except Exception:
            pass

        # 3. Robust NumPy Spatial Variance Fallback
        w_third = width // 3
        left_zone = arr_gray[:, :w_third]
        center_zone = arr_gray[:, w_third: 2 * w_third]
        right_zone = arr_gray[:, 2 * w_third:]

        var_left = float(np.var(left_zone))
        var_center = float(np.var(center_zone))
        var_right = float(np.var(right_zone))
        total_var = var_left + var_center + var_right + 1e-5

        if var_center < 120.0 or total_var < 350.0:
            return {
                "status": "NO_FACE",
                "guidance_en": "No face detected inside the circle. Please face the camera directly.",
                "is_ready": False
            }

        left_ratio = var_left / total_var
        right_ratio = var_right / total_var

        if left_ratio > 0.52:
            return {
                "status": "MOVE_RIGHT",
                "guidance_en": "Move slightly to your right inside the circle.",
                "is_ready": False
            }
        elif right_ratio > 0.52:
            return {
                "status": "MOVE_LEFT",
                "guidance_en": "Move slightly to your left inside the circle.",
                "is_ready": False
            }
        
        # Vertical fallback check
        h_half = height // 2
        top_half = arr_gray[:h_half, :]
        bottom_half = arr_gray[h_half:, :]
        var_top = float(np.var(top_half))
        var_bottom = float(np.var(bottom_half))
        v_total = var_top + var_bottom + 1e-5

        if (var_top / v_total) > 0.72:
            return {
                "status": "MOVE_DOWN",
                "guidance_en": "Move slightly down inside the circle.",
                "is_ready": False
            }
        elif (var_bottom / v_total) > 0.72:
            return {
                "status": "MOVE_UP",
                "guidance_en": "Move slightly up inside the circle.",
                "is_ready": False
            }

        center_ratio = var_center / (total_var / 3.0)
        if center_ratio < 0.70:
            return {
                "status": "MOVE_CLOSER",
                "guidance_en": "Please move closer to the camera inside the circle.",
                "is_ready": False
            }

        return {
            "status": "CENTERED",
            "guidance_en": "Face centered inside circle. Ready to authenticate.",
            "is_ready": True
        }

    except Exception:
        return {
            "status": "NO_FACE",
            "guidance_en": "No face detected inside the circle. Please face the camera directly.",
            "is_ready": False
        }

def get_spatial_voice_text(status: str, lang: str = "English") -> str:
    """Localized voice guidance prompts for all 10 languages."""
    messages = {
        "English": {
            "CENTERED": "Face and eyes centered inside circle. You are inside the frame. You can now take photo, press Enter or Space.",
            "MOVE_RIGHT": "Move slightly to your right inside the circle.",
            "MOVE_LEFT": "Move slightly to your left inside the circle.",
            "MOVE_UP": "Move slightly up inside the circle.",
            "MOVE_DOWN": "Move slightly down inside the circle.",
            "MOVE_CLOSER": "Please move closer to the camera inside the circle.",
            "LOOK_STRAIGHT": "Please look straight into the camera inside the circle.",
            "TOO_DARK": "Low lighting detected. High luminance screen flash activated. Please face the screen.",
            "NO_FACE": "No face detected inside the circle. Please face the camera directly."
        },
        "Tamil": {
            "CENTERED": "வட்டத்திற்குள் வந்துவிட்டீர்கள்! முகம் மற்றும் கண்கள் மையத்தில் உள்ளன. இப்போது நீங்கள் புகைப்படம் எடுக்கலாம், என்டர் அழுத்தவும்.",
            "MOVE_RIGHT": "சற்று வலதுபுறம் நகர்ந்து வட்டத்திற்குள் வரவும்.",
            "MOVE_LEFT": "சற்று இடதுபுறம் நகர்ந்து வட்டத்திற்குள் வரவும்.",
            "MOVE_UP": "வட்டத்திற்குள் சற்று மேலே வரவும்.",
            "MOVE_DOWN": "வட்டத்திற்குள் சற்று கீழே வரவும்.",
            "MOVE_CLOSER": "வட்டத்திற்குள் சற்று அருகில் வரவும்.",
            "LOOK_STRAIGHT": "தயவுசெய்து வட்டத்திற்குள் கேமராவை நேராக பார்க்கவும்.",
            "TOO_DARK": "வெளிச்சம் குறைவாக உள்ளது. ஆட்டோ ஸ்கிரீன் ஃபிளாஷ்லைட் ஆன் செய்யப்பட்டுள்ளது. திரையின் முன் வரவும்.",
            "NO_FACE": "வட்டத்திற்குள் முகம் கண்டறியப்படவில்லை. தயவுசெய்து உங்கள் முகத்தை வட்டத்திற்குள் வைக்கவும்."
        },
        "Hindi": {
            "CENTERED": "चेहरा और आँखें वृत्त के केंद्र में हैं। आप फ्रेम के अंदर हैं। अब आप फोटो ले सकते हैं, एंटर दबाएं।",
            "MOVE_RIGHT": "थोड़ा दाईं ओर जाएं।",
            "MOVE_LEFT": "थोड़ा बाईं ओर जाएं।",
            "MOVE_UP": "थोड़ा ऊपर आएं।",
            "MOVE_DOWN": "थोड़ा नीचे आएं।",
            "MOVE_CLOSER": "कृपया कैमरे के पास आएं।",
            "LOOK_STRAIGHT": "कृपया वृत्त के अंदर कैमरे की ओर सीधा देखें।",
            "TOO_DARK": "कम रोशनी है। स्क्रीन फ्लैशलाइट चालू कर दी गई है।",
            "NO_FACE": "चेहरा नहीं दिख रहा है। कैमरे के सामने आएं।"
        },
        "Telugu": {
            "CENTERED": "ముఖం మరియు కళ్ళు వృత్తం మధ్యలో ఉన్నాయి. ఇప్పుడు మీరు ఫోటో తీసుకోవచ్చు, ఎంటర్ నొక్కండి.",
            "MOVE_RIGHT": "కొద్దిగా కుడివైపుకు జరగండి.",
            "MOVE_LEFT": "కొద్దిగా ఎడమవైపుకు జరగండి.",
            "MOVE_UP": "కొద్దిగా పైకి జరగండి.",
            "MOVE_DOWN": "కొద్దిగా క్రిందికి జరగండి.",
            "MOVE_CLOSER": "దయచేసి కెమెరాకు దగ్గరగా రండి.",
            "LOOK_STRAIGHT": "దయచేసి కెమెరాను నేరుగా చూడండి.",
            "TOO_DARK": "తక్కువ వెలుతురు ఉంది. స్క్రీన్ ఫ్లాష్ ఆన్ చేయబడింది.",
            "NO_FACE": "ముఖం కనిపించడం లేదు. కెమెరా ముందు రండి."
        },
        "Kannada": {
            "CENTERED": "ಮುಖ ಮತ್ತು ಕಣ್ಣುಗಳು ವೃತ್ತದ ಮಧ್ಯದಲ್ಲಿವೆ. ಈಗ ನೀವು ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಬಹುದು, ಎಂಟರ್ ಒತ್ತಿರಿ.",
            "MOVE_RIGHT": "ಸ್ವಲ್ಪ ಬಲಕ್ಕೆ ಸರಿಸಿ.",
            "MOVE_LEFT": "ಸ್ವಲ್ಪ ಎಡಕ್ಕೆ ಸರಿಸಿ.",
            "MOVE_UP": "ಸ್ವಲ್ಪ ಮೇಲೆ ಸರಿಸಿ.",
            "MOVE_DOWN": "ಸ್ವಲ್ಪ ಕೆಳಗೆ ಸರಿಸಿ.",
            "MOVE_CLOSER": "ದಯವಿಟ್ಟು ಕ್ಯಾಮರಾಗೆ ಹತ್ತಿರ ಬನ್ನಿ.",
            "LOOK_STRAIGHT": "ದಯವಿಟ್ಟು ಕ್ಯಾಮೆರಾವನ್ನು ನೇರವಾಗಿ ನೋಡಿ.",
            "TOO_DARK": "ಕಡಿಮೆ ಬೆಳಕು. ಸ್ಕ್ರೀನ್ ಫ್ಲ್ಯಾಶ್ ಆನ್ ಮಾಡಲಾಗಿದೆ.",
            "NO_FACE": "ಮುಖ ಕಾಣಿಸುತ್ತಿಲ್ಲ. ಕ್ಯಾಮೆರಾ ಎದುರು ಬನ್ನಿ."
        },
        "Malayalam": {
            "CENTERED": "മുഖവും കണ്ണുകളും വൃത്തത്തിന്റെ മധ്യത്തിലാണ്. ഇപ്പോൾ ഫോട്ടോ എടുക്കാം, എന്റർ അമർത്തുക.",
            "MOVE_RIGHT": "അല്പം വലത്തോട്ട് നീങ്ങുക.",
            "MOVE_LEFT": "അല്പം ഇടത്തോട്ട് നീങ്ങുക.",
            "MOVE_UP": "അല്പം മുകളിലേക്ക് നീങ്ങുക.",
            "MOVE_DOWN": "അല്പം താഴേക്ക് നീങ്ങുക.",
            "MOVE_CLOSER": "ക്യാമറയിലേക്ക് അടുക്കുക.",
            "LOOK_STRAIGHT": "ക്യാമറയിലേക്ക് നേരിട്ട് നോക്കുക.",
            "TOO_DARK": "വെളിച്ചക്കുറവ്. സ്ക്രീൻ ഫ്ലാഷ് ഓൺ ചെയ്തു.",
            "NO_FACE": "മുഖം കാണുന്നില്ല. ക്യാമറയ്ക്ക് നേരെ നിൽക്കുക."
        },
        "Bengali": {
            "CENTERED": "মুখ এবং চোখ বৃত্তের কেন্দ্রে রয়েছে। এখন আপনি ছবি তুলতে পারেন, এন্টার চাপুন।",
            "MOVE_RIGHT": "একটু ডানদিকে সরান।",
            "MOVE_LEFT": "একটু বাঁদিকে সরান।",
            "MOVE_UP": "একটু ওপরে সরান।",
            "MOVE_DOWN": "একটু নিচে সরান।",
            "MOVE_CLOSER": "ক্যামেরার কাছে আসুন।",
            "LOOK_STRAIGHT": "ক্যামেরার দিকে সোজা তাকান।",
            "TOO_DARK": "কম আলো। স্ক্রিন ফ্ল্যাশ চালু করা হয়েছে।",
            "NO_FACE": "মুখ দেখা যাচ্ছে না। ক্যামেরার সামনে আসুন।"
        },
        "Marathi": {
            "CENTERED": "चेहरा आणि डोळे वर्तुळाच्या मध्यभागी आहेत. आता तुम्ही फोटो काढू शकता, एंटर दाबा.",
            "MOVE_RIGHT": "किंचित उजवीकडे सरका.",
            "MOVE_LEFT": "किंचित डावीकडे सरका.",
            "MOVE_UP": "किंचित वर सरका.",
            "MOVE_DOWN": "किंचित खाली सरका.",
            "MOVE_CLOSER": "कॅमेऱ्याजवळ या.",
            "LOOK_STRAIGHT": "कॅमेऱ्याकडे सरळ पहा.",
            "TOO_DARK": "कमी प्रकाश आहे. स्क्रीन फ्लॅश चालू केला आहे.",
            "NO_FACE": "चेहरा दिसत नाही. कॅमेऱ्यासमोर या."
        },
        "Spanish": {
            "CENTERED": "Rostro y ojos centrados. Está dentro del marco. Ahora puede tomar la foto, presione Enter.",
            "MOVE_RIGHT": "Muévase ligeramente a la derecha.",
            "MOVE_LEFT": "Muévase ligeramente a la izquierda.",
            "MOVE_UP": "Muévase ligeramente hacia arriba.",
            "MOVE_DOWN": "Muévase ligeramente hacia abajo.",
            "MOVE_CLOSER": "Acérquese a la cámara.",
            "LOOK_STRAIGHT": "Mire directamente a la cámara dentro del círculo.",
            "TOO_DARK": "Poca luz. Flash de pantalla activado.",
            "NO_FACE": "No se detecta rostro. Mire a la cámara."
        },
        "French": {
            "CENTERED": "Visage et yeux centrés. Vous êtes dans le cadre. Vous pouvez maintenant prendre la photo, appuyez sur Entrée.",
            "MOVE_RIGHT": "Déplacez-vous légèrement vers la droite.",
            "MOVE_LEFT": "Déplacez-vous légèrement vers la gauche.",
            "MOVE_UP": "Déplacez-vous légèrement vers le haut.",
            "MOVE_DOWN": "Déplacez-vous légèrement vers le bas.",
            "MOVE_CLOSER": "Rapprochez-vous de la caméra.",
            "LOOK_STRAIGHT": "Regardez directement la caméra dans le cercle.",
            "TOO_DARK": "Faible luminosité. Flash d'écran activé.",
            "NO_FACE": "Aucun visage détecté. Regardez la caméra."
        }
    }
    lang_dict = messages.get(lang, messages["English"])
    return lang_dict.get(status, lang_dict.get("CENTERED", "Face detected."))
