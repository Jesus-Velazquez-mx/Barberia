import io
import os
import base64
import requests
import torch
import torchvision.transforms as T
from PIL import Image
import torch.nn.functional as F

# 1. Configurar dispositivo (NVIDIA RTX 4050 con CUDA o CPU de respaldo)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# 2. Clases que reconoce el modelo entrenado
class_names = ['Heart', 'Oblong', 'Oval', 'Round', 'Square']

# 3. Configuración de rutas y URL del repositorio de Hugging Face
model_path = "model_85_nn_.pth"
model_url = "https://huggingface.co/fahd9999/model_85_nn_/resolve/main/model_85_nn_.pth?download=true"

def download_model_if_not_exists(url, path):
    """Verifica si el modelo ya existe localmente; si no, lo descarga desde Hugging Face."""
    if not os.path.exists(path):
        print("Modelo no encontrado localmente. Descargando desde Hugging Face...")
        response = requests.get(url)
        if response.status_code == 200:
            with open(path, 'wb') as f:
                f.write(response.content)
            print(f"¡Modelo descargado y guardado exitosamente en {path}!")
        else:
            raise Exception("Fallo al descargar el modelo desde Hugging Face. Verifica tu conexión.")
    else:
        print("El archivo del modelo ya existe localmente. Usando versión local.")

# Ejecutar la verificación/descarga antes de cargar el modelo en memoria
download_model_if_not_exists(model_url, model_path)

def load_model(path):
    """Carga el modelo en la GPU/CPU con weights_only=False para evitar bloqueos en PyTorch 2.6+."""
    model = torch.load(path, map_location=device, weights_only=False)
    model.eval()
    model.to(device)
    return model

# Cargar el modelo una sola vez al iniciar el servicio
model = load_model(model_path)

# Variable global temporal para almacenar la última forma de cara detectada y usarla en prompts
_latest_detected_structure = None

def get_latest_structure() -> str:
    """Permite recuperar la última forma de cara almacenada para usarla en prompts."""
    global _latest_detected_structure
    return _latest_detected_structure

def preprocess_image_from_bytes(image_bytes: bytes):
    """Preprocesa la imagen de manera segura transformándola a tensor y enviándola a la RTX 4050."""
    transform = T.Compose([
        T.Resize((224, 224)),  
        T.ToTensor(),          
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]) 
    ])
    image = Image.open(io.BytesIO(image_bytes))
    if image.mode != "RGB":
        image = image.convert("RGB")
        
    return transform(image).unsqueeze(0).to(device)

def classify_face_shape(base64_img: str) -> str:
    """Ejecuta la inferencia, almacena el resultado en una variable y devuelve la estructura facial."""
    global _latest_detected_structure
    
    if "," in base64_img:
        base64_img = base64_img.split(",")[1]
        
    img_data = base64.b64decode(base64_img)
    image_tensor = preprocess_image_from_bytes(img_data)
    
    with torch.inference_mode():
        outputs = model(image_tensor)
        _, predicted_class = torch.max(outputs, 1)
        
    predicted_label = class_names[predicted_class.item()].lower().strip()
    
    # Mapeo estricto al ENUM de la base de datos
    label_map = {
        "heart": "heart",
        "oblong": "rectangle", 
        "oval": "oval",
        "round": "round",
        "square": "square"
    }
    
    mapped_structure = label_map.get(predicted_label, "oval")
    
    # Almacenamos el resultado en la variable global para usarlo posteriormente en prompts
    _latest_detected_structure = mapped_structure
    
    return mapped_structure