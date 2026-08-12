import re
import glob

def process_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        def replace_func(match):
            class_str = match.group(0)
            if 'uppercase' not in class_str:
                return class_str.replace('font-sync', 'font-lexend')
            return class_str
        
        new_content = re.sub(r'className="[^"]*font-sync[^"]*"', replace_func, content)
        new_content = re.sub(r'className=\{`[^`]*font-sync[^`]*`\}', replace_func, new_content)

        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f"Updated {filepath}")
    except Exception as e:
        pass

for file in glob.glob('src/**/*.tsx', recursive=True):
    process_file(file)
