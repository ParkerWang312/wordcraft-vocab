import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
from PIL import Image
import sys, io, json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

results = {}
for page in range(1, 16):
    img = Image.open(rf'C:\Users\DELL\Downloads\vocab_pages\page_{page:02d}.png')
    text = pytesseract.image_to_string(img, lang='chi_sim+eng', config='--psm 6')
    results[f'page_{page:02d}'] = text
    print(f'=== Page {page} done ({len(text)} chars) ===', flush=True)

with open(r'D:\WorkBuddy\vocab-learning-app\ocr_results.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print('All pages saved to ocr_results.json')
