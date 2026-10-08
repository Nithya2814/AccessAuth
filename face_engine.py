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
