import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
from PIL import Image
import sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
page = int(sys.argv[1])
img = Image.open(rf'C:\Users\DELL\Downloads\vocab_pages\page_{page:02d}.png')
text = pytesseract.image_to_string(img, lang='chi_sim+eng')
print(text)
