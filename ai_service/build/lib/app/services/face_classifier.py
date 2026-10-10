import io
import base64
from PIL import Image
from transformers import pipeline

# 1. Cargamos el pipeline de Hugging Face globalmente (se descarga la primera vez que se ejecuta)
classifier_pipeline = pipeline("image-classification", model="fahd9999/face_shape_classification")

def classify_face_shape(base64_img: str) -> str:
    """Decodifica la imagen, la pasa por el modelo y la mapea al ENUM."""
    
    # Limpiar el prefijo de Base64 si el frontend lo envió (ej. "data:image/jpeg;base64,...")
    if "," in base64_img:
        base64_img = base64_img.split(",")[1]
        
    # Decodificar imagen
    img_data = base64.b64decode(base64_img)
    img = Image.open(io.BytesIO(img_data)).convert("RGB")
    
    # Inferencia con el modelo de Hugging Face
    results = classifier_pipeline(img)
    
    # El modelo devuelve una lista ordenada por probabilidad, tomamos el primero
    top_label = results[0]['label'].lower().strip()
    
    # Mapeo estricto a los ENUM de Postgres (facial_structure_type)
    # Por si el modelo de HF usa sinónimos (ej. oblong -> rectangle)
    label_map = {
        "oval": "oval",
        "round": "round",
        "square": "square",
        "heart": "heart",
        "oblong": "rectangle", 
        "rectangle": "rectangle",
        "triangle": "triangle",
        "diamond": "diamond"
    }
    
    # Retornamos el valor mapeado, o "oval" como fallback por defecto
    return label_map.get(top_label, "oval")