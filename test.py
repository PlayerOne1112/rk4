import os
import json

# Абсолютный путь к папке images рядом с этим скриптом
script_dir = os.path.dirname(os.path.abspath(__file__))
images_folder = os.path.join(script_dir, "images")

# Получаем все .png файлы
image_files = [f for f in os.listdir(images_folder) if f.lower().endswith(".png")]

# Извлекаем ID (имя файла без расширения), игнорируем нечисловые
image_ids = []
for f in image_files:
    try:
        image_ids.append(int(os.path.splitext(f)[0]))
    except ValueError:
        pass

image_ids.sort()

# Вывод в формате JS
js_array = f"const questionsWithImages = {image_ids};"
print(js_array)

# Сохраняем в файл
with open(os.path.join(script_dir, "images_array.js"), "w") as f:
    f.write(js_array)

print("Готово! Массив сохранен в images_array.js")
